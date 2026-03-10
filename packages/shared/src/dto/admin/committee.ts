import { z } from "zod";

const dateLike = z.union([z.string(), z.date().transform((d) => d.toISOString())]);

// ----- Input schemas -----

export const CommitteeListInputSchema = z
  .object({ sort: z.enum(["formed_date", "name"]).optional() })
  .optional();

export const CommitteeGetInputSchema = z.object({ id: z.string() });

export const CommitteeCreateInputSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  purpose: z.string().optional(),
  formed_date: z.string(),
  closed_date: z.string().optional(),
  chairperson_member_id: z.string().optional(),
});

const CommitteeUpdateFieldsSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  purpose: z.string().optional(),
  formed_date: z.string().optional(),
  closed_date: z.string().optional(),
  chairperson_member_id: z.string().optional(),
});

export const CommitteeUpdateInputSchema = z.object({ id: z.string() }).merge(CommitteeUpdateFieldsSchema);

export const CommitteeDeleteInputSchema = z.object({ id: z.string() });

export const CommitteeAddMemberInputSchema = z.object({
  committeeId: z.string(),
  memberId: z.string(),
});

export const CommitteeRemoveMemberInputSchema = z.object({
  committeeId: z.string(),
  memberId: z.string(),
});

export const CommitteeReorderMembersInputSchema = z.object({
  committeeId: z.string(),
  memberIds: z.array(z.string()),
});

export const CommitteeListMeetingsInputSchema = z.object({ committeeId: z.string() });

export const CommitteeCreateMeetingInputSchema = z.object({
  committeeId: z.string(),
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
});

export const CommitteeGetMeetingInputSchema = z.object({
  committeeId: z.string(),
  meetingId: z.string(),
});

export const CommitteeUpdateMeetingInputSchema = z.object({
  committeeId: z.string(),
  meetingId: z.string(),
  date: z.string().optional(),
  meeting_number: z.number().optional(),
  location: z.string().nullable().optional(),
  start_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
  video_conference_url: z.string().nullable().optional(),
  previous_meeting_id: z.string().nullable().optional(),
  agenda_content: z.string().optional(),
  minutes_content: z.string().nullable().optional(),
  agenda_template_id: z.string().optional(),
});

export const CommitteeDeleteMeetingInputSchema = z.object({
  committeeId: z.string(),
  meetingId: z.string(),
});

// ----- Output entity schemas -----

const CommitteeSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  purpose: z.string().nullable().optional(),
  formed_date: dateLike.optional(),
  closed_date: dateLike.nullable().optional(),
  chairperson_member_id: z.string().nullable().optional(),
  status: z.enum(["active", "closed"]).optional(),
  created_at: dateLike.optional(),
  updated_at: dateLike.optional(),
  member_count: z.number().optional(),
  meeting_count: z.number().optional(),
  chairperson_name: z.string().nullable().optional(),
  members: z.array(z.unknown()).optional(),
  meetings: z.array(z.unknown()).optional(),
});

const CommitteeMeetingDetailSchema = z.object({
  id: z.string(),
  committee_id: z.string().optional(),
  date: dateLike.optional(),
  meeting_number: z.number().optional(),
  location: z.string().nullable().optional(),
  start_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
  video_conference_url: z.string().nullable().optional(),
  previous_meeting_id: z.string().nullable().optional(),
  agenda_document_id: z.string().optional(),
  minutes_document_id: z.string().nullable().optional(),
  agenda_content: z.string().optional(),
  minutes_content: z.string().nullable().optional(),
  created_at: dateLike.optional(),
  updated_at: dateLike.optional(),
});

const MeetingSummarySchema = z.object({
  id: z.string(),
  date: dateLike.optional(),
  meeting_number: z.number().optional(),
  location: z.string().nullable().optional(),
  start_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
  video_conference_url: z.string().nullable().optional(),
  previous_meeting_id: z.string().nullable().optional(),
  agenda_document_id: z.string().optional(),
  minutes_document_id: z.string().nullable().optional(),
  agenda_content: z.string().optional(),
  minutes_content: z.string().nullable().optional(),
  created_at: dateLike.optional(),
  updated_at: dateLike.optional(),
});

// ----- Procedure output schemas -----

export const CommitteeListOutputSchema = z.array(CommitteeSummarySchema);
export const CommitteeGetOutputSchema = CommitteeSummarySchema;
export const CommitteeCreateOutputSchema = CommitteeSummarySchema;
export const CommitteeUpdateOutputSchema = CommitteeSummarySchema;
export const CommitteeDeleteOutputSchema = z.object({ ok: z.literal(true) });
export const CommitteeAddMemberOutputSchema = CommitteeSummarySchema;
export const CommitteeRemoveMemberOutputSchema = CommitteeSummarySchema.nullable();
export const CommitteeReorderMembersOutputSchema = CommitteeSummarySchema.nullable();
export const CommitteeListMeetingsOutputSchema = z.array(MeetingSummarySchema);
export const CommitteeCreateMeetingOutputSchema = CommitteeMeetingDetailSchema;
export const CommitteeGetMeetingOutputSchema = CommitteeMeetingDetailSchema;
export const CommitteeUpdateMeetingOutputSchema = CommitteeMeetingDetailSchema;
export const CommitteeDeleteMeetingOutputSchema = z.boolean();

// ----- Inferred output types -----

export type CommitteeListOutput = z.infer<typeof CommitteeListOutputSchema>;
export type CommitteeGetOutput = z.infer<typeof CommitteeGetOutputSchema>;
export type CommitteeCreateOutput = z.infer<typeof CommitteeCreateOutputSchema>;
export type CommitteeUpdateOutput = z.infer<typeof CommitteeUpdateOutputSchema>;
export type CommitteeDeleteOutput = z.infer<typeof CommitteeDeleteOutputSchema>;
export type CommitteeAddMemberOutput = z.infer<typeof CommitteeAddMemberOutputSchema>;
export type CommitteeRemoveMemberOutput = z.infer<typeof CommitteeRemoveMemberOutputSchema>;
export type CommitteeReorderMembersOutput = z.infer<typeof CommitteeReorderMembersOutputSchema>;
export type CommitteeListMeetingsOutput = z.infer<typeof CommitteeListMeetingsOutputSchema>;
export type CommitteeCreateMeetingOutput = z.infer<typeof CommitteeCreateMeetingOutputSchema>;
export type CommitteeGetMeetingOutput = z.infer<typeof CommitteeGetMeetingOutputSchema>;
export type CommitteeUpdateMeetingOutput = z.infer<typeof CommitteeUpdateMeetingOutputSchema>;
export type CommitteeDeleteMeetingOutput = z.infer<typeof CommitteeDeleteMeetingOutputSchema>;
