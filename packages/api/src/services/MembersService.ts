import type { DataSource } from "typeorm";
import type { DbLike } from "../db/dbAdapter";
import { Member } from "../entities";
import { ALL_MEMBERS_ID } from "@satyrsmc/shared/lib/constants";
import type {
  MemberCreateOutput,
  MemberDeleteOutput,
  MemberGetOutput,
  MemberListOutput,
  MemberUpdateOutput,
} from "@satyrsmc/shared/dto/admin/member";
import type { GetMembersFeedOutput } from "@satyrsmc/shared/dto/website";
import { uuid, VALID_POSITIONS, parsePhotoToBlob } from "./utils";
import type { MemberPhotoSize } from "@satyrsmc/shared/lib/enums";
import {
  ContactType,
  ContactStatus,
  ContactEmailType,
  ContactPhoneType,
  ContactAddressType,
  ContactPhotoType,
} from "@satyrsmc/shared/lib/enums";
import { ImageService } from "./ImageService";
import { toISOString } from "../lib/date";
import { Contact as ContactEntity } from "../entities/Contact";
import { ContactEmail } from "../entities/ContactEmail";
import { ContactPhone } from "../entities/ContactPhone";
import { ContactAddress } from "../entities/ContactAddress";
import { ContactEmergencyContact } from "../entities/ContactEmergencyContact";
import { ContactPhoto } from "../entities/ContactPhoto";

/**
 * Build a MemberGetOutput from a raw query row.
 * All personal/contact info comes from contact sub-table joins.
 */
function rowToMember(m: Record<string, unknown>): MemberGetOutput {
  const id = m.id as string;
  const hasPhoto = m.has_photo === true || m.has_photo === 1;

  const email = (m.c_email as string | null) ?? null;
  const phone_number = (m.c_phone as string | null) ?? null;

  let address: string | null;
  if (m.c_address_line1) {
    const parts = [
      m.c_address_line1 as string | null,
      m.c_address_line2 as string | null,
      [m.c_city, m.c_state, m.c_postal_code].filter(Boolean).join(", ") || null,
    ].filter(Boolean);
    address = parts.join("\n") || null;
  } else {
    address = null;
  }

  const emergency_contact_name = (m.c_ec_name as string | null) ?? null;
  const emergency_contact_phone = (m.c_ec_phone as string | null) ?? null;

  return {
    id,
    name: m.display_name as string,
    phone_number,
    email,
    address,
    birthday: toISOString(m.birthday as Date | string | null | undefined) ?? null,
    member_since: toISOString(m.member_since as Date | string | null | undefined) ?? null,
    is_baby: m.is_baby === true || m.is_baby === 1,
    position: (m.position ?? null) as string | null,
    emergency_contact_name,
    emergency_contact_phone,
    photo_url: hasPhoto ? `/api/members/${id}/photo?size=full` : null,
    photo_thumbnail_url: hasPhoto ? `/api/members/${id}/photo?size=thumbnail` : null,
    created_at: toISOString(m.created_at as Date | string | null | undefined),
  };
}

/**
 * Base query builder that joins contact + contact sub-tables.
 * All personal info comes from the contact record.
 */
function memberSelectQuery(ds: DataSource) {
  return (
    ds
      .getRepository(Member)
      .createQueryBuilder("m")
      .select("m.id", "id")
      .addSelect("c.birthday", "birthday")
      .addSelect("m.memberSince", "member_since")
      .addSelect("m.isBaby", "is_baby")
      .addSelect("m.position", "position")
      .addSelect("m.createdAt", "created_at")
      .addSelect("m.showOnWebsite", "show_on_website")
      .addSelect("m.contactId", "contact_id")
      // Contact display name
      .leftJoin("contacts", "c", "c.id = m.contact_id")
      .addSelect("c.display_name", "display_name")
      // Photo existence check from contact_photos
      .addSelect(
        `EXISTS(SELECT 1 FROM contact_photos cph WHERE cph.contact_id = m.contact_id AND cph.type = 'profile')`,
        "has_photo",
      )
      // Contact sub-table joins
      .leftJoin("contact_emails", "ce", "ce.contact_id = m.contact_id AND ce.is_primary = true")
      .addSelect("ce.email", "c_email")
      .leftJoin("contact_phones", "cp", "cp.contact_id = m.contact_id AND cp.is_primary = true")
      .addSelect("cp.phone", "c_phone")
      .leftJoin(
        "contact_addresses",
        "ca",
        "ca.contact_id = m.contact_id AND ca.is_primary_mailing = true",
      )
      .addSelect("ca.address_line1", "c_address_line1")
      .addSelect("ca.address_line2", "c_address_line2")
      .addSelect("ca.city", "c_city")
      .addSelect("ca.state", "c_state")
      .addSelect("ca.postal_code", "c_postal_code")
      .leftJoin("contact_emergency_contacts", "cec", "cec.contact_id = m.contact_id")
      .addSelect("cec.name", "c_ec_name")
      .addSelect("cec.phone", "c_ec_phone")
  );
}

