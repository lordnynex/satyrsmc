import { describe, test, expect, beforeAll } from "vitest";
import { setupTestDb } from "../../test/setup";
import type { Api } from "../api";
import type { DataSource } from "typeorm";
import { BAD_ID, createQrCode } from "./helpers";

describe("QrCodesService", () => {
  let api: Api;
  let _ds: DataSource;

  beforeAll(async () => {
    const result = await setupTestDb();
    api = result.api;
    _ds = result.ds;
  });

  describe("list", () => {
    test("returns created qr codes", async () => {
      const qr = await createQrCode(api, { url: "https://example.com/list" });
      const result = await api.qrCodes.list();
      expect(result.some((e) => e.id === qr.id)).toBe(true);
    });
  });

  describe("get", () => {
    test("returns qr code by id", async () => {
      const qr = await createQrCode(api, { url: "https://get.example.com", name: "Get QR" });
      const got = await api.qrCodes.get(qr.id);
      expect(got).not.toBeNull();
      expect(got!.id).toBe(qr.id);
      expect(got!.url).toBe("https://get.example.com");
    });

    test("get(badId) returns null", async () => {
      const result = await api.qrCodes.get(BAD_ID);
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    test("creates qr code", async () => {
      const qr = await createQrCode(api, { url: "https://new.example.com", name: "New QR" });
      expect(qr.id).toBeDefined();
      expect(qr.url).toBe("https://new.example.com");
    });
  });

  describe("getImage", () => {
    test("returns buffer and contentType", async () => {
      const qr = await createQrCode(api, { url: "https://img.example.com" });
      const result = await api.qrCodes.getImage(qr.id);
      expect(result).not.toBeNull();
      const buf: unknown = result!.buffer;
      expect(Buffer.isBuffer(buf) || buf instanceof Uint8Array).toBe(true);
      expect(result!.contentType).toBeDefined();
    });

    test("getImage with sizeOverride", async () => {
      const qr = await createQrCode(api, { url: "https://size.example.com" });
      const result = await api.qrCodes.getImage(qr.id, 200);
      expect(result).not.toBeNull();
    });

    test("getImage(badId) returns null", async () => {
      const result = await api.qrCodes.getImage(BAD_ID);
      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    test("updates qr code", async () => {
      const qr = await createQrCode(api, { url: "https://upd.example.com", name: "Upd" });
      const updated = await api.qrCodes.update(qr.id, {
        name: "Updated",
        url: "https://updated.example.com",
      });
      expect(updated).not.toBeNull();
      expect(updated!.name).toBe("Updated");
      expect(updated!.url).toBe("https://updated.example.com");
    });

    test("update(badId) returns null", async () => {
      const result = await api.qrCodes.update(BAD_ID, { name: "No" });
      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    test("deletes qr code", async () => {
      const qr = await createQrCode(api, { url: "https://del.example.com" });
      await api.qrCodes.delete(qr.id);
      const got = await api.qrCodes.get(qr.id);
      expect(got).toBeNull();
    });

    test("delete(badId) returns false", async () => {
      const result = await api.qrCodes.delete(BAD_ID);
      expect(result).toBe(false);
    });
  });
});
