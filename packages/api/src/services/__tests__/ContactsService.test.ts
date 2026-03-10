import { describe, test, expect, beforeAll } from "bun:test";
import { setupTestDb } from "../../test/setup";
import type { Api } from "../api";
import type { DataSource } from "typeorm";
import { BAD_ID, MINIMAL_JPEG_BUFFER, createContact } from "./helpers";

describe("ContactsService", () => {
  let api: Api;
  let ds: DataSource;

  beforeAll(async () => {
    const result = await setupTestDb();
    api = result.api;
    ds = result.ds;
  });

  describe("create", () => {
    test("creates a contact and returns it", async () => {
      const contact = await createContact(api, {
        display_name: "John Doe",
        type: "person",
        first_name: "John",
        last_name: "Doe",
      });

      expect(contact.id).toBeDefined();
      expect(contact.display_name).toBe("John Doe");
      expect(contact.first_name).toBe("John");
      expect(contact.last_name).toBe("Doe");
      expect(contact.type).toBe("person");
      expect(contact.status).toBe("active");
      expect(contact.created_at).toBeDefined();
      expect(typeof contact.created_at).toBe("string");
    });
  });

  describe("list", () => {
    test("returns created contacts in list", async () => {
      const a = await createContact(api, { display_name: "List Alice" });
      const b = await createContact(api, { display_name: "List Bob" });

      const result = await api.contacts.list({});
      expect(result.contacts.some((c) => c.id === a.id)).toBe(true);
      expect(result.contacts.some((c) => c.id === b.id)).toBe(true);
      expect(result.total).toBeGreaterThanOrEqual(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBeDefined();
    });

    test("filters by search query (case-insensitive)", async () => {
      const contact = await createContact(api, { display_name: "Searchable Alice Smith" });
      const result = await api.contacts.list({ q: "alice" });
      expect(result.contacts.some((c) => c.id === contact.id)).toBe(true);
      expect(result.contacts.find((c) => c.id === contact.id)?.display_name).toBe("Searchable Alice Smith");
    });

    test("pagination: page and limit", async () => {
      const contact = await createContact(api, { display_name: "Pagination Contact" });
      const result = await api.contacts.list({ page: 1, limit: 5 });
      expect(result.page).toBe(1);
      expect(result.limit).toBe(5);
      expect(result.contacts.some((c) => c.id === contact.id)).toBe(true);
    });

    test("limit over 100 is capped at 100", async () => {
      const result = await api.contacts.list({ limit: 200 });
      expect(result.limit).toBe(100);
    });

    test("sort and sortDir", async () => {
      const c = await createContact(api, { display_name: "Sort Contact" });
      const byName = await api.contacts.list({ sort: "name", sortDir: "asc" });
      const byUpdated = await api.contacts.list({ sort: "updated_at", sortDir: "desc" });
      expect(byName.contacts.some((x) => x.id === c.id)).toBe(true);
      expect(byUpdated.contacts.some((x) => x.id === c.id)).toBe(true);
    });

    test("status filter", async () => {
      const active = await createContact(api, { display_name: "Active Contact" });
      const result = await api.contacts.list({ status: "active" });
      expect(result.contacts.some((c) => c.id === active.id)).toBe(true);
    });

    test("hasEmail filter when contact has email", async () => {
      const contact = await createContact(api, {
        display_name: "With Email",
        emails: [{ email: "test@example.com", type: "other", is_primary: true }],
      });
      const result = await api.contacts.list({ hasEmail: true });
      expect(result.contacts.some((c) => c.id === contact.id)).toBe(true);
    });

    test("hasPostalAddress filter when contact has address", async () => {
      const contact = await createContact(api, {
        display_name: "With Address",
        addresses: [{ address_line1: "123 Main St", city: "City", country: "US", type: "home", is_primary_mailing: true }],
      });
      const result = await api.contacts.list({ hasPostalAddress: true });
      expect(result.contacts.some((c) => c.id === contact.id)).toBe(true);
    });

    test("hellenic filter", async () => {
      const contact = await createContact(api, { display_name: "Hellenic Contact", hellenic: true });
      const result = await api.contacts.list({ hellenic: true });
      expect(result.contacts.some((c) => c.id === contact.id)).toBe(true);
    });

    test("excludeDeceased filter", async () => {
      const alive = await createContact(api, { display_name: "Alive Contact", deceased: false });
      const result = await api.contacts.list({ excludeDeceased: true });
      expect(result.contacts.some((c) => c.id === alive.id)).toBe(true);
    });
  });

  describe("get", () => {
    test("returns a contact by id", async () => {
      const created = await createContact(api, { display_name: "Get Jane" });
      const contact = await api.contacts.get(created.id);

      expect(contact).not.toBeNull();
      expect(contact!.id).toBe(created.id);
      expect(contact!.display_name).toBe("Get Jane");
    });

    test("returns contact with emails, phones, addresses, emergency_contacts, notes, tags", async () => {
      const created = await createContact(api, {
        display_name: "Full Contact",
        emails: [{ email: "e@example.com", type: "work", is_primary: true }],
        phones: [{ phone: "555-1234", type: "cell", is_primary: true }],
        addresses: [{ address_line1: "1 St", city: "Town", country: "US", type: "home", is_primary_mailing: true }],
        emergency_contacts: [{ name: "Emergency", phone: "555-9999" }],
      });
      const contact = await api.contacts.get(created.id);
      expect(contact).not.toBeNull();
      expect(contact!.emails?.length).toBeGreaterThanOrEqual(1);
      expect(contact!.phones?.length).toBeGreaterThanOrEqual(1);
      expect(contact!.addresses?.length).toBeGreaterThanOrEqual(1);
      expect(contact!.emergency_contacts?.length).toBeGreaterThanOrEqual(1);
    });

    test("get(nonExistentId) returns null", async () => {
      const contact = await api.contacts.get(BAD_ID);
      expect(contact).toBeNull();
    });
  });

  describe("update", () => {
    test("partial update", async () => {
      const created = await createContact(api, { display_name: "To Update", first_name: "Old" });
      const updated = await api.contacts.update(created.id, { first_name: "New", last_name: "Name" });
      expect(updated).not.toBeNull();
      expect(updated!.first_name).toBe("New");
      expect(updated!.last_name).toBe("Name");
      expect(updated!.display_name).toBe("To Update");
    });

    test("update(nonExistentId) returns null", async () => {
      const result = await api.contacts.update(BAD_ID, { display_name: "No" });
      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    test("soft-deletes a contact", async () => {
      const created = await createContact(api, { display_name: "ToDelete" });
      await api.contacts.delete(created.id);

      const listResult = await api.contacts.list({});
      expect(listResult.contacts.some((c) => c.id === created.id)).toBe(false);
      const getResult = await api.contacts.get(created.id);
      expect(getResult).not.toBeNull();
      expect(getResult!.status).toBe("deleted");
    });

    test("delete(nonExistentId) does not throw", async () => {
      await expect(api.contacts.delete(BAD_ID)).resolves.toEqual({ ok: true });
    });
  });

  describe("restore", () => {
    test("restores soft-deleted contact", async () => {
      const created = await createContact(api, { display_name: "ToRestore" });
      await api.contacts.delete(created.id);
      const restored = await api.contacts.restore(created.id);
      expect(restored).not.toBeNull();
      expect(restored!.id).toBe(created.id);
      expect(restored!.status).toBe("active");
      const listResult = await api.contacts.list({});
      expect(listResult.contacts.some((c) => c.id === created.id)).toBe(true);
    });

    test("restore(nonExistentId) does not throw", async () => {
      const result = await api.contacts.restore(BAD_ID);
      expect(result).toBeDefined();
    });
  });

  describe("bulkUpdate", () => {
    test("updates status for multiple contacts", async () => {
      const a = await createContact(api, { display_name: "Bulk A" });
      const b = await createContact(api, { display_name: "Bulk B" });
      await api.contacts.bulkUpdate([a.id, b.id], { status: "inactive" });
      const getA = await api.contacts.get(a.id);
      const getB = await api.contacts.get(b.id);
      expect(getA?.status).toBe("inactive");
      expect(getB?.status).toBe("inactive");
    });
  });

  describe("merge", () => {
    test("merges two contacts", async () => {
      const source = await createContact(api, { display_name: "Source", first_name: "Source" });
      const target = await createContact(api, { display_name: "Target", first_name: "Target" });
      const merged = await api.contacts.merge(source.id, target.id);
      expect(merged).not.toBeNull();
      expect(merged!.id).toBe(target.id);
      const sourceAfter = await api.contacts.get(source.id);
      expect(sourceAfter?.status).toBe("deleted");
    });

    test("merge with non-existent source returns null", async () => {
      const target = await createContact(api, { display_name: "Target Only" });
      const result = await api.contacts.merge(BAD_ID, target.id);
      expect(result).toBeNull();
    });

    test("merge with non-existent target returns null", async () => {
      const source = await createContact(api, { display_name: "Source Only" });
      const result = await api.contacts.merge(source.id, BAD_ID);
      expect(result).toBeNull();
    });
  });

  describe("getForDeduplication", () => {
    test("returns expected shape", async () => {
      const contact = await createContact(api, {
        display_name: "Dedup Contact",
        emails: [{ email: "dedup@example.com", type: "other", is_primary: false }],
      });
      const list = await api.contacts.getForDeduplication();
      const found = list.find((c) => c.id === contact.id);
      expect(found).toBeDefined();
      expect(found).toHaveProperty("id");
      expect(found).toHaveProperty("display_name");
      expect(found).toHaveProperty("emails");
      expect(Array.isArray(found!.emails)).toBe(true);
      expect(found).toHaveProperty("addressKey");
      expect(found).toHaveProperty("nameKey");
    });
  });

  describe("photos", () => {
    type AddPhotoResult = { id: string; contact_id: string; photo_url: string; photo_thumbnail_url: string };

    test("addPhoto returns photo with urls", async () => {
      const contact = await createContact(api, { display_name: "Photo Contact" });
      const photo = await api.contacts.addPhoto(contact.id, MINIMAL_JPEG_BUFFER);
      expect(photo).not.toBeNull();
      const p = photo as AddPhotoResult;
      expect(p.id).toBeDefined();
      expect(p.contact_id).toBe(contact.id);
      expect(p.photo_url).toContain(contact.id);
      expect(p.photo_thumbnail_url).toContain(contact.id);
    });

    test("getPhoto returns buffer for thumbnail and full", async () => {
      const contact = await createContact(api, { display_name: "Get Photo Contact" });
      const added = await api.contacts.addPhoto(contact.id, MINIMAL_JPEG_BUFFER);
      expect(added).not.toBeNull();
      const p = added as AddPhotoResult;
      const thumb = await api.contacts.getPhoto(contact.id, p.id, "thumbnail");
      const full = await api.contacts.getPhoto(contact.id, p.id, "full");
      expect(thumb).toBeInstanceOf(Buffer);
      expect(full).toBeInstanceOf(Buffer);
    });

    test("setProfilePhoto", async () => {
      const contact = await createContact(api, { display_name: "Profile Photo Contact" });
      const photo = await api.contacts.addPhoto(contact.id, MINIMAL_JPEG_BUFFER, "contact", false);
      expect(photo).not.toBeNull();
      const p = photo as AddPhotoResult;
      const set = await api.contacts.setProfilePhoto(contact.id, p.id);
      expect(set).toBe(true);
    });

    test("deletePhoto removes photo", async () => {
      const contact = await createContact(api, { display_name: "Delete Photo Contact" });
      const photo = await api.contacts.addPhoto(contact.id, MINIMAL_JPEG_BUFFER);
      expect(photo).not.toBeNull();
      const p = photo as AddPhotoResult;
      await api.contacts.deletePhoto(contact.id, p.id);
      const getAfter = await api.contacts.getPhoto(contact.id, p.id, "full");
      expect(getAfter).toBeNull();
    });

    test("getPhoto(badContactId) returns null", async () => {
      const contact = await createContact(api, { display_name: "Bad Contact Photo" });
      const photo = await api.contacts.addPhoto(contact.id, MINIMAL_JPEG_BUFFER);
      expect(photo).not.toBeNull();
      const p = photo as AddPhotoResult;
      const result = await api.contacts.getPhoto(BAD_ID, p.id, "full");
      expect(result).toBeNull();
    });

    test("getPhoto(contactId, badPhotoId) returns null", async () => {
      const contact = await createContact(api, { display_name: "Bad Photo Id" });
      const result = await api.contacts.getPhoto(contact.id, BAD_ID, "full");
      expect(result).toBeNull();
    });
  });

  describe("date serialization", () => {
    test("returns dates as ISO strings, not Date objects", async () => {
      const contact = await createContact(api, { display_name: "DateTest" });
      expect(typeof contact.created_at).toBe("string");
      if (contact.created_at) {
        expect(new Date(contact.created_at).toISOString()).toBe(contact.created_at);
      }
    });
  });

  describe("boolean fields", () => {
    test("returns booleans correctly", async () => {
      const contact = await createContact(api, {
        display_name: "BoolTest",
        do_not_contact: true,
      });
      expect(contact.do_not_contact).toBe(true);
    });
  });
});