export class MembersService {
  constructor(
    private db: DbLike,
    private ds: DataSource,
  ) {}

  async list(): Promise<MemberListOutput> {
    const rows = (await memberSelectQuery(this.ds)
      .where("m.id != :excludeId", { excludeId: ALL_MEMBERS_ID })
      .orderBy("c.display_name")
      .getRawMany()) as Array<Record<string, unknown>>;
    return rows.map(rowToMember);
  }

  /** Public website feed: members with show_on_website = true, minimal public fields only. */
  async listForWebsite(): Promise<GetMembersFeedOutput> {
    const rows = (await this.ds
      .getRepository(Member)
      .createQueryBuilder("m")
      .select("m.id", "id")
      .addSelect("m.position", "position")
      .leftJoin("contacts", "c", "c.id = m.contact_id")
      .addSelect("c.display_name", "name")
      .addSelect(
        `EXISTS(SELECT 1 FROM contact_photos cph WHERE cph.contact_id = m.contact_id AND cph.type = 'profile')`,
        "has_photo",
      )
      .where("m.id != :excludeId", { excludeId: ALL_MEMBERS_ID })
      .andWhere("m.showOnWebsite = :on", { on: true })
      .orderBy("c.display_name")
      .getRawMany()) as Array<Record<string, unknown>>;
    return rows.map((m) => {
      const id = m.id as string;
      const hasPhoto = m.has_photo === true || m.has_photo === 1;
      return {
        id,
        name: m.name as string,
        position: (m.position as string) ?? null,
        photo_url: hasPhoto ? `/api/members/${id}/photo?size=full` : null,
        photo_thumbnail_url: hasPhoto ? `/api/members/${id}/photo?size=thumbnail` : null,
      };
    });
  }

  async get(id: string): Promise<MemberGetOutput | null> {
    const row = (await memberSelectQuery(this.ds).where("m.id = :id", { id }).getRawOne()) as
      | Record<string, unknown>
      | undefined;
    if (!row) return null;
    return rowToMember(row);
  }

  /**
   * Get member photo from contact_photos (profile type).
   * Returns null if member has no profile photo.
   */
  async getPhoto(id: string, size: MemberPhotoSize): Promise<Buffer | null> {
    const member = await this.ds.getRepository(Member).findOne({
      where: { id },
      select: ["contactId"],
    });
    if (!member) return null;

    const contactPhoto = await this.ds.getRepository(ContactPhoto).findOne({
      where: { contactId: member.contactId, type: ContactPhotoType.Profile },
      select: ["photo", "photoThumbnail"],
    });
    if (!contactPhoto?.photo) return null;

    const buffer = Buffer.from(contactPhoto.photo);

    switch (size) {
      case "thumbnail":
        if (contactPhoto.photoThumbnail) return Buffer.from(contactPhoto.photoThumbnail);
        return ImageService.createThumbnail(buffer);
      case "medium":
        return ImageService.createMedium(buffer);
      case "full":
        return buffer;
      default:
        return buffer;
    }
  }

