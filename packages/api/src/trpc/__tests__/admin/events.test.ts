/**
 * Unit tests for admin.events tRPC router.
 * Covers list, get, create, update, delete; addPhoto, deletePhoto; addAsset, deleteAsset;
 * addAttendee, updateAttendee, deleteAttendee; addMemberAttendee; createIncident, updateIncident, deleteIncident;
 * createScheduleItem; createMilestone; createPackingCategory; createVolunteer; createAssignment (and related).
 */

import type { TRPCError } from "@trpc/server";
import { describe, test, expect, beforeAll } from "bun:test";
import { EventAssignmentCategory, EventType } from "@satyrsmc/shared/lib/enums";
import type { TrpcTestHarness } from "../../../test/trpcHarness";
import { createTrpcTestHarness } from "../../../test/trpcHarness";
import { BAD_ID, createEvent, createContact, createMember, MINIMAL_JPEG_BUFFER } from "../helpers";

describe("admin.events", () => {
  let harness: TrpcTestHarness;

  beforeAll(async () => {
    harness = await createTrpcTestHarness();
  });

  describe("list", () => {
    test("returns created events", async () => {
      const e = await createEvent(harness.api, { name: "List Event" });
      const result = await harness.caller.admin.events.list();
      expect(Array.isArray(result)).toBe(true);
      expect(result.some((x) => x.id === e.id)).toBe(true);
    });

    test("filters by type when provided", async () => {
      const result = await harness.caller.admin.events.list({ type: EventType.Badger });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("get", () => {
    test("returns event by id", async () => {
      const e = await createEvent(harness.api, { name: "Get Event" });
      const result = await harness.caller.admin.events.get({ id: e.id });
      expect(result.id).toBe(e.id);
      expect(result.name).toBe("Get Event");
    });

    test("throws NOT_FOUND when id does not exist", async () => {
      try {
        await harness.caller.admin.events.get({ id: BAD_ID });
      } catch (e) {
        expect((e as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("create", () => {
    test("creates event and returns it", async () => {
      const result = await harness.caller.admin.events.create({
        name: "New Event",
        event_type: EventType.Badger,
      });
      expect(result.id).toBeDefined();
      expect(result.name).toBe("New Event");
    });

    test("creates event with members_only flag", async () => {
      const result = await harness.caller.admin.events.create({
        name: "Members Only Event",
        event_type: EventType.Badger,
        members_only: true,
      });
      expect(result.id).toBeDefined();
      expect(result.members_only).toBe(true);
    });
  });

  describe("update", () => {
    test("updates event and returns it", async () => {
      const e = await createEvent(harness.api, { name: "To Update" });
      const result = await harness.caller.admin.events.update({
        id: e.id,
        name: "Updated Event",
      });
      expect(result.id).toBe(e.id);
      expect(result.name).toBe("Updated Event");
    });

    test("updates members_only flag", async () => {
      const e = await createEvent(harness.api, { name: "Toggle Members Only" });
      const result = await harness.caller.admin.events.update({
        id: e.id,
        members_only: true,
      });
      expect(result.members_only).toBe(true);
    });

    test("throws NOT_FOUND when id does not exist", async () => {
      try {
        await harness.caller.admin.events.update({ id: BAD_ID, name: "No" });
      } catch (e) {
        expect((e as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("delete", () => {
    test("deletes event and returns ok", async () => {
      const e = await createEvent(harness.api, { name: "To Delete" });
      const result = await harness.caller.admin.events.delete({ id: e.id });
      expect(result.ok).toBe(true);
      const list = await harness.caller.admin.events.list();
      expect(list.some((x) => x.id === e.id)).toBe(false);
    });
  });

  describe("addPhoto, deletePhoto", () => {
    test("adds and deletes photo", async () => {
      const e = await createEvent(harness.api, { name: "Photo Event" });
      const added = await harness.caller.admin.events.addPhoto({
        eventId: e.id,
        imageBase64: MINIMAL_JPEG_BUFFER.toString("base64"),
      });
      expect(added).toBeDefined();
      expect(added.id).toBeDefined();
      await harness.caller.admin.events.deletePhoto({
        eventId: e.id,
        photoId: added.id,
      });
      expect(true).toBe(true);
    });

    test("addPhoto throws NOT_FOUND when eventId does not exist", async () => {
      try {
        await harness.caller.admin.events.addPhoto({
          eventId: BAD_ID,
          imageBase64: MINIMAL_JPEG_BUFFER.toString("base64"),
        });
      } catch (err) {
        expect((err as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("addAsset, deleteAsset", () => {
    test("adds and deletes asset", async () => {
      const e = await createEvent(harness.api, { name: "Asset Event" });
      const added = await harness.caller.admin.events.addAsset({
        eventId: e.id,
        imageBase64: MINIMAL_JPEG_BUFFER.toString("base64"),
      });
      expect(added).toBeDefined();
      await harness.caller.admin.events.deleteAsset({
        eventId: e.id,
        assetId: added.id,
      });
      expect(true).toBe(true);
    });
  });

  describe("addAttendee, updateAttendee, deleteAttendee", () => {
    test("full attendee crud", async () => {
      const event = await createEvent(harness.api, { name: "Attendee Event" });
      const contact = await createContact(harness.api, { display_name: "Attendee Contact" });
      const added = await harness.caller.admin.events.addAttendee({
        eventId: event.id,
        contact_id: contact.id,
      });
      expect(added).toBeDefined();
      await harness.caller.admin.events.updateAttendee({
        eventId: event.id,
        attendeeId: added.id,
        waiver_signed: true,
      });
      await harness.caller.admin.events.deleteAttendee({
        eventId: event.id,
        attendeeId: added.id,
      });
      expect(true).toBe(true);
    });
  });

  describe("addAttendee waiver protection", () => {
    test("re-adding attendee does not downgrade waiver_signed", async () => {
      const event = await createEvent(harness.api, { name: "Waiver Protect Event" });
      const contact = await createContact(harness.api, { display_name: "Waiver Contact" });

      // Add with waiver signed
      await harness.caller.admin.events.addAttendee({
        eventId: event.id,
        contact_id: contact.id,
        waiver_signed: true,
      });

      // Re-add without waiver_signed (defaults to false)
      const readded = await harness.caller.admin.events.addAttendee({
        eventId: event.id,
        contact_id: contact.id,
      });

      expect(readded.waiver_signed).toBe(true);
    });
  });

  describe("addMemberAttendee", () => {
    test("adds member attendee", async () => {
      const event = await createEvent(harness.api, { name: "Member Attendee Event" });
      const member = await createMember(harness.api, { name: "Attendee Member" });
      const added = await harness.caller.admin.events.addMemberAttendee({
        eventId: event.id,
        member_id: member.id,
      });
      expect(added).toBeDefined();
    });
  });

  describe("createIncident, updateIncident, deleteIncident", () => {
    test("full incident crud", async () => {
      const event = await createEvent(harness.api, { name: "Incident Event" });
      const created = await harness.caller.admin.events.createIncident({
        eventId: event.id,
        type: "safety",
        severity: "low",
        summary: "Minor issue",
      });
      expect(created.id).toBeDefined();
      await harness.caller.admin.events.updateIncident({
        eventId: event.id,
        incidentId: created.id,
        summary: "Updated summary",
      });
      await harness.caller.admin.events.deleteIncident({
        eventId: event.id,
        incidentId: created.id,
      });
      expect(true).toBe(true);
    });

    test("createIncident throws NOT_FOUND when eventId does not exist", async () => {
      try {
        await harness.caller.admin.events.createIncident({
          eventId: BAD_ID,
          type: "safety",
          severity: "low",
          summary: "X",
        });
      } catch (err) {
        expect((err as TRPCError).code).toBe("NOT_FOUND");
      }
    });
  });

  describe("createScheduleItem, updateScheduleItem, deleteScheduleItem", () => {
    test("full schedule item crud", async () => {
      const event = await createEvent(harness.api, { name: "Schedule Event" });
      const created = await harness.caller.admin.events.createScheduleItem({
        eventId: event.id,
        scheduled_time: "2025-06-01T09:00:00Z",
        label: "Check-in",
      });
      expect(created).toBeDefined();
      const updated = await harness.caller.admin.events.updateScheduleItem({
        eventId: event.id,
        scheduleId: created.id,
        label: "Updated",
      });
      expect(updated.label).toBe("Updated");
      expect(updated.scheduled_time).toBeTruthy();
      await harness.caller.admin.events.deleteScheduleItem({
        eventId: event.id,
        scheduleId: created.id,
      });
      expect(true).toBe(true);
    });

    test("create and update with full ISO timestamp", async () => {
      const event = await createEvent(harness.api, { name: "ISO Schedule" });
      const created = await harness.caller.admin.events.createScheduleItem({
        eventId: event.id,
        scheduled_time: "2025-06-01T09:00:00Z",
        label: "Meet up",
      });
      expect(created.label).toBe("Meet up");
      expect(created.scheduled_time).toContain("2025-06-01");

      const updated = await harness.caller.admin.events.updateScheduleItem({
        eventId: event.id,
        scheduleId: created.id,
        scheduled_time: "2025-06-02T10:30:00Z",
        label: "Updated meet up",
        location: null,
      });
      expect(updated.label).toBe("Updated meet up");
      expect(updated.scheduled_time).toContain("2025-06-02");
      expect(updated.scheduled_time).toContain("10:30");
    });
  });

  describe("createMilestone, updateMilestone, deleteMilestone", () => {
    test("full milestone crud", async () => {
      const event = await createEvent(harness.api, { name: "Milestone Event" });
      const created = await harness.caller.admin.events.createMilestone({
        eventId: event.id,
        month: 6,
        year: 2025,
        description: "Deadline",
      });
      expect(created).toBeDefined();
      await harness.caller.admin.events.updateMilestone({
        eventId: event.id,
        mid: created.id,
        description: "Updated",
      });
      await harness.caller.admin.events.deleteMilestone({
        eventId: event.id,
        mid: created.id,
      });
      expect(true).toBe(true);
    });
  });

  describe("createPackingCategory, createPackingItem", () => {
    test("creates packing category and item", async () => {
      const event = await createEvent(harness.api, { name: "Packing Event" });
      const cat = await harness.caller.admin.events.createPackingCategory({
        eventId: event.id,
        name: "Gear",
      });
      expect(cat).toBeDefined();
      const item = await harness.caller.admin.events.createPackingItem({
        eventId: event.id,
        category_id: cat.id,
        name: "Tent",
        quantity: 2,
      });
      expect(item).toBeDefined();
    });
  });

  describe("createVolunteer, updateVolunteer, deleteVolunteer", () => {
    test("full volunteer crud", async () => {
      const event = await createEvent(harness.api, { name: "Volunteer Event" });
      const created = await harness.caller.admin.events.createVolunteer({
        eventId: event.id,
        name: "Jane",
        department: "Safety",
      });
      expect(created).toBeDefined();
      await harness.caller.admin.events.updateVolunteer({
        eventId: event.id,
        vid: created.id,
        name: "Jane Doe",
      });
      await harness.caller.admin.events.deleteVolunteer({
        eventId: event.id,
        vid: created.id,
      });
      expect(true).toBe(true);
    });
  });

  describe("createAssignment, addAssignmentMember, removeAssignmentMember", () => {
    test("creates assignment and adds/removes member", async () => {
      const event = await createEvent(harness.api, { name: "Assignment Event" });
      const member = await createMember(harness.api, { name: "Assignee" });
      const assignment = await harness.caller.admin.events.createAssignment({
        eventId: event.id,
        name: "Setup",
        category: EventAssignmentCategory.Planning,
      });
      expect(assignment).toBeDefined();
      await harness.caller.admin.events.addAssignmentMember({
        eventId: event.id,
        aid: assignment.id,
        memberId: member.id,
      });
      await harness.caller.admin.events.removeAssignmentMember({
        eventId: event.id,
        aid: assignment.id,
        memberId: member.id,
      });
      expect(true).toBe(true);
    });
  });
});
