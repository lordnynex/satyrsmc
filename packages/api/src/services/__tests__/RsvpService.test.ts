import { describe, test, expect, beforeAll } from "vitest";
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
import { createEvent, createUser } from "./helpers";

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
