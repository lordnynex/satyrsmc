import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { setupTestDb, teardownTestDb } from "../../test/setup";
import type { Api } from "../api";
import type { DataSource } from "typeorm";
import { BAD_ID } from "./helpers";

describe("DocumentsService", () => {
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

  describe("get", () => {
    test("returns document by id", async () => {
      const doc = await api.documents.create("initial");
      const got = await api.documents.get(doc.id);
      expect(got).not.toBeNull();
      expect(got!.id).toBe(doc.id);
      expect(got!.content).toBe("initial");
    });

    test("get(badId) returns null", async () => {
      const result = await api.documents.get(BAD_ID);
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    test("create() uses default content", async () => {
      const doc = await api.documents.create();
      expect(doc.id).toBeDefined();
      expect(doc.content).toBeDefined();
    });

    test("create(content) uses given content", async () => {
      const doc = await api.documents.create('{"type":"doc","content":[]}');
      expect(doc.content).toBe('{"type":"doc","content":[]}');
    });
  });

  describe("update", () => {
    test("update creates new version", async () => {
      const doc = await api.documents.create("v1");
      const updated = await api.documents.update(doc.id, { content: "v2" });
      expect(updated).not.toBeNull();
      expect(updated!.content).toBe("v2");
      const versions = await api.documents.listVersions(doc.id);
      expect(versions.length).toBeGreaterThanOrEqual(1);
    });

    test("update(badId) returns null", async () => {
      const result = await api.documents.update(BAD_ID, { content: "x" });
      expect(result).toBeNull();
    });
  });

  describe("listVersions", () => {
    test("returns versions for document", async () => {
      const doc = await api.documents.create("a");
      await api.documents.update(doc.id, { content: "b" });
      const versions = await api.documents.listVersions(doc.id);
      expect(Array.isArray(versions)).toBe(true);
      expect(versions.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("getVersion", () => {
    test("returns version by number", async () => {
      const doc = await api.documents.create("orig");
      await api.documents.update(doc.id, { content: "updated" });
      const versions = await api.documents.listVersions(doc.id);
      expect(versions.length).toBeGreaterThanOrEqual(1);
      const v = await api.documents.getVersion(doc.id, versions[0]!.version_number);
      expect(v).not.toBeNull();
      expect(v!.content).toBe("orig");
    });

    test("getVersion(docId, badVersion) returns null", async () => {
      const doc = await api.documents.create("x");
      const v = await api.documents.getVersion(doc.id, 99999);
      expect(v).toBeNull();
    });
  });

  describe("restore", () => {
    test("restores document to version", async () => {
      const doc = await api.documents.create("v1");
      await api.documents.update(doc.id, { content: "v2" });
      const versions = await api.documents.listVersions(doc.id);
      const v1Version = versions.find((v) => v.content === "v1");
      expect(v1Version).toBeDefined();
      const restored = await api.documents.restore(doc.id, v1Version!.id);
      expect(restored).not.toBeNull();
      expect(restored!.content).toBe("v1");
    });
  });

  describe("exportPdf", () => {
    test("returns buffer or null", async () => {
      const doc = await api.documents.create('{"type":"doc","content":[{"type":"paragraph"}]}');
      const pdf = await api.documents.exportPdf(doc.id);
      expect(pdf === null || Buffer.isBuffer(pdf)).toBe(true);
    });
  });
});
