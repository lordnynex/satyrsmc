import { describe, test, expect, beforeAll } from "bun:test";
import { setupTestDb } from "../../test/setup";
import type { Api } from "../api";
import type { DataSource } from "typeorm";
import { BAD_ID, createContact, createMailingList } from "./helpers";

describe("MailingBatchesService", () => {
  let api: Api;
  let _ds: DataSource;

  beforeAll(async () => {
    const result = await setupTestDb();
    api = result.api;
    _ds = result.ds;
  });

  describe("create", () => {
    test("creates batch from list", async () => {
      const list = await createMailingList(api, { name: "Batch List" });
      const batch = await api.mailingBatches.create(list.id, "Batch Name");
      expect(batch).not.toBeNull();
      expect(batch!.list_id).toBe(list.id);
      expect(batch!.name).toBe("Batch Name");
    });

    test("create(badListId) returns null", async () => {
      const result = await api.mailingBatches.create(BAD_ID, "No");
      expect(result).toBeNull();
    });
  });

  describe("get", () => {
    test("returns batch with recipients", async () => {
      const contact = await createContact(api, {
        display_name: "Batch Contact",
        addresses: [
          {
            address_line1: "1 St",
            city: "City",
            country: "US",
            type: "home",
            is_primary_mailing: true,
          },
        ],
      });
      const list = await createMailingList(api, { name: "Get Batch List" });
      await api.mailingLists.addMember(list.id, contact.id);
      const batch = await api.mailingBatches.create(list.id, "Get Batch");
      expect(batch).not.toBeNull();
      const got = await api.mailingBatches.get(batch!.id);
      expect(got).not.toBeNull();
      expect(got!.recipients).toBeDefined();
      expect(Array.isArray(got!.recipients)).toBe(true);
    });

    test("get(badId) returns null", async () => {
      const result = await api.mailingBatches.get(BAD_ID);
      expect(result).toBeNull();
    });
  });

  describe("list", () => {
    test("returns batches", async () => {
      const list = await createMailingList(api, { name: "List Batch List" });
      await api.mailingBatches.create(list.id, "List Batch");
      const result = await api.mailingBatches.list();
      expect(result.some((b) => b.name === "List Batch")).toBe(true);
    });
  });

  describe("updateRecipientStatus", () => {
    test("updates recipient status", async () => {
      const contact = await createContact(api, {
        display_name: "Status Contact",
        addresses: [
          {
            address_line1: "2 St",
            city: "Town",
            country: "US",
            type: "home",
            is_primary_mailing: true,
          },
        ],
      });
      const list = await createMailingList(api, { name: "Status List" });
      await api.mailingLists.addMember(list.id, contact.id);
      const batch = await api.mailingBatches.create(list.id, "Status Batch");
      expect(batch).not.toBeNull();
      const recipientId = batch!.recipients?.[0]?.id;
      if (recipientId) {
        await api.mailingBatches.updateRecipientStatus(batch!.id, recipientId, "mailed");
        const got = await api.mailingBatches.get(batch!.id);
        const rec = got?.recipients?.find((r) => r.id === recipientId);
        expect(rec?.status).toBe("mailed");
      }
    });
  });
});
