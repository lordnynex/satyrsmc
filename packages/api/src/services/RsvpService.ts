import type { DataSource } from "typeorm";
import {
  EventRsvpStatus,
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
  contactId: string | null;
  userId: string | null;
  invitationId?: string | null;
  paymentMethod: PaymentMethod;
  paymentAmountCents: number | null;
  waiverContentHash: string;
  waiverIp: string;
  waiverUserAgent: string | null;
  badgerDetails: BadgerDetails;
  submission?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address?: string;
    zip?: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
  };
}

function rsvpRowToOutput(row: Record<string, unknown>, displayName: string | null): RsvpOutput {
  return {
    id: row.id as string,
    contactId: (row.contact_id as string) ?? null,
    userId: (row.user_id as string) ?? null,
    eventId: row.event_id as string,
    status: row.status as EventRsvpStatus,
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
  submission: RsvpAdminOutput["submission"],
  badgerDetails: RsvpAdminOutput["badgerDetails"],
): RsvpAdminOutput {
  const base = rsvpRowToOutput(
    row,
    (row.contact_display_name as string) ??
      (submission ? `${submission.firstName} ${submission.lastName}` : null),
  );
  return {
    ...base,
    submission,
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
    const rsvpId = uuid();
    const now = new Date();
    const status =
      input.registrationMethod === RegistrationMethod.Auth
        ? EventRsvpStatus.Registered
        : EventRsvpStatus.PendingReview;
    const paymentStatus =
      input.paymentAmountCents && input.paymentAmountCents > 0
        ? PaymentStatus.Pending
        : PaymentStatus.NotRequired;

    await this.ds.query(
      `INSERT INTO event_rsvps (
        id, contact_id, user_id, event_id, registration_method, invitation_id,
        status, waiver_content_hash, waiver_accepted_at, waiver_ip, waiver_user_agent,
        payment_method, payment_status, payment_amount_cents, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        rsvpId,
        input.contactId,
        input.userId,
        input.eventId,
        input.registrationMethod,
        input.invitationId ?? null,
        status,
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

    // Create submission row for token-based registrations
    if (input.submission) {
      const submissionId = uuid();
      await this.ds.query(
        `INSERT INTO rsvp_submissions (
          id, rsvp_id, first_name, last_name, email, phone, address, zip,
          emergency_contact_name, emergency_contact_phone, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          submissionId,
          rsvpId,
          input.submission.firstName,
          input.submission.lastName,
          input.submission.email,
          input.submission.phone,
          input.submission.address ?? null,
          input.submission.zip ?? null,
          input.submission.emergencyContactName,
          input.submission.emergencyContactPhone,
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

    const displayName = input.submission
      ? `${input.submission.firstName} ${input.submission.lastName}`
      : null;

    return {
      id: rsvpId,
      contactId: input.contactId,
      userId: input.userId,
      eventId: input.eventId,
      status,
      registrationMethod: input.registrationMethod,
      paymentMethod: input.paymentMethod,
      paymentStatus,
      paymentAmountCents: input.paymentAmountCents,
      waiverAcceptedAt: now.toISOString(),
      createdAt: now.toISOString(),
      displayName,
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
    const rsvpId = uuid();
    const now = new Date();
    const paymentStatus =
      input.paymentAmountCents && input.paymentAmountCents > 0
        ? PaymentStatus.Pending
        : PaymentStatus.NotRequired;

    await this.ds.query(
      `INSERT INTO event_rsvps (
        id, contact_id, user_id, event_id, registration_method,
        status, waiver_content_hash, waiver_accepted_at, waiver_ip, waiver_user_agent,
        payment_method, payment_status, payment_amount_cents, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        rsvpId,
        contactId,
        userId,
        input.eventId,
        RegistrationMethod.Auth,
        EventRsvpStatus.Registered,
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

    await this.rsvpLogService.create(rsvpId, RsvpLogCode.Registered, userId);

    return {
      id: rsvpId,
      contactId,
      userId,
      eventId: input.eventId,
      status: EventRsvpStatus.Registered,
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
       FROM event_rsvps r
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
      `SELECT 1 FROM event_rsvps WHERE contact_id = $1 AND event_id = $2 AND cancelled_at IS NULL LIMIT 1`,
      [contactId, eventId],
    )) as Array<Record<string, unknown>>;
    return rows.length > 0;
  }

  async findByEvent(eventId: string): Promise<RsvpOutput[]> {
    const rows = (await this.ds.query(
      `SELECT r.*, c.display_name AS contact_display_name
       FROM event_rsvps r
       LEFT JOIN contacts c ON c.id = r.contact_id
       WHERE r.event_id = $1
       ORDER BY r.created_at DESC`,
      [eventId],
    )) as Array<Record<string, unknown>>;

    return rows.map((row) => rsvpRowToOutput(row, (row.contact_display_name as string) ?? null));
  }

  async findPendingReview(eventId: string): Promise<RsvpAdminOutput[]> {
    const rows = (await this.ds.query(
      `SELECT r.*, c.display_name AS contact_display_name
       FROM event_rsvps r
       LEFT JOIN contacts c ON c.id = r.contact_id
       WHERE r.event_id = $1 AND r.status = $2
       ORDER BY r.created_at ASC`,
      [eventId, EventRsvpStatus.PendingReview],
    )) as Array<Record<string, unknown>>;

    return Promise.all(
      rows.map(async (row) => {
        const rsvpId = row.id as string;
        const submission = await this.getSubmission(rsvpId);
        const badgerDetails = await this.getBadgerDetails(rsvpId);
        return rsvpRowToAdminOutput(row, submission, badgerDetails);
      }),
    );
  }

  async findByEventAdmin(eventId: string): Promise<RsvpAdminOutput[]> {
    const rows = (await this.ds.query(
      `SELECT r.*, c.display_name AS contact_display_name
       FROM event_rsvps r
       LEFT JOIN contacts c ON c.id = r.contact_id
       WHERE r.event_id = $1
       ORDER BY r.created_at DESC`,
      [eventId],
    )) as Array<Record<string, unknown>>;

    return Promise.all(
      rows.map(async (row) => {
        const rsvpId = row.id as string;
        const submission = await this.getSubmission(rsvpId);
        const badgerDetails = await this.getBadgerDetails(rsvpId);
        return rsvpRowToAdminOutput(row, submission, badgerDetails);
      }),
    );
  }

  async matchToContact(rsvpId: string, contactId: string, reviewedByUserId: string): Promise<void> {
    const now = new Date();
    await this.ds.query(
      `UPDATE event_rsvps
       SET contact_id = $1, status = $2, reviewed_by_user_id = $3, reviewed_at = $4, updated_at = $5
       WHERE id = $6`,
      [contactId, EventRsvpStatus.Registered, reviewedByUserId, now, now, rsvpId],
    );

    // Delete the temporary submission data
    await this.ds.query(`DELETE FROM rsvp_submissions WHERE rsvp_id = $1`, [rsvpId]);

    // Fetch contact name for log message
    const contactRows = (await this.ds.query(`SELECT display_name FROM contacts WHERE id = $1`, [
      contactId,
    ])) as Array<{ display_name: string }>;
    const contactName = contactRows[0]?.display_name ?? contactId;

    await this.rsvpLogService.create(
      rsvpId,
      RsvpLogCode.MatchedToContact,
      reviewedByUserId,
      `Matched to contact: ${contactName}`,
    );
  }

  async confirmAsNewContact(rsvpId: string, reviewedByUserId: string): Promise<string> {
    // Read submission data
    const subRows = (await this.ds.query(`SELECT * FROM rsvp_submissions WHERE rsvp_id = $1`, [
      rsvpId,
    ])) as Array<Record<string, unknown>>;

    const sub = subRows[0];
    if (!sub) {
      throw new Error(`No submission found for RSVP ${rsvpId}`);
    }

    const contactId = uuid();
    const firstName = sub.first_name as string;
    const lastName = sub.last_name as string;
    const displayName = `${firstName} ${lastName}`;

    // Create contact
    await this.ds.query(
      `INSERT INTO contacts (id, type, status, display_name, first_name, last_name, uid)
       VALUES ($1, 'person', 'active', $2, $3, $4, $5)`,
      [contactId, displayName, firstName, lastName, `contact-${contactId}@satyrsmc`],
    );

    // Create contact email
    const emailId = uuid();
    await this.ds.query(
      `INSERT INTO contact_emails (id, contact_id, email, type, is_primary)
       VALUES ($1, $2, $3, 'other', true)`,
      [emailId, contactId, sub.email as string],
    );

    // Create contact phone
    const phoneId = uuid();
    await this.ds.query(
      `INSERT INTO contact_phones (id, contact_id, phone, type, is_primary)
       VALUES ($1, $2, $3, 'cell', true)`,
      [phoneId, contactId, sub.phone as string],
    );

    // Create emergency contact
    const ecId = uuid();
    await this.ds.query(
      `INSERT INTO contact_emergency_contacts (id, contact_id, name, phone)
       VALUES ($1, $2, $3, $4)`,
      [
        ecId,
        contactId,
        sub.emergency_contact_name as string,
        sub.emergency_contact_phone as string,
      ],
    );

    // Link RSVP to new contact
    const now = new Date();
    await this.ds.query(
      `UPDATE event_rsvps
       SET contact_id = $1, status = $2, reviewed_by_user_id = $3, reviewed_at = $4, updated_at = $5
       WHERE id = $6`,
      [contactId, EventRsvpStatus.Registered, reviewedByUserId, now, now, rsvpId],
    );

    // Delete submission
    await this.ds.query(`DELETE FROM rsvp_submissions WHERE rsvp_id = $1`, [rsvpId]);

    await this.rsvpLogService.create(
      rsvpId,
      RsvpLogCode.NewContactCreated,
      reviewedByUserId,
      `New contact created: ${displayName}`,
    );

    return contactId;
  }

  async cancel(rsvpId: string, cancelledByUserId?: string): Promise<void> {
    const now = new Date();

    // Check if payment was confirmed — if so, trigger refund request
    const rows = (await this.ds.query(`SELECT payment_status FROM event_rsvps WHERE id = $1`, [
      rsvpId,
    ])) as Array<{ payment_status: string }>;

    const currentPaymentStatus = rows[0]?.payment_status;
    const newPaymentStatus =
      currentPaymentStatus === PaymentStatus.Confirmed
        ? PaymentStatus.RefundRequested
        : currentPaymentStatus;

    await this.ds.query(
      `UPDATE event_rsvps
       SET status = $1, cancelled_at = $2, payment_status = $3, updated_at = $4
       WHERE id = $5`,
      [EventRsvpStatus.Cancelled, now, newPaymentStatus, now, rsvpId],
    );

    await this.rsvpLogService.create(rsvpId, RsvpLogCode.Cancelled, cancelledByUserId ?? null);
  }

  async adminCancel(rsvpId: string, cancelledByUserId: string): Promise<void> {
    const now = new Date();

    const rows = (await this.ds.query(`SELECT payment_status FROM event_rsvps WHERE id = $1`, [
      rsvpId,
    ])) as Array<{ payment_status: string }>;

    const currentPaymentStatus = rows[0]?.payment_status;
    const newPaymentStatus =
      currentPaymentStatus === PaymentStatus.Confirmed
        ? PaymentStatus.RefundRequested
        : currentPaymentStatus;

    await this.ds.query(
      `UPDATE event_rsvps
       SET status = $1, cancelled_at = $2, payment_status = $3, updated_at = $4
       WHERE id = $5`,
      [EventRsvpStatus.Cancelled, now, newPaymentStatus, now, rsvpId],
    );

    await this.rsvpLogService.create(rsvpId, RsvpLogCode.AdminCancelled, cancelledByUserId);
  }

  async confirmPayment(rsvpId: string, confirmedByUserId: string, note?: string): Promise<void> {
    const now = new Date();
    await this.ds.query(
      `UPDATE event_rsvps
       SET payment_status = $1, payment_confirmed_by_user_id = $2, payment_confirmed_at = $3,
           status = $4, updated_at = $5
       WHERE id = $6`,
      [PaymentStatus.Confirmed, confirmedByUserId, now, EventRsvpStatus.Confirmed, now, rsvpId],
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
      `UPDATE event_rsvps
       SET payment_status = $1, external_refund_id = $2, updated_at = $3
       WHERE id = $4`,
      [PaymentStatus.Refunded, externalRefundId ?? null, now, rsvpId],
    );

    await this.rsvpLogService.create(rsvpId, RsvpLogCode.RefundProcessed, adminUserId, note);
  }

  async linkUserAccount(rsvpId: string, userId: string): Promise<void> {
    const now = new Date();
    await this.ds.query(`UPDATE event_rsvps SET user_id = $1, updated_at = $2 WHERE id = $3`, [
      userId,
      now,
      rsvpId,
    ]);

    await this.rsvpLogService.create(rsvpId, RsvpLogCode.AccountLinked, userId);
  }

  private async getSubmission(rsvpId: string): Promise<RsvpAdminOutput["submission"]> {
    const rows = (await this.ds.query(`SELECT * FROM rsvp_submissions WHERE rsvp_id = $1`, [
      rsvpId,
    ])) as Array<Record<string, unknown>>;

    const row = rows[0];
    if (!row) return null;

    return {
      firstName: row.first_name as string,
      lastName: row.last_name as string,
      email: row.email as string,
      phone: row.phone as string,
      address: (row.address as string) ?? null,
      zip: (row.zip as string) ?? null,
      emergencyContactName: row.emergency_contact_name as string,
      emergencyContactPhone: row.emergency_contact_phone as string,
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
