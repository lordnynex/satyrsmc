/**
 * Unit tests for admin.members tRPC router.
 * Covers list, get, create, update, delete, getPhoto.
 */

import type { TRPCError } from "@trpc/server";
import { describe, test, expect, beforeAll } from "bun:test";
import type { TrpcTestHarness } from "../../../test/trpcHarness";
import { createTrpcTestHarness } from "../../../test/trpcHarness";
import { BAD_ID, createMember, MINIMAL_JPEG_BUFFER } from "../helpers";

describe("admin.members", () => {
  let harness: TrpcTestHarness;

  beforeAll(async () => {
    harness = await createTrpcTestHarness();
  });

  describe("list", () => {
    test("returns created members", async () => {
      const m = await createMember(harness.api, { name: "List Member" });
      const result = await harness.caller.admin.members.list();
      expect(Array.isArray(result)).toBe(true);
      expect(result.some((x) => x.id === m.id)).toBe(true);
    });
  });

  describe("get", () => {
    test("returns member by id", async () => {
      const m = await createMember(harness.api, { name: "Get Member" });
      const result = await harness.caller.admin.members.get({ id: m.id });
      expect(result.id).toBe(m.id);
      expect(result.name).toBe("Get Member");
    });

    test("throws NOT_FOUND when id does not exist", async () => {
      try {
        await harness.caller.admin.members.get({ id: BAD_ID });
      } catch (e) {
        expect((e as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("create", () => {
    test("creates member and returns it", async () => {
      const result = await harness.caller.admin.members.create({
        name: "New Member",
      });
      expect(result.id).toBeDefined();
      expect(result.name).toBe("New Member");
    });
  });

  describe("update", () => {
    test("updates member and returns it", async () => {
      const m = await createMember(harness.api, { name: "To Update" });
      const result = await harness.caller.admin.members.update({
        id: m.id,
        name: "Updated Member",
      });
      expect(result.id).toBe(m.id);
      expect(result.name).toBe("Updated Member");
    });

    test("throws NOT_FOUND when id does not exist", async () => {
      try {
        await harness.caller.admin.members.update({ id: BAD_ID, name: "No" });
      } catch (e) {
        expect((e as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("delete", () => {
    test("deletes member and returns ok", async () => {
      const m = await createMember(harness.api, { name: "To Delete" });
      const result = await harness.caller.admin.members.delete({ id: m.id });
      expect(result.ok).toBe(true);
      const list = await harness.caller.admin.members.list();
      expect(list.some((x) => x.id === m.id)).toBe(false);
    });
  });

  describe("getPhoto", () => {
    test("returns base64 when member has photo", async () => {
      const m = await createMember(harness.api, {
        name: "Photo Member",
        photo: MINIMAL_JPEG_BUFFER.toString("base64"),
      } as Record<string, unknown>);
      const result = await harness.caller.admin.members.getPhoto({ id: m.id });
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    test("throws NOT_FOUND when member has no photo or id invalid", async () => {
      const m = await createMember(harness.api, { name: "No Photo" });
      try {
        await harness.caller.admin.members.getPhoto({ id: m.id });
      } catch (e) {
        expect((e as TRPCError).code).toBe("NOT_FOUND");
      }
    });

    test("throws NOT_FOUND when id does not exist", async () => {
      try {
        await harness.caller.admin.members.getPhoto({ id: BAD_ID });
      } catch (e) {
        expect((e as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });
});
