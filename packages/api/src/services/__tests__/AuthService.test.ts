import { describe, test, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { teardownTestDb, resetTestDb } from "../../test/setup";
import type { Api } from "../api";
import type { DataSource } from "typeorm";
import type { EmailService } from "../EmailService";
import { UserStatus } from "@satyrsmc/shared/lib/enums";

// Track emails sent during tests
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

describe("AuthService", () => {
  let api: Api;
  let ds: DataSource;

  beforeAll(async () => {
    // Set JWT_SECRET for tests
    process.env.JWT_SECRET = "test-secret-that-is-at-least-32-characters-long";
    const { createApi } = await import("../api");
    const { setupTestDb: setup } = await import("../../test/setup");
    const result = await setup();
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

  describe("register", () => {
    test("creates registration and sends email", async () => {
      const result = await api.auth.register({
        email: "test@example.com",
        first_name: "John",
        last_name: "Doe",
      });

      expect(result.message).toContain("registration link has been sent");
      expect(sentEmails.length).toBe(1);
      expect(sentEmails[0]!.type).toBe("registration");
      expect(sentEmails[0]!.to).toBe("test@example.com");
    });

    test("returns generic message for duplicate email", async () => {
      await api.auth.register({
        email: "dup@example.com",
        first_name: "First",
        last_name: "User",
      });

      sentEmails.length = 0;
      const result = await api.auth.register({
        email: "dup@example.com",
        first_name: "Second",
        last_name: "User",
      });

      // Generic message, no second email
      expect(result.message).toContain("registration link has been sent");
      expect(sentEmails.length).toBe(0);
    });
  });

  describe("validateToken", () => {
    test("returns valid for a good token", async () => {
      await api.auth.register({
        email: "validate@example.com",
        first_name: "Jane",
        last_name: "Doe",
      });

      const token = sentEmails[0]!.token!;
      const result = await api.auth.validateToken(token);
      expect(result.valid).toBe(true);
      expect(result.email).toBe("validate@example.com");
      expect(result.first_name).toBe("Jane");
      expect(result.last_name).toBe("Doe");
    });

    test("returns invalid for bad token", async () => {
      const result = await api.auth.validateToken("bad-token");
      expect(result.valid).toBe(false);
    });
  });

  describe("signup", () => {
    test("creates user from valid registration", async () => {
      await api.auth.register({
        email: "signup@example.com",
        first_name: "Sign",
        last_name: "Up",
      });

      const token = sentEmails[0]!.token!;
      const result = await api.auth.signup({
        token,
        username: "signupuser",
        password: "SecureP@ss1",
        birthday: "1990-01-01",
      });

      expect(result.user.username).toBe("signupuser");
      expect(result.user.user_status).toBe(UserStatus.Locked);
      expect(result.user.contact_id).toBeTruthy();
    });

    test("rejects invalid token", async () => {
      await expect(
        api.auth.signup({
          token: "bad-token",
          username: "baduser",
          password: "SecureP@ss1",
          birthday: "1990-01-01",
        }),
      ).rejects.toThrow("Invalid or expired");
    });

    test("rejects duplicate username", async () => {
      // Register and signup first user
      await api.auth.register({
        email: "first@example.com",
        first_name: "First",
        last_name: "User",
      });
      await api.auth.signup({
        token: sentEmails[0]!.token!,
        username: "dupname",
        password: "SecureP@ss1",
        birthday: "1990-01-01",
      });

      // Register second user
      sentEmails.length = 0;
      await api.auth.register({
        email: "second@example.com",
        first_name: "Second",
        last_name: "User",
      });

      // Try to signup with same username
      await expect(
        api.auth.signup({
          token: sentEmails[0]!.token!,
          username: "dupname",
          password: "SecureP@ss1",
          birthday: "1990-01-01",
        }),
      ).rejects.toThrow("Username is already taken");
    });

    test("notifies admin after signup", async () => {
      await api.auth.register({
        email: "notify@example.com",
        first_name: "Notify",
        last_name: "Me",
      });
      const token = sentEmails[0]!.token!;
      sentEmails.length = 0;

      await api.auth.signup({
        token,
        username: "notifyuser",
        password: "SecureP@ss1",
        birthday: "1990-01-01",
      });

      const adminNotif = sentEmails.find((e) => e.type === "admin_notification");
      expect(adminNotif).toBeTruthy();
    });
  });

  describe("login", () => {
    async function createActiveUser(username: string, password: string, email: string) {
      await api.auth.register({
        email,
        first_name: "Test",
        last_name: "User",
      });
      const token = sentEmails[sentEmails.length - 1]!.token!;
      await api.auth.signup({ token, username, password, birthday: "1990-01-01" });

      // Activate the user
      const user = await ds.query(`SELECT id FROM users WHERE LOWER(username) = LOWER($1)`, [
        username,
      ]);
      await ds.query(`UPDATE users SET user_status = 'active' WHERE id = $1`, [user[0].id]);
    }

    test("successful login returns tokens", async () => {
      await createActiveUser("loginuser", "SecureP@ss1", "login@example.com");

      const result = await api.auth.login({
        username: "loginuser",
        password: "SecureP@ss1",
      });

      expect(result.user.username).toBe("loginuser");
      expect(result.accessToken).toBeTruthy();
      expect(result.refreshToken).toBeTruthy();
    });

    test("rejects wrong password", async () => {
      await createActiveUser("wrongpwd", "SecureP@ss1", "wrongpwd@example.com");

      await expect(
        api.auth.login({ username: "wrongpwd", password: "WrongP@ss1" }),
      ).rejects.toThrow("Invalid username or password");
    });

    test("rejects non-existent user", async () => {
      await expect(api.auth.login({ username: "nobody", password: "SecureP@ss1" })).rejects.toThrow(
        "Invalid username or password",
      );
    });

    test("rejects locked account (status)", async () => {
      await api.auth.register({
        email: "locked@example.com",
        first_name: "Locked",
        last_name: "User",
      });
      const token = sentEmails[sentEmails.length - 1]!.token!;
      await api.auth.signup({
        token,
        username: "lockeduser",
        password: "SecureP@ss1",
        birthday: "1990-01-01",
      });
      // User is 'locked' by default — do not activate

      await expect(
        api.auth.login({ username: "lockeduser", password: "SecureP@ss1" }),
      ).rejects.toThrow("Account is not active");
    });

    test("locks account after 5 failed attempts", async () => {
      await createActiveUser("lockme", "SecureP@ss1", "lockme@example.com");

      for (let i = 0; i < 5; i++) {
        await api.auth.login({ username: "lockme", password: "Wrong1!" }).catch(() => {});
      }

      // Now even correct password should fail (temporarily locked)
      await expect(api.auth.login({ username: "lockme", password: "SecureP@ss1" })).rejects.toThrow(
        "temporarily locked",
      );
    });

    test("login is case-insensitive for username", async () => {
      await createActiveUser("CaseUser", "SecureP@ss1", "case@example.com");

      const result = await api.auth.login({
        username: "caseuser",
        password: "SecureP@ss1",
      });

      expect(result.user.username).toBe("CaseUser");
    });
  });

  describe("me", () => {
    test("returns user for valid id", async () => {
      await api.auth.register({
        email: "me@example.com",
        first_name: "Me",
        last_name: "User",
      });
      const token = sentEmails[0]!.token!;
      const signup = await api.auth.signup({
        token,
        username: "meuser",
        password: "SecureP@ss1",
        birthday: "1990-01-01",
      });

      const me = await api.auth.me(signup.user.id);
      expect(me).not.toBeNull();
      expect(me!.username).toBe("meuser");
    });

    test("returns null for invalid id", async () => {
      const me = await api.auth.me("nonexistent-id");
      expect(me).toBeNull();
    });
  });

  describe("refresh", () => {
    test("issues new tokens with valid refresh token", async () => {
      await api.auth.register({
        email: "refresh@example.com",
        first_name: "Refresh",
        last_name: "User",
      });
      const token = sentEmails[0]!.token!;
      await api.auth.signup({
        token,
        username: "refreshuser",
        password: "SecureP@ss1",
        birthday: "1990-01-01",
      });
      await ds.query(`UPDATE users SET user_status = 'active' WHERE username = 'refreshuser'`);

      const loginResult = await api.auth.login({
        username: "refreshuser",
        password: "SecureP@ss1",
      });

      const refreshResult = await api.auth.refresh(loginResult.refreshToken);
      expect(refreshResult.accessToken).toBeTruthy();
      expect(refreshResult.refreshToken).toBeTruthy();
      expect(refreshResult.user.username).toBe("refreshuser");
    });

    test("rejects invalid refresh token", async () => {
      await expect(api.auth.refresh("invalid-token")).rejects.toThrow();
    });
  });

  describe("forgotPassword", () => {
    test("returns generic message regardless of email existence", async () => {
      const result = await api.auth.forgotPassword("nobody@example.com");
      expect(result.message).toContain("reset link has been sent");
    });

    test("sends reset email for existing user", async () => {
      await api.auth.register({
        email: "forgot@example.com",
        first_name: "Forgot",
        last_name: "User",
      });
      const regToken = sentEmails[0]!.token!;
      await api.auth.signup({
        token: regToken,
        username: "forgotuser",
        password: "SecureP@ss1",
        birthday: "1990-01-01",
      });

      sentEmails.length = 0;
      await api.auth.forgotPassword("forgot@example.com");

      const resetEmail = sentEmails.find((e) => e.type === "password_reset");
      expect(resetEmail).toBeTruthy();
      expect(resetEmail!.to).toBe("forgot@example.com");
    });
  });

  describe("resetPassword", () => {
    test("resets password with valid token", async () => {
      await api.auth.register({
        email: "reset@example.com",
        first_name: "Reset",
        last_name: "User",
      });
      await api.auth.signup({
        token: sentEmails[0]!.token!,
        username: "resetuser",
        password: "SecureP@ss1",
        birthday: "1990-01-01",
      });
      await ds.query(`UPDATE users SET user_status = 'active' WHERE username = 'resetuser'`);

      sentEmails.length = 0;
      await api.auth.forgotPassword("reset@example.com");

      const resetToken = sentEmails.find((e) => e.type === "password_reset")!.token!;
      const result = await api.auth.resetPassword({
        token: resetToken,
        password: "NewSecureP@ss1",
      });
      expect(result.message).toContain("reset successfully");

      // Can log in with new password
      const login = await api.auth.login({
        username: "resetuser",
        password: "NewSecureP@ss1",
      });
      expect(login.user.username).toBe("resetuser");
    });

    test("rejects invalid reset token", async () => {
      await expect(
        api.auth.resetPassword({ token: "bad-token", password: "NewP@ss1!" }),
      ).rejects.toThrow("Invalid or expired");
    });
  });

  describe("verifyAccessToken", () => {
    test("verifies a valid access token", async () => {
      await api.auth.register({
        email: "verify@example.com",
        first_name: "Verify",
        last_name: "User",
      });
      await api.auth.signup({
        token: sentEmails[0]!.token!,
        username: "verifyuser",
        password: "SecureP@ss1",
        birthday: "1990-01-01",
      });
      await ds.query(`UPDATE users SET user_status = 'active' WHERE username = 'verifyuser'`);

      const loginResult = await api.auth.login({
        username: "verifyuser",
        password: "SecureP@ss1",
      });

      const payload = await api.auth.verifyAccessToken(loginResult.accessToken);
      expect(payload).not.toBeNull();
      expect(payload!.userId).toBe(loginResult.user.id);
    });

    test("returns null for invalid token", async () => {
      const payload = await api.auth.verifyAccessToken("invalid-token");
      expect(payload).toBeNull();
    });
  });
});
