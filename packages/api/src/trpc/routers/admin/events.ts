import { z } from "zod";
import { t } from "../../trpc";
import { TRPCError } from "@trpc/server";

const eventType = z.enum(["badger", "anniversary", "pioneer_run", "rides"]);

const incidentCreateInput = z.object({
  eventId: z.string(),
  type: z.string(),
  severity: z.string(),
  summary: z.string(),
  details: z.string().optional(),
  occurred_at: z.string().optional(),
  contact_id: z.string().optional(),
  member_id: z.string().optional(),
});

const incidentUpdateInput = z.object({
  eventId: z.string(),
  incidentId: z.string(),
  type: z.string().optional(),
  severity: z.string().optional(),
  summary: z.string().optional(),
  details: z.string().optional(),
  occurred_at: z.string().nullable().optional(),
  contact_id: z.string().nullable().optional(),
  member_id: z.string().nullable().optional(),
});

export const eventsRouter = t.router({
  list: t.procedure
    .input(z.object({ type: eventType.optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.api.events.list(input?.type);
    }),

  get: t.procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const event = await ctx.api.events.get(input.id);
      if (!event) throw new TRPCError({ code: "NOT_FOUND" });
      return event;
    }),

  create: t.procedure
    .input(
      z.object({
        name: z.string(),
        event_type: eventType.optional(),
        description: z.string().optional(),
        year: z.number().optional(),
        event_date: z.string().optional(),
        event_url: z.string().optional(),
        event_location: z.string().optional(),
        event_location_embed: z.string().optional(),
        ga_ticket_cost: z.number().optional(),
        day_pass_cost: z.number().optional(),
        ga_tickets_sold: z.number().optional(),
        day_passes_sold: z.number().optional(),
        budget_id: z.string().optional(),
        scenario_id: z.string().optional(),
        planning_notes: z.string().optional(),
        start_location: z.string().optional(),
        end_location: z.string().optional(),
        facebook_event_url: z.string().optional(),
        pre_ride_event_id: z.string().optional(),
        ride_cost: z.number().optional(),
        show_on_website: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.api.events.create(input);
    }),

  update: t.procedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        event_type: eventType.nullable().optional(),
        description: z.string().nullable().optional(),
        year: z.number().nullable().optional(),
        event_date: z.string().nullable().optional(),
        event_url: z.string().nullable().optional(),
        event_location: z.string().nullable().optional(),
        event_location_embed: z.string().nullable().optional(),
        ga_ticket_cost: z.number().nullable().optional(),
        day_pass_cost: z.number().nullable().optional(),
        ga_tickets_sold: z.number().nullable().optional(),
        day_passes_sold: z.number().nullable().optional(),
        budget_id: z.string().nullable().optional(),
        scenario_id: z.string().nullable().optional(),
        planning_notes: z.string().nullable().optional(),
        show_on_website: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...body } = input;
      const out = await ctx.api.events.update(id, body);
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),

  delete: t.procedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.api.events.delete(input.id);
      return { ok: true };
    }),

  // Photos (image as base64 for JSON transport)
  addPhoto: t.procedure
    .input(z.object({ eventId: z.string(), imageBase64: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.imageBase64, "base64");
      const out = await ctx.api.events.addPhoto(input.eventId, buffer);
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),
  deletePhoto: t.procedure
    .input(z.object({ eventId: z.string(), photoId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.api.events.deletePhoto(input.eventId, input.photoId);
      return { ok: true };
    }),

  // Assets
  addAsset: t.procedure
    .input(z.object({ eventId: z.string(), imageBase64: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.imageBase64, "base64");
      const out = await ctx.api.events.addAsset(input.eventId, buffer);
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),
  deleteAsset: t.procedure
    .input(z.object({ eventId: z.string(), assetId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.api.events.deleteAsset(input.eventId, input.assetId);
      return { ok: true };
    }),

  // Attendees
  addAttendee: t.procedure
    .input(
      z.object({
        eventId: z.string(),
        contact_id: z.string(),
        waiver_signed: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const out = await ctx.api.events.attendees.add(input.eventId, {
        contact_id: input.contact_id,
        waiver_signed: input.waiver_signed,
      });
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),
  updateAttendee: t.procedure
    .input(
      z.object({
        eventId: z.string(),
        attendeeId: z.string(),
        waiver_signed: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const out = await ctx.api.events.attendees.update(input.eventId, input.attendeeId, {
        waiver_signed: input.waiver_signed,
      });
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),
  deleteAttendee: t.procedure
    .input(z.object({ eventId: z.string(), attendeeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.api.events.attendees.delete(input.eventId, input.attendeeId);
      return { ok: true };
    }),

  // Member attendees
  addMemberAttendee: t.procedure
    .input(
      z.object({
        eventId: z.string(),
        member_id: z.string(),
        waiver_signed: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const out = await ctx.api.events.memberAttendees.add(input.eventId, {
        member_id: input.member_id,
        waiver_signed: input.waiver_signed,
      });
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),
  updateMemberAttendee: t.procedure
    .input(
      z.object({
        eventId: z.string(),
        memberAttendeeId: z.string(),
        waiver_signed: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const out = await ctx.api.events.memberAttendees.update(
        input.eventId,
        input.memberAttendeeId,
        { waiver_signed: input.waiver_signed }
      );
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),
  deleteMemberAttendee: t.procedure
    .input(z.object({ eventId: z.string(), memberAttendeeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.api.events.memberAttendees.delete(input.eventId, input.memberAttendeeId);
      return { ok: true };
    }),

  // Incidents
  createIncident: t.procedure
    .input(incidentCreateInput)
    .mutation(async ({ ctx, input }) => {
      const { eventId, ...body } = input;
      const out = await ctx.api.events.incidents.create(eventId, body);
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),
  updateIncident: t.procedure
    .input(incidentUpdateInput)
    .mutation(async ({ ctx, input }) => {
      const { eventId, incidentId, ...body } = input;
      const out = await ctx.api.events.incidents.update(eventId, incidentId, body);
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),
  deleteIncident: t.procedure
    .input(z.object({ eventId: z.string(), incidentId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.api.events.incidents.delete(input.eventId, input.incidentId);
      return { ok: true };
    }),

  // Schedule items
  createScheduleItem: t.procedure
    .input(
      z.object({
        eventId: z.string(),
        scheduled_time: z.string(),
        label: z.string(),
        location: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const out = await ctx.api.events.scheduleItems.create(input.eventId, {
        scheduled_time: input.scheduled_time,
        label: input.label,
        location: input.location,
      });
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),
  updateScheduleItem: t.procedure
    .input(
      z.object({
        eventId: z.string(),
        scheduleId: z.string(),
        scheduled_time: z.string().optional(),
        label: z.string().optional(),
        location: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { eventId, scheduleId, ...body } = input;
      const out = await ctx.api.events.scheduleItems.update(eventId, scheduleId, body);
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),
  deleteScheduleItem: t.procedure
    .input(z.object({ eventId: z.string(), scheduleId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.api.events.scheduleItems.delete(input.eventId, input.scheduleId);
      return { ok: true };
    }),

  // Milestones
  createMilestone: t.procedure
    .input(
      z.object({
        eventId: z.string(),
        month: z.number(),
        year: z.number(),
        description: z.string(),
        due_date: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const out = await ctx.api.events.milestones.create(input.eventId, {
        month: input.month,
        year: input.year,
        description: input.description,
        due_date: input.due_date,
      });
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),
  updateMilestone: t.procedure
    .input(
      z.object({
        eventId: z.string(),
        mid: z.string(),
        month: z.number().optional(),
        year: z.number().optional(),
        description: z.string().optional(),
        completed: z.boolean().optional(),
        due_date: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { eventId, mid, ...body } = input;
      const out = await ctx.api.events.milestones.update(eventId, mid, body);
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),
  deleteMilestone: t.procedure
    .input(z.object({ eventId: z.string(), mid: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.api.events.milestones.delete(input.eventId, input.mid);
      return { ok: true };
    }),
  addMilestoneMember: t.procedure
    .input(z.object({ eventId: z.string(), mid: z.string(), memberId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const out = await ctx.api.events.milestones.addMember(
        input.eventId,
        input.mid,
        input.memberId
      );
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),
  removeMilestoneMember: t.procedure
    .input(z.object({ eventId: z.string(), mid: z.string(), memberId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.api.events.milestones.removeMember(
        input.eventId,
        input.mid,
        input.memberId
      );
      return { ok: true };
    }),

  // Packing categories
  createPackingCategory: t.procedure
    .input(z.object({ eventId: z.string(), name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const out = await ctx.api.events.packingCategories.create(input.eventId, {
        name: input.name,
      });
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),
  updatePackingCategory: t.procedure
    .input(
      z.object({ eventId: z.string(), cid: z.string(), name: z.string().optional() })
    )
    .mutation(async ({ ctx, input }) => {
      const out = await ctx.api.events.packingCategories.update(
        input.eventId,
        input.cid,
        { name: input.name }
      );
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),
  deletePackingCategory: t.procedure
    .input(z.object({ eventId: z.string(), cid: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.api.events.packingCategories.delete(input.eventId, input.cid);
      return { ok: true };
    }),

  // Packing items
  createPackingItem: t.procedure
    .input(
      z.object({
        eventId: z.string(),
        category_id: z.string(),
        name: z.string(),
        quantity: z.number().optional(),
        note: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const out = await ctx.api.events.packingItems.create(input.eventId, {
        category_id: input.category_id,
        name: input.name,
        quantity: input.quantity,
        note: input.note,
      });
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),
  updatePackingItem: t.procedure
    .input(
      z.object({
        eventId: z.string(),
        pid: z.string(),
        category_id: z.string().optional(),
        name: z.string().optional(),
        quantity: z.number().optional(),
        note: z.string().optional(),
        loaded: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { eventId, pid, ...body } = input;
      const out = await ctx.api.events.packingItems.update(eventId, pid, body);
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),
  deletePackingItem: t.procedure
    .input(z.object({ eventId: z.string(), pid: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.api.events.packingItems.delete(input.eventId, input.pid);
      return { ok: true };
    }),

  // Volunteers
  createVolunteer: t.procedure
    .input(
      z.object({
        eventId: z.string(),
        name: z.string(),
        department: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const out = await ctx.api.events.volunteers.create(input.eventId, {
        name: input.name,
        department: input.department,
      });
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),
  updateVolunteer: t.procedure
    .input(
      z.object({
        eventId: z.string(),
        vid: z.string(),
        name: z.string().optional(),
        department: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { eventId, vid, ...body } = input;
      const out = await ctx.api.events.volunteers.update(eventId, vid, body);
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),
  deleteVolunteer: t.procedure
    .input(z.object({ eventId: z.string(), vid: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.api.events.volunteers.delete(input.eventId, input.vid);
      return { ok: true };
    }),

  // Assignments
  createAssignment: t.procedure
    .input(
      z.object({
        eventId: z.string(),
        name: z.string(),
        category: z.enum(["planning", "during"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const out = await ctx.api.events.assignments.create(input.eventId, {
        name: input.name,
        category: input.category,
      });
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),
  updateAssignment: t.procedure
    .input(
      z.object({
        eventId: z.string(),
        aid: z.string(),
        name: z.string().optional(),
        category: z.enum(["planning", "during"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { eventId, aid, ...body } = input;
      const out = await ctx.api.events.assignments.update(eventId, aid, body);
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),
  deleteAssignment: t.procedure
    .input(z.object({ eventId: z.string(), aid: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.api.events.assignments.delete(input.eventId, input.aid);
      return { ok: true };
    }),
  addAssignmentMember: t.procedure
    .input(z.object({ eventId: z.string(), aid: z.string(), memberId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const out = await ctx.api.events.assignments.addMember(
        input.eventId,
        input.aid,
        input.memberId
      );
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),
  removeAssignmentMember: t.procedure
    .input(z.object({ eventId: z.string(), aid: z.string(), memberId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.api.events.assignments.removeMember(
        input.eventId,
        input.aid,
        input.memberId
      );
      return { ok: true };
    }),
});
