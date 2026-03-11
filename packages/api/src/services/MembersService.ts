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
import { uuid, VALID_POSITIONS, parsePhotoToBlob, memberRowToApi } from "./utils";
import type { MemberPhotoSize } from "@satyrsmc/shared/lib/enums";
import { ImageService } from "./ImageService";
import { toISOString } from "../lib/date";

function rowToMember(m: Record<string, unknown>): MemberGetOutput {
  const { photo_url, photo_thumbnail_url } = memberRowToApi(m);
  return {
    id: m.id as string,
    name: m.name as string,
    phone_number: (m.phone_number ?? null) as string | null,
    email: (m.email ?? null) as string | null,
    address: (m.address ?? null) as string | null,
    birthday: toISOString(m.birthday as Date | string | null | undefined) ?? null,
    member_since: toISOString(m.member_since as Date | string | null | undefined) ?? null,
    is_baby: m.is_baby === true || m.is_baby === 1,
    position: (m.position ?? null) as string | null,
    emergency_contact_name: (m.emergency_contact_name ?? null) as string | null,
    emergency_contact_phone: (m.emergency_contact_phone ?? null) as string | null,
    photo_url,
    photo_thumbnail_url,
    created_at: toISOString(m.created_at as Date | string | null | undefined),
  };
}

export class MembersService {
  constructor(
    private db: DbLike,
    private ds: DataSource,
  ) {}

  async list(): Promise<MemberListOutput> {
    /* Original: SELECT id, name, phone_number, email, address, birthday, member_since, is_baby, position, emergency_contact_name, emergency_contact_phone, created_at, (photo IS NOT NULL) as has_photo FROM members WHERE id != ? ORDER BY name */
    const rows = (await this.ds
      .getRepository(Member)
      .createQueryBuilder("m")
      .select("m.id", "id")
      .addSelect("m.name", "name")
      .addSelect("m.phoneNumber", "phone_number")
      .addSelect("m.email", "email")
      .addSelect("m.address", "address")
      .addSelect("m.birthday", "birthday")
      .addSelect("m.memberSince", "member_since")
      .addSelect("m.isBaby", "is_baby")
      .addSelect("m.position", "position")
      .addSelect("m.emergencyContactName", "emergency_contact_name")
      .addSelect("m.emergencyContactPhone", "emergency_contact_phone")
      .addSelect("m.createdAt", "created_at")
      .addSelect("(m.photo IS NOT NULL)", "has_photo")
      .addSelect("m.showOnWebsite", "show_on_website")
      .where("m.id != :excludeId", { excludeId: ALL_MEMBERS_ID })
      .orderBy("m.name")
      .getRawMany()) as Array<Record<string, unknown>>;
    return rows.map(rowToMember);
  }

  /** Public website feed: members with show_on_website = 1, minimal public fields only. */
  async listForWebsite(): Promise<GetMembersFeedOutput> {
    const rows = (await this.ds
      .getRepository(Member)
      .createQueryBuilder("m")
      .select("m.id", "id")
      .addSelect("m.name", "name")
      .addSelect("m.position", "position")
      .addSelect("(m.photo IS NOT NULL)", "has_photo")
      .where("m.id != :excludeId", { excludeId: ALL_MEMBERS_ID })
      .andWhere("m.showOnWebsite = :on", { on: true })
      .orderBy("m.name")
      .getRawMany()) as Array<Record<string, unknown>>;
    return rows.map((m) => {
      const { photo_url, photo_thumbnail_url } = memberRowToApi(m);
      return {
        id: m.id as string,
        name: m.name as string,
        position: (m.position as string) ?? null,
        photo_url: photo_url ?? null,
        photo_thumbnail_url: photo_thumbnail_url ?? null,
      };
    });
  }

  async get(id: string): Promise<MemberGetOutput | null> {
    /* Original: SELECT id, name, phone_number, email, address, birthday, member_since, is_baby, position, emergency_contact_name, emergency_contact_phone, created_at, (photo IS NOT NULL) as has_photo FROM members WHERE id = ? */
    const row = (await this.ds
      .getRepository(Member)
      .createQueryBuilder("m")
      .select("m.id", "id")
      .addSelect("m.name", "name")
      .addSelect("m.phoneNumber", "phone_number")
      .addSelect("m.email", "email")
      .addSelect("m.address", "address")
      .addSelect("m.birthday", "birthday")
      .addSelect("m.memberSince", "member_since")
      .addSelect("m.isBaby", "is_baby")
      .addSelect("m.position", "position")
      .addSelect("m.emergencyContactName", "emergency_contact_name")
      .addSelect("m.emergencyContactPhone", "emergency_contact_phone")
      .addSelect("m.createdAt", "created_at")
      .addSelect("(m.photo IS NOT NULL)", "has_photo")
      .addSelect("m.showOnWebsite", "show_on_website")
      .where("m.id = :id", { id })
      .getRawOne()) as Record<string, unknown> | undefined;
    if (!row) return null;
    return rowToMember(row);
  }

