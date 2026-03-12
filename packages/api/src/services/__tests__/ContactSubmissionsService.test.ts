import { describe, test, expect, beforeAll } from "bun:test";
import { setupTestDb } from "../../test/setup";
import type { Api } from "../api";
import type { DataSource } from "typeorm";
import { createMember } from "./helpers";

describe("ContactSubmissionsService", () => {
  let api: Api;
  let _ds: DataSource;

  beforeAll(async () => {
    const result = await setupTestDb();
    api = result.api;
    _ds = result.ds;
  });

  describe("createContact", () => {
    test("creates contact submission", async () => {
      const result = await api.contactSubmissions.createContact({
        name: "Submitter",
        email: "submit@example.com",
        subject: "Hello",
        message: "Message body",
      });
      expect(result).toHaveProperty("id");
      expect(result.created).toBe(true);
    });

    test("creates without subject", async () => {
      const result = await api.contactSubmissions.createContact({
        name: "No Subject",
        email: "nosubject@example.com",
        message: "Body",
      });
      expect(result.id).toBeDefined();
      expect(result.created).toBe(true);
    });
  });

  describe("createContactMember", () => {
    test("creates contact member submission", async () => {
      const member = await createMember(api, { name: "Contact Member" });
      const result = await api.contactSubmissions.createContactMember({
        member_id: member.id,
        sender_name: "Sender",
        sender_email: "sender@example.com",
        message: "Message to member",
      });
      expect(result.id).toBeDefined();
      expect(result.created).toBe(true);
    });
  });

  describe("listContactSubmissions", () => {
    test("returns submissions", async () => {
      await api.contactSubmissions.createContact({
        name: "List Contact",
        email: "list@example.com",
        message: "M",
      });
      const result = await api.contactSubmissions.listContactSubmissions();
      expect(Array.isArray(result)).toBe(true);
      expect(result.some((s) => s.email === "list@example.com")).toBe(true);
    });
  });

  describe("listContactMemberSubmissions", () => {
    test("returns member submissions", async () => {
      const member = await createMember(api, { name: "List Member Sub" });
      await api.contactSubmissions.createContactMember({
        member_id: member.id,
        sender_name: "S",
        sender_email: "s@example.com",
        message: "M",
      });
      const result = await api.contactSubmissions.listContactMemberSubmissions();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
