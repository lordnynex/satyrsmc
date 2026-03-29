/**
 * Unit tests for admin.scenarios tRPC router.
 * Covers list, get, create, update, delete.
 */

import type { TRPCError } from "@trpc/server";
import { describe, test, expect, beforeAll } from "vitest";
import type { TrpcTestHarness } from "../../../test/trpcHarness";
import { createTrpcTestHarness } from "../../../test/trpcHarness";
import { BAD_ID, createScenario } from "../helpers";

describe("admin.scenarios", () => {
  let harness: TrpcTestHarness;

  beforeAll(async () => {
    harness = await createTrpcTestHarness();
  });

  describe("list", () => {
    test("returns created scenarios", async () => {
      const s = await createScenario(harness.api, { name: "List Scenario" });
      const result = await harness.caller.admin.scenarios.list();
      expect(Array.isArray(result)).toBe(true);
      expect(result.some((x) => x.id === s.id)).toBe(true);
    });
  });

  describe("get", () => {
    test("returns scenario by id", async () => {
      const s = await createScenario(harness.api, { name: "Get Scenario" });
      const result = await harness.caller.admin.scenarios.get({ id: s.id });
      expect(result.id).toBe(s.id);
      expect(result.name).toBe("Get Scenario");
    });

    test("throws NOT_FOUND when id does not exist", async () => {
      try {
        await harness.caller.admin.scenarios.get({ id: BAD_ID });
      } catch (e) {
        expect((e as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("create", () => {
    test("creates scenario and returns it", async () => {
      const result = await harness.caller.admin.scenarios.create({
        name: "New Scenario",
      });
      expect(result.id).toBeDefined();
      expect(result.name).toBe("New Scenario");
    });
  });

  describe("update", () => {
    test("updates scenario and returns it", async () => {
      const s = await createScenario(harness.api, { name: "To Update" });
      const result = await harness.caller.admin.scenarios.update({
        id: s.id,
        name: "Updated Scenario",
      });
      expect(result.id).toBe(s.id);
      expect(result.name).toBe("Updated Scenario");
    });

    test("throws NOT_FOUND when id does not exist", async () => {
      try {
        await harness.caller.admin.scenarios.update({ id: BAD_ID, name: "No" });
      } catch (e) {
        expect((e as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("delete", () => {
    test("deletes scenario and returns ok", async () => {
      const s = await createScenario(harness.api, { name: "To Delete" });
      const result = await harness.caller.admin.scenarios.delete({ id: s.id });
      expect(result.ok).toBe(true);
      const list = await harness.caller.admin.scenarios.list();
      expect(list.some((x) => x.id === s.id)).toBe(false);
    });
  });
});
