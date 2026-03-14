import { describe, test, expect, beforeAll, beforeEach } from "bun:test";
import type { DataSource } from "typeorm";
import { createTrpcTestHarness } from "../../test/trpcHarness";
import type { TrpcTestHarness } from "../../test/trpcHarness";
import { resetTestDb } from "../../test/setup";
import type { Api } from "../../services/api";
import { RsvpStatus, EventType, UserType } from "@satyrsmc/shared/lib/enums";
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
      await createEvent(api, { name: "Router Event", event_date: tomorrow });

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
        event_date: tomorrow,
        event_type: EventType.Badger,
      });
      await createEvent(api, { name: "Rides", event_date: tomorrow, event_type: EventType.Rides });

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

  describe("rsvp", () => {
    test("requires authentication", async () => {
      await expect(
        harness.caller.members.events.rsvp({ eventId: "fake", status: RsvpStatus.Yes }),
      ).rejects.toThrow("Authentication required");
    });

    test("creates RSVP when authenticated", async () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const ev = await createEvent(api, { name: "RSVP Event", event_date: tomorrow });

      const result = await authedHarness.caller.members.events.rsvp({
        eventId: ev.id,
        status: RsvpStatus.Yes,
      });

      expect(result.ok).toBe(true);
      expect(result.status).toBe(RsvpStatus.Yes);
    });

    test("RSVP reflected in list", async () => {
      const tomorrow = new Date(Date.now() + 86400000).toISOString();
      const ev = await createEvent(api, { name: "Reflected RSVP", event_date: tomorrow });

      await authedHarness.caller.members.events.rsvp({
        eventId: ev.id,
        status: RsvpStatus.Yes,
      });

      const list = await authedHarness.caller.members.events.list({
        upcoming: true,
        page: 1,
        per_page: 18,
      });

      const item = list.items.find((e) => e.id === ev.id);
      expect(item).toBeDefined();
      expect(item!.my_rsvp).toBe(RsvpStatus.Yes);
      expect(item!.rsvp_yes_count).toBe(1);
    });
  });
});
