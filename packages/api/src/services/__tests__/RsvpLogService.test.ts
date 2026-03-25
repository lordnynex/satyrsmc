import { describe, test, expect, beforeAll } from "bun:test";
import type { DataSource } from "typeorm";
import { setupTestDb } from "../../test/setup";
import type { Api } from "../api";
import {
  RsvpLogCode,
  RegistrationMethod,
  PaymentMethod,
  TshirtSize,
  TravelMode,
} from "@satyrsmc/shared/lib/enums";
import { createEvent, createUser } from "./helpers";

describe("RsvpLogService", () => {
  let api: Api;
  let ds: DataSource;

  beforeAll(async () => {
    const result = await setupTestDb();
    api = result.api;
    ds = result.ds;
  });

  async function createTestRsvp(eventId: string): Promise<string> {
    const { userId, contactId } = await createUser(ds, api);
    const rsvp = await api.rsvps.submitBadgerRegistration({
      eventId,
      registrationMethod: RegistrationMethod.Auth,
      contactId,
      userId,
      paymentMethod: PaymentMethod.Cash,
      paymentAmountCents: 20000,
      waiverContentHash: "hash123",
      waiverIp: "127.0.0.1",
      waiverUserAgent: "test",
      badgerDetails: { tshirtSize: TshirtSize.L, travelingBy: TravelMode.Motorcycle },
    });
    return rsvp.id;
  }

  describe("create", () => {
    test("creates a log entry with all fields", async () => {
      const event = await createEvent(api);
      const rsvpId = await createTestRsvp(event.id);
      const { userId } = await createUser(ds, api);

      const log = await api.rsvpLogs.create(
        rsvpId,
        RsvpLogCode.PaymentConfirmed,
        userId,
        "Zelle received",
      );

      expect(log.id).toBeDefined();
      expect(log.rsvpId).toBe(rsvpId);
      expect(log.messageCode).toBe(RsvpLogCode.PaymentConfirmed);
      expect(log.message).toBe("Zelle received");
      expect(log.createdAt).toBeDefined();
    });

    test("creates a log entry with null loggedBy (system action)", async () => {
      const event = await createEvent(api);
      const rsvpId = await createTestRsvp(event.id);

      const log = await api.rsvpLogs.create(rsvpId, RsvpLogCode.Registered, null);
      expect(log.loggedBy).toBeNull();
      expect(log.message).toBeNull();
    });
  });

  describe("listByRsvp", () => {
    test("returns entries ordered by created_at ASC", async () => {
      const event = await createEvent(api);
      const rsvpId = await createTestRsvp(event.id);

      await api.rsvpLogs.create(rsvpId, RsvpLogCode.StatusChanged, null, "First");
      await api.rsvpLogs.create(rsvpId, RsvpLogCode.PaymentConfirmed, null, "Second");

      const logs = await api.rsvpLogs.listByRsvp(rsvpId);
      // Should have at least 3 entries: 1 from registration + 2 created above
      expect(logs.length).toBeGreaterThanOrEqual(3);
      const dates = logs.map((l) => new Date(l.createdAt).getTime());
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1]).toBeLessThanOrEqual(dates[i]!);
      }
    });

    test("returns empty for non-existent rsvpId", async () => {
      const logs = await api.rsvpLogs.listByRsvp(crypto.randomUUID());
      expect(logs).toEqual([]);
    });
  });
});
