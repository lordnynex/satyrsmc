import type { DataSource } from "typeorm";
import type {
  RosterListInput,
  RosterListOutput,
  RosterMember,
  RosterFilterOptionsOutput,
} from "@satyrsmc/shared/dto/member/roster";
import { MemberPosition } from "@satyrsmc/shared/lib/enums";
import { ALL_MEMBERS_ID } from "@satyrsmc/shared/lib/constants";
import { Member } from "../entities/Member";
import { toISOStringOrNull } from "../lib/date";
import { formatPhoneNumber } from "@satyrsmc/shared/lib/phone";

function isOfficer(position: string | null): boolean {
  return position !== null && position !== MemberPosition.Member;
}

export class RosterService {
  constructor(private ds: DataSource) {}

  async list(input: RosterListInput): Promise<RosterListOutput> {
    const qb = this.ds
      .getRepository(Member)
      .createQueryBuilder("m")
      .select("m.id", "id")
      .addSelect("m.position", "position")
      .addSelect("m.memberSince", "member_since")
      // Contact fields
      .leftJoin("contacts", "c", "c.id = m.contact_id")
      .addSelect("c.first_name", "first_name")
      .addSelect("c.last_name", "last_name")
      .addSelect("c.display_name", "display_name")
      // User (for username + active filter)
      .leftJoin("users", "u", "u.member_id = m.id")
      .addSelect("u.username", "username")
      // Profile photo existence
      .addSelect(
        `EXISTS(SELECT 1 FROM contact_photos cph WHERE cph.contact_id = m.contact_id AND cph.type = 'profile')`,
        "has_photo",
      )
      // Primary phone
      .leftJoin("contact_phones", "cp", "cp.contact_id = m.contact_id AND cp.is_primary = true")
      .addSelect("cp.phone", "phone")
      // Primary bike
      .leftJoin("bikes", "b", "b.user_id = u.id AND b.is_primary = true")
      .addSelect("b.id", "bike_id")
      .addSelect("b.year", "bike_year")
      .addSelect("b.make", "bike_make")
      .addSelect("b.model", "bike_model")
      .addSelect("b.trim", "bike_trim")
      .addSelect("b.photo IS NOT NULL", "bike_has_photo")
      // Base filters
      .where("m.id != :excludeId", { excludeId: ALL_MEMBERS_ID })
      .andWhere("u.user_status = :activeStatus", { activeStatus: "active" });

    // Optional filters
    if (input.search) {
      qb.andWhere(
        "(LOWER(c.first_name) LIKE LOWER(:search) OR LOWER(c.last_name) LIKE LOWER(:search))",
        { search: `%${input.search}%` },
      );
    }
    if (input.year_joined !== undefined) {
      qb.andWhere("EXTRACT(YEAR FROM m.member_since) = :year", { year: input.year_joined });
    }
    if (input.bike_make) {
      qb.andWhere("b.make = :bikeMake", { bikeMake: input.bike_make });
    }
    if (input.bike_model) {
      qb.andWhere("b.model = :bikeModel", { bikeModel: input.bike_model });
    }
    if (input.position) {
      qb.andWhere("m.position = :position", { position: input.position });
    }

    // Sort: officers first by priority, then alphabetically
    qb.addOrderBy(
      `CASE m.position
        WHEN '${MemberPosition.President}' THEN 1
        WHEN '${MemberPosition.VicePresident}' THEN 2
        WHEN '${MemberPosition.RoadCaptain}' THEN 3
        WHEN '${MemberPosition.RecordingSecretary}' THEN 4
        WHEN '${MemberPosition.CorrespondenceSecretary}' THEN 5
        WHEN '${MemberPosition.Treasurer}' THEN 6
        ELSE 7
      END`,
      "ASC",
    );
    qb.addOrderBy("c.last_name", "ASC");
    qb.addOrderBy("c.first_name", "ASC");

    const rows = (await qb.getRawMany()) as Array<Record<string, unknown>>;

    const members: RosterMember[] = rows.map((r) => {
      const memberId = r.id as string;
      const hasPhoto = r.has_photo === true || r.has_photo === 1;
      const bikeId = r.bike_id as string | null;
      const bikeHasPhoto = r.bike_has_photo === true || r.bike_has_photo === 1;
      const rawPhone = (r.phone as string | null) ?? null;

      return {
        id: memberId,
        first_name: (r.first_name as string | null) ?? null,
        last_name: (r.last_name as string | null) ?? null,
        display_name: r.display_name as string,
        username: r.username as string,
        position: (r.position as MemberPosition | null) ?? null,
        member_since: toISOStringOrNull(r.member_since as Date | string | null | undefined),
        has_photo: hasPhoto,
        photo_thumbnail_url: hasPhoto ? `/api/members/${memberId}/photo?size=thumbnail` : null,
        bike: bikeId
          ? {
              id: bikeId,
              year: r.bike_year as number,
              make: r.bike_make as string,
              model: r.bike_model as string,
              trim: (r.bike_trim as string | null) ?? null,
              has_photo: bikeHasPhoto,
            }
          : null,
        phone: rawPhone ? formatPhoneNumber(rawPhone) : null,
      };
    });

    // Summary
    let officers = 0;
    let regularMembers = 0;
    for (const m of members) {
      if (isOfficer(m.position)) {
        officers++;
      } else {
        regularMembers++;
      }
    }

    return {
      members,
      summary: {
        total: members.length,
        officers,
        regular_members: regularMembers,
      },
    };
  }

  async getFilterOptions(): Promise<RosterFilterOptionsOutput> {
    // Base query: active users with members (excluding ALL_MEMBERS placeholder)
    const baseCondition = `
      m.id != '${ALL_MEMBERS_ID}'
      AND u.user_status = 'active'
    `;

    // Years joined (distinct, sorted descending)
    const yearsRows = (await this.ds.query(
      `SELECT DISTINCT EXTRACT(YEAR FROM m.member_since)::int AS year
       FROM members m
       JOIN users u ON u.member_id = m.id
       WHERE ${baseCondition}
         AND m.member_since IS NOT NULL
       ORDER BY year DESC`,
    )) as Array<{ year: number }>;

    // Bike makes (distinct, sorted ascending)
    const makesRows = (await this.ds.query(
      `SELECT DISTINCT b.make
       FROM bikes b
       JOIN users u ON u.id = b.user_id
       JOIN members m ON m.id = u.member_id
       WHERE ${baseCondition}
       ORDER BY b.make ASC`,
    )) as Array<{ make: string }>;

    // Bike models (distinct, sorted ascending)
    const modelsRows = (await this.ds.query(
      `SELECT DISTINCT b.model
       FROM bikes b
       JOIN users u ON u.id = b.user_id
       JOIN members m ON m.id = u.member_id
       WHERE ${baseCondition}
       ORDER BY b.model ASC`,
    )) as Array<{ model: string }>;

    return {
      years_joined: yearsRows.map((r) => r.year),
      bike_makes: makesRows.map((r) => r.make),
      bike_models: modelsRows.map((r) => r.model),
    };
  }
}
