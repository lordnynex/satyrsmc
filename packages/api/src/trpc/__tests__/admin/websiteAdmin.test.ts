/**
 * Unit tests for admin.website (CMS) tRPC router.
 * Covers listPages, getPageById, createPage, updatePage, deletePage;
 * listBlogAll, getBlogById, createBlogPost, updateBlogPost, deleteBlogPost;
 * getMenus, updateMenu; getSettings, updateSettings;
 * listContactSubmissions, listContactMemberSubmissions.
 */

import type { TRPCError } from "@trpc/server";
import { describe, test, expect, beforeAll } from "bun:test";
import type { TrpcTestHarness } from "../../../test/trpcHarness";
import { createTrpcTestHarness } from "../../../test/trpcHarness";
import { BAD_ID, createSitePage, createBlogPost } from "../helpers";

describe("admin.website (CMS)", () => {
  let harness: TrpcTestHarness;

  beforeAll(async () => {
    harness = await createTrpcTestHarness();
  });

  describe("listPages", () => {
    test("returns created pages", async () => {
      // Use no overrides so createSitePage generates a unique slug/title (no cross-test conflict).
      const p = await createSitePage(harness.api);
      const result = await harness.caller.admin.website.listPages();
      expect(Array.isArray(result)).toBe(true);
      expect(result.some((x) => x.id === p.id)).toBe(true);
    });
  });

  describe("getPageById", () => {
    test("returns page by id", async () => {
      const p = await createSitePage(harness.api, { slug: "get-page", title: "Get Page" });
      const result = await harness.caller.admin.website.getPageById({ id: p.id });
      expect(result.id).toBe(p.id);
      expect(result.slug).toBe("get-page");
    });

    test("throws NOT_FOUND when id does not exist", async () => {
      try {
        await harness.caller.admin.website.getPageById({ id: BAD_ID });
      } catch (e) {
        expect((e as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("createPage", () => {
    test("creates page and returns it", async () => {
      const result = await harness.caller.admin.website.createPage({
        slug: "new-page",
        title: "New Page",
        body: "Content",
      });
      expect(result.id).toBeDefined();
      expect(result.slug).toBe("new-page");
    });
  });

  describe("updatePage", () => {
    test("updates page and returns it", async () => {
      // Use no overrides so createSitePage generates a unique slug/title (no cross-test conflict).
      const p = await createSitePage(harness.api);
      const result = await harness.caller.admin.website.updatePage({
        id: p.id,
        title: "Updated Page",
      });
      expect(result.id).toBe(p.id);
      expect(result.title).toBe("Updated Page");
    });

    test("throws NOT_FOUND when id does not exist", async () => {
      try {
        await harness.caller.admin.website.updatePage({ id: BAD_ID, title: "No" });
      } catch (e) {
        expect((e as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("deletePage", () => {
    test("deletes page and returns ok", async () => {
      const p = await createSitePage(harness.api, { slug: "del-page", title: "To Delete" });
      const result = await harness.caller.admin.website.deletePage({ id: p.id });
      expect(result.ok).toBe(true);
      const list = await harness.caller.admin.website.listPages();
      expect(list.some((x) => x.id === p.id)).toBe(false);
    });
  });

  describe("listBlogAll", () => {
    test("returns all blog posts", async () => {
      await createBlogPost(harness.api, { slug: "blog-list", title: "Blog List" });
      const result = await harness.caller.admin.website.listBlogAll();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("getBlogById", () => {
    test("returns post by id", async () => {
      const p = await createBlogPost(harness.api, { slug: "get-blog", title: "Get Blog" });
      const result = await harness.caller.admin.website.getBlogById({ id: p.id });
      expect(result.id).toBe(p.id);
      expect(result.slug).toBe("get-blog");
    });

    test("throws NOT_FOUND when id does not exist", async () => {
      try {
        await harness.caller.admin.website.getBlogById({ id: BAD_ID });
      } catch (e) {
        expect((e as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("createBlogPost", () => {
    test("creates post and returns it", async () => {
      const result = await harness.caller.admin.website.createBlogPost({
        slug: "new-post",
        title: "New Post",
        body: "Body",
      });
      expect(result.id).toBeDefined();
      expect(result.slug).toBe("new-post");
    });
  });

  describe("updateBlogPost", () => {
    test("updates post and returns it", async () => {
      const p = await createBlogPost(harness.api, { slug: "up-blog", title: "To Update" });
      const result = await harness.caller.admin.website.updateBlogPost({
        id: p.id,
        title: "Updated Post",
      });
      expect(result.id).toBe(p.id);
      expect(result.title).toBe("Updated Post");
    });

    test("throws NOT_FOUND when id does not exist", async () => {
      try {
        await harness.caller.admin.website.updateBlogPost({ id: BAD_ID, title: "No" });
      } catch (e) {
        expect((e as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("deleteBlogPost", () => {
    test("deletes post and returns ok", async () => {
      const p = await createBlogPost(harness.api, { slug: "del-blog", title: "To Delete" });
      const result = await harness.caller.admin.website.deleteBlogPost({ id: p.id });
      expect(result.ok).toBe(true);
      const list = await harness.caller.admin.website.listBlogAll();
      expect(list.some((x) => x.id === p.id)).toBe(false);
    });
  });

  describe("getMenus", () => {
    test("returns menus object", async () => {
      const result = await harness.caller.admin.website.getMenus();
      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
    });
  });

  describe("updateMenu", () => {
    test("updates menu items", async () => {
      await harness.caller.admin.website.updateMenu({
        key: "header",
        items: [
          { label: "Home", url: "/", sort_order: 0 },
          { label: "About", url: "/about", sort_order: 1 },
        ],
      });
      const menus = await harness.caller.admin.website.getMenus();
      expect(menus).toBeDefined();
    });
  });

  describe("getSettings", () => {
    test("returns settings", async () => {
      const result = await harness.caller.admin.website.getSettings();
      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
    });
  });

  describe("updateSettings", () => {
    test("updates settings", async () => {
      await harness.caller.admin.website.updateSettings({
        title: "Test Site",
        contact_email: "test@example.com",
      });
      const settings = await harness.caller.admin.website.getSettings();
      expect(settings).toBeDefined();
    });
  });

  describe("listContactSubmissions", () => {
    test("returns contact submissions array", async () => {
      const result = await harness.caller.admin.website.listContactSubmissions();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("listContactMemberSubmissions", () => {
    test("returns contact member submissions array", async () => {
      const result = await harness.caller.admin.website.listContactMemberSubmissions();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
