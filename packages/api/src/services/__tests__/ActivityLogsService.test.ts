import { describe, test, expect, beforeAll } from "vitest";
import { setupTestDb } from "../../test/setup";
import type { Api } from "../api";
import { ActivityMessageCode } from "@satyrsmc/shared/lib/enums";

function uid(): string {
  return crypto.randomUUID();
}

describe("ActivityLogsService", () => {
  let api: Api;

  beforeAll(async () => {
    const result = await setupTestDb();
    api = result.api;
  });

  describe("create", () => {
    test("creates an activity log entry", async () => {
      const userId = uid();
      const log = await api.activityLogs.create({
        user_id: userId,
        message_code: ActivityMessageCode.Joined,
      });

      expect(log.id).toBeDefined();
      expect(log.user_id).toBe(userId);
      expect(log.message_code).toBe(ActivityMessageCode.Joined);
      expect(log.reference_id).toBeNull();
      expect(log.reference_type).toBeNull();
      expect(log.created_at).toBeDefined();
    });

    test("creates entry with reference_id and reference_type", async () => {
      const userId = uid();
      const log = await api.activityLogs.create({
        user_id: userId,
        message_code: ActivityMessageCode.EventAttended,
        reference_id: "event-123",
        reference_type: "event",
      });

      expect(log.reference_id).toBe("event-123");
      expect(log.reference_type).toBe("event");
    });
  });

  describe("list", () => {
    test("returns entries ordered by created_at DESC", async () => {
      const userId = uid();
      await api.activityLogs.create({
        user_id: userId,
        message_code: ActivityMessageCode.Joined,
      });
      await api.activityLogs.create({
        user_id: userId,
        message_code: ActivityMessageCode.RunLed,
      });

      const result = await api.activityLogs.list({ user_id: userId });
      expect(result.items.length).toBeGreaterThanOrEqual(2);
      const dates = result.items.map((i) => new Date(i.created_at).getTime());
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]!);
      }
    });

    test("filters by user_id", async () => {
      const user1 = uid();
      const user2 = uid();
      await api.activityLogs.create({
        user_id: user1,
        message_code: ActivityMessageCode.Joined,
      });
      await api.activityLogs.create({
        user_id: user2,
        message_code: ActivityMessageCode.Joined,
      });

      const result = await api.activityLogs.list({ user_id: user1 });
      expect(result.items.every((i: { user_id: string }) => i.user_id === user1)).toBe(true);
    });

    test("paginates correctly", async () => {
      const userId = uid();
      for (let i = 0; i < 5; i++) {
        await api.activityLogs.create({
          user_id: userId,
          message_code: ActivityMessageCode.EventAttended,
          reference_id: `event-${i}`,
          reference_type: "event",
        });
      }

      const page1 = await api.activityLogs.list({
        user_id: userId,
        page: 1,
        per_page: 2,
      });
      expect(page1.items.length).toBe(2);
      expect(page1.page).toBe(1);
      expect(page1.per_page).toBe(2);
      expect(page1.total).toBeGreaterThanOrEqual(5);

      const page2 = await api.activityLogs.list({
        user_id: userId,
        page: 2,
        per_page: 2,
      });
      expect(page2.items.length).toBe(2);
      expect(page2.items[0]!.id).not.toBe(page1.items[0]!.id);
    });

    test("returns empty items for user with no logs", async () => {
      const userId = uid();
      const result = await api.activityLogs.list({ user_id: userId });
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    test("returns all entries when no user_id filter", async () => {
      const result = await api.activityLogs.list();
      expect(result.items).toBeDefined();
      expect(result.total).toBeGreaterThanOrEqual(0);
    });
  });
});
