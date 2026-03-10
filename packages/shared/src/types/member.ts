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

export interface Member {
  id: string;
  name: string;
  phone_number: string | null;
  email: string | null;
  address: string | null;
  birthday: string | null;
  member_since: string | null;
  is_baby: boolean;
  position: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  /** URL to full-size photo */
  photo_url: string | null;
  /** URL to thumbnail for chips/avatars */
  photo_thumbnail_url: string | null;
  created_at?: string;
}
