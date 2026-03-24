import { describe, test, expect, beforeAll } from "bun:test";
import type { DataSource } from "typeorm";
import { setupTestDb } from "../../test/setup";
import type { Api } from "../api";
import {
  EventRsvpStatus,
  RegistrationMethod,
  PaymentMethod,
  PaymentStatus,
  TshirtSize,
  TravelMode,
  RsvpLogCode,
} from "@satyrsmc/shared/lib/enums";
import { createEvent, createContact, createUser } from "./helpers";

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
    test("creates a token-based (public) registration with submission", async () => {
      const event = await createEvent(api);

      const rsvp = await api.rsvps.submitBadgerRegistration({
        eventId: event.id,
        registrationMethod: RegistrationMethod.EventToken,
        contactId: null,
        userId: null,
        paymentMethod: PaymentMethod.Zelle,
        paymentAmountCents: 20000,
        waiverContentHash: "abc123",
        waiverIp: "127.0.0.1",
        waiverUserAgent: "Mozilla/5.0",
        badgerDetails,
        submission: submissionData,
      });

      expect(rsvp.id).toBeDefined();
      expect(rsvp.contactId).toBeNull();
      expect(rsvp.status).toBe(EventRsvpStatus.PendingReview);
      expect(rsvp.registrationMethod).toBe(RegistrationMethod.EventToken);
      expect(rsvp.paymentMethod).toBe(PaymentMethod.Zelle);
      expect(rsvp.paymentStatus).toBe(PaymentStatus.Pending);
      expect(rsvp.displayName).toBe("Craig Thompson");
    });

    test("creates an authenticated registration (no submission)", async () => {
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
      expect(rsvp.status).toBe(EventRsvpStatus.Registered);
      expect(rsvp.registrationMethod).toBe(RegistrationMethod.Auth);
    });

    test("creates log entry on registration", async () => {
      const event = await createEvent(api);
      const rsvp = await api.rsvps.submitBadgerRegistration({
        eventId: event.id,
        registrationMethod: RegistrationMethod.EventToken,
        contactId: null,
        userId: null,
        paymentMethod: PaymentMethod.Check,
        paymentAmountCents: 20000,
        waiverContentHash: "hash",
        waiverIp: "127.0.0.1",
        waiverUserAgent: null,
        badgerDetails,
        submission: submissionData,
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

      expect(rsvp.status).toBe(EventRsvpStatus.Registered);
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

      // Create a token-based RSVP (pending review)
      await api.rsvps.submitBadgerRegistration({
        eventId: event.id,
        registrationMethod: RegistrationMethod.EventToken,
        contactId: null,
        userId: null,
        paymentMethod: PaymentMethod.Cash,
        paymentAmountCents: 20000,
        waiverContentHash: "hash",
        waiverIp: "127.0.0.1",
        waiverUserAgent: null,
        badgerDetails,
        submission: submissionData,
      });

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
      expect(pending[0]!.status).toBe(EventRsvpStatus.PendingReview);
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

      const rsvp = await api.rsvps.submitBadgerRegistration({
        eventId: event.id,
        registrationMethod: RegistrationMethod.EventToken,
        contactId: null,
        userId: null,
        paymentMethod: PaymentMethod.Cash,
        paymentAmountCents: 20000,
        waiverContentHash: "hash",
        waiverIp: "127.0.0.1",
        waiverUserAgent: null,
        badgerDetails,
        submission: submissionData,
      });

      await api.rsvps.matchToContact(rsvp.id, contact.id, adminId);

      const updated = await api.rsvps.findById(rsvp.id);
      expect(updated!.contactId).toBe(contact.id);
      expect(updated!.status).toBe(EventRsvpStatus.Registered);

      // Submission should be deleted
      const adminView = await api.rsvps.findByEventAdmin(event.id);
      const matched = adminView.find((r) => r.id === rsvp.id);
      expect(matched!.submission).toBeNull();

      // Log entry should exist
      const logs = await api.rsvpLogs.listByRsvp(rsvp.id);
      const matchLog = logs.find((l) => l.messageCode === RsvpLogCode.MatchedToContact);
      expect(matchLog).toBeDefined();
    });
  });

  describe("confirmAsNewContact", () => {
    test("creates a new contact from submission data", async () => {
      const event = await createEvent(api);
      const { userId: adminId } = await createUser(ds, api);

      const rsvp = await api.rsvps.submitBadgerRegistration({
        eventId: event.id,
        registrationMethod: RegistrationMethod.EventToken,
        contactId: null,
        userId: null,
        paymentMethod: PaymentMethod.Zelle,
        paymentAmountCents: 20000,
        waiverContentHash: "hash",
        waiverIp: "127.0.0.1",
        waiverUserAgent: null,
        badgerDetails,
        submission: submissionData,
      });

      const contactId = await api.rsvps.confirmAsNewContact(rsvp.id, adminId);
      expect(contactId).toBeDefined();

      // RSVP should be linked
      const updated = await api.rsvps.findById(rsvp.id);
      expect(updated!.contactId).toBe(contactId);
      expect(updated!.status).toBe(EventRsvpStatus.Registered);

      // Log entry
      const logs = await api.rsvpLogs.listByRsvp(rsvp.id);
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
      expect(updated!.status).toBe(EventRsvpStatus.Cancelled);
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
      expect(updated!.status).toBe(EventRsvpStatus.Cancelled);
    });
  });

  describe("confirmPayment", () => {
    test("confirms payment and updates status to confirmed", async () => {
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
      expect(updated!.status).toBe(EventRsvpStatus.Confirmed);

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
      expect(updated1!.status).toBe(EventRsvpStatus.Confirmed);
      expect(updated2!.status).toBe(EventRsvpStatus.Confirmed);
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
      const { userId } = await createUser(ds, api);

      const rsvp = await api.rsvps.submitBadgerRegistration({
        eventId: event.id,
        registrationMethod: RegistrationMethod.EventToken,
        contactId: null,
        userId: null,
        paymentMethod: PaymentMethod.Cash,
        paymentAmountCents: 20000,
        waiverContentHash: "hash",
        waiverIp: "127.0.0.1",
        waiverUserAgent: null,
        badgerDetails,
        submission: submissionData,
      });

      await api.rsvps.linkUserAccount(rsvp.id, userId);

      const updated = await api.rsvps.findById(rsvp.id);
      expect(updated!.userId).toBe(userId);

      const logs = await api.rsvpLogs.listByRsvp(rsvp.id);
      const linkLog = logs.find((l) => l.messageCode === RsvpLogCode.AccountLinked);
      expect(linkLog).toBeDefined();
    });
  });
});
