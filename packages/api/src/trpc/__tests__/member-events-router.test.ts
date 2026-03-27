import { describe, test, expect, beforeAll, beforeEach } from "bun:test";
import type { DataSource } from "typeorm";
import { createTrpcTestHarness } from "../../test/trpcHarness";
import type { TrpcTestHarness } from "../../test/trpcHarness";
import { resetTestDb } from "../../test/setup";
import type { Api } from "../../services/api";
import {
  AttendeeStatus,
  EventType,
  UserType,
  PaymentMethod,
  TshirtSize,
  TravelMode,
} from "@satyrsmc/shared/lib/enums";
import { createEvent } from "../../services/__tests__/helpers";

async function createTestUserDirect(
  ds: DataSource,
  overrides: { username?: string } = {},
): Promise<{ userId: string; contactId: string }> {
  const id = crypto.randomUUID();
  const contactId = crypto.randomUUID();
  const username = overrides.username ?? `testuser-${Date.now()}`;
  await ds.query(
    `INSERT INTO contacts (id, display_name, type, status) VALUES ($1, $2, 'person', 'active')`,
    [contactId, username],
  );
  await ds.query(
    `INSERT INTO users (id, contact_id, username, password_hash, user_type, user_status)
     VALUES ($1, $2, $3, 'fakehash', 'user', 'active')`,
    [id, contactId, username],
  );
  return { userId: id, contactId };
}

