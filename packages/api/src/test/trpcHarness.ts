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
 *
 * Auth:
 *   - Context has session: null by default. To simulate an authenticated user, pass
 *     createTrpcTestHarness({ session: { userId: '...', userType: 'admin', ... } })
 *     so protected procedures receive a session.
 */

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
 * Properties: caller (typed app router caller), api, ds, context.
 */
export type TrpcTestHarness = Awaited<ReturnType<typeof createTrpcTestHarnessInner>>;

/**
 * Inner implementation so TrpcTestHarness can be inferred without circular reference.
 * Caller type is inferred from createCallerFactory(appRouter)(context).
 */
async function createTrpcTestHarnessInner(options?: CreateTrpcTestHarnessOptions) {
  const { ds, api } = await setupTestDb();

  const session = options?.session ?? null;
  const context: Context = {
    req: new Request("http://test"),
    resHeaders: new Headers(),
    api,
    session,
  };

  const createCaller = t.createCallerFactory(appRouter);
  const caller = createCaller(context);

  return { caller, api, ds, context };
}

/**
 * Creates a tRPC test harness: PGlite + Api + context + caller.
 * Each call creates a fresh DB instance (safe for parallel test files).
 *
 * @param options - Optional session stub for auth; defaults to session: null.
 * @returns Harness with caller, api, ds, and context.
 */
export async function createTrpcTestHarness(
  options?: CreateTrpcTestHarnessOptions,
): Promise<TrpcTestHarness> {
  return createTrpcTestHarnessInner(options);
}
