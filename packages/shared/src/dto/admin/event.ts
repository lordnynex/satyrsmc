import { z } from "zod";
import { EVENT_TYPES, EVENT_ASSIGNMENT_CATEGORIES } from "../../lib/enums";

const dateLike = z.union([z.string(), z.date().transform((d) => d.toISOString())]);

const eventTypeSchema = z.enum(EVENT_TYPES);

// ----- Input schemas -----

export const EventListInputSchema = z.object({ type: eventTypeSchema.optional() }).optional();

export const EventGetInputSchema = z.object({ id: z.string() });

export const EventCreateInputSchema = z.object({
  name: z.string(),
  event_type: eventTypeSchema.optional(),
  description: z.string().optional(),
  year: z.number().optional(),
  event_date: z.string().optional(),
  event_url: z.string().optional(),
  event_location: z.string().optional(),
  event_location_embed: z.string().optional(),
  ga_ticket_cost: z.number().optional(),
  day_pass_cost: z.number().optional(),
  ga_tickets_sold: z.number().optional(),
  day_passes_sold: z.number().optional(),
  budget_id: z.string().optional(),
  scenario_id: z.string().optional(),
  planning_notes: z.string().optional(),
  start_location: z.string().optional(),
  end_location: z.string().optional(),
  facebook_event_url: z.string().optional(),
  pre_ride_event_id: z.string().optional(),
  ride_cost: z.number().optional(),
  show_on_website: z.boolean().optional(),
});

export const EventUpdateInputSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  event_type: eventTypeSchema.nullable().optional(),
  description: z.string().nullable().optional(),
  year: z.number().nullable().optional(),
  event_date: z.string().nullable().optional(),
  event_url: z.string().nullable().optional(),
  event_location: z.string().nullable().optional(),
  event_location_embed: z.string().nullable().optional(),
  ga_ticket_cost: z.number().nullable().optional(),
  day_pass_cost: z.number().nullable().optional(),
  ga_tickets_sold: z.number().nullable().optional(),
  day_passes_sold: z.number().nullable().optional(),
  budget_id: z.string().nullable().optional(),
  scenario_id: z.string().nullable().optional(),
  planning_notes: z.string().nullable().optional(),
  show_on_website: z.boolean().optional(),
});

export const EventDeleteInputSchema = z.object({ id: z.string() });

export const EventAddPhotoInputSchema = z.object({ eventId: z.string(), imageBase64: z.string() });
export const EventDeletePhotoInputSchema = z.object({ eventId: z.string(), photoId: z.string() });
export const EventAddAssetInputSchema = z.object({ eventId: z.string(), imageBase64: z.string() });
export const EventDeleteAssetInputSchema = z.object({ eventId: z.string(), assetId: z.string() });

export const EventAddAttendeeInputSchema = z.object({
  eventId: z.string(),
  contact_id: z.string(),
  waiver_signed: z.boolean().optional(),
});
export const EventUpdateAttendeeInputSchema = z.object({
  eventId: z.string(),
  attendeeId: z.string(),
  waiver_signed: z.boolean().optional(),
});
export const EventDeleteAttendeeInputSchema = z.object({
  eventId: z.string(),
  attendeeId: z.string(),
});

export const EventAddMemberAttendeeInputSchema = z.object({
  eventId: z.string(),
  member_id: z.string(),
  waiver_signed: z.boolean().optional(),
});
export const EventUpdateMemberAttendeeInputSchema = z.object({
  eventId: z.string(),
  memberAttendeeId: z.string(),
  waiver_signed: z.boolean().optional(),
});
export const EventDeleteMemberAttendeeInputSchema = z.object({
  eventId: z.string(),
  memberAttendeeId: z.string(),
});

export const EventCreateIncidentInputSchema = z.object({
  eventId: z.string(),
  type: z.string(),
  severity: z.string(),
  summary: z.string(),
  details: z.string().optional(),
  occurred_at: z.string().optional(),
  contact_id: z.string().optional(),
  member_id: z.string().optional(),
});
export const EventUpdateIncidentInputSchema = z.object({
  eventId: z.string(),
  incidentId: z.string(),
  type: z.string().optional(),
  severity: z.string().optional(),
  summary: z.string().optional(),
  details: z.string().optional(),
  occurred_at: z.string().nullable().optional(),
  contact_id: z.string().nullable().optional(),
  member_id: z.string().nullable().optional(),
});
export const EventDeleteIncidentInputSchema = z.object({
  eventId: z.string(),
  incidentId: z.string(),
});

