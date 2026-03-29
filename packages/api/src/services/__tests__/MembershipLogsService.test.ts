import { describe, test, expect, beforeAll } from "vitest";
import { setupTestDb } from "../../test/setup";
import type { Api } from "../api";
import { MembershipMessageCode } from "@satyrsmc/shared/lib/enums";

function uid(): string {
  return crypto.randomUUID();
}

describe("MembershipLogsService", () => {
  let api: Api;

  beforeAll(async () => {
    const result = await setupTestDb();
    api = result.api;
  });

  describe("create", () => {
    test("creates a membership log with logged_by", async () => {
      const subjectId = uid();
      const adminId = uid();

      const log = await api.membershipLogs.create(
        {
          user_id: subjectId,
          message_code: MembershipMessageCode.AccountCreated,
        },
        adminId,
      );

      expect(log.id).toBeDefined();
      expect(log.user_id).toBe(subjectId);
      expect(log.logged_by).toBe(adminId);
      expect(log.message_code).toBe(MembershipMessageCode.AccountCreated);
      expect(log.message).toBeNull();
      expect(log.created_at).toBeDefined();
    });

    test("creates a membership log with null logged_by (system action)", async () => {
      const userId = uid();
      const log = await api.membershipLogs.create(
        {
          user_id: userId,
          message_code: MembershipMessageCode.DuesPaid,
        },
        null,
      );

      expect(log.logged_by).toBeNull();
    });

    test("creates a membership log with optional message", async () => {
      const userId = uid();
      const log = await api.membershipLogs.create(
        {
          user_id: userId,
          message_code: MembershipMessageCode.OfficeAdded,
          message: "Elected as Treasurer",
        },
        null,
      );

      expect(log.message).toBe("Elected as Treasurer");
    });
  });

  describe("list", () => {
    test("returns entries for a user ordered by created_at DESC", async () => {
      const userId = uid();
      await api.membershipLogs.create(
        { user_id: userId, message_code: MembershipMessageCode.AccountCreated },
        null,
      );
      await api.membershipLogs.create(
        { user_id: userId, message_code: MembershipMessageCode.MembershipGranted },
        null,
      );

      const result = await api.membershipLogs.list({ user_id: userId });
      expect(result.items.length).toBeGreaterThanOrEqual(2);
      const dates = result.items.map((i) => new Date(i.created_at).getTime());
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]!);
      }
    });

    test("only returns logs for the specified user", async () => {
      const user1 = uid();
      const user2 = uid();
      await api.membershipLogs.create(
        { user_id: user1, message_code: MembershipMessageCode.AccountCreated },
        null,
      );
      await api.membershipLogs.create(
        { user_id: user2, message_code: MembershipMessageCode.AccountCreated },
        null,
      );

      const result = await api.membershipLogs.list({ user_id: user1 });
      expect(result.items.every((i: { user_id: string }) => i.user_id === user1)).toBe(true);
    });

    test("paginates correctly", async () => {
      const userId = uid();
      for (let i = 0; i < 5; i++) {
        await api.membershipLogs.create(
          {
            user_id: userId,
            message_code: MembershipMessageCode.DuesPaid,
            message: `Payment ${i}`,
          },
          null,
        );
      }

      const page1 = await api.membershipLogs.list({
        user_id: userId,
        page: 1,
        per_page: 2,
      });
      expect(page1.items.length).toBe(2);
      expect(page1.total).toBeGreaterThanOrEqual(5);

      const page2 = await api.membershipLogs.list({
        user_id: userId,
        page: 2,
        per_page: 2,
      });
      expect(page2.items.length).toBe(2);
      expect(page2.items[0]!.id).not.toBe(page1.items[0]!.id);
    });

    test("returns empty for user with no logs", async () => {
      const userId = uid();
      const result = await api.membershipLogs.list({ user_id: userId });
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});
