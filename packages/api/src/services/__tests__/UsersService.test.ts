import { describe, test, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { setupTestDb, teardownTestDb, resetTestDb } from "../../test/setup";
import { createApi } from "../api";
import type { Api } from "../api";
import type { DataSource } from "typeorm";
import type { EmailService } from "../EmailService";
import { UserStatus, UserType } from "@satyrsmc/shared/lib/enums";

const sentEmails: Array<{ type: string; to: string; token?: string }> = [];

class TestEmailService implements EmailService {
  async sendRegistrationEmail(to: string, token: string, _name: string): Promise<void> {
    sentEmails.push({ type: "registration", to, token });
  }
  async sendPasswordResetEmail(_to: string, _token: string, _name: string): Promise<void> {}
  async sendAdminNotification(_subject: string, _body: string): Promise<void> {
    sentEmails.push({ type: "admin_notification", to: "admin" });
  }
}

async function createTestUser(
  api: Api,
  ds: DataSource,
  username: string,
  email: string,
): Promise<string> {
  await api.auth.register({ email, first_name: "Test", last_name: "User" });
  const token = sentEmails[sentEmails.length - 1]!.token!;
  const result = await api.auth.signup({
    token,
    username,
    password: "SecureP@ss1",
    birthday: "1990-01-01",
  });
  return result.user.id;
}

describe("UsersService", () => {
  let api: Api;
  let ds: DataSource;

  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret-that-is-at-least-32-characters-long";
    const result = await setupTestDb();
    ds = result.ds;
    api = createApi(result.db, ds, new TestEmailService());
  });

  afterAll(async () => {
    await teardownTestDb(ds);
    delete process.env.JWT_SECRET;
  });

  beforeEach(async () => {
    await resetTestDb(ds);
    sentEmails.length = 0;
  });

  describe("list", () => {
    test("returns empty list initially", async () => {
      const result = await api.users.list();
      expect(result.users).toEqual([]);
      expect(result.total).toBe(0);
    });

    test("returns created users", async () => {
      await createTestUser(api, ds, "listuser", "list@example.com");
      const result = await api.users.list();
      expect(result.total).toBe(1);
      expect(result.users[0]!.username).toBe("listuser");
    });

    test("filters by status", async () => {
      await createTestUser(api, ds, "statususer", "status@example.com");
      const locked = await api.users.list({ status: UserStatus.Locked });
      expect(locked.total).toBe(1);

      const active = await api.users.list({ status: UserStatus.Active });
      expect(active.total).toBe(0);
    });

    test("filters by user_type", async () => {
      await createTestUser(api, ds, "typeuser", "type@example.com");
      const users = await api.users.list({ user_type: UserType.User });
      expect(users.total).toBe(1);

      const admins = await api.users.list({ user_type: UserType.Admin });
      expect(admins.total).toBe(0);
    });

    test("searches by username", async () => {
      await createTestUser(api, ds, "searchable", "search@example.com");
      const result = await api.users.list({ q: "search" });
      expect(result.total).toBe(1);
    });
  });

  describe("get", () => {
    test("returns user by id", async () => {
      const id = await createTestUser(api, ds, "getuser", "get@example.com");
      const user = await api.users.get(id);
      expect(user).not.toBeNull();
      expect(user!.username).toBe("getuser");
    });

    test("returns null for bad id", async () => {
      const user = await api.users.get("nonexistent");
      expect(user).toBeNull();
    });
  });

  describe("updateStatus", () => {
    test("updates user status", async () => {
      const id = await createTestUser(api, ds, "statusupdate", "statusup@example.com");
      const result = await api.users.updateStatus(id, UserStatus.Active);
      expect(result).not.toBeNull();
      expect(result!.user_status).toBe(UserStatus.Active);
    });

    test("returns null for nonexistent user", async () => {
      const result = await api.users.updateStatus("bad-id", UserStatus.Active);
      expect(result).toBeNull();
    });
  });

  describe("updateType", () => {
    test("updates user type", async () => {
      const id = await createTestUser(api, ds, "typeupdate", "typeup@example.com");
      const result = await api.users.updateType(id, UserType.Admin);
      expect(result).not.toBeNull();
      expect(result!.user_type).toBe(UserType.Admin);
    });
  });

  describe("linkMember", () => {
    test("links user to member", async () => {
      const userId = await createTestUser(api, ds, "linkmember", "link@example.com");
      const member = await api.members.create({ name: "Link Target" });

      const result = await api.users.linkMember(userId, member!.id);
      expect(result).not.toBeNull();
      expect(result!.member_id).toBe(member!.id);
    });

    test("unlinks member with null", async () => {
      const userId = await createTestUser(api, ds, "unlinkmember", "unlink@example.com");
      const member = await api.members.create({ name: "Unlink Target" });
      await api.users.linkMember(userId, member!.id);

      const result = await api.users.linkMember(userId, null);
      expect(result!.member_id).toBeNull();
    });
  });

  describe("addNote", () => {
    test("adds admin note", async () => {
      const id = await createTestUser(api, ds, "noteuser", "note@example.com");
      const result = await api.users.addNote(id, "Needs review");
      expect(result).not.toBeNull();
      expect(result!.admin_note).toBe("Needs review");
    });
  });

  describe("createInvitation", () => {
    test("creates invitation and sends email", async () => {
      sentEmails.length = 0;
      const result = await api.users.createInvitation({
        email: "invite@example.com",
        first_name: "Invited",
        last_name: "Person",
      });

      expect(result.email).toBe("invite@example.com");
      expect(result.first_name).toBe("Invited");
      expect(result.last_name).toBe("Person");
      expect(result.expires_at).toBeTruthy();

      const regEmail = sentEmails.find((e) => e.type === "registration");
      expect(regEmail).toBeTruthy();
      expect(regEmail!.to).toBe("invite@example.com");
    });

    test("creates invitation with pre-linked contact_id", async () => {
      const contact = await api.contacts.create({ display_name: "Pre-linked" });
      const result = await api.users.createInvitation({
        email: "prelinked@example.com",
        contact_id: contact!.id,
      });
      expect(result.contact_id).toBe(contact!.id);
    });
  });

  describe("listRegistrations", () => {
    test("lists pending registrations", async () => {
      await api.users.createInvitation({ email: "reg1@example.com" });
      await api.users.createInvitation({ email: "reg2@example.com" });

      const result = await api.users.listRegistrations();
      expect(result.length).toBe(2);
    });
  });
});
