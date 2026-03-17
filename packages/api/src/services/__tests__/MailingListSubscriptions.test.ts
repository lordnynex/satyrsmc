import { describe, test, expect, beforeAll } from "bun:test";
import { setupTestDb } from "../../test/setup";
import type { Api } from "../api";
import type { DataSource } from "typeorm";
import { createContact, createMailingList } from "./helpers";

describe("MailingListsService — member subscriptions", () => {
  let api: Api;
  let ds: DataSource;

  beforeAll(async () => {
    const result = await setupTestDb();
    api = result.api;
    ds = result.ds;
  });

  describe("getSubscriptionsForContact", () => {
    test("returns empty array when contact has no memberships", async () => {
      const contact = await createContact(api, { display_name: "No Lists" });
      const subs = await api.mailingLists.getSubscriptionsForContact(contact.id);
      expect(subs).toEqual([]);
    });

    test("returns subscriptions with list details", async () => {
      const contact = await createContact(api, { display_name: "Sub User" });
      const list = await createMailingList(api, { name: "Club News" });
      await api.mailingLists.addMember(list.id, contact.id);

      const subs = await api.mailingLists.getSubscriptionsForContact(contact.id);
      expect(subs.length).toBeGreaterThanOrEqual(1);
      const sub = subs.find((s) => s.list_id === list.id);
      expect(sub).toBeDefined();
      expect(sub!.name).toBe("Club News");
      expect(sub!.unsubscribed).toBe(false);
    });

    test("reflects unsubscribed status", async () => {
      const contact = await createContact(api, { display_name: "Unsub User" });
      const list = await createMailingList(api, { name: "Unsub Test List" });
      await api.mailingLists.addMember(list.id, contact.id);
      await api.mailingLists.setUnsubscribed(contact.id, list.id, true);

      const subs = await api.mailingLists.getSubscriptionsForContact(contact.id);
      const sub = subs.find((s) => s.list_id === list.id);
      expect(sub).toBeDefined();
      expect(sub!.unsubscribed).toBe(true);
    });

    test("excludes suppressed memberships", async () => {
      const contact = await createContact(api, { display_name: "Suppressed User" });
      const list = await createMailingList(api, { name: "Suppressed List" });
      await api.mailingLists.addMember(list.id, contact.id);

      // Directly suppress via query (admin action, no member-facing method)
      await ds.query(
        `UPDATE mailing_list_members SET suppressed = true, suppress_reason = 'test' WHERE list_id = $1 AND contact_id = $2`,
        [list.id, contact.id],
      );

      const subs = await api.mailingLists.getSubscriptionsForContact(contact.id);
      const sub = subs.find((s) => s.list_id === list.id);
      expect(sub).toBeUndefined();
    });

    test("returns multiple list subscriptions", async () => {
      const contact = await createContact(api, { display_name: "Multi List User" });
      const list1 = await createMailingList(api, { name: "Alpha List" });
      const list2 = await createMailingList(api, { name: "Beta List" });
      await api.mailingLists.addMember(list1.id, contact.id);
      await api.mailingLists.addMember(list2.id, contact.id);

      const subs = await api.mailingLists.getSubscriptionsForContact(contact.id);
      const ids = subs.map((s) => s.list_id);
      expect(ids).toContain(list1.id);
      expect(ids).toContain(list2.id);
    });
  });

  describe("setUnsubscribed", () => {
    test("unsubscribes from a mailing list", async () => {
      const contact = await createContact(api, { display_name: "Toggle User" });
      const list = await createMailingList(api, { name: "Toggle List" });
      await api.mailingLists.addMember(list.id, contact.id);

      const result = await api.mailingLists.setUnsubscribed(contact.id, list.id, true);
      expect(result.success).toBe(true);

      const subs = await api.mailingLists.getSubscriptionsForContact(contact.id);
      const sub = subs.find((s) => s.list_id === list.id);
      expect(sub!.unsubscribed).toBe(true);
    });

    test("resubscribes to a mailing list", async () => {
      const contact = await createContact(api, { display_name: "Resub User" });
      const list = await createMailingList(api, { name: "Resub List" });
      await api.mailingLists.addMember(list.id, contact.id);
      await api.mailingLists.setUnsubscribed(contact.id, list.id, true);

      const result = await api.mailingLists.setUnsubscribed(contact.id, list.id, false);
      expect(result.success).toBe(true);

      const subs = await api.mailingLists.getSubscriptionsForContact(contact.id);
      const sub = subs.find((s) => s.list_id === list.id);
      expect(sub!.unsubscribed).toBe(false);
    });

    test("throws when membership does not exist", async () => {
      const contact = await createContact(api, { display_name: "No Membership" });
      const list = await createMailingList(api, { name: "No Membership List" });

      expect(api.mailingLists.setUnsubscribed(contact.id, list.id, true)).rejects.toThrow(
        "Mailing list membership not found",
      );
    });

    test("throws when membership is suppressed", async () => {
      const contact = await createContact(api, { display_name: "Suppressed Toggle" });
      const list = await createMailingList(api, { name: "Suppressed Toggle List" });
      await api.mailingLists.addMember(list.id, contact.id);

      await ds.query(
        `UPDATE mailing_list_members SET suppressed = true WHERE list_id = $1 AND contact_id = $2`,
        [list.id, contact.id],
      );

      expect(api.mailingLists.setUnsubscribed(contact.id, list.id, true)).rejects.toThrow(
        "Mailing list membership not found",
      );
    });
  });
});
