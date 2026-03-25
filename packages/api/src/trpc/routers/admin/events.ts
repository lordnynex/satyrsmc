import { t } from "../../trpc";
import { TRPCError } from "@trpc/server";
import {
  EventAddAssetInputSchema,
  EventAddAssetOutputSchema,
  EventAddAssignmentMemberInputSchema,
  EventAddAssignmentMemberOutputSchema,
  EventAddAttendeeInputSchema,
  EventAddAttendeeOutputSchema,
  EventAddMemberAttendeeInputSchema,
  EventAddMemberAttendeeOutputSchema,
  EventAddMilestoneMemberInputSchema,
  EventAddMilestoneMemberOutputSchema,
  EventAddPhotoInputSchema,
  EventAddPhotoOutputSchema,
  EventCreateAssignmentInputSchema,
  EventCreateAssignmentOutputSchema,
  EventCreateIncidentInputSchema,
  EventCreateIncidentOutputSchema,
  EventCreateInputSchema,
  EventCreateMilestoneInputSchema,
  EventCreateMilestoneOutputSchema,
  EventCreateOutputSchema,
  EventCreatePackingCategoryInputSchema,
  EventCreatePackingCategoryOutputSchema,
  EventCreatePackingItemInputSchema,
  EventCreatePackingItemOutputSchema,
  EventCreateScheduleItemInputSchema,
  EventCreateScheduleItemOutputSchema,
  EventCreateVolunteerInputSchema,
  EventCreateVolunteerOutputSchema,
  EventDeleteAssetInputSchema,
  EventDeleteAssetOutputSchema,
  EventDeleteAssignmentInputSchema,
  EventDeleteAssignmentOutputSchema,
  EventDeleteAttendeeInputSchema,
  EventDeleteAttendeeOutputSchema,
  EventDeleteInputSchema,
  EventDeleteIncidentInputSchema,
  EventDeleteIncidentOutputSchema,
  EventDeleteMilestoneInputSchema,
  EventDeleteMilestoneOutputSchema,
  EventDeleteOutputSchema,
  EventDeletePackingCategoryInputSchema,
  EventDeletePackingCategoryOutputSchema,
  EventDeletePackingItemInputSchema,
  EventDeletePackingItemOutputSchema,
  EventDeletePhotoInputSchema,
  EventDeletePhotoOutputSchema,
  EventDeleteScheduleItemInputSchema,
  EventDeleteScheduleItemOutputSchema,
  EventDeleteVolunteerInputSchema,
  EventDeleteVolunteerOutputSchema,
  EventGetInputSchema,
  EventGetOutputSchema,
  EventListInputSchema,
  EventListOutputSchema,
  EventRemoveAssignmentMemberInputSchema,
  EventRemoveAssignmentMemberOutputSchema,
  EventRemoveMilestoneMemberInputSchema,
  EventRemoveMilestoneMemberOutputSchema,
  EventUpdateAssignmentInputSchema,
  EventUpdateAssignmentOutputSchema,
  EventUpdateAttendeeInputSchema,
  EventUpdateAttendeeOutputSchema,
  EventUpdateInputSchema,
  EventUpdateIncidentInputSchema,
  EventUpdateIncidentOutputSchema,
  EventUpdateMilestoneInputSchema,
  EventUpdateMilestoneOutputSchema,
  EventUpdateOutputSchema,
  EventUpdatePackingCategoryInputSchema,
  EventUpdatePackingCategoryOutputSchema,
  EventUpdatePackingItemInputSchema,
  EventUpdatePackingItemOutputSchema,
  EventUpdateScheduleItemInputSchema,
  EventUpdateScheduleItemOutputSchema,
  EventUpdateVolunteerInputSchema,
  EventUpdateVolunteerOutputSchema,
  EventGetAttendeesInputSchema,
  EventGetAttendeesOutputSchema,
} from "@satyrsmc/shared/dto/admin/event";

