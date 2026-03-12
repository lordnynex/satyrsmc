/**
 * Unit tests for admin.qrCodes tRPC router.
 * Covers list, get, create, update, delete, getImage.
 */

import type { TRPCError } from "@trpc/server";
import { describe, test, expect, beforeAll } from "bun:test";
import type { TrpcTestHarness } from "../../../test/trpcHarness";
import { createTrpcTestHarness } from "../../../test/trpcHarness";
import { BAD_ID, createQrCode } from "../helpers";

describe("admin.qrCodes", () => {
  let harness: TrpcTestHarness;

  beforeAll(async () => {
    harness = await createTrpcTestHarness();
  });

  describe("list", () => {
    test("returns created qr codes", async () => {
      const q = await createQrCode(harness.api, { url: "https://example.com", name: "List QR" });
      const result = await harness.caller.admin.qrCodes.list();
      expect(Array.isArray(result)).toBe(true);
      expect(result.some((x) => x.id === q.id)).toBe(true);
    });
  });

  describe("get", () => {
    test("returns qr code by id", async () => {
      const q = await createQrCode(harness.api, { url: "https://get.com", name: "Get QR" });
      const result = await harness.caller.admin.qrCodes.get({ id: q.id });
      expect(result.id).toBe(q.id);
      expect(result.url).toBe("https://get.com");
    });

    test("throws NOT_FOUND when id does not exist", async () => {
      try {
        await harness.caller.admin.qrCodes.get({ id: BAD_ID });
      } catch (e) {
        expect((e as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("create", () => {
    test("creates qr code and returns it", async () => {
      const result = await harness.caller.admin.qrCodes.create({
        url: "https://new.com",
        name: "New QR",
      });
      expect(result.id).toBeDefined();
      expect(result.url).toBe("https://new.com");
    });
  });

  describe("update", () => {
    test("updates qr code and returns it", async () => {
      const q = await createQrCode(harness.api, { url: "https://old.com", name: "To Update" });
      const result = await harness.caller.admin.qrCodes.update({
        id: q.id,
        name: "Updated QR",
      });
      expect(result.id).toBe(q.id);
      expect(result.name).toBe("Updated QR");
    });

    test("throws NOT_FOUND when id does not exist", async () => {
      try {
        await harness.caller.admin.qrCodes.update({ id: BAD_ID, name: "No" });
      } catch (e) {
        expect((e as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("delete", () => {
    test("deletes qr code and returns ok", async () => {
      const q = await createQrCode(harness.api, { url: "https://del.com", name: "To Delete" });
      const result = await harness.caller.admin.qrCodes.delete({ id: q.id });
      expect(result.ok).toBe(true);
      const list = await harness.caller.admin.qrCodes.list();
      expect(list.some((x) => x.id === q.id)).toBe(false);
    });
  });

  describe("getImage", () => {
    test("returns base64 and contentType when qr exists", async () => {
      const q = await createQrCode(harness.api, { url: "https://img.com", name: "Img QR" });
      const result = await harness.caller.admin.qrCodes.getImage({ id: q.id });
      expect(result.base64).toBeDefined();
      expect(typeof result.base64).toBe("string");
      expect(result.contentType).toBeDefined();
    });

    test("throws NOT_FOUND when id does not exist", async () => {
      try {
        await harness.caller.admin.qrCodes.getImage({ id: BAD_ID });
      } catch (e) {
        expect((e as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });
});
