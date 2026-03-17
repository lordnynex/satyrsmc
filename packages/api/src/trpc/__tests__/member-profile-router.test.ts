import { describe, test, expect, beforeAll } from "bun:test";
import type { TrpcTestHarness } from "../../test/trpcHarness";
import { createTrpcTestHarness } from "../../test/trpcHarness";
import { UserType, MemberPosition } from "@satyrsmc/shared/lib/enums";

const userId = "profile-test-user-1";
const contactId = "profile-contact-1";
const memberId = "profile-member-1";
const username = "profiletester";

async function seedProfileUser(harness: TrpcTestHarness) {
  await harness.ds.query(
    `INSERT INTO contacts (id, display_name, first_name, last_name, type, status) VALUES ($1, $2, $3, $4, 'person', 'active')`,
    [contactId, "Profile Tester", "Profile", "Tester"],
  );
  await harness.ds.query(`INSERT INTO members (id, contact_id, position) VALUES ($1, $2, $3)`, [
    memberId,
    contactId,
    MemberPosition.Member,
  ]);
  await harness.ds.query(
    `INSERT INTO users (id, contact_id, member_id, username, password_hash, user_type, user_status)
     VALUES ($1, $2, $3, $4, 'fakehash', 'user', 'active')`,
    [userId, contactId, memberId, username],
  );
}

describe("members.profile tRPC router", () => {
  let unauthHarness: TrpcTestHarness;
  let userHarness: TrpcTestHarness;

  beforeAll(async () => {
    unauthHarness = await createTrpcTestHarness();

    userHarness = await createTrpcTestHarness({
      session: {
        userId,
        userType: UserType.User,
        memberId,
        contactId,
      },
    });
    await seedProfileUser(userHarness);
  });

  describe("get", () => {
    test("returns profile for valid username", async () => {
      const result = await userHarness.caller.members.profile.get({ username });

      expect(result.id).toBe(userId);
      expect(result.username).toBe(username);
      expect(result.display_name).toBe("Profile Tester");
      expect(result.first_name).toBe("Profile");
      expect(result.last_name).toBe("Tester");
      expect(result.is_own_profile).toBe(true);
      expect(Array.isArray(result.bikes)).toBe(true);
    });

    test("returns is_own_profile based on viewer", async () => {
      // Use the service directly with a different viewerUserId
      const result = await userHarness.api.profile.getByUsername(username, "other-user-id");
      expect(result).not.toBeNull();
      expect(result!.is_own_profile).toBe(false);
    });

    test("returns 404 for non-existent username", async () => {
      await expect(
        userHarness.caller.members.profile.get({ username: "nonexistent-user" }),
      ).rejects.toThrow("Member not found");
    });
  });

  describe("getOwnSettings", () => {
    test("rejects unauthenticated request", async () => {
      await expect(unauthHarness.caller.members.profile.getOwnSettings()).rejects.toThrow(
        "Authentication required",
      );
    });

    test("returns own settings", async () => {
      const result = await userHarness.caller.members.profile.getOwnSettings();

      expect(result.first_name).toBe("Profile");
      expect(result.last_name).toBe("Tester");
      expect(Array.isArray(result.phones)).toBe(true);
      expect(Array.isArray(result.addresses)).toBe(true);
      expect(Array.isArray(result.emergency_contacts)).toBe(true);
    });
  });

  describe("updateOwnSettings", () => {
    test("rejects unauthenticated request", async () => {
      await expect(
        unauthHarness.caller.members.profile.updateOwnSettings({
          first_name: "New",
          last_name: "Name",
        }),
      ).rejects.toThrow("Authentication required");
    });

    test("updates name", async () => {
      const result = await userHarness.caller.members.profile.updateOwnSettings({
        first_name: "Updated",
        last_name: "User",
      });
      expect(result.success).toBe(true);

      const settings = await userHarness.caller.members.profile.getOwnSettings();
      expect(settings.first_name).toBe("Updated");
      expect(settings.last_name).toBe("User");
    });

    test("updates phones with digit stripping", async () => {
      await userHarness.caller.members.profile.updateOwnSettings({
        first_name: "Updated",
        last_name: "User",
        phones: [{ phone: "(555) 123-4567", type: "cell", is_primary: true }],
      });

      const settings = await userHarness.caller.members.profile.getOwnSettings();
      expect(settings.phones.length).toBe(1);
      expect(settings.phones[0]!.phone).toBe("5551234567");
    });
  });

  describe("uploadPhoto", () => {
    test("rejects unauthenticated request", async () => {
      await expect(
        unauthHarness.caller.members.profile.uploadPhoto({ photo: "abc" }),
      ).rejects.toThrow("Authentication required");
    });
  });
});
