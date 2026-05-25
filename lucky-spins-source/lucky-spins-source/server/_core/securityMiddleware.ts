import { Request, Response, NextFunction } from "express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import helmet from "helmet";
import { csrfSecurity, securityHeaders } from "./security";

/**
 * Rate limiting middleware - prevents brute force and DDoS attacks
 */
export const createRateLimiters = () => {
  // General API rate limiter: 100 requests per 15 minutes per IP
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === "/health";
    },
  });

  // Strict login limiter: 5 attempts per 15 minutes per IP
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many login attempts, please try again later.",
    skipSuccessfulRequests: true,
  });

  // Payment limiter: 10 payments per hour per user
  const paymentLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: "Too many payment attempts, please try again later.",
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise IP
      const userId = (req as any).user?.id?.toString();
      if (userId) return userId;
      const ip = typeof req.ip === 'string' ? req.ip : (req.socket?.remoteAddress ?? 'unknown');
      return ip;
    },
  });

  // Game spin limiter: 60 spins per minute per user (prevents automation)
  const spinLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: "Spinning too fast, please slow down.",
    keyGenerator: (req) => {
      const userId = (req as any).user?.id?.toString();
      if (userId) return userId;
      const ip = typeof req.ip === 'string' ? req.ip : (req.socket?.remoteAddress ?? 'unknown');
      return ip;
    },
  });

  return {
    apiLimiter,
    loginLimiter,
    paymentLimiter,
    spinLimiter,
  };
};

/**
 * Security headers middleware using Helmet
 */
export const securityHeadersMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
});

/**
 * CSRF token middleware - generates and validates CSRF tokens
 */
export const csrfMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Generate CSRF token for GET requests
  if (req.method === "GET") {
    const csrfToken = csrfSecurity.generateToken();
    res.locals.csrfToken = csrfToken;
    res.setHeader("X-CSRF-Token", csrfToken);
  }

  // Validate CSRF token for state-changing requests
  if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
    const token = req.headers["x-csrf-token"] as string;
    const sessionToken = (req as any).sessionToken;

    if (!csrfSecurity.validateToken(token, sessionToken)) {
      return res.status(403).json({ error: "CSRF token invalid" });
    }
  }

  next();
};

/**
 * Request validation middleware - sanitizes and validates inputs
 */
export const requestValidationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Validate content type for POST/PUT requests
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    const contentType = req.headers["content-type"];
    if (!contentType?.includes("application/json")) {
      return res.status(400).json({ error: "Content-Type must be application/json" });
    }
  }

  // Validate request size (max 1MB)
  const contentLength = parseInt(req.headers["content-length"] || "0");
  if (contentLength > 1024 * 1024) {
    return res.status(413).json({ error: "Request too large" });
  }

  next();
};

/**
 * Security audit logging middleware
 */
export const auditLoggingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();

  // Log sensitive operations
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    const isSensitiveOperation = [
      "/api/trpc/auth.login",
      "/api/trpc/auth.register",
      "/api/trpc/shop.createCheckout",
      "/api/trpc/game.spin",
      "/api/trpc/cashout.createRequest",
    ].some((path) => req.path.includes(path));

    if (isSensitiveOperation) {
      console.log(`[AUDIT] ${req.method} ${req.path} - User: ${(req as any).user?.id || "anonymous"} - Status: ${res.statusCode} - Duration: ${duration}ms`);
    }
  });

  next();
};

/**
 * Apply all security middleware to Express app
 */
export function applySecurityMiddleware(app: any) {
  const { apiLimiter, loginLimiter, paymentLimiter, spinLimiter } =
    createRateLimiters();

  // Apply helmet for security headers
  app.use(securityHeadersMiddleware);

  // Apply request validation
  app.use(requestValidationMiddleware);

  // Apply CSRF protection
  app.use(csrfMiddleware);

  // Apply general rate limiting
  app.use("/api/", apiLimiter);

  // Apply specific rate limiters
  app.use("/api/trpc/auth.login", loginLimiter);
  app.use("/api/trpc/auth.register", loginLimiter);
  app.use("/api/trpc/shop.createCheckout", paymentLimiter);
  app.use("/api/trpc/shop.createCustomCheckout", paymentLimiter);
  app.use("/api/trpc/game.spin", spinLimiter);

  // Apply audit logging
  app.use(auditLoggingMiddleware);
}
