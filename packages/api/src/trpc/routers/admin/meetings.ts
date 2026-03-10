import { t } from "../../trpc";
import { TRPCError } from "@trpc/server";
import {
  MeetingCreateActionItemInputSchema,
  MeetingCreateActionItemOutputSchema,
  MeetingCreateInputSchema,
  MeetingCreateMotionInputSchema,
  MeetingCreateMotionOutputSchema,
  MeetingCreateOldBusinessInputSchema,
  MeetingCreateOldBusinessOutputSchema,
  MeetingCreateOutputSchema,
  MeetingDeleteActionItemInputSchema,
  MeetingDeleteActionItemOutputSchema,
  MeetingDeleteInputSchema,
  MeetingDeleteMotionInputSchema,
  MeetingDeleteMotionOutputSchema,
  MeetingDeleteOldBusinessInputSchema,
  MeetingDeleteOldBusinessOutputSchema,
  MeetingDeleteOutputSchema,
  MeetingGetInputSchema,
  MeetingGetOutputSchema,
  MeetingListInputSchema,
  MeetingListMotionsInputSchema,
  MeetingListMotionsOutputSchema,
  MeetingListOldBusinessOutputSchema,
  MeetingListOutputSchema,
  MeetingUpdateActionItemInputSchema,
  MeetingUpdateActionItemOutputSchema,
  MeetingUpdateInputSchema,
  MeetingUpdateMotionInputSchema,
  MeetingUpdateMotionOutputSchema,
  MeetingUpdateOldBusinessInputSchema,
  MeetingUpdateOldBusinessOutputSchema,
  MeetingUpdateOutputSchema,
} from "@satyrsmc/shared/dto/admin/meeting";

export const meetingsRouter = t.router({
  list: t.procedure
    .input(MeetingListInputSchema)
    .output(MeetingListOutputSchema)
    .meta({ description: "List meetings with optional sort." })
    .query(({ ctx, input }) => ctx.api.meetings.list(input?.sort)),

  get: t.procedure
    .input(MeetingGetInputSchema)
    .output(MeetingGetOutputSchema)
    .meta({ description: "Get a meeting by id with motions and action items." })
    .query(async ({ ctx, input }) => {
      const m = await ctx.api.meetings.get(input.id);
      if (!m) throw new TRPCError({ code: "NOT_FOUND" });
      return m;
    }),

  create: t.procedure
    .input(MeetingCreateInputSchema)
    .output(MeetingCreateOutputSchema)
    .meta({ description: "Create a new meeting." })
    .mutation(async ({ ctx, input }) => {
      const out = await ctx.api.meetings.create(input);
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),

  update: t.procedure
    .input(MeetingUpdateInputSchema)
    .output(MeetingUpdateOutputSchema)
    .meta({ description: "Update a meeting." })
    .mutation(async ({ ctx, input }) => {
      const { id, ...body } = input;
      const m = await ctx.api.meetings.update(id, body);
      if (!m) throw new TRPCError({ code: "NOT_FOUND" });
      return m;
    }),

  delete: t.procedure
    .input(MeetingDeleteInputSchema)
    .output(MeetingDeleteOutputSchema)
    .meta({ description: "Delete a meeting." })
    .mutation(async ({ ctx, input }) => {
      await ctx.api.meetings.delete(input.id, { delete_agenda: input.delete_agenda, delete_minutes: input.delete_minutes });
    }),

  listOldBusiness: t.procedure
    .output(MeetingListOldBusinessOutputSchema)
    .meta({ description: "List old business items with meeting context." })
    .query(({ ctx }) => ctx.api.meetings.listOldBusiness()),

  listMotions: t.procedure
    .input(MeetingListMotionsInputSchema)
    .output(MeetingListMotionsOutputSchema)
    .meta({ description: "List motions with pagination and search." })
    .query(({ ctx, input }) => ctx.api.meetings.listMotions(input ?? {})),

  createMotion: t.procedure
    .input(MeetingCreateMotionInputSchema)
    .output(MeetingCreateMotionOutputSchema)
    .meta({ description: "Create a motion on a meeting." })
    .mutation(({ ctx, input }) => {
      const { meetingId, ...body } = input;
      return ctx.api.meetings.createMotion(meetingId, body);
    }),

  updateMotion: t.procedure
    .input(MeetingUpdateMotionInputSchema)
    .output(MeetingUpdateMotionOutputSchema)
    .meta({ description: "Update a motion." })
    .mutation(async ({ ctx, input }) => {
      const { meetingId, motionId, ...body } = input;
      const out = await ctx.api.meetings.updateMotion(meetingId, motionId, body);
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),

  deleteMotion: t.procedure
    .input(MeetingDeleteMotionInputSchema)
    .output(MeetingDeleteMotionOutputSchema)
    .meta({ description: "Delete a motion." })
    .mutation(({ ctx, input }) => ctx.api.meetings.deleteMotion(input.meetingId, input.motionId)),

  createActionItem: t.procedure
    .input(MeetingCreateActionItemInputSchema)
    .output(MeetingCreateActionItemOutputSchema)
    .meta({ description: "Create an action item on a meeting." })
    .mutation(({ ctx, input }) => {
      const { meetingId, ...body } = input;
      return ctx.api.meetings.createActionItem(meetingId, body);
    }),

  updateActionItem: t.procedure
    .input(MeetingUpdateActionItemInputSchema)
    .output(MeetingUpdateActionItemOutputSchema)
    .meta({ description: "Update an action item." })
    .mutation(async ({ ctx, input }) => {
      const { meetingId, actionItemId, ...body } = input;
      const out = await ctx.api.meetings.updateActionItem(meetingId, actionItemId, body);
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),

  deleteActionItem: t.procedure
    .input(MeetingDeleteActionItemInputSchema)
    .output(MeetingDeleteActionItemOutputSchema)
    .meta({ description: "Delete an action item." })
    .mutation(({ ctx, input }) => ctx.api.meetings.deleteActionItem(input.meetingId, input.actionItemId)),

  createOldBusiness: t.procedure
    .input(MeetingCreateOldBusinessInputSchema)
    .output(MeetingCreateOldBusinessOutputSchema)
    .meta({ description: "Create an old business item." })
    .mutation(({ ctx, input }) => {
      const { meetingId, ...body } = input;
      return ctx.api.meetings.createOldBusiness(meetingId, body);
    }),

  updateOldBusiness: t.procedure
    .input(MeetingUpdateOldBusinessInputSchema)
    .output(MeetingUpdateOldBusinessOutputSchema)
    .meta({ description: "Update an old business item." })
    .mutation(async ({ ctx, input }) => {
      const { meetingId, oldBusinessId, ...body } = input;
      const out = await ctx.api.meetings.updateOldBusiness(meetingId, oldBusinessId, body);
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),

  deleteOldBusiness: t.procedure
    .input(MeetingDeleteOldBusinessInputSchema)
    .output(MeetingDeleteOldBusinessOutputSchema)
    .meta({ description: "Delete an old business item." })
    .mutation(({ ctx, input }) => ctx.api.meetings.deleteOldBusiness(input.meetingId, input.oldBusinessId)),
});
