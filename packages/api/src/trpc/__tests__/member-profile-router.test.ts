import { describe, test, expect, beforeAll } from "bun:test";
import type { TrpcTestHarness } from "../../test/trpcHarness";
import { createTrpcTestHarness } from "../../test/trpcHarness";
import { UserType, MemberPosition } from "@satyrsmc/shared/lib/enums";

const userId = "profile-test-user-1";
const contactId = "profile-contact-1";
const memberId = "profile-member-1";
const username = "profiletester";

const viewer2UserId = "profile-test-user-2";
const viewer2ContactId = "profile-contact-2";
const viewer2MemberId = "profile-member-2";

async function seedProfileUser(harness: TrpcTestHarness) {
  await harness.ds.query(
    `INSERT INTO contacts (id, display_name, first_name, last_name, type, status, birthday)
     VALUES ($1, $2, $3, $4, 'person', 'active', $5)`,
    [contactId, "Profile Tester", "Profile", "Tester", "1990-06-15T12:00:00.000Z"],
  );
  await harness.ds.query(
    `INSERT INTO members (id, contact_id, position, member_since) VALUES ($1, $2, $3, $4)`,
    [memberId, contactId, MemberPosition.President, "2020-01-01T12:00:00.000Z"],
  );
  await harness.ds.query(
    `INSERT INTO users (id, contact_id, member_id, username, password_hash, user_type, user_status)
     VALUES ($1, $2, $3, $4, 'fakehash', 'user', 'active')`,
    [userId, contactId, memberId, username],
  );

  // Email
  await harness.ds.query(
    `INSERT INTO contact_emails (id, contact_id, email, is_primary)
     VALUES ($1, $2, $3, true)`,
    ["profile-email-1", contactId, "profile@example.com"],
  );

  // Phone
  await harness.ds.query(
    `INSERT INTO contact_phones (id, contact_id, phone, type, is_primary)
     VALUES ($1, $2, $3, $4, true)`,
    ["profile-phone-1", contactId, "5559876543", "cell"],
  );

  // Address
  await harness.ds.query(
    `INSERT INTO contact_addresses (id, contact_id, address_line1, city, state, postal_code, country, type, is_primary_mailing)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)`,
    ["profile-addr-1", contactId, "456 Oak Ave", "Denver", "CO", "80201", "US", "home"],
  );

  // Emergency contacts
  await harness.ds.query(
    `INSERT INTO contact_emergency_contacts (id, contact_id, name, phone, relationship)
     VALUES ($1, $2, $3, $4, $5)`,
    ["profile-ec-1", contactId, "Emergency Person", "5551112222", "Spouse"],
  );

  // Bikes
  await harness.ds.query(
    `INSERT INTO bikes (id, user_id, year, make, model, trim, is_primary)
     VALUES ($1, $2, $3, $4, $5, $6, true)`,
    ["profile-bike-1", userId, 2022, "Indian", "Scout", "Bobber"],
  );

  // Second member (for viewing other profiles)
  await harness.ds.query(
    `INSERT INTO contacts (id, display_name, first_name, last_name, type, status)
     VALUES ($1, $2, $3, $4, 'person', 'active')`,
    [viewer2ContactId, "Other Viewer", "Other", "Viewer"],
  );
  await harness.ds.query(`INSERT INTO members (id, contact_id, position) VALUES ($1, $2, $3)`, [
    viewer2MemberId,
    viewer2ContactId,
    MemberPosition.Member,
  ]);
  await harness.ds.query(
    `INSERT INTO users (id, contact_id, member_id, username, password_hash, user_type, user_status)
     VALUES ($1, $2, $3, $4, 'fakehash', 'user', 'active')`,
    [viewer2UserId, viewer2ContactId, viewer2MemberId, "otherviewer"],
  );
}

