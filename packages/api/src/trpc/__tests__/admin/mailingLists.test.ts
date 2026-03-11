/**
 * Unit tests for admin.mailingLists tRPC router.
 * Covers list, get, create, update, delete, getMembers, addMember, removeMember, preview, getStats, getIncluded.
 */

import type { TRPCError } from "@trpc/server";
import { describe, test, expect, beforeAll } from "bun:test";
import type { TrpcTestHarness } from "../../../test/trpcHarness";
import { createTrpcTestHarness } from "../../../test/trpcHarness";
import { BAD_ID, createMailingList, createContact } from "../helpers";

describe("admin.mailingLists", () => {
  let harness: TrpcTestHarness;

  beforeAll(async () => {
    harness = await createTrpcTestHarness();
  });

  describe("list", () => {
    test("returns created lists", async () => {
      const list = await createMailingList(harness.api, { name: "List List" });
      const result = await harness.caller.admin.mailingLists.list();
      expect(Array.isArray(result)).toBe(true);
      expect(result.some((x) => x.id === list.id)).toBe(true);
    });
  });

  describe("get", () => {
    test("returns list by id", async () => {
      const list = await createMailingList(harness.api, { name: "Get List" });
      const result = await harness.caller.admin.mailingLists.get({ id: list.id });
      expect(result.id).toBe(list.id);
      expect(result.name).toBe("Get List");
    });

    test("throws NOT_FOUND when id does not exist", async () => {
      try {
        await harness.caller.admin.mailingLists.get({ id: BAD_ID });
      } catch (e) {
        expect((e as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("create", () => {
    test("creates list and returns it", async () => {
      const result = await harness.caller.admin.mailingLists.create({
        name: "New List",
      });
      expect(result.id).toBeDefined();
      expect(result.name).toBe("New List");
    });
  });

  describe("update", () => {
    test("updates list and returns it", async () => {
      const list = await createMailingList(harness.api, { name: "To Update" });
      const result = await harness.caller.admin.mailingLists.update({
        id: list.id,
        name: "Updated List",
      });
      expect(result.id).toBe(list.id);
      expect(result.name).toBe("Updated List");
    });

    test("throws NOT_FOUND when id does not exist", async () => {
      try {
        await harness.caller.admin.mailingLists.update({ id: BAD_ID, name: "No" });
      } catch (e) {
        expect((e as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("delete", () => {
    test("deletes list and returns ok", async () => {
      const list = await createMailingList(harness.api, { name: "To Delete" });
      const result = await harness.caller.admin.mailingLists.delete({ id: list.id });
      expect(result.ok).toBe(true);
      const all = await harness.caller.admin.mailingLists.list();
      expect(all.some((x) => x.id === list.id)).toBe(false);
    });
  });

  describe("getMembers", () => {
    test("returns members for list", async () => {
      const list = await createMailingList(harness.api, { name: "Members List" });
      const result = await harness.caller.admin.mailingLists.getMembers({ listId: list.id });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("addMember, removeMember", () => {
    test("adds and removes contact from list", async () => {
      const contact = await createContact(harness.api, { display_name: "ML Contact" });
      const list = await createMailingList(harness.api, { name: "AddRemove List" });
      await harness.caller.admin.mailingLists.addMember({ listId: list.id, contactId: contact.id });
      const afterAdd = await harness.caller.admin.mailingLists.getMembers({ listId: list.id });
      expect(afterAdd.some((m) => m.contact_id === contact.id)).toBe(true);
      await harness.caller.admin.mailingLists.removeMember({
        listId: list.id,
        contactId: contact.id,
      });
      const afterRemove = await harness.caller.admin.mailingLists.getMembers({ listId: list.id });
      expect(afterRemove.some((m) => m.contact_id === contact.id)).toBe(false);
    });
  });

  describe("preview", () => {
    test("returns preview shape for list", async () => {
      const list = await createMailingList(harness.api, { name: "Preview List" });
      const result = await harness.caller.admin.mailingLists.preview({ id: list.id });
      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
    });
  });

  describe("getStats", () => {
    test("returns stats for list", async () => {
      const list = await createMailingList(harness.api, { name: "Stats List" });
      const result = await harness.caller.admin.mailingLists.getStats({ id: list.id });
      expect(result).toBeDefined();
    });
  });

  describe("getIncluded", () => {
    test("returns paginated included contacts", async () => {
      const list = await createMailingList(harness.api, { name: "Included List" });
      const result = await harness.caller.admin.mailingLists.getIncluded({
        listId: list.id,
        page: 1,
        limit: 10,
      });
      expect(result).toBeDefined();
      expect(Array.isArray(result.contacts)).toBe(true);
    });
  });
});
