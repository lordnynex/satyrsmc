import { In, IsNull } from "typeorm";
import type { DataSource } from "typeorm";
import type { DbLike } from "../db/dbAdapter";
import { toISOString, toISOStringOrNull } from "../lib/date";
import type {
  Contact,
  ContactEmail,
  ContactPhone,
  ContactAddress,
  ContactEmergencyContact,
  ContactNote,
  ContactPhoto as ContactPhotoType,
  Tag,
  ContactSearchParams,
  ContactSearchResult,
} from "@satyrsmc/shared/types/contact";
import {
  Contact as ContactEntity,
  ContactEmail as ContactEmailEntity,
  ContactPhone as ContactPhoneEntity,
  ContactAddress as ContactAddressEntity,
  ContactEmergencyContact as ContactEmergencyContactEntity,
  ContactNote as ContactNoteEntity,
  ContactPhoto as ContactPhotoEntity,
  Tag as TagEntity,
  ContactTag,
} from "../entities";
import { ImageService } from "./ImageService";
import { uuid } from "./utils";

export type ContactPhotoSize = "thumbnail" | "display" | "full";

function entityToContact(e: ContactEntity): Contact {
  return {
    id: e.id,
    type: (e.type as Contact["type"]) ?? "person",
    status: (e.status as Contact["status"]) ?? "active",
    display_name: e.displayName ?? "",
    first_name: e.firstName,
    last_name: e.lastName,
    organization_name: e.organizationName,
    notes: e.notes,
    how_we_know_them: e.howWeKnowThem,
    ok_to_email: (e.okToEmail as Contact["ok_to_email"]) ?? "unknown",
    ok_to_mail: (e.okToMail as Contact["ok_to_mail"]) ?? "unknown",
    ok_to_sms: (e.okToSms as Contact["ok_to_sms"]) ?? "unknown",
    do_not_contact: e.doNotContact,
    club_name: e.clubName,
    role: e.role,
    uid: e.uid,
    created_at: toISOString(e.createdAt),
    updated_at: toISOString(e.updatedAt),
    deleted_at: toISOStringOrNull(e.deletedAt),
    hellenic: e.hellenic,
    deceased: e.deceased,
    deceased_year: e.deceasedYear ?? null,
  };
}

function rowToContact(row: Record<string, unknown>): Contact {
  return {
    id: row.id as string,
    type: (row.type as Contact["type"]) ?? "person",
    status: (row.status as Contact["status"]) ?? "active",
    display_name: (row.display_name as string) ?? "",
    first_name: (row.first_name as string) ?? null,
    last_name: (row.last_name as string) ?? null,
    organization_name: (row.organization_name as string) ?? null,
    notes: (row.notes as string) ?? null,
    how_we_know_them: (row.how_we_know_them as string) ?? null,
    ok_to_email: (row.ok_to_email as Contact["ok_to_email"]) ?? "unknown",
    ok_to_mail: (row.ok_to_mail as Contact["ok_to_mail"]) ?? "unknown",
    ok_to_sms: (row.ok_to_sms as Contact["ok_to_sms"]) ?? "unknown",
    do_not_contact: row.do_not_contact as boolean,
    club_name: (row.club_name as string) ?? null,
    role: (row.role as string) ?? null,
    uid: (row.uid as string) ?? null,
    created_at: toISOString(row.created_at as Date | string | null | undefined),
    updated_at: toISOString(row.updated_at as Date | string | null | undefined),
    deleted_at: toISOStringOrNull(row.deleted_at as Date | string | null | undefined),
    hellenic: row.hellenic as boolean,
    deceased: row.deceased as boolean,
    deceased_year: (row.deceased_year as number) ?? null,
  };
}

export class ContactsService {
  constructor(
    private db: DbLike,
    private ds: DataSource,
  ) {}

