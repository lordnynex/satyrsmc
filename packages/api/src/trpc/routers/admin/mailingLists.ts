import { t } from "../../trpc";
import { TRPCError } from "@trpc/server";
import {
  MailingListAddMemberInputSchema,
  MailingListAddMemberOutputSchema,
  MailingListCreateInputSchema,
  MailingListCreateOutputSchema,
  MailingListDeleteInputSchema,
  MailingListDeleteOutputSchema,
  MailingListGetIncludedInputSchema,
  MailingListGetIncludedOutputSchema,
  MailingListGetInputSchema,
  MailingListGetMembersInputSchema,
  MailingListGetMembersOutputSchema,
  MailingListGetOutputSchema,
  MailingListGetStatsInputSchema,
  MailingListGetStatsOutputSchema,
  MailingListListOutputSchema,
  MailingListPreviewInputSchema,
  MailingListPreviewOutputSchema,
  MailingListRemoveMemberInputSchema,
  MailingListRemoveMemberOutputSchema,
  MailingListUpdateInputSchema,
  MailingListUpdateOutputSchema,
} from "@satyrsmc/shared/dto/admin/mailingList";

export const mailingListsRouter = t.router({
  list: t.procedure
    .output(MailingListListOutputSchema)
    .meta({ description: "List all mailing lists." })
    .query(async ({ ctx }) => ctx.api.mailingLists.list()),

  get: t.procedure
    .input(MailingListGetInputSchema)
    .output(MailingListGetOutputSchema)
    .meta({ description: "Get a mailing list by id." })
    .query(async ({ ctx, input }) => {
      const m = await ctx.api.mailingLists.get(input.id);
      if (!m) throw new TRPCError({ code: "NOT_FOUND" });
      return m;
    }),

  create: t.procedure
    .input(MailingListCreateInputSchema)
    .output(MailingListCreateOutputSchema)
    .meta({ description: "Create a new mailing list." })
    .mutation(async ({ ctx, input }) => {
      const out = await ctx.api.mailingLists.create(input);
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),

  update: t.procedure
    .input(MailingListUpdateInputSchema)
    .output(MailingListUpdateOutputSchema)
    .meta({ description: "Update a mailing list." })
    .mutation(async ({ ctx, input }) => {
      const { id, ...body } = input;
      const m = await ctx.api.mailingLists.update(id, body);
      if (!m) throw new TRPCError({ code: "NOT_FOUND" });
      return m;
    }),

  delete: t.procedure
    .input(MailingListDeleteInputSchema)
    .output(MailingListDeleteOutputSchema)
    .meta({ description: "Delete a mailing list." })
    .mutation(async ({ ctx, input }) => {
      await ctx.api.mailingLists.delete(input.id);
      return { ok: true as const };
    }),

  getMembers: t.procedure
    .input(MailingListGetMembersInputSchema)
    .output(MailingListGetMembersOutputSchema)
    .meta({ description: "Get members of a mailing list." })
    .query(({ ctx, input }) => ctx.api.mailingLists.getMembers(input.listId)),

  addMember: t.procedure
    .input(MailingListAddMemberInputSchema)
    .output(MailingListAddMemberOutputSchema)
    .meta({ description: "Add a contact to a mailing list." })
    .mutation(({ ctx, input }) => ctx.api.mailingLists.addMember(input.listId, input.contactId)),

  removeMember: t.procedure
    .input(MailingListRemoveMemberInputSchema)
    .output(MailingListRemoveMemberOutputSchema)
    .meta({ description: "Remove a contact from a mailing list." })
    .mutation(async ({ ctx, input }) => {
      await ctx.api.mailingLists.removeMember(input.listId, input.contactId);
      return { ok: true as const };
    }),

  preview: t.procedure
    .input(MailingListPreviewInputSchema)
    .output(MailingListPreviewOutputSchema)
    .meta({ description: "Preview included/excluded contacts for a list." })
    .query(({ ctx, input }) => ctx.api.mailingLists.preview(input.id)),

  getStats: t.procedure
    .input(MailingListGetStatsInputSchema)
    .output(MailingListGetStatsOutputSchema)
    .meta({ description: "Get mailing list statistics." })
    .query(({ ctx, input }) => ctx.api.mailingLists.getStats(input.id)),

  getIncluded: t.procedure
    .input(MailingListGetIncludedInputSchema)
    .output(MailingListGetIncludedOutputSchema)
    .meta({ description: "Get paginated included contacts for a list." })
    .query(({ ctx, input }) =>
      ctx.api.mailingLists.getIncludedPaginated(input.listId, input.page, input.limit, input.q),
    ),
});
