import { describe, test, expect, beforeAll } from "bun:test";
import { hash } from "bcryptjs";
import type { TrpcTestHarness } from "../../test/trpcHarness";
import { createTrpcTestHarness } from "../../test/trpcHarness";
import { UserType, UserStatus } from "@satyrsmc/shared/lib/enums";

const TEST_PASSWORD = "TestPass1!";

async function seedUser(harness: TrpcTestHarness, userId: string) {
  const contactId = `contact-${userId}`;
  const username = `user-${userId}`;
  const passwordHash = await hash(TEST_PASSWORD, 12);

  await harness.ds.query(
    `INSERT INTO contacts (id, display_name, type, status) VALUES ($1, $2, 'person', 'active')`,
    [contactId, username],
  );
  await harness.ds.query(
    `INSERT INTO users (id, contact_id, username, password_hash, user_type, user_status)
     VALUES ($1, $2, $3, $4, 'user', 'active')`,
    [userId, contactId, username, passwordHash],
  );
  await harness.ds.query(
    `INSERT INTO contact_emails (id, contact_id, email, type, is_primary) VALUES ($1, $2, $3, 'home', true)`,
    [crypto.randomUUID(), contactId, `${username}@test.com`],
  );
}

describe("members.settings tRPC router", () => {
  let unauthHarness: TrpcTestHarness;
  let userHarness: TrpcTestHarness;

  const userId = "settings-test-user-1";

  beforeAll(async () => {
    unauthHarness = await createTrpcTestHarness();
    userHarness = await createTrpcTestHarness({
      session: {
        userId,
        userType: UserType.User,
        memberId: "settings-member-1",
        contactId: `contact-${userId}`,
      },
    });
    await seedUser(userHarness, userId);
  });

  describe("getAccount", () => {
    test("rejects unauthenticated request", async () => {
      await expect(unauthHarness.caller.members.settings.getAccount()).rejects.toThrow(
        "Authentication required",
      );
    });

    test("returns account info", async () => {
      const result = await userHarness.caller.members.settings.getAccount();
      expect(result.username).toBe(`user-${userId}`);
      expect(result.email).toBe(`user-${userId}@test.com`);
      expect(result.user_type).toBe(UserType.User);
      expect(result.user_status).toBe(UserStatus.Active);
    });
  });

  describe("changePassword", () => {
    test("rejects unauthenticated request", async () => {
      await expect(
        unauthHarness.caller.members.settings.changePassword({
          current_password: TEST_PASSWORD,
          new_password: "NewPass2!",
          confirm_password: "NewPass2!",
        }),
      ).rejects.toThrow("Authentication required");
    });

    test("succeeds with correct current password", async () => {
      const result = await userHarness.caller.members.settings.changePassword({
        current_password: TEST_PASSWORD,
        new_password: "NewPass2!",
        confirm_password: "NewPass2!",
      });
      expect(result.success).toBe(true);
    });

    test("fails with incorrect current password", async () => {
      await expect(
        userHarness.caller.members.settings.changePassword({
          current_password: "WrongPass1!",
          new_password: "Another1!",
          confirm_password: "Another1!",
        }),
      ).rejects.toThrow();
    });
  });

  describe("changeEmail", () => {
    test("rejects unauthenticated request", async () => {
      await expect(
        unauthHarness.caller.members.settings.changeEmail({
          new_email: "new@test.com",
          password: TEST_PASSWORD,
        }),
      ).rejects.toThrow("Authentication required");
    });

    test("updates email with correct password", async () => {
      const result = await userHarness.caller.members.settings.changeEmail({
        new_email: "updated@test.com",
        password: "NewPass2!",
      });
      expect(result.success).toBe(true);

      const account = await userHarness.caller.members.settings.getAccount();
      expect(account.email).toBe("updated@test.com");
    });
  });
});