  private async loadContactRelations(contactId: string): Promise<{
    emails: ContactEmail[];
    phones: ContactPhone[];
    addresses: ContactAddress[];
    emergency_contacts: ContactEmergencyContact[];
    contact_notes: ContactNote[];
    contact_photos: ContactPhotoType[];
    tags: Tag[];
  }> {
    /* Original: SELECT * FROM contact_emails WHERE contact_id = ? ORDER BY is_primary DESC, id */
    const emails = await this.ds.getRepository(ContactEmailEntity).find({
      where: { contactId },
      order: { isPrimary: "DESC", id: "ASC" },
    });
    /* Original: SELECT * FROM contact_phones WHERE contact_id = ? ORDER BY is_primary DESC, id */
    const phones = await this.ds.getRepository(ContactPhoneEntity).find({
      where: { contactId },
      order: { isPrimary: "DESC", id: "ASC" },
    });
    /* Original: SELECT * FROM contact_addresses WHERE contact_id = ? ORDER BY is_primary_mailing DESC, id */
    const addresses = await this.ds.getRepository(ContactAddressEntity).find({
      where: { contactId },
      order: { isPrimaryMailing: "DESC", id: "ASC" },
    });
    /* SELECT * FROM contact_notes WHERE contact_id = ? ORDER BY created_at DESC */
    const notes = await this.ds.getRepository(ContactNoteEntity).find({
      where: { contactId },
      order: { createdAt: "DESC" },
    });
    /* Original: SELECT t.id, t.name FROM tags t JOIN contact_tags ct ON t.id = ct.tag_id WHERE ct.contact_id = ? */
    const contactTags = await this.ds
      .getRepository(ContactTag)
      .find({ where: { contactId } });
    const tagRows =
      contactTags.length > 0
        ? await this.ds.getRepository(TagEntity).find({
            where: { id: In(contactTags.map((ct) => ct.tagId)) },
            order: { name: "ASC" },
          })
        : [];

    /* SELECT * FROM contact_emergency_contacts WHERE contact_id = ? ORDER BY id */
    const emergencyContacts = await this.ds.getRepository(ContactEmergencyContactEntity).find({
      where: { contactId },
      order: { id: "ASC" },
    });

    /* SELECT * FROM contact_photos WHERE contact_id = ? ORDER BY type='profile' DESC, sort_order ASC, created_at ASC */
    const photoEntities = await this.ds.getRepository(ContactPhotoEntity).find({
      where: { contactId },
      order: { sortOrder: "ASC", createdAt: "ASC" },
    });
    // Profile first, then by sort_order
    const sortedPhotos = [...photoEntities].sort((a, b) => {
      if (a.type === "profile" && b.type !== "profile") return -1;
      if (a.type !== "profile" && b.type === "profile") return 1;
      return a.sortOrder - b.sortOrder;
    });

    return {
      emails: emails.map((e) => ({
        id: e.id,
        contact_id: e.contactId,
        email: e.email,
        type: (e.type as ContactEmail["type"]) ?? "other",
        is_primary: e.isPrimary,
      })),
      phones: phones.map((p) => ({
        id: p.id,
        contact_id: p.contactId,
        phone: p.phone,
        type: (p.type as ContactPhone["type"]) ?? "other",
        is_primary: p.isPrimary,
      })),
      addresses: addresses.map((a) => ({
        id: a.id,
        contact_id: a.contactId,
        address_line1: a.addressLine1,
        address_line2: a.addressLine2,
        city: a.city,
        state: a.state,
        postal_code: a.postalCode,
        country: a.country,
        type: (a.type as ContactAddress["type"]) ?? "home",
        is_primary_mailing: a.isPrimaryMailing,
      })),
      emergency_contacts: emergencyContacts.map((ec) => ({
        id: ec.id,
        contact_id: ec.contactId,
        name: ec.name,
        phone: ec.phone,
        email: ec.email,
        relationship: ec.relationship,
      })),
      contact_notes: notes.map((n) => ({
        id: n.id,
        contact_id: n.contactId,
        content: n.content,
        created_at: toISOStringOrNull(n.createdAt),
      })),
      contact_photos: sortedPhotos.map((p) => ({
        id: p.id,
        contact_id: p.contactId,
        type: p.type as ContactPhotoType["type"],
        sort_order: p.sortOrder,
        photo_url: `/api/contacts/${contactId}/photos/${p.id}?size=full`,
        photo_thumbnail_url: `/api/contacts/${contactId}/photos/${p.id}?size=thumbnail`,
        photo_display_url: `/api/contacts/${contactId}/photos/${p.id}?size=display`,
        created_at: toISOStringOrNull(p.createdAt),
      })),
      tags: tagRows.map((t) => ({ id: t.id, name: t.name })),
    };
  }

