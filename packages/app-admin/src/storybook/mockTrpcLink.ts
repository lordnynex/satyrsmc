import type { TRPCLink } from "@trpc/client";
import { observable } from "@trpc/server/observable";
import type { AppRouter } from "@satyrsmc/api/trpc";

/**
 * Terminating link that returns mock data for all procedures (queries and mutations).
 * Used in Storybook so components using trpc.admin.*.useQuery/useMutation render
 * without a real backend. List procedures return []; get-like return null; mutations return undefined.
 */
export function createMockTrpcLink(): TRPCLink<AppRouter> {
  return () =>
    ({ op }) => {
      return observable((observer) => {
        const path = op.path;
        let data: unknown;
        if (op.type === "query") {
          data = path.endsWith(".list") || path.includes(".list") ? [] : null;
        } else {
          data = undefined;
        }
        observer.next({
          result: {
            data,
          } as { data: unknown },
          context: op.context,
        });
        observer.complete();
      });
    };
}
