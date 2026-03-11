import { describe, test, expect, beforeAll } from "bun:test";
import { setupTestDb } from "../../test/setup";
import type { Api } from "../api";
import type { DataSource } from "typeorm";
import { BAD_ID, createSitePage } from "./helpers";

describe("SitePagesService", () => {
  let api: Api;
  let _ds: DataSource;

  beforeAll(async () => {
    const result = await setupTestDb();
    api = result.api;
    _ds = result.ds;
  });

  describe("list", () => {
    test("returns created pages", async () => {
      const p = await createSitePage(api, { slug: "list-page", title: "List Page" });
      const result = await api.sitePages.list();
      expect(result.some((e) => e.id === p.id)).toBe(true);
    });
  });

  describe("getById", () => {
    test("returns page by id", async () => {
      const p = await createSitePage(api, { slug: "get-by-id", title: "Get By Id" });
      const got = await api.sitePages.getById(p.id);
      expect(got).not.toBeNull();
      expect(got!.id).toBe(p.id);
      expect(got!.title).toBe("Get By Id");
    });

    test("getById(badId) returns null", async () => {
      const result = await api.sitePages.getById(BAD_ID);
      expect(result).toBeNull();
    });
  });

  describe("getBySlug", () => {
    test("returns page by slug", async () => {
      await createSitePage(api, { slug: "get-by-slug-page", title: "Get By Slug" });
      const got = await api.sitePages.getBySlug("get-by-slug-page");
      expect(got).not.toBeNull();
      expect(got!.slug).toBe("get-by-slug-page");
    });

    test("getBySlug(nonExistent) returns null", async () => {
      const result = await api.sitePages.getBySlug("nonexistent-slug-xyz");
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    test("creates page", async () => {
      const p = await createSitePage(api, {
        slug: "create-page",
        title: "Create Page",
        body: "Body",
      });
      expect(p.id).toBeDefined();
      expect(p.slug).toBe("create-page");
      expect(p.body).toBe("Body");
    });
  });

  describe("update", () => {
    test("updates page", async () => {
      const p = await createSitePage(api, { slug: "update-page", title: "Update Page" });
      const updated = await api.sitePages.update(p.id, {
        title: "Updated Title",
        body: "New body",
      });
      expect(updated).not.toBeNull();
      expect(updated!.title).toBe("Updated Title");
      expect(updated!.body).toBe("New body");
    });

    test("update(badId) returns null", async () => {
      const result = await api.sitePages.update(BAD_ID, { title: "No" });
      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    test("deletes page", async () => {
      const p = await createSitePage(api, { slug: "delete-page", title: "Delete Page" });
      await api.sitePages.delete(p.id);
      const got = await api.sitePages.getById(p.id);
      expect(got).toBeNull();
    });

    test("delete(badId) returns false", async () => {
      const result = await api.sitePages.delete(BAD_ID);
      expect(result).toBe(false);
    });
  });
});
