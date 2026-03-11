/** Reserved member ID for "All Members" - re-export from lib. */
export { ALL_MEMBERS_ID } from "../lib/constants";

/** Member position options for forms (client-only constant; do not add to DTOs to avoid enum conflicts). */
export const MEMBER_POSITIONS = [
  "President",
  "Vice President",
  "Road Captain",
  "Treasurer",
  "Recording Secretary",
  "Correspondence Secretary",
  "Member",
] as const;

export type MemberPosition = (typeof MEMBER_POSITIONS)[number];
