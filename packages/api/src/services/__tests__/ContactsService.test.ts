import { describe, test, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { setupTestDb, teardownTestDb, resetTestDb, getTestApi } from "../../test/setup";
import type { Api } from "../api";

describe("ContactsService", () => {
  let api: Api;

  beforeAll(async () => {
    const result = await setupTestDb();
    api = result.api;
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await resetTestDb();
  });

  describe("create", () => {
    test("creates a contact and returns it", async () => {
      const contact = await api.contacts.create({
        display_name: "John Doe",
        type: "person",
        first_name: "John",
        last_name: "Doe",
      });

      expect(contact.id).toBeDefined();
      expect(contact.display_name).toBe("John Doe");
      expect(contact.first_name).toBe("John");
      expect(contact.last_name).toBe("Doe");
      expect(contact.type).toBe("person");
      expect(contact.status).toBe("active");
      expect(contact.created_at).toBeDefined();
      expect(typeof contact.created_at).toBe("string");
    });
  });

  describe("list", () => {
    test("returns contacts list", async () => {
      await api.contacts.create({ display_name: "Alice" });
      await api.contacts.create({ display_name: "Bob" });

      const result = await api.contacts.list({});
      expect(result.contacts.length).toBe(2);
    });

    test("filters by search query (case-insensitive)", async () => {
      await api.contacts.create({ display_name: "Alice Smith" });
      await api.contacts.create({ display_name: "Bob Jones" });

      const result = await api.contacts.list({ q: "alice" });
      expect(result.contacts.length).toBe(1);
      expect(result.contacts[0]?.display_name).toBe("Alice Smith");
    });
  });

  describe("get", () => {
    test("returns a contact by id", async () => {
      const created = await api.contacts.create({ display_name: "Jane" });
      const contact = await api.contacts.get(created.id);

      expect(contact.id).toBe(created.id);
      expect(contact.display_name).toBe("Jane");
    });
  });

  describe("delete", () => {
    test("soft-deletes a contact", async () => {
      const created = await api.contacts.create({ display_name: "ToDelete" });
      await api.contacts.delete(created.id);

      const result = await api.contacts.list({});
      expect(result.contacts.length).toBe(0);
    });
  });

  describe("date serialization", () => {
    test("returns dates as ISO strings, not Date objects", async () => {
      const contact = await api.contacts.create({ display_name: "DateTest" });
      expect(typeof contact.created_at).toBe("string");
      if (contact.created_at) {
        expect(new Date(contact.created_at).toISOString()).toBe(contact.created_at);
      }
    });
  });

  describe("boolean fields", () => {
    test("returns booleans correctly", async () => {
      const contact = await api.contacts.create({
        display_name: "BoolTest",
        do_not_contact: true,
      });
      expect(contact.do_not_contact).toBe(true);
    });
  });
});
