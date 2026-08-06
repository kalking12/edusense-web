import "dotenv/config";
import express from "express";
import { createServer } from "http";
import https from "https";
import net from "net";
import fs from "fs";
import path from "path";
import os from "os";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

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
  
  // Determine if we should use HTTPS
  let server;
  const certPath = process.env.HTTPS_CERT_PATH;
  const keyPath = process.env.HTTPS_KEY_PATH;
  const useHttps = certPath && keyPath && fs.existsSync(certPath) && fs.existsSync(keyPath);
  
  if (useHttps) {
    const cert = fs.readFileSync(certPath);
    const key = fs.readFileSync(keyPath);
    server = https.createServer({ cert, key }, app);
    console.log('[HTTPS] Using secure server with mkcert certificates');
  } else {
    server = createServer(app) as any;
    if (certPath || keyPath) {
      console.log('[HTTP] HTTPS_CERT_PATH or HTTPS_KEY_PATH not found, falling back to HTTP');
    }
  }
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
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
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  
  // Display network access info
  if (process.env.NODE_ENV === 'development') {
    const interfaces = os.networkInterfaces();
    const addresses: string[] = [];
    
    for (const name of Object.keys(interfaces)) {
      for (const iface of (interfaces[name] || [])) {
        if (iface.family === 'IPv4' && !iface.internal) {
          addresses.push(iface.address);
        }
      }
    }
    
    if (addresses.length > 0) {
      const protocol = useHttps ? 'https' : 'http';
      console.log(`Network access available at:`);
      addresses.forEach(addr => {
        console.log(`  - ${protocol}://${addr}:${port}/`);
      });
    }
  }

  server.listen(port, () => {
    const protocol = useHttps ? 'https' : 'http';
    console.log(`Server running on ${protocol}://localhost:${port}/`);
  });
}

startServer().catch(console.error);
