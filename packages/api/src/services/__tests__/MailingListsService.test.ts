import { describe, test, expect, beforeAll } from "bun:test";
import { setupTestDb } from "../../test/setup";
import type { Api } from "../api";
import type { DataSource } from "typeorm";
import { BAD_ID, createContact, createMailingList } from "./helpers";

describe("MailingListsService", () => {
  let api: Api;
  let ds: DataSource;

  beforeAll(async () => {
    const result = await setupTestDb();
    api = result.api;
    ds = result.ds;
  });

  describe("list", () => {
    test("returns created lists", async () => {
      const list = await createMailingList(api, { name: "List Test" });
      const result = await api.mailingLists.list();
      expect(result.some((l) => l.id === list.id)).toBe(true);
    });
  });

  describe("get", () => {
    test("returns list by id", async () => {
      const list = await createMailingList(api, { name: "Get List" });
      const got = await api.mailingLists.get(list.id);
      expect(got).not.toBeNull();
      expect(got!.id).toBe(list.id);
      expect(got!.name).toBe("Get List");
    });

    test("get(badId) returns null", async () => {
      const result = await api.mailingLists.get(BAD_ID);
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    test("creates static list", async () => {
      const list = await createMailingList(api, { name: "Static List", list_type: "static" });
      expect(list.list_type).toBe("static");
    });

    test("creates dynamic list", async () => {
      const list = await createMailingList(api, { name: "Dynamic List", list_type: "dynamic" });
      expect(list.list_type).toBe("dynamic");
    });
  });

  describe("update", () => {
    test("updates list", async () => {
      const list = await createMailingList(api, { name: "Update List" });
      const updated = await api.mailingLists.update(list.id, { name: "Updated Name" });
      expect(updated).not.toBeNull();
      expect(updated!.name).toBe("Updated Name");
    });

    test("update(badId) returns null", async () => {
      const result = await api.mailingLists.update(BAD_ID, { name: "No" });
      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    test("deletes list", async () => {
      const list = await createMailingList(api, { name: "Delete List" });
      await api.mailingLists.delete(list.id);
      const got = await api.mailingLists.get(list.id);
      expect(got).toBeNull();
    });
  });

  describe("addMember, removeMember", () => {
    test("addMember and removeMember", async () => {
      const contact = await createContact(api, { display_name: "ML Contact" });
      const list = await createMailingList(api, { name: "Member List" });
      const afterAdd = await api.mailingLists.addMember(list.id, contact.id);
      expect(afterAdd).not.toBeNull();
      const members = await api.mailingLists.getMembers(list.id);
      expect(members.some((m) => m.contact_id === contact.id)).toBe(true);
      await api.mailingLists.removeMember(list.id, contact.id);
      const afterRemove = await api.mailingLists.getMembers(list.id);
      expect(afterRemove.some((m) => m.contact_id === contact.id)).toBe(false);
    });

    test("addMember(badListId) returns null or throws", async () => {
      const contact = await createContact(api, { display_name: "Bad List Contact" });
      const result = await api.mailingLists.addMember(BAD_ID, contact.id);
      expect(result).toBeNull();
    });
  });

  describe("addMembersBulk", () => {
    test("adds multiple contacts", async () => {
      const c1 = await createContact(api, { display_name: "Bulk 1" });
      const c2 = await createContact(api, { display_name: "Bulk 2" });
      const list = await createMailingList(api, { name: "Bulk List" });
      await api.mailingLists.addMembersBulk(list.id, [c1.id, c2.id]);
      const members = await api.mailingLists.getMembers(list.id);
      expect(members.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("preview", () => {
    test("returns shape with included, excluded, totals", async () => {
      const list = await createMailingList(api, { name: "Preview List" });
      const preview = await api.mailingLists.preview(list.id);
      expect(preview).toHaveProperty("included");
      expect(preview).toHaveProperty("excluded");
      expect(preview).toHaveProperty("totalIncluded");
      expect(preview).toHaveProperty("totalExcluded");
    });

    test("preview(badId) returns empty shape", async () => {
      const preview = await api.mailingLists.preview(BAD_ID);
      expect(preview.totalIncluded).toBe(0);
      expect(preview.included).toEqual([]);
    });
  });

  describe("getStats", () => {
    test("returns stats for list", async () => {
      const list = await createMailingList(api, { name: "Stats List" });
      const stats = await api.mailingLists.getStats(list.id);
      expect(stats).toHaveProperty("duplicateAddresses");
      expect(stats.duplicateAddresses).toHaveProperty("totalDuplicateContacts");
      expect(stats.duplicateAddresses).toHaveProperty("groups");
    });
  });

  describe("getIncludedPaginated", () => {
    test("returns paginated included contacts", async () => {
      const list = await createMailingList(api, { name: "Paginated List" });
      const page = await api.mailingLists.getIncludedPaginated(list.id, 1, 10);
      expect(page).toHaveProperty("contacts");
      expect(page).toHaveProperty("total");
      expect(Array.isArray(page.contacts)).toBe(true);
    });
  });
});
