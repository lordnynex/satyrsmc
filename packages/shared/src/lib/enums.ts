/**
 * Domain string enums — single source of truth for string literal unions.
 *
 * Pattern: TypeScript string enums with Object.values() arrays for iteration.
 * DTOs consume these via `z.nativeEnum(Enum)`, entities via `@Column({ type: "enum", enum: Enum })`.
 */

// --- Meeting ---

export enum MotionResult {
  Pass = "pass",
  Fail = "fail",
}
export const MOTION_RESULTS = Object.values(MotionResult);

export enum ActionItemStatus {
  Open = "open",
  Completed = "completed",
}
export const ACTION_ITEM_STATUSES = Object.values(ActionItemStatus);

export enum OldBusinessStatus {
  Open = "open",
  Closed = "closed",
}
export const OLD_BUSINESS_STATUSES = Object.values(OldBusinessStatus);

export enum MeetingTemplateType {
  Agenda = "agenda",
  Minutes = "minutes",
}
export const MEETING_TEMPLATE_TYPES = Object.values(MeetingTemplateType);

export enum MeetingSortField {
  Date = "date",
  MeetingNumber = "meeting_number",
}
export const MEETING_SORT_FIELDS = Object.values(MeetingSortField);

// --- Committee ---

export enum CommitteeStatus {
  Active = "active",
  Closed = "closed",
}
export const COMMITTEE_STATUSES = Object.values(CommitteeStatus);

export enum CommitteeSortField {
  FormedDate = "formed_date",
  Name = "name",
}
export const COMMITTEE_SORT_FIELDS = Object.values(CommitteeSortField);

// --- Event ---

export enum EventType {
  Badger = "badger",
  Anniversary = "anniversary",
  PioneerRun = "pioneer_run",
  Rides = "rides",
}
export const EVENT_TYPES = Object.values(EventType);

export enum EventAssignmentCategory {
  Planning = "planning",
  During = "during",
}
export const EVENT_ASSIGNMENT_CATEGORIES = Object.values(EventAssignmentCategory);

// --- Contact ---

export enum ContactType {
  Person = "person",
  Organization = "organization",
}
export const CONTACT_TYPES = Object.values(ContactType);

export enum ContactStatus {
  Active = "active",
  Inactive = "inactive",
  Deleted = "deleted",
}
export const CONTACT_STATUSES = Object.values(ContactStatus);

export enum ContactStatusFilter {
  Active = "active",
  Deleted = "deleted",
  All = "all",
}
export const CONTACT_STATUS_FILTERS = Object.values(ContactStatusFilter);

export enum ConsentStatus {
  Yes = "yes",
  No = "no",
  Unknown = "unknown",
}
export const CONSENT_STATUSES = Object.values(ConsentStatus);

export enum SortDirection {
  Asc = "asc",
  Desc = "desc",
}
export const SORT_DIRECTIONS = Object.values(SortDirection);

// --- Contact Detail Types ---

export enum ContactPhotoType {
  Profile = "profile",
  Contact = "contact",
}
export const CONTACT_PHOTO_TYPES = Object.values(ContactPhotoType);

export enum ContactEmailType {
  Work = "work",
  Home = "home",
  Other = "other",
}
export const CONTACT_EMAIL_TYPES = Object.values(ContactEmailType);

export enum ContactPhoneType {
  Work = "work",
  Home = "home",
  Cell = "cell",
  Other = "other",
}
export const CONTACT_PHONE_TYPES = Object.values(ContactPhoneType);

export enum ContactAddressType {
  Home = "home",
  Work = "work",
  Postal = "postal",
  Other = "other",
}
export const CONTACT_ADDRESS_TYPES = Object.values(ContactAddressType);

// --- Member ---

export enum MemberPosition {
  President = "President",
  VicePresident = "Vice President",
  RoadCaptain = "Road Captain",
  Treasurer = "Treasurer",
  RecordingSecretary = "Recording Secretary",
  CorrespondenceSecretary = "Correspondence Secretary",
  Member = "Member",
}
export const MEMBER_POSITIONS = Object.values(MemberPosition);

export enum MemberPhotoSize {
  Thumbnail = "thumbnail",
  Medium = "medium",
  Full = "full",
}
export const MEMBER_PHOTO_SIZES = Object.values(MemberPhotoSize);

// --- Contact Photo Size ---

export enum ContactPhotoSize {
  Thumbnail = "thumbnail",
  Display = "display",
  Full = "full",
}
export const CONTACT_PHOTO_SIZES = Object.values(ContactPhotoSize);

// --- Mailing ---

export enum MailingListType {
  Static = "static",
  Dynamic = "dynamic",
  Hybrid = "hybrid",
}
export const MAILING_LIST_TYPES = Object.values(MailingListType);

