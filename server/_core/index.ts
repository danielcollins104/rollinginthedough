import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { applySecurityMiddleware } from "./securityMiddleware";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  console.log("[START] Creating express app");
  const app = express();
  const server = createServer(app);

  // Trust the first proxy hop (Render/NGINX terminate TLS and set
  // X-Forwarded-For). express-rate-limit v8 throws a validation error when
  // X-Forwarded-For is present but the proxy is not trusted.
  app.set("trust proxy", 1);

  // ===== HEALTH CHECK MIDDLEWARE - MUST BE FIRST =====
  // Registered before security middleware so load-balancer probes are never
  // rate-limited or blocked. Intentionally no per-request logging here.
  app.use((req, res, next) => {
    const url = req.originalUrl || req.url;
    if (url === "/health" || url.startsWith("/health?")) {
      return res.status(200).json({ ok: true, timestamp: Date.now(), url });
    }
    next();
  });

  // ===== SECURITY MIDDLEWARE =====
  // Helmet headers, request validation, rate limiting (api/login/payment/
  // spin), audit logging. CSRF stays off until the client implements the
  // X-CSRF-Token round-trip — see SECURITY_AUDIT.md and
  // SecurityMiddlewareOptions.csrf.
  applySecurityMiddleware(app);

  // ===== REQUEST LOGGING (development only) =====
  if (process.env.NODE_ENV === "development") {
    app.use((req, res, next) => {
      console.log(`[LOG-MW] ${req.method} ${req.path}`);
      next();
    });
  }

  // ===== BODY PARSING =====
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ===== OAUTH ROUTES =====
  console.log("[SETUP] Adding OAuth routes");
  registerOAuthRoutes(app);

  // ===== TRPC ROUTER =====
  console.log("[SETUP] Adding tRPC router");
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // ===== VITE OR STATIC SERVING =====
  if (process.env.NODE_ENV === "development") {
    console.log("[SETUP] Setting up Vite middleware");
    console.log("[SETUP] Before setupVite");
    await setupVite(app, server);
    console.log("[SETUP] After setupVite - Vite setup complete");
  } else {
    console.log("[SETUP] Setting up static serving");
    serveStatic(app);
  }

  // ===== GLOBAL EXPRESS ERROR MIDDLEWARE (4-arg, must come last) =====
  // Catches any unhandled error from a route handler or async middleware
  // so the client gets a clean 500 JSON instead of an HTML stack trace,
  // and so the process never dies on a single bad request.
  app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = typeof err?.status === "number" ? err.status : 500;
    const code = err?.code || "INTERNAL_ERROR";
    console.error(`[ERR] ${req.method} ${req.path} -> ${status} ${code}:`, err?.message || err);
    if (res.headersSent) return;
    res.status(status).json({ ok: false, error: { code, message: err?.message || "Internal server error" } });
  });

  // ===== 404 FALLBACK =====
  app.use((req, res) => {
    res.status(404).json({ ok: false, error: { code: "NOT_FOUND", message: `No route for ${req.method} ${req.path}` } });
  });

  // ===== START SERVER =====
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`[SERVER] Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, "0.0.0.0", () => {
    console.log(`[SERVER] ✓ Server running on http://0.0.0.0:${port}/`);
    console.log(`[SERVER] Health check: http://0.0.0.0:${port}/health`);
  });
}

// ===== PROCESS-LEVEL CRASH HANDLERS =====
// Log + continue instead of dying. Re-throw on truly fatal signals.
process.on("uncaughtException", (err) => {
  console.error("[CRASH] uncaughtException:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[CRASH] unhandledRejection:", reason);
});

console.log("[MAIN] Starting server initialization");
startServer().catch(err => {
  console.error("[MAIN] ❌ Server startup failed:", err);
  process.exit(1);
});