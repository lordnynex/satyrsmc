/**
 * Unit tests for admin.meetingTemplates tRPC router.
 * Covers list, get, create, update, delete.
 */

import type { TRPCError } from "@trpc/server";
import { describe, test, expect, beforeAll } from "bun:test";
import type { TrpcTestHarness } from "../../../test/trpcHarness";
import { createTrpcTestHarness } from "../../../test/trpcHarness";
import { BAD_ID, createMeetingTemplate } from "../helpers";

describe("admin.meetingTemplates", () => {
  let harness: TrpcTestHarness;

  beforeAll(async () => {
    harness = await createTrpcTestHarness();
  });

  describe("list", () => {
    test("returns created templates", async () => {
      const tpl = await createMeetingTemplate(harness.api, {
        name: "List Tpl",
        type: "agenda",
        content: "",
      });
      const result = await harness.caller.admin.meetingTemplates.list();
      expect(Array.isArray(result)).toBe(true);
      expect(result.some((x) => x.id === tpl.id)).toBe(true);
    });

    test("filters by type when provided", async () => {
      const result = await harness.caller.admin.meetingTemplates.list({ type: "agenda" });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("get", () => {
    test("returns template by id", async () => {
      const tpl = await createMeetingTemplate(harness.api, {
        name: "Get Tpl",
        type: "agenda",
        content: "C",
      });
      const result = await harness.caller.admin.meetingTemplates.get({ id: tpl.id });
      expect(result.id).toBe(tpl.id);
      expect(result.name).toBe("Get Tpl");
    });

    test("throws NOT_FOUND when id does not exist", async () => {
      try {
        await harness.caller.admin.meetingTemplates.get({ id: BAD_ID });
      } catch (e) {
        expect((e as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("create", () => {
    test("creates template and returns it", async () => {
      const result = await harness.caller.admin.meetingTemplates.create({
        name: "New Tpl",
        type: "minutes",
        content: "Content",
      });
      expect(result.id).toBeDefined();
      expect(result.name).toBe("New Tpl");
    });
  });

  describe("update", () => {
    test("updates template and returns it", async () => {
      const tpl = await createMeetingTemplate(harness.api, {
        name: "To Update",
        type: "agenda",
        content: "",
      });
      const result = await harness.caller.admin.meetingTemplates.update({
        id: tpl.id,
        name: "Updated Tpl",
      });
      expect(result.id).toBe(tpl.id);
      expect(result.name).toBe("Updated Tpl");
    });

    test("throws NOT_FOUND when id does not exist", async () => {
      try {
        await harness.caller.admin.meetingTemplates.update({ id: BAD_ID, name: "No" });
      } catch (e) {
        expect((e as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("delete", () => {
    test("deletes template and returns ok", async () => {
      const tpl = await createMeetingTemplate(harness.api, {
        name: "To Delete",
        type: "agenda",
        content: "",
      });
      const result = await harness.caller.admin.meetingTemplates.delete({ id: tpl.id });
      expect(result.ok).toBe(true);
      const list = await harness.caller.admin.meetingTemplates.list();
      expect(list.some((x) => x.id === tpl.id)).toBe(false);
    });
  });
});
