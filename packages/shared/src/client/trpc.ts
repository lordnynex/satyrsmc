import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@satyrsmc/api/trpc";
import { httpBatchLink } from "@trpc/client";

export const trpc = createTRPCReact<AppRouter>();

function getTrpcUrlDefault(): string {
  const apiOrigin = import.meta.env.VITE_API_ORIGIN;
  if (apiOrigin) return apiOrigin;
  if (typeof window === "undefined") return "http://localhost:4000";
  return "";
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
