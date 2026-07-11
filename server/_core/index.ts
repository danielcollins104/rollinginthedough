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

// Simple health check endpoint for Render and load balancers
function addHealthEndpoint(app: any) {
  app.get("/health", (req: any, res: any) => {
    console.log("[HEALTH] Health endpoint hit!");
    res.status(200).json({ ok: true, timestamp: Date.now() });
  });
}

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
  const app = express();
  const server = createServer(app);

  // Add health/test endpoints as MIDDLEWARE at the VERY TOP
  // This runs BEFORE Vite middleware (which is added inside setupVite)
  app.use((req, res, next) => {
    if (req.path === "/health") {
      console.log("[HEALTH] Health endpoint hit!");
      return res.status(200).json({ ok: true, timestamp: Date.now() });
    }
    if (req.path === "/test") {
      console.log("[TEST] Test endpoint hit!");
      return res.status(200).json({ ok: true, message: "Test endpoint works" });
    }
    next();
  });

  // Add request logging middleware
  app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.path}`);
    next();
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // TEMPORARILY DISABLE SECURITY MIDDLEWARE TO TEST HEALTH ENDPOINT
  // applySecurityMiddleware(app);

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    console.log("[STARTUP] Before setupVite");
    await setupVite(app, server);
    console.log("[STARTUP] After setupVite - Vite setup complete");
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
  });
}

startServer().catch(console.error);