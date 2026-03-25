import type { DataSource } from "typeorm";
import {
  AttendeeStatus,
  RegistrationMethod,
  PaymentStatus,
  RsvpLogCode,
} from "@satyrsmc/shared/lib/enums";
import type { PaymentMethod, TshirtSize, TravelMode } from "@satyrsmc/shared/lib/enums";
import type { RsvpOutput, RsvpAdminOutput, BadgerDetails } from "@satyrsmc/shared/dto/admin/rsvp";
import { uuid } from "./utils";
import { toISOStringOrNull } from "../lib/date";
import type { RsvpLogService } from "./RsvpLogService";

interface SubmitBadgerInput {
  eventId: string;
  registrationMethod: RegistrationMethod;
  contactId: string;
  userId: string;
  invitationId?: string | null;
  paymentMethod: PaymentMethod;
  paymentAmountCents: number | null;
  waiverContentHash: string;
  waiverIp: string;
  waiverUserAgent: string | null;
  badgerDetails: BadgerDetails;
}

function rsvpRowToOutput(row: Record<string, unknown>, displayName: string | null): RsvpOutput {
  return {
    id: row.id as string,
    contactId: row.contact_id as string,
    userId: (row.user_id as string) ?? null,
    eventId: row.event_id as string,
    status: row.status as AttendeeStatus,
    registrationMethod: row.registration_method as RegistrationMethod,
    paymentMethod: (row.payment_method as PaymentMethod) ?? null,
    paymentStatus: row.payment_status as PaymentStatus,
    paymentAmountCents: (row.payment_amount_cents as number) ?? null,
    waiverAcceptedAt:
      row.waiver_accepted_at instanceof Date
        ? row.waiver_accepted_at.toISOString()
        : String(row.waiver_accepted_at),
    createdAt: toISOStringOrNull(
      row.created_at instanceof Date
        ? row.created_at
        : row.created_at
          ? new Date(row.created_at as string)
          : null,
    ),
    displayName,
  };
}

function rsvpRowToAdminOutput(
  row: Record<string, unknown>,
  badgerDetails: RsvpAdminOutput["badgerDetails"],
): RsvpAdminOutput {
  const base = rsvpRowToOutput(row, (row.contact_display_name as string) ?? null);
  return {
    ...base,
    paymentConfirmedAt: toISOStringOrNull(
      row.payment_confirmed_at instanceof Date
        ? row.payment_confirmed_at
        : row.payment_confirmed_at
          ? new Date(row.payment_confirmed_at as string)
          : null,
    ),
    reviewedByUserId: (row.reviewed_by_user_id as string) ?? null,
    reviewedAt: toISOStringOrNull(
      row.reviewed_at instanceof Date
        ? row.reviewed_at
        : row.reviewed_at
          ? new Date(row.reviewed_at as string)
          : null,
    ),
    badgerDetails,
    contactDisplayName: (row.contact_display_name as string) ?? null,
  };
}

export class RsvpService {
  constructor(
    private ds: DataSource,
    private rsvpLogService: RsvpLogService,
  ) {}

