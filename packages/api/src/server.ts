import "reflect-metadata";
import { performance } from "node:perf_hooks";
import { join } from "path";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { Api } from "./services/api";
import type { createContextFn } from "./trpc/context";
import { appRouter } from "./trpc/root";
import { MemberPhotoSize, ContactPhotoSize } from "@satyrsmc/shared/lib/enums";
import { logger } from "./logger";

const TRPC_PREFIX = "/trpc";

export interface CreateFetchHandlerOptions {
  api: Api;
  createContext: ReturnType<typeof createContextFn>;
  serveFrontend: boolean;
  projectRoot: string;
}

export function createFetchHandler(options: CreateFetchHandlerOptions) {
  const { api, createContext, serveFrontend, projectRoot } = options;
  const webDist = join(projectRoot, "packages", "app-public", "dist");
  const adminDist = join(projectRoot, "packages", "app-members", "dist");

  return async (
    request: Request,
    server: { requestIP?: (req: Request) => { address: string } | null },
  ): Promise<Response> => {
    const start = performance.now();
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "GET" && path === "/panel") {
      if (process.env.NODE_ENV === "production") {
        const durationMs = Math.round(performance.now() - start);
        const ip = server?.requestIP?.(request)?.address ?? "unknown";
        logger.info({ method: request.method, path, status: 404, durationMs, ip }, "http request");
        return new Response("Not Found", { status: 404 });
      }
      const mod = (await import("trpc-ui")) as {
        renderTrpcPanel: (
          router: typeof appRouter,
          opts: {
            url: string;
            meta?: { title?: string; description?: string };
          },
        ) => string;
      };
      const html = mod.renderTrpcPanel(appRouter, {
        url: `${url.origin}${TRPC_PREFIX}`,
        meta: {
          title: "Satyrs MC API",
          description: "tRPC API panel for Satyrs Motorcycle Club.",
        },
      });
      const durationMs = Math.round(performance.now() - start);
      const ip = server?.requestIP?.(request)?.address ?? "unknown";
      logger.info({ method: request.method, path, status: 200, durationMs, ip }, "http request");
      return new Response(html, { headers: { "Content-Type": "text/html" } });
    }

    if (path.startsWith(TRPC_PREFIX)) {
      const response = await fetchRequestHandler({
        endpoint: TRPC_PREFIX,
        req: request,
        router: appRouter,
        createContext,
      });
      const durationMs = Math.round(performance.now() - start);
      const ip = server?.requestIP?.(request)?.address ?? "unknown";
      logger.info(
        {
          method: request.method,
          path,
          status: response.status,
          durationMs,
          ip,
        },
        "http request",
      );
      return response;
    }

    if (request.method === "GET" && (path === "/health" || path === "/api/health")) {
      const durationMs = Math.round(performance.now() - start);
      const ip = server?.requestIP?.(request)?.address ?? "unknown";
      logger.info({ method: request.method, path, status: 200, durationMs, ip }, "http request");
      return new Response("OK", { status: 200 });
    }

    const memberPhotoMatch = path.match(/^\/api\/members\/([^/]+)\/photo$/);
    if (request.method === "GET" && memberPhotoMatch) {
      const id = memberPhotoMatch[1];
      const size = (url.searchParams.get("size") as MemberPhotoSize) ?? MemberPhotoSize.Full;
      const buffer = await api.members.getPhoto(id, size);
      const durationMs = Math.round(performance.now() - start);
      const ip = server?.requestIP?.(request)?.address ?? "unknown";
      if (!buffer) {
        logger.info({ method: request.method, path, status: 404, durationMs, ip }, "http request");
        return new Response("Not Found", { status: 404 });
      }
      logger.info({ method: request.method, path, status: 200, durationMs, ip }, "http request");
      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    const contactPhotoMatch = path.match(/^\/api\/contacts\/([^/]+)\/photos\/([^/]+)$/);
    if (request.method === "GET" && contactPhotoMatch) {
      const contactId = contactPhotoMatch[1];
      const photoId = contactPhotoMatch[2];
      const size = (url.searchParams.get("size") as ContactPhotoSize) ?? ContactPhotoSize.Full;
      const buffer = await api.contacts.getPhoto(contactId, photoId, size);
      const durationMs = Math.round(performance.now() - start);
      const ip = server?.requestIP?.(request)?.address ?? "unknown";
      if (!buffer) {
        logger.info({ method: request.method, path, status: 404, durationMs, ip }, "http request");
        return new Response("Not Found", { status: 404 });
      }
      logger.info({ method: request.method, path, status: 200, durationMs, ip }, "http request");
      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    const eventPhotoMatch = path.match(/^\/api\/events\/([^/]+)\/photos\/([^/]+)$/);
    if (request.method === "GET" && eventPhotoMatch) {
      const eventId = eventPhotoMatch[1];
      const photoId = eventPhotoMatch[2];
      const size = (url.searchParams.get("size") as "thumbnail" | "display" | "full") ?? "full";
      const buffer = await api.events.getPhoto(eventId, photoId, size);
      const durationMs = Math.round(performance.now() - start);
      const ip = server?.requestIP?.(request)?.address ?? "unknown";
      if (!buffer) {
        logger.info({ method: request.method, path, status: 404, durationMs, ip }, "http request");
        return new Response("Not Found", { status: 404 });
      }
      logger.info({ method: request.method, path, status: 200, durationMs, ip }, "http request");
      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    const eventAssetMatch = path.match(/^\/api\/events\/([^/]+)\/assets\/([^/]+)$/);
    if (request.method === "GET" && eventAssetMatch) {
      const eventId = eventAssetMatch[1];
      const assetId = eventAssetMatch[2];
      const size = (url.searchParams.get("size") as "thumbnail" | "display" | "full") ?? "full";
      const buffer = await api.events.getAsset(eventId, assetId, size);
      const durationMs = Math.round(performance.now() - start);
      const ip = server?.requestIP?.(request)?.address ?? "unknown";
      if (!buffer) {
        logger.info({ method: request.method, path, status: 404, durationMs, ip }, "http request");
        return new Response("Not Found", { status: 404 });
      }
      logger.info({ method: request.method, path, status: 200, durationMs, ip }, "http request");
      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "image/jpeg",
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    if (!serveFrontend) {
      const durationMs = Math.round(performance.now() - start);
      const ip = server?.requestIP?.(request)?.address ?? "unknown";
      logger.info({ method: request.method, path, status: 404, durationMs, ip }, "http request");
      return new Response("Not Found", { status: 404 });
    }

    // Admin app serves: /admin/* (admin routes + static assets) and
    // member/auth routes at root level (login, register, profile, etc.)
    const MEMBER_AUTH_ROUTES = [
      "/login",
      "/register",
      "/signup",
      "/forgot-password",
      "/reset-password",
      "/profile",
      "/roster",
    ];
    const isAdminAppRoute =
      path.startsWith("/admin") ||
      MEMBER_AUTH_ROUTES.some((r) => path === r || path.startsWith(r + "/"));

    if (isAdminAppRoute) {
      // Try to serve static assets (JS/CSS/images) — built with publicPath="/admin/"
      if (path.startsWith("/admin/")) {
        const filePath = join(adminDist, path.slice("/admin".length));
        try {
          const file = Bun.file(filePath);
          if (await file.exists()) {
            const contentType = path.endsWith(".html")
              ? "text/html"
              : path.endsWith(".js")
                ? "application/javascript"
                : path.endsWith(".css")
                  ? "text/css"
                  : undefined;
            const res = new Response(file, {
              headers: contentType ? { "Content-Type": contentType } : undefined,
            });
            logger.info(
              {
                method: request.method,
                path,
                status: 200,
                durationMs: Math.round(performance.now() - start),
                ip: server?.requestIP?.(request)?.address ?? "unknown",
              },
              "http request",
            );
            return res;
          }
        } catch {
          // fall through to SPA fallback
        }
      }
      // SPA fallback — serve admin index.html for all admin/member/auth routes
      const indexHtml = Bun.file(join(adminDist, "index.html"));
      if (await indexHtml.exists()) {
        logger.info(
          {
            method: request.method,
            path,
            status: 200,
            durationMs: Math.round(performance.now() - start),
            ip: server?.requestIP?.(request)?.address ?? "unknown",
          },
          "http request",
        );
        return new Response(indexHtml, {
          headers: { "Content-Type": "text/html" },
        });
      }
      const durationMs = Math.round(performance.now() - start);
      const ip = server?.requestIP?.(request)?.address ?? "unknown";
      logger.info({ method: request.method, path, status: 404, durationMs, ip }, "http request");
      return new Response("Not Found", { status: 404 });
    }

    const filePath = path === "/" ? join(webDist, "index.html") : join(webDist, path);
    try {
      const file = Bun.file(filePath);
      if (await file.exists()) {
        const contentType = path.endsWith(".html")
          ? "text/html"
          : path.endsWith(".js")
            ? "application/javascript"
            : path.endsWith(".css")
              ? "text/css"
              : undefined;
        const res = new Response(file, {
          headers: contentType ? { "Content-Type": contentType } : undefined,
        });
        logger.info(
          {
            method: request.method,
            path,
            status: 200,
            durationMs: Math.round(performance.now() - start),
            ip: server?.requestIP?.(request)?.address ?? "unknown",
          },
          "http request",
        );
        return res;
      }
    } catch {
      // fall through to SPA fallback
    }
    const indexHtml = Bun.file(join(webDist, "index.html"));
    if (await indexHtml.exists()) {
      logger.info(
        {
          method: request.method,
          path,
          status: 200,
          durationMs: Math.round(performance.now() - start),
          ip: server?.requestIP?.(request)?.address ?? "unknown",
        },
        "http request",
      );
      return new Response(indexHtml, {
        headers: { "Content-Type": "text/html" },
      });
    }

    const durationMs = Math.round(performance.now() - start);
    const ip = server?.requestIP?.(request)?.address ?? "unknown";
    logger.info({ method: request.method, path, status: 404, durationMs, ip }, "http request");
    return new Response("Not Found", { status: 404 });
  };
}
