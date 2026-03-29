/**
 * Unit tests for admin.documents tRPC router.
 * Covers get, update, getVersions, restore, exportPdf (no create in router).
 */

import type { TRPCError } from "@trpc/server";
import { describe, test, expect, beforeAll } from "vitest";
import type { TrpcTestHarness } from "../../../test/trpcHarness";
import { createTrpcTestHarness } from "../../../test/trpcHarness";
import { BAD_ID } from "../helpers";

describe("admin.documents", () => {
  let harness: TrpcTestHarness;

  beforeAll(async () => {
    harness = await createTrpcTestHarness();
  });

  describe("get", () => {
    test("returns document by id when it exists", async () => {
      const doc = await harness.api.documents.create("initial content");
      const result = await harness.caller.admin.documents.get({ id: doc.id });
      expect(result.id).toBe(doc.id);
      expect(result.content).toBeDefined();
    });

    test("throws NOT_FOUND when id does not exist", async () => {
      try {
        await harness.caller.admin.documents.get({ id: BAD_ID });
      } catch (e) {
        expect((e as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("update", () => {
    test("updates document and returns it", async () => {
      const doc = await harness.api.documents.create("original");
      const result = await harness.caller.admin.documents.update({
        id: doc.id,
        content: "updated content",
      });
      expect(result.id).toBe(doc.id);
      expect(result.content).toBe("updated content");
    });

    test("throws NOT_FOUND when id does not exist", async () => {
      try {
        await harness.caller.admin.documents.update({ id: BAD_ID, content: "x" });
      } catch (e) {
        expect((e as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("getVersions", () => {
    test("returns versions for document", async () => {
      const doc = await harness.api.documents.create("v1");
      await harness.api.documents.update(doc.id, { content: "v2" });
      const result = await harness.caller.admin.documents.getVersions({ id: doc.id });
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("restore", () => {
    test("restores document to version", async () => {
      const doc = await harness.api.documents.create("v1");
      await harness.api.documents.update(doc.id, { content: "v2" });
      const versions = await harness.api.documents.listVersions(doc.id);
      const firstVersionId = versions[0]?.id;
      expect(firstVersionId).toBeDefined();
      if (firstVersionId) {
        await harness.caller.admin.documents.restore({
          id: doc.id,
          versionId: firstVersionId,
        });
        const got = await harness.caller.admin.documents.get({ id: doc.id });
        expect(got.content).toBeDefined();
      }
    });
  });

  describe("exportPdf", () => {
    test("returns base64 pdf when document exists", async () => {
      const doc = await harness.api.documents.create(
        '{"type":"doc","content":[{"type":"paragraph"}]}',
      );
      const result = await harness.caller.admin.documents.exportPdf({ id: doc.id });
      expect(result.base64).toBeDefined();
      expect(typeof result.base64).toBe("string");
    });

    test("throws NOT_FOUND when id does not exist", async () => {
      try {
        await harness.caller.admin.documents.exportPdf({ id: BAD_ID });
      } catch (e) {
        expect((e as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });
});