export const EventCreateScheduleItemInputSchema = z.object({
  eventId: z.string(),
  scheduled_time: z.string(),
  label: z.string(),
  location: z.string().optional(),
});
export const EventUpdateScheduleItemInputSchema = z.object({
  eventId: z.string(),
  scheduleId: z.string(),
  scheduled_time: z.string().optional(),
  label: z.string().optional(),
  location: z.string().nullable().optional(),
});
export const EventDeleteScheduleItemInputSchema = z.object({
  eventId: z.string(),
  scheduleId: z.string(),
});

export const EventCreateMilestoneInputSchema = z.object({
  eventId: z.string(),
  month: z.number(),
  year: z.number(),
  description: z.string(),
  due_date: z.string().optional(),
});
export const EventUpdateMilestoneInputSchema = z.object({
  eventId: z.string(),
  mid: z.string(),
  month: z.number().optional(),
  year: z.number().optional(),
  description: z.string().optional(),
  completed: z.boolean().optional(),
  due_date: z.string().optional(),
});
export const EventDeleteMilestoneInputSchema = z.object({ eventId: z.string(), mid: z.string() });
export const EventAddMilestoneMemberInputSchema = z.object({
  eventId: z.string(),
  mid: z.string(),
  memberId: z.string(),
});
export const EventRemoveMilestoneMemberInputSchema = z.object({
  eventId: z.string(),
  mid: z.string(),
  memberId: z.string(),
});

export const EventCreatePackingCategoryInputSchema = z.object({
  eventId: z.string(),
  name: z.string(),
});
export const EventUpdatePackingCategoryInputSchema = z.object({
  eventId: z.string(),
  cid: z.string(),
  name: z.string().optional(),
});
export const EventDeletePackingCategoryInputSchema = z.object({
  eventId: z.string(),
  cid: z.string(),
});

export const EventCreatePackingItemInputSchema = z.object({
  eventId: z.string(),
  category_id: z.string(),
  name: z.string(),
  quantity: z.number().optional(),
  note: z.string().optional(),
});
export const EventUpdatePackingItemInputSchema = z.object({
  eventId: z.string(),
  pid: z.string(),
  category_id: z.string().optional(),
  name: z.string().optional(),
  quantity: z.number().optional(),
  note: z.string().optional(),
  loaded: z.boolean().optional(),
});
export const EventDeletePackingItemInputSchema = z.object({ eventId: z.string(), pid: z.string() });

export const EventCreateVolunteerInputSchema = z.object({
  eventId: z.string(),
  name: z.string(),
  department: z.string(),
});
export const EventUpdateVolunteerInputSchema = z.object({
  eventId: z.string(),
  vid: z.string(),
  name: z.string().optional(),
  department: z.string().optional(),
});
export const EventDeleteVolunteerInputSchema = z.object({ eventId: z.string(), vid: z.string() });

export const EventCreateAssignmentInputSchema = z.object({
  eventId: z.string(),
  name: z.string(),
  category: z.enum(EVENT_ASSIGNMENT_CATEGORIES),
});
export const EventUpdateAssignmentInputSchema = z.object({
  eventId: z.string(),
  aid: z.string(),
  name: z.string().optional(),
  category: z.enum(EVENT_ASSIGNMENT_CATEGORIES).optional(),
});
export const EventDeleteAssignmentInputSchema = z.object({ eventId: z.string(), aid: z.string() });
export const EventAddAssignmentMemberInputSchema = z.object({
  eventId: z.string(),
  aid: z.string(),
  memberId: z.string(),
});
export const EventRemoveAssignmentMemberInputSchema = z.object({
  eventId: z.string(),
  aid: z.string(),
  memberId: z.string(),
});

// ----- Output entity schemas -----

const MemberRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  photo_url: z.string().nullable().optional(),
  photo_thumbnail_url: z.string().nullable().optional(),
});

const ContactRefSchema = z.object({
  id: z.string(),
  display_name: z.string(),
});

const MilestoneMemberSchema = z.object({
  id: z.string(),
  milestone_id: z.string(),
  member_id: z.string(),
  sort_order: z.number(),
  member: MemberRefSchema.optional(),
});

