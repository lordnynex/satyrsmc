import { z } from "zod";
import {
  MOTION_RESULTS,
  ACTION_ITEM_STATUSES,
  OLD_BUSINESS_STATUSES,
  MEETING_TEMPLATE_TYPES,
  MEETING_SORT_FIELDS,
} from "../../lib/enums";

// ----- Input schemas (meetings) -----

export const MeetingListInputSchema = z
  .object({ sort: z.enum(MEETING_SORT_FIELDS).optional() })
  .optional();

export const MeetingGetInputSchema = z.object({ id: z.string() });

export const MeetingCreateInputSchema = z.object({
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

const MeetingUpdateFieldsSchema = z.object({
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

export const MeetingUpdateInputSchema = z
  .object({ id: z.string() })
  .merge(MeetingUpdateFieldsSchema);

export const MeetingDeleteInputSchema = z.object({
  id: z.string(),
  delete_agenda: z.boolean().optional(),
  delete_minutes: z.boolean().optional(),
});

export const MeetingListMotionsInputSchema = z
  .object({
    page: z.number().optional(),
    per_page: z.number().optional(),
    q: z.string().optional(),
  })
  .optional();

export const MeetingCreateMotionInputSchema = z.object({
  meetingId: z.string(),
  description: z.string().nullable().optional(),
  result: z.enum(MOTION_RESULTS),
  order_index: z.number().optional(),
  mover_member_id: z.string(),
  seconder_member_id: z.string(),
});

export const MeetingUpdateMotionInputSchema = z.object({
  meetingId: z.string(),
  motionId: z.string(),
  description: z.string().nullable().optional(),
  result: z.enum(MOTION_RESULTS).optional(),
  order_index: z.number().optional(),
  mover_member_id: z.string().optional(),
  seconder_member_id: z.string().optional(),
});

export const MeetingDeleteMotionInputSchema = z.object({
  meetingId: z.string(),
  motionId: z.string(),
});

export const MeetingCreateActionItemInputSchema = z.object({
  meetingId: z.string(),
  description: z.string(),
  assignee_member_id: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  order_index: z.number().optional(),
});

export const MeetingUpdateActionItemInputSchema = z.object({
  meetingId: z.string(),
  actionItemId: z.string(),
  description: z.string().optional(),
  assignee_member_id: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  order_index: z.number().optional(),
  status: z.enum(ACTION_ITEM_STATUSES).optional(),
  completed_at: z.string().nullable().optional(),
});

export const MeetingDeleteActionItemInputSchema = z.object({
  meetingId: z.string(),
  actionItemId: z.string(),
});

export const MeetingCreateOldBusinessInputSchema = z.object({
  meetingId: z.string(),
  description: z.string(),
  order_index: z.number().optional(),
});

export const MeetingUpdateOldBusinessInputSchema = z.object({
  meetingId: z.string(),
  oldBusinessId: z.string(),
  description: z.string().optional(),
  status: z.enum(OLD_BUSINESS_STATUSES).optional(),
  closed_at: z.string().nullable().optional(),
  closed_in_meeting_id: z.string().nullable().optional(),
  order_index: z.number().optional(),
});

export const MeetingDeleteOldBusinessInputSchema = z.object({
  meetingId: z.string(),
  oldBusinessId: z.string(),
});

// ----- Input schemas (meetingTemplates) -----

export const MeetingTemplateListInputSchema = z
  .object({ type: z.enum(MEETING_TEMPLATE_TYPES).optional() })
  .optional();

export const MeetingTemplateGetInputSchema = z.object({ id: z.string() });

export const MeetingTemplateCreateInputSchema = z.object({
  name: z.string(),
  type: z.enum(MEETING_TEMPLATE_TYPES),
  content: z.string(),
});

export const MeetingTemplateUpdateInputSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  content: z.string().optional(),
});

export const MeetingTemplateDeleteInputSchema = z.object({ id: z.string() });

// ----- Output entity schemas -----

const dateLike = z.union([
  z.string(),
  z.date().transform((d) => (d instanceof Date ? d.toISOString().slice(0, 10) : "")),
]);

const MeetingSummarySchema = z.object({
  id: z.string(),
  date: dateLike,
  meeting_number: z.number(),
  location: z.string().nullable().optional(),
  start_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
  video_conference_url: z.string().nullable().optional(),
  previous_meeting_id: z.string().nullable().optional(),
  agenda_document_id: z.string().optional(),
  minutes_document_id: z.string().nullable().optional(),
  agenda_content: z.string().optional(),
  minutes_content: z.string().nullable().optional(),
  motion_count: z.number().optional(),
  created_at: z.union([z.string(), z.date().transform((d) => d.toISOString())]).optional(),
  updated_at: z.union([z.string(), z.date().transform((d) => d.toISOString())]).optional(),
});

const MeetingMotionSchema = z.object({
  id: z.string(),
  meeting_id: z.string().optional(),
  description: z.string().nullable().optional(),
  result: z.enum(MOTION_RESULTS).optional(),
  order_index: z.number().optional(),
  mover_member_id: z.string().nullable().optional(),
  seconder_member_id: z.string().nullable().optional(),
  mover_name: z.string().nullable().optional(),
  seconder_name: z.string().nullable().optional(),
  created_at: z.union([z.string(), z.date()]).optional(),
});

const MotionWithMeetingSchema = MeetingMotionSchema.extend({
  meeting_date: z.string(),
  meeting_number: z.number(),
});

const MotionsListResponseSchema = z.object({
  items: z.array(MotionWithMeetingSchema),
  total: z.number(),
});

const MeetingActionItemSchema = z.object({
  id: z.string(),
  meeting_id: z.string().optional(),
  description: z.string().optional(),
  assignee_member_id: z.string().nullable().optional(),
  assignee_name: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  status: z.enum(ACTION_ITEM_STATUSES).optional(),
  completed_at: z.string().nullable().optional(),
  order_index: z.number().optional(),
  created_at: z.union([z.string(), z.date()]).optional(),
});

const OldBusinessItemSchema = z.object({
  id: z.string(),
  meeting_id: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(OLD_BUSINESS_STATUSES).optional(),
  closed_at: z.string().nullable().optional(),
  closed_in_meeting_id: z.string().nullable().optional(),
  order_index: z.number().optional(),
  created_at: z.union([z.string(), z.date()]).optional(),
  is_carried: z.boolean().optional(),
});

const OldBusinessItemWithMeetingSchema = OldBusinessItemSchema.extend({
  meeting_number: z.number().optional(),
  meeting_date: z.string().optional(),
});

const MeetingDetailSchema = MeetingSummarySchema.extend({
  motions: z.array(MeetingMotionSchema).optional().default([]),
  action_items: z.array(MeetingActionItemSchema).optional().default([]),
  old_business: z.array(OldBusinessItemSchema).optional().default([]),
});

const MeetingTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(MEETING_TEMPLATE_TYPES),
  document_id: z.string(),
  content: z.string(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// ----- Procedure output schemas (meetings) -----

export const MeetingListOutputSchema = z.array(MeetingSummarySchema);
export const MeetingGetOutputSchema = MeetingDetailSchema;
export const MeetingCreateOutputSchema = MeetingSummarySchema;
export const MeetingUpdateOutputSchema = MeetingSummarySchema;
export const MeetingDeleteOutputSchema = z.void();
export const MeetingListOldBusinessOutputSchema = z.array(OldBusinessItemWithMeetingSchema);
export const MeetingListMotionsOutputSchema = MotionsListResponseSchema;
export const MeetingCreateMotionOutputSchema = MeetingMotionSchema;
export const MeetingUpdateMotionOutputSchema = MeetingMotionSchema;
export const MeetingDeleteMotionOutputSchema = z.boolean();
export const MeetingCreateActionItemOutputSchema = MeetingActionItemSchema;
export const MeetingUpdateActionItemOutputSchema = MeetingActionItemSchema;
export const MeetingDeleteActionItemOutputSchema = z.boolean();
export const MeetingCreateOldBusinessOutputSchema = OldBusinessItemSchema;
export const MeetingUpdateOldBusinessOutputSchema = OldBusinessItemSchema;
export const MeetingDeleteOldBusinessOutputSchema = z.boolean();

// ----- Procedure output schemas (meetingTemplates) -----

export const MeetingTemplateListOutputSchema = z.array(MeetingTemplateSchema);
export const MeetingTemplateGetOutputSchema = MeetingTemplateSchema;
export const MeetingTemplateCreateOutputSchema = MeetingTemplateSchema;
export const MeetingTemplateUpdateOutputSchema = MeetingTemplateSchema;
export const MeetingTemplateDeleteOutputSchema = z.object({ ok: z.literal(true) });

// ----- Inferred output types -----

export type MeetingListOutput = z.infer<typeof MeetingListOutputSchema>;
export type MeetingGetOutput = z.infer<typeof MeetingGetOutputSchema>;
export type MeetingCreateOutput = z.infer<typeof MeetingCreateOutputSchema>;
export type MeetingUpdateOutput = z.infer<typeof MeetingUpdateOutputSchema>;
export type MeetingDeleteOutput = z.infer<typeof MeetingDeleteOutputSchema>;
export type MeetingListOldBusinessOutput = z.infer<typeof MeetingListOldBusinessOutputSchema>;
export type MeetingListMotionsOutput = z.infer<typeof MeetingListMotionsOutputSchema>;
export type MeetingCreateMotionOutput = z.infer<typeof MeetingCreateMotionOutputSchema>;
export type MeetingUpdateMotionOutput = z.infer<typeof MeetingUpdateMotionOutputSchema>;
export type MeetingDeleteMotionOutput = z.infer<typeof MeetingDeleteMotionOutputSchema>;
export type MeetingCreateActionItemOutput = z.infer<typeof MeetingCreateActionItemOutputSchema>;
export type MeetingUpdateActionItemOutput = z.infer<typeof MeetingUpdateActionItemOutputSchema>;
export type MeetingDeleteActionItemOutput = z.infer<typeof MeetingDeleteActionItemOutputSchema>;
export type MeetingCreateOldBusinessOutput = z.infer<typeof MeetingCreateOldBusinessOutputSchema>;
export type MeetingUpdateOldBusinessOutput = z.infer<typeof MeetingUpdateOldBusinessOutputSchema>;
export type MeetingDeleteOldBusinessOutput = z.infer<typeof MeetingDeleteOldBusinessOutputSchema>;
export type MeetingTemplateListOutput = z.infer<typeof MeetingTemplateListOutputSchema>;
export type MeetingTemplateGetOutput = z.infer<typeof MeetingTemplateGetOutputSchema>;
export type MeetingTemplateCreateOutput = z.infer<typeof MeetingTemplateCreateOutputSchema>;
export type MeetingTemplateUpdateOutput = z.infer<typeof MeetingTemplateUpdateOutputSchema>;
export type MeetingTemplateDeleteOutput = z.infer<typeof MeetingTemplateDeleteOutputSchema>;

// Alias for API
export type MeetingDetail = MeetingGetOutput;
