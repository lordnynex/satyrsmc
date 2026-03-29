import { describe, test, expect, beforeAll } from "vitest";
import type { TrpcTestHarness } from "../../../test/trpcHarness";
import { createTrpcTestHarness } from "../../../test/trpcHarness";
import { UserType, ActivityMessageCode } from "@satyrsmc/shared/lib/enums";

describe("admin.activityLogs", () => {
  let adminHarness: TrpcTestHarness;
  let unauthHarness: TrpcTestHarness;
  let userHarness: TrpcTestHarness;

  beforeAll(async () => {
    adminHarness = await createTrpcTestHarness({
      session: {
        userId: "admin-1",
        userType: UserType.Admin,
        memberId: null,
        contactId: "contact-admin",
      },
    });
    unauthHarness = await createTrpcTestHarness();
    userHarness = await createTrpcTestHarness({
      session: {
        userId: "user-1",
        userType: UserType.User,
        memberId: null,
        contactId: "contact-user",
      },
    });
  });

  describe("list", () => {
    test("rejects unauthenticated request", async () => {
      await expect(unauthHarness.caller.admin.activityLogs.list()).rejects.toThrow(
        "Authentication required",
      );
    });

    test("rejects regular user", async () => {
      await expect(userHarness.caller.admin.activityLogs.list()).rejects.toThrow(
        "Admin access required",
      );
    });

    test("returns paginated results for admin", async () => {
      const result = await adminHarness.caller.admin.activityLogs.list();
      expect(result).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(typeof result.total).toBe("number");
      expect(typeof result.page).toBe("number");
      expect(typeof result.per_page).toBe("number");
    });

    test("filters by user_id", async () => {
      const userId = crypto.randomUUID();
      await adminHarness.caller.admin.activityLogs.create({
        user_id: userId,
        message_code: ActivityMessageCode.Joined,
      });
      await adminHarness.caller.admin.activityLogs.create({
        user_id: crypto.randomUUID(),
        message_code: ActivityMessageCode.Joined,
      });

      const result = await adminHarness.caller.admin.activityLogs.list({ user_id: userId });
      expect(result.items.every((i: { user_id: string }) => i.user_id === userId)).toBe(true);
    });

    test("accepts page and per_page", async () => {
      const result = await adminHarness.caller.admin.activityLogs.list({
        page: 1,
        per_page: 5,
      });
      expect(result.page).toBe(1);
      expect(result.per_page).toBe(5);
    });
  });

  describe("create", () => {
    test("rejects unauthenticated request", async () => {
      await expect(
        unauthHarness.caller.admin.activityLogs.create({
          user_id: "u1",
          message_code: ActivityMessageCode.Joined,
        }),
      ).rejects.toThrow("Authentication required");
    });

    test("rejects regular user", async () => {
      await expect(
        userHarness.caller.admin.activityLogs.create({
          user_id: "u1",
          message_code: ActivityMessageCode.Joined,
        }),
      ).rejects.toThrow("Admin access required");
    });

    test("creates activity log entry for admin", async () => {
      const userId = crypto.randomUUID();
      const result = await adminHarness.caller.admin.activityLogs.create({
        user_id: userId,
        message_code: ActivityMessageCode.EventAttended,
        reference_id: "event-abc",
        reference_type: "event",
      });

      expect(result.id).toBeDefined();
      expect(result.user_id).toBe(userId);
      expect(result.message_code).toBe(ActivityMessageCode.EventAttended);
      expect(result.reference_id).toBe("event-abc");
      expect(result.reference_type).toBe("event");
      expect(result.created_at).toBeDefined();
    });

    test("created entry appears in list", async () => {
      const userId = crypto.randomUUID();
      const created = await adminHarness.caller.admin.activityLogs.create({
        user_id: userId,
        message_code: ActivityMessageCode.ProfilePhotoSubmitted,
      });

      const listed = await adminHarness.caller.admin.activityLogs.list({ user_id: userId });
      expect(listed.items.some((i: { id: string }) => i.id === created.id)).toBe(true);
    });
  });
});