describe("members.events tRPC router", () => {
  let harness: TrpcTestHarness;
  let authedHarness: TrpcTestHarness;
  let ds: DataSource;
  let api: Api;
  let userId: string;
  let contactId: string;

  beforeAll(async () => {
    // Unauthenticated harness
    harness = await createTrpcTestHarness();
    ds = harness.ds;
    api = harness.api;
  });

  beforeEach(async () => {
    await resetTestDb(ds);
    const user = await createTestUserDirect(ds);
    userId = user.userId;
    contactId = user.contactId;
    // Create an authenticated harness with this user's session
    const { t } = await import("../../trpc/trpc");
    const { appRouter } = await import("../../trpc/root");
    const createCaller = t.createCallerFactory(appRouter);
    authedHarness = {
      ...harness,
      caller: createCaller({
        req: new Request("http://test"),
        resHeaders: new Headers(),
        api,
        session: {
          userId,
          userType: UserType.User,
          memberId: null,
          contactId,
        },
      }),
    };
  });

  describe("list", () => {
    test("requires authentication", async () => {
      await expect(
        harness.caller.members.events.list({ upcoming: true, page: 1, per_page: 18 }),
      ).rejects.toThrow("Authentication required");
    });

    test("returns events when authenticated", async () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      await createEvent(api, { name: "Router Event", start_date: tomorrow });

      const result = await authedHarness.caller.members.events.list({
        upcoming: true,
        page: 1,
        per_page: 18,
      });

      expect(result.items.length).toBe(1);
      expect(result.items[0]!.name).toBe("Router Event");
      expect(result.total).toBe(1);
    });

    test("filters by event type", async () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      await createEvent(api, {
        name: "Badger",
        start_date: tomorrow,
        event_type: EventType.Badger,
      });
      await createEvent(api, { name: "Rides", start_date: tomorrow, event_type: EventType.Rides });

      const result = await authedHarness.caller.members.events.list({
        event_type: EventType.Rides,
        upcoming: true,
        page: 1,
        per_page: 18,
      });

      expect(result.items.length).toBe(1);
      expect(result.items[0]!.event_type).toBe(EventType.Rides);
    });
  });

  describe("get", () => {
    test("requires authentication", async () => {
      await expect(harness.caller.members.events.get({ id: "fake" })).rejects.toThrow(
        "Authentication required",
      );
    });

    test("returns event detail when authenticated", async () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const ev = await createEvent(api, {
        name: "Get Detail",
        start_date: tomorrow,
        event_type: EventType.Badger,
      });

      const result = await authedHarness.caller.members.events.get({ id: ev.id });
      expect(result.id).toBe(ev.id);
      expect(result.name).toBe("Get Detail");
      expect(result.event_type).toBe(EventType.Badger);
      expect(result.attendees).toEqual([]);
      expect(result.photos).toEqual([]);
      expect(result.schedule_items).toEqual([]);
    });

    test("throws NOT_FOUND for non-existent event", async () => {
      await expect(
        authedHarness.caller.members.events.get({ id: "00000000-0000-0000-0000-000000000000" }),
      ).rejects.toThrow();
    });

    test("includes my_rsvp from authenticated user", async () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const ev = await createEvent(api, { name: "Get RSVP", start_date: tomorrow });

      await authedHarness.caller.members.events.rsvp({
        eventId: ev.id,
        status: AttendeeStatus.Yes,
        waiver_signed: true,
      });

      const result = await authedHarness.caller.members.events.get({ id: ev.id });
      expect(result.my_rsvp).toBe(AttendeeStatus.Yes);
      expect(result.rsvp_yes_count).toBe(1);
    });
  });

  describe("rsvp", () => {
    test("requires authentication", async () => {
      await expect(
        harness.caller.members.events.rsvp({ eventId: "fake", status: AttendeeStatus.Yes }),
      ).rejects.toThrow("Authentication required");
    });

    test("creates RSVP when authenticated", async () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const ev = await createEvent(api, { name: "RSVP Event", start_date: tomorrow });

      const result = await authedHarness.caller.members.events.rsvp({
        eventId: ev.id,
        status: AttendeeStatus.Yes,
        waiver_signed: true,
      });

      expect(result.ok).toBe(true);
      expect(result.status).toBe(AttendeeStatus.Yes);
    });

    test("waiver_signed persisted when RSVPing yes", async () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const ev = await createEvent(api, { name: "Waiver Event", start_date: tomorrow });

      await authedHarness.caller.members.events.rsvp({
        eventId: ev.id,
        status: AttendeeStatus.Yes,
        waiver_signed: true,
      });

      const rows = (await ds.query(
        `SELECT waiver_signed FROM event_attendees WHERE event_id = $1 AND contact_id = $2`,
        [ev.id, contactId],
      )) as Array<{ waiver_signed: boolean }>;
      expect(rows[0]!.waiver_signed).toBe(true);
    });

    test("waiver_signed not downgraded on subsequent RSVP", async () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const ev = await createEvent(api, { name: "Waiver Keep Event", start_date: tomorrow });

      // First RSVP yes with waiver
      await authedHarness.caller.members.events.rsvp({
        eventId: ev.id,
        status: AttendeeStatus.Yes,
        waiver_signed: true,
      });

      // Change to No without waiver
      await authedHarness.caller.members.events.rsvp({
        eventId: ev.id,
        status: AttendeeStatus.No,
      });

      const rows = (await ds.query(
        `SELECT waiver_signed, status FROM event_attendees WHERE event_id = $1 AND contact_id = $2`,
        [ev.id, contactId],
      )) as Array<{ waiver_signed: boolean; status: string }>;
      expect(rows[0]!.status).toBe(AttendeeStatus.No);
      expect(rows[0]!.waiver_signed).toBe(true);
    });

    test("RSVP reflected in list", async () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const ev = await createEvent(api, { name: "Reflected RSVP", start_date: tomorrow });

      await authedHarness.caller.members.events.rsvp({
        eventId: ev.id,
        status: AttendeeStatus.Yes,
        waiver_signed: true,
      });

      const list = await authedHarness.caller.members.events.list({
        upcoming: true,
        page: 1,
        per_page: 18,
      });

      const item = list.items.find((e) => e.id === ev.id);
      expect(item).toBeDefined();
      expect(item!.my_rsvp).toBe(AttendeeStatus.Yes);
      expect(item!.rsvp_yes_count).toBe(1);
    });

    test("cancel and re-register badger event succeeds", async () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const ev = await createEvent(api, {
        name: "Badger Re-register",
        start_date: tomorrow,
        event_type: EventType.Badger,
        ga_ticket_cost: 100,
      });

      // Register
      await authedHarness.caller.members.events.rsvp({
        eventId: ev.id,
        status: AttendeeStatus.Yes,
        waiver_signed: true,
        paymentMethod: PaymentMethod.Check,
        badgerDetails: {
          tshirtSize: TshirtSize.M,
          travelingBy: TravelMode.Motorcycle,
        },
      });

      // Cancel
      await authedHarness.caller.members.events.rsvp({
        eventId: ev.id,
        status: AttendeeStatus.No,
      });

      // Re-register — should NOT throw "already registered"
      const result = await authedHarness.caller.members.events.rsvp({
        eventId: ev.id,
        status: AttendeeStatus.Yes,
        waiver_signed: true,
        paymentMethod: PaymentMethod.Zelle,
        badgerDetails: {
          tshirtSize: TshirtSize.XL,
          travelingBy: TravelMode.CarTruck,
          club: "New Club",
        },
      });
      expect(result.ok).toBe(true);
      expect(result.status).toBe(AttendeeStatus.Yes);

      // Verify status is reflected
      const detail = await authedHarness.caller.members.events.get({ id: ev.id });
      expect(detail.my_rsvp).toBe(AttendeeStatus.Yes);
    });
  });
});