const AssignmentMemberSchema = z.object({
  id: z.string(),
  assignment_id: z.string(),
  member_id: z.string(),
  sort_order: z.number(),
  member: MemberRefSchema.optional(),
});

const EventPhotoSchema = z.object({
  id: z.string(),
  event_id: z.string(),
  sort_order: z.number(),
  photo_url: z.string(),
  photo_thumbnail_url: z.string(),
  photo_display_url: z.string(),
  created_at: z.string().optional(),
});

const EventAssetSchema = z.object({
  id: z.string(),
  event_id: z.string(),
  sort_order: z.number(),
  photo_url: z.string(),
  photo_thumbnail_url: z.string(),
  photo_display_url: z.string(),
  created_at: z.string().optional(),
});

const EventAttendeeSchema = z.object({
  id: z.string(),
  event_id: z.string(),
  contact_id: z.string(),
  sort_order: z.number(),
  waiver_signed: z.boolean(),
  contact: ContactRefSchema.optional(),
});

const RideMemberAttendeeSchema = z.object({
  id: z.string(),
  event_id: z.string(),
  member_id: z.string(),
  sort_order: z.number(),
  waiver_signed: z.boolean(),
  member: z
    .object({
      id: z.string(),
      name: z.string(),
      photo_thumbnail_url: z.string().nullable(),
    })
    .optional(),
});

const IncidentSchema = z.object({
  id: z.string(),
  event_id: z.string(),
  contact_id: z.string().nullable(),
  member_id: z.string().nullable(),
  type: z.string(),
  severity: z.string(),
  summary: z.string(),
  details: z.string().nullable(),
  occurred_at: z.string().nullable(),
  created_at: z.string().optional(),
  contact: ContactRefSchema.optional(),
  member: z.object({ id: z.string(), name: z.string() }).optional(),
  event_name: z.string().optional(),
  event_type: z.string().optional(),
});

const RideScheduleItemSchema = z.object({
  id: z.string(),
  event_id: z.string(),
  scheduled_time: z.string(),
  label: z.string(),
  location: z.string().nullable(),
  sort_order: z.number(),
});

const EventPlanningMilestoneSchema = z.object({
  id: z.string(),
  event_id: z.string().optional(),
  month: z.number().optional(),
  year: z.number().optional(),
  description: z.string().optional(),
  sort_order: z.number().optional(),
  completed: z.boolean().optional(),
  due_date: dateLike.optional().nullable(),
  members: z.array(MilestoneMemberSchema).optional(),
});

const EventPackingCategorySchema = z.object({
  id: z.string(),
  event_id: z.string(),
  name: z.string(),
  sort_order: z.number(),
});

const EventPackingItemSchema = z.object({
  id: z.string(),
  event_id: z.string(),
  category_id: z.string(),
  name: z.string(),
  sort_order: z.number(),
  quantity: z.number().nullable().optional(),
  note: z.string().nullable().optional(),
  loaded: z.boolean().optional(),
});

const EventVolunteerSchema = z.object({
  id: z.string(),
  event_id: z.string(),
  name: z.string(),
  department: z.string(),
  sort_order: z.number(),
});

const EventAssignmentSchema = z.object({
  id: z.string(),
  event_id: z.string(),
  name: z.string(),
  category: z.enum(EVENT_ASSIGNMENT_CATEGORIES),
  sort_order: z.number(),
  members: z.array(AssignmentMemberSchema).optional(),
});

const EventSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  year: z.number().nullable(),
  event_date: z.string().nullable(),
  event_url: z.string().nullable(),
  event_location: z.string().nullable(),
  event_location_embed: z.string().nullable(),
  ga_ticket_cost: z.number().nullable(),
  day_pass_cost: z.number().nullable(),
  ga_tickets_sold: z.number().nullable(),
  day_passes_sold: z.number().nullable(),
  budget_id: z.string().nullable(),
  scenario_id: z.string().nullable(),
  planning_notes: z.string().nullable(),
  event_type: z.enum(EVENT_TYPES),
  show_on_website: z.boolean().optional(),
  start_location: z.string().nullable().optional(),
  end_location: z.string().nullable().optional(),
  facebook_event_url: z.string().nullable().optional(),
  pre_ride_event_id: z.string().nullable().optional(),
  ride_cost: z.number().nullable().optional(),
  created_at: z.string().optional(),
  milestones: z.array(EventPlanningMilestoneSchema).optional(),
  event_attendees: z.array(EventAttendeeSchema).optional(),
  ride_member_attendees: z.array(RideMemberAttendeeSchema).optional(),
  event_assets: z.array(EventAssetSchema).optional(),
  ride_schedule_items: z.array(RideScheduleItemSchema).optional(),
  incidents: z.array(IncidentSchema).optional(),
  packingCategories: z.array(EventPackingCategorySchema).optional(),
  packingItems: z.array(EventPackingItemSchema).optional(),
  volunteers: z.array(EventVolunteerSchema).optional(),
  assignments: z.array(EventAssignmentSchema).optional(),
  event_photos: z.array(EventPhotoSchema).optional(),
});

