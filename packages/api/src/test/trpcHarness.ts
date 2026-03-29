/**
 * tRPC test harness — creates a typed caller bound to PGlite + Api for unit testing procedures.
 *
 * Purpose:
 *   - Reuses the same DB/setup as service tests (setupTestDb from ./setup).
 *   - Builds a tRPC context with api and an optional session stub for auth.
 *   - Exposes a caller so tests invoke procedures directly (no HTTP).
 *
 * Usage:
 *   - In beforeAll(): const harness = await createTrpcTestHarness();
 *   - Call procedures via harness.caller (e.g. harness.caller.website.getEventsFeed()).
 *   - Seed data via harness.api or via the caller; prefer caller for the flow under test.
 *   - Tests do not reset or teardown the database; each test file gets a fresh DB from setupTestDb().
 *   - To create multiple harnesses with different sessions sharing the same DB, use harness.fork():
 *       const base = await createTrpcTestHarness();
 *       const authed = base.fork({ userId: '...', userType: 'user', ... });
 *
 * Auth:
 *   - Context has session: null by default. To simulate an authenticated user, pass
 *     createTrpcTestHarness({ session: { userId: '...', userType: 'admin', ... } })
 *     so protected procedures receive a session.
 */

import type { Request, Response } from "express";
import type { Context, Session } from "../trpc/context";
import { appRouter } from "../trpc/root";
import { t } from "../trpc/trpc";
import { setupTestDb } from "./setup";

export type CreateTrpcTestHarnessOptions = {
  /**
   * Override session for this harness. Use to simulate logged-in user for auth-protected procedures.
   * Default: null (unauthenticated).
   */
  session?: Session | null;
};

/**
 * Harness return type inferred from createTrpcTestHarnessInner so caller stays correctly typed.
 * Properties: caller (typed app router caller), api, ds, context, fork.
 */
export type TrpcTestHarness = Awaited<ReturnType<typeof createTrpcTestHarnessInner>>;

/**
 * Inner implementation so TrpcTestHarness can be inferred without circular reference.
 * Caller type is inferred from createCallerFactory(appRouter)(context).
 */
async function createTrpcTestHarnessInner(options?: CreateTrpcTestHarnessOptions) {
  const { ds, api } = await setupTestDb();
  const createCaller = t.createCallerFactory(appRouter);

  /**
   * Builds a harness object sharing this DB/api with the given session.
   * Used internally by the outer factory and by fork().
   */
  function buildHarness(session: Session | null) {
    const context: Context = {
      req: { headers: {} } as unknown as Request,
      res: { setHeader: () => undefined, getHeader: () => undefined } as unknown as Response,
      api,
      session,
    };
    const caller = createCaller(context);

    /**
     * Creates a new caller with a different session, sharing this harness's database and api.
     * Use this instead of calling createTrpcTestHarness() again — multiple calls to
     * createTrpcTestHarness() create separate PGlite instances that appear isolated but
     * are backed by the same singleton, causing data to bleed across harnesses.
     */
    function fork(newSession: Session | null = null) {
      return buildHarness(newSession);
    }

    return { caller, api, ds, context, fork };
  }

  return buildHarness(options?.session ?? null);
}

/**
 * Creates a tRPC test harness: PGlite + Api + context + caller.
 * One call per test file — use harness.fork(session) for additional session contexts.
 *
 * @param options - Optional session stub for auth; defaults to session: null.
 * @returns Harness with caller, api, ds, context, and fork().
 */
export async function createTrpcTestHarness(
  options?: CreateTrpcTestHarnessOptions,
): Promise<TrpcTestHarness> {
  return createTrpcTestHarnessInner(options);
}
