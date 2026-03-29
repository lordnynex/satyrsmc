import { describe, test, expect, beforeAll, beforeEach } from "vitest";
import { setupTestDb, resetTestDb } from "../../test/setup";
import type { Api } from "../api";
import type { DataSource } from "typeorm";
import {
  AttendeeStatus,
  EventType,
  PaymentMethod,
  PaymentStatus,
  TshirtSize,
  TravelMode,
} from "@satyrsmc/shared/lib/enums";
import { createEvent } from "./helpers";

/** Insert a minimal user row directly into the database (bypasses auth flow).
 *  Returns the contactId (used by MemberEventsService after consolidation).
 */
async function createTestUserDirect(
  ds: DataSource,
  overrides: { username?: string } = {},
): Promise<{ userId: string; contactId: string }> {
  const id = crypto.randomUUID();
  const contactId = crypto.randomUUID();
  const username = overrides.username ?? `testuser-${Date.now()}`;
  // Insert a contact first (user requires contact_id FK)
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

describe("MemberEventsService", () => {
  let api: Api;
  let ds: DataSource;

  beforeAll(async () => {
    const result = await setupTestDb();
    api = result.api;
    ds = result.ds;
  });

  beforeEach(async () => {
    await resetTestDb(ds);
  });

  describe("list", () => {
    test("returns empty list when no events exist", async () => {
      const { contactId } = await createTestUserDirect(ds);
      const result = await api.memberEvents.list(contactId, {
        upcoming: true,
        page: 1,
        per_page: 18,
      });
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
    });

    test("returns events with correct shape", async () => {
      const { contactId } = await createTestUserDirect(ds);
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      await createEvent(api, {
        name: "Future Event",
        start_date: tomorrow,
        event_type: EventType.Badger,
        event_location: "Test Location",
      });

      const result = await api.memberEvents.list(contactId, {
        upcoming: true,
        page: 1,
        per_page: 18,
      });

      expect(result.items.length).toBe(1);
      const item = result.items[0]!;
      expect(item.name).toBe("Future Event");
      expect(item.event_type).toBe(EventType.Badger);
      expect(item.event_location).toBe("Test Location");
      expect(item.rsvp_yes_count).toBe(0);
      expect(item.my_rsvp).toBeNull();
    });

    test("filters by event type", async () => {
      const { contactId } = await createTestUserDirect(ds);
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      await createEvent(api, {
        name: "Badger Event",
        start_date: tomorrow,
        event_type: EventType.Badger,
      });
      await createEvent(api, {
        name: "Rides Event",
        start_date: tomorrow,
        event_type: EventType.Rides,
      });

      const result = await api.memberEvents.list(contactId, {
        event_type: EventType.Rides,
        upcoming: true,
        page: 1,
        per_page: 18,
      });

      expect(result.items.length).toBe(1);
      expect(result.items[0]!.name).toBe("Rides Event");
    });

    test("filters by search", async () => {
      const { contactId } = await createTestUserDirect(ds);
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      await createEvent(api, { name: "Alpha Event", start_date: tomorrow });
      await createEvent(api, { name: "Beta Event", start_date: tomorrow });

      const result = await api.memberEvents.list(contactId, {
        search: "Alpha",
        upcoming: true,
        page: 1,
        per_page: 18,
      });

      expect(result.items.length).toBe(1);
      expect(result.items[0]!.name).toBe("Alpha Event");
    });

    test("upcoming=false returns past events only", async () => {
      const { contactId } = await createTestUserDirect(ds);
      const yesterday = new Date(Date.now() - 86400000).toISOString();
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      await createEvent(api, { name: "Past Event", start_date: yesterday });
      await createEvent(api, { name: "Future Event", start_date: tomorrow });

      const result = await api.memberEvents.list(contactId, {
        upcoming: false,
        page: 1,
        per_page: 18,
      });

      expect(result.items.length).toBe(1);
      expect(result.items[0]!.name).toBe("Past Event");
    });

    test("paginates correctly", async () => {
      const { contactId } = await createTestUserDirect(ds);
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      for (let i = 0; i < 5; i++) {
        await createEvent(api, { name: `Event ${i}`, start_date: tomorrow });
      }

      const page1 = await api.memberEvents.list(contactId, {
        upcoming: true,
        page: 1,
        per_page: 2,
      });
      expect(page1.items.length).toBe(2);
      expect(page1.total).toBe(5);
      expect(page1.page).toBe(1);
      expect(page1.per_page).toBe(2);

      const page3 = await api.memberEvents.list(contactId, {
        upcoming: true,
        page: 3,
        per_page: 2,
      });
      expect(page3.items.length).toBe(1);
    });

    test("includes RSVP yes count", async () => {
      const { contactId: contactId1 } = await createTestUserDirect(ds, { username: "user1" });
      const { contactId: contactId2 } = await createTestUserDirect(ds, { username: "user2" });
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const ev = await createEvent(api, { name: "RSVP Event", start_date: tomorrow });

      await api.memberEvents.rsvp({
        contactId: contactId1,
        userId: "",
        eventId: ev.id,
        status: AttendeeStatus.Yes,
      });
      await api.memberEvents.rsvp({
        contactId: contactId2,
        userId: "",
        eventId: ev.id,
        status: AttendeeStatus.Yes,
      });

      const result = await api.memberEvents.list(contactId1, {
        upcoming: true,
        page: 1,
        per_page: 18,
      });

      expect(result.items[0]!.rsvp_yes_count).toBe(2);
    });

    test("includes my_rsvp for current user", async () => {
      const { contactId } = await createTestUserDirect(ds);
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const ev = await createEvent(api, { name: "My RSVP Event", start_date: tomorrow });

      await api.memberEvents.rsvp({
        contactId,
        userId: "",
        eventId: ev.id,
        status: AttendeeStatus.Yes,
      });

      const result = await api.memberEvents.list(contactId, {
        upcoming: true,
        page: 1,
        per_page: 18,
      });

      expect(result.items[0]!.my_rsvp).toBe(AttendeeStatus.Yes);
    });

    test("filters by date range", async () => {
      const { contactId } = await createTestUserDirect(ds);
      // Use dates relative to now so the upcoming filter doesn't exclude them
      const baseYear = new Date().getFullYear() + 3;
      await createEvent(api, { name: "Jul Event", start_date: `${baseYear}-07-15T00:00:00Z` });
      await createEvent(api, { name: "Sep Event", start_date: `${baseYear}-09-15T00:00:00Z` });
      await createEvent(api, { name: "Dec Event", start_date: `${baseYear}-12-15T00:00:00Z` });

      const result = await api.memberEvents.list(contactId, {
        date_from: `${baseYear}-08-01`,
        date_to: `${baseYear}-10-31`,
        upcoming: true,
        page: 1,
        per_page: 18,
      });

      expect(result.items.length).toBe(1);
      expect(result.items[0]!.name).toBe("Sep Event");
    });
  });

  describe("get", () => {
    test("returns null for non-existent event", async () => {
      const { contactId } = await createTestUserDirect(ds);
      const result = await api.memberEvents.get(contactId, "00000000-0000-0000-0000-000000000000");
      expect(result).toBeNull();
    });

    test("returns event detail with correct fields", async () => {
      const { contactId } = await createTestUserDirect(ds);
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const ev = await createEvent(api, {
        name: "Detail Event",
        start_date: tomorrow,
        event_type: EventType.Rides,
        event_location: "Test Park",
        members_only: true,
      });

      const result = await api.memberEvents.get(contactId, ev.id);
      expect(result).not.toBeNull();
      expect(result!.id).toBe(ev.id);
      expect(result!.name).toBe("Detail Event");
      expect(result!.event_type).toBe(EventType.Rides);
      expect(result!.event_location).toBe("Test Park");
      expect(result!.members_only).toBe(true);
      expect(result!.photos).toEqual([]);
      expect(result!.attendees).toEqual([]);
      expect(result!.schedule_items).toEqual([]);
      expect(result!.my_rsvp).toBeNull();
      expect(result!.rsvp_yes_count).toBe(0);
      expect(result!.host_ids).toEqual([]);
    });

    test("returns correct my_rsvp for authenticated user", async () => {
      const { contactId } = await createTestUserDirect(ds);
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const ev = await createEvent(api, { name: "RSVP Detail", start_date: tomorrow });

      await api.memberEvents.rsvp({
        contactId,
        userId: "",
        eventId: ev.id,
        status: AttendeeStatus.Yes,
      });
      const result = await api.memberEvents.get(contactId, ev.id);
      expect(result!.my_rsvp).toBe(AttendeeStatus.Yes);
    });

    test("returns correct rsvp_yes_count", async () => {
      const { contactId: c1 } = await createTestUserDirect(ds, { username: "user-a" });
      const { contactId: c2 } = await createTestUserDirect(ds, { username: "user-b" });
      const { contactId: c3 } = await createTestUserDirect(ds, { username: "user-c" });
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const ev = await createEvent(api, { name: "Count Event", start_date: tomorrow });

      await api.memberEvents.rsvp({
        contactId: c1,
        userId: "",
        eventId: ev.id,
        status: AttendeeStatus.Yes,
      });
      await api.memberEvents.rsvp({
        contactId: c2,
        userId: "",
        eventId: ev.id,
        status: AttendeeStatus.Yes,
      });
      await api.memberEvents.rsvp({
        contactId: c3,
        userId: "",
        eventId: ev.id,
        status: AttendeeStatus.No,
      });

      const result = await api.memberEvents.get(c1, ev.id);
      expect(result!.rsvp_yes_count).toBe(2);
    });

    test("only includes attendees with status=yes", async () => {
      const { contactId: c1 } = await createTestUserDirect(ds, { username: "yes-user" });
      const { contactId: c2 } = await createTestUserDirect(ds, { username: "no-user" });
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const ev = await createEvent(api, { name: "Attendee Filter", start_date: tomorrow });

      await api.memberEvents.rsvp({
        contactId: c1,
        userId: "",
        eventId: ev.id,
        status: AttendeeStatus.Yes,
      });
      await api.memberEvents.rsvp({
        contactId: c2,
        userId: "",
        eventId: ev.id,
        status: AttendeeStatus.No,
      });

      const result = await api.memberEvents.get(c1, ev.id);
      expect(result!.attendees.length).toBe(1);
      expect(result!.attendees[0]!.contact_id).toBe(c1);
    });

    test("attendees include contact_id and display_name", async () => {
      const { contactId } = await createTestUserDirect(ds, { username: "display-test" });
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const ev = await createEvent(api, { name: "Attendee Shape", start_date: tomorrow });

      await api.memberEvents.rsvp({
        contactId,
        userId: "",
        eventId: ev.id,
        status: AttendeeStatus.Yes,
      });
      const result = await api.memberEvents.get(contactId, ev.id);
      const attendee = result!.attendees[0]!;
      expect(attendee.contact_id).toBe(contactId);
      expect(attendee.display_name).toBe("display-test");
      expect(typeof attendee.is_member).toBe("boolean");
      expect(typeof attendee.sort_order).toBe("number");
    });

    test("returns schedule items ordered by sort_order", async () => {
      const { contactId } = await createTestUserDirect(ds);
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const ev = await createEvent(api, {
        name: "Schedule Event",
        start_date: tomorrow,
        event_type: EventType.Rides,
      });

      await api.events.scheduleItems.create(ev.id, {
        scheduled_time: "2026-03-15T10:00:00Z",
        label: "Second",
      });
      await api.events.scheduleItems.create(ev.id, {
        scheduled_time: "2026-03-15T08:00:00Z",
        label: "First",
      });

      const result = await api.memberEvents.get(contactId, ev.id);
      expect(result!.schedule_items.length).toBe(2);
      // sort_order is insertion order (1, 2)
      expect(result!.schedule_items[0]!.label).toBe("Second");
      expect(result!.schedule_items[1]!.label).toBe("First");
    });
  });

  describe("rsvp", () => {
    test("creates a new RSVP", async () => {
      const { contactId } = await createTestUserDirect(ds);
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const ev = await createEvent(api, { name: "RSVP Target", start_date: tomorrow });

      const result = await api.memberEvents.rsvp({
        contactId,
        userId: "",
        eventId: ev.id,
        status: AttendeeStatus.Yes,
      });
      expect(result.ok).toBe(true);
      expect(result.status).toBe(AttendeeStatus.Yes);
    });

    test("updates an existing RSVP (upsert)", async () => {
      const { contactId } = await createTestUserDirect(ds);
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const ev = await createEvent(api, { name: "Upsert RSVP", start_date: tomorrow });

      await api.memberEvents.rsvp({
        contactId,
        userId: "",
        eventId: ev.id,
        status: AttendeeStatus.Yes,
      });
      const result = await api.memberEvents.rsvp({
        contactId,
        userId: "",
        eventId: ev.id,
        status: AttendeeStatus.No,
      });
      expect(result.status).toBe(AttendeeStatus.No);

      // Verify only one row exists
      const rows = await ds.query(
        `SELECT COUNT(*)::int AS count FROM event_attendees WHERE event_id = $1 AND contact_id = $2`,
        [ev.id, contactId],
      );
      expect(rows[0].count).toBe(1);
    });

    test("pending RSVP is not counted as yes", async () => {
      const { contactId } = await createTestUserDirect(ds);
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const ev = await createEvent(api, { name: "Pending Event", start_date: tomorrow });

      await api.memberEvents.rsvp({
        contactId,
        userId: "",
        eventId: ev.id,
        status: AttendeeStatus.Pending,
      });

      const result = await api.memberEvents.list(contactId, {
        upcoming: true,
        page: 1,
        per_page: 18,
      });
      expect(result.items[0]!.rsvp_yes_count).toBe(0);
      expect(result.items[0]!.my_rsvp).toBe(AttendeeStatus.Pending);
    });

    test("paid RSVP sets registration_method and payment fields", async () => {
      const { userId, contactId } = await createTestUserDirect(ds);
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const ev = await createEvent(api, { name: "Paid Event", start_date: tomorrow });

      await api.memberEvents.rsvp({
        contactId,
        userId,
        eventId: ev.id,
        status: AttendeeStatus.Yes,
        waiverSigned: true,
        paymentMethod: PaymentMethod.Zelle,
        paymentAmountCents: 5000,
      });

      const rows = (await ds.query(
        `SELECT registration_method, payment_method, payment_status, payment_amount_cents, waiver_signed
         FROM event_attendees WHERE event_id = $1 AND contact_id = $2`,
        [ev.id, contactId],
      )) as Array<Record<string, unknown>>;
      expect(rows[0]!.registration_method).toBe("auth");
      expect(rows[0]!.payment_method).toBe(PaymentMethod.Zelle);
      expect(rows[0]!.payment_status).toBe(PaymentStatus.Pending);
      expect(rows[0]!.payment_amount_cents).toBe(5000);
      expect(rows[0]!.waiver_signed).toBe(true);
    });

    test("badger RSVP creates badger_registrations row", async () => {
      const { userId, contactId } = await createTestUserDirect(ds);
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const ev = await createEvent(api, {
        name: "Badger Event",
        start_date: tomorrow,
        event_type: EventType.Badger,
      });

      await api.memberEvents.rsvp({
        contactId,
        userId,
        eventId: ev.id,
        status: AttendeeStatus.Yes,
        waiverSigned: true,
        paymentMethod: PaymentMethod.Cash,
        paymentAmountCents: 10000,
        badgerDetails: {
          tshirtSize: TshirtSize.L,
          travelingBy: TravelMode.Motorcycle,
          club: "Test Club",
        },
      });

      const attendee = (await ds.query(
        `SELECT id, registration_method, status FROM event_attendees WHERE event_id = $1 AND contact_id = $2`,
        [ev.id, contactId],
      )) as Array<Record<string, unknown>>;
      expect(attendee[0]!.registration_method).toBe("auth");
      expect(attendee[0]!.status).toBe(AttendeeStatus.Yes);

      const badger = (await ds.query(
        `SELECT tshirt_size, traveling_by, club FROM badger_registrations WHERE rsvp_id = $1`,
        [attendee[0]!.id],
      )) as Array<Record<string, unknown>>;
      expect(badger.length).toBe(1);
      expect(badger[0]!.tshirt_size).toBe(TshirtSize.L);
      expect(badger[0]!.traveling_by).toBe(TravelMode.Motorcycle);
      expect(badger[0]!.club).toBe("Test Club");
    });

    test("cancel and re-register works (bug fix)", async () => {
      const { userId, contactId } = await createTestUserDirect(ds);
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const ev = await createEvent(api, {
        name: "Re-register",
        start_date: tomorrow,
        event_type: EventType.Badger,
      });

      // Register
      await api.memberEvents.rsvp({
        contactId,
        userId,
        eventId: ev.id,
        status: AttendeeStatus.Yes,
        waiverSigned: true,
        paymentMethod: PaymentMethod.Check,
        paymentAmountCents: 10000,
        badgerDetails: {
          tshirtSize: TshirtSize.M,
          travelingBy: TravelMode.CarTruck,
        },
      });

      // Cancel
      await api.memberEvents.rsvp({
        contactId,
        userId,
        eventId: ev.id,
        status: AttendeeStatus.No,
      });

      // Verify cancelled
      const cancelled = (await ds.query(
        `SELECT status, cancelled_at FROM event_attendees WHERE event_id = $1 AND contact_id = $2`,
        [ev.id, contactId],
      )) as Array<Record<string, unknown>>;
      expect(cancelled[0]!.status).toBe(AttendeeStatus.No);
      expect(cancelled[0]!.cancelled_at).not.toBeNull();

      // Re-register with different details
      const result = await api.memberEvents.rsvp({
        contactId,
        userId,
        eventId: ev.id,
        status: AttendeeStatus.Yes,
        waiverSigned: true,
        paymentMethod: PaymentMethod.Zelle,
        paymentAmountCents: 10000,
        badgerDetails: {
          tshirtSize: TshirtSize.XL,
          travelingBy: TravelMode.Motorcycle,
          club: "New Club",
        },
      });
      expect(result.ok).toBe(true);
      expect(result.status).toBe(AttendeeStatus.Yes);

      // Verify reactivated
      const reactivated = (await ds.query(
        `SELECT id, status, cancelled_at, payment_method FROM event_attendees WHERE event_id = $1 AND contact_id = $2`,
        [ev.id, contactId],
      )) as Array<Record<string, unknown>>;
      expect(reactivated[0]!.status).toBe(AttendeeStatus.Yes);
      expect(reactivated[0]!.cancelled_at).toBeNull();
      expect(reactivated[0]!.payment_method).toBe(PaymentMethod.Zelle);

      // Verify only one attendee row
      const count = (await ds.query(
        `SELECT COUNT(*)::int AS count FROM event_attendees WHERE event_id = $1 AND contact_id = $2`,
        [ev.id, contactId],
      )) as Array<{ count: number }>;
      expect(count[0]!.count).toBe(1);

      // Verify badger details updated
      const badger = (await ds.query(
        `SELECT tshirt_size, club FROM badger_registrations WHERE rsvp_id = $1`,
        [reactivated[0]!.id ?? cancelled[0]!.id],
      )) as Array<Record<string, unknown>>;
      expect(badger.length).toBe(1);
      expect(badger[0]!.tshirt_size).toBe(TshirtSize.XL);
      expect(badger[0]!.club).toBe("New Club");
    });

    test("cancelling a paid registration with confirmed payment requests refund", async () => {
      const { userId, contactId } = await createTestUserDirect(ds);
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const ev = await createEvent(api, { name: "Refund Event", start_date: tomorrow });

      // Register with payment
      await api.memberEvents.rsvp({
        contactId,
        userId,
        eventId: ev.id,
        status: AttendeeStatus.Yes,
        waiverSigned: true,
        paymentMethod: PaymentMethod.Cash,
        paymentAmountCents: 5000,
      });

      // Admin confirms payment directly
      await ds.query(
        `UPDATE event_attendees SET payment_status = $1 WHERE event_id = $2 AND contact_id = $3`,
        [PaymentStatus.Confirmed, ev.id, contactId],
      );

      // Cancel
      await api.memberEvents.rsvp({
        contactId,
        userId,
        eventId: ev.id,
        status: AttendeeStatus.No,
      });

      const rows = (await ds.query(
        `SELECT payment_status FROM event_attendees WHERE event_id = $1 AND contact_id = $2`,
        [ev.id, contactId],
      )) as Array<Record<string, unknown>>;
      expect(rows[0]!.payment_status).toBe(PaymentStatus.RefundRequested);
    });
  });
});
