import { t } from "../../trpc";
import { TRPCError } from "@trpc/server";
import {
  DocumentExportPdfInputSchema,
  DocumentExportPdfOutputSchema,
  DocumentGetInputSchema,
  DocumentGetOutputSchema,
  DocumentGetVersionsInputSchema,
  DocumentGetVersionsOutputSchema,
  DocumentRestoreInputSchema,
  DocumentRestoreOutputSchema,
  DocumentUpdateInputSchema,
  DocumentUpdateOutputSchema,
} from "@satyrsmc/shared/dto/admin/document";

export const documentsRouter = t.router({
  get: t.procedure
    .input(DocumentGetInputSchema)
    .output(DocumentGetOutputSchema)
    .meta({ description: "Get a document by id." })
    .query(async ({ ctx, input }) => {
      const d = await ctx.api.documents.get(input.id);
      if (!d) throw new TRPCError({ code: "NOT_FOUND" });
      return d;
    }),

  update: t.procedure
    .input(DocumentUpdateInputSchema)
    .output(DocumentUpdateOutputSchema)
    .meta({ description: "Update document content." })
    .mutation(async ({ ctx, input }) => {
      const d = await ctx.api.documents.update(input.id, { content: input.content });
      if (!d) throw new TRPCError({ code: "NOT_FOUND" });
      return d;
    }),

  getVersions: t.procedure
    .input(DocumentGetVersionsInputSchema)
    .output(DocumentGetVersionsOutputSchema)
    .meta({ description: "List document versions." })
    .query(({ ctx, input }) => ctx.api.documents.listVersions(input.id)),

  restore: t.procedure
    .input(DocumentRestoreInputSchema)
    .output(DocumentRestoreOutputSchema)
    .meta({ description: "Restore document to a previous version." })
    .mutation(async ({ ctx, input }) => {
      const doc = await ctx.api.documents.restore(input.id, input.versionId);
      if (!doc) throw new TRPCError({ code: "NOT_FOUND" });
      return doc;
    }),

  exportPdf: t.procedure
    .input(DocumentExportPdfInputSchema)
    .output(DocumentExportPdfOutputSchema)
    .meta({ description: "Export document as PDF (base64)." })
    .query(async ({ ctx, input }) => {
      const buffer = await ctx.api.documents.exportPdf(input.id);
      if (!buffer) throw new TRPCError({ code: "NOT_FOUND" });
      return { base64: Buffer.from(buffer).toString("base64") };
    }),
});