export enum MailingDeliveryType {
  Physical = "physical",
  Email = "email",
  Both = "both",
}
export const MAILING_DELIVERY_TYPES = Object.values(MailingDeliveryType);

export enum MailingMemberSource {
  Manual = "manual",
  Import = "import",
  Rule = "rule",
}
export const MAILING_MEMBER_SOURCES = Object.values(MailingMemberSource);

export enum MailingRecipientStatus {
  Queued = "queued",
  Printed = "printed",
  Mailed = "mailed",
  Returned = "returned",
  Invalid = "invalid",
}
export const MAILING_RECIPIENT_STATUSES = Object.values(MailingRecipientStatus);

// --- User ---

export enum UserType {
  User = "user",
  Admin = "admin",
  Webmaster = "webmaster",
}
export const USER_TYPES = Object.values(UserType);

export enum UserStatus {
  Active = "active",
  Locked = "locked",
  Rejected = "rejected",
  Suspended = "suspended",
  Inactive = "inactive",
  Deactivated = "deactivated",
}
export const USER_STATUSES = Object.values(UserStatus);

// --- Attendee Status ---

export enum AttendeeStatus {
  Pending = "pending",
  Yes = "yes",
  No = "no",
}
export const ATTENDEE_STATUSES = Object.values(AttendeeStatus);

// --- QR Code ---

export enum QrErrorCorrectionLevel {
  L = "L",
  M = "M",
  Q = "Q",
  H = "H",
}
export const QR_ERROR_CORRECTION_LEVELS = Object.values(QrErrorCorrectionLevel);

export enum QrFormat {
  Png = "png",
  Svg = "svg",
}
export const QR_FORMATS = Object.values(QrFormat);

// --- Activity Log ---

export enum ActivityMessageCode {
  EventAttended = "event_attended",
  RunLed = "run_led",
  EventReviewSubmitted = "event_review_submitted",
  RunReportSubmitted = "run_report_submitted",
  GalleryPhotoSubmitted = "gallery_photo_submitted",
  GalleryPhotosSubmitted = "gallery_photos_submitted",
  ProfilePhotoSubmitted = "profile_photo_submitted",
  RigbookPhotoSubmitted = "rigbook_photo_submitted",
  Joined = "joined",
}
export const ACTIVITY_MESSAGE_CODES = Object.values(ActivityMessageCode);

// --- Membership Log ---

export enum MembershipMessageCode {
  AccountCreated = "account_created",
  AccountUnlocked = "account_unlocked",
  AccountChanged = "account_changed",
  AccountRejected = "account_rejected",
  DuesPaid = "dues_paid",
  OfficeAdded = "office_added",
  OfficeRemoved = "office_removed",
  TitleAdded = "title_added",
  TitleRemoved = "title_removed",
  MembershipGranted = "membership_granted",
  MembershipEligible = "membership_eligible",
  GuestRestricted = "guest_restricted",
}
export const MEMBERSHIP_MESSAGE_CODES = Object.values(MembershipMessageCode);

// --- Event RSVP ---

export enum RegistrationMethod {
  EventToken = "event_token",
  Invitation = "invitation",
  Auth = "auth",
}
export const REGISTRATION_METHODS = Object.values(RegistrationMethod);

export enum PaymentMethod {
  Check = "check",
  Cash = "cash",
  Zelle = "zelle",
  CreditCard = "credit_card",
}
export const PAYMENT_METHODS = Object.values(PaymentMethod);

export enum PaymentStatus {
  NotRequired = "not_required",
  Pending = "pending",
  Confirmed = "confirmed",
  RefundRequested = "refund_requested",
  Refunded = "refunded",
}
export const PAYMENT_STATUSES = Object.values(PaymentStatus);

// --- Badger Registration ---

export enum TshirtSize {
  S = "S",
  M = "M",
  L = "L",
  XL = "XL",
  XXL = "XXL",
  XXXL = "XXXL",
}
export const TSHIRT_SIZES = Object.values(TshirtSize);

export enum TravelMode {
  Motorcycle = "motorcycle",
  CarTruck = "car_truck",
  RvCamper = "rv_camper",
}
export const TRAVEL_MODES = Object.values(TravelMode);

// --- RSVP Log ---

export enum RsvpLogCode {
  Registered = "registered",
  MatchedToContact = "matched_to_contact",
  NewContactCreated = "new_contact_created",
  PaymentConfirmed = "payment_confirmed",
  RefundRequested = "refund_requested",
  RefundProcessed = "refund_processed",
  Cancelled = "cancelled",
  AdminCancelled = "admin_cancelled",
  AccountLinked = "account_linked",
  StatusChanged = "status_changed",
}
export const RSVP_LOG_CODES = Object.values(RsvpLogCode);
