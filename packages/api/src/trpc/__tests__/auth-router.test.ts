import { describe, test, expect, beforeAll, afterAll, beforeEach, mock } from "bun:test";
import type { TRPCError } from "@trpc/server";
import type { DataSource } from "typeorm";
import type { Api } from "../../services/api";
import type { EmailService } from "../../services/EmailService";
import type { TrpcTestHarness } from "../../test/trpcHarness";
import { resetTestDb } from "../../test/setup";
import { UserType, UserStatus } from "@satyrsmc/shared/lib/enums";

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

// Helper to register + signup a user through the service layer (bypasses tRPC input validation)
async function createTestUser(
  api: Api,
  overrides: { username?: string; email?: string } = {},
): Promise<{ username: string; password: string }> {
  const email = overrides.email ?? `test-${Date.now()}@example.com`;
  const username = overrides.username ?? `testuser${Date.now()}`;
  const password = "TestPass1!";

  await api.auth.register({ email, first_name: "Test", last_name: "User" });
  const regEmail = sentEmails.find((e) => e.type === "registration" && e.to === email);
  const token = regEmail!.token!;

  await api.auth.signup({ token, username, password, birthday: "1990-01-01" });

  return { username, password };
}

describe("auth tRPC router", () => {
  let harness: TrpcTestHarness;
  let ds: DataSource;

  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret-that-is-at-least-32-characters-long";
    // Need to create api with TestEmailService
    const { setupTestDb } = await import("../../test/setup");
    const { createApi } = await import("../../services/api");
    const result = await setupTestDb();
    ds = result.ds;
    const api = createApi(result.db, ds, new TestEmailService());

    // Build harness manually with custom api
    const { t } = await import("../trpc");
    const { appRouter } = await import("../root");
    const createCaller = t.createCallerFactory(appRouter);
    const context = {
      req: new Request("http://test"),
      resHeaders: new Headers(),
      api,
      session: null,
    };
    const caller = createCaller(context);
    harness = {
      caller,
      api,
      ds,
      context,
      fork: (session = null) => ({
        caller: createCaller({ ...context, session }),
        api,
        ds,
        context: { ...context, session },
        fork: () => {
          throw new Error("fork chaining not supported in auth-router test");
        },
      }),
    };
  });

  afterAll(async () => {
    if (ds?.isInitialized) await ds.destroy();
    delete process.env.JWT_SECRET;
  });

  beforeEach(async () => {
    await resetTestDb(ds);
    sentEmails.length = 0;
    harness.context.resHeaders = new Headers();
  });

  describe("register", () => {
    test("creates registration and returns generic message", async () => {
      const result = await harness.caller.auth.register({
        email: "new@example.com",
        first_name: "New",
        last_name: "User",
        recaptcha_token: "test-token",
      });

      expect(result.message).toContain("registration link has been sent");
      expect(sentEmails.length).toBe(1);
      expect(sentEmails[0]!.type).toBe("registration");
    });

    test("rejects when reCAPTCHA verification fails", async () => {
      const original = harness.api.recaptcha.verify;
      harness.api.recaptcha.verify = mock(() => Promise.resolve(false));
      try {
        await harness.caller.auth.register({
          email: "captcha-fail@example.com",
          first_name: "Bot",
          last_name: "User",
          recaptcha_token: "bad-token",
        });
        expect(true).toBe(false);
      } catch (e) {
        expect((e as TRPCError).code).toBe("BAD_REQUEST");
        expect((e as TRPCError).message).toBe("reCAPTCHA verification failed");
      } finally {
        harness.api.recaptcha.verify = original;
      }
    });
  });

  describe("validateToken", () => {
    test("returns valid for a good token", async () => {
      await harness.api.auth.register({
        email: "validate@example.com",
        first_name: "Val",
        last_name: "User",
      });
      const token = sentEmails[0]!.token!;

      const result = await harness.caller.auth.validateToken({ token });
      expect(result.valid).toBe(true);
      expect(result.email).toBe("validate@example.com");
    });

    test("returns invalid for bad token", async () => {
      const result = await harness.caller.auth.validateToken({ token: "bad-token" });
      expect(result.valid).toBe(false);
    });
  });

  describe("signup", () => {
    test("creates user from valid registration", async () => {
      await harness.api.auth.register({
        email: "signup@example.com",
        first_name: "Sign",
        last_name: "Up",
      });
      const token = sentEmails[0]!.token!;

      const result = await harness.caller.auth.signup({
        token,
        username: "signupuser",
        password: "TestPass1!",
        password_confirm: "TestPass1!",
        birthday: "1990-01-01",
      });

      expect(result.user.username).toBe("signupuser");
      expect(result.user.user_status).toBe(UserStatus.Locked);
    });

    test("rejects invalid token", async () => {
      try {
        await harness.caller.auth.signup({
          token: "invalid-token",
          username: "baduser",
          password: "TestPass1!",
          password_confirm: "TestPass1!",
          birthday: "1990-01-01",
        });
        expect(true).toBe(false);
      } catch (e) {
        expect((e as TRPCError).code).toBe("BAD_REQUEST");
      }
    });
  });

  describe("login", () => {
    test("logs in and sets cookies", async () => {
      const { username, password } = await createTestUser(harness.api);
      // Activate the user
      const { users } = await harness.api.users.list();
      const user = users.find((u) => u.username === username);
      await harness.api.users.updateStatus(user!.id, UserStatus.Active);

      const result = await harness.caller.auth.login({
        username,
        password,
        recaptcha_token: "test-token",
      });

      expect(result.user.username).toBe(username);
      const cookies = harness.context.resHeaders.getSetCookie();
      expect(cookies.some((c: string) => c.startsWith("satyrs_access="))).toBe(true);
      expect(cookies.some((c: string) => c.startsWith("satyrs_refresh="))).toBe(true);
    });

    test("rejects when reCAPTCHA verification fails", async () => {
      const { username } = await createTestUser(harness.api);
      const { users } = await harness.api.users.list();
      const user = users.find((u) => u.username === username);
      await harness.api.users.updateStatus(user!.id, UserStatus.Active);

      const original = harness.api.recaptcha.verify;
      harness.api.recaptcha.verify = mock(() => Promise.resolve(false));
      try {
        await harness.caller.auth.login({
          username,
          password: "TestPass1!",
          recaptcha_token: "bad-token",
        });
        expect(true).toBe(false);
      } catch (e) {
        expect((e as TRPCError).code).toBe("BAD_REQUEST");
        expect((e as TRPCError).message).toBe("reCAPTCHA verification failed");
      } finally {
        harness.api.recaptcha.verify = original;
      }
    });

    test("rejects wrong password", async () => {
      const { username } = await createTestUser(harness.api);
      const { users } = await harness.api.users.list();
      const user = users.find((u) => u.username === username);
      await harness.api.users.updateStatus(user!.id, UserStatus.Active);

      try {
        await harness.caller.auth.login({
          username,
          password: "WrongPass1!",
          recaptcha_token: "test-token",
        });
        expect(true).toBe(false);
      } catch (e) {
        expect((e as TRPCError).code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("me", () => {
    test("rejects unauthenticated request", async () => {
      try {
        await harness.caller.auth.me();
        expect(true).toBe(false);
      } catch (e) {
        expect((e as TRPCError).code).toBe("UNAUTHORIZED");
      }
    });

    test("returns user for authenticated session", async () => {
      const { username } = await createTestUser(harness.api);
      const { users } = await harness.api.users.list();
      const user = users.find((u) => u.username === username);
      await harness.api.users.updateStatus(user!.id, UserStatus.Active);

      // Create a new caller with a session
      const { t } = await import("../trpc");
      const { appRouter } = await import("../root");
      const authedContext = {
        req: new Request("http://test"),
        resHeaders: new Headers(),
        api: harness.api,
        session: {
          userId: user!.id,
          userType: UserType.User,
          memberId: null,
          contactId: user!.contact_id,
        },
      };
      const authedCaller = t.createCallerFactory(appRouter)(authedContext);
      const result = await authedCaller.auth.me();
      expect(result.username).toBe(username);
    });
  });

  describe("logout", () => {
    test("clears cookies", async () => {
      const result = await harness.caller.auth.logout();
      expect(result.message).toBe("Logged out");
      const cookies = harness.context.resHeaders.getSetCookie();
      expect(cookies.some((c: string) => c.includes("satyrs_access=;"))).toBe(true);
      expect(cookies.some((c: string) => c.includes("satyrs_refresh=;"))).toBe(true);
    });
  });

  describe("forgotPassword", () => {
    test("returns generic message", async () => {
      const result = await harness.caller.auth.forgotPassword({
        email: "nobody@example.com",
      });
      expect(result.message).toContain("reset link has been sent");
    });
  });

  describe("resetPassword", () => {
    test("resets password with valid token", async () => {
      const { username } = await createTestUser(harness.api);
      const { users } = await harness.api.users.list();
      const user = users.find((u) => u.username === username);
      await harness.api.users.updateStatus(user!.id, UserStatus.Active);

      sentEmails.length = 0;
      await harness.api.auth.forgotPassword(user!.email ?? `${username}@example.com`);
      const resetEmail = sentEmails.find((e) => e.type === "password_reset");

      if (resetEmail?.token) {
        const result = await harness.caller.auth.resetPassword({
          token: resetEmail.token,
          password: "NewPass1!",
          password_confirm: "NewPass1!",
        });
        expect(result.message).toContain("reset successfully");
      }
    });

    test("rejects invalid token", async () => {
      try {
        await harness.caller.auth.resetPassword({
          token: "bad-token",
          password: "NewPass1!",
          password_confirm: "NewPass1!",
        });
        expect(true).toBe(false);
      } catch (e) {
        expect((e as TRPCError).code).toBe("BAD_REQUEST");
      }
    });
  });
});
