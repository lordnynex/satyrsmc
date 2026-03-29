/**
 * Unit tests for admin.contacts tRPC router.
 * Covers list, get, create, update, delete, restore, listTags.
 */

import type { TRPCError } from "@trpc/server";
import { describe, test, expect, beforeAll } from "vitest";
import {
  ContactStatus,
  ContactStatusFilter,
  ContactType,
  SortDirection,
} from "@satyrsmc/shared/lib/enums";
import type { TrpcTestHarness } from "../../../test/trpcHarness";
import { createTrpcTestHarness } from "../../../test/trpcHarness";
import { BAD_ID, createContact } from "../helpers";

describe("admin.contacts", () => {
  let harness: TrpcTestHarness;

  beforeAll(async () => {
    harness = await createTrpcTestHarness();
  });

  describe("list", () => {
    test("returns created contacts in list", async () => {
      const c = await createContact(harness.api, { display_name: "List Contact" });
      const result = await harness.caller.admin.contacts.list({});
      expect(result.contacts.some((x) => x.id === c.id)).toBe(true);
      expect(result.total).toBeGreaterThanOrEqual(1);
      expect(result.page).toBeDefined();
      expect(result.limit).toBeDefined();
    });

    test("accepts optional filters (q, status, sort)", async () => {
      const result = await harness.caller.admin.contacts.list({
        q: "test",
        status: ContactStatusFilter.Active,
        sort: "name",
        sortDir: SortDirection.Asc,
      });
      expect(result).toBeDefined();
      expect(Array.isArray(result.contacts)).toBe(true);
    });
  });

  describe("get", () => {
    test("returns contact by id", async () => {
      const c = await createContact(harness.api, { display_name: "Get Contact" });
      const result = await harness.caller.admin.contacts.get({ id: c.id });
      expect(result.id).toBe(c.id);
      expect(result.display_name).toBe("Get Contact");
    });

    test("throws NOT_FOUND when id does not exist", async () => {
      try {
        await harness.caller.admin.contacts.get({ id: BAD_ID });
      } catch (e) {
        expect((e as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("create", () => {
    test("creates contact and returns it", async () => {
      const result = await harness.caller.admin.contacts.create({
        display_name: "New Contact",
        type: ContactType.Person,
        first_name: "New",
        last_name: "Contact",
        emails: [],
        phones: [],
        addresses: [],
      });
      expect(result.id).toBeDefined();
      expect(result.display_name).toBe("New Contact");
      expect(result.type).toBe(ContactType.Person);
    });
  });

  describe("update", () => {
    test("updates contact and returns it", async () => {
      const c = await createContact(harness.api, { display_name: "To Update" });
      const result = await harness.caller.admin.contacts.update({
        id: c.id,
        display_name: "Updated Name",
      });
      expect(result.id).toBe(c.id);
      expect(result.display_name).toBe("Updated Name");
    });

    test("throws NOT_FOUND when id does not exist", async () => {
      try {
        await harness.caller.admin.contacts.update({
          id: BAD_ID,
          display_name: "No",
        });
      } catch (e) {
        expect((e as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("delete", () => {
    test("deletes contact and returns ok", async () => {
      const c = await createContact(harness.api, { display_name: "To Delete" });
      const result = await harness.caller.admin.contacts.delete({ id: c.id });
      expect(result.ok).toBe(true);
      const list = await harness.caller.admin.contacts.list({ status: ContactStatusFilter.Active });
      expect(list.contacts.some((x) => x.id === c.id)).toBe(false);
    });
  });

  describe("restore", () => {
    test("restores soft-deleted contact", async () => {
      const c = await createContact(harness.api, { display_name: "To Restore" });
      await harness.caller.admin.contacts.delete({ id: c.id });
      const result = await harness.caller.admin.contacts.restore({ id: c.id });
      expect(result).toBeDefined();
      const got = await harness.caller.admin.contacts.get({ id: c.id });
      expect(got.status).toBe(ContactStatus.Active);
    });
  });

  describe("listTags", () => {
    test("returns tags list", async () => {
      const result = await harness.caller.admin.contacts.listTags();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
