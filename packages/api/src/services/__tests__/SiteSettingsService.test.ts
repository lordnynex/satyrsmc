import { describe, test, expect, beforeAll } from "vitest";
import { setupTestDb } from "../../test/setup";
import type { Api } from "../api";
import type { DataSource } from "typeorm";

describe("SiteSettingsService", () => {
  let api: Api;
  let _ds: DataSource;

  beforeAll(async () => {
    const result = await setupTestDb();
    api = result.api;
    _ds = result.ds;
  });

  describe("get", () => {
    test("returns settings (creates default if missing)", async () => {
      const settings = await api.siteSettings.get();
      expect(settings).toHaveProperty("id");
      expect(settings).toHaveProperty("title");
      expect(settings).toHaveProperty("logo_url");
      expect(settings).toHaveProperty("footer_text");
      expect(settings).toHaveProperty("default_meta_description");
      expect(settings).toHaveProperty("contact_email");
      expect(settings).toHaveProperty("updated_at");
    });
  });

  describe("update", () => {
    test("updates and get reflects changes", async () => {
      await api.siteSettings.update({
        title: "Test Site Title",
        footer_text: "Footer",
        contact_email: "test@example.com",
      });
      const settings = await api.siteSettings.get();
      expect(settings.title).toBe("Test Site Title");
      expect(settings.footer_text).toBe("Footer");
      expect(settings.contact_email).toBe("test@example.com");
    });

    test("partial update leaves other fields unchanged", async () => {
      await api.siteSettings.update({ title: "Partial Title" });
      const settings = await api.siteSettings.get();
      expect(settings.title).toBe("Partial Title");
    });

    test("empty update({}) leaves values unchanged", async () => {
      await api.siteSettings.update({ title: "Before Empty" });
      await api.siteSettings.update({});
      const settings = await api.siteSettings.get();
      expect(settings.title).toBe("Before Empty");
    });
  });
});
