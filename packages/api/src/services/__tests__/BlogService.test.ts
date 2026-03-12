import { describe, test, expect, beforeAll } from "bun:test";
import { setupTestDb } from "../../test/setup";
import type { Api } from "../api";
import type { DataSource } from "typeorm";
import { BAD_ID, createBlogPost } from "./helpers";

describe("BlogService", () => {
  let api: Api;
  let _ds: DataSource;

  beforeAll(async () => {
    const result = await setupTestDb();
    api = result.api;
    _ds = result.ds;
  });

  describe("listPublished", () => {
    test("returns only published posts", async () => {
      const post = await createBlogPost(api, {
        slug: "published-post",
        title: "Published",
        published_at: new Date().toISOString(),
      });
      const result = await api.blog.listPublished(50);
      expect(result.some((p) => p.id === post.id)).toBe(true);
    });

    test("listPublished(limit) respects limit", async () => {
      const result = await api.blog.listPublished(5);
      expect(result.length).toBeLessThanOrEqual(5);
    });
  });

  describe("listAll", () => {
    test("returns all posts", async () => {
      const post = await createBlogPost(api, {
        slug: "all-post",
        title: "All Post",
        published_at: null,
      });
      const result = await api.blog.listAll();
      expect(result.some((p) => p.id === post.id)).toBe(true);
    });
  });

  describe("getBySlug", () => {
    test("returns post by slug", async () => {
      const post = await createBlogPost(api, { slug: "get-slug-post", title: "Get Slug" });
      const got = await api.blog.getBySlug("get-slug-post");
      expect(got).not.toBeNull();
      expect(got!.id).toBe(post.id);
      expect(got!.slug).toBe("get-slug-post");
    });

    test("getBySlug(bad) returns null", async () => {
      const result = await api.blog.getBySlug("nonexistent-slug-xyz");
      expect(result).toBeNull();
    });
  });

  describe("getById", () => {
    test("returns post by id", async () => {
      const post = await createBlogPost(api, { slug: "get-id-post", title: "Get Id" });
      const got = await api.blog.getById(post.id);
      expect(got).not.toBeNull();
      expect(got!.id).toBe(post.id);
    });

    test("getById(bad) returns null", async () => {
      const result = await api.blog.getById(BAD_ID);
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    test("creates post", async () => {
      const post = await createBlogPost(api, { slug: "create-post", title: "Create Post" });
      expect(post.id).toBeDefined();
      expect(post.slug).toBe("create-post");
    });
  });

  describe("update", () => {
    test("updates post", async () => {
      const post = await createBlogPost(api, { slug: "update-post", title: "Update Post" });
      const updated = await api.blog.update(post.id, { title: "Updated Title" });
      expect(updated).not.toBeNull();
      expect(updated!.title).toBe("Updated Title");
    });

    test("update(badId) returns null", async () => {
      const result = await api.blog.update(BAD_ID, { title: "No" });
      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    test("deletes post", async () => {
      const post = await createBlogPost(api, { slug: "delete-post", title: "Delete Post" });
      await api.blog.delete(post.id);
      const got = await api.blog.getById(post.id);
      expect(got).toBeNull();
    });

    test("delete(badId) returns false", async () => {
      const result = await api.blog.delete(BAD_ID);
      expect(result).toBe(false);
    });
  });

  describe("listPublished excludes unpublished", () => {
    test("unpublished post not in listPublished", async () => {
      const post = await createBlogPost(api, {
        slug: "unpublished-only",
        title: "Unpublished",
        published_at: null,
      });
      const published = await api.blog.listPublished(100);
      const found = published.find((p) => p.id === post.id);
      expect(found).toBeUndefined();
    });
  });
});
