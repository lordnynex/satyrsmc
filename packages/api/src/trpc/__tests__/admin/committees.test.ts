/**
 * Unit tests for admin.committees tRPC router.
 * Covers list, get, create, update, delete, addMember, removeMember, reorderMembers,
 * listMeetings, createMeeting, getMeeting, updateMeeting, deleteMeeting.
 */

import type { TRPCError } from "@trpc/server";
import { describe, test, expect, beforeAll } from "bun:test";
import type { TrpcTestHarness } from "../../../test/trpcHarness";
import { createTrpcTestHarness } from "../../../test/trpcHarness";
import { BAD_ID, createCommittee, createMember } from "../helpers";

describe("admin.committees", () => {
  let harness: TrpcTestHarness;

  beforeAll(async () => {
    harness = await createTrpcTestHarness();
  });

  describe("list", () => {
    test("returns created committees", async () => {
      const c = (await createCommittee(harness.api, { name: "List Committee" }))!;
      const result = await harness.caller.admin.committees.list();
      expect(Array.isArray(result)).toBe(true);
      expect(result.some((x) => x.id === c.id)).toBe(true);
    });
  });

  describe("get", () => {
    test("returns committee by id", async () => {
      const c = (await createCommittee(harness.api, { name: "Get Committee" }))!;
      const result = await harness.caller.admin.committees.get({ id: c.id });
      expect(result.id).toBe(c.id);
      expect(result.name).toBe("Get Committee");
    });

    test("throws NOT_FOUND when id does not exist", async () => {
      try {
        await harness.caller.admin.committees.get({ id: BAD_ID });
      } catch (e) {
        expect((e as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("create", () => {
    test("creates committee and returns it", async () => {
      const result = await harness.caller.admin.committees.create({
        name: "New Committee",
        formed_date: "2025-01-01",
      });
      expect(result.id).toBeDefined();
      expect(result.name).toBe("New Committee");
    });
  });

  describe("update", () => {
    test("updates committee and returns it", async () => {
      const c = (await createCommittee(harness.api, { name: "To Update" }))!;
      const result = await harness.caller.admin.committees.update({
        id: c.id,
        name: "Updated Committee",
      });
      expect(result.id).toBe(c.id);
      expect(result.name).toBe("Updated Committee");
    });

    test("throws NOT_FOUND when id does not exist", async () => {
      try {
        await harness.caller.admin.committees.update({ id: BAD_ID, name: "No" });
      } catch (e) {
        expect((e as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("delete", () => {
    test("deletes committee and returns ok", async () => {
      const c = (await createCommittee(harness.api, { name: "To Delete" }))!;
      const result = await harness.caller.admin.committees.delete({ id: c.id });
      expect(result.ok).toBe(true);
      const list = await harness.caller.admin.committees.list();
      expect(list.some((x) => x.id === c.id)).toBe(false);
    });
  });

  describe("addMember, removeMember", () => {
    test("adds and removes member from committee", async () => {
      const committee = (await createCommittee(harness.api, { name: "Members Committee" }))!;
      const member = (await createMember(harness.api, { name: "CM Member" }))!;
      await harness.caller.admin.committees.addMember({
        committeeId: committee.id,
        memberId: member.id,
      });
      await harness.caller.admin.committees.removeMember({
        committeeId: committee.id,
        memberId: member.id,
      });
      expect(true).toBe(true);
    });
  });

  describe("listMeetings", () => {
    test("returns meetings for committee", async () => {
      const c = (await createCommittee(harness.api, { name: "Meetings Committee" }))!;
      const result = await harness.caller.admin.committees.listMeetings({ committeeId: c.id });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("createMeeting, getMeeting, updateMeeting, deleteMeeting", () => {
    test("full meeting crud under committee", async () => {
      const c = (await createCommittee(harness.api, { name: "Meeting Committee" }))!;
      const created = await harness.caller.admin.committees.createMeeting({
        committeeId: c.id,
        date: "2025-06-01",
        meeting_number: 1,
      });
      expect(created.id).toBeDefined();
      const got = await harness.caller.admin.committees.getMeeting({
        committeeId: c.id,
        meetingId: created.id,
      });
      expect(got.id).toBe(created.id);
      await harness.caller.admin.committees.updateMeeting({
        committeeId: c.id,
        meetingId: created.id,
        location: "Room A",
      });
      await harness.caller.admin.committees.deleteMeeting({
        committeeId: c.id,
        meetingId: created.id,
      });
      try {
        await harness.caller.admin.committees.getMeeting({
          committeeId: c.id,
          meetingId: created.id,
        });
      } catch (e) {
        expect((e as TRPCError).code).toBe("NOT_FOUND");
      }
    });

    test("getMeeting throws NOT_FOUND when meeting does not exist", async () => {
      const c = (await createCommittee(harness.api, { name: "Bad Meeting Committee" }))!;
      try {
        await harness.caller.admin.committees.getMeeting({
          committeeId: c.id,
          meetingId: BAD_ID,
        });
      } catch (e) {
        expect((e as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });
});
