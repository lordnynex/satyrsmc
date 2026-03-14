// Typed tRPC client and provider (shared by app-members and app-public)
export { trpc, createTrpcClient, type TrpcClient } from "./trpc";
export { TrpcClientProvider, useTrpcClient } from "./trpcClientContext";

// Router output/input inference
export type { RouterOutputs, RouterInputs } from "./routerTypes";

// Helpers
export { unwrap, getErrorMessage } from "./helpers";

// Domain enums (single source of truth for string literal unions)
export * from "../lib/enums";

// Client-only constants and state types
export { ALL_MEMBERS_ID } from "./constants";
export type {
  Inputs,
  LineItem,
  AttendanceScenarios,
  BadgerBudgetState,
  ScenarioKey,
  ScenarioMetrics,
} from "./budget-state";

// Type aliases for names used by app-members (MeetingSummary, CommitteeSummary, etc.)
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

// Re-export DTO types only (no runtime Zod); use @satyrsmc/shared/dto for schemas
export type * from "../dto";
