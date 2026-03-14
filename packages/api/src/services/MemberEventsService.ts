import type { DataSource } from "typeorm";
import type { RsvpStatus } from "@satyrsmc/shared/lib/enums";
import type {
  MemberEventListInput,
  MemberEventListOutput,
  MemberEventCard,
  MemberEventRsvpOutput,
  MemberEventGetOutput,
  MemberEventAttendee,
  MemberEventScheduleItem,
  MemberEventPhoto,
} from "@satyrsmc/shared/dto/member/event";
import { Event } from "../entities";
import { toISOStringOrNull } from "../lib/date";
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
    conditions.push(`e.start_date >= $${idx}`);
    params.push(input.date_from);
  }
  if (input.date_to) {
    idx++;
    conditions.push(`e.start_date < ($${idx}::date + interval '1 day')`);
    params.push(input.date_to);
  }

  if (input.upcoming) {
    conditions.push(`(e.start_date >= now() OR e.start_date IS NULL)`);
  } else {
    conditions.push(`e.start_date < now()`);
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
        e.start_date,
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
      ORDER BY e.start_date ${orderDirection}
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
      start_date:
        row.start_date instanceof Date
          ? row.start_date.toISOString()
          : ((row.start_date as string) ?? null),
      event_type: row.event_type as MemberEventCard["event_type"],
      event_location: (row.event_location as string) ?? null,
      photo_url: (row.photo_url as string) ?? null,
      rsvp_yes_count: Number(row.rsvp_yes_count) || 0,
      my_rsvp: (row.my_rsvp as MemberEventCard["my_rsvp"]) ?? null,
      members_only: row.members_only === true,
    }));

    return { items, total, page, per_page };
  }

  async get(contactId: string, eventId: string): Promise<MemberEventGetOutput | null> {
    const event = await this.ds.getRepository(Event).findOne({ where: { id: eventId } });
    if (!event) return null;

    // Current user's RSVP
    const rsvpRows = (await this.ds.query(
      `SELECT rsvp_status FROM event_attendees WHERE event_id = $1 AND contact_id = $2`,
      [eventId, contactId],
    )) as Array<{ rsvp_status: string }>;
    const myRsvp = (rsvpRows[0]?.rsvp_status as MemberEventCard["my_rsvp"]) ?? null;

    // Count of yes RSVPs
    const countRows = (await this.ds.query(
      `SELECT COUNT(*)::int AS cnt FROM event_attendees WHERE event_id = $1 AND rsvp_status = 'yes'`,
      [eventId],
    )) as Array<{ cnt: number }>;
    const rsvpYesCount = countRows[0]?.cnt ?? 0;

    // Attendees with rsvp_status = 'yes'
    const attendeeRows = (await this.ds.query(
      `SELECT
        a.contact_id,
        c.display_name,
        a.sort_order,
        CASE WHEN m.id IS NOT NULL THEN true ELSE false END AS is_member,
        CASE WHEN cph.id IS NOT NULL
          THEN CONCAT('/api/contacts/', c.id, '/photos/', cph.id, '?size=thumbnail')
          ELSE NULL
        END AS photo_thumbnail_url
      FROM event_attendees a
      JOIN contacts c ON c.id = a.contact_id
      LEFT JOIN members m ON m.contact_id = a.contact_id
      LEFT JOIN contact_photos cph ON cph.contact_id = a.contact_id AND cph.type = 'profile'
      WHERE a.event_id = $1 AND a.rsvp_status = 'yes'
      ORDER BY a.sort_order ASC`,
      [eventId],
    )) as Array<Record<string, unknown>>;

    const attendees: MemberEventAttendee[] = attendeeRows.map((row) => ({
      contact_id: row.contact_id as string,
      display_name: row.display_name as string,
      photo_thumbnail_url: (row.photo_thumbnail_url as string) ?? null,
      is_member: row.is_member === true || row.is_member === "true",
      sort_order: Number(row.sort_order) || 0,
    }));

    // Photos
    const photoRows = (await this.ds.query(
      `SELECT id, sort_order,
        CONCAT('/api/events/', event_id, '/photos/', id, '?size=display') AS photo_display_url
      FROM event_photos
      WHERE event_id = $1
      ORDER BY sort_order ASC`,
      [eventId],
    )) as Array<Record<string, unknown>>;

    const photos: MemberEventPhoto[] = photoRows.map((row) => ({
      id: row.id as string,
      photo_display_url: row.photo_display_url as string,
      sort_order: Number(row.sort_order) || 0,
    }));

    // Schedule items
    const scheduleRows = (await this.ds.query(
      `SELECT id, scheduled_time, label, location, sort_order
      FROM ride_schedule_items
      WHERE event_id = $1
      ORDER BY sort_order ASC`,
      [eventId],
    )) as Array<Record<string, unknown>>;

    const scheduleItems: MemberEventScheduleItem[] = scheduleRows.map((row) => ({
      id: row.id as string,
      scheduled_time:
        row.scheduled_time instanceof Date
          ? row.scheduled_time.toISOString()
          : ((row.scheduled_time as string) ?? ""),
      label: row.label as string,
      location: (row.location as string) ?? null,
      sort_order: Number(row.sort_order) || 0,
    }));

    return {
      id: event.id,
      name: event.name,
      description: event.description ?? null,
      start_date: toISOStringOrNull(event.startDate),
      end_date: toISOStringOrNull(event.endDate),
      event_type: event.eventType,
      event_location: event.eventLocation ?? null,
      event_location_embed: event.eventLocationEmbed ?? null,
      event_url: event.eventUrl ?? null,
      ga_ticket_cost: event.gaTicketCost ?? null,
      day_pass_cost: event.dayPassCost ?? null,
      members_only: event.membersOnly,
      start_location: event.startLocation ?? null,
      end_location: event.endLocation ?? null,
      host_ids: event.hostIds ?? [],
      my_rsvp: myRsvp,
      rsvp_yes_count: rsvpYesCount,
      photos,
      attendees,
      schedule_items: scheduleItems,
    };
  }

  async rsvp(
    contactId: string,
    eventId: string,
    status: RsvpStatus,
    waiverSigned?: boolean,
  ): Promise<MemberEventRsvpOutput> {
    const id = uuid();
    const waiver = waiverSigned === true;
    await this.ds.query(
      `INSERT INTO event_attendees (id, event_id, contact_id, sort_order, waiver_signed, rsvp_status, created_at, updated_at)
       VALUES ($1, $2, $3, 0, $5, $4, now(), now())
       ON CONFLICT (event_id, contact_id) DO UPDATE SET rsvp_status = $4, waiver_signed = GREATEST(event_attendees.waiver_signed, $5), updated_at = now()`,
      [id, eventId, contactId, status, waiver],
    );
    return { ok: true as const, status };
  }
}
