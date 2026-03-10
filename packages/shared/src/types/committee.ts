export interface CommitteeSummary {
  id: string;
  name: string;
  description: string | null;
  purpose: string | null;
  formed_date: string;
  closed_date: string | null;
  chairperson_member_id: string | null;
  status: "active" | "closed";
  created_at?: string;
  updated_at?: string;
  member_count: number;
  meeting_count: number;
}

export interface CommitteeMember {
  id: string;
  committee_id: string;
  member_id: string;
  member_name: string | null;
  sort_order: number;
}

export interface CommitteeMeetingSummary {
  id: string;
  committee_id: string;
  date: string;
  meeting_number: number;
  location: string | null;
  start_time: string | null;
  end_time: string | null;
  video_conference_url: string | null;
  previous_meeting_id: string | null;
  agenda_document_id: string;
  minutes_document_id: string | null;
  agenda_content: string;
  minutes_content: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CommitteeDetail extends CommitteeSummary {
  chairperson_name: string | null;
  members: CommitteeMember[];
  meetings: CommitteeMeetingSummary[];
}

export interface CommitteeMeetingDetail extends CommitteeMeetingSummary {}
