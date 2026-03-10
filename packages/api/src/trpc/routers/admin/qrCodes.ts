import { t } from "../../trpc";
import { TRPCError } from "@trpc/server";
import {
  QrCodeCreateInputSchema,
  QrCodeCreateOutputSchema,
  QrCodeDeleteInputSchema,
  QrCodeDeleteOutputSchema,
  QrCodeGetImageInputSchema,
  QrCodeGetImageOutputSchema,
  QrCodeGetInputSchema,
  QrCodeGetOutputSchema,
  QrCodeListOutputSchema,
  QrCodeUpdateInputSchema,
  QrCodeUpdateOutputSchema,
} from "@satyrsmc/shared/dto/admin/qrCode";

export const qrCodesRouter = t.router({
  list: t.procedure
    .output(QrCodeListOutputSchema)
    .meta({ description: "List all QR codes." })
    .query(async ({ ctx }) => ctx.api.qrCodes.list()),

  get: t.procedure
    .input(QrCodeGetInputSchema)
    .output(QrCodeGetOutputSchema)
    .meta({ description: "Get a QR code by id." })
    .query(async ({ ctx, input }) => {
      const q = await ctx.api.qrCodes.get(input.id);
      if (!q) throw new TRPCError({ code: "NOT_FOUND" });
      return q;
    }),

  create: t.procedure
    .input(QrCodeCreateInputSchema)
    .output(QrCodeCreateOutputSchema)
    .meta({ description: "Create a new QR code." })
    .mutation(({ ctx, input }) => ctx.api.qrCodes.create(input)),

  update: t.procedure
    .input(QrCodeUpdateInputSchema)
    .output(QrCodeUpdateOutputSchema)
    .meta({ description: "Update a QR code." })
    .mutation(async ({ ctx, input }) => {
      const { id, ...body } = input;
      const q = await ctx.api.qrCodes.update(id, body);
      if (!q) throw new TRPCError({ code: "NOT_FOUND" });
      return q;
    }),

  delete: t.procedure
    .input(QrCodeDeleteInputSchema)
    .output(QrCodeDeleteOutputSchema)
    .meta({ description: "Delete a QR code." })
    .mutation(async ({ ctx, input }) => {
      await ctx.api.qrCodes.delete(input.id);
      return { ok: true as const };
    }),

  getImage: t.procedure
    .input(QrCodeGetImageInputSchema)
    .output(QrCodeGetImageOutputSchema)
    .meta({ description: "Get QR code image as base64." })
    .query(async ({ ctx, input }) => {
      const result = await ctx.api.qrCodes.getImage(input.id, input.size);
      if (!result) throw new TRPCError({ code: "NOT_FOUND" });
      return { base64: Buffer.from(result.buffer).toString("base64"), contentType: result.contentType };
    }),
});
