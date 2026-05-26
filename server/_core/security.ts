import bcrypt from "bcrypt";
import crypto from "crypto";

const SALT_ROUNDS = 12;
const SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Password hashing and verification for email/password authentication
 */
export const passwordSecurity = {
  /**
   * Hash a password using bcrypt
   */
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  },

  /**
   * Verify a password against a hash
   */
  async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },

  /**
   * Validate password strength
   */
  validateStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push("Password must be at least 8 characters");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain lowercase letter");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain number");
    }
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push("Password must contain special character (!@#$%^&*)");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};

/**
 * Session token generation and validation
 */
export const sessionSecurity = {
  /**
   * Generate a secure session token
   */
  generateToken(): string {
    return crypto.randomBytes(32).toString("hex");
  },

  /**
   * Get session expiration timestamp
   */
  getExpirationTime(): Date {
    return new Date(Date.now() + SESSION_DURATION_MS);
  },

  /**
   * Check if session has expired
   */
  isExpired(expiresAt: Date | null | undefined): boolean {
    if (!expiresAt) return true;
    return new Date() > expiresAt;
  },
};

/**
 * Rate limiting helpers
 */
export const rateLimiting = {
  /**
   * Check if user is locked out due to failed login attempts
   */
  isLockedOut(
    failedAttempts: number,
    lastFailedLogin: Date | null | undefined
  ): boolean {
    if (failedAttempts < MAX_LOGIN_ATTEMPTS) {
      return false;
    }

    if (!lastFailedLogin) {
      return true;
    }

    const timeSinceLastFailure = Date.now() - lastFailedLogin.getTime();
    return timeSinceLastFailure < LOCKOUT_DURATION_MS;
  },

  /**
   * Get lockout remaining time in seconds
   */
  getLockoutTimeRemaining(lastFailedLogin: Date | null | undefined): number {
    if (!lastFailedLogin) return 0;

    const timeSinceLastFailure = Date.now() - lastFailedLogin.getTime();
    const remaining = LOCKOUT_DURATION_MS - timeSinceLastFailure;

    return Math.max(0, Math.ceil(remaining / 1000));
  },
};

/**
 * CSRF token generation and validation
 */
export const csrfSecurity = {
  /**
   * Generate a CSRF token
   */
  generateToken(): string {
    return crypto.randomBytes(32).toString("hex");
  },

  /**
   * Validate CSRF token
   */
  validateToken(token: string, sessionToken: string): boolean {
    if (!token || !sessionToken) return false;

    // Simple validation: token should be hex string of reasonable length
    return /^[a-f0-9]{64}$/.test(token);
  },
};

/**
 * Input sanitization for XSS prevention
 */
export const xssSecurity = {
  /**
   * Sanitize user input to prevent XSS
   */
  sanitize(input: string): string {
    if (typeof input !== "string") return "";

    return input
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  },

  /**
   * Validate email format
   */
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 320;
  },
};

/**
 * Payment verification helpers
 */
export const paymentSecurity = {
  /**
   * Verify payment amount matches expected amount
   */
  verifyAmount(actualAmount: number, expectedAmount: number): boolean {
    // Amounts should match exactly (in cents)
    return actualAmount === expectedAmount;
  },

  /**
   * Verify payment wasn't already processed
   */
  isDuplicate(paymentId: string, existingPaymentIds: Set<string>): boolean {
    return existingPaymentIds.has(paymentId);
  },

  /**
   * Check for velocity abuse (too many payments in short time)
   */
  isVelocityAbuse(
    paymentTimestamps: Date[],
    maxPaymentsPerHour: number = 10
  ): boolean {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentPayments = paymentTimestamps.filter((ts) => ts > oneHourAgo);
    return recentPayments.length > maxPaymentsPerHour;
  },
};

/**
 * Anti-cheat helpers
 */
export const antiCheat = {
  /**
   * Validate game state changes server-side
   */
  validateBetAmount(bet: number, balance: number, maxBet: number = 1000): boolean {
    return bet > 0 && bet <= balance && bet <= maxBet;
  },

  /**
   * Validate win amount is reasonable
   */
  validateWinAmount(
    winAmount: number,
    bet: number,
    maxMultiplier: number = 10000
  ): boolean {
    if (winAmount < 0) return false;
    // Win should not exceed bet * max multiplier
    return winAmount <= bet * maxMultiplier;
  },

  /**
   * Detect suspicious balance changes
   */
  detectSuspiciousBalance(
    previousBalance: number,
    newBalance: number,
    expectedChange: number
  ): boolean {
    const actualChange = newBalance - previousBalance;
    // Flag if change doesn't match expected (with small tolerance for rounding)
    return Math.abs(actualChange - expectedChange) > 1;
  },

  /**
   * Validate game result hash (prevent tampering)
   */
  generateResultHash(
    userId: number,
    spinId: string,
    result: string
  ): string {
    const data = `${userId}:${spinId}:${result}`;
    return crypto.createHash("sha256").update(data).digest("hex");
  },

  /**
   * Verify game result hasn't been tampered with
   */
  verifyResultHash(
    userId: number,
    spinId: string,
    result: string,
    providedHash: string
  ): boolean {
    const expectedHash = this.generateResultHash(userId, spinId, result);
    return crypto.timingSafeEqual(
      Buffer.from(expectedHash),
      Buffer.from(providedHash)
    );
  },
};

/**
 * Data encryption for sensitive fields
 */
export const dataEncryption = {
  /**
   * Encrypt sensitive data (for database storage)
   */
  encrypt(data: string, encryptionKey: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      "aes-256-cbc",
      Buffer.from(encryptionKey, "hex"),
      iv
    );

    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Return IV + encrypted data
    return iv.toString("hex") + ":" + encrypted;
  },

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData: string, encryptionKey: string): string {
    const [ivHex, encrypted] = encryptedData.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      Buffer.from(encryptionKey, "hex"),
      iv
    );

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  },

  /**
   * Generate encryption key from master key and user ID
   */
  deriveUserKey(masterKey: string, userId: number): string {
    const hmac = crypto.createHmac("sha256", masterKey);
    hmac.update(userId.toString());
    return hmac.digest("hex");
  },
};

/**
 * Security headers and configuration
 */
export const securityHeaders = {
  /**
   * Get recommended security headers for Express
   */
  getHeaders() {
    return {
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
    };
  },
};
