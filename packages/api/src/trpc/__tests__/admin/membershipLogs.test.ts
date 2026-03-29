import { describe, test, expect, beforeAll } from "vitest";
import type { TrpcTestHarness } from "../../../test/trpcHarness";
import { createTrpcTestHarness } from "../../../test/trpcHarness";
import { UserType, MembershipMessageCode } from "@satyrsmc/shared/lib/enums";

describe("admin.membershipLogs", () => {
  let adminHarness: TrpcTestHarness;
  let webmasterHarness: TrpcTestHarness;
  let unauthHarness: TrpcTestHarness;
  let userHarness: TrpcTestHarness;

  beforeAll(async () => {
    adminHarness = await createTrpcTestHarness({
      session: {
        userId: "admin-ml-1",
        userType: UserType.Admin,
        memberId: null,
        contactId: "contact-admin-ml",
      },
    });
    webmasterHarness = await createTrpcTestHarness({
      session: {
        userId: "wm-ml-1",
        userType: UserType.Webmaster,
        memberId: null,
        contactId: "contact-wm-ml",
      },
    });
    unauthHarness = await createTrpcTestHarness();
    userHarness = await createTrpcTestHarness({
      session: {
        userId: "user-ml-1",
        userType: UserType.User,
        memberId: null,
        contactId: "contact-user-ml",
      },
    });
  });

  describe("list", () => {
    test("rejects unauthenticated request", async () => {
      await expect(
        unauthHarness.caller.admin.membershipLogs.list({ user_id: "u1" }),
      ).rejects.toThrow("Authentication required");
    });

    test("rejects regular user", async () => {
      await expect(userHarness.caller.admin.membershipLogs.list({ user_id: "u1" })).rejects.toThrow(
        "Admin access required",
      );
    });

    test("returns paginated results for admin", async () => {
      const userId = crypto.randomUUID();
      const result = await adminHarness.caller.admin.membershipLogs.list({
        user_id: userId,
      });
      expect(result).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(typeof result.total).toBe("number");
    });

    test("webmaster can also access", async () => {
      const userId = crypto.randomUUID();
      const result = await webmasterHarness.caller.admin.membershipLogs.list({
        user_id: userId,
      });
      expect(result).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
    });

    test("accepts page and per_page", async () => {
      const result = await adminHarness.caller.admin.membershipLogs.list({
        user_id: crypto.randomUUID(),
        page: 2,
        per_page: 5,
      });
      expect(result.page).toBe(2);
      expect(result.per_page).toBe(5);
    });
  });

  describe("create", () => {
    test("rejects unauthenticated request", async () => {
      await expect(
        unauthHarness.caller.admin.membershipLogs.create({
          user_id: "u1",
          message_code: MembershipMessageCode.AccountCreated,
        }),
      ).rejects.toThrow("Authentication required");
    });

    test("rejects regular user", async () => {
      await expect(
        userHarness.caller.admin.membershipLogs.create({
          user_id: "u1",
          message_code: MembershipMessageCode.AccountCreated,
        }),
      ).rejects.toThrow("Admin access required");
    });

    test("creates membership log entry and sets logged_by from session", async () => {
      const subjectId = crypto.randomUUID();
      const result = await adminHarness.caller.admin.membershipLogs.create({
        user_id: subjectId,
        message_code: MembershipMessageCode.MembershipGranted,
        message: "Approved after 3 runs",
      });

      expect(result.id).toBeDefined();
      expect(result.user_id).toBe(subjectId);
      expect(result.logged_by).toBe("admin-ml-1");
      expect(result.message_code).toBe(MembershipMessageCode.MembershipGranted);
      expect(result.message).toBe("Approved after 3 runs");
      expect(result.created_at).toBeDefined();
    });

    test("webmaster create sets their userId as logged_by", async () => {
      const subjectId = crypto.randomUUID();
      const result = await webmasterHarness.caller.admin.membershipLogs.create({
        user_id: subjectId,
        message_code: MembershipMessageCode.OfficeAdded,
      });

      expect(result.logged_by).toBe("wm-ml-1");
    });

    test("created entry appears in list", async () => {
      const subjectId = crypto.randomUUID();
      const created = await adminHarness.caller.admin.membershipLogs.create({
        user_id: subjectId,
        message_code: MembershipMessageCode.DuesPaid,
      });

      const listed = await adminHarness.caller.admin.membershipLogs.list({
        user_id: subjectId,
      });
      expect(listed.items.some((i: { id: string }) => i.id === created.id)).toBe(true);
    });

    test("message is optional and defaults to null", async () => {
      const result = await adminHarness.caller.admin.membershipLogs.create({
        user_id: crypto.randomUUID(),
        message_code: MembershipMessageCode.AccountUnlocked,
      });
      expect(result.message).toBeNull();
    });
  });
});
