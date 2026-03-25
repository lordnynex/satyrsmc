import type { DataSource } from "typeorm";
import {
  AttendeeStatus,
  RegistrationMethod,
  PaymentStatus,
  RsvpLogCode,
} from "@satyrsmc/shared/lib/enums";
import type { PaymentMethod } from "@satyrsmc/shared/lib/enums";
import type { BadgerDetails } from "@satyrsmc/shared/dto/admin/rsvp";
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
import type { RsvpLogService } from "./RsvpLogService";

export interface MemberRsvpParams {
  contactId: string;
  userId: string;
  eventId: string;
  status: AttendeeStatus;
  waiverSigned?: boolean;
  waiverContentHash?: string;
  waiverIp?: string;
  waiverUserAgent?: string | null;
  paymentMethod?: PaymentMethod;
  paymentAmountCents?: number | null;
  badgerDetails?: BadgerDetails;
}

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
    conditions.push(`e.start_date >= $${idx}::date`);
    params.push(input.date_from);
  }
  if (input.date_to) {
    idx++;
    conditions.push(`e.start_date < ($${idx}::date + interval '1 day')`);
    params.push(input.date_to);
  }

  if (input.upcoming) {
    conditions.push(`(e.start_date::date >= now()::date OR e.start_date IS NULL)`);
  } else {
    conditions.push(`e.start_date::date < now()::date`);
  }

  return { conditions, params, nextIdx: idx };
}