  /**
   * Get contact photo as buffer for the given size. Returns null if not found.
   */
  async getPhoto(
    contactId: string,
    photoId: string,
    size: ContactPhotoSize,
  ): Promise<Buffer | null> {
    const photo = await this.ds.getRepository(ContactPhotoEntity).findOne({
      where: { id: photoId, contactId },
      select: ["photo", "photoThumbnail"],
    });
    if (!photo || !photo.photo) return null;
    const buffer = Buffer.from(photo.photo);
    const thumbnailBlob = photo.photoThumbnail;

    switch (size) {
      case "thumbnail":
        if (thumbnailBlob) return Buffer.from(thumbnailBlob);
        return ImageService.createThumbnail(buffer);
      case "display":
        return ImageService.createDisplay(buffer);
      case "full":
        return buffer;
      default:
        return buffer;
    }
  }

  /**
   * Add a photo to a contact. Uses ImageService to optimize and generate thumbnail.
   */
  async addPhoto(
    contactId: string,
    imageBuffer: Buffer,
    type: "profile" | "contact" = "contact",
    setAsProfile = false,
  ): Promise<ContactPhotoType | null> {
    const contact = await this.ds
      .getRepository(ContactEntity)
      .findOne({ where: { id: contactId } });
    if (!contact) return null;

    const optimized = await ImageService.optimize(imageBuffer, 1920, 1920, 88);
    const photoBlob = optimized ?? imageBuffer;
    const thumbnailBlob = await ImageService.createThumbnail(photoBlob);

    const id = uuid();
    const finalType = setAsProfile ? "profile" : type;
    const sortOrder = setAsProfile ? 0 : 999;

    if (setAsProfile) {
      await this.db.run(
        "UPDATE contact_photos SET type = 'contact' WHERE contact_id = ?",
        [contactId],
      );
    }

    await this.db.run(
      "INSERT INTO contact_photos (id, contact_id, type, sort_order, photo, photo_thumbnail) VALUES (?, ?, ?, ?, ?, ?)",
      [
        id,
        contactId,
        finalType,
        sortOrder,
        photoBlob,
        thumbnailBlob ?? photoBlob,
      ],
    );

    return {
      id,
      contact_id: contactId,
      type: finalType,
      sort_order: sortOrder,
      photo_url: `/api/contacts/${contactId}/photos/${id}?size=full`,
      photo_thumbnail_url: `/api/contacts/${contactId}/photos/${id}?size=thumbnail`,
      photo_display_url: `/api/contacts/${contactId}/photos/${id}?size=display`,
      created_at: new Date().toISOString(),
    };
  }

  /**
   * Delete a contact photo.
   */
  async deletePhoto(contactId: string, photoId: string): Promise<boolean> {
    const result = await this.ds.getRepository(ContactPhotoEntity).delete({
      id: photoId,
      contactId,
    });
    return (result.affected ?? 0) > 0;
  }

  /**
   * Set a photo as the profile (main) photo.
   */
  async setProfilePhoto(contactId: string, photoId: string): Promise<boolean> {
    const photo = await this.ds.getRepository(ContactPhotoEntity).findOne({
      where: { id: photoId, contactId },
    });
    if (!photo) return false;

    await this.db.run(
      "UPDATE contact_photos SET type = 'contact' WHERE contact_id = ?",
      [contactId],
    );
    await this.db.run(
      "UPDATE contact_photos SET type = 'profile', sort_order = 0 WHERE id = ? AND contact_id = ?",
      [photoId, contactId],
    );
    return true;
  }

  async list(params: ContactSearchParams = {}): Promise<ContactSearchResult> {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 50, 100);
    const offset = (page - 1) * limit;
    const sort = params.sort ?? "updated_at";
    const sortDir = params.sortDir ?? "desc";

    const orderCol = sort === "name" ? "displayName" : "updatedAt";
    const orderDir = sortDir.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const qb = this.ds
      .getRepository(ContactEntity)
      .createQueryBuilder("c")
      .where("c.deletedAt IS NULL");

