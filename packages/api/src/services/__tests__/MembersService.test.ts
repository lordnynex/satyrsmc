import { describe, test, expect, beforeAll } from "bun:test";
import { setupTestDb } from "../../test/setup";
import type { Api } from "../api";
import type { DataSource } from "typeorm";
import { MemberPhotoSize } from "@satyrsmc/shared/lib/enums";
import { BAD_ID, MINIMAL_JPEG_BUFFER, createMember } from "./helpers";
import { ContactEmail } from "../../entities/ContactEmail";
import { ContactPhone } from "../../entities/ContactPhone";
import { ContactAddress } from "../../entities/ContactAddress";
import { ContactEmergencyContact } from "../../entities/ContactEmergencyContact";
import { Contact } from "../../entities/Contact";
import { Member } from "../../entities/Member";

describe("MembersService", () => {
  let api: Api;
  let ds: DataSource;

  beforeAll(async () => {
    const result = await setupTestDb();
    api = result.api;
    ds = result.ds;
  });

  describe("list", () => {
    test("returns created members", async () => {
      const m = await createMember(api, { name: "List Member" });
      const result = await api.members.list();
      expect(result.some((e) => e.id === m.id)).toBe(true);
    });
  });

  describe("listForWebsite", () => {
    test("returns only show_on_website members", async () => {
      const m = await createMember(api, { name: "Web Member" });
      await api.members.update(m.id, { show_on_website: true });
      const result = await api.members.listForWebsite();
      expect(result.some((e) => e.id === m.id)).toBe(true);
    });
  });

  describe("get", () => {
    test("returns member by id", async () => {
      const m = await createMember(api, { name: "Get Member" });
      const got = await api.members.get(m.id);
      expect(got).not.toBeNull();
      expect(got!.id).toBe(m.id);
      expect(got!.name).toBe("Get Member");
    });

    test("get(badId) returns null", async () => {
      const result = await api.members.get(BAD_ID);
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    test("creates member", async () => {
      const m = await createMember(api, { name: "New Member" });
      expect(m.id).toBeDefined();
      expect(m.name).toBe("New Member");
    });
  });

  describe("update", () => {
    test("updates member", async () => {
      const m = await createMember(api, { name: "Update Member" });
      const updated = await api.members.update(m.id, { name: "Updated Name" });
      expect(updated).not.toBeNull();
      expect(updated!.name).toBe("Updated Name");
    });

    test("update(badId) returns null", async () => {
      const result = await api.members.update(BAD_ID, { name: "No" });
      expect(result).toBeNull();
    });
  });

  describe("delete", () => {
    test("deletes member", async () => {
      const m = await createMember(api, { name: "Delete Member" });
      await api.members.delete(m.id);
      const got = await api.members.get(m.id);
      expect(got).toBeNull();
    });
  });

  describe("contact integration", () => {
    test("create sets contact_id and creates Contact record", async () => {
      const m = await createMember(api, { name: "Contact Test Member" });
      const member = await ds.getRepository(Member).findOne({ where: { id: m.id } });
      expect(member!.contactId).not.toBeNull();
      const contact = await ds
        .getRepository(Contact)
        .findOne({ where: { id: member!.contactId! } });
      expect(contact).not.toBeNull();
      expect(contact!.displayName).toBe("Contact Test Member");
    });

    test("create with email creates ContactEmail", async () => {
      const m = await createMember(api, { name: "Email Member", email: "test@test.com" });
      const member = await ds.getRepository(Member).findOne({ where: { id: m.id } });
      const emails = await ds
        .getRepository(ContactEmail)
        .find({ where: { contactId: member!.contactId! } });
      expect(emails.length).toBe(1);
      expect(emails[0]!.email).toBe("test@test.com");
      expect(emails[0]!.isPrimary).toBe(true);
    });

    test("create with phone creates ContactPhone", async () => {
      const m = await createMember(api, { name: "Phone Member", phone_number: "555-1234" });
      const member = await ds.getRepository(Member).findOne({ where: { id: m.id } });
      const phones = await ds
        .getRepository(ContactPhone)
        .find({ where: { contactId: member!.contactId! } });
      expect(phones.length).toBe(1);
      expect(phones[0]!.phone).toBe("555-1234");
    });

    test("create with address creates ContactAddress", async () => {
      const m = await createMember(api, { name: "Addr Member", address: "123 Main St" });
      const member = await ds.getRepository(Member).findOne({ where: { id: m.id } });
      const addrs = await ds
        .getRepository(ContactAddress)
        .find({ where: { contactId: member!.contactId! } });
      expect(addrs.length).toBe(1);
      expect(addrs[0]!.addressLine1).toBe("123 Main St");
    });

    test("create with emergency contact creates ContactEmergencyContact", async () => {
      const m = await createMember(api, {
        name: "EC Member",
        emergency_contact_name: "Jane Doe",
        emergency_contact_phone: "555-9999",
      });
      const member = await ds.getRepository(Member).findOne({ where: { id: m.id } });
      const ecs = await ds
        .getRepository(ContactEmergencyContact)
        .find({ where: { contactId: member!.contactId! } });
      expect(ecs.length).toBe(1);
      expect(ecs[0]!.name).toBe("Jane Doe");
      expect(ecs[0]!.phone).toBe("555-9999");
    });

    test("get reads from contact sub-tables", async () => {
      const m = await createMember(api, {
        name: "Read Contact Member",
        email: "read@contact.com",
        phone_number: "555-0001",
        emergency_contact_name: "EC Name",
        emergency_contact_phone: "555-0002",
      });
      const got = await api.members.get(m.id);
      expect(got!.email).toBe("read@contact.com");
      expect(got!.phone_number).toBe("555-0001");
      expect(got!.emergency_contact_name).toBe("EC Name");
      expect(got!.emergency_contact_phone).toBe("555-0002");
    });

    test("update syncs contact sub-tables", async () => {
      const m = await createMember(api, {
        name: "Sync Member",
        email: "old@email.com",
        phone_number: "555-OLD",
      });
      const member = await ds.getRepository(Member).findOne({ where: { id: m.id } });
      const contactId = member!.contactId!;

      await api.members.update(m.id, {
        name: "Synced Name",
        email: "new@email.com",
        phone_number: "555-NEW",
      });

      // Verify contact display name updated
      const contact = await ds.getRepository(Contact).findOne({ where: { id: contactId } });
      expect(contact!.displayName).toBe("Synced Name");

      // Verify email updated
      const emails = await ds.getRepository(ContactEmail).find({ where: { contactId } });
      expect(emails[0]!.email).toBe("new@email.com");

      // Verify phone updated
      const phones = await ds.getRepository(ContactPhone).find({ where: { contactId } });
      expect(phones[0]!.phone).toBe("555-NEW");

      // Verify the get reads the updated contact data
      const got = await api.members.get(m.id);
      expect(got!.email).toBe("new@email.com");
      expect(got!.phone_number).toBe("555-NEW");
    });

    test("update removes contact sub-records when set to null", async () => {
      const m = await createMember(api, {
        name: "Remove Sub Member",
        email: "remove@test.com",
        phone_number: "555-DEL",
      });
      const member = await ds.getRepository(Member).findOne({ where: { id: m.id } });
      const contactId = member!.contactId!;

      await api.members.update(m.id, { email: null, phone_number: null });

      const emails = await ds.getRepository(ContactEmail).find({ where: { contactId } });
      expect(emails.length).toBe(0);

      const phones = await ds.getRepository(ContactPhone).find({ where: { contactId } });
      expect(phones.length).toBe(0);

      const got = await api.members.get(m.id);
      expect(got!.email).toBeNull();
      expect(got!.phone_number).toBeNull();
    });

    test("list reads from contact sub-tables", async () => {
      const m = await createMember(api, {
        name: "List Contact Member",
        email: "list@contact.com",
      });
      const result = await api.members.list();
      const found = result.find((e) => e.id === m.id);
      expect(found).not.toBeUndefined();
      expect(found!.email).toBe("list@contact.com");
    });
  });

  describe("getPhoto", () => {
    test("returns buffer when member has photo", async () => {
      const m = await createMember(api, {
        name: "Photo Member",
        photo: MINIMAL_JPEG_BUFFER.toString("base64"),
      } as Record<string, unknown>);
      const thumb = await api.members.getPhoto(m.id, MemberPhotoSize.Thumbnail);
      const full = await api.members.getPhoto(m.id, MemberPhotoSize.Full);
      expect(thumb).toBeInstanceOf(Buffer);
      expect(full).toBeInstanceOf(Buffer);
    });

    test("getPhoto(badId) returns null", async () => {
      const result = await api.members.getPhoto(BAD_ID, MemberPhotoSize.Full);
      expect(result).toBeNull();
    });

    test("getPhoto(id) when no photo returns null", async () => {
      const m = await createMember(api, { name: "No Photo Member" });
      const result = await api.members.getPhoto(m.id, MemberPhotoSize.Full);
      expect(result).toBeNull();
    });
  });
});
