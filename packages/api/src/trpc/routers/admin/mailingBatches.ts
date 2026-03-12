import { t } from "../../trpc";
import { TRPCError } from "@trpc/server";
import {
  MailingBatchCreateInputSchema,
  MailingBatchCreateOutputSchema,
  MailingBatchGetInputSchema,
  MailingBatchGetOutputSchema,
  MailingBatchListOutputSchema,
  MailingBatchUpdateRecipientStatusInputSchema,
  MailingBatchUpdateRecipientStatusOutputSchema,
} from "@satyrsmc/shared/dto/admin/mailingBatch";

export const mailingBatchesRouter = t.router({
  list: t.procedure
    .output(MailingBatchListOutputSchema)
    .meta({ description: "List all mailing batches." })
    .query(async ({ ctx }) => ctx.api.mailingBatches.list()),

  get: t.procedure
    .input(MailingBatchGetInputSchema)
    .output(MailingBatchGetOutputSchema)
    .meta({ description: "Get a mailing batch by id." })
    .query(async ({ ctx, input }) => {
      const b = await ctx.api.mailingBatches.get(input.id);
      if (!b) throw new TRPCError({ code: "NOT_FOUND" });
      return b;
    }),

  create: t.procedure
    .input(MailingBatchCreateInputSchema)
    .output(MailingBatchCreateOutputSchema)
    .meta({ description: "Create a new mailing batch." })
    .mutation(async ({ ctx, input }) => {
      const out = await ctx.api.mailingBatches.create(input.listId, input.name);
      if (!out) throw new TRPCError({ code: "NOT_FOUND" });
      return out;
    }),

  updateRecipientStatus: t.procedure
    .input(MailingBatchUpdateRecipientStatusInputSchema)
    .output(MailingBatchUpdateRecipientStatusOutputSchema)
    .meta({ description: "Update recipient status on a batch." })
    .mutation(({ ctx, input }) => {
      ctx.api.mailingBatches.updateRecipientStatus(
        input.batchId,
        input.recipientId,
        input.status,
        input.reason,
      );
      return { ok: true as const };
    }),
});