    if (params.status && params.status !== "all") {
      qb.andWhere("c.status = :status", { status: params.status });
    }
    if (params.hasPostalAddress === true) {
      qb.andWhere(
        "EXISTS (SELECT 1 FROM contact_addresses ca WHERE ca.contact_id = c.id AND ca.address_line1 IS NOT NULL AND ca.address_line1 != '')",
      );
    }
    if (params.hasEmail === true) {
      qb.andWhere(
        "EXISTS (SELECT 1 FROM contact_emails ce WHERE ce.contact_id = c.id)",
      );
    }
    if (params.tagIds && params.tagIds.length > 0) {
      qb.andWhere(
        "c.id IN (SELECT contact_id FROM contact_tags WHERE tag_id IN (:...tagIds))",
        { tagIds: params.tagIds },
      );
    }
    if (params.organization) {
      qb.andWhere("c.organizationName ILIKE :org", {
        org: `%${params.organization}%`,
      });
    }
    if (params.role) {
      qb.andWhere("c.role ILIKE :role", { role: `%${params.role}%` });
    }
    if (params.hellenic === true) {
      qb.andWhere("c.hellenic = true");
    }
    if (params.excludeDeceased === true) {
      qb.andWhere("(c.deceased IS NULL OR c.deceased = false)");
    }
    if (params.q && params.q.trim()) {
      const q = `%${params.q.trim()}%`;
      qb.andWhere(
        `(c.displayName ILIKE :q OR c.firstName ILIKE :q OR c.lastName ILIKE :q OR c.organizationName ILIKE :q OR c.notes ILIKE :q OR c.clubName ILIKE :q OR c.role ILIKE :q OR EXISTS (SELECT 1 FROM contact_emails ce WHERE ce.contact_id = c.id AND ce.email ILIKE :q) OR EXISTS (SELECT 1 FROM contact_phones cp WHERE cp.contact_id = c.id AND cp.phone ILIKE :q) OR EXISTS (SELECT 1 FROM contact_addresses ca WHERE ca.contact_id = c.id AND (ca.city ILIKE :q OR ca.state ILIKE :q)) OR EXISTS (SELECT 1 FROM contact_tags ct JOIN tags t ON t.id = ct.tag_id WHERE ct.contact_id = c.id AND t.name ILIKE :q) OR EXISTS (SELECT 1 FROM contact_notes cn WHERE cn.contact_id = c.id AND cn.content ILIKE :q))`,
        { q },
      );
    }

    /* Original: SELECT COUNT(*) as c FROM contacts WHERE ... */
    const total = await qb.getCount();

    /* Original: SELECT * FROM contacts WHERE ... ORDER BY ... LIMIT ? OFFSET ? */
    const entities = await qb
      .orderBy(`c.${orderCol}`, orderDir as "ASC" | "DESC")
      .skip(offset)
      .take(limit)
      .getMany();

    const contacts = await Promise.all(
      entities.map(async (e) => {
        const c = entityToContact(e);
        const rel = await this.loadContactRelations(c.id);
        return { ...c, ...rel };
      }),
    );

