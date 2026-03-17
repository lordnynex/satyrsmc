import { describe, test, expect, beforeAll } from "bun:test";
import type { TrpcTestHarness } from "../../test/trpcHarness";
import { createTrpcTestHarness } from "../../test/trpcHarness";
import { UserType } from "@satyrsmc/shared/lib/enums";

describe("members.bikes tRPC router", () => {
  let unauthHarness: TrpcTestHarness;
  let userHarness: TrpcTestHarness;

  const userId = "bikes-test-user-1";

  beforeAll(async () => {
    unauthHarness = await createTrpcTestHarness();
    userHarness = await createTrpcTestHarness({
      session: {
        userId,
        userType: UserType.User,
        memberId: "bikes-member-1",
        contactId: "bikes-contact-1",
      },
    });

    // Seed a user row so bikes FK constraint is satisfied
    await userHarness.ds.query(
      `INSERT INTO contacts (id, display_name, type, status) VALUES ($1, $2, 'person', 'active')`,
      ["bikes-contact-1", "Bikes Tester"],
    );
    await userHarness.ds.query(
      `INSERT INTO users (id, contact_id, username, password_hash, user_type, user_status)
       VALUES ($1, $2, $3, 'fakehash', 'user', 'active')`,
      [userId, "bikes-contact-1", "bikestester"],
    );
  });

  describe("list", () => {
    test("rejects unauthenticated request", async () => {
      await expect(unauthHarness.caller.members.bikes.list()).rejects.toThrow(
        "Authentication required",
      );
    });

    test("returns empty list initially", async () => {
      const result = await userHarness.caller.members.bikes.list();
      expect(result.items).toEqual([]);
    });
  });

  describe("create", () => {
    test("rejects unauthenticated request", async () => {
      await expect(
        unauthHarness.caller.members.bikes.create({
          year: 2020,
          make: "Harley-Davidson",
          model: "Road King",
        }),
      ).rejects.toThrow("Authentication required");
    });

    test("creates a bike", async () => {
      const bike = await userHarness.caller.members.bikes.create({
        year: 2021,
        make: "Honda",
        model: "Rebel 500",
      });

      expect(bike.id).toBeDefined();
      expect(bike.year).toBe(2021);
      expect(bike.make).toBe("Honda");
      expect(bike.model).toBe("Rebel 500");
      expect(bike.is_primary).toBe(true);
    });

    test("second bike is not primary", async () => {
      const bike = await userHarness.caller.members.bikes.create({
        year: 2022,
        make: "Yamaha",
        model: "MT-07",
      });

      expect(bike.is_primary).toBe(false);
    });
  });

  describe("update", () => {
    test("updates bike fields", async () => {
      const list = await userHarness.caller.members.bikes.list();
      const bike = list.items[0]!;

      const updated = await userHarness.caller.members.bikes.update({
        id: bike.id,
        trim: "Special Edition",
      });

      expect(updated.trim).toBe("Special Edition");
    });
  });

  describe("setPrimary", () => {
    test("sets a different bike as primary", async () => {
      const list = await userHarness.caller.members.bikes.list();
      const nonPrimary = list.items.find((b) => !b.is_primary);
      expect(nonPrimary).toBeDefined();

      const result = await userHarness.caller.members.bikes.setPrimary({
        id: nonPrimary!.id,
      });
      expect(result.success).toBe(true);

      const updated = await userHarness.caller.members.bikes.list();
      const newPrimary = updated.items.find((b) => b.id === nonPrimary!.id);
      expect(newPrimary!.is_primary).toBe(true);
    });
  });

  describe("uploadPhoto", () => {
    test("rejects unauthenticated request", async () => {
      await expect(
        unauthHarness.caller.members.bikes.uploadPhoto({ id: "fake", photo: "abc" }),
      ).rejects.toThrow("Authentication required");
    });
  });

  describe("deletePhoto", () => {
    test("rejects unauthenticated request", async () => {
      await expect(unauthHarness.caller.members.bikes.deletePhoto({ id: "fake" })).rejects.toThrow(
        "Authentication required",
      );
    });
  });

  describe("delete", () => {
    test("rejects unauthenticated request", async () => {
      await expect(unauthHarness.caller.members.bikes.delete({ id: "fake" })).rejects.toThrow(
        "Authentication required",
      );
    });

    test("deletes a bike", async () => {
      const list = await userHarness.caller.members.bikes.list();
      const toDelete = list.items[list.items.length - 1]!;

      const result = await userHarness.caller.members.bikes.delete({ id: toDelete.id });
      expect(result.success).toBe(true);

      const after = await userHarness.caller.members.bikes.list();
      expect(after.items.find((b) => b.id === toDelete.id)).toBeUndefined();
    });
  });
});
