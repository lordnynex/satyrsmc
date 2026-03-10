/**
 * Unit tests for the public website tRPC router (website.*).
 * Covers getEventsFeed, getMembersFeed, getBlogPublished, getBlogBySlug, getPages,
 * getPageBySlug, getPageById, submitContact, submitContactMember, getMenus, getSettings.
 */

import { TRPCError } from "@trpc/server";
import { describe, test, expect, beforeAll } from "bun:test";
import type { TrpcTestHarness } from "../../test/trpcHarness";
import { createTrpcTestHarness } from "../../test/trpcHarness";
import { BAD_ID, createMember, createBlogPost, createSitePage } from "../../services/__tests__/helpers";

describe("website router", () => {
  let harness: TrpcTestHarness;

  beforeAll(async () => {
    harness = await createTrpcTestHarness();
  });

  // --- getEventsFeed: returns events for website (no input) ---
  describe("getEventsFeed", () => {
    test("returns array of events for website", async () => {
      const result = await harness.caller.website.getEventsFeed();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // --- getMembersFeed: returns members for website (no input) ---
  describe("getMembersFeed", () => {
    test("returns array of members for website", async () => {
      const result = await harness.caller.website.getMembersFeed();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // --- getBlogPublished: returns published blog posts (no input) ---
  describe("getBlogPublished", () => {
    test("returns array of published posts", async () => {
      const result = await harness.caller.website.getBlogPublished();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // --- getBlogBySlug: returns post by slug; NOT_FOUND when slug does not exist ---
  describe("getBlogBySlug", () => {
    test("returns post when slug exists", async () => {
      await createBlogPost(harness.api, {
        slug: "test-post",
        title: "Test Post",
        published_at: new Date().toISOString(),
      });
      const result = await harness.caller.website.getBlogBySlug({ slug: "test-post" });
      expect(result.slug).toBe("test-post");
      expect(result.title).toBe("Test Post");
    });

    test("throws NOT_FOUND when slug does not exist", async () => {
      await expect(harness.caller.website.getBlogBySlug({ slug: "nonexistent-slug-xyz" })).rejects.toThrow(TRPCError);
      try {
        await harness.caller.website.getBlogBySlug({ slug: "nonexistent-slug-xyz" });
      } catch (e) {
        expect((e as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  // --- getPages: returns all pages (no input) ---
  describe("getPages", () => {
    test("returns array of pages", async () => {
      const result = await harness.caller.website.getPages();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // --- getPageBySlug: returns page by slug; NOT_FOUND when slug does not exist ---
  describe("getPageBySlug", () => {
    test("returns page when slug exists", async () => {
      await createSitePage(harness.api, { slug: "about", title: "About" });
      const result = await harness.caller.website.getPageBySlug({ slug: "about" });
      expect(result.slug).toBe("about");
      expect(result.title).toBe("About");
    });

    test("throws NOT_FOUND when slug does not exist", async () => {
      try {
        await harness.caller.website.getPageBySlug({ slug: "no-such-page" });
      } catch (e) {
        expect((e as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  // --- getPageById: returns page by id; NOT_FOUND when id does not exist ---
  describe("getPageById", () => {
    test("returns page when id exists", async () => {
      const page = await createSitePage(harness.api, { slug: "by-id-page", title: "By Id" });
      const result = await harness.caller.website.getPageById({ id: page.id });
      expect(result.id).toBe(page.id);
      expect(result.slug).toBe("by-id-page");
    });

    test("throws NOT_FOUND when id does not exist", async () => {
      try {
        await harness.caller.website.getPageById({ id: BAD_ID });
      } catch (e) {
        expect((e as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  // --- submitContact: mutation; validates email and required fields ---
  describe("submitContact", () => {
    test("creates contact submission with valid input", async () => {
      const result = await harness.caller.website.submitContact({
        name: "Jane Doe",
        email: "jane@example.com",
        message: "Hello",
      });
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    });

    test("accepts optional subject", async () => {
      const result = await harness.caller.website.submitContact({
        name: "With Subject",
        email: "subj@example.com",
        subject: "Question",
        message: "Body",
      });
      expect(result.id).toBeDefined();
    });

    test("rejects invalid email (BAD_REQUEST)", async () => {
      await expect(
        harness.caller.website.submitContact({
          name: "Bad Email",
          email: "not-an-email",
          message: "Hi",
        })
      ).rejects.toThrow(TRPCError);
      try {
        await harness.caller.website.submitContact({
          name: "Bad Email",
          email: "not-an-email",
          message: "Hi",
        });
      } catch (e) {
        expect((e as TRPCError).code).toBe("BAD_REQUEST");
      }
    });
  });

  // --- submitContactMember: mutation; requires valid member_id ---
  describe("submitContactMember", () => {
    test("creates contact member submission when member exists", async () => {
      const member = await createMember(harness.api, { name: "Contactable Member" });
      const result = await harness.caller.website.submitContactMember({
        member_id: member.id,
        sender_name: "Sender",
        sender_email: "sender@example.com",
        message: "Message",
      });
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
    });

    test("rejects invalid email (BAD_REQUEST)", async () => {
      const member = await createMember(harness.api, { name: "M" });
      await expect(
        harness.caller.website.submitContactMember({
          member_id: member.id,
          sender_name: "S",
          sender_email: "invalid",
          message: "M",
        })
      ).rejects.toThrow(TRPCError);
      try {
        await harness.caller.website.submitContactMember({
          member_id: member.id,
          sender_name: "S",
          sender_email: "invalid",
          message: "M",
        });
      } catch (e) {
        expect((e as TRPCError).code).toBe("BAD_REQUEST");
      }
    });
  });

  // --- getMenus: returns menus (no input) ---
  describe("getMenus", () => {
    test("returns menus object", async () => {
      const result = await harness.caller.website.getMenus();
      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
    });
  });

  // --- getSettings: returns site settings (no input) ---
  describe("getSettings", () => {
    test("returns settings object", async () => {
      const result = await harness.caller.website.getSettings();
      expect(result).toBeDefined();
      expect(typeof result).toBe("object");
    });
  });
});
