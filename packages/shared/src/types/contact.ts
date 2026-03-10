export type ContactType = "person" | "organization";
export type ContactStatus = "active" | "inactive" | "deleted";
export type ConsentStatus = "yes" | "no" | "unknown";
export type EmailPhoneType = "work" | "home" | "cell" | "other";
export type AddressType = "home" | "work" | "postal" | "other";
export type ListType = "static" | "dynamic" | "hybrid";
export type DeliveryType = "physical" | "email" | "both";
export type MemberSource = "manual" | "import" | "rule";
export type BatchRecipientStatus = "queued" | "printed" | "mailed" | "returned" | "invalid";

export interface ContactEmail {
  id: string;
  contact_id: string;
  email: string;
  type: EmailPhoneType;
  is_primary: boolean;
}

export interface ContactPhone {
  id: string;
  contact_id: string;
  phone: string;
  type: EmailPhoneType;
  is_primary: boolean;
}

export interface ContactAddress {
  id: string;
  contact_id: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  type: AddressType;
  is_primary_mailing: boolean;
}

export interface Tag {
  id: string;
  name: string;
}

export interface ContactNote {
  id: string;
  contact_id: string;
  content: string;
  created_at: string | null;
}

export interface ContactEmergencyContact {
  id: string;
  contact_id: string;
  name: string;
  phone: string;
  email: string | null;
  relationship: string | null;
}

export type ContactPhotoType = "profile" | "contact";

export interface ContactPhoto {
  id: string;
  contact_id: string;
  type: ContactPhotoType;
  sort_order: number;
  /** URL to fetch full-size image */
  photo_url: string;
  /** URL to fetch thumbnail */
  photo_thumbnail_url: string;
  /** URL to fetch display size (for main dossier view) */
  photo_display_url: string;
  created_at: string | null;
}

export interface Contact {
  id: string;
  type: ContactType;
  status: ContactStatus;
  display_name: string;
  first_name: string | null;
  last_name: string | null;
  organization_name: string | null;
  notes: string | null; // deprecated - use contact_notes
  contact_notes?: ContactNote[];
  how_we_know_them: string | null;
  ok_to_email: ConsentStatus;
  ok_to_mail: ConsentStatus;
  ok_to_sms: ConsentStatus;
  do_not_contact: boolean;
  club_name: string | null;
  role: string | null;
  uid: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  hellenic?: boolean;
  deceased?: boolean;
  deceased_year?: number | null;
  emails?: ContactEmail[];
  phones?: ContactPhone[];
  addresses?: ContactAddress[];
  emergency_contacts?: ContactEmergencyContact[];
  tags?: Tag[];
  contact_photos?: ContactPhoto[];
}

export interface MailingListMember {
  id: string;
  list_id: string;
  contact_id: string;
  added_by: string | null;
  added_at: string;
  source: MemberSource;
  suppressed: boolean;
  suppress_reason: string | null;
  unsubscribed: boolean;
  contact?: Contact;
}

export interface MailingListCriteria {
  tagIn?: string[];
  tagNotIn?: string[];
  active?: boolean;
  okToMail?: boolean;
  okToEmail?: boolean;
  hasPostalAddress?: boolean;
  hasEmail?: boolean;
  organization?: string;
  clubName?: string;
  hellenic?: boolean;
}

export interface MailingList {
  id: string;
  name: string;
  description: string | null;
  list_type: ListType;
  delivery_type: DeliveryType;
  event_id: string | null;
  template: string | null;
  criteria: MailingListCriteria | null;
  created_at?: string;
  updated_at?: string;
  event?: { id: string; name: string };
  member_count?: number;
}

export interface MailingBatchRecipient {
  id: string;
  batch_id: string;
  contact_id: string;
  snapshot_name: string;
  snapshot_address_line1: string | null;
  snapshot_address_line2: string | null;
  snapshot_city: string | null;
  snapshot_state: string | null;
  snapshot_postal_code: string | null;
  snapshot_country: string | null;
  snapshot_organization: string | null;
  status: BatchRecipientStatus;
  invalid_reason: string | null;
  returned_reason: string | null;
}

export interface MailingBatch {
  id: string;
  list_id: string;
  event_id: string | null;
  name: string;
  created_by: string | null;
  created_at: string;
  recipient_count: number;
  list?: MailingList;
  event?: { id: string; name: string };
  recipients?: MailingBatchRecipient[];
}

export interface ListPreview {
  included: Array<{ contact: Contact; reason?: string }>;
  excluded: Array<{ contact: Contact; reason: string; removable?: boolean; canRemoveFromList?: boolean }>;
  totalIncluded: number;
  totalExcluded: number;
}

export interface MailingListStats {
  geographic?: {
    byState: Array<{ state: string; count: number }>;
    byCountry: Array<{ country: string; count: number }>;
  };
  duplicateAddresses: {
    totalDuplicateContacts: number;
    uniqueAddressesWithDuplicates: number;
    groups: Array<{
      address: string;
      contactIds: string[];
      contacts: Array<{ id: string; display_name: string }>;
    }>;
  };
}

export interface MailingListIncludedPage {
  contacts: Array<{ contact: Contact; canRemoveFromList: boolean }>;
  total: number;
  page: number;
  limit: number;
}

export interface ContactSearchParams {
  q?: string;
  status?: ContactStatus | "all";
  hasPostalAddress?: boolean;
  hasEmail?: boolean;
  hellenic?: boolean;
  excludeDeceased?: boolean;
  tagIds?: string[];
  organization?: string;
  role?: string;
  sort?: "updated_at" | "name" | "last_contacted";
  sortDir?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface ContactSearchResult {
  contacts: Contact[];
  total: number;
  page: number;
  limit: number;
}