  async create(body: {
    name: string;
    phone_number?: string;
    email?: string;
    address?: string;
    birthday?: string;
    member_since?: string;
    is_baby?: boolean;
    position?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    photo?: string;
  }): Promise<MemberCreateOutput | null> {
    const id = uuid();
    const rawPhoto = body.photo ? parsePhotoToBlob(body.photo) : null;
    const photoBlob = rawPhoto ? ((await ImageService.optimize(rawPhoto)) ?? rawPhoto) : null;
    const photoThumbnailBlob = photoBlob ? await ImageService.createThumbnail(photoBlob) : null;

    // Create a Contact record for the new member
    const contactId = uuid();
    const contactRepo = this.ds.getRepository(ContactEntity);
    const contact = contactRepo.create({
      id: contactId,
      type: ContactType.Person,
      status: ContactStatus.Active,
      displayName: body.name,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await contactRepo.save(contact);

    // Create contact sub-records
    if (body.email) {
      await this.ds.getRepository(ContactEmail).save(
        this.ds.getRepository(ContactEmail).create({
          id: uuid(),
          contactId,
          email: body.email,
          type: ContactEmailType.Home,
          isPrimary: true,
        }),
      );
    }
    if (body.phone_number) {
      await this.ds.getRepository(ContactPhone).save(
        this.ds.getRepository(ContactPhone).create({
          id: uuid(),
          contactId,
          phone: body.phone_number,
          type: ContactPhoneType.Cell,
          isPrimary: true,
        }),
      );
    }
    if (body.address) {
      await this.ds.getRepository(ContactAddress).save(
        this.ds.getRepository(ContactAddress).create({
          id: uuid(),
          contactId,
          addressLine1: body.address,
          type: ContactAddressType.Home,
          isPrimaryMailing: true,
        }),
      );
    }
    if (body.emergency_contact_name || body.emergency_contact_phone) {
      await this.ds.getRepository(ContactEmergencyContact).save(
        this.ds.getRepository(ContactEmergencyContact).create({
          id: uuid(),
          contactId,
          name: body.emergency_contact_name ?? "",
          phone: body.emergency_contact_phone ?? "",
        }),
      );
    }
    if (photoBlob) {
      await this.ds.getRepository(ContactPhoto).save(
        this.ds.getRepository(ContactPhoto).create({
          id: uuid(),
          contactId,
          type: ContactPhotoType.Profile,
          sortOrder: 0,
          photo: photoBlob,
          photoThumbnail: photoThumbnailBlob,
          createdAt: new Date(),
        }),
      );
    }

    // Create member (only member-specific columns)
    const position = body.position && VALID_POSITIONS.has(body.position) ? body.position : null;
    await this.db.run(
      `INSERT INTO members (id, contact_id, member_since, is_baby, position, show_on_website, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        contactId,
        body.member_since ?? null,
        body.is_baby ? true : false,
        position,
        false,
        new Date().toISOString(),
      ],
    );

    // Store birthday on contact
    if (body.birthday !== undefined) {
      await this.ds.getRepository(ContactEntity).update(contactId, {
        birthday: body.birthday ? new Date(body.birthday) : null,
        updatedAt: new Date(),
      });
    }
    return this.get(id)!;
  }

  async update(
    id: string,
    body: Partial<{
      name: string;
      phone_number: string | null;
      email: string | null;
      address: string | null;
      birthday: string | null;
      member_since: string | null;
      is_baby: boolean;
      position: string | null;
      emergency_contact_name: string | null;
      emergency_contact_phone: string | null;
      photo: string | null;
      show_on_website: boolean;
    }>,
  ): Promise<MemberUpdateOutput | null> {
    const existing = await this.ds.getRepository(Member).findOne({ where: { id } });
    if (!existing) return null;

    const contactId = existing.contactId;
    const member_since = body.member_since !== undefined ? body.member_since : existing.memberSince;
    const is_baby = body.is_baby !== undefined ? body.is_baby : existing.isBaby;
    const positionRaw = body.position !== undefined ? body.position : existing.position;
    const position = positionRaw && VALID_POSITIONS.has(positionRaw) ? positionRaw : null;
    const show_on_website =
      body.show_on_website !== undefined ? body.show_on_website : existing.showOnWebsite;

    // Update member-specific columns only
    await this.db.run(
      `UPDATE members SET member_since = ?, is_baby = ?, position = ?, show_on_website = ? WHERE id = ?`,
      [member_since, is_baby, position, show_on_website, id],
    );

    // Sync contact fields (display name + birthday)
    const contactUpdates: Partial<{ displayName: string; birthday: Date | null; updatedAt: Date }> =
      {};
    if (body.name !== undefined) contactUpdates.displayName = body.name;
    if (body.birthday !== undefined)
      contactUpdates.birthday = body.birthday ? new Date(body.birthday) : null;
    if (Object.keys(contactUpdates).length > 0) {
      contactUpdates.updatedAt = new Date();
      await this.ds.getRepository(ContactEntity).update(contactId, contactUpdates);
    }

    // Sync email
    if (body.email !== undefined) {
      const emailRepo = this.ds.getRepository(ContactEmail);
      const existingEmail = await emailRepo.findOne({
        where: { contactId, isPrimary: true },
      });
      if (body.email) {
        if (existingEmail) {
          existingEmail.email = body.email;
          await emailRepo.save(existingEmail);
        } else {
          await emailRepo.save(
            emailRepo.create({
              id: uuid(),
              contactId,
              email: body.email,
              type: ContactEmailType.Home,
              isPrimary: true,
            }),
          );
        }
      } else if (existingEmail) {
        await emailRepo.remove(existingEmail);
      }
    }

    // Sync phone
    if (body.phone_number !== undefined) {
      const phoneRepo = this.ds.getRepository(ContactPhone);
      const existingPhone = await phoneRepo.findOne({
        where: { contactId, isPrimary: true },
      });
      if (body.phone_number) {
        if (existingPhone) {
          existingPhone.phone = body.phone_number;
          await phoneRepo.save(existingPhone);
        } else {
          await phoneRepo.save(
            phoneRepo.create({
              id: uuid(),
              contactId,
              phone: body.phone_number,
              type: ContactPhoneType.Cell,
              isPrimary: true,
            }),
          );
        }
      } else if (existingPhone) {
        await phoneRepo.remove(existingPhone);
      }
    }

    // Sync address
    if (body.address !== undefined) {
      const addrRepo = this.ds.getRepository(ContactAddress);
      const existingAddr = await addrRepo.findOne({
        where: { contactId, isPrimaryMailing: true },
      });
      if (body.address) {
        if (existingAddr) {
          existingAddr.addressLine1 = body.address;
          existingAddr.addressLine2 = null;
          existingAddr.city = null;
          existingAddr.state = null;
          existingAddr.postalCode = null;
          await addrRepo.save(existingAddr);
        } else {
          await addrRepo.save(
            addrRepo.create({
              id: uuid(),
              contactId,
              addressLine1: body.address,
              type: ContactAddressType.Home,
              isPrimaryMailing: true,
            }),
          );
        }
      } else if (existingAddr) {
        await addrRepo.remove(existingAddr);
      }
    }

    // Sync emergency contact
    if (body.emergency_contact_name !== undefined || body.emergency_contact_phone !== undefined) {
      const ecRepo = this.ds.getRepository(ContactEmergencyContact);
      const existingEc = await ecRepo.findOne({ where: { contactId } });
      const ecName =
        body.emergency_contact_name !== undefined
          ? body.emergency_contact_name
          : (existingEc?.name ?? null);
      const ecPhone =
        body.emergency_contact_phone !== undefined
          ? body.emergency_contact_phone
          : (existingEc?.phone ?? null);
      if (ecName || ecPhone) {
        if (existingEc) {
          existingEc.name = ecName ?? "";
          existingEc.phone = ecPhone ?? "";
          await ecRepo.save(existingEc);
        } else {
          await ecRepo.save(
            ecRepo.create({
              id: uuid(),
              contactId,
              name: ecName ?? "",
              phone: ecPhone ?? "",
            }),
          );
        }
      } else if (existingEc) {
        await ecRepo.remove(existingEc);
      }
    }

    // Sync photo
    if (body.photo !== undefined) {
      const photoRepo = this.ds.getRepository(ContactPhoto);
      const existingPhoto = await photoRepo.findOne({
        where: { contactId, type: ContactPhotoType.Profile },
      });
      if (body.photo === null) {
        if (existingPhoto) {
          await photoRepo.remove(existingPhoto);
        }
      } else {
        const rawPhoto = parsePhotoToBlob(body.photo);
        if (rawPhoto) {
          const optimized = (await ImageService.optimize(rawPhoto)) ?? rawPhoto;
          const thumbnail = await ImageService.createThumbnail(Buffer.from(optimized));
          if (existingPhoto) {
            existingPhoto.photo = optimized;
            existingPhoto.photoThumbnail = thumbnail;
            await photoRepo.save(existingPhoto);
          } else {
            await photoRepo.save(
              photoRepo.create({
                id: uuid(),
                contactId,
                type: ContactPhotoType.Profile,
                sortOrder: 0,
                photo: optimized,
                photoThumbnail: thumbnail,
                createdAt: new Date(),
              }),
            );
          }
        }
      }
    }

    return this.get(id)!;
  }

  async delete(id: string): Promise<MemberDeleteOutput> {
    await this.db.run("DELETE FROM members WHERE id = ?", [id]);
    return { ok: true as const };
  }
}
