import { describe, test, expect, beforeAll } from "bun:test";
import type { DataSource } from "typeorm";
import { setupTestDb } from "../../test/setup";
import type { Api } from "../api";
import {
  AttendeeStatus,
  RegistrationMethod,
  PaymentMethod,
  PaymentStatus,
  TshirtSize,
  TravelMode,
  RsvpLogCode,
} from "@satyrsmc/shared/lib/enums";
import { createEvent, createContact, createUser } from "./helpers";
import { uuid } from "../utils";

/** Insert a legacy token-based pending registration directly (simulates pre-removal data). */
async function insertLegacyPendingRegistration(
  dataSource: DataSource,
  eventId: string,
  submission: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    zip: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
  },
  badgerDets: { tshirtSize: string; travelingBy: string; club?: string | null },
) {
  const rsvpId = uuid();
  const now = new Date();
  await dataSource.query(
    `INSERT INTO event_attendees (
      id, contact_id, user_id, event_id, registration_method,
      status, sort_order, waiver_signed,
      waiver_content_hash, waiver_accepted_at, waiver_ip,
      payment_method, payment_status, payment_amount_cents, created_at, updated_at
    ) VALUES ($1, NULL, NULL, $2, $3, $4, 0, true, $5, $6, $7, $8, $9, $10, $11, $12)`,
    [
      rsvpId,
      eventId,
      RegistrationMethod.EventToken,
      AttendeeStatus.Pending,
      "hash",
      now,
      "127.0.0.1",
      PaymentMethod.Cash,
      PaymentStatus.Pending,
      20000,
      now,
      now,
    ],
  );
  await dataSource.query(
    `INSERT INTO badger_registrations (id, rsvp_id, tshirt_size, traveling_by, club, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [uuid(), rsvpId, badgerDets.tshirtSize, badgerDets.travelingBy, badgerDets.club ?? null, now],
  );
  await dataSource.query(
    `INSERT INTO rsvp_submissions (id, rsvp_id, first_name, last_name, email, phone, address, zip, emergency_contact_name, emergency_contact_phone, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      uuid(),
      rsvpId,
      submission.firstName,
      submission.lastName,
      submission.email,
      submission.phone,
      submission.address,
      submission.zip,
      submission.emergencyContactName,
      submission.emergencyContactPhone,
      now,
    ],
  );
  return rsvpId;
}