  /**
   * Get member photo as buffer for the given size. Returns null if member has no photo.
   */
  async getPhoto(id: string, size: MemberPhotoSize): Promise<Buffer | null> {
    /* Original: SELECT photo, photo_thumbnail FROM members WHERE id = ? */
    const member = await this.ds.getRepository(Member).findOne({
      where: { id },
      select: ["photo", "photoThumbnail"],
    });
    if (!member) return null;
    const photoBlob = member.photo;
    const thumbnailBlob = member.photoThumbnail;

    if (!photoBlob) return null;

    const buffer = Buffer.from(photoBlob);

    switch (size) {
      case "thumbnail":
        if (thumbnailBlob) return Buffer.from(thumbnailBlob);
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
    await this.db.run(
      `INSERT INTO members (id, name, phone_number, email, address, birthday, member_since, is_baby, position, emergency_contact_name, emergency_contact_phone, photo, photo_thumbnail) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        body.name,
        body.phone_number ?? null,
        body.email ?? null,
        body.address ?? null,
        body.birthday ?? null,
        body.member_since ?? null,
        body.is_baby ? true : false,
        body.position && VALID_POSITIONS.has(body.position) ? body.position : null,
        body.emergency_contact_name ?? null,
        body.emergency_contact_phone ?? null,
        photoBlob,
        photoThumbnailBlob,
      ],
    );
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
    /* Original: SELECT * FROM members WHERE id = ? */
    const existing = await this.ds.getRepository(Member).findOne({ where: { id } });
    if (!existing) return null;
    const name = body.name ?? existing.name;
    const phone_number = body.phone_number !== undefined ? body.phone_number : existing.phoneNumber;
    const email = body.email !== undefined ? body.email : existing.email;
    const address = body.address !== undefined ? body.address : existing.address;
    const birthday = body.birthday !== undefined ? body.birthday : existing.birthday;
    const member_since = body.member_since !== undefined ? body.member_since : existing.memberSince;
    const is_baby = body.is_baby !== undefined ? body.is_baby : existing.isBaby;
    const positionRaw = body.position !== undefined ? body.position : existing.position;
    const position = positionRaw && VALID_POSITIONS.has(positionRaw) ? positionRaw : null;
    const emergency_contact_name =
      body.emergency_contact_name !== undefined
        ? body.emergency_contact_name
        : existing.emergencyContactName;
    const emergency_contact_phone =
      body.emergency_contact_phone !== undefined
        ? body.emergency_contact_phone
        : existing.emergencyContactPhone;
    const rawPhoto =
      body.photo !== undefined
        ? body.photo === null
          ? null
          : (parsePhotoToBlob(body.photo) ?? null)
        : existing.photo;
    const photoBlob =
      body.photo !== undefined && rawPhoto !== null
        ? ((await ImageService.optimize(Buffer.from(rawPhoto))) ?? rawPhoto)
        : rawPhoto;
    const photoThumbnailBlob =
      body.photo !== undefined
        ? photoBlob
          ? await ImageService.createThumbnail(Buffer.from(photoBlob))
          : null
        : (existing.photoThumbnail ?? null);
    const show_on_website =
      body.show_on_website !== undefined ? body.show_on_website : existing.showOnWebsite;
    await this.db.run(
      `UPDATE members SET name = ?, phone_number = ?, email = ?, address = ?, birthday = ?, member_since = ?, is_baby = ?, position = ?, emergency_contact_name = ?, emergency_contact_phone = ?, photo = ?, photo_thumbnail = ?, show_on_website = ? WHERE id = ?`,
      [
        name,
        phone_number,
        email,
        address,
        birthday,
        member_since,
        is_baby,
        position,
        emergency_contact_name,
        emergency_contact_phone,
        photoBlob,
        photoThumbnailBlob,
        show_on_website,
        id,
      ],
    );
    return this.get(id)!;
  }

  async delete(id: string): Promise<MemberDeleteOutput> {
    await this.db.run("DELETE FROM members WHERE id = ?", [id]);
    return { ok: true as const };
  }
}
