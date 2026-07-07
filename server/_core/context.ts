import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

// Dev-only fallback: when Supabase isn't configured, inject a synthetic guest
// user so the game UI can render without OAuth. Production deployments always
// set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY and this branch is skipped.
function isDevAuthBypassEnabled(): boolean {
  return !process.env.SUPABASE_URL;
}

function devGuestUser(): User {
  const now = new Date();
  return {
    id: 0,
    openId: "dev-guest",
    name: "Guest Player",
    email: "guest@dev.local",
    passwordHash: null,
    loginMethod: "dev",
    role: "user",
    failedLoginAttempts: 0,
    lastFailedLogin: null,
    sessionToken: "dev-session",
    sessionExpiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // Dev fallback when OAuth provider is unconfigured.
  if (!user && isDevAuthBypassEnabled()) {
    user = devGuestUser();
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