    return { contacts, total, page, limit };
  }

  async get(id: string): Promise<Contact | null> {
    /* Original: SELECT * FROM contacts WHERE id = ? */
    const entity = await this.ds
      .getRepository(ContactEntity)
      .findOne({ where: { id } });
    if (!entity) return null;
    const contact = entityToContact(entity);
    const rel = await this.loadContactRelations(id);
    return { ...contact, ...rel };
  }

  async getForDeduplication(): Promise<
    Array<{
      id: string;
      display_name: string;
      emails: string[];
      addressKey: string;
      nameKey: string;
    }>
  > {
    /* Original: SELECT id, display_name FROM contacts WHERE deleted_at IS NULL */
    const contacts = await this.ds.getRepository(ContactEntity).find({
      where: { deletedAt: IsNull() },
      select: ["id", "displayName"],
    });
    const result: Array<{
      id: string;
      display_name: string;
      emails: string[];
      addressKey: string;
      nameKey: string;
    }> = [];
    for (const row of contacts) {
      /* Original: SELECT email FROM contact_emails WHERE contact_id = ? */
      const emailsRaw = await this.ds.getRepository(ContactEmailEntity).find({
        where: { contactId: row.id },
        select: ["email"],
      });
      const emails = emailsRaw.map((e) => e.email.toLowerCase().trim());
      /* Original: SELECT address_line1, city, postal_code FROM contact_addresses WHERE contact_id = ? ORDER BY is_primary_mailing DESC LIMIT 1 */
      const addr = await this.ds.getRepository(ContactAddressEntity).findOne({
        where: { contactId: row.id },
        select: ["addressLine1", "city", "postalCode"],
        order: { isPrimaryMailing: "DESC" },
      });
      const addressKey = addr
        ? [addr.addressLine1 ?? "", addr.city ?? "", addr.postalCode ?? ""]
            .map((s) => (s ?? "").toLowerCase().replace(/\s+/g, " "))
            .join("|")
        : "";
      const nameKey = (row.displayName ?? "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
      result.push({
        id: row.id,
        display_name: row.displayName ?? "",
        emails,
        addressKey,
        nameKey,
      });
    }
    return result;
  }

  async create(body: Partial<Contact> & { display_name: string }) {
    const id = uuid();
    const uid = body.uid ?? `contact-${id}@satyrsmc`;
    const displayName = body.display_name?.trim() ?? "Unknown";
    const type = body.type ?? "person";
    const status = body.status ?? "active";

    const hellenic = body.hellenic ?? false;
    const deceased = body.deceased ?? false;
    const deceasedYear = body.deceased_year ?? null;
    await this.db.run(
      `INSERT INTO contacts (id, type, status, display_name, first_name, last_name, organization_name, notes, how_we_know_them, ok_to_email, ok_to_mail, ok_to_sms, do_not_contact, club_name, role, uid, hellenic, deceased, deceased_year) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        type,
        status,
        displayName,
        body.first_name ?? null,
        body.last_name ?? null,
        body.organization_name ?? null,
        body.notes ?? null,
        body.how_we_know_them ?? null,
        body.ok_to_email ?? "unknown",
        body.ok_to_mail ?? "unknown",
        body.ok_to_sms ?? "unknown",
        body.do_not_contact ?? false,
        body.club_name ?? null,
        body.role ?? null,
        uid,
        hellenic,
        deceased,
        deceasedYear,
      ],
    );

    if (body.emails?.length) {
      for (const e of body.emails) {
        const eid = uuid();
        await this.db.run(
          "INSERT INTO contact_emails (id, contact_id, email, type, is_primary) VALUES (?, ?, ?, ?, ?)",
          [eid, id, e.email, e.type ?? "other", e.is_primary ?? false],
        );
      }
    }
    if (body.phones?.length) {
      for (const p of body.phones) {
        const pid = uuid();
        await this.db.run(
          "INSERT INTO contact_phones (id, contact_id, phone, type, is_primary) VALUES (?, ?, ?, ?, ?)",
          [pid, id, p.phone, p.type ?? "other", p.is_primary ?? false],
        );
      }
    }
    if (body.addresses?.length) {
      for (const a of body.addresses) {
        const aid = uuid();
        await this.db.run(
          "INSERT INTO contact_addresses (id, contact_id, address_line1, address_line2, city, state, postal_code, country, type, is_primary_mailing) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            aid,
            id,
            a.address_line1 ?? null,
            a.address_line2 ?? null,
            a.city ?? null,
            a.state ?? null,
            a.postal_code ?? null,
            a.country ?? "US",
            a.type ?? "home",
            a.is_primary_mailing ?? false,
          ],
        );
      }
    }
    if (body.emergency_contacts?.length) {
      for (const ec of body.emergency_contacts) {
        if (!ec?.name?.trim() || !ec?.phone?.trim()) continue;
        const ecid = uuid();
        await this.db.run(
          "INSERT INTO contact_emergency_contacts (id, contact_id, name, phone, email, relationship) VALUES (?, ?, ?, ?, ?, ?)",
          [
            ecid,
            id,
            String(ec.name).trim(),
            String(ec.phone).trim(),
            ec.email?.trim() || null,
            ec.relationship?.trim() || null,
          ],
        );
      }
    }
    if (body.tags?.length) {
      for (const t of body.tags) {
        let tagId = typeof t === "string" ? null : t.id;
        if (!tagId && typeof t === "object" && "name" in t) {
          /* Original: SELECT id FROM tags WHERE name = ? */
          const existingTag = await this.ds
            .getRepository(TagEntity)
            .findOne({ where: { name: (t as Tag).name } });
          if (existingTag) tagId = existingTag.id;
          else {
            tagId = uuid();
            await this.db.run("INSERT INTO tags (id, name) VALUES (?, ?)", [
              tagId,
              (t as Tag).name,
            ]);
          }
        }
        if (tagId) {
          try {
            await this.db.run(
              "INSERT INTO contact_tags (contact_id, tag_id) VALUES (?, ?)",
              [id, tagId],
            );
          } catch {
            // duplicate
          }
        }
      }
    }

    return this.get(id)!;
  }

  async update(id: string, body: Partial<Contact>) {
    /* Original: SELECT * FROM contacts WHERE id = ? */
    const existing = await this.ds
      .getRepository(ContactEntity)
      .findOne({ where: { id } });
    if (!existing) return null;

    const display_name = body.display_name ?? existing.displayName ?? "Unknown";
    const type = (body.type ?? existing.type) as Contact["type"];
    const status = (body.status ?? existing.status) as Contact["status"];
    const first_name =
      body.first_name !== undefined ? body.first_name : existing.firstName;
    const last_name =
      body.last_name !== undefined ? body.last_name : existing.lastName;
    const organization_name =
      body.organization_name !== undefined
        ? body.organization_name
        : existing.organizationName;
    const notes = body.notes !== undefined ? body.notes : existing.notes;
    const how_we_know_them =
      body.how_we_know_them !== undefined
        ? body.how_we_know_them
        : existing.howWeKnowThem;
    const ok_to_email = (body.ok_to_email ??
      existing.okToEmail) as Contact["ok_to_email"];
    const ok_to_mail = (body.ok_to_mail ??
      existing.okToMail) as Contact["ok_to_mail"];
    const ok_to_sms = (body.ok_to_sms ??
      existing.okToSms) as Contact["ok_to_sms"];
    const do_not_contact =
      body.do_not_contact ?? existing.doNotContact;
    const club_name =
      body.club_name !== undefined ? body.club_name : existing.clubName;
    const role = body.role !== undefined ? body.role : existing.role;
    const hellenic =
      body.hellenic !== undefined ? body.hellenic : existing.hellenic ?? false;
    const deceased =
      body.deceased !== undefined ? body.deceased : existing.deceased ?? false;
    const deceased_year =
      body.deceased_year !== undefined ? body.deceased_year : existing.deceasedYear ?? null;

    await this.db.run(
      `UPDATE contacts SET display_name=?, type=?, status=?, first_name=?, last_name=?, organization_name=?, notes=?, how_we_know_them=?, ok_to_email=?, ok_to_mail=?, ok_to_sms=?, do_not_contact=?, club_name=?, role=?, hellenic=?, deceased=?, deceased_year=?, updated_at=? WHERE id=?`,
      [
        display_name,
        type,
        status,
        first_name,
        last_name,
        organization_name,
        notes,
        how_we_know_them,
        ok_to_email,
        ok_to_mail,
        ok_to_sms,
        do_not_contact,
        club_name,
        role,
        hellenic,
        deceased,
        deceased_year,
        new Date().toISOString(),
        id,
      ],
    );

    if (body.emails !== undefined) {
      await this.db.run("DELETE FROM contact_emails WHERE contact_id = ?", [
        id,
      ]);
      const validEmails = body.emails.filter(
        (e) => e?.email != null && String(e.email).trim() !== "",
      );
      for (const e of validEmails) {
        const eid = uuid();
        await this.db.run(
          "INSERT INTO contact_emails (id, contact_id, email, type, is_primary) VALUES (?, ?, ?, ?, ?)",
          [
            eid,
            id,
            String(e.email).trim(),
            e.type ?? "other",
            e.is_primary ?? false,
          ],
        );
      }
    }
    if (body.phones !== undefined) {
      await this.db.run("DELETE FROM contact_phones WHERE contact_id = ?", [
        id,
      ]);
      const validPhones = body.phones.filter(
        (p) => p?.phone != null && String(p.phone).trim() !== "",
      );
      for (const p of validPhones) {
        const pid = uuid();
        await this.db.run(
          "INSERT INTO contact_phones (id, contact_id, phone, type, is_primary) VALUES (?, ?, ?, ?, ?)",
          [
            pid,
            id,
            String(p.phone).trim(),
            p.type ?? "other",
            p.is_primary ?? false,
          ],
        );
      }
    }
    if (body.addresses !== undefined) {
      await this.db.run("DELETE FROM contact_addresses WHERE contact_id = ?", [
        id,
      ]);
      for (const a of body.addresses) {
        const aid = uuid();
        await this.db.run(
          "INSERT INTO contact_addresses (id, contact_id, address_line1, address_line2, city, state, postal_code, country, type, is_primary_mailing) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            aid,
            id,
            a.address_line1 ?? null,
            a.address_line2 ?? null,
            a.city ?? null,
            a.state ?? null,
            a.postal_code ?? null,
            a.country ?? "US",
            a.type ?? "home",
            a.is_primary_mailing ?? false,
          ],
        );
      }
    }
    if (body.emergency_contacts !== undefined) {
      await this.db.run("DELETE FROM contact_emergency_contacts WHERE contact_id = ?", [id]);
      const validEmergencyContacts = body.emergency_contacts.filter(
        (ec) => ec?.name?.trim() && ec?.phone?.trim(),
      );
      for (const ec of validEmergencyContacts) {
        const ecid = uuid();
        await this.db.run(
          "INSERT INTO contact_emergency_contacts (id, contact_id, name, phone, email, relationship) VALUES (?, ?, ?, ?, ?, ?)",
          [
            ecid,
            id,
            String(ec.name).trim(),
            String(ec.phone).trim(),
            ec.email?.trim() || null,
            ec.relationship?.trim() || null,
          ],
        );
      }
    }
    if (body.tags !== undefined) {
      await this.db.run("DELETE FROM contact_tags WHERE contact_id = ?", [id]);
      for (const t of body.tags) {
        let tagId = typeof t === "string" ? null : (t as Tag).id;
        const tagName = typeof t === "object" ? (t as Tag).name : t;
        if (!tagId) {
          /* Original: SELECT id FROM tags WHERE name = ? */
          const existingTag = await this.ds
            .getRepository(TagEntity)
            .findOne({ where: { name: tagName } });
          if (existingTag) tagId = existingTag.id;
          else {
            tagId = uuid();
            await this.db.run("INSERT INTO tags (id, name) VALUES (?, ?)", [
              tagId,
              tagName,
            ]);
          }
        }
        if (tagId) {
          try {
            await this.db.run(
              "INSERT INTO contact_tags (contact_id, tag_id) VALUES (?, ?)",
              [id, tagId],
            );
          } catch {
            // duplicate
          }
        }
      }
    }

    return this.get(id)!;
  }

  async delete(id: string) {
    await this.db.run(
      "UPDATE contacts SET status = 'deleted', deleted_at = ?, updated_at = ? WHERE id = ?",
      [new Date().toISOString(), new Date().toISOString(), id],
    );
    return { ok: true };
  }

  async restore(id: string) {
    await this.db.run(
      "UPDATE contacts SET status = 'active', deleted_at = NULL, updated_at = ? WHERE id = ?",
      [new Date().toISOString(), id],
    );
    return this.get(id)!;
  }

  async bulkUpdate(
    ids: string[],
    updates: { tags?: (string | Tag)[]; status?: Contact["status"] },
  ) {
    for (const id of ids) {
      if (updates.status) {
        await this.db.run(
          "UPDATE contacts SET status = ?, updated_at = ? WHERE id = ?",
          [updates.status, new Date().toISOString(), id],
        );
      }
      if (updates.tags) {
        await this.db.run("DELETE FROM contact_tags WHERE contact_id = ?", [
          id,
        ]);
        for (const t of updates.tags) {
          const tagName = typeof t === "object" ? (t as Tag).name : t;
          /* Original: SELECT id FROM tags WHERE name = ? */
          let tagId = (
            await this.ds
              .getRepository(TagEntity)
              .findOne({ where: { name: tagName } })
          )?.id;
          if (!tagId) {
            tagId = uuid();
            await this.db.run("INSERT INTO tags (id, name) VALUES (?, ?)", [
              tagId,
              tagName,
            ]);
          }
          try {
            await this.db.run(
              "INSERT INTO contact_tags (contact_id, tag_id) VALUES (?, ?)",
              [id, tagId],
            );
          } catch {
            // duplicate
          }
        }
      }
    }
    return { ok: true };
  }

  async merge(
    sourceId: string,
    targetId: string,
    conflictResolution?: Record<string, "source" | "target">,
  ) {
    const source = await this.get(sourceId);
    const target = await this.get(targetId);
    if (!source || !target) return null;

    const resolution = conflictResolution ?? {};
    const mergeContact: Partial<Contact> = {
      display_name: (resolution.display_name === "source" ? source : target)
        .display_name,
      first_name:
        (resolution.first_name === "source" ? source : target).first_name ??
        (resolution.first_name === "target" ? target : source).first_name,
      last_name:
        (resolution.last_name === "source" ? source : target).last_name ??
        (resolution.last_name === "target" ? target : source).last_name,
      organization_name:
        (resolution.organization_name === "source" ? source : target)
          .organization_name ??
        (resolution.organization_name === "target" ? target : source)
          .organization_name,
      notes: undefined, // contact_notes are merged separately
      ok_to_email: (resolution.ok_to_email === "source" ? source : target)
        .ok_to_email,
      ok_to_mail: (resolution.ok_to_mail === "source" ? source : target)
        .ok_to_mail,
      ok_to_sms: ((resolution.ok_to_sms === "source" ? source : target).ok_to_sms as Contact["ok_to_sms"]) ?? "unknown",
      do_not_contact: source.do_not_contact || target.do_not_contact,
      hellenic: source.hellenic || target.hellenic,
      deceased: source.deceased || target.deceased,
      deceased_year: source.deceased_year ?? target.deceased_year ?? null,
      club_name:
        (resolution.club_name === "source" ? source : target).club_name ??
        (resolution.club_name === "target" ? target : source).club_name,
      role:
        (resolution.role === "source" ? source : target).role ??
        (resolution.role === "target" ? target : source).role,
    };

    const allEmails = [
      ...(target.emails ?? []),
      ...(source.emails ?? []).filter(
        (e) => !(target.emails ?? []).some((te) => te.email === e.email),
      ),
    ];
    const allPhones = [
      ...(target.phones ?? []),
      ...(source.phones ?? []).filter(
        (p) => !(target.phones ?? []).some((tp) => tp.phone === p.phone),
      ),
    ];
    const allAddresses = [
      ...(target.addresses ?? []),
      ...(source.addresses ?? []).filter((a) => {
        const key = (addr: ContactAddress) =>
          [addr.address_line1, addr.city, addr.postal_code].join("|");
        return !(target.addresses ?? []).some((ta) => key(ta) === key(a));
      }),
    ];
    const allTags = [
      ...new Map(
        [...(target.tags ?? []), ...(source.tags ?? [])].map((t) => [
          t.name,
          t,
        ]),
      ).values(),
    ];

    await this.update(targetId, {
      ...mergeContact,
      emails: allEmails.length ? allEmails : undefined,
      phones: allPhones.length ? allPhones : undefined,
      addresses: allAddresses.length ? allAddresses : undefined,
      tags: allTags,
    });

    await this.db.run(
      "UPDATE mailing_list_members SET contact_id = ? WHERE contact_id = ?",
      [targetId, sourceId],
    );
    await this.db.run(
      "UPDATE mailing_batch_recipients SET contact_id = ? WHERE contact_id = ?",
      [targetId, sourceId],
    );
    await this.db.run(
      "UPDATE contact_notes SET contact_id = ? WHERE contact_id = ?",
      [targetId, sourceId],
    );
    await this.db.run(
      "UPDATE contact_photos SET contact_id = ? WHERE contact_id = ?",
      [targetId, sourceId],
    );
    await this.delete(sourceId);

    return this.get(targetId)!;
  }

  notes = {
    create: async (
      contactId: string,
      content: string,
    ): Promise<ContactNote> => {
      const id = uuid();
      await this.db.run(
        "INSERT INTO contact_notes (id, contact_id, content) VALUES (?, ?, ?)",
        [id, contactId, content.trim()],
      );
      const rows = (await this.db
        .query("SELECT * FROM contact_notes WHERE id = ?", id)
        .all()) as Array<Record<string, unknown>>;
      const r = rows[0];
      if (!r) throw new Error("Failed to create note");
      return {
        id: r.id as string,
        contact_id: r.contact_id as string,
        content: r.content as string,
        created_at: toISOStringOrNull(r.created_at as Date | string | null | undefined),
      };
    },
    update: async (
      contactId: string,
      noteId: string,
      content: string,
    ): Promise<ContactNote | null> => {
      const rows = (await this.db
        .query(
          "SELECT id FROM contact_notes WHERE id = ? AND contact_id = ?",
          noteId,
          contactId,
        )
        .all()) as Array<Record<string, unknown>>;
      if (rows.length === 0) return null;
      await this.db.run(
        "UPDATE contact_notes SET content = ? WHERE id = ? AND contact_id = ?",
        [content.trim(), noteId, contactId],
      );
      const updated = (await this.db
        .query("SELECT * FROM contact_notes WHERE id = ?", noteId)
        .all()) as Array<Record<string, unknown>>;
      const r = updated[0];
      return r
        ? {
            id: r.id as string,
            contact_id: r.contact_id as string,
            content: r.content as string,
            created_at: toISOStringOrNull(r.created_at as Date | string | null | undefined),
          }
        : null;
    },
    delete: async (contactId: string, noteId: string): Promise<boolean> => {
      const result = await this.db.run(
        "DELETE FROM contact_notes WHERE id = ? AND contact_id = ?",
        [noteId, contactId],
      );
      return true;
    },
  };

  tags = {
    list: async (): Promise<Tag[]> => {
      /* Original: SELECT * FROM tags ORDER BY name */
      const entities = await this.ds
        .getRepository(TagEntity)
        .find({ order: { name: "ASC" } });
      return entities.map((r) => ({ id: r.id, name: r.name }));
    },
    create: async (name: string): Promise<Tag> => {
      const id = uuid();
      await this.db.run("INSERT INTO tags (id, name) VALUES (?, ?)", [
        id,
        name,
      ]);
      return { id, name };
    },
  };
}
