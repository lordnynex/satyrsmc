import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@satyrsmc/api/trpc";
import { httpBatchLink } from "@trpc/client";

declare const __BUILD_API_ORIGIN__: string | undefined;

/** Public app uses only trpc.website.* procedures. */
export const trpc = createTRPCReact<AppRouter>();

function getTrpcUrl(): string {
  if (typeof __BUILD_API_ORIGIN__ !== "undefined" && __BUILD_API_ORIGIN__ !== "") return __BUILD_API_ORIGIN__;
  if (typeof window === "undefined") return "http://localhost:3000";
  return window.location.origin;
}

export function createTrpcClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${getTrpcUrl()}/trpc`,
      }),
    ],
  });
}
