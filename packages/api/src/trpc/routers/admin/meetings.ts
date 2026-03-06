import { z } from "zod";
import { t } from "../../trpc";
import { TRPCError } from "@trpc/server";

export const meetingsRouter = t.router({
  list: t.procedure
    .input(z.object({ sort: z.enum(["date", "meeting_number"]).optional() }).optional())
    .query(({ ctx, input }) => ctx.api.meetings.list(input?.sort)),

  get: t.procedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const m = await ctx.api.meetings.get(input.id);
      if (!m) throw new TRPCError({ code: "NOT_FOUND" });
      return m;
    }),

  create: t.procedure
    .input(
      z.object({
        date: z.string(),
        meeting_number: z.number(),
        location: z.string().nullable().optional(),
        start_time: z.string().nullable().optional(),
        end_time: z.string().nullable().optional(),
        video_conference_url: z.string().nullable().optional(),
        previous_meeting_id: z.string().nullable().optional(),
        agenda_content: z.string().optional(),
        minutes_content: z.string().nullable().optional(),
        agenda_template_id: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => ctx.api.meetings.create(input)),

  update: t.procedure
    .input(z.object({ id: z.string() }).passthrough())
    .mutation(async ({ ctx, input }) => {
      const { id, ...body } = input;
      const m = await ctx.api.meetings.update(id, body);
      if (!m) throw new TRPCError({ code: "NOT_FOUND" });
      return m;
    }),

  delete: t.procedure
    .input(z.object({ id: z.string(), delete_agenda: z.boolean().optional(), delete_minutes: z.boolean().optional() }))
    .mutation(({ ctx, input }) => ctx.api.meetings.delete(input.id, { delete_agenda: input.delete_agenda, delete_minutes: input.delete_minutes })),

  listOldBusiness: t.procedure.query(({ ctx }) => ctx.api.meetings.listOldBusiness()),

  listMotions: t.procedure
    .input(
      z.object({
        page: z.number().optional(),
        per_page: z.number().optional(),
        q: z.string().optional(),
      }).optional()
    )
    .query(({ ctx, input }) => ctx.api.meetings.listMotions(input ?? {})),

  createMotion: t.procedure
    .input(
      z.object({
        meetingId: z.string(),
        description: z.string().nullable().optional(),
        result: z.enum(["pass", "fail"]),
        order_index: z.number().optional(),
        mover_member_id: z.string(),
        seconder_member_id: z.string(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { meetingId, ...body } = input;
      return ctx.api.meetings.createMotion(meetingId, body);
    }),

  updateMotion: t.procedure
    .input(
      z.object({
        meetingId: z.string(),
        motionId: z.string(),
      }).passthrough()
    )
    .mutation(({ ctx, input }) => {
      const { meetingId, motionId, ...body } = input;
      return ctx.api.meetings.updateMotion(meetingId, motionId, body);
    }),

  deleteMotion: t.procedure
    .input(z.object({ meetingId: z.string(), motionId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.api.meetings.deleteMotion(input.meetingId, input.motionId)
    ),

  createActionItem: t.procedure
    .input(
      z.object({
        meetingId: z.string(),
        description: z.string(),
        assignee_member_id: z.string().nullable().optional(),
        due_date: z.string().nullable().optional(),
        order_index: z.number().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { meetingId, ...body } = input;
      return ctx.api.meetings.createActionItem(meetingId, body);
    }),

  updateActionItem: t.procedure
    .input(
      z.object({
        meetingId: z.string(),
        actionItemId: z.string(),
      }).passthrough()
    )
    .mutation(({ ctx, input }) => {
      const { meetingId, actionItemId, ...body } = input;
      return ctx.api.meetings.updateActionItem(meetingId, actionItemId, body);
    }),

  deleteActionItem: t.procedure
    .input(z.object({ meetingId: z.string(), actionItemId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.api.meetings.deleteActionItem(input.meetingId, input.actionItemId)
    ),

  createOldBusiness: t.procedure
    .input(
      z.object({
        meetingId: z.string(),
        description: z.string(),
        order_index: z.number().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { meetingId, ...body } = input;
      return ctx.api.meetings.createOldBusiness(meetingId, body);
    }),

  updateOldBusiness: t.procedure
    .input(
      z.object({
        meetingId: z.string(),
        oldBusinessId: z.string(),
      }).passthrough()
    )
    .mutation(({ ctx, input }) => {
      const { meetingId, oldBusinessId, ...body } = input;
      return ctx.api.meetings.updateOldBusiness(meetingId, oldBusinessId, body);
    }),

  deleteOldBusiness: t.procedure
    .input(z.object({ meetingId: z.string(), oldBusinessId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.api.meetings.deleteOldBusiness(input.meetingId, input.oldBusinessId)
    ),
});
