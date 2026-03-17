import { describe, test, expect, beforeAll, beforeEach } from "bun:test";
import { setupTestDb, resetTestDb } from "../../test/setup";
import type { Api } from "../api";
import type { DataSource } from "typeorm";
import { hash } from "bcryptjs";
import { UserType, UserStatus } from "@satyrsmc/shared/lib/enums";

async function createTestUser(
  ds: DataSource,
  overrides: { username?: string; password?: string } = {},
) {
  const id = crypto.randomUUID();
  const contactId = crypto.randomUUID();
  const username = overrides.username ?? `testuser-${Date.now()}`;
  const password = overrides.password ?? "TestPass1!";
  const passwordHash = await hash(password, 12);

  await ds.query(
    `INSERT INTO contacts (id, display_name, type, status) VALUES ($1, $2, 'person', 'active')`,
    [contactId, username],
  );
  await ds.query(
    `INSERT INTO users (id, contact_id, username, password_hash, user_type, user_status)
     VALUES ($1, $2, $3, $4, 'user', 'active')`,
    [id, contactId, username, passwordHash],
  );
  // Insert primary email
  const emailId = crypto.randomUUID();
  await ds.query(
    `INSERT INTO contact_emails (id, contact_id, email, type, is_primary) VALUES ($1, $2, $3, 'home', true)`,
    [emailId, contactId, `${username}@test.com`],
  );

  return { userId: id, contactId, username, password };
}

describe("SettingsService", () => {
  let api: Api;
  let ds: DataSource;

  beforeAll(async () => {
    const result = await setupTestDb();
    ds = result.ds;
    api = result.api;
  });

  beforeEach(async () => {
    await resetTestDb(ds);
  });

  describe("getAccount", () => {
    test("returns user info with primary email", async () => {
      const { userId, username } = await createTestUser(ds);

      const account = await api.settings.getAccount(userId);

      expect(account.username).toBe(username);
      expect(account.user_type).toBe(UserType.User);
      expect(account.user_status).toBe(UserStatus.Active);
      expect(account.email).toBe(`${username}@test.com`);
      expect(account.created_at).toBeDefined();
    });
  });

  describe("changePassword", () => {
    test("succeeds with correct current password", async () => {
      const { userId, password } = await createTestUser(ds);

      const result = await api.settings.changePassword(userId, password, "NewPass1!");

      expect(result.success).toBe(true);
    });

    test("fails with incorrect current password", async () => {
      const { userId } = await createTestUser(ds);

      expect(api.settings.changePassword(userId, "wrong", "NewPass1!")).rejects.toThrow(
        "Current password is incorrect",
      );
    });

    test("updates passwordChangedAt timestamp", async () => {
      const { userId, password } = await createTestUser(ds);

      // Verify no passwordChangedAt before change
      const beforeRows = await ds.query(`SELECT password_changed_at FROM users WHERE id = $1`, [
        userId,
      ]);
      expect(beforeRows[0].password_changed_at).toBeNull();

      await api.settings.changePassword(userId, password, "NewPass1!");

      const afterRows = await ds.query(`SELECT password_changed_at FROM users WHERE id = $1`, [
        userId,
      ]);
      expect(afterRows[0].password_changed_at).not.toBeNull();
    });
  });

  describe("changeEmail", () => {
    test("updates primary contact email", async () => {
      const { userId, password } = await createTestUser(ds);

      const result = await api.settings.changeEmail(userId, "newemail@test.com", password);

      expect(result.success).toBe(true);

      const account = await api.settings.getAccount(userId);
      expect(account.email).toBe("newemail@test.com");
    });

    test("fails when email already in use by another contact", async () => {
      const user1 = await createTestUser(ds, { username: "user1" });
      await createTestUser(ds, { username: "user2" });

      // Try to change user1's email to user2's email
      expect(
        api.settings.changeEmail(user1.userId, "user2@test.com", user1.password),
      ).rejects.toThrow("Email is already in use");
    });

    test("verifies password before changing email", async () => {
      const { userId } = await createTestUser(ds);

      expect(
        api.settings.changeEmail(userId, "newemail@test.com", "wrongpassword"),
      ).rejects.toThrow("Password is incorrect");
    });
  });
});
