import { describe, test, expect, beforeAll } from "bun:test";
import type { TrpcTestHarness } from "../../test/trpcHarness";
import { createTrpcTestHarness } from "../../test/trpcHarness";
import { UserType, ActivityMessageCode } from "@satyrsmc/shared/lib/enums";

describe("members.activityLogs tRPC router", () => {
  let unauthHarness: TrpcTestHarness;
  let user1Harness: TrpcTestHarness;
  let user2Harness: TrpcTestHarness;

  const user1Id = "member-al-user-1";
  const user2Id = "member-al-user-2";

  beforeAll(async () => {
    unauthHarness = await createTrpcTestHarness();

    user1Harness = await createTrpcTestHarness({
      session: {
        userId: user1Id,
        userType: UserType.User,
        memberId: "member-1",
        contactId: "contact-al-1",
      },
    });

    user2Harness = await createTrpcTestHarness({
      session: {
        userId: user2Id,
        userType: UserType.User,
        memberId: "member-2",
        contactId: "contact-al-2",
      },
    });

    // Seed activity logs for both users via the service directly
    await user1Harness.api.activityLogs.create({
      user_id: user1Id,
      message_code: ActivityMessageCode.Joined,
    });
    await user1Harness.api.activityLogs.create({
      user_id: user1Id,
      message_code: ActivityMessageCode.EventAttended,
      reference_id: "event-1",
      reference_type: "event",
    });
    await user1Harness.api.activityLogs.create({
      user_id: user2Id,
      message_code: ActivityMessageCode.Joined,
    });
  });

  describe("list", () => {
    test("rejects unauthenticated request", async () => {
      await expect(unauthHarness.caller.members.activityLogs.list()).rejects.toThrow(
        "Authentication required",
      );
    });

    test("returns only the authenticated user's logs", async () => {
      const result = await user1Harness.caller.members.activityLogs.list();

      expect(result.items.length).toBeGreaterThanOrEqual(2);
      expect(result.items.every((i: { user_id: string }) => i.user_id === user1Id)).toBe(true);
    });

    test("user2 only sees their own logs", async () => {
      const result = await user2Harness.caller.members.activityLogs.list();

      expect(result.items.length).toBeGreaterThanOrEqual(1);
      expect(result.items.every((i: { user_id: string }) => i.user_id === user2Id)).toBe(true);
    });

    test("respects pagination", async () => {
      const result = await user1Harness.caller.members.activityLogs.list({
        page: 1,
        per_page: 1,
      });

      expect(result.items.length).toBe(1);
      expect(result.page).toBe(1);
      expect(result.per_page).toBe(1);
      expect(result.total).toBeGreaterThanOrEqual(2);
    });

    test("returns correct structure", async () => {
      const result = await user1Harness.caller.members.activityLogs.list();

      expect(typeof result.total).toBe("number");
      expect(typeof result.page).toBe("number");
      expect(typeof result.per_page).toBe("number");
      expect(Array.isArray(result.items)).toBe(true);

      const item = result.items[0]!;
      expect(typeof item.id).toBe("string");
      expect(typeof item.user_id).toBe("string");
      expect(typeof item.message_code).toBe("string");
      expect(typeof item.created_at).toBe("string");
    });

    test("default pagination values applied", async () => {
      const result = await user1Harness.caller.members.activityLogs.list();
      expect(result.page).toBe(1);
      expect(result.per_page).toBe(20);
    });
  });
});
