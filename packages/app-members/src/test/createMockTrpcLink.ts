import type { TRPCLink } from "@trpc/client";
import { observable } from "@trpc/server/observable";
import type { AppRouter } from "@satyrsmc/api/trpc";

type MockHandler = (input: unknown) => unknown;

/**
 * Configurable mock tRPC link for component tests.
 * Pass a handlers map keyed by procedure path (e.g., "auth.validateToken").
 * Unmatched queries return [] for .list paths, null otherwise.
 * Unmatched mutations return undefined.
 */
export function createMockTrpcLink(
  handlers: Record<string, MockHandler> = {},
): TRPCLink<AppRouter> {
  return () =>
    ({ op }) => {
      return observable((observer) => {
        const path = op.path;
        let data: unknown;

        if (handlers[path]) {
          data = handlers[path](op.input);
        } else if (op.type === "query") {
          data = path.includes(".list") ? [] : null;
        } else {
          data = undefined;
        }

        // Use setTimeout to simulate async behavior so React state updates flush
        setTimeout(() => {
          observer.next({
            result: { data } as { data: unknown },
            context: op.context,
          });
          observer.complete();
        }, 0);
      });
    };
}