// ----- Procedure output schemas -----

export const EventListOutputSchema = z.array(EventSchema);
export const EventGetOutputSchema = EventSchema;
export const EventCreateOutputSchema = EventSchema;
export const EventUpdateOutputSchema = EventSchema;
export const EventDeleteOutputSchema = z.object({ ok: z.literal(true) });
export const EventAddPhotoOutputSchema = EventPhotoSchema;
export const EventDeletePhotoOutputSchema = z.object({ ok: z.literal(true) });
export const EventAddAssetOutputSchema = EventAssetSchema;
export const EventDeleteAssetOutputSchema = z.object({ ok: z.literal(true) });
export const EventAddAttendeeOutputSchema = EventAttendeeSchema;
export const EventUpdateAttendeeOutputSchema = EventAttendeeSchema;
export const EventDeleteAttendeeOutputSchema = z.object({ ok: z.literal(true) });
export const EventAddMemberAttendeeOutputSchema = RideMemberAttendeeSchema;
export const EventUpdateMemberAttendeeOutputSchema = RideMemberAttendeeSchema;
export const EventDeleteMemberAttendeeOutputSchema = z.object({ ok: z.literal(true) });
export const EventCreateIncidentOutputSchema = IncidentSchema;
export const EventUpdateIncidentOutputSchema = IncidentSchema;
export const EventDeleteIncidentOutputSchema = z.object({ ok: z.literal(true) });
export const EventCreateScheduleItemOutputSchema = RideScheduleItemSchema;
export const EventUpdateScheduleItemOutputSchema = RideScheduleItemSchema;
export const EventDeleteScheduleItemOutputSchema = z.object({ ok: z.literal(true) });
export const EventCreateMilestoneOutputSchema = EventPlanningMilestoneSchema;
export const EventUpdateMilestoneOutputSchema = EventPlanningMilestoneSchema;
export const EventDeleteMilestoneOutputSchema = z.object({ ok: z.literal(true) });
export const EventAddMilestoneMemberOutputSchema = EventSchema;
export const EventRemoveMilestoneMemberOutputSchema = z.object({ ok: z.literal(true) });
export const EventCreatePackingCategoryOutputSchema = EventPackingCategorySchema;
export const EventUpdatePackingCategoryOutputSchema = EventPackingCategorySchema;
export const EventDeletePackingCategoryOutputSchema = z.object({ ok: z.literal(true) });
export const EventCreatePackingItemOutputSchema = EventPackingItemSchema;
export const EventUpdatePackingItemOutputSchema = EventPackingItemSchema;
export const EventDeletePackingItemOutputSchema = z.object({ ok: z.literal(true) });
export const EventCreateVolunteerOutputSchema = EventVolunteerSchema;
export const EventUpdateVolunteerOutputSchema = EventVolunteerSchema;
export const EventDeleteVolunteerOutputSchema = z.object({ ok: z.literal(true) });
export const EventCreateAssignmentOutputSchema = EventAssignmentSchema;
export const EventUpdateAssignmentOutputSchema = EventAssignmentSchema;
export const EventDeleteAssignmentOutputSchema = z.object({ ok: z.literal(true) });
export const EventAddAssignmentMemberOutputSchema = EventSchema;
export const EventRemoveAssignmentMemberOutputSchema = z.object({ ok: z.literal(true) });

// ----- Inferred output types -----