describe("RsvpService", () => {
  let api: Api;
  let ds: DataSource;

  beforeAll(async () => {
    const result = await setupTestDb();
    api = result.api;
    ds = result.ds;
  });

  const badgerDetails = {
    tshirtSize: TshirtSize.L,
    travelingBy: TravelMode.Motorcycle,
    club: "Satyrs MC",
  };

  const submissionData = {
    firstName: "Craig",
    lastName: "Thompson",
    email: "craig@example.com",
    phone: "5551234567",
    address: "123 Main St",
    zip: "90001",
    emergencyContactName: "Jane Thompson",
    emergencyContactPhone: "5559876543",
  };

  describe("submitBadgerRegistration", () => {
    test("creates an authenticated registration", async () => {
      const event = await createEvent(api);
      const { userId, contactId } = await createUser(ds, api);

      const rsvp = await api.rsvps.submitBadgerRegistration({
        eventId: event.id,
        registrationMethod: RegistrationMethod.Auth,
        contactId,
        userId,
        paymentMethod: PaymentMethod.Cash,
        paymentAmountCents: 20000,
        waiverContentHash: "def456",
        waiverIp: "127.0.0.1",
        waiverUserAgent: null,
        badgerDetails,
      });

      expect(rsvp.contactId).toBe(contactId);
      expect(rsvp.status).toBe(AttendeeStatus.Yes);
      expect(rsvp.registrationMethod).toBe(RegistrationMethod.Auth);
    });

    test("creates log entry on registration", async () => {
      const event = await createEvent(api);
      const { userId, contactId } = await createUser(ds, api);
      const rsvp = await api.rsvps.submitBadgerRegistration({
        eventId: event.id,
        registrationMethod: RegistrationMethod.Auth,
        contactId,
        userId,
        paymentMethod: PaymentMethod.Check,
        paymentAmountCents: 20000,
        waiverContentHash: "hash",
        waiverIp: "127.0.0.1",
        waiverUserAgent: null,
        badgerDetails,
      });

      const logs = await api.rsvpLogs.listByRsvp(rsvp.id);
      expect(logs.length).toBeGreaterThanOrEqual(1);
      expect(logs[0]!.messageCode).toBe(RsvpLogCode.Registered);
    });
  });

  describe("createAuthRsvp", () => {
    test("creates a standard auth RSVP", async () => {
      const event = await createEvent(api);
      const { userId, contactId } = await createUser(ds, api);

      const rsvp = await api.rsvps.createAuthRsvp(contactId, userId, {
        eventId: event.id,
        waiverContentHash: "hash",
        waiverIp: "127.0.0.1",
        waiverUserAgent: null,
      });

      expect(rsvp.status).toBe(AttendeeStatus.Yes);
      expect(rsvp.registrationMethod).toBe(RegistrationMethod.Auth);
      expect(rsvp.paymentStatus).toBe(PaymentStatus.NotRequired);
    });

    test("creates a paid auth RSVP with pending payment", async () => {
      const event = await createEvent(api);
      const { userId, contactId } = await createUser(ds, api);

      const rsvp = await api.rsvps.createAuthRsvp(contactId, userId, {
        eventId: event.id,
        waiverContentHash: "hash",
        waiverIp: "127.0.0.1",
        waiverUserAgent: null,
        paymentMethod: PaymentMethod.Zelle,
        paymentAmountCents: 5000,
      });

      expect(rsvp.paymentStatus).toBe(PaymentStatus.Pending);
      expect(rsvp.paymentMethod).toBe(PaymentMethod.Zelle);
    });
  });

  describe("findById", () => {
    test("returns RSVP by id", async () => {
      const event = await createEvent(api);
      const { userId, contactId } = await createUser(ds, api);
      const created = await api.rsvps.createAuthRsvp(contactId, userId, {
        eventId: event.id,
        waiverContentHash: "hash",
        waiverIp: "127.0.0.1",
        waiverUserAgent: null,
      });

      const found = await api.rsvps.findById(created.id);
      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
    });

    test("returns null for non-existent id", async () => {
      const found = await api.rsvps.findById(crypto.randomUUID());
      expect(found).toBeNull();
    });
  });

  describe("hasActiveRsvp", () => {
    test("returns true when contact has an active RSVP for event", async () => {
      const event = await createEvent(api);
      const { userId, contactId } = await createUser(ds, api);
      await api.rsvps.createAuthRsvp(contactId, userId, {
        eventId: event.id,
        waiverContentHash: "hash",
        waiverIp: "127.0.0.1",
        waiverUserAgent: null,
      });

      const has = await api.rsvps.hasActiveRsvp(contactId, event.id);
      expect(has).toBe(true);
    });

    test("returns false when no RSVP exists", async () => {
      const event = await createEvent(api);
      const has = await api.rsvps.hasActiveRsvp(crypto.randomUUID(), event.id);
      expect(has).toBe(false);
    });
  });

  describe("findByEvent", () => {
    test("returns all RSVPs for an event", async () => {
      const event = await createEvent(api);
      const user1 = await createUser(ds, api);
      const user2 = await createUser(ds, api);

      await api.rsvps.createAuthRsvp(user1.contactId, user1.userId, {
        eventId: event.id,
        waiverContentHash: "hash",
        waiverIp: "127.0.0.1",
        waiverUserAgent: null,
      });
      await api.rsvps.createAuthRsvp(user2.contactId, user2.userId, {
        eventId: event.id,
        waiverContentHash: "hash",
        waiverIp: "127.0.0.1",
        waiverUserAgent: null,
      });

      const rsvps = await api.rsvps.findByEvent(event.id);
      expect(rsvps.length).toBe(2);
    });
  });

  describe("findPendingReview", () => {
    test("returns only pending_review RSVPs with submission data", async () => {
      const event = await createEvent(api);

      // Insert legacy token-based pending entry directly
      await insertLegacyPendingRegistration(ds, event.id, submissionData, badgerDetails);

      // Create an auth RSVP (registered, not pending)
      const { userId, contactId } = await createUser(ds, api);
      await api.rsvps.createAuthRsvp(contactId, userId, {
        eventId: event.id,
        waiverContentHash: "hash",
        waiverIp: "127.0.0.1",
        waiverUserAgent: null,
      });

      const pending = await api.rsvps.findPendingReview(event.id);
      expect(pending.length).toBe(1);
      expect(pending[0]!.status).toBe(AttendeeStatus.Pending);
      expect(pending[0]!.submission).not.toBeNull();
      expect(pending[0]!.submission!.firstName).toBe("Craig");
      expect(pending[0]!.badgerDetails).not.toBeNull();
      expect(pending[0]!.badgerDetails!.tshirtSize).toBe(TshirtSize.L);
    });
  });

  describe("matchToContact", () => {
    test("matches a pending RSVP to an existing contact", async () => {
      const event = await createEvent(api);
      const contact = await createContact(api);
      const { userId: adminId } = await createUser(ds, api);

      const rsvpId = await insertLegacyPendingRegistration(
        ds,
        event.id,
        submissionData,
        badgerDetails,
      );

      await api.rsvps.matchToContact(rsvpId, contact.id, adminId);

      const updated = await api.rsvps.findById(rsvpId);
      expect(updated!.contactId).toBe(contact.id);
      expect(updated!.status).toBe(AttendeeStatus.Yes);

      // Submission should be deleted
      const adminView = await api.rsvps.findByEventAdmin(event.id);
      const matched = adminView.find((r) => r.id === rsvpId);
      expect(matched!.submission).toBeNull();

      // Log entry should exist
      const logs = await api.rsvpLogs.listByRsvp(rsvpId);
      const matchLog = logs.find((l) => l.messageCode === RsvpLogCode.MatchedToContact);
      expect(matchLog).toBeDefined();
    });
  });

  describe("confirmAsNewContact", () => {
    test("creates a new contact from submission data", async () => {
      const event = await createEvent(api);
      const { userId: adminId } = await createUser(ds, api);

      const rsvpId = await insertLegacyPendingRegistration(
        ds,
        event.id,
        submissionData,
        badgerDetails,
      );

      const contactId = await api.rsvps.confirmAsNewContact(rsvpId, adminId);
      expect(contactId).toBeDefined();

      // RSVP should be linked
      const updated = await api.rsvps.findById(rsvpId);
      expect(updated!.contactId).toBe(contactId);
      expect(updated!.status).toBe(AttendeeStatus.Yes);

      // Log entry
      const logs = await api.rsvpLogs.listByRsvp(rsvpId);
      const createLog = logs.find((l) => l.messageCode === RsvpLogCode.NewContactCreated);
      expect(createLog).toBeDefined();
    });
  });

  describe("cancel", () => {
    test("cancels an RSVP", async () => {
      const event = await createEvent(api);
      const { userId, contactId } = await createUser(ds, api);

      const rsvp = await api.rsvps.createAuthRsvp(contactId, userId, {
        eventId: event.id,
        waiverContentHash: "hash",
        waiverIp: "127.0.0.1",
        waiverUserAgent: null,
      });

      await api.rsvps.cancel(rsvp.id, userId);

      const updated = await api.rsvps.findById(rsvp.id);
      expect(updated!.status).toBe(AttendeeStatus.No);
    });

    test("triggers refund request when payment was confirmed", async () => {
      const event = await createEvent(api);
      const { userId, contactId } = await createUser(ds, api);
      const { userId: treasurerId } = await createUser(ds, api);

      const rsvp = await api.rsvps.createAuthRsvp(contactId, userId, {
        eventId: event.id,
        waiverContentHash: "hash",
        waiverIp: "127.0.0.1",
        waiverUserAgent: null,
        paymentMethod: PaymentMethod.Zelle,
        paymentAmountCents: 5000,
      });

      // Confirm payment first
      await api.rsvps.confirmPayment(rsvp.id, treasurerId, "Received");

      // Now cancel
      await api.rsvps.cancel(rsvp.id, userId);

      const updated = await api.rsvps.findById(rsvp.id);
      expect(updated!.status).toBe(AttendeeStatus.No);
    });
  });

  describe("confirmPayment", () => {
    test("confirms payment without changing attendance status", async () => {
      const event = await createEvent(api);
      const { userId, contactId } = await createUser(ds, api);
      const { userId: treasurerId } = await createUser(ds, api);

      const rsvp = await api.rsvps.createAuthRsvp(contactId, userId, {
        eventId: event.id,
        waiverContentHash: "hash",
        waiverIp: "127.0.0.1",
        waiverUserAgent: null,
        paymentMethod: PaymentMethod.Cash,
        paymentAmountCents: 20000,
      });

      await api.rsvps.confirmPayment(rsvp.id, treasurerId, "Cash received at meeting");

      const updated = await api.rsvps.findById(rsvp.id);
      expect(updated!.status).toBe(AttendeeStatus.Yes);

      const logs = await api.rsvpLogs.listByRsvp(rsvp.id);
      const paymentLog = logs.find((l) => l.messageCode === RsvpLogCode.PaymentConfirmed);
      expect(paymentLog).toBeDefined();
      expect(paymentLog!.message).toBe("Cash received at meeting");
    });
  });

  describe("confirmBulkPayment", () => {
    test("confirms payment for multiple RSVPs", async () => {
      const event = await createEvent(api);
      const user1 = await createUser(ds, api);
      const user2 = await createUser(ds, api);
      const { userId: treasurerId } = await createUser(ds, api);

      const rsvp1 = await api.rsvps.createAuthRsvp(user1.contactId, user1.userId, {
        eventId: event.id,
        waiverContentHash: "hash",
        waiverIp: "127.0.0.1",
        waiverUserAgent: null,
        paymentMethod: PaymentMethod.Zelle,
        paymentAmountCents: 20000,
      });
      const rsvp2 = await api.rsvps.createAuthRsvp(user2.contactId, user2.userId, {
        eventId: event.id,
        waiverContentHash: "hash",
        waiverIp: "127.0.0.1",
        waiverUserAgent: null,
        paymentMethod: PaymentMethod.Zelle,
        paymentAmountCents: 20000,
      });

      await api.rsvps.confirmBulkPayment([rsvp1.id, rsvp2.id], treasurerId, "Batch confirm");

      const updated1 = await api.rsvps.findById(rsvp1.id);
      const updated2 = await api.rsvps.findById(rsvp2.id);
      expect(updated1!.status).toBe(AttendeeStatus.Yes);
      expect(updated2!.status).toBe(AttendeeStatus.Yes);
    });
  });

  describe("processRefund", () => {
    test("marks payment as refunded", async () => {
      const event = await createEvent(api);
      const { userId, contactId } = await createUser(ds, api);
      const { userId: adminId } = await createUser(ds, api);

      const rsvp = await api.rsvps.createAuthRsvp(contactId, userId, {
        eventId: event.id,
        waiverContentHash: "hash",
        waiverIp: "127.0.0.1",
        waiverUserAgent: null,
        paymentMethod: PaymentMethod.Cash,
        paymentAmountCents: 20000,
      });

      await api.rsvps.confirmPayment(rsvp.id, adminId);
      await api.rsvps.cancel(rsvp.id, userId);
      await api.rsvps.processRefund(rsvp.id, adminId, "Cash returned at meeting");

      const logs = await api.rsvpLogs.listByRsvp(rsvp.id);
      const refundLog = logs.find((l) => l.messageCode === RsvpLogCode.RefundProcessed);
      expect(refundLog).toBeDefined();
      expect(refundLog!.message).toBe("Cash returned at meeting");
    });
  });

  describe("linkUserAccount", () => {
    test("links a user account to an RSVP", async () => {
      const event = await createEvent(api);
      const { userId, contactId } = await createUser(ds, api);
      const { userId: targetUserId } = await createUser(ds, api);

      const rsvp = await api.rsvps.submitBadgerRegistration({
        eventId: event.id,
        registrationMethod: RegistrationMethod.Auth,
        contactId,
        userId,
        paymentMethod: PaymentMethod.Cash,
        paymentAmountCents: 20000,
        waiverContentHash: "hash",
        waiverIp: "127.0.0.1",
        waiverUserAgent: null,
        badgerDetails,
      });

      await api.rsvps.linkUserAccount(rsvp.id, targetUserId);

      const updated = await api.rsvps.findById(rsvp.id);
      expect(updated!.userId).toBe(targetUserId);

      const logs = await api.rsvpLogs.listByRsvp(rsvp.id);
      const linkLog = logs.find((l) => l.messageCode === RsvpLogCode.AccountLinked);
      expect(linkLog).toBeDefined();
    });
  });
});