  async submitBadgerRegistration(input: SubmitBadgerInput): Promise<RsvpOutput> {
    const now = new Date();
    const paymentStatus =
      input.paymentAmountCents && input.paymentAmountCents > 0
        ? PaymentStatus.Pending
        : PaymentStatus.NotRequired;

    // Check for existing record (including cancelled) to avoid duplicates
    const existingId = await this.findExistingAttendee(input.contactId, input.eventId);

    let rsvpId: string;
    if (existingId) {
      // Reactivate existing record
      rsvpId = existingId;
      await this.ds.query(
        `UPDATE event_attendees
         SET status = $1, cancelled_at = NULL, registration_method = $2,
             contact_id = $3, user_id = $4, invitation_id = $5,
             waiver_signed = true, waiver_content_hash = $6, waiver_accepted_at = $7,
             waiver_ip = $8, waiver_user_agent = $9,
             payment_method = $10, payment_status = $11, payment_amount_cents = $12,
             updated_at = $13
         WHERE id = $14`,
        [
          AttendeeStatus.Yes,
          input.registrationMethod,
          input.contactId,
          input.userId,
          input.invitationId ?? null,
          input.waiverContentHash,
          now,
          input.waiverIp,
          input.waiverUserAgent,
          input.paymentMethod,
          paymentStatus,
          input.paymentAmountCents,
          now,
          existingId,
        ],
      );

      // Update or insert badger registration details
      await this.ds.query(`DELETE FROM badger_registrations WHERE rsvp_id = $1`, [existingId]);
    } else {
      rsvpId = uuid();
      await this.ds.query(
        `INSERT INTO event_attendees (
          id, contact_id, user_id, event_id, registration_method, invitation_id,
          status, sort_order, waiver_signed,
          waiver_content_hash, waiver_accepted_at, waiver_ip, waiver_user_agent,
          payment_method, payment_status, payment_amount_cents, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, true, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          rsvpId,
          input.contactId,
          input.userId,
          input.eventId,
          input.registrationMethod,
          input.invitationId ?? null,
          AttendeeStatus.Yes,
          input.waiverContentHash,
          now,
          input.waiverIp,
          input.waiverUserAgent,
          input.paymentMethod,
          paymentStatus,
          input.paymentAmountCents,
          now,
          now,
        ],
      );
    }

    // Create badger registration detail row
    const badgerId = uuid();
    await this.ds.query(
      `INSERT INTO badger_registrations (id, rsvp_id, tshirt_size, traveling_by, club, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        badgerId,
        rsvpId,
        input.badgerDetails.tshirtSize,
        input.badgerDetails.travelingBy,
        input.badgerDetails.club ?? null,
        now,
      ],
    );

    // Log the registration
    await this.rsvpLogService.create(rsvpId, RsvpLogCode.Registered, input.userId);

    return {
      id: rsvpId,
      contactId: input.contactId,
      userId: input.userId,
      eventId: input.eventId,
      status: AttendeeStatus.Yes,
      registrationMethod: input.registrationMethod,
      paymentMethod: input.paymentMethod,
      paymentStatus,
      paymentAmountCents: input.paymentAmountCents,
      waiverAcceptedAt: now.toISOString(),
      createdAt: now.toISOString(),
      displayName: null,
    };
  }

  async createAuthRsvp(
    contactId: string,
    userId: string,
    input: {
      eventId: string;
      waiverContentHash: string;
      waiverIp: string;
      waiverUserAgent: string | null;
      paymentMethod?: PaymentMethod;
      paymentAmountCents?: number | null;
    },
  ): Promise<RsvpOutput> {
    const now = new Date();
    const paymentStatus =
      input.paymentAmountCents && input.paymentAmountCents > 0
        ? PaymentStatus.Pending
        : PaymentStatus.NotRequired;

    // Check for existing record (including cancelled) to avoid duplicates
    const existingId = await this.findExistingAttendee(contactId, input.eventId);

    let rsvpId: string;
    if (existingId) {
      // Reactivate existing record
      rsvpId = existingId;
      await this.ds.query(
        `UPDATE event_attendees
         SET status = $1, cancelled_at = NULL, registration_method = $2, user_id = $3,
             waiver_signed = true,
             waiver_content_hash = $4, waiver_accepted_at = $5, waiver_ip = $6, waiver_user_agent = $7,
             payment_method = $8, payment_status = $9, payment_amount_cents = $10, updated_at = $11
         WHERE id = $12`,
        [
          AttendeeStatus.Yes,
          RegistrationMethod.Auth,
          userId,
          input.waiverContentHash,
          now,
          input.waiverIp,
          input.waiverUserAgent,
          input.paymentMethod ?? null,
          paymentStatus,
          input.paymentAmountCents ?? null,
          now,
          existingId,
        ],
      );
    } else {
      rsvpId = uuid();
      await this.ds.query(
        `INSERT INTO event_attendees (
          id, contact_id, user_id, event_id, registration_method,
          status, sort_order, waiver_signed,
          waiver_content_hash, waiver_accepted_at, waiver_ip, waiver_user_agent,
          payment_method, payment_status, payment_amount_cents, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 0, true, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          rsvpId,
          contactId,
          userId,
          input.eventId,
          RegistrationMethod.Auth,
          AttendeeStatus.Yes,
          input.waiverContentHash,
          now,
          input.waiverIp,
          input.waiverUserAgent,
          input.paymentMethod ?? null,
          paymentStatus,
          input.paymentAmountCents ?? null,
          now,
          now,
        ],
      );
    }

    await this.rsvpLogService.create(rsvpId, RsvpLogCode.Registered, userId);

    return {
      id: rsvpId,
      contactId,
      userId,
      eventId: input.eventId,
      status: AttendeeStatus.Yes,
      registrationMethod: RegistrationMethod.Auth,
      paymentMethod: input.paymentMethod ?? null,
      paymentStatus,
      paymentAmountCents: input.paymentAmountCents ?? null,
      waiverAcceptedAt: now.toISOString(),
      createdAt: now.toISOString(),
      displayName: null,
    };
  }

  async findById(id: string): Promise<RsvpOutput | null> {
    const rows = (await this.ds.query(
      `SELECT r.*, c.display_name AS contact_display_name
       FROM event_attendees r
       LEFT JOIN contacts c ON c.id = r.contact_id
       WHERE r.id = $1`,
      [id],
    )) as Array<Record<string, unknown>>;

    const row = rows[0];
    if (!row) return null;
    return rsvpRowToOutput(row, (row.contact_display_name as string) ?? null);
  }

  async hasActiveRsvp(contactId: string, eventId: string): Promise<boolean> {
    const rows = (await this.ds.query(
      `SELECT 1 FROM event_attendees WHERE contact_id = $1 AND event_id = $2 AND registration_method IS NOT NULL AND cancelled_at IS NULL AND status != $3 LIMIT 1`,
      [contactId, eventId, AttendeeStatus.No],
    )) as Array<Record<string, unknown>>;
    return rows.length > 0;
  }

  /** Find any existing attendee record for a contact+event (including cancelled). */
  private async findExistingAttendee(contactId: string, eventId: string): Promise<string | null> {
    const rows = (await this.ds.query(
      `SELECT id FROM event_attendees WHERE contact_id = $1 AND event_id = $2 AND registration_method IS NOT NULL ORDER BY created_at DESC LIMIT 1`,
      [contactId, eventId],
    )) as Array<{ id: string }>;
    return rows[0]?.id ?? null;
  }

  async findByContact(contactId: string): Promise<RsvpOutput[]> {
    const rows = (await this.ds.query(
      `SELECT r.*, c.display_name AS contact_display_name,
              e.name AS event_name
       FROM event_attendees r
       LEFT JOIN contacts c ON c.id = r.contact_id
       LEFT JOIN events e ON e.id = r.event_id
       WHERE r.contact_id = $1 AND r.registration_method IS NOT NULL
       ORDER BY r.created_at DESC`,
      [contactId],
    )) as Array<Record<string, unknown>>;

    return rows.map((row) => rsvpRowToOutput(row, (row.contact_display_name as string) ?? null));
  }

  async findByContactAndEvent(contactId: string, eventId: string): Promise<RsvpOutput | null> {
    const rows = (await this.ds.query(
      `SELECT r.*, c.display_name AS contact_display_name
       FROM event_attendees r
       LEFT JOIN contacts c ON c.id = r.contact_id
       WHERE r.contact_id = $1 AND r.event_id = $2 AND r.registration_method IS NOT NULL AND r.cancelled_at IS NULL
       LIMIT 1`,
      [contactId, eventId],
    )) as Array<Record<string, unknown>>;

    const row = rows[0];
    if (!row) return null;
    return rsvpRowToOutput(row, (row.contact_display_name as string) ?? null);
  }

  async findByEvent(eventId: string): Promise<RsvpOutput[]> {
    const rows = (await this.ds.query(
      `SELECT r.*, c.display_name AS contact_display_name
       FROM event_attendees r
       LEFT JOIN contacts c ON c.id = r.contact_id
       WHERE r.event_id = $1 AND r.registration_method IS NOT NULL
       ORDER BY r.created_at DESC`,
      [eventId],
    )) as Array<Record<string, unknown>>;

    return rows.map((row) => rsvpRowToOutput(row, (row.contact_display_name as string) ?? null));
  }

  async findPendingReview(eventId: string): Promise<RsvpAdminOutput[]> {
    const rows = (await this.ds.query(
      `SELECT r.*, c.display_name AS contact_display_name
       FROM event_attendees r
       LEFT JOIN contacts c ON c.id = r.contact_id
       WHERE r.event_id = $1 AND r.status = $2 AND r.registration_method IS NOT NULL
       ORDER BY r.created_at ASC`,
      [eventId, AttendeeStatus.Pending],
    )) as Array<Record<string, unknown>>;

    return Promise.all(
      rows.map(async (row) => {
        const badgerDetails = await this.getBadgerDetails(row.id as string);
        return rsvpRowToAdminOutput(row, badgerDetails);
      }),
    );
  }

  async findByEventAdmin(eventId: string): Promise<RsvpAdminOutput[]> {
    const rows = (await this.ds.query(
      `SELECT r.*, c.display_name AS contact_display_name
       FROM event_attendees r
       LEFT JOIN contacts c ON c.id = r.contact_id
       WHERE r.event_id = $1 AND r.registration_method IS NOT NULL
       ORDER BY r.created_at DESC`,
      [eventId],
    )) as Array<Record<string, unknown>>;

    return Promise.all(
      rows.map(async (row) => {
        const badgerDetails = await this.getBadgerDetails(row.id as string);
        return rsvpRowToAdminOutput(row, badgerDetails);
      }),
    );
  }

  async findActionRequired(eventId: string): Promise<RsvpAdminOutput[]> {
    const rows = (await this.ds.query(
      `SELECT r.*, c.display_name AS contact_display_name
       FROM event_attendees r
       LEFT JOIN contacts c ON c.id = r.contact_id
       WHERE r.event_id = $1
         AND r.registration_method IS NOT NULL
         AND r.status != $2
         AND (
           r.status = $3
           OR r.payment_status = $4
           OR r.payment_status = $5
         )
       ORDER BY r.created_at DESC`,
      [
        eventId,
        AttendeeStatus.No,
        AttendeeStatus.Pending,
        PaymentStatus.Pending,
        PaymentStatus.RefundRequested,
      ],
    )) as Array<Record<string, unknown>>;

    return Promise.all(
      rows.map(async (row) => {
        const badgerDetails = await this.getBadgerDetails(row.id as string);
        return rsvpRowToAdminOutput(row, badgerDetails);
      }),
    );
  }

  async cancel(rsvpId: string, cancelledByUserId?: string): Promise<void> {
    const now = new Date();

    // Check RSVP exists and get current payment status
    const rows = (await this.ds.query(`SELECT payment_status FROM event_attendees WHERE id = $1`, [
      rsvpId,
    ])) as Array<{ payment_status: string }>;

    if (rows.length === 0) {
      throw new Error(`RSVP not found: ${rsvpId}`);
    }

    const currentPaymentStatus = rows[0]?.payment_status;
    const newPaymentStatus =
      currentPaymentStatus === PaymentStatus.Confirmed
        ? PaymentStatus.RefundRequested
        : currentPaymentStatus;

    await this.ds.query(
      `UPDATE event_attendees
       SET status = $1, cancelled_at = $2, payment_status = $3, updated_at = $4
       WHERE id = $5`,
      [AttendeeStatus.No, now, newPaymentStatus, now, rsvpId],
    );

    await this.rsvpLogService.create(rsvpId, RsvpLogCode.Cancelled, cancelledByUserId ?? null);
  }

  async adminCancel(rsvpId: string, cancelledByUserId: string): Promise<void> {
    const now = new Date();

    const rows = (await this.ds.query(`SELECT payment_status FROM event_attendees WHERE id = $1`, [
      rsvpId,
    ])) as Array<{ payment_status: string }>;

    if (rows.length === 0) {
      throw new Error(`RSVP not found: ${rsvpId}`);
    }

    const currentPaymentStatus = rows[0]?.payment_status;
    const newPaymentStatus =
      currentPaymentStatus === PaymentStatus.Confirmed
        ? PaymentStatus.RefundRequested
        : currentPaymentStatus;

    await this.ds.query(
      `UPDATE event_attendees
       SET status = $1, cancelled_at = $2, payment_status = $3, updated_at = $4
       WHERE id = $5`,
      [AttendeeStatus.No, now, newPaymentStatus, now, rsvpId],
    );

    await this.rsvpLogService.create(rsvpId, RsvpLogCode.AdminCancelled, cancelledByUserId);
  }

  async confirmPayment(rsvpId: string, confirmedByUserId: string, note?: string): Promise<void> {
    const now = new Date();
    await this.ds.query(
      `UPDATE event_attendees
       SET payment_status = $1, payment_confirmed_by_user_id = $2, payment_confirmed_at = $3,
           updated_at = $4
       WHERE id = $5`,
      [PaymentStatus.Confirmed, confirmedByUserId, now, now, rsvpId],
    );

    await this.rsvpLogService.create(rsvpId, RsvpLogCode.PaymentConfirmed, confirmedByUserId, note);
  }

  async confirmBulkPayment(
    rsvpIds: string[],
    confirmedByUserId: string,
    note?: string,
  ): Promise<void> {
    for (const rsvpId of rsvpIds) {
      await this.confirmPayment(rsvpId, confirmedByUserId, note);
    }
  }

  async processRefund(
    rsvpId: string,
    adminUserId: string,
    note?: string,
    externalRefundId?: string,
  ): Promise<void> {
    const now = new Date();
    await this.ds.query(
      `UPDATE event_attendees
       SET payment_status = $1, external_refund_id = $2, updated_at = $3
       WHERE id = $4`,
      [PaymentStatus.Refunded, externalRefundId ?? null, now, rsvpId],
    );

    await this.rsvpLogService.create(rsvpId, RsvpLogCode.RefundProcessed, adminUserId, note);
  }

  async linkUserAccount(rsvpId: string, userId: string): Promise<void> {
    const now = new Date();
    await this.ds.query(`UPDATE event_attendees SET user_id = $1, updated_at = $2 WHERE id = $3`, [
      userId,
      now,
      rsvpId,
    ]);

    await this.rsvpLogService.create(rsvpId, RsvpLogCode.AccountLinked, userId);
  }

  async getCurrentWaiver(): Promise<{ body: string; contentHash: string } | null> {
    const rows = (await this.ds.query(
      `SELECT body, content_hash FROM waiver_versions
       WHERE retired_at IS NULL
       ORDER BY effective_at DESC
       LIMIT 1`,
    )) as Array<Record<string, unknown>>;

    const row = rows[0];
    if (!row) return null;

    return {
      body: row.body as string,
      contentHash: row.content_hash as string,
    };
  }

  async getContactPrefill(contactId: string): Promise<{
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    zip: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
  }> {
    const contactRows = (await this.ds.query(
      `SELECT first_name, last_name FROM contacts WHERE id = $1`,
      [contactId],
    )) as Array<Record<string, unknown>>;

    const contact = contactRows[0];

    const emailRows = (await this.ds.query(
      `SELECT email FROM contact_emails WHERE contact_id = $1 AND is_primary = true LIMIT 1`,
      [contactId],
    )) as Array<Record<string, unknown>>;

    const phoneRows = (await this.ds.query(
      `SELECT phone FROM contact_phones WHERE contact_id = $1 AND is_primary = true LIMIT 1`,
      [contactId],
    )) as Array<Record<string, unknown>>;

    const addressRows = (await this.ds.query(
      `SELECT address_line1, postal_code FROM contact_addresses WHERE contact_id = $1 AND is_primary_mailing = true LIMIT 1`,
      [contactId],
    )) as Array<Record<string, unknown>>;

    const ecRows = (await this.ds.query(
      `SELECT name, phone FROM contact_emergency_contacts WHERE contact_id = $1 LIMIT 1`,
      [contactId],
    )) as Array<Record<string, unknown>>;

    return {
      firstName: (contact?.first_name as string) ?? null,
      lastName: (contact?.last_name as string) ?? null,
      email: (emailRows[0]?.email as string) ?? null,
      phone: (phoneRows[0]?.phone as string) ?? null,
      address: (addressRows[0]?.address_line1 as string) ?? null,
      zip: (addressRows[0]?.postal_code as string) ?? null,
      emergencyContactName: (ecRows[0]?.name as string) ?? null,
      emergencyContactPhone: (ecRows[0]?.phone as string) ?? null,
    };
  }

  private async getBadgerDetails(rsvpId: string): Promise<RsvpAdminOutput["badgerDetails"]> {
    const rows = (await this.ds.query(`SELECT * FROM badger_registrations WHERE rsvp_id = $1`, [
      rsvpId,
    ])) as Array<Record<string, unknown>>;

    const row = rows[0];
    if (!row) return null;

    return {
      tshirtSize: row.tshirt_size as TshirtSize,
      travelingBy: row.traveling_by as TravelMode,
      club: (row.club as string) ?? null,
    };
  }
}
