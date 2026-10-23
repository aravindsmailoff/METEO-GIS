import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { createCorsMiddleware } from "./cors";
import { clearLegacySessionCookie } from "./cookies";
import { meteoRouter } from "../routes/meteoRoutes";

const mapImageCache = new Map<string, { body: Buffer; contentType: string; expiresAt: number }>();

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(createCorsMiddleware());
  app.use(clearLegacySessionCookie());

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Real-time Meteo-GIS & Disaster Intelligence routes
  app.use("/api", meteoRouter);

  registerStorageProxy(app);
  registerOAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  app.get("/api/maps/static", async (req, res) => {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    const zoom = Number(req.query.zoom);
    const width = Number(req.query.width);
    const height = Number(req.query.height);
    if (
      !Number.isFinite(lat) || lat < 12.4 || lat > 13.5 ||
      !Number.isFinite(lon) || lon < 79.8 || lon > 80.8 ||
      !Number.isInteger(zoom) || zoom < 9 || zoom > 17 ||
      !Number.isInteger(width) || width < 200 || width > 640 ||
      !Number.isInteger(height) || height < 200 || height > 640
    ) {
      res.status(400).json({ error: "Invalid map parameters" });
      return;
    }

    const apiUrl = process.env.MANUS_API_URL?.replace(/\/$/, "");
    const apiKey = process.env.MANUS_API_KEY;
    if (!apiUrl || !apiKey) {
      res.status(503).json({ error: "Map service is unavailable" });
      return;
    }

    const cacheKey = `${lat.toFixed(3)}:${lon.toFixed(3)}:${zoom}:${width}:${height}`;
    const cached = mapImageCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      res.setHeader("Content-Type", cached.contentType);
      res.setHeader("Cache-Control", "public, max-age=300");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.send(cached.body);
      return;
    }
    if (cached) mapImageCache.delete(cacheKey);

    const params = new URLSearchParams({
      center: `${lat.toFixed(3)},${lon.toFixed(3)}`,
      zoom: String(zoom),
      size: `${width}x${height}`,
      scale: "2",
      maptype: "roadmap",
      key: apiKey,
    });
    for (const style of [
      "feature:all|element:geometry|color:0x16232c",
      "feature:landscape|element:geometry|color:0x101b23",
      "feature:water|element:geometry|color:0x071923",
      "feature:road|element:geometry|color:0x283944",
      "feature:poi|element:labels|visibility:off",
    ]) params.append("style", style);

    try {
      const mapResponse = await fetch(`${apiUrl}/v1/maps/proxy/maps/api/staticmap?${params.toString()}`, {
        signal: AbortSignal.timeout(15_000),
      });
      const contentType = mapResponse.headers.get("content-type") ?? "";
      if (!mapResponse.ok || !contentType.startsWith("image/")) {
        console.warn(`[maps] Upstream returned HTTP ${mapResponse.status}`);
        res.status(502).json({ error: "Map imagery is temporarily unavailable" });
        return;
      }
      const image = Buffer.from(await mapResponse.arrayBuffer());
      if (mapImageCache.size >= 40) {
        const oldestKey = mapImageCache.keys().next().value;
        if (oldestKey) mapImageCache.delete(oldestKey);
      }
      mapImageCache.set(cacheKey, { body: image, contentType, expiresAt: Date.now() + 300_000 });
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=300");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.send(image);
    } catch {
      res.status(502).json({ error: "Map imagery is temporarily unavailable" });
    }
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const port = parseInt(process.env.PORT || "3000");
  server.listen(port, () => {
    console.log("[api] server listening");
  });
}

startServer().catch(() => {
  console.error("[api] server failed to start");
});
