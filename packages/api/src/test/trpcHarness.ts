/**
 * tRPC test harness — creates a typed caller bound to PGlite + Api for unit testing procedures.
 *
 * Purpose:
 *   - Reuses the same DB/setup as service tests (setupTestDb from ./setup).
 *   - Builds a tRPC context with api and an optional session stub for future auth.
 *   - Exposes a caller so tests invoke procedures directly (no HTTP).
 *
 * Usage:
 *   - In beforeAll(): const harness = await createTrpcTestHarness();
 *   - Call procedures via harness.caller (e.g. harness.caller.website.getEventsFeed()).
 *   - Seed data via harness.api or via the caller; prefer caller for the flow under test.
 *   - Tests do not reset or teardown the database; each test file gets a fresh DB from setupTestDb().
 *
 * Auth and future middleware:
 *   - Context currently has session: null. When auth middleware is added, procedures will
 *     read ctx.session (and possibly ctx.session.role). To simulate an authenticated user
 *     in tests, pass createTrpcTestHarness({ session: { userId: '...', role: 'admin' } })
 *     so protected procedures receive a session. No middleware is implemented here; only
 *     the stub type and this contract.
 */

import type { Context } from "../trpc/context";
import { appRouter } from "../trpc/root";
import { t } from "../trpc/trpc";
import { setupTestDb } from "./setup";

/**
 * Test-only session shape for stubbing auth in procedure tests.
 * When protected procedures are added, they will check ctx.session (and optionally role).
 */
export type TestSession = {
  userId: string;
  role?: "admin" | "member" | "public";
};

export type CreateTrpcTestHarnessOptions = {
  /**
   * Override session for this harness. Use to simulate logged-in user when auth middleware exists.
   * Default: null (unauthenticated).
   */
  session?: TestSession | null;
};

/**
 * Harness return type inferred from createTrpcTestHarnessInner so caller stays correctly typed.
 * Properties: caller (typed app router caller), api, ds, context.
 */
export type TrpcTestHarness = Awaited<ReturnType<typeof createTrpcTestHarnessInner>>;

/**
 * Inner implementation so TrpcTestHarness can be inferred without circular reference.
 * Caller type is inferred from createCallerFactory(appRouter)(context).
 */
async function createTrpcTestHarnessInner(options?: CreateTrpcTestHarnessOptions) {
  const { ds, api } = await setupTestDb();

  // Build context compatible with trpc/context.ts: req, resHeaders, api, session.
  // Minimal req/resHeaders for tests; session from options or null for future auth.
  const session = options?.session ?? null;
  const context: Context = {
    req: new Request("http://test"),
    resHeaders: new Headers(),
    api,
    session: session as Context["session"],
  };

  const createCaller = t.createCallerFactory(appRouter);
  const caller = createCaller(context);

  return { caller, api, ds, context };
}

/**
 * Creates a tRPC test harness: PGlite + Api + context + caller.
 * Each call creates a fresh DB instance (safe for parallel test files).
 *
 * @param options - Optional session stub for future auth; defaults to session: null.
 * @returns Harness with caller, api, ds, and context.
 */
export async function createTrpcTestHarness(
  options?: CreateTrpcTestHarnessOptions,
): Promise<TrpcTestHarness> {
  return createTrpcTestHarnessInner(options);
}
