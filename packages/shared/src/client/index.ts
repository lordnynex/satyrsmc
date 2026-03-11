// Typed tRPC client and provider (shared by app-admin and app-public)
export { trpc, createTrpcClient, type TrpcClient } from "./trpc";
export { TrpcClientProvider, useTrpcClient } from "./trpcClientContext";

// Router output/input inference
export type { RouterOutputs, RouterInputs } from "./routerTypes";

// Helpers
export { unwrap, getErrorMessage } from "./helpers";

// Client-only constants and state types (no DTO enum changes)
export { ALL_MEMBERS_ID, MEMBER_POSITIONS, type MemberPosition } from "./constants";
export type {
  Inputs,
  LineItem,
  AttendanceScenarios,
  BadgerBudgetState,
  ScenarioKey,
  ScenarioMetrics,
} from "./budget-state";

// Type aliases for names used by app-admin (MeetingSummary, CommitteeSummary, etc.)
export type {
  MeetingSummary,
  MeetingDetail,
  OldBusinessItemWithMeeting,
  MotionsListResponse,
  MeetingTemplate,
  MeetingMotion,
  MotionWithMeeting,
  MeetingActionItem,
  OldBusinessItem,
  EventType,
  Event,
  EventPhoto,
  EventAsset,
  Incident,
  RideScheduleItem,
  EventPackingCategory,
  EventPackingItem,
  EventVolunteer,
  EventAssignment,
  EventPlanningMilestone,
  EventAttendee,
  RideMemberAttendee,
  EventAssignmentCategory,
  CommitteeSummary,
  CommitteeDetail,
  CommitteeMeetingSummary,
  CommitteeMeetingDetail,
  Document,
  DocumentVersion,
  Budget,
  BudgetSummary,
  Scenario,
  ScenarioSummary,
} from "./type-aliases";

// Re-export DTO types so frontends can import from one place
export * from "../dto";
