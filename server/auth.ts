import { z } from "zod";
import { getDb, getUserByEmail, createUser, updateLoginAttempts, updateUserSession, clearUserSession, getUserBySessionToken } from "./db";
import { passwordSecurity, xssSecurity, rateLimiting, sessionSecurity } from "./_core/security";
import { TRPCError } from "@trpc/server";

/**
 * Email/password authentication handlers
 */

export async function registerUser(email: string, password: string, name: string) {
  // Validate email
  if (!xssSecurity.validateEmail(email)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid email format",
    });
  }

  // Validate password strength
  const passwordValidation = passwordSecurity.validateStrength(password);
  if (!passwordValidation.valid) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Password too weak: ${passwordValidation.errors.join(", ")}`,
    });
  }

  // Sanitize name
  const sanitizedName = xssSecurity.sanitize(name);

  // Check if email already exists
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Email already registered",
    });
  }

  // Hash password
  const passwordHash = await passwordSecurity.hash(password);

  // Create user
  const user = await createUser({
    email,
    passwordHash,
    name: sanitizedName,
    loginMethod: "email",
  });

  return user;
}

export async function loginUser(email: string, password: string) {
  // Validate email format
  if (!xssSecurity.validateEmail(email)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid email format",
    });
  }

  // Get user by email
  const user = await getUserByEmail(email);
  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid email or password",
    });
  }

  // Check if user is locked out
  if (rateLimiting.isLockedOut(user.failedLoginAttempts, user.lastFailedLogin)) {
    const remainingSeconds = rateLimiting.getLockoutTimeRemaining(user.lastFailedLogin);
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Account locked. Try again in ${remainingSeconds} seconds`,
    });
  }

  // Verify password
  if (!user.passwordHash) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid email or password",
    });
  }

  const passwordValid = await passwordSecurity.verify(password, user.passwordHash);
  if (!passwordValid) {
    // Increment failed login attempts
    await updateLoginAttempts(user.id, user.failedLoginAttempts + 1);

    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid email or password",
    });
  }

  // Reset failed login attempts on successful login
  await updateLoginAttempts(user.id, 0);

  // Generate session token
  const sessionToken = sessionSecurity.generateToken();
  const sessionExpiresAt = sessionSecurity.getExpirationTime();

  // Update user with session
  await updateUserSession(user.id, sessionToken, sessionExpiresAt);

  return {
    user,
    sessionToken,
    expiresAt: sessionExpiresAt,
  };
}

export async function verifySession(sessionToken: string) {
  if (!sessionToken) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "No session token",
    });
  }

  const user = await getUserBySessionToken(sessionToken);
  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid session",
    });
  }

  // Check if session expired
  if (sessionSecurity.isExpired(user.sessionExpiresAt)) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Session expired",
    });
  }

  // Refresh session expiration
  const newExpiresAt = sessionSecurity.getExpirationTime();
  await updateUserSession(user.id, sessionToken, newExpiresAt);

  return user;
}

export async function logoutUser(userId: number) {
  await clearUserSession(userId);
  return { success: true };
}
