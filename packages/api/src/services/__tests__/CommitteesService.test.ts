import { describe, test, expect, beforeAll } from "vitest";
import { setupTestDb } from "../../test/setup";
import type { Api } from "../api";
import type { DataSource } from "typeorm";
import { BAD_ID, createCommittee, createMember } from "./helpers";

describe("CommitteesService", () => {
  let api: Api;
  let _ds: DataSource;

  beforeAll(async () => {
    const result = await setupTestDb();
    api = result.api;
    _ds = result.ds;
  });

  describe("list", () => {
    test("returns created committees", async () => {
      const c = await createCommittee(api, { name: "List Committee" });
      expect(c).not.toBeNull();
      const result = await api.committees.list();
      expect(result.some((e) => e.id === c!.id)).toBe(true);
    });

    test("list(sort)", async () => {
      const c = await createCommittee(api, { name: "Sort Committee" });
      expect(c).not.toBeNull();
      const byName = await api.committees.list("name");
      const byDate = await api.committees.list("formed_date");
      expect(byName.some((e) => e.id === c!.id)).toBe(true);
      expect(byDate.some((e) => e.id === c!.id)).toBe(true);
    });
  });

  describe("get", () => {
    test("returns committee by id", async () => {
      const c = await createCommittee(api, { name: "Get Committee" });
      expect(c).not.toBeNull();
      const got = await api.committees.get(c!.id);
      expect(got).not.toBeNull();
      expect(got!.id).toBe(c!.id);
      expect(got!.name).toBe("Get Committee");
    });

    test("get(badId) returns null", async () => {
      const result = await api.committees.get(BAD_ID);
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    test("creates committee", async () => {
      const c = await createCommittee(api, { name: "New Committee" });
      expect(c).not.toBeNull();
      expect(c!.id).toBeDefined();
      expect(c!.name).toBe("New Committee");
    });
  });

  describe("update", () => {
    test("updates committee", async () => {
      const c = await createCommittee(api, { name: "Update Committee" });
      expect(c).not.toBeNull();
      const updated = await api.committees.update(c!.id, { name: "Updated Name" });
      expect(updated).not.toBeNull();
      expect(updated!.name).toBe("Updated Name");
    });

    test("update(badId) returns null", async () => {
      const result = await api.committees.update(BAD_ID, { name: "No" });
      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    test("deletes committee", async () => {
      const c = await createCommittee(api, { name: "Delete Committee" });
      expect(c).not.toBeNull();
      const ok = await api.committees.delete(c!.id);
      expect(ok).toBe(true);
      const got = await api.committees.get(c!.id);
      expect(got).toBeNull();
    });
  });

  describe("addMember, removeMember, updateMemberOrder", () => {
    test("addMember and removeMember", async () => {
      const committee = await createCommittee(api, { name: "Member Committee" });
      const member = await createMember(api, { name: "CM Member" });
      if (!committee || !member) throw new Error("createCommittee or createMember failed");
      const afterAdd = await api.committees.addMember(committee.id, member.id);
      expect(afterAdd).not.toBeNull();
      const member2 = await createMember(api, { name: "CM Member 2" });
      if (!member2) throw new Error("createMember failed");
      await api.committees.addMember(committee.id, member2.id);
      await api.committees.updateMemberOrder(committee.id, [member2.id, member.id]);
      await api.committees.removeMember(committee.id, member.id);
      const got = await api.committees.get(committee.id);
      if (!got) throw new Error("get committee failed");
      const members = (got.members ?? []) as Array<{ member_id: string }>;
      expect(members.some((m) => m.member_id === member2.id)).toBe(true);
      expect(members.some((m) => m.member_id === member.id)).toBe(false);
    });

    test("addMember(badCommitteeId) returns null", async () => {
      const member = await createMember(api, { name: "Bad Committee Member" });
      if (!member) throw new Error("createMember failed");
      const result = await api.committees.addMember(BAD_ID, member.id);
      expect(result).toBeNull();
    });
  });

  describe("listMeetings", () => {
    test("returns meetings for committee", async () => {
      const committee = await createCommittee(api, { name: "Meetings Committee" });
      expect(committee).not.toBeNull();
      const list = await api.committees.listMeetings(committee!.id);
      expect(Array.isArray(list)).toBe(true);
    });
  });

  describe("createMeeting, getMeeting, updateMeeting, deleteMeeting", () => {
    test("full meeting crud", async () => {
      const committee = await createCommittee(api, { name: "Meeting Committee" });
      expect(committee).not.toBeNull();
      const meeting = await api.committees.createMeeting(committee!.id, {
        date: "2025-01-10",
        meeting_number: 1,
      });
      expect(meeting).not.toBeNull();
      expect(meeting!.id).toBeDefined();
      const got = await api.committees.getMeeting(committee!.id, meeting!.id);
      expect(got).not.toBeNull();
      expect(got!.id).toBe(meeting!.id);
      const updated = await api.committees.updateMeeting(committee!.id, meeting!.id, {
        location: "Room B",
      });
      expect(updated).not.toBeNull();
      expect(updated!.location).toBe("Room B");
      const delOk = await api.committees.deleteMeeting(committee!.id, meeting!.id);
      expect(delOk).toBe(true);
      const afterDel = await api.committees.getMeeting(committee!.id, meeting!.id);
      expect(afterDel).toBeNull();
    });

    test("getMeeting(committeeId, badMeetingId) returns null", async () => {
      const committee = await createCommittee(api, { name: "Bad Meeting Committee" });
      expect(committee).not.toBeNull();
      const result = await api.committees.getMeeting(committee!.id, BAD_ID);
      expect(result).toBeNull();
    });

    test("updateMeeting(..., badMeetingId) returns null", async () => {
      const committee = await createCommittee(api, { name: "Upd Bad Meeting Committee" });
      expect(committee).not.toBeNull();
      const result = await api.committees.updateMeeting(committee!.id, BAD_ID, { location: "X" });
      expect(result).toBeNull();
    });
  });
});
