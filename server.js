import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    next();
  });

  app.get("/health", (_req, res) => {
    res.status(200).json({
      ok: true,
      service: "solar-drift",
      version: "1.0.0",
    });
  });

  const isProd = process.env.NODE_ENV === "production";
  const staticOpts = isProd
    ? { maxAge: "1h" }
    : { etag: false, lastModified: false, cacheControl: false, maxAge: 0 };

  app.use("/lib", express.static(path.join(__dirname, "lib"), staticOpts));
  app.use(express.static(path.join(__dirname, "public"), staticOpts));

  app.use((req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.status(405).end();
      return;
    }
    res.sendFile(path.join(__dirname, "public", "index.html"));
  });

  return app;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMain) {
  const PORT = Number(process.env.PORT) || 3000;
  const HOST = process.env.HOST || "0.0.0.0";
  const app = createApp();
  const server = app.listen(PORT, HOST, () => {
    console.log(`Solar Drift listening on http://${HOST}:${PORT}`);
  });

  function shutdown(signal) {
    console.log(`Received ${signal}, shutting down`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 8000).unref();
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}