export type EventListOutput = z.infer<typeof EventListOutputSchema>;
export type EventGetOutput = z.infer<typeof EventGetOutputSchema>;
export type EventCreateOutput = z.infer<typeof EventCreateOutputSchema>;
export type EventUpdateOutput = z.infer<typeof EventUpdateOutputSchema>;
export type EventDeleteOutput = z.infer<typeof EventDeleteOutputSchema>;
export type EventAddPhotoOutput = z.infer<typeof EventAddPhotoOutputSchema>;
export type EventDeletePhotoOutput = z.infer<typeof EventDeletePhotoOutputSchema>;
export type EventAddAssetOutput = z.infer<typeof EventAddAssetOutputSchema>;
export type EventDeleteAssetOutput = z.infer<typeof EventDeleteAssetOutputSchema>;
export type EventAddAttendeeOutput = z.infer<typeof EventAddAttendeeOutputSchema>;
export type EventUpdateAttendeeOutput = z.infer<typeof EventUpdateAttendeeOutputSchema>;
export type EventDeleteAttendeeOutput = z.infer<typeof EventDeleteAttendeeOutputSchema>;
export type EventAddMemberAttendeeOutput = z.infer<typeof EventAddMemberAttendeeOutputSchema>;
export type EventUpdateMemberAttendeeOutput = z.infer<typeof EventUpdateMemberAttendeeOutputSchema>;
export type EventDeleteMemberAttendeeOutput = z.infer<typeof EventDeleteMemberAttendeeOutputSchema>;
export type EventCreateIncidentOutput = z.infer<typeof EventCreateIncidentOutputSchema>;
export type EventUpdateIncidentOutput = z.infer<typeof EventUpdateIncidentOutputSchema>;
export type EventDeleteIncidentOutput = z.infer<typeof EventDeleteIncidentOutputSchema>;
export type EventCreateScheduleItemOutput = z.infer<typeof EventCreateScheduleItemOutputSchema>;
export type EventUpdateScheduleItemOutput = z.infer<typeof EventUpdateScheduleItemOutputSchema>;
export type EventDeleteScheduleItemOutput = z.infer<typeof EventDeleteScheduleItemOutputSchema>;
export type EventCreateMilestoneOutput = z.infer<typeof EventCreateMilestoneOutputSchema>;
export type EventUpdateMilestoneOutput = z.infer<typeof EventUpdateMilestoneOutputSchema>;
export type EventDeleteMilestoneOutput = z.infer<typeof EventDeleteMilestoneOutputSchema>;
export type EventAddMilestoneMemberOutput = z.infer<typeof EventAddMilestoneMemberOutputSchema>;
export type EventRemoveMilestoneMemberOutput = z.infer<
  typeof EventRemoveMilestoneMemberOutputSchema
>;
export type EventCreatePackingCategoryOutput = z.infer<
  typeof EventCreatePackingCategoryOutputSchema
>;
export type EventUpdatePackingCategoryOutput = z.infer<
  typeof EventUpdatePackingCategoryOutputSchema
>;
export type EventDeletePackingCategoryOutput = z.infer<
  typeof EventDeletePackingCategoryOutputSchema
>;
export type EventCreatePackingItemOutput = z.infer<typeof EventCreatePackingItemOutputSchema>;
export type EventUpdatePackingItemOutput = z.infer<typeof EventUpdatePackingItemOutputSchema>;
export type EventDeletePackingItemOutput = z.infer<typeof EventDeletePackingItemOutputSchema>;
export type EventCreateVolunteerOutput = z.infer<typeof EventCreateVolunteerOutputSchema>;
export type EventUpdateVolunteerOutput = z.infer<typeof EventUpdateVolunteerOutputSchema>;
export type EventDeleteVolunteerOutput = z.infer<typeof EventDeleteVolunteerOutputSchema>;
export type EventCreateAssignmentOutput = z.infer<typeof EventCreateAssignmentOutputSchema>;
export type EventUpdateAssignmentOutput = z.infer<typeof EventUpdateAssignmentOutputSchema>;
export type EventDeleteAssignmentOutput = z.infer<typeof EventDeleteAssignmentOutputSchema>;
export type EventAddAssignmentMemberOutput = z.infer<typeof EventAddAssignmentMemberOutputSchema>;
export type EventRemoveAssignmentMemberOutput = z.infer<
  typeof EventRemoveAssignmentMemberOutputSchema
>;

// Alias for API
export type Event = EventGetOutput;
