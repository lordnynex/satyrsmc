/**
 * Domain string enums — single source of truth for string literal unions.
 *
 * Pattern: define a `const` array, derive the TypeScript type from it.
 * DTOs consume these via `z.enum(CONST_ARRAY)`, entities via `import type`.
 */

// --- Meeting ---

export const MOTION_RESULTS = ["pass", "fail"] as const;
export type MotionResult = (typeof MOTION_RESULTS)[number];

export const ACTION_ITEM_STATUSES = ["open", "completed"] as const;
export type ActionItemStatus = (typeof ACTION_ITEM_STATUSES)[number];

export const OLD_BUSINESS_STATUSES = ["open", "closed"] as const;
export type OldBusinessStatus = (typeof OLD_BUSINESS_STATUSES)[number];

export const MEETING_TEMPLATE_TYPES = ["agenda", "minutes"] as const;
export type MeetingTemplateType = (typeof MEETING_TEMPLATE_TYPES)[number];

export const MEETING_SORT_FIELDS = ["date", "meeting_number"] as const;
export type MeetingSortField = (typeof MEETING_SORT_FIELDS)[number];

// --- Committee ---

export const COMMITTEE_STATUSES = ["active", "closed"] as const;
export type CommitteeStatus = (typeof COMMITTEE_STATUSES)[number];

export const COMMITTEE_SORT_FIELDS = ["formed_date", "name"] as const;
export type CommitteeSortField = (typeof COMMITTEE_SORT_FIELDS)[number];

// --- Event ---

export const EVENT_TYPES = ["badger", "anniversary", "pioneer_run", "rides"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_ASSIGNMENT_CATEGORIES = ["planning", "during"] as const;
export type EventAssignmentCategory = (typeof EVENT_ASSIGNMENT_CATEGORIES)[number];

// --- Contact ---

export const CONTACT_TYPES = ["person", "organization"] as const;
export type ContactType = (typeof CONTACT_TYPES)[number];

export const CONTACT_STATUSES = ["active", "inactive", "deleted"] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export const CONTACT_STATUS_FILTERS = ["active", "deleted", "all"] as const;
export type ContactStatusFilter = (typeof CONTACT_STATUS_FILTERS)[number];

export const CONSENT_STATUSES = ["yes", "no", "unknown"] as const;
export type ConsentStatus = (typeof CONSENT_STATUSES)[number];

export const SORT_DIRECTIONS = ["asc", "desc"] as const;
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

// --- Member ---

export const MEMBER_PHOTO_SIZES = ["thumbnail", "medium", "full"] as const;
export type MemberPhotoSize = (typeof MEMBER_PHOTO_SIZES)[number];

// --- Contact Photo ---

export const CONTACT_PHOTO_SIZES = ["thumbnail", "display", "full"] as const;
export type ContactPhotoSize = (typeof CONTACT_PHOTO_SIZES)[number];

// --- QR Code ---

export const QR_ERROR_CORRECTION_LEVELS = ["L", "M", "Q", "H"] as const;
export type QrErrorCorrectionLevel = (typeof QR_ERROR_CORRECTION_LEVELS)[number];

export const QR_FORMATS = ["png", "svg"] as const;
export type QrFormat = (typeof QR_FORMATS)[number];
