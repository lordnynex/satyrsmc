export interface MeetingSummary {
  id: string;
  date: string;
  meeting_number: number;
  location: string | null;
  /** Start time as HH:mm (e.g. "19:00") */
  start_time: string | null;
  /** End time as HH:mm */
  end_time: string | null;
  video_conference_url: string | null;
  previous_meeting_id: string | null;
  agenda_document_id: string;
  minutes_document_id: string | null;
  agenda_content: string;
  minutes_content: string | null;
  motion_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface MeetingMotion {
  id: string;
  meeting_id: string;
  /** Optional text description of the motion (Robert's Rules). */
  description: string | null;
  result: "pass" | "fail";
  order_index: number;
  /** Member who made the motion. */
  mover_member_id: string | null;
  /** Member who seconded the motion. */
  seconder_member_id: string | null;
  mover_name?: string | null;
  seconder_name?: string | null;
  created_at?: string;
}

/** Motion with meeting context (e.g. from list all motions). */
export interface MotionWithMeeting extends MeetingMotion {
  meeting_date: string;
  meeting_number: number;
}

export interface MotionsListResponse {
  items: MotionWithMeeting[];
  total: number;
}

export interface MeetingActionItem {
  id: string;
  meeting_id: string;
  description: string;
  assignee_member_id: string | null;
  assignee_name?: string | null;
  due_date: string | null;
  status: "open" | "completed";
  completed_at: string | null;
  order_index: number;
  created_at?: string;
}

export interface OldBusinessItem {
  id: string;
  meeting_id: string;
  description: string;
  status: "open" | "closed";
  closed_at: string | null;
  closed_in_meeting_id: string | null;
  order_index: number;
  created_at?: string;
  is_carried?: boolean;
}

export interface OldBusinessItemWithMeeting extends OldBusinessItem {
  meeting_number?: number;
  meeting_date?: string;
}

export interface MeetingDetail extends MeetingSummary {
  motions: MeetingMotion[];
  action_items: MeetingActionItem[];
  old_business: OldBusinessItem[];
}

export interface MeetingTemplate {
  id: string;
  name: string;
  type: "agenda" | "minutes";
  document_id: string;
  content: string;
  created_at?: string;
  updated_at?: string;
}
