import { describe, test, expect, beforeAll } from "bun:test";
import type { TrpcTestHarness } from "../../test/trpcHarness";
import { createTrpcTestHarness } from "../../test/trpcHarness";
import { UserType } from "@satyrsmc/shared/lib/enums";

const userId = "notif-test-user-1";
const contactId = "notif-contact-1";
const memberId = "notif-member-1";

describe("members.notifications tRPC router", () => {
  let unauthHarness: TrpcTestHarness;
  let userHarness: TrpcTestHarness;
  let listId: string;

  beforeAll(async () => {
    userHarness = await createTrpcTestHarness({
      session: {
        userId,
        userType: UserType.User,
        memberId,
        contactId,
      },
    });
    unauthHarness = userHarness.fork(null);

    // Seed contact, member, user
    await userHarness.ds.query(
      `INSERT INTO contacts (id, display_name, type, status) VALUES ($1, $2, 'person', 'active')`,
      [contactId, "Notif Tester"],
    );
    await userHarness.ds.query(
      `INSERT INTO members (id, contact_id, position) VALUES ($1, $2, 'Member')`,
      [memberId, contactId],
    );
    await userHarness.ds.query(
      `INSERT INTO users (id, contact_id, member_id, username, password_hash, user_type, user_status)
       VALUES ($1, $2, $3, $4, 'fakehash', 'user', 'active')`,
      [userId, contactId, memberId, "notiftester"],
    );

    // Create a mailing list and add the contact to it
    const list = await userHarness.api.mailingLists.create({
      name: "Test Newsletter",
      description: "A test newsletter",
      list_type: "static",
      delivery_type: "email",
    });
    listId = list!.id;
    await userHarness.api.mailingLists.addMember(listId, contactId);
  });

  describe("getPreferences", () => {
    test("rejects unauthenticated request", async () => {
      await expect(unauthHarness.caller.members.notifications.getPreferences()).rejects.toThrow(
        "Authentication required",
      );
    });

    test("returns mailing list subscriptions", async () => {
      const result = await userHarness.caller.members.notifications.getPreferences();
      expect(result.mailing_lists.length).toBeGreaterThanOrEqual(1);
      const sub = result.mailing_lists.find((s) => s.list_id === listId);
      expect(sub).toBeDefined();
      expect(sub!.name).toBe("Test Newsletter");
      expect(sub!.description).toBe("A test newsletter");
      expect(sub!.unsubscribed).toBe(false);
    });
  });

  describe("toggleMailingList", () => {
    test("rejects unauthenticated request", async () => {
      await expect(
        unauthHarness.caller.members.notifications.toggleMailingList({
          list_id: listId,
          unsubscribed: true,
        }),
      ).rejects.toThrow("Authentication required");
    });

    test("unsubscribes from a mailing list", async () => {
      const result = await userHarness.caller.members.notifications.toggleMailingList({
        list_id: listId,
        unsubscribed: true,
      });
      expect(result.success).toBe(true);

      const prefs = await userHarness.caller.members.notifications.getPreferences();
      const sub = prefs.mailing_lists.find((s) => s.list_id === listId);
      expect(sub!.unsubscribed).toBe(true);
    });

    test("resubscribes to a mailing list", async () => {
      const result = await userHarness.caller.members.notifications.toggleMailingList({
        list_id: listId,
        unsubscribed: false,
      });
      expect(result.success).toBe(true);

      const prefs = await userHarness.caller.members.notifications.getPreferences();
      const sub = prefs.mailing_lists.find((s) => s.list_id === listId);
      expect(sub!.unsubscribed).toBe(false);
    });

    test("throws for non-existent membership", async () => {
      await expect(
        userHarness.caller.members.notifications.toggleMailingList({
          list_id: "non-existent-list",
          unsubscribed: true,
        }),
      ).rejects.toThrow();
    });
  });
});
