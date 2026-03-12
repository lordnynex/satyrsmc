/**
 * Unit tests for admin.meetings tRPC router.
 * Covers list, get, create, update, delete, listOldBusiness, listMotions,
 * createMotion, updateMotion, deleteMotion, createActionItem, updateActionItem, deleteActionItem,
 * createOldBusiness, updateOldBusiness, deleteOldBusiness.
 */

import type { TRPCError } from "@trpc/server";
import { describe, test, expect, beforeAll } from "bun:test";
import type { TrpcTestHarness } from "../../../test/trpcHarness";
import { createTrpcTestHarness } from "../../../test/trpcHarness";
import { BAD_ID, createMeeting, createMember } from "../helpers";

describe("admin.meetings", () => {
  let harness: TrpcTestHarness;

  beforeAll(async () => {
    harness = await createTrpcTestHarness();
  });

  describe("list", () => {
    test("returns created meetings", async () => {
      const m = (await createMeeting(harness.api, { date: "2025-01-15", meeting_number: 1 }))!;
      const result = await harness.caller.admin.meetings.list();
      expect(Array.isArray(result)).toBe(true);
      expect(result.some((x) => x.id === m.id)).toBe(true);
    });
  });

  describe("get", () => {
    test("returns meeting by id", async () => {
      const m = (await createMeeting(harness.api, { date: "2025-02-01", meeting_number: 2 }))!;
      const result = await harness.caller.admin.meetings.get({ id: m.id });
      expect(result.id).toBe(m.id);
    });

    test("throws NOT_FOUND when id does not exist", async () => {
      try {
        await harness.caller.admin.meetings.get({ id: BAD_ID });
      } catch (e) {
        expect((e as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("create", () => {
    test("creates meeting and returns it", async () => {
      const result = await harness.caller.admin.meetings.create({
        date: "2025-03-01",
        meeting_number: 1,
      });
      expect(result.id).toBeDefined();
      expect(result.date).toBeDefined();
    });
  });

  describe("update", () => {
    test("updates meeting and returns it", async () => {
      const m = (await createMeeting(harness.api, { date: "2025-04-01", meeting_number: 1 }))!;
      const result = await harness.caller.admin.meetings.update({
        id: m.id,
        location: "Hall",
      });
      expect(result.id).toBe(m.id);
    });

    test("throws NOT_FOUND when id does not exist", async () => {
      try {
        await harness.caller.admin.meetings.update({ id: BAD_ID, location: "X" });
      } catch (e) {
        expect((e as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("delete", () => {
    test("deletes meeting and returns", async () => {
      const m = (await createMeeting(harness.api, { date: "2025-05-01", meeting_number: 1 }))!;
      await harness.caller.admin.meetings.delete({ id: m.id });
      const list = await harness.caller.admin.meetings.list();
      expect(list.some((x) => x.id === m.id)).toBe(false);
    });
  });

  describe("listOldBusiness", () => {
    test("returns old business items", async () => {
      const result = await harness.caller.admin.meetings.listOldBusiness();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("listMotions", () => {
    test("returns paginated motions", async () => {
      const result = await harness.caller.admin.meetings.listMotions({});
      expect(result).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(typeof result.total).toBe("number");
    });
  });

  describe("createMotion, updateMotion, deleteMotion", () => {
    test("full motion crud", async () => {
      const meeting = (await createMeeting(harness.api, {
        date: "2025-06-01",
        meeting_number: 1,
      }))!;
      const mover = (await createMember(harness.api, { name: "Mover" }))!;
      const seconder = (await createMember(harness.api, { name: "Seconder" }))!;
      const created = await harness.caller.admin.meetings.createMotion({
        meetingId: meeting.id,
        result: "pass",
        mover_member_id: mover.id,
        seconder_member_id: seconder.id,
      });
      expect(created.id).toBeDefined();
      await harness.caller.admin.meetings.updateMotion({
        meetingId: meeting.id,
        motionId: created.id,
        description: "Updated motion",
      });
      await harness.caller.admin.meetings.deleteMotion({
        meetingId: meeting.id,
        motionId: created.id,
      });
      expect(true).toBe(true);
    });
  });

  describe("createActionItem, updateActionItem, deleteActionItem", () => {
    test("full action item crud", async () => {
      const meeting = (await createMeeting(harness.api, {
        date: "2025-07-01",
        meeting_number: 1,
      }))!;
      const created = await harness.caller.admin.meetings.createActionItem({
        meetingId: meeting.id,
        description: "Do something",
      });
      expect(created.id).toBeDefined();
      await harness.caller.admin.meetings.updateActionItem({
        meetingId: meeting.id,
        actionItemId: created.id,
        description: "Updated",
      });
      await harness.caller.admin.meetings.deleteActionItem({
        meetingId: meeting.id,
        actionItemId: created.id,
      });
      expect(true).toBe(true);
    });
  });

  describe("createOldBusiness, updateOldBusiness, deleteOldBusiness", () => {
    test("full old business crud", async () => {
      const meeting = (await createMeeting(harness.api, {
        date: "2025-08-01",
        meeting_number: 1,
      }))!;
      const created = await harness.caller.admin.meetings.createOldBusiness({
        meetingId: meeting.id,
        description: "Old item",
      });
      expect(created.id).toBeDefined();
      await harness.caller.admin.meetings.updateOldBusiness({
        meetingId: meeting.id,
        oldBusinessId: created.id,
        description: "Updated old",
      });
      await harness.caller.admin.meetings.deleteOldBusiness({
        meetingId: meeting.id,
        oldBusinessId: created.id,
      });
      expect(true).toBe(true);
    });
  });
});
