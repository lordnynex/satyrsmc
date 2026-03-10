export interface EventMilestoneMember {
  id: string;
  milestone_id: string;
  member_id: string;
  sort_order: number;
  member?: { id: string; name: string; photo_url: string | null; photo_thumbnail_url: string | null };
}

export interface EventPlanningMilestone {
  id: string;
  event_id: string;
  month: number;
  year: number;
  description: string;
  sort_order: number;
  completed: boolean;
  due_date: string;
  members?: EventMilestoneMember[];
}

export interface EventPackingCategory {
  id: string;
  event_id: string;
  name: string;
  sort_order: number;
}

export interface EventPackingItem {
  id: string;
  event_id: string;
  category_id: string;
  name: string;
  sort_order: number;
  quantity?: number | null;
  note?: string | null;
  loaded?: boolean;
}

export interface EventVolunteer {
  id: string;
  event_id: string;
  name: string;
  department: string;
  sort_order: number;
}

export type EventAssignmentCategory = "planning" | "during";

export interface EventAssignmentMember {
  id: string;
  assignment_id: string;
  member_id: string;
  sort_order: number;
  member?: { id: string; name: string; photo_url: string | null; photo_thumbnail_url: string | null };
}

export interface EventAssignment {
  id: string;
  event_id: string;
  name: string;
  category: EventAssignmentCategory;
  sort_order: number;
  members?: EventAssignmentMember[];
}

export interface EventAttendee {
  id: string;
  event_id: string;
  contact_id: string;
  sort_order: number;
  waiver_signed: boolean;
  contact?: { id: string; display_name: string };
}

export interface RideMemberAttendee {
  id: string;
  event_id: string;
  member_id: string;
  sort_order: number;
  waiver_signed: boolean;
  member?: { id: string; name: string; photo_thumbnail_url?: string | null };
}

export interface EventAsset {
  id: string;
  event_id: string;
  sort_order: number;
  photo_url: string;
  photo_thumbnail_url: string;
  photo_display_url: string;
  created_at?: string;
}

export interface RideScheduleItem {
  id: string;
  event_id: string;
  scheduled_time: string;
  label: string;
  location: string | null;
  sort_order: number;
}

export interface Incident {
  id: string;
  event_id: string;
  contact_id: string | null;
  member_id: string | null;
  type: string;
  severity: string;
  summary: string;
  details: string | null;
  occurred_at: string | null;
  created_at?: string;
  contact?: { id: string; display_name: string };
  member?: { id: string; name: string };
  event_name?: string;
  event_type?: EventType;
}

export interface EventPhoto {
  id: string;
  event_id: string;
  sort_order: number;
  photo_url: string;
  photo_thumbnail_url: string;
  photo_display_url: string;
  created_at?: string;
}

export type EventType = "badger" | "anniversary" | "pioneer_run" | "rides";

export interface Event {
  id: string;
  name: string;
  description: string | null;
  year: number | null;
  event_date: string | null;
  event_url: string | null;
  event_location: string | null;
  event_location_embed: string | null;
  ga_ticket_cost: number | null;
  day_pass_cost: number | null;
  ga_tickets_sold: number | null;
  day_passes_sold: number | null;
  budget_id: string | null;
  scenario_id: string | null;
  planning_notes: string | null;
  event_type: EventType;
  start_location?: string | null;
  end_location?: string | null;
  facebook_event_url?: string | null;
  pre_ride_event_id?: string | null;
  ride_cost?: number | null;
  created_at?: string;
  milestones?: EventPlanningMilestone[];
  event_attendees?: EventAttendee[];
  ride_member_attendees?: RideMemberAttendee[];
  event_assets?: EventAsset[];
  ride_schedule_items?: RideScheduleItem[];
   incidents?: Incident[];
  packingCategories?: EventPackingCategory[];
  packingItems?: EventPackingItem[];
  volunteers?: EventVolunteer[];
  assignments?: EventAssignment[];
  event_photos?: EventPhoto[];
}
