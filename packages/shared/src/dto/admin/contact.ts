import { z } from "zod";

// ----- Input schemas -----

export const ContactListInputSchema = z
  .object({
    q: z.string().optional(),
    status: z.enum(["active", "deleted", "all"]).optional(),
    hasPostalAddress: z.boolean().optional(),
    hasEmail: z.boolean().optional(),
    tagIds: z.array(z.string()).optional(),
    organization: z.string().optional(),
    role: z.string().optional(),
    hellenic: z.boolean().optional(),
    excludeDeceased: z.boolean().optional(),
    limit: z.number().optional(),
    offset: z.number().optional(),
    page: z.number().optional(),
    sort: z.string().optional(),
    sortDir: z.enum(["asc", "desc"]).optional(),
  })
  .optional();

export const ContactGetInputSchema = z.object({ id: z.string() });

const ContactCreateUpdateFieldsSchema = z.object({
  display_name: z.string().optional(),
  type: z.enum(["person", "organization"]).optional(),
  status: z.enum(["active", "inactive", "deleted"]).optional(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  organization_name: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  how_we_know_them: z.string().nullable().optional(),
  ok_to_email: z.enum(["yes", "no", "unknown"]).optional(),
  ok_to_mail: z.enum(["yes", "no", "unknown"]).optional(),
  ok_to_sms: z.enum(["yes", "no", "unknown"]).optional(),
  do_not_contact: z.boolean().optional(),
  club_name: z.string().nullable().optional(),
  role: z.string().nullable().optional(),
  uid: z.string().nullable().optional(),
  hellenic: z.boolean().optional(),
  deceased: z.boolean().optional(),
  deceased_year: z.number().nullable().optional(),
  emails: z.array(z.object({ email: z.string(), type: z.string(), is_primary: z.boolean().optional() })).optional(),
  phones: z.array(z.object({ phone: z.string(), type: z.string(), is_primary: z.boolean().optional() })).optional(),
  addresses: z
    .array(
      z.object({
        address_line1: z.string().nullable().optional(),
        address_line2: z.string().nullable().optional(),
        city: z.string().nullable().optional(),
        state: z.string().nullable().optional(),
        postal_code: z.string().nullable().optional(),
        country: z.string().nullable().optional(),
        type: z.string().optional(),
        is_primary_mailing: z.boolean().optional(),
      })
    )
    .optional(),
  emergency_contacts: z.array(z.object({ name: z.string(), phone: z.string(), email: z.string().nullable().optional(), relationship: z.string().nullable().optional() })).optional(),
  tagIds: z.array(z.string()).optional(),
});

export const ContactCreateInputSchema = z.object({ display_name: z.string() }).merge(ContactCreateUpdateFieldsSchema);

export const ContactUpdateInputSchema = z.object({ id: z.string() }).merge(ContactCreateUpdateFieldsSchema);

export const ContactDeleteInputSchema = z.object({ id: z.string() });

export const ContactRestoreInputSchema = z.object({ id: z.string() });

// ----- Output entity schemas (minimal for list; full Contact is complex) -----

const ContactSchema = z.object({
  id: z.string(),
  type: z.enum(["person", "organization"]),
  status: z.enum(["active", "inactive", "deleted"]),
  display_name: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  organization_name: z.string().nullable(),
  notes: z.string().nullable(),
  how_we_know_them: z.string().nullable(),
  ok_to_email: z.enum(["yes", "no", "unknown"]),
  ok_to_mail: z.enum(["yes", "no", "unknown"]),
  ok_to_sms: z.enum(["yes", "no", "unknown"]),
  do_not_contact: z.boolean(),
  club_name: z.string().nullable(),
  role: z.string().nullable(),
  uid: z.string().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
  deleted_at: z.string().nullable().optional(),
  hellenic: z.boolean().optional(),
  deceased: z.boolean().optional(),
  deceased_year: z.number().nullable().optional(),
  emails: z.array(z.object({ id: z.string(), contact_id: z.string(), email: z.string(), type: z.string(), is_primary: z.boolean() })).optional(),
  phones: z.array(z.object({ id: z.string(), contact_id: z.string(), phone: z.string(), type: z.string(), is_primary: z.boolean() })).optional(),
  addresses: z.array(z.object({ id: z.string(), contact_id: z.string(), address_line1: z.string().nullable(), address_line2: z.string().nullable(), city: z.string().nullable(), state: z.string().nullable(), postal_code: z.string().nullable(), country: z.string().nullable(), type: z.string(), is_primary_mailing: z.boolean() })).optional(),
  emergency_contacts: z.array(z.object({ id: z.string(), contact_id: z.string(), name: z.string(), phone: z.string(), email: z.string().nullable(), relationship: z.string().nullable() })).optional(),
  tags: z.array(z.object({ id: z.string(), name: z.string() })).optional(),
  contact_photos: z.array(z.unknown()).optional(),
  contact_notes: z.array(z.unknown()).optional(),
});

const TagSchema = z.object({ id: z.string(), name: z.string() });

const ContactListResultSchema = z.object({
  contacts: z.array(ContactSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

// ----- Procedure output schemas -----

export const ContactListOutputSchema = ContactListResultSchema;
export const ContactGetOutputSchema = ContactSchema;
export const ContactCreateOutputSchema = ContactSchema;
export const ContactUpdateOutputSchema = ContactSchema;
export const ContactDeleteOutputSchema = z.object({ ok: z.literal(true) });
export const ContactRestoreOutputSchema = ContactSchema;
export const ContactListTagsOutputSchema = z.array(TagSchema);

// ----- Inferred output types -----

export type ContactListOutput = z.infer<typeof ContactListOutputSchema>;
export type ContactGetOutput = z.infer<typeof ContactGetOutputSchema>;
export type ContactCreateOutput = z.infer<typeof ContactCreateOutputSchema>;
export type ContactUpdateOutput = z.infer<typeof ContactUpdateOutputSchema>;
export type ContactDeleteOutput = z.infer<typeof ContactDeleteOutputSchema>;
export type ContactRestoreOutput = z.infer<typeof ContactRestoreOutputSchema>;
export type ContactListTagsOutput = z.infer<typeof ContactListTagsOutputSchema>;

// Aliases for API (procedure output types are the source of truth)
export type Contact = ContactGetOutput;
export type ContactSearchParams = z.infer<typeof ContactListInputSchema>;
export type ContactSearchResult = ContactListOutput;
export type Tag = z.infer<typeof TagSchema>;
export type ContactEmail = NonNullable<ContactGetOutput["emails"]>[number];
export type ContactPhone = NonNullable<ContactGetOutput["phones"]>[number];
export type ContactAddress = NonNullable<ContactGetOutput["addresses"]>[number];
export type ContactEmergencyContact = NonNullable<ContactGetOutput["emergency_contacts"]>[number];
export type ContactNote = { id: string; contact_id: string; content: string; created_at: string | null };
export type ContactPhoto = NonNullable<ContactGetOutput["contact_photos"]>[number];