export const eventsRouter = t.router({
  list: t.procedure
    .input(EventListInputSchema)
    .output(EventListOutputSchema)
    .meta({ description: "List events, optionally filtered by type." })
    .query(async ({ ctx, input }) => ctx.api.events.list(input?.type)),

  get: t.procedure
    .input(EventGetInputSchema)
    .output(EventGetOutputSchema)
    .meta({ description: "Get an event by id with full detail." })
    .query(async ({ ctx, input }) => {
      const event = await ctx.api.events.get(input.id);
      if (!event) throw new TRPCError({ code: "NOT_FOUND" });
      return event;
    }),

  getAttendees: t.procedure
    .input(EventGetAttendeesInputSchema)
    .output(EventGetAttendeesOutputSchema)
    .meta({ description: "Get enriched attendee list for an event (admin view)." })
    .query(async ({ ctx, input }) => ctx.api.events.getAttendeesAdmin(input.eventId)),

  create: t.procedure
    .input(EventCreateInputSchema)
    .output(EventCreateOutputSchema)
    .meta({ description: "Create a new event." })
    .mutation(async ({ ctx, input }) => ctx.api.events.create(input)),

  update: t.procedure
    .input(EventUpdateInputSchema)
    .output(EventUpdateOutputSchema)
    .meta({ description: "Update an event." })
    .mutation(async ({ ctx, input }) => {
      const { id, ...body } = input;
      type UpdateBody = Parameters<typeof ctx.api.events.update>[1];
      const out = await ctx.api.events.update(id, body as UpdateBody);
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),

  delete: t.procedure
    .input(EventDeleteInputSchema)
    .output(EventDeleteOutputSchema)
    .meta({ description: "Delete an event." })
    .mutation(async ({ ctx, input }) => {
      await ctx.api.events.delete(input.id);
      return { ok: true as const };
    }),

  addPhoto: t.procedure
    .input(EventAddPhotoInputSchema)
    .output(EventAddPhotoOutputSchema)
    .meta({ description: "Add a photo to an event (base64 image)." })
    .mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.imageBase64, "base64");
      const out = await ctx.api.events.addPhoto(input.eventId, buffer);
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),
  deletePhoto: t.procedure
    .input(EventDeletePhotoInputSchema)
    .output(EventDeletePhotoOutputSchema)
    .meta({ description: "Delete an event photo." })
    .mutation(async ({ ctx, input }) => {
      await ctx.api.events.deletePhoto(input.eventId, input.photoId);
      return { ok: true as const };
    }),

  addAsset: t.procedure
    .input(EventAddAssetInputSchema)
    .output(EventAddAssetOutputSchema)
    .meta({ description: "Add an asset to an event (base64 image)." })
    .mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.imageBase64, "base64");
      const out = await ctx.api.events.addAsset(input.eventId, buffer);
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),
  deleteAsset: t.procedure
    .input(EventDeleteAssetInputSchema)
    .output(EventDeleteAssetOutputSchema)
    .meta({ description: "Delete an event asset." })
    .mutation(async ({ ctx, input }) => {
      await ctx.api.events.deleteAsset(input.eventId, input.assetId);
      return { ok: true as const };
    }),

  addAttendee: t.procedure
    .input(EventAddAttendeeInputSchema)
    .output(EventAddAttendeeOutputSchema)
    .meta({ description: "Add a contact attendee to an event." })
    .mutation(async ({ ctx, input }) => {
      const out = await ctx.api.events.attendees.add(input.eventId, {
        contact_id: input.contact_id,
        waiver_signed: input.waiver_signed,
        status: input.status,
      });
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),
  updateAttendee: t.procedure
    .input(EventUpdateAttendeeInputSchema)
    .output(EventUpdateAttendeeOutputSchema)
    .meta({ description: "Update an event attendee." })
    .mutation(async ({ ctx, input }) => {
      const out = await ctx.api.events.attendees.update(input.eventId, input.attendeeId, {
        waiver_signed: input.waiver_signed,
        status: input.status,
      });
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),
  deleteAttendee: t.procedure
    .input(EventDeleteAttendeeInputSchema)
    .output(EventDeleteAttendeeOutputSchema)
    .meta({ description: "Remove an attendee from an event." })
    .mutation(async ({ ctx, input }) => {
      await ctx.api.events.attendees.delete(input.eventId, input.attendeeId);
      return { ok: true as const };
    }),

  addMemberAttendee: t.procedure
    .input(EventAddMemberAttendeeInputSchema)
    .output(EventAddMemberAttendeeOutputSchema)
    .meta({ description: "Add a member attendee to an event (resolves member_id to contact_id)." })
    .mutation(async ({ ctx, input }) => {
      const out = await ctx.api.events.attendees.addByMember(input.eventId, {
        member_id: input.member_id,
        waiver_signed: input.waiver_signed,
      });
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),

  createIncident: t.procedure
    .input(EventCreateIncidentInputSchema)
    .output(EventCreateIncidentOutputSchema)
    .meta({ description: "Create an incident for an event." })
    .mutation(async ({ ctx, input }) => {
      const { eventId, ...body } = input;
      const out = await ctx.api.events.incidents.create(eventId, body);
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),
  updateIncident: t.procedure
    .input(EventUpdateIncidentInputSchema)
    .output(EventUpdateIncidentOutputSchema)
    .meta({ description: "Update an incident." })
    .mutation(async ({ ctx, input }) => {
      const { eventId, incidentId, ...body } = input;
      const out = await ctx.api.events.incidents.update(eventId, incidentId, body);
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),
  deleteIncident: t.procedure
    .input(EventDeleteIncidentInputSchema)
    .output(EventDeleteIncidentOutputSchema)
    .meta({ description: "Delete an incident." })
    .mutation(async ({ ctx, input }) => {
      await ctx.api.events.incidents.delete(input.eventId, input.incidentId);
      return { ok: true as const };
    }),

  createScheduleItem: t.procedure
    .input(EventCreateScheduleItemInputSchema)
    .output(EventCreateScheduleItemOutputSchema)
    .meta({ description: "Create a schedule item for an event." })
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
    .input(EventUpdateScheduleItemInputSchema)
    .output(EventUpdateScheduleItemOutputSchema)
    .meta({ description: "Update a schedule item." })
    .mutation(async ({ ctx, input }) => {
      const { eventId, scheduleId, ...body } = input;
      const out = await ctx.api.events.scheduleItems.update(eventId, scheduleId, body);
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),
  deleteScheduleItem: t.procedure
    .input(EventDeleteScheduleItemInputSchema)
    .output(EventDeleteScheduleItemOutputSchema)
    .meta({ description: "Delete a schedule item." })
    .mutation(async ({ ctx, input }) => {
      await ctx.api.events.scheduleItems.delete(input.eventId, input.scheduleId);
      return { ok: true as const };
    }),

  createMilestone: t.procedure
    .input(EventCreateMilestoneInputSchema)
    .output(EventCreateMilestoneOutputSchema)
    .meta({ description: "Create a planning milestone for an event." })
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
    .input(EventUpdateMilestoneInputSchema)
    .output(EventUpdateMilestoneOutputSchema)
    .meta({ description: "Update a milestone." })
    .mutation(async ({ ctx, input }) => {
      const { eventId, mid, ...body } = input;
      const out = await ctx.api.events.milestones.update(eventId, mid, body);
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),
  deleteMilestone: t.procedure
    .input(EventDeleteMilestoneInputSchema)
    .output(EventDeleteMilestoneOutputSchema)
    .meta({ description: "Delete a milestone." })
    .mutation(async ({ ctx, input }) => {
      await ctx.api.events.milestones.delete(input.eventId, input.mid);
      return { ok: true as const };
    }),
  addMilestoneMember: t.procedure
    .input(EventAddMilestoneMemberInputSchema)
    .output(EventAddMilestoneMemberOutputSchema)
    .meta({ description: "Add a member to a milestone." })
    .mutation(async ({ ctx, input }) => {
      const out = await ctx.api.events.milestones.addMember(
        input.eventId,
        input.mid,
        input.memberId,
      );
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),
  removeMilestoneMember: t.procedure
    .input(EventRemoveMilestoneMemberInputSchema)
    .output(EventRemoveMilestoneMemberOutputSchema)
    .meta({ description: "Remove a member from a milestone." })
    .mutation(async ({ ctx, input }) => {
      await ctx.api.events.milestones.removeMember(input.eventId, input.mid, input.memberId);
      return { ok: true as const };
    }),

  createPackingCategory: t.procedure
    .input(EventCreatePackingCategoryInputSchema)
    .output(EventCreatePackingCategoryOutputSchema)
    .meta({ description: "Create a packing category for an event." })
    .mutation(async ({ ctx, input }) => {
      const out = await ctx.api.events.packingCategories.create(input.eventId, {
        name: input.name,
      });
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),
  updatePackingCategory: t.procedure
    .input(EventUpdatePackingCategoryInputSchema)
    .output(EventUpdatePackingCategoryOutputSchema)
    .meta({ description: "Update a packing category." })
    .mutation(async ({ ctx, input }) => {
      const out = await ctx.api.events.packingCategories.update(input.eventId, input.cid, {
        name: input.name,
      });
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),
  deletePackingCategory: t.procedure
    .input(EventDeletePackingCategoryInputSchema)
    .output(EventDeletePackingCategoryOutputSchema)
    .meta({ description: "Delete a packing category." })
    .mutation(async ({ ctx, input }) => {
      await ctx.api.events.packingCategories.delete(input.eventId, input.cid);
      return { ok: true as const };
    }),

  createPackingItem: t.procedure
    .input(EventCreatePackingItemInputSchema)
    .output(EventCreatePackingItemOutputSchema)
    .meta({ description: "Create a packing item." })
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
    .input(EventUpdatePackingItemInputSchema)
    .output(EventUpdatePackingItemOutputSchema)
    .meta({ description: "Update a packing item." })
    .mutation(async ({ ctx, input }) => {
      const { eventId, pid, ...body } = input;
      const out = await ctx.api.events.packingItems.update(eventId, pid, body);
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),
  deletePackingItem: t.procedure
    .input(EventDeletePackingItemInputSchema)
    .output(EventDeletePackingItemOutputSchema)
    .meta({ description: "Delete a packing item." })
    .mutation(async ({ ctx, input }) => {
      await ctx.api.events.packingItems.delete(input.eventId, input.pid);
      return { ok: true as const };
    }),

  createVolunteer: t.procedure
    .input(EventCreateVolunteerInputSchema)
    .output(EventCreateVolunteerOutputSchema)
    .meta({ description: "Create a volunteer for an event." })
    .mutation(async ({ ctx, input }) => {
      const out = await ctx.api.events.volunteers.create(input.eventId, {
        name: input.name,
        department: input.department,
      });
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),
  updateVolunteer: t.procedure
    .input(EventUpdateVolunteerInputSchema)
    .output(EventUpdateVolunteerOutputSchema)
    .meta({ description: "Update a volunteer." })
    .mutation(async ({ ctx, input }) => {
      const { eventId, vid, ...body } = input;
      const out = await ctx.api.events.volunteers.update(eventId, vid, body);
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),
  deleteVolunteer: t.procedure
    .input(EventDeleteVolunteerInputSchema)
    .output(EventDeleteVolunteerOutputSchema)
    .meta({ description: "Delete a volunteer." })
    .mutation(async ({ ctx, input }) => {
      await ctx.api.events.volunteers.delete(input.eventId, input.vid);
      return { ok: true as const };
    }),

  createAssignment: t.procedure
    .input(EventCreateAssignmentInputSchema)
    .output(EventCreateAssignmentOutputSchema)
    .meta({ description: "Create an assignment for an event." })
    .mutation(async ({ ctx, input }) => {
      const out = await ctx.api.events.assignments.create(input.eventId, {
        name: input.name,
        category: input.category,
      });
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),
  updateAssignment: t.procedure
    .input(EventUpdateAssignmentInputSchema)
    .output(EventUpdateAssignmentOutputSchema)
    .meta({ description: "Update an assignment." })
    .mutation(async ({ ctx, input }) => {
      const { eventId, aid, ...body } = input;
      const out = await ctx.api.events.assignments.update(eventId, aid, body);
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),
  deleteAssignment: t.procedure
    .input(EventDeleteAssignmentInputSchema)
    .output(EventDeleteAssignmentOutputSchema)
    .meta({ description: "Delete an assignment." })
    .mutation(async ({ ctx, input }) => {
      await ctx.api.events.assignments.delete(input.eventId, input.aid);
      return { ok: true as const };
    }),
  addAssignmentMember: t.procedure
    .input(EventAddAssignmentMemberInputSchema)
    .output(EventAddAssignmentMemberOutputSchema)
    .meta({ description: "Add a member to an assignment." })
    .mutation(async ({ ctx, input }) => {
      const out = await ctx.api.events.assignments.addMember(
        input.eventId,
        input.aid,
        input.memberId,
      );
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),
  removeAssignmentMember: t.procedure
    .input(EventRemoveAssignmentMemberInputSchema)
    .output(EventRemoveAssignmentMemberOutputSchema)
    .meta({ description: "Remove a member from an assignment." })
    .mutation(async ({ ctx, input }) => {
      await ctx.api.events.assignments.removeMember(input.eventId, input.aid, input.memberId);
      return { ok: true as const };
    }),
});
