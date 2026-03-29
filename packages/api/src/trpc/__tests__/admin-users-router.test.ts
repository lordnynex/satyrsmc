import { describe, test, expect, beforeAll, afterAll } from "vitest";
import type { TRPCError } from "@trpc/server";
import type { DataSource } from "typeorm";
import type { Request, Response } from "express";
import type { Api } from "../../services/api";
import type { EmailService } from "../../services/EmailService";
import { UserType, UserStatus } from "@satyrsmc/shared/lib/enums";
import type { Context, Session } from "../context";
import { t } from "../trpc";
import { appRouter } from "../root";

const sentEmails: Array<{ type: string; to: string; token?: string; name?: string }> = [];

class TestEmailService implements EmailService {
  async sendRegistrationEmail(to: string, token: string, name: string): Promise<void> {
    sentEmails.push({ type: "registration", to, token, name });
  }
  async sendPasswordResetEmail(to: string, token: string, name: string): Promise<void> {
    sentEmails.push({ type: "password_reset", to, token, name });
  }
  async sendAdminNotification(subject: string, _body: string): Promise<void> {
    sentEmails.push({ type: "admin_notification", to: "admin", name: subject });
  }
}

let counter = 0;
async function createTestUser(
  api: Api,
  overrides: { username?: string; email?: string } = {},
): Promise<{ id: string; contactId: string }> {
  counter++;
  const email = overrides.email ?? `user-${counter}-${Date.now()}@example.com`;
  const username = overrides.username ?? `user${counter}${Date.now()}`;
  await api.auth.register({ email, first_name: "Test", last_name: "User" });
  const regEmail = sentEmails[sentEmails.length - 1]!;
  const result = await api.auth.signup({
    token: regEmail.token!,
    username,
    password: "TestPass1!",
    birthday: "1990-01-01",
  });
  return { id: result.user.id, contactId: result.user.contact_id };
}

const createCaller = t.createCallerFactory(appRouter);
type Caller = ReturnType<typeof createCaller>;

function makeCaller(api: Api, session: Session | null): Caller {
  const context: Context = {
    req: { headers: {} } as unknown as Request,
    res: { setHeader: () => undefined, getHeader: () => undefined } as unknown as Response,
    api,
    session,
  };
  return createCaller(context);
}

describe("admin.users tRPC router", () => {
  let api: Api;
  let ds: DataSource;
  let adminCaller: Caller;
  let unauthCaller: Caller;
  let userCaller: Caller;

  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret-that-is-at-least-32-characters-long";
    const { setupTestDb } = await import("../../test/setup");
    const { createApi } = await import("../../services/api");
    const result = await setupTestDb();
    ds = result.ds;
    api = createApi(result.db, ds, new TestEmailService());

    // Create a real admin user in the DB so FK constraints work
    const adminUser = await createTestUser(api, { username: "testadmin", email: "admin@test.com" });
    await api.users.updateStatus(adminUser.id, UserStatus.Active);
    await api.users.updateType(adminUser.id, UserType.Admin);

    const adminSession: Session = {
      userId: adminUser.id,
      userType: UserType.Admin,
      memberId: null,
      contactId: adminUser.contactId,
    };

    const userSession: Session = {
      userId: "user-1",
      userType: UserType.User,
      memberId: null,
      contactId: "contact-user",
    };

    adminCaller = makeCaller(api, adminSession);
    unauthCaller = makeCaller(api, null);
    userCaller = makeCaller(api, userSession);
  });

  afterAll(async () => {
    if (ds?.isInitialized) await ds.destroy();
    delete process.env.JWT_SECRET;
  });

  describe("list", () => {
    test("admin can list users", async () => {
      const result = await adminCaller.admin.users.list();
      expect(result.total).toBeGreaterThanOrEqual(1);
      expect(result.users.length).toBeGreaterThanOrEqual(1);
    });

    test("rejects unauthenticated request", async () => {
      try {
        await unauthCaller.admin.users.list();
        expect(true).toBe(false);
      } catch (e) {
        expect((e as TRPCError).code).toBe("UNAUTHORIZED");
      }
    });

    test("rejects regular user", async () => {
      try {
        await userCaller.admin.users.list();
        expect(true).toBe(false);
      } catch (e) {
        expect((e as TRPCError).code).toBe("FORBIDDEN");
      }
    });
  });

  describe("get", () => {
    test("admin can get a user by id", async () => {
      const user = await createTestUser(api);
      const result = await adminCaller.admin.users.get({ id: user.id });
      expect(result.id).toBe(user.id);
      expect(result.user_status).toBe(UserStatus.Locked);
    });

    test("returns NOT_FOUND for missing user", async () => {
      try {
        await adminCaller.admin.users.get({ id: "nonexistent" });
        expect(true).toBe(false);
      } catch (e) {
        expect((e as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("updateStatus", () => {
    test("admin can update user status", async () => {
      const user = await createTestUser(api);
      const result = await adminCaller.admin.users.updateStatus({
        id: user.id,
        user_status: UserStatus.Active,
      });
      expect(result.user_status).toBe(UserStatus.Active);
    });
  });

  describe("updateType", () => {
    test("admin can update user type", async () => {
      const user = await createTestUser(api);
      const result = await adminCaller.admin.users.updateType({
        id: user.id,
        user_type: UserType.Admin,
      });
      expect(result.user_type).toBe(UserType.Admin);
    });
  });

  describe("linkMember", () => {
    test("admin can link/unlink member", async () => {
      const user = await createTestUser(api);
      const result = await adminCaller.admin.users.linkMember({
        id: user.id,
        member_id: null,
      });
      expect(result.member_id).toBeNull();
    });
  });

  describe("addNote", () => {
    test("admin can add a note", async () => {
      const user = await createTestUser(api);
      const result = await adminCaller.admin.users.addNote({
        id: user.id,
        admin_note: "Test admin note",
      });
      expect(result.admin_note).toBe("Test admin note");
    });
  });

  describe("createInvitation", () => {
    test("admin can create an invitation", async () => {
      const email = `invite-${Date.now()}@example.com`;
      const result = await adminCaller.admin.users.createInvitation({
        email,
        first_name: "Invited",
        last_name: "User",
      });
      expect(result.email).toBe(email);
      expect(sentEmails.some((e) => e.type === "registration" && e.to === email)).toBe(true);
    });
  });

  describe("listRegistrations", () => {
    test("admin can list registrations", async () => {
      const email = `pending-${Date.now()}@example.com`;
      await api.auth.register({
        email,
        first_name: "Pending",
        last_name: "User",
      });
      const result = await adminCaller.admin.users.listRegistrations();
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.some((r: { email: string }) => r.email === email)).toBe(true);
    });
  });
});
