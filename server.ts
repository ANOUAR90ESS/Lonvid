/**
 * LongForm Studio server entry point.
 * Express API + generated-media static host + Vite (dev) / dist (prod).
 */
import express from "express";
import path from "path";
import dotenv from "dotenv";
import { MEDIA_DIR, PORT } from "./server/config.ts";
import { router } from "./server/routes.ts";
import { flushNow, initStore } from "./server/store.ts";

dotenv.config();

const app = express();

app.use(express.json({ limit: "50mb" }));

initStore();

app.use("/api", router);

// Generated audio / images / video.
app.use(
  "/media",
  express.static(MEDIA_DIR, {
    maxAge: "1h",
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".svg")) res.setHeader("Content-Type", "image/svg+xml");
    },
  })
);

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`[LongForm Studio] Server running on http://0.0.0.0:${PORT}`);
  });

  // Never lose queued project writes on shutdown.
  const shutdown = (signal: string) => {
    console.log(`[LongForm Studio] ${signal} received, flushing store...`);
    flushNow();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000).unref();
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start();
