import { describe, test, expect, beforeAll } from "bun:test";
import type { TrpcTestHarness } from "../../test/trpcHarness";
import { createTrpcTestHarness } from "../../test/trpcHarness";
import { resetTestDb } from "../../test/setup";
import { UserType, MemberPosition } from "@satyrsmc/shared/lib/enums";

describe("members.roster tRPC router", () => {
  let unauthHarness: TrpcTestHarness;
  let memberHarness: TrpcTestHarness;
  let nonMemberHarness: TrpcTestHarness;

  const memberId = "roster-member-1";
  const contactId = "roster-contact-1";
  const userId = "roster-user-1";

  const member2Id = "roster-member-2";
  const contact2Id = "roster-contact-2";
  const user2Id = "roster-user-2";

  const member3Id = "roster-member-3";
  const contact3Id = "roster-contact-3";
  const user3Id = "roster-user-3";

  beforeAll(async () => {
    memberHarness = await createTrpcTestHarness({
      session: {
        userId,
        userType: UserType.User,
        memberId,
        contactId,
      },
    });
    await resetTestDb(memberHarness.ds);
    unauthHarness = memberHarness.fork(null);
    nonMemberHarness = memberHarness.fork({
      userId: "roster-nonmember-user",
      userType: UserType.User,
      memberId: null,
      contactId: "roster-nonmember-contact",
    });

    // Seed member 1 — President
    await memberHarness.ds.query(
      `INSERT INTO contacts (id, display_name, first_name, last_name, type, status)
       VALUES ($1, $2, $3, $4, 'person', 'active')`,
      [contactId, "Alice Adams", "Alice", "Adams"],
    );
    await memberHarness.ds.query(
      `INSERT INTO members (id, contact_id, position, member_since, show_on_website)
       VALUES ($1, $2, $3, $4, true)`,
      [memberId, contactId, MemberPosition.President, "2020-06-15T12:00:00.000Z"],
    );
    await memberHarness.ds.query(
      `INSERT INTO users (id, contact_id, member_id, username, password_hash, user_type, user_status)
       VALUES ($1, $2, $3, $4, 'fakehash', 'user', 'active')`,
      [userId, contactId, memberId, "alice"],
    );
    // Alice's primary bike
    await memberHarness.ds.query(
      `INSERT INTO bikes (id, user_id, year, make, model, trim, is_primary)
       VALUES ($1, $2, $3, $4, $5, $6, true)`,
      ["roster-bike-1", userId, 2019, "Harley-Davidson", "Road King", "Special"],
    );
    // Alice's phone
    await memberHarness.ds.query(
      `INSERT INTO contact_phones (id, contact_id, phone, type, is_primary)
       VALUES ($1, $2, $3, $4, true)`,
      ["roster-phone-1", contactId, "5551234567", "cell"],
    );

    // Seed member 2 — Regular member
    await memberHarness.ds.query(
      `INSERT INTO contacts (id, display_name, first_name, last_name, type, status)
       VALUES ($1, $2, $3, $4, 'person', 'active')`,
      [contact2Id, "Bob Baker", "Bob", "Baker"],
    );
    await memberHarness.ds.query(
      `INSERT INTO members (id, contact_id, position, member_since, show_on_website)
       VALUES ($1, $2, $3, $4, true)`,
      [member2Id, contact2Id, MemberPosition.Member, "2022-01-10T12:00:00.000Z"],
    );
    await memberHarness.ds.query(
      `INSERT INTO users (id, contact_id, member_id, username, password_hash, user_type, user_status)
       VALUES ($1, $2, $3, $4, 'fakehash', 'user', 'active')`,
      [user2Id, contact2Id, member2Id, "bob"],
    );
    // Bob's bike
    await memberHarness.ds.query(
      `INSERT INTO bikes (id, user_id, year, make, model, is_primary)
       VALUES ($1, $2, $3, $4, $5, true)`,
      ["roster-bike-2", user2Id, 2021, "Honda", "Rebel 500"],
    );

    // Alice's non-primary bike (should NOT appear in filter options)
    await memberHarness.ds.query(
      `INSERT INTO bikes (id, user_id, year, make, model, is_primary)
       VALUES ($1, $2, $3, $4, $5, false)`,
      ["roster-bike-extra", userId, 2018, "Yamaha", "MT-07"],
    );

    // Seed member 3 — Treasurer, inactive user (should NOT appear)
    await memberHarness.ds.query(
      `INSERT INTO contacts (id, display_name, first_name, last_name, type, status)
       VALUES ($1, $2, $3, $4, 'person', 'active')`,
      [contact3Id, "Charlie Clark", "Charlie", "Clark"],
    );
    await memberHarness.ds.query(
      `INSERT INTO members (id, contact_id, position, member_since, show_on_website)
       VALUES ($1, $2, $3, $4, true)`,
      [member3Id, contact3Id, MemberPosition.Treasurer, "2019-03-01T12:00:00.000Z"],
    );
    await memberHarness.ds.query(
      `INSERT INTO users (id, contact_id, member_id, username, password_hash, user_type, user_status)
       VALUES ($1, $2, $3, $4, 'fakehash', 'user', 'inactive')`,
      [user3Id, contact3Id, member3Id, "charlie"],
    );
  });

  describe("list", () => {
    test("rejects unauthenticated request", async () => {
      await expect(unauthHarness.caller.members.roster.list({})).rejects.toThrow(
        "Authentication required",
      );
    });

    test("rejects non-member request", async () => {
      await expect(nonMemberHarness.caller.members.roster.list({})).rejects.toThrow(
        "Member access required",
      );
    });

    test("returns active members only", async () => {
      const result = await memberHarness.caller.members.roster.list({});
      const usernames = result.members.map((m) => m.username);

      // Alice and Bob are active, Charlie is inactive
      expect(usernames).toContain("alice");
      expect(usernames).toContain("bob");
      expect(usernames).not.toContain("charlie");
    });

    test("officers sort before regular members", async () => {
      const result = await memberHarness.caller.members.roster.list({});

      // Alice (President) should be before Bob (Member)
      const aliceIndex = result.members.findIndex((m) => m.username === "alice");
      const bobIndex = result.members.findIndex((m) => m.username === "bob");
      expect(aliceIndex).toBeLessThan(bobIndex);
    });

    test("returns summary with correct counts", async () => {
      const result = await memberHarness.caller.members.roster.list({});

      expect(result.summary.total).toBe(2);
      expect(result.summary.officers).toBe(1); // Alice is President
      expect(result.summary.regular_members).toBe(1); // Bob is Member
    });

    test("includes bike info for primary bike", async () => {
      const result = await memberHarness.caller.members.roster.list({});
      const alice = result.members.find((m) => m.username === "alice");

      expect(alice?.bike).not.toBeNull();
      expect(alice?.bike?.make).toBe("Harley-Davidson");
      expect(alice?.bike?.model).toBe("Road King");
      expect(alice?.bike?.trim).toBe("Special");
    });

    test("formats phone number", async () => {
      const result = await memberHarness.caller.members.roster.list({});
      const alice = result.members.find((m) => m.username === "alice");

      expect(alice?.phone).toBe("(555) 123-4567");
    });

    test("filters by search term", async () => {
      const result = await memberHarness.caller.members.roster.list({ search: "alice" });

      expect(result.members).toHaveLength(1);
      expect(result.members[0].username).toBe("alice");
    });

    test("filters by year joined", async () => {
      const result = await memberHarness.caller.members.roster.list({ year_joined: 2022 });

      expect(result.members).toHaveLength(1);
      expect(result.members[0].username).toBe("bob");
    });

    test("filters by bike make", async () => {
      const result = await memberHarness.caller.members.roster.list({ bike_make: "Honda" });

      expect(result.members).toHaveLength(1);
      expect(result.members[0].username).toBe("bob");
    });

    test("filters by position", async () => {
      const result = await memberHarness.caller.members.roster.list({
        position: MemberPosition.President,
      });

      expect(result.members).toHaveLength(1);
      expect(result.members[0].username).toBe("alice");
    });

    test("returns empty when no match", async () => {
      const result = await memberHarness.caller.members.roster.list({ search: "nonexistent" });

      expect(result.members).toHaveLength(0);
      expect(result.summary.total).toBe(0);
    });
  });

  describe("getFilterOptions", () => {
    test("rejects unauthenticated request", async () => {
      await expect(unauthHarness.caller.members.roster.getFilterOptions()).rejects.toThrow(
        "Authentication required",
      );
    });

    test("returns distinct filter values from active members", async () => {
      const options = await memberHarness.caller.members.roster.getFilterOptions();

      // Years: 2020 and 2022 (not 2019 since Charlie is inactive)
      expect(options.years_joined).toContain(2020);
      expect(options.years_joined).toContain(2022);

      // Bike makes from active users only
      expect(options.bike_makes).toContain("Harley-Davidson");
      expect(options.bike_makes).toContain("Honda");

      // Bike models from active users only
      expect(options.bike_models).toContain("Road King");
      expect(options.bike_models).toContain("Rebel 500");
    });

    test("years sorted descending", async () => {
      const options = await memberHarness.caller.members.roster.getFilterOptions();

      for (let i = 1; i < options.years_joined.length; i++) {
        expect(options.years_joined[i - 1]).toBeGreaterThanOrEqual(options.years_joined[i]);
      }
    });

    test("excludes non-primary bikes from filter options", async () => {
      const options = await memberHarness.caller.members.roster.getFilterOptions();

      // Yamaha MT-07 is non-primary, should not appear
      expect(options.bike_makes).not.toContain("Yamaha");
      expect(options.bike_models).not.toContain("MT-07");
    });

    test("bike makes sorted ascending", async () => {
      const options = await memberHarness.caller.members.roster.getFilterOptions();

      for (let i = 1; i < options.bike_makes.length; i++) {
        expect(options.bike_makes[i - 1].localeCompare(options.bike_makes[i])).toBeLessThanOrEqual(
          0,
        );
      }
    });
  });
});
