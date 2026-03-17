import { describe, test, expect, beforeAll, beforeEach } from "bun:test";
import { setupTestDb, resetTestDb } from "../../test/setup";
import type { Api } from "../api";
import type { DataSource } from "typeorm";

/** Insert a minimal user row directly (bypasses auth flow). */
async function createTestUser(
  ds: DataSource,
  overrides: { username?: string } = {},
): Promise<string> {
  const id = crypto.randomUUID();
  const contactId = crypto.randomUUID();
  const username = overrides.username ?? `bike-user-${Date.now()}-${Math.random()}`;
  await ds.query(
    `INSERT INTO contacts (id, display_name, type, status) VALUES ($1, $2, 'person', 'active')`,
    [contactId, username],
  );
  await ds.query(
    `INSERT INTO users (id, contact_id, username, password_hash, user_type, user_status)
     VALUES ($1, $2, $3, 'fakehash', 'user', 'active')`,
    [id, contactId, username],
  );
  return id;
}

const bikeInput = (overrides = {}) => ({
  year: 2020,
  make: "Harley-Davidson",
  model: "Street Glide",
  ...overrides,
});

describe("BikeService", () => {
  let api: Api;
  let ds: DataSource;

  beforeAll(async () => {
    const result = await setupTestDb();
    api = result.api;
    ds = result.ds;
  });

  beforeEach(async () => {
    await resetTestDb(ds);
  });

  describe("create", () => {
    test("inserts bike and auto-sets isPrimary when first bike", async () => {
      const userId = await createTestUser(ds);
      const bike = await api.bikes.create(userId, bikeInput());

      expect(bike.id).toBeDefined();
      expect(bike.year).toBe(2020);
      expect(bike.make).toBe("Harley-Davidson");
      expect(bike.model).toBe("Street Glide");
      expect(bike.is_primary).toBe(true);
      expect(bike.created_at).toBeDefined();
      expect(bike.updated_at).toBeDefined();
    });

    test("does NOT auto-set isPrimary when other bikes exist", async () => {
      const userId = await createTestUser(ds);
      await api.bikes.create(userId, bikeInput());
      const second = await api.bikes.create(userId, bikeInput({ make: "Indian", model: "Scout" }));

      expect(second.is_primary).toBe(false);
    });
  });

  describe("listByUser", () => {
    test("returns bikes with primary first", async () => {
      const userId = await createTestUser(ds);
      const first = await api.bikes.create(userId, bikeInput({ model: "A" }));
      const second = await api.bikes.create(userId, bikeInput({ model: "B" }));

      // second is not primary, first is
      expect(first.is_primary).toBe(true);
      expect(second.is_primary).toBe(false);

      const { items } = await api.bikes.listByUser(userId);
      expect(items).toHaveLength(2);
      expect(items[0].id).toBe(first.id);
      expect(items[0].is_primary).toBe(true);
      expect(items[1].id).toBe(second.id);
    });
  });

  describe("update", () => {
    test("modifies fields and verifies ownership", async () => {
      const userId = await createTestUser(ds);
      const bike = await api.bikes.create(userId, bikeInput());

      const updated = await api.bikes.update(userId, {
        id: bike.id,
        year: 2023,
        make: "Indian",
        model: "Challenger",
        trim: "Limited",
        mods: "Stage 2 exhaust",
      });

      expect(updated).not.toBeNull();
      expect(updated!.year).toBe(2023);
      expect(updated!.make).toBe("Indian");
      expect(updated!.model).toBe("Challenger");
      expect(updated!.trim).toBe("Limited");
      expect(updated!.mods).toBe("Stage 2 exhaust");
    });

    test("returns null when userId doesn't match bike owner", async () => {
      const owner = await createTestUser(ds, { username: "owner" });
      const stranger = await createTestUser(ds, { username: "stranger" });
      const bike = await api.bikes.create(owner, bikeInput());

      const result = await api.bikes.update(stranger, {
        id: bike.id,
        year: 1999,
      });

      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    test("removes bike", async () => {
      const userId = await createTestUser(ds);
      const bike = await api.bikes.create(userId, bikeInput());

      const result = await api.bikes.delete(userId, bike.id);
      expect(result.success).toBe(true);

      const { items } = await api.bikes.listByUser(userId);
      expect(items).toHaveLength(0);
    });

    test("promotes oldest remaining bike to primary when deleting the primary", async () => {
      const userId = await createTestUser(ds);
      const first = await api.bikes.create(userId, bikeInput({ model: "A" }));
      const second = await api.bikes.create(userId, bikeInput({ model: "B" }));
      const third = await api.bikes.create(userId, bikeInput({ model: "C" }));

      // first is primary
      expect(first.is_primary).toBe(true);

      await api.bikes.delete(userId, first.id);

      const { items } = await api.bikes.listByUser(userId);
      expect(items).toHaveLength(2);
      // oldest remaining (second) should now be primary
      expect(items[0].id).toBe(second.id);
      expect(items[0].is_primary).toBe(true);
      expect(items[1].id).toBe(third.id);
      expect(items[1].is_primary).toBe(false);
    });
  });

  describe("uploadPhoto", () => {
    test("stores photo and thumbnail on bike", async () => {
      const userId = await createTestUser(ds);
      const bike = await api.bikes.create(userId, bikeInput());
      expect(bike.has_photo).toBe(false);

      // 1x1 red pixel JPEG as base64
      const tinyJpeg =
        "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAFBABAAAAAAAAAAAAAAAAAAAACf/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AKgA/9k=";

      const result = await api.bikes.uploadPhoto(userId, bike.id, tinyJpeg);
      expect(result.success).toBe(true);

      const list = await api.bikes.listByUser(userId);
      expect(list.items[0]!.has_photo).toBe(true);
    });

    test("throws when bike doesn't belong to user", async () => {
      const owner = await createTestUser(ds, { username: "photo-owner" });
      const stranger = await createTestUser(ds, { username: "photo-stranger" });
      const bike = await api.bikes.create(owner, bikeInput());

      expect(api.bikes.uploadPhoto(stranger, bike.id, "abc")).rejects.toThrow("Bike not found");
    });
  });

  describe("getPhoto", () => {
    test("returns null when no photo", async () => {
      const userId = await createTestUser(ds);
      const bike = await api.bikes.create(userId, bikeInput());

      const photo = await api.bikes.getPhoto(bike.id, "full");
      expect(photo).toBeNull();
    });
  });

  describe("deletePhoto", () => {
    test("removes photo from bike", async () => {
      const userId = await createTestUser(ds);
      const bike = await api.bikes.create(userId, bikeInput());

      const tinyJpeg =
        "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAFBABAAAAAAAAAAAAAAAAAAAACf/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AKgA/9k=";

      await api.bikes.uploadPhoto(userId, bike.id, tinyJpeg);
      const result = await api.bikes.deletePhoto(userId, bike.id);
      expect(result.success).toBe(true);

      const list = await api.bikes.listByUser(userId);
      expect(list.items[0]!.has_photo).toBe(false);
    });
  });

  describe("setPrimary", () => {
    test("sets target to primary and unsets others", async () => {
      const userId = await createTestUser(ds);
      const first = await api.bikes.create(userId, bikeInput({ model: "A" }));
      const second = await api.bikes.create(userId, bikeInput({ model: "B" }));

      expect(first.is_primary).toBe(true);
      expect(second.is_primary).toBe(false);

      const result = await api.bikes.setPrimary(userId, second.id);
      expect(result.success).toBe(true);

      const { items } = await api.bikes.listByUser(userId);
      const primaryBike = items.find((b) => b.id === second.id);
      const otherBike = items.find((b) => b.id === first.id);
      expect(primaryBike!.is_primary).toBe(true);
      expect(otherBike!.is_primary).toBe(false);
    });

    test("throws when bike doesn't belong to user", async () => {
      const owner = await createTestUser(ds, { username: "bike-owner" });
      const stranger = await createTestUser(ds, { username: "bike-stranger" });
      const bike = await api.bikes.create(owner, bikeInput());

      expect(api.bikes.setPrimary(stranger, bike.id)).rejects.toThrow("Bike not found");
    });
  });
});
