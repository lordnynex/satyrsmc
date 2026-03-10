import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { setupTestDb, teardownTestDb } from "../../test/setup";
import type { Api } from "../api";
import type { DataSource } from "typeorm";

describe("SiteMenusService", () => {
  let api: Api;
  let ds: DataSource;

  beforeAll(async () => {
    const result = await setupTestDb();
    api = result.api;
    ds = result.ds;
  });

  afterAll(async () => {
    await teardownTestDb(ds);
  });

  describe("listAll", () => {
    test("returns menus object", async () => {
      const result = await api.siteMenus.listAll();
      expect(typeof result).toBe("object");
      expect(Array.isArray(result) === false).toBe(true);
    });
  });

  describe("updateMenu", () => {
    test("updateMenu adds items and listAll returns them", async () => {
      const key = `test-menu-${Date.now()}`;
      const items = [
        { label: "Home", url: "/", sort_order: 0 },
        { label: "About", url: "/about", sort_order: 1 },
      ];
      const updated = await api.siteMenus.updateMenu(key, items);
      expect(Array.isArray(updated)).toBe(true);
      expect(updated.length).toBe(2);
      expect(updated[0]!.label).toBe("Home");
      expect(updated[0]!.menu_key).toBe(key);
      const all = await api.siteMenus.listAll();
      expect(all[key]).toBeDefined();
      expect(all[key].length).toBe(2);
    });

    test("updateMenu(key, []) clears menu", async () => {
      const key = `empty-menu-${Date.now()}`;
      await api.siteMenus.updateMenu(key, [{ label: "Only", url: "/only", sort_order: 0 }]);
      await api.siteMenus.updateMenu(key, []);
      const all = await api.siteMenus.listAll();
      expect(all[key]?.length ?? 0).toBe(0);
    });
  });
});
