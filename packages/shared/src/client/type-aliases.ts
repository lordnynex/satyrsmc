/**
 * Type aliases for names used by app-admin that map to DTO output types.
 * Enables dropping shared/types while keeping existing component type imports.
 */

import type { EventGetOutput } from "@satyrsmc/shared/dto/admin/event";
import type {
  MeetingListOutput,
  MeetingListOldBusinessOutput,
  MeetingListMotionsOutput,
  MeetingTemplateGetOutput,
  MeetingCreateMotionOutput,
  MeetingCreateActionItemOutput,
  MeetingCreateOldBusinessOutput,
} from "@satyrsmc/shared/dto/admin/meeting";
import type {
  CommitteeListOutput,
  CommitteeGetOutput,
  CommitteeListMeetingsOutput,
  CommitteeGetMeetingOutput,
} from "@satyrsmc/shared/dto/admin/committee";
import type {
  DocumentGetOutput,
  DocumentGetVersionsOutput,
} from "@satyrsmc/shared/dto/admin/document";
import type { BudgetGetOutput, BudgetListOutput } from "@satyrsmc/shared/dto/admin/budget";
import type { ScenarioGetOutput, ScenarioListOutput } from "@satyrsmc/shared/dto/admin/scenario";

export type MeetingSummary = MeetingListOutput[number];
export type { MeetingDetail } from "@satyrsmc/shared/dto/admin/meeting";
export type OldBusinessItemWithMeeting = MeetingListOldBusinessOutput[number];
export type OldBusinessItem = MeetingCreateOldBusinessOutput;
export type MotionsListResponse = MeetingListMotionsOutput;
export type MotionWithMeeting = MeetingListMotionsOutput["items"][number];
export type MeetingMotion = MeetingCreateMotionOutput;
export type MeetingActionItem = MeetingCreateActionItemOutput;
export type MeetingTemplate = MeetingTemplateGetOutput;

export type CommitteeSummary = CommitteeListOutput[number];
export type CommitteeDetail = CommitteeGetOutput;
export type CommitteeMeetingSummary = CommitteeListMeetingsOutput[number];
export type CommitteeMeetingDetail = CommitteeGetMeetingOutput;

export type Document = DocumentGetOutput;
export type DocumentVersion = DocumentGetVersionsOutput[number];

export type Budget = BudgetGetOutput;
export type BudgetSummary = BudgetListOutput[number];

export type Scenario = ScenarioGetOutput;
export type ScenarioSummary = ScenarioListOutput[number];

// Event types (derived from shared enums)
export type { EventType, EventAssignmentCategory } from "../lib/enums";
export type Event = EventGetOutput;
export type EventPhoto = NonNullable<EventGetOutput["event_photos"]>[number];
export type EventAsset = NonNullable<EventGetOutput["event_assets"]>[number];
export type Incident = NonNullable<EventGetOutput["incidents"]>[number];
export type RideScheduleItem = NonNullable<EventGetOutput["ride_schedule_items"]>[number];
export type EventPackingCategory = NonNullable<EventGetOutput["packingCategories"]>[number];
export type EventPackingItem = NonNullable<EventGetOutput["packingItems"]>[number];
export type EventVolunteer = NonNullable<EventGetOutput["volunteers"]>[number];
export type EventAssignment = NonNullable<EventGetOutput["assignments"]>[number];
export type EventPlanningMilestone = NonNullable<EventGetOutput["milestones"]>[number];
export type EventAttendee = NonNullable<EventGetOutput["event_attendees"]>[number];
export type RideMemberAttendee = NonNullable<EventGetOutput["ride_member_attendees"]>[number];
