import { describe, test, expect, beforeAll } from "vitest";
import { setupTestDb } from "../../test/setup";
import type { Api } from "../api";
import type { DataSource } from "typeorm";
import { EventType } from "@satyrsmc/shared/lib/enums";
import { BAD_ID, MINIMAL_JPEG_BUFFER, createEvent } from "./helpers";

describe("EventsService", () => {
  let api: Api;
  let _ds: DataSource;

  beforeAll(async () => {
    const result = await setupTestDb();
    api = result.api;
    _ds = result.ds;
  });

  describe("list", () => {
    test("returns created events", async () => {
      const ev = await createEvent(api, { name: "List Event" });
      const result = await api.events.list();
      expect(result.some((e) => e.id === ev.id)).toBe(true);
      expect(result.find((e) => e.id === ev.id)?.name).toBe("List Event");
    });

    test("filters by type", async () => {
      const ev = await createEvent(api, { name: "Anniversary Event", event_type: "anniversary" });
      const result = await api.events.list("anniversary");
      expect(result.some((e) => e.id === ev.id)).toBe(true);
    });

    test("listForWebsite returns only show_on_website events", async () => {
      const ev = await createEvent(api, { name: "Web Event", show_on_website: true });
      const result = await api.events.listForWebsite();
      expect(result.some((e) => e.id === ev.id)).toBe(true);
    });
  });

  describe("get", () => {
    test("returns full event detail", async () => {
      const ev = await createEvent(api, { name: "Get Event", description: "Desc" });
      const detail = await api.events.get(ev.id);
      expect(detail).not.toBeNull();
      expect(detail!.id).toBe(ev.id);
      expect(detail!.name).toBe("Get Event");
      expect(detail!.description).toBe("Desc");
    });

    test("get(badId) returns null", async () => {
      const result = await api.events.get(BAD_ID);
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    test("creates event with minimal body", async () => {
      const ev = await createEvent(api, { name: "Minimal Event" });
      expect(ev.id).toBeDefined();
      expect(ev.name).toBe("Minimal Event");
      expect(ev.event_type).toBe(EventType.Badger);
    });

    test("creates event with full body", async () => {
      const ev = await createEvent(api, {
        name: "Full Event",
        event_type: "badger",
        description: "D",
        year: 2025,
        start_date: "2025-06-01",
        event_location: "Here",
        show_on_website: true,
      });
      expect(ev.description).toBe("D");
      expect(ev.year).toBe(2025);
      expect(ev.event_location).toBe("Here");
    });
  });

  describe("update", () => {
    test("updates event", async () => {
      const ev = await createEvent(api, { name: "Update Me" });
      const updated = await api.events.update(ev.id, { name: "Updated Name" });
      expect(updated).not.toBeNull();
      expect(updated!.name).toBe("Updated Name");
    });

    test("update(badId) returns null", async () => {
      const result = await api.events.update(BAD_ID, { name: "No" });
      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    test("deletes event", async () => {
      const ev = await createEvent(api, { name: "Delete Me" });
      await api.events.delete(ev.id);
      const getResult = await api.events.get(ev.id);
      expect(getResult).toBeNull();
    });

    test("delete(badId) does not throw", async () => {
      await expect(api.events.delete(BAD_ID)).resolves.toEqual({ ok: true });
    });
  });

  describe("photos", () => {
    test("addPhoto returns photo", async () => {
      const ev = await createEvent(api, { name: "Photo Event" });
      const photo = await api.events.addPhoto(ev.id, MINIMAL_JPEG_BUFFER);
      expect(photo).not.toBeNull();
      expect(photo!.event_id).toBe(ev.id);
      expect(photo!.photo_url).toContain(ev.id);
    });

    test("getPhoto returns buffer", async () => {
      const ev = await createEvent(api, { name: "Get Photo Event" });
      const added = await api.events.addPhoto(ev.id, MINIMAL_JPEG_BUFFER);
      expect(added).not.toBeNull();
      const buf = await api.events.getPhoto(ev.id, added!.id, "full");
      expect(buf).toBeInstanceOf(Buffer);
    });

    test("deletePhoto removes photo", async () => {
      const ev = await createEvent(api, { name: "Del Photo Event" });
      const added = await api.events.addPhoto(ev.id, MINIMAL_JPEG_BUFFER);
      expect(added).not.toBeNull();
      await api.events.deletePhoto(ev.id, added!.id);
      const after = await api.events.getPhoto(ev.id, added!.id, "full");
      expect(after).toBeNull();
    });

    test("getPhoto(badEventId) returns null", async () => {
      const ev = await createEvent(api, { name: "Bad Event Photo" });
      const added = await api.events.addPhoto(ev.id, MINIMAL_JPEG_BUFFER);
      const result = await api.events.getPhoto(BAD_ID, added!.id, "full");
      expect(result).toBeNull();
    });

    test("getPhoto(eventId, badPhotoId) returns null", async () => {
      const ev = await createEvent(api, { name: "Bad Photo Id Event" });
      const result = await api.events.getPhoto(ev.id, BAD_ID, "full");
      expect(result).toBeNull();
    });

    test("addPhoto(badEventId) returns null", async () => {
      const result = await api.events.addPhoto(BAD_ID, MINIMAL_JPEG_BUFFER);
      expect(result).toBeNull();
    });
  });

  describe("assets", () => {
    test("addAsset returns asset", async () => {
      const ev = await createEvent(api, { name: "Asset Event" });
      const asset = await api.events.addAsset(ev.id, MINIMAL_JPEG_BUFFER);
      expect(asset).not.toBeNull();
      expect(asset!.event_id).toBe(ev.id);
    });

    test("getAsset returns buffer", async () => {
      const ev = await createEvent(api, { name: "Get Asset Event" });
      const added = await api.events.addAsset(ev.id, MINIMAL_JPEG_BUFFER);
      expect(added).not.toBeNull();
      const buf = await api.events.getAsset(ev.id, added!.id, "full");
      expect(buf).toBeInstanceOf(Buffer);
    });

    test("deleteAsset removes asset", async () => {
      const ev = await createEvent(api, { name: "Del Asset Event" });
      const added = await api.events.addAsset(ev.id, MINIMAL_JPEG_BUFFER);
      expect(added).not.toBeNull();
      await api.events.deleteAsset(ev.id, added!.id);
      const after = await api.events.getAsset(ev.id, added!.id, "full");
      expect(after).toBeNull();
    });

    test("getAsset(badEventId) returns null", async () => {
      const ev = await createEvent(api, { name: "Bad Event Asset" });
      const added = await api.events.addAsset(ev.id, MINIMAL_JPEG_BUFFER);
      const result = await api.events.getAsset(BAD_ID, added!.id, "full");
      expect(result).toBeNull();
    });

    test("getAsset(eventId, badAssetId) returns null", async () => {
      const ev = await createEvent(api, { name: "Bad Asset Id Event" });
      const result = await api.events.getAsset(ev.id, BAD_ID, "full");
      expect(result).toBeNull();
    });
  });

  describe("listIncidents", () => {
    test("returns paginated shape", async () => {
      const result = await api.events.listIncidents(1, 10);
      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("page", 1);
      expect(result).toHaveProperty("per_page", 10);
      expect(result).toHaveProperty("total");
      expect(Array.isArray(result.items)).toBe(true);
    });
  });
});
