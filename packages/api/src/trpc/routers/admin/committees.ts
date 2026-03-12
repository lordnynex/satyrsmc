import { t } from "../../trpc";
import { TRPCError } from "@trpc/server";
import {
  CommitteeAddMemberInputSchema,
  CommitteeAddMemberOutputSchema,
  CommitteeCreateInputSchema,
  CommitteeCreateMeetingInputSchema,
  CommitteeCreateMeetingOutputSchema,
  CommitteeCreateOutputSchema,
  CommitteeDeleteInputSchema,
  CommitteeDeleteMeetingInputSchema,
  CommitteeDeleteMeetingOutputSchema,
  CommitteeDeleteOutputSchema,
  CommitteeGetInputSchema,
  CommitteeGetMeetingInputSchema,
  CommitteeGetMeetingOutputSchema,
  CommitteeGetOutputSchema,
  CommitteeListInputSchema,
  CommitteeListMeetingsInputSchema,
  CommitteeListMeetingsOutputSchema,
  CommitteeListOutputSchema,
  CommitteeRemoveMemberInputSchema,
  CommitteeRemoveMemberOutputSchema,
  CommitteeReorderMembersInputSchema,
  CommitteeReorderMembersOutputSchema,
  CommitteeUpdateInputSchema,
  CommitteeUpdateMeetingInputSchema,
  CommitteeUpdateMeetingOutputSchema,
  CommitteeUpdateOutputSchema,
} from "@satyrsmc/shared/dto/admin/committee";

export const committeesRouter = t.router({
  list: t.procedure
    .input(CommitteeListInputSchema)
    .output(CommitteeListOutputSchema)
    .meta({ description: "List committees with optional sort." })
    .query(({ ctx, input }) => ctx.api.committees.list(input?.sort)),

  get: t.procedure
    .input(CommitteeGetInputSchema)
    .output(CommitteeGetOutputSchema)
    .meta({ description: "Get a committee by id with members and meetings." })
    .query(async ({ ctx, input }) => {
      const c = await ctx.api.committees.get(input.id);
      if (!c) throw new TRPCError({ code: "NOT_FOUND" });
      return c;
    }),

  create: t.procedure
    .input(CommitteeCreateInputSchema)
    .output(CommitteeCreateOutputSchema)
    .meta({ description: "Create a new committee." })
    .mutation(async ({ ctx, input }) => {
      const c = await ctx.api.committees.create(input);
      if (!c)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Committee create returned null",
        });
      return c;
    }),

  update: t.procedure
    .input(CommitteeUpdateInputSchema)
    .output(CommitteeUpdateOutputSchema)
    .meta({ description: "Update a committee." })
    .mutation(async ({ ctx, input }) => {
      const { id, ...body } = input;
      const c = await ctx.api.committees.update(id, body);
      if (!c) throw new TRPCError({ code: "NOT_FOUND" });
      return c;
    }),

  delete: t.procedure
    .input(CommitteeDeleteInputSchema)
    .output(CommitteeDeleteOutputSchema)
    .meta({ description: "Delete a committee." })
    .mutation(async ({ ctx, input }) => {
      await ctx.api.committees.delete(input.id);
      return { ok: true as const };
    }),

  addMember: t.procedure
    .input(CommitteeAddMemberInputSchema)
    .output(CommitteeAddMemberOutputSchema)
    .meta({ description: "Add a member to a committee." })
    .mutation(async ({ ctx, input }) => {
      const c = await ctx.api.committees.addMember(input.committeeId, input.memberId);
      if (!c) throw new TRPCError({ code: "NOT_FOUND" });
      return c;
    }),

  removeMember: t.procedure
    .input(CommitteeRemoveMemberInputSchema)
    .output(CommitteeRemoveMemberOutputSchema)
    .meta({ description: "Remove a member from a committee." })
    .mutation(({ ctx, input }) =>
      ctx.api.committees.removeMember(input.committeeId, input.memberId),
    ),

  reorderMembers: t.procedure
    .input(CommitteeReorderMembersInputSchema)
    .output(CommitteeReorderMembersOutputSchema)
    .meta({ description: "Reorder committee members." })
    .mutation(({ ctx, input }) =>
      ctx.api.committees.updateMemberOrder(input.committeeId, input.memberIds),
    ),

  listMeetings: t.procedure
    .input(CommitteeListMeetingsInputSchema)
    .output(CommitteeListMeetingsOutputSchema)
    .meta({ description: "List meetings for a committee." })
    .query(async ({ ctx, input }) => {
      const list = await ctx.api.committees.listMeetings(input.committeeId);
      if (list === null) throw new TRPCError({ code: "NOT_FOUND" });
      return list;
    }),

  createMeeting: t.procedure
    .input(CommitteeCreateMeetingInputSchema)
    .output(CommitteeCreateMeetingOutputSchema)
    .meta({ description: "Create a meeting for a committee." })
    .mutation(async ({ ctx, input }) => {
      const { committeeId, ...body } = input;
      const m = await ctx.api.committees.createMeeting(committeeId, body);
      if (!m) throw new TRPCError({ code: "NOT_FOUND" });
      return m;
    }),

  getMeeting: t.procedure
    .input(CommitteeGetMeetingInputSchema)
    .output(CommitteeGetMeetingOutputSchema)
    .meta({ description: "Get a committee meeting by id." })
    .query(async ({ ctx, input }) => {
      const m = await ctx.api.committees.getMeeting(input.committeeId, input.meetingId);
      if (!m) throw new TRPCError({ code: "NOT_FOUND" });
      return m;
    }),

  updateMeeting: t.procedure
    .input(CommitteeUpdateMeetingInputSchema)
    .output(CommitteeUpdateMeetingOutputSchema)
    .meta({ description: "Update a committee meeting." })
    .mutation(async ({ ctx, input }) => {
      const { committeeId, meetingId, ...body } = input;
      const m = await ctx.api.committees.updateMeeting(committeeId, meetingId, body);
      if (!m) throw new TRPCError({ code: "NOT_FOUND" });
      return m;
    }),

  deleteMeeting: t.procedure
    .input(CommitteeDeleteMeetingInputSchema)
    .output(CommitteeDeleteMeetingOutputSchema)
    .meta({ description: "Delete a committee meeting." })
    .mutation(({ ctx, input }) =>
      ctx.api.committees.deleteMeeting(input.committeeId, input.meetingId),
    ),
});
