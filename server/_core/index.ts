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

  // ===== HEALTH CHECK MIDDLEWARE - MUST BE FIRST =====
  console.log("[SETUP] Adding health check middleware");
  app.use((req, res, next) => {
    console.log(`[HEALTH-MW] ${req.method} ${req.url}`);
    const url = req.originalUrl || req.url;
    if (url === "/health" || url.startsWith("/health?")) {
      console.log("[HEALTH-MW] ✓ HEALTH CHECK MATCHED");
      return res.status(200).json({ ok: true, timestamp: Date.now(), url });
    }
    console.log("[HEALTH-MW] ✗ Not health check, calling next()");
    next();
  });

  // ===== REQUEST LOGGING =====
  app.use((req, res, next) => {
    console.log(`[LOG-MW] ${req.method} ${req.path}`);
    next();
  });

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

console.log("[MAIN] Starting server initialization");
startServer().catch(err => {
  console.error("[MAIN] ❌ Server startup failed:", err);
  process.exit(1);
});