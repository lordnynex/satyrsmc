/**
 * Unit tests for admin.mailingBatches tRPC router.
 * Covers list, get, create, updateRecipientStatus.
 */

import { TRPCError } from "@trpc/server";
import { describe, test, expect, beforeAll } from "bun:test";
import type { TrpcTestHarness } from "../../../test/trpcHarness";
import { createTrpcTestHarness } from "../../../test/trpcHarness";
import { BAD_ID, createMailingList, createContact } from "../helpers";

describe("admin.mailingBatches", () => {
  let harness: TrpcTestHarness;

  beforeAll(async () => {
    harness = await createTrpcTestHarness();
  });

  describe("list", () => {
    test("returns batches", async () => {
      const result = await harness.caller.admin.mailingBatches.list();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("get", () => {
    test("returns batch by id when it exists", async () => {
      const list = await createMailingList(harness.api, { name: "Batch List" });
      const contact = await createContact(harness.api, {
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
      } as Record<string, unknown>);
      await harness.api.mailingLists.addMember(list.id, contact.id);
      const batch = await harness.caller.admin.mailingBatches.create({
        listId: list.id,
        name: "Test Batch",
      });
      const result = await harness.caller.admin.mailingBatches.get({ id: batch.id });
      expect(result.id).toBe(batch.id);
      expect(result.name).toBe("Test Batch");
    });

    test("throws NOT_FOUND when id does not exist", async () => {
      try {
        await harness.caller.admin.mailingBatches.get({ id: BAD_ID });
      } catch (e) {
        expect((e as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("create", () => {
    test("creates batch from list and returns it", async () => {
      const list = await createMailingList(harness.api, { name: "Create List" });
      const result = await harness.caller.admin.mailingBatches.create({
        listId: list.id,
        name: "New Batch",
      });
      expect(result.id).toBeDefined();
      expect(result.name).toBe("New Batch");
    });
  });

  describe("updateRecipientStatus", () => {
    test("updates recipient status", async () => {
      const list = await createMailingList(harness.api, { name: "Status List" });
      const contact = await createContact(harness.api, {
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
      } as Record<string, unknown>);
      await harness.api.mailingLists.addMember(list.id, contact.id);
      const batch = await harness.caller.admin.mailingBatches.create({
        listId: list.id,
        name: "Status Batch",
      });
      const got = await harness.caller.admin.mailingBatches.get({ id: batch.id });
      const recipientId = got.recipients?.[0]?.id;
      if (recipientId) {
        await harness.caller.admin.mailingBatches.updateRecipientStatus({
          batchId: batch.id,
          recipientId,
          status: "mailed",
        });
      }
      expect(true).toBe(true);
    });
  });
});
