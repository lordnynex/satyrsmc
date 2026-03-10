/**
 * Unit tests for admin.incidents tRPC router.
 * Covers list (paginated).
 */

import { describe, test, expect, beforeAll } from "bun:test";
import type { TrpcTestHarness } from "../../../test/trpcHarness";
import { createTrpcTestHarness } from "../../../test/trpcHarness";

describe("admin.incidents", () => {
  let harness: TrpcTestHarness;

  beforeAll(async () => {
    harness = await createTrpcTestHarness();
  });

  describe("list", () => {
    test("returns paginated incidents", async () => {
      const result = await harness.caller.admin.incidents.list({});
      expect(result).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(typeof result.total).toBe("number");
      expect(typeof result.page).toBe("number");
      expect(typeof result.per_page).toBe("number");
    });

    test("accepts page and per_page", async () => {
      const result = await harness.caller.admin.incidents.list({
        page: 1,
        per_page: 10,
      });
      expect(result.page).toBe(1);
      expect(result.per_page).toBe(10);
    });
  });
});