describe("members.profile tRPC router", () => {
  let unauthHarness: TrpcTestHarness;
  let userHarness: TrpcTestHarness;
  let viewer2Harness: TrpcTestHarness;

  beforeAll(async () => {
    userHarness = await createTrpcTestHarness({
      session: {
        userId,
        userType: UserType.User,
        memberId,
        contactId,
      },
    });
    unauthHarness = userHarness.fork(null);
    viewer2Harness = userHarness.fork({
      userId: viewer2UserId,
      userType: UserType.User,
      memberId: viewer2MemberId,
      contactId: viewer2ContactId,
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

    test("returns email for own profile", async () => {
      const result = await userHarness.caller.members.profile.get({ username });
      expect(result.email).toBe("profile@example.com");
    });

    test("returns formatted phone for own profile", async () => {
      const result = await userHarness.caller.members.profile.get({ username });
      expect(result.phone).toBe("(555) 987-6543");
    });

    test("returns address for own profile", async () => {
      const result = await userHarness.caller.members.profile.get({ username });
      expect(result.address).not.toBeNull();
      expect(result.address!.line1).toBe("456 Oak Ave");
      expect(result.address!.city).toBe("Denver");
      expect(result.address!.state).toBe("CO");
      expect(result.address!.postal_code).toBe("80201");
    });

    test("returns member_since and position", async () => {
      const result = await userHarness.caller.members.profile.get({ username });
      expect(result.position).toBe(MemberPosition.President);
      expect(result.member_since).not.toBeNull();
    });

    test("returns bikes with correct fields", async () => {
      const result = await userHarness.caller.members.profile.get({ username });
      expect(result.bikes.length).toBeGreaterThanOrEqual(1);
      const bike = result.bikes.find((b) => b.id === "profile-bike-1");
      expect(bike).not.toBeUndefined();
      expect(bike!.year).toBe(2022);
      expect(bike!.make).toBe("Indian");
      expect(bike!.model).toBe("Scout");
      expect(bike!.trim).toBe("Bobber");
      expect(bike!.is_primary).toBe(true);
    });

    test("returns emergency contacts for own profile", async () => {
      const result = await userHarness.caller.members.profile.get({ username });
      expect(result.is_own_profile).toBe(true);
      expect(result.emergency_contacts.length).toBe(1);
      expect(result.emergency_contacts[0].name).toBe("Emergency Person");
      expect(result.emergency_contacts[0].phone).toBe("(555) 111-2222");
      expect(result.emergency_contacts[0].relationship).toBe("Spouse");
    });

    test("hides emergency contacts when viewing another member profile", async () => {
      const result = await viewer2Harness.caller.members.profile.get({ username });
      expect(result.is_own_profile).toBe(false);
      expect(result.emergency_contacts).toEqual([]);
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

    test("auto-promotes first phone to primary when none marked", async () => {
      await userHarness.caller.members.profile.updateOwnSettings({
        first_name: "Updated",
        last_name: "User",
        phones: [{ phone: "5559999999", type: "cell", is_primary: false }],
      });

      const settings = await userHarness.caller.members.profile.getOwnSettings();
      expect(settings.phones.length).toBe(1);
      expect(settings.phones[0]!.is_primary).toBe(true);

      // Verify it shows on the profile
      const profile = await userHarness.caller.members.profile.get({ username });
      expect(profile.phone).toBe("(555) 999-9999");
    });

    test("auto-promotes first address to primary mailing when none marked", async () => {
      await userHarness.caller.members.profile.updateOwnSettings({
        first_name: "Updated",
        last_name: "User",
        addresses: [
          {
            address_line1: "789 Elm St",
            city: "Portland",
            state: "OR",
            postal_code: "97201",
            country: "US",
            type: "home",
            is_primary_mailing: false,
          },
        ],
      });

      const settings = await userHarness.caller.members.profile.getOwnSettings();
      expect(settings.addresses.length).toBe(1);
      expect(settings.addresses[0]!.is_primary_mailing).toBe(true);

      // Verify it shows on the profile
      const profile = await userHarness.caller.members.profile.get({ username });
      expect(profile.address).not.toBeNull();
      expect(profile.address!.line1).toBe("789 Elm St");
      expect(profile.address!.city).toBe("Portland");
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
