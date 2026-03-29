import "reflect-metadata";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./trpc/root";
import { createContextFn } from "./trpc/context";
import type { Api } from "./services/api";
import { MemberPhotoSize, ContactPhotoSize } from "@satyrsmc/shared/lib/enums";
import { logger } from "./logger";

export interface CreateExpressAppOptions {
  api: Api;
}

export function createExpressApp({ api }: CreateExpressAppOptions) {
  const app = express();
  const isDev = process.env.NODE_ENV !== "production";

  app.use(
    cors({
      origin: isDev
        ? true
        : [process.env.PUBLIC_SITE_URL, process.env.MEMBERS_SITE_URL].filter(Boolean),
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json());

  const createContext = createContextFn({ api });

  // tRPC
  app.use(
    "/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError: ({ error, path }) => {
        if (error.code === "INTERNAL_SERVER_ERROR") {
          logger.error({ err: error.cause ?? error, path }, "tRPC internal error");
        }
      },
    }),
  );

  // Health check
  app.get(["/health", "/api/health"], (_req, res) => {
    res.status(200).send("OK");
  });

  // Member photo
  app.get("/api/members/:id/photo", async (req, res) => {
    const size = (req.query["size"] as MemberPhotoSize) ?? MemberPhotoSize.Full;
    const buffer = await api.members.getPhoto(req.params["id"]!, size);
    if (!buffer) return void res.status(404).send("Not Found");
    res.set({ "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=3600" });
    res.send(Buffer.from(buffer));
  });

  // Contact photo
  app.get("/api/contacts/:contactId/photos/:photoId", async (req, res) => {
    const size = (req.query["size"] as ContactPhotoSize) ?? ContactPhotoSize.Full;
    const buffer = await api.contacts.getPhoto(
      req.params["contactId"]!,
      req.params["photoId"]!,
      size,
    );
    if (!buffer) return void res.status(404).send("Not Found");
    res.set({ "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=3600" });
    res.send(Buffer.from(buffer));
  });

  // Event photo
  app.get("/api/events/:eventId/photos/:photoId", async (req, res) => {
    const size = (req.query["size"] as "thumbnail" | "display" | "full") ?? "full";
    const buffer = await api.events.getPhoto(req.params["eventId"]!, req.params["photoId"]!, size);
    if (!buffer) return void res.status(404).send("Not Found");
    res.set({ "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=3600" });
    res.send(Buffer.from(buffer));
  });

  // Bike photo
  app.get("/api/bikes/:bikeId/photo", async (req, res) => {
    const size = (req.query["size"] as "thumbnail" | "full") ?? "full";
    const buffer = await api.bikes.getPhoto(req.params["bikeId"]!, size);
    if (!buffer) return void res.status(404).send("Not Found");
    res.set({ "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=3600" });
    res.send(Buffer.from(buffer));
  });

  // Event asset
  app.get("/api/events/:eventId/assets/:assetId", async (req, res) => {
    const size = (req.query["size"] as "thumbnail" | "display" | "full") ?? "full";
    const buffer = await api.events.getAsset(req.params["eventId"]!, req.params["assetId"]!, size);
    if (!buffer) return void res.status(404).send("Not Found");
    res.set({ "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=3600" });
    res.send(Buffer.from(buffer));
  });

  return app;
}
