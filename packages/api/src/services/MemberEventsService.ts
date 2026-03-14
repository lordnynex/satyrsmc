import type { DataSource } from "typeorm";
import type { RsvpStatus } from "@satyrsmc/shared/lib/enums";
import type {
  MemberEventListInput,
  MemberEventListOutput,
  MemberEventCard,
  MemberEventRsvpOutput,
} from "@satyrsmc/shared/dto/member/event";
import { uuid } from "./utils";

interface FilterResult {
  conditions: string[];
  params: unknown[];
  nextIdx: number;
}

function buildFilters(input: MemberEventListInput, startIdx: number): FilterResult {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = startIdx;

  if (input.event_type) {
    idx++;
    conditions.push(`e.event_type = $${idx}`);
    params.push(input.event_type);
  }
  if (input.search) {
    idx++;
    conditions.push(`e.name ILIKE $${idx}`);
    params.push(`%${input.search}%`);
  }
  if (input.date_from) {
    idx++;
    conditions.push(`e.event_date >= $${idx}`);
    params.push(input.date_from);
  }
  if (input.date_to) {
    idx++;
    conditions.push(`e.event_date <= $${idx}`);
    params.push(input.date_to);
  }

  if (input.upcoming) {
    conditions.push(`(e.event_date >= now() OR e.event_date IS NULL)`);
  } else {
    conditions.push(`e.event_date < now()`);
  }

  return { conditions, params, nextIdx: idx };
}

export class MemberEventsService {
  constructor(private ds: DataSource) {}

  async list(contactId: string, input: MemberEventListInput): Promise<MemberEventListOutput> {
    const { page, per_page, upcoming } = input;
    const offset = (page - 1) * per_page;

    // Count query (doesn't need contactId)
    const countFilter = buildFilters(input, 0);
    const countWhere =
      countFilter.conditions.length > 0 ? `WHERE ${countFilter.conditions.join(" AND ")}` : "";
    const countResult = (await this.ds.query(
      `SELECT COUNT(*)::int AS total FROM events e ${countWhere}`,
      countFilter.params,
    )) as Array<{ total: number }>;
    const total = countResult[0]?.total ?? 0;

    // Main query — $1 is contactId for the LEFT JOIN
    const mainFilter = buildFilters(input, 1);
    const mainWhere =
      mainFilter.conditions.length > 0 ? `WHERE ${mainFilter.conditions.join(" AND ")}` : "";

    let idx = mainFilter.nextIdx;
    idx++;
    const limitIdx = idx;
    idx++;
    const offsetIdx = idx;

    const orderDirection = upcoming ? "ASC NULLS LAST" : "DESC";

    const sql = `
      SELECT
        e.id,
        e.name,
        e.event_date,
        e.event_type,
        e.event_location,
        e.members_only,
        (
          SELECT CONCAT('/api/events/', ep.event_id, '/photos/', ep.id, '?size=display')
          FROM event_photos ep
          WHERE ep.event_id = e.id
          ORDER BY ep.sort_order ASC
          LIMIT 1
        ) AS photo_url,
        COALESCE((
          SELECT COUNT(*)::int
          FROM event_attendees a2
          WHERE a2.event_id = e.id AND a2.rsvp_status = 'yes'
        ), 0) AS rsvp_yes_count,
        a.rsvp_status AS my_rsvp
      FROM events e
      LEFT JOIN event_attendees a ON a.event_id = e.id AND a.contact_id = $1
      ${mainWhere}
      ORDER BY e.event_date ${orderDirection}
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const rows = (await this.ds.query(sql, [
      contactId,
      ...mainFilter.params,
      per_page,
      offset,
    ])) as Array<Record<string, unknown>>;

    const items: MemberEventCard[] = rows.map((row) => ({
      id: row.id as string,
      name: row.name as string,
      event_date:
        row.event_date instanceof Date
          ? row.event_date.toISOString()
          : ((row.event_date as string) ?? null),
      event_type: row.event_type as MemberEventCard["event_type"],
      event_location: (row.event_location as string) ?? null,
      photo_url: (row.photo_url as string) ?? null,
      rsvp_yes_count: Number(row.rsvp_yes_count) || 0,
      my_rsvp: (row.my_rsvp as MemberEventCard["my_rsvp"]) ?? null,
      members_only: row.members_only === true,
    }));

    return { items, total, page, per_page };
  }

  async rsvp(
    contactId: string,
    eventId: string,
    status: RsvpStatus,
  ): Promise<MemberEventRsvpOutput> {
    const id = uuid();
    await this.ds.query(
      `INSERT INTO event_attendees (id, event_id, contact_id, sort_order, waiver_signed, rsvp_status, created_at, updated_at)
       VALUES ($1, $2, $3, 0, false, $4, now(), now())
       ON CONFLICT (event_id, contact_id) DO UPDATE SET rsvp_status = $4, updated_at = now()`,
      [id, eventId, contactId, status],
    );
    return { ok: true as const, status };
  }
}
