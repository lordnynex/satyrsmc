import { describe, test, expect, beforeAll } from "bun:test";
import { setupTestDb } from "../../test/setup";
import type { Api } from "../api";
import type { DataSource } from "typeorm";
import { BAD_ID, createMeetingTemplate } from "./helpers";

describe("MeetingTemplatesService", () => {
  let api: Api;
  let ds: DataSource;

  beforeAll(async () => {
    const result = await setupTestDb();
    api = result.api;
    ds = result.ds;
  });

  describe("list", () => {
    test("returns created templates", async () => {
      const t = await createMeetingTemplate(api, { name: "List Template", type: "agenda" });
      if (!t) throw new Error("createMeetingTemplate failed");
      const result = await api.meetingTemplates.list();
      expect(result.some((e) => e.id === t.id)).toBe(true);
    });

    test("filters by type", async () => {
      const t = await createMeetingTemplate(api, { name: "Agenda Only", type: "agenda" });
      if (!t) throw new Error("createMeetingTemplate failed");
      const result = await api.meetingTemplates.list("agenda");
      expect(result.some((e) => e.id === t.id)).toBe(true);
    });
  });

  describe("get", () => {
    test("returns template by id", async () => {
      const t = await createMeetingTemplate(api, { name: "Get Template", content: "Content" });
      if (!t) throw new Error("createMeetingTemplate failed");
      const got = await api.meetingTemplates.get(t.id);
      expect(got).not.toBeNull();
      expect(got!.id).toBe(t.id);
      expect(got!.content).toBe("Content");
    });

    test("get(badId) returns null", async () => {
      const result = await api.meetingTemplates.get(BAD_ID);
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    test("creates template", async () => {
      const t = await createMeetingTemplate(api, { name: "New Template", type: "minutes", content: "Text" });
      if (!t) throw new Error("createMeetingTemplate failed");
      expect(t.id).toBeDefined();
      expect(t.name).toBe("New Template");
      expect(t.type).toBe("minutes");
    });
  });

  describe("update", () => {
    test("updates template", async () => {
      const t = await createMeetingTemplate(api, { name: "Update Template" });
      if (!t) throw new Error("createMeetingTemplate failed");
      const updated = await api.meetingTemplates.update(t.id, { name: "Updated", type: "minutes" });
      expect(updated).not.toBeNull();
      expect(updated!.name).toBe("Updated");
      expect(updated!.type).toBe("minutes");
    });

    test("update(badId) returns null", async () => {
      const result = await api.meetingTemplates.update(BAD_ID, { name: "No" });
      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    test("deletes template", async () => {
      const t = await createMeetingTemplate(api, { name: "Delete Template" });
      if (!t) throw new Error("createMeetingTemplate failed");
      await api.meetingTemplates.delete(t.id);
      const got = await api.meetingTemplates.get(t.id);
      expect(got).toBeNull();
    });
  });
});