export class MemberEventsService {
  constructor(
    private ds: DataSource,
    private rsvpLogService: RsvpLogService,
  ) {}

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
          SELECT COUNT(DISTINCT a2.contact_id)::int
          FROM event_attendees a2
          WHERE a2.event_id = e.id AND a2.status = 'yes'
        ), 0) AS rsvp_yes_count,
        (
          SELECT a3.status FROM event_attendees a3
          WHERE a3.event_id = e.id AND a3.contact_id = $1
          ORDER BY
            CASE WHEN a3.registration_method IS NOT NULL THEN 0 ELSE 1 END,
            a3.updated_at DESC
          LIMIT 1
        ) AS my_rsvp
      FROM events e
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

    // Current user's RSVP (check all records, prefer registration over simple, then latest)
    const rsvpRows = (await this.ds.query(
      `SELECT status, registration_method, updated_at FROM event_attendees
       WHERE event_id = $1 AND contact_id = $2
       ORDER BY
         CASE WHEN registration_method IS NOT NULL THEN 0 ELSE 1 END,
         updated_at DESC
       LIMIT 1`,
      [eventId, contactId],
    )) as Array<{ status: string }>;
    const myRsvp = (rsvpRows[0]?.status as MemberEventCard["my_rsvp"]) ?? null;

    // Count of yes RSVPs (deduplicated by contact)
    const countRows = (await this.ds.query(
      `SELECT COUNT(DISTINCT contact_id)::int AS cnt FROM event_attendees WHERE event_id = $1 AND status = 'yes'`,
      [eventId],
    )) as Array<{ cnt: number }>;
    const rsvpYesCount = countRows[0]?.cnt ?? 0;

    // Attendees with status = 'yes' (deduplicated by contact)
    const attendeeRows = (await this.ds.query(
      `SELECT DISTINCT ON (a.contact_id)
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
      WHERE a.event_id = $1 AND a.status = 'yes'
      ORDER BY a.contact_id, a.updated_at DESC`,
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

  async rsvp(params: MemberRsvpParams): Promise<MemberEventRsvpOutput> {
    const {
      contactId,
      userId,
      eventId,
      status,
      waiverSigned,
      waiverContentHash,
      waiverIp,
      waiverUserAgent,
      paymentMethod,
      paymentAmountCents,
      badgerDetails,
    } = params;
    const waiver = waiverSigned === true;
    const isRegistration = !!paymentMethod || !!badgerDetails;
    const now = new Date();

    // Find existing attendee record (prefer registration records, then latest)
    const existing = (await this.ds.query(
      `SELECT id, registration_method, payment_status FROM event_attendees
       WHERE event_id = $1 AND contact_id = $2
       ORDER BY
         CASE WHEN registration_method IS NOT NULL THEN 0 ELSE 1 END,
         updated_at DESC
       LIMIT 1`,
      [eventId, contactId],
    )) as Array<{ id: string; registration_method: string | null; payment_status: string | null }>;

    let rsvpId: string;

    if (status === AttendeeStatus.No) {
      // ── Cancel / RSVP No ──
      if (existing.length > 0) {
        const row = existing[0]!;
        if (row.registration_method != null) {
          // Cancel a registration: set cancelled_at, handle refund status
          const newPaymentStatus =
            row.payment_status === PaymentStatus.Confirmed
              ? PaymentStatus.RefundRequested
              : row.payment_status;
          await this.ds.query(
            `UPDATE event_attendees
             SET status = $1::attendee_status_enum, cancelled_at = $2,
                 payment_status = COALESCE($3, payment_status), updated_at = $4
             WHERE id = $5`,
            [status, now, newPaymentStatus, now, row.id],
          );
          await this.rsvpLogService.create(row.id, RsvpLogCode.Cancelled, userId);
        } else {
          // Simple record — just set status
          await this.ds.query(
            `UPDATE event_attendees SET status = $1::attendee_status_enum, updated_at = $2
             WHERE id = $3`,
            [status, now, row.id],
          );
        }
      } else {
        // No existing record — insert a simple "no"
        rsvpId = uuid();
        await this.ds.query(
          `INSERT INTO event_attendees (id, event_id, contact_id, sort_order, waiver_signed, status, created_at, updated_at)
           VALUES ($1, $2, $3, 0, false, $4::attendee_status_enum, $5, $6)`,
          [rsvpId, eventId, contactId, status, now, now],
        );
      }
    } else {
      // ── RSVP Yes (or other non-No status) ──
      const regMethod = isRegistration ? RegistrationMethod.Auth : null;
      const paymentStatus =
        paymentAmountCents && paymentAmountCents > 0
          ? PaymentStatus.Pending
          : isRegistration
            ? PaymentStatus.NotRequired
            : null;

      if (existing.length > 0) {
        const row = existing[0]!;
        rsvpId = row.id;
        if (isRegistration) {
          // Reactivate / update as registration
          await this.ds.query(
            `UPDATE event_attendees
             SET status = $1::attendee_status_enum, cancelled_at = NULL,
                 registration_method = COALESCE($2, registration_method),
                 user_id = COALESCE($3, user_id),
                 waiver_signed = GREATEST(waiver_signed, $4),
                 waiver_content_hash = COALESCE($5, waiver_content_hash),
                 waiver_accepted_at = COALESCE($6, waiver_accepted_at),
                 waiver_ip = COALESCE($7, waiver_ip),
                 waiver_user_agent = COALESCE($8, waiver_user_agent),
                 payment_method = COALESCE($9, payment_method),
                 payment_status = COALESCE($10, payment_status),
                 payment_amount_cents = COALESCE($11, payment_amount_cents),
                 updated_at = $12
             WHERE id = $13`,
            [
              status,
              regMethod,
              userId,
              waiver,
              waiverContentHash ?? null,
              waiver ? now : null,
              waiverIp ?? null,
              waiverUserAgent ?? null,
              paymentMethod ?? null,
              paymentStatus,
              paymentAmountCents ?? null,
              now,
              row.id,
            ],
          );
        } else {
          // Simple RSVP update
          await this.ds.query(
            `UPDATE event_attendees
             SET status = $1::attendee_status_enum, waiver_signed = GREATEST(waiver_signed, $2),
                 cancelled_at = NULL, updated_at = $3
             WHERE id = $4`,
            [status, waiver, now, row.id],
          );
        }
      } else {
        // Insert new record
        rsvpId = uuid();
        if (isRegistration) {
          await this.ds.query(
            `INSERT INTO event_attendees (
              id, event_id, contact_id, user_id, registration_method,
              sort_order, waiver_signed, status,
              waiver_content_hash, waiver_accepted_at, waiver_ip, waiver_user_agent,
              payment_method, payment_status, payment_amount_cents,
              created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, 0, $6, $7::attendee_status_enum, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
            [
              rsvpId,
              eventId,
              contactId,
              userId,
              regMethod,
              waiver,
              status,
              waiverContentHash ?? null,
              waiver ? now : null,
              waiverIp ?? null,
              waiverUserAgent ?? null,
              paymentMethod ?? null,
              paymentStatus,
              paymentAmountCents ?? null,
              now,
              now,
            ],
          );
        } else {
          await this.ds.query(
            `INSERT INTO event_attendees (id, event_id, contact_id, sort_order, waiver_signed, status, created_at, updated_at)
             VALUES ($1, $2, $3, 0, $4, $5::attendee_status_enum, $6, $7)`,
            [rsvpId, eventId, contactId, waiver, status, now, now],
          );
        }
      }

      // Log registration
      if (isRegistration) {
        await this.rsvpLogService.create(rsvpId, RsvpLogCode.Registered, userId);
      }

      // Upsert badger details
      if (badgerDetails) {
        await this.ds.query(`DELETE FROM badger_registrations WHERE rsvp_id = $1`, [rsvpId]);
        await this.ds.query(
          `INSERT INTO badger_registrations (id, rsvp_id, tshirt_size, traveling_by, club, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            uuid(),
            rsvpId,
            badgerDetails.tshirtSize,
            badgerDetails.travelingBy,
            badgerDetails.club ?? null,
            now,
          ],
        );
      }
    }

    return { ok: true as const, status };
  }
}
