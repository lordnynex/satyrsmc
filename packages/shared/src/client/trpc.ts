import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@satyrsmc/api/trpc";
import { httpBatchLink } from "@trpc/client";

declare const __BUILD_API_ORIGIN__: string | undefined;

export const trpc = createTRPCReact<AppRouter>();

function getTrpcUrlDefault(): string {
  if (typeof __BUILD_API_ORIGIN__ !== "undefined" && __BUILD_API_ORIGIN__ !== "")
    return __BUILD_API_ORIGIN__;
  if (typeof window === "undefined") return "http://localhost:3000";
  return window.location.origin;
}

export type TrpcClient = ReturnType<typeof trpc.createClient>;

export function createTrpcClient(options?: { getBaseUrl?: () => string }) {
  const getBaseUrl = options?.getBaseUrl ?? getTrpcUrlDefault;
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${getBaseUrl()}/trpc`,
        fetch(url, options) {
          return fetch(url, { ...options, credentials: "include" });
        },
      }),
    ],
  });
}
