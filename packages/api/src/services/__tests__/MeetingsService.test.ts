import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { setupTestDb, teardownTestDb } from "../../test/setup";
import type { Api } from "../api";
import type { DataSource } from "typeorm";
import { BAD_ID, createMeeting, createMember } from "./helpers";

describe("MeetingsService", () => {
  let api: Api;
  let ds: DataSource;

  beforeAll(async () => {
    const result = await setupTestDb();
    api = result.api;
    ds = result.ds;
  });

  afterAll(async () => {
    await teardownTestDb(ds);
  });

  describe("list", () => {
    test("returns created meetings", async () => {
      const m = await createMeeting(api, { date: "2025-01-15", meeting_number: 100 });
      const result = await api.meetings.list();
      expect(result.some((e) => e.id === m.id)).toBe(true);
    });

    test("list(sort) by date and meeting_number", async () => {
      const m = await createMeeting(api, { date: "2025-02-01", meeting_number: 101 });
      const byDate = await api.meetings.list("date");
      const byNum = await api.meetings.list("meeting_number");
      expect(byDate.some((e) => e.id === m.id)).toBe(true);
      expect(byNum.some((e) => e.id === m.id)).toBe(true);
    });
  });

  describe("get", () => {
    test("returns meeting detail", async () => {
      const m = await createMeeting(api, { date: "2025-03-01", meeting_number: 102 });
      const got = await api.meetings.get(m.id);
      expect(got).not.toBeNull();
      expect(got!.id).toBe(m.id);
      const dateVal = new Date(String(got!.date));
      expect(dateVal.getFullYear()).toBe(2025);
      expect(dateVal.getMonth()).toBe(2);
      expect(dateVal.getDate()).toBe(1);
      expect(got!.meeting_number).toBe(102);
    });

    test("get(badId) returns null", async () => {
      const result = await api.meetings.get(BAD_ID);
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    test("creates meeting", async () => {
      const m = await createMeeting(api, { date: "2025-04-01", meeting_number: 103 });
      expect(m.id).toBeDefined();
      const dateVal = m.date instanceof Date ? m.date : new Date(String(m.date));
      expect(dateVal.getFullYear()).toBe(2025);
      expect(dateVal.getMonth()).toBe(3);
      expect(dateVal.getDate()).toBe(1);
      expect(m.meeting_number).toBe(103);
    });
  });

  describe("update", () => {
    test("updates meeting", async () => {
      const m = await createMeeting(api, { date: "2025-05-01", meeting_number: 104 });
      const updated = await api.meetings.update(m.id, { location: "Room A", meeting_number: 105 });
      expect(updated).not.toBeNull();
      expect(updated!.location).toBe("Room A");
      expect(updated!.meeting_number).toBe(105);
    });

    test("update(badId) returns null", async () => {
      const result = await api.meetings.update(BAD_ID, { location: "No" });
      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    test("deletes meeting", async () => {
      const m = await createMeeting(api, { date: "2025-06-01", meeting_number: 106 });
      const ok = await api.meetings.delete(m.id);
      expect(ok).toBe(true);
      const got = await api.meetings.get(m.id);
      expect(got).toBeNull();
    });

    test("delete(badId) returns false", async () => {
      const result = await api.meetings.delete(BAD_ID);
      expect(result).toBe(false);
    });
  });

  describe("motions", () => {
    test("createMotion, updateMotion, deleteMotion", async () => {
      const m = await createMeeting(api, { date: "2025-07-01", meeting_number: 107 });
      const mover = await createMember(api, { name: "Mover" });
      const seconder = await createMember(api, { name: "Seconder" });
      const motion = await api.meetings.createMotion(m.id, {
        description: "Motion text",
        result: "carried",
        mover_member_id: mover.id,
        seconder_member_id: seconder.id,
      });
      expect(motion.id).toBeDefined();
      const updated = await api.meetings.updateMotion(m.id, motion.id, { result: "fail" });
      expect(updated).not.toBeNull();
      expect(updated!.result).toBe("fail");
      const delOk = await api.meetings.deleteMotion(m.id, motion.id);
      expect(delOk).toBe(true);
    });

    test("updateMotion(meetingId, badMotionId) returns null", async () => {
      const m = await createMeeting(api, { date: "2025-08-01", meeting_number: 108 });
      const result = await api.meetings.updateMotion(m.id, BAD_ID, { result: "carried" });
      expect(result).toBeNull();
    });
  });

  describe("action items", () => {
    test("createActionItem, updateActionItem, deleteActionItem", async () => {
      const m = await createMeeting(api, { date: "2025-09-01", meeting_number: 109 });
      const item = await api.meetings.createActionItem(m.id, { description: "Do something" });
      expect(item.id).toBeDefined();
      const updated = await api.meetings.updateActionItem(m.id, item.id, { description: "Updated", status: "completed" });
      expect(updated).not.toBeNull();
      expect(updated!.status).toBe("completed");
      const delOk = await api.meetings.deleteActionItem(m.id, item.id);
      expect(delOk).toBe(true);
    });
  });

  describe("old business", () => {
    test("createOldBusiness, updateOldBusiness, deleteOldBusiness", async () => {
      const m = await createMeeting(api, { date: "2025-10-01", meeting_number: 110 });
      const ob = await api.meetings.createOldBusiness(m.id, { description: "Old item" });
      expect(ob.id).toBeDefined();
      const updated = await api.meetings.updateOldBusiness(m.id, ob.id, { status: "closed" });
      expect(updated).not.toBeNull();
      const delOk = await api.meetings.deleteOldBusiness(m.id, ob.id);
      expect(delOk).toBe(true);
    });
  });

  describe("listMotions", () => {
    test("returns paginated motions", async () => {
      const result = await api.meetings.listMotions({ page: 1, per_page: 10 });
      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("total");
      expect(Array.isArray(result.items)).toBe(true);
    });
  });

  describe("listOldBusiness", () => {
    test("returns old business items", async () => {
      const result = await api.meetings.listOldBusiness();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
