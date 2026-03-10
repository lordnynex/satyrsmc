import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { setupTestDb, teardownTestDb } from "../../test/setup";
import type { Api } from "../api";
import type { DataSource } from "typeorm";
import { BAD_ID, MINIMAL_JPEG_BUFFER, createMember } from "./helpers";

describe("MembersService", () => {
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
    test("returns created members", async () => {
      const m = await createMember(api, { name: "List Member" });
      const result = await api.members.list();
      expect(result.some((e) => e.id === m.id)).toBe(true);
    });
  });

  describe("listForWebsite", () => {
    test("returns only show_on_website members", async () => {
      const m = await createMember(api, { name: "Web Member" });
      await api.members.update(m.id, { show_on_website: true });
      const result = await api.members.listForWebsite();
      expect(result.some((e) => e.id === m.id)).toBe(true);
    });
  });

  describe("get", () => {
    test("returns member by id", async () => {
      const m = await createMember(api, { name: "Get Member" });
      const got = await api.members.get(m.id);
      expect(got).not.toBeNull();
      expect(got!.id).toBe(m.id);
      expect(got!.name).toBe("Get Member");
    });

    test("get(badId) returns null", async () => {
      const result = await api.members.get(BAD_ID);
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    test("creates member", async () => {
      const m = await createMember(api, { name: "New Member" });
      expect(m.id).toBeDefined();
      expect(m.name).toBe("New Member");
    });
  });

  describe("update", () => {
    test("updates member", async () => {
      const m = await createMember(api, { name: "Update Member" });
      const updated = await api.members.update(m.id, { name: "Updated Name" });
      expect(updated).not.toBeNull();
      expect(updated!.name).toBe("Updated Name");
    });

    test("update(badId) returns null", async () => {
      const result = await api.members.update(BAD_ID, { name: "No" });
      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    test("deletes member", async () => {
      const m = await createMember(api, { name: "Delete Member" });
      await api.members.delete(m.id);
      const got = await api.members.get(m.id);
      expect(got).toBeNull();
    });
  });

  describe("getPhoto", () => {
    test("returns buffer when member has photo", async () => {
      const m = await createMember(api, {
        name: "Photo Member",
        photo: MINIMAL_JPEG_BUFFER.toString("base64"),
      } as Record<string, unknown>);
      const thumb = await api.members.getPhoto(m.id, "thumbnail");
      const full = await api.members.getPhoto(m.id, "full");
      expect(thumb).toBeInstanceOf(Buffer);
      expect(full).toBeInstanceOf(Buffer);
    });

    test("getPhoto(badId) returns null", async () => {
      const result = await api.members.getPhoto(BAD_ID, "full");
      expect(result).toBeNull();
    });

    test("getPhoto(id) when no photo returns null", async () => {
      const m = await createMember(api, { name: "No Photo Member" });
      const result = await api.members.getPhoto(m.id, "full");
      expect(result).toBeNull();
    });
  });
});
