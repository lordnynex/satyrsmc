import { t } from "../../trpc";
import { TRPCError } from "@trpc/server";
import type { Contact } from "@satyrsmc/shared/dto/admin/contact";
import {
  ContactCreateInputSchema,
  ContactCreateOutputSchema,
  ContactDeleteInputSchema,
  ContactDeleteOutputSchema,
  ContactGetInputSchema,
  ContactGetOutputSchema,
  ContactListInputSchema,
  ContactListOutputSchema,
  ContactListTagsOutputSchema,
  ContactRestoreInputSchema,
  ContactRestoreOutputSchema,
  ContactUpdateInputSchema,
  ContactUpdateOutputSchema,
} from "@satyrsmc/shared/dto/admin/contact";

export const contactsRouter = t.router({
  list: t.procedure
    .input(ContactListInputSchema)
    .output(ContactListOutputSchema)
    .meta({ description: "List contacts with optional search and filters." })
    .query(async ({ ctx, input }) => ctx.api.contacts.list(input ?? {})),

  get: t.procedure
    .input(ContactGetInputSchema)
    .output(ContactGetOutputSchema)
    .meta({ description: "Get a contact by id." })
    .query(async ({ ctx, input }) => {
      const c = await ctx.api.contacts.get(input.id);
      if (!c) throw new TRPCError({ code: "NOT_FOUND" });
      return c;
    }),

  create: t.procedure
    .input(ContactCreateInputSchema)
    .output(ContactCreateOutputSchema)
    .meta({ description: "Create a new contact." })
    .mutation(async ({ ctx, input }) => {
      const c = await ctx.api.contacts.create(input as Partial<Contact> & { display_name: string });
      if (!c)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Contact create returned null",
        });
      return c;
    }),

  update: t.procedure
    .input(ContactUpdateInputSchema)
    .output(ContactUpdateOutputSchema)
    .meta({ description: "Update a contact." })
    .mutation(async ({ ctx, input }) => {
      const { id, ...body } = input;
      const c = await ctx.api.contacts.update(id, body as Partial<Contact>);
      if (!c) throw new TRPCError({ code: "NOT_FOUND" });
      return c;
    }),

  delete: t.procedure
    .input(ContactDeleteInputSchema)
    .output(ContactDeleteOutputSchema)
    .meta({ description: "Soft-delete a contact." })
    .mutation(async ({ ctx, input }) => {
      await ctx.api.contacts.delete(input.id);
      return { ok: true as const };
    }),

  restore: t.procedure
    .input(ContactRestoreInputSchema)
    .output(ContactRestoreOutputSchema)
    .meta({ description: "Restore a soft-deleted contact." })
    .mutation(async ({ ctx, input }) => {
      const c = await ctx.api.contacts.restore(input.id);
      if (!c) throw new TRPCError({ code: "NOT_FOUND" });
      return c;
    }),

  listTags: t.procedure
    .output(ContactListTagsOutputSchema)
    .meta({ description: "List all contact tags." })
    .query(async ({ ctx }) => ctx.api.contacts.tags.list()),
});
