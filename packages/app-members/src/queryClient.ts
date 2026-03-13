import { QueryClient } from "@tanstack/react-query";

const STALE_TIME_MS = 2 * 60 * 1000; // 2 minutes

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MS,
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      },
    },
  });
}
