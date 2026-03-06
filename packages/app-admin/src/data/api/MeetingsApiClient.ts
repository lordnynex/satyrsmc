import type { TrpcClient } from "./trpcClientContext";
import type {
  MeetingDetail,
  MeetingSummary,
  MotionsListResponse,
  OldBusinessItemWithMeeting,
} from "@satyrsmc/shared/types/meeting";

export class MeetingsApiClient {
  constructor(private client: TrpcClient) {}

  listOldBusiness(): Promise<OldBusinessItemWithMeeting[]> {
    return this.client.admin.meetings.listOldBusiness.query();
  }

  listMotions(params: {
    page: number;
    per_page: number;
    q?: string;
  }): Promise<MotionsListResponse> {
    return this.client.admin.meetings.listMotions.query(params);
  }

  list(options?: { sort?: "date" | "meeting_number" }) {
    return this.client.admin.meetings.list.query(
      options?.sort ? { sort: options.sort } : undefined
    ) as Promise<MeetingSummary[]>;
  }

  get(id: string): Promise<MeetingDetail | null> {
    return this.client.admin.meetings.get
      .query({ id })
      .catch(() => null) as Promise<MeetingDetail | null>;
  }

  create(body: {
    date: string;
    meeting_number: number;
    location?: string | null;
    previous_meeting_id?: string | null;
    agenda_content?: string;
    minutes_content?: string | null;
    agenda_template_id?: string;
  }) {
    return this.client.admin.meetings.create.mutate(body as never);
  }

  update(id: string, body: Record<string, unknown>) {
    return this.client.admin.meetings.update.mutate({ id, ...body } as never);
  }

  delete(
    id: string,
    options?: { delete_agenda?: boolean; delete_minutes?: boolean }
  ) {
    return this.client.admin.meetings.delete.mutate({
      id,
      delete_agenda: options?.delete_agenda,
      delete_minutes: options?.delete_minutes,
    });
  }

  readonly motions = {
    create: (
      meetingId: string,
      body: {
        description?: string | null;
        result: "pass" | "fail";
        order_index?: number;
        mover_member_id: string;
        seconder_member_id: string;
      }
    ) =>
      this.client.admin.meetings.createMotion.mutate({
        meetingId,
        ...body,
      }),
    update: (meetingId: string, mid: string, body: Record<string, unknown>) =>
      this.client.admin.meetings.updateMotion.mutate({
        meetingId,
        motionId: mid,
        ...body,
      } as never),
    delete: (meetingId: string, mid: string) =>
      this.client.admin.meetings.deleteMotion.mutate({
        meetingId,
        motionId: mid,
      }),
  };

  readonly actionItems = {
    create: (
      meetingId: string,
      body: {
        description: string;
        assignee_member_id?: string | null;
        due_date?: string | null;
        order_index?: number;
      }
    ) =>
      this.client.admin.meetings.createActionItem.mutate({
        meetingId,
        ...body,
      }),
    update: (meetingId: string, aid: string, body: Record<string, unknown>) =>
      this.client.admin.meetings.updateActionItem.mutate({
        meetingId,
        actionItemId: aid,
        ...body,
      } as never),
    delete: (meetingId: string, aid: string) =>
      this.client.admin.meetings.deleteActionItem.mutate({
        meetingId,
        actionItemId: aid,
      }),
  };

  readonly oldBusiness = {
    create: (
      meetingId: string,
      body: { description: string; order_index?: number }
    ) =>
      this.client.admin.meetings.createOldBusiness.mutate({
        meetingId,
        ...body,
      }),
    update: (meetingId: string, oid: string, body: Record<string, unknown>) =>
      this.client.admin.meetings.updateOldBusiness.mutate({
        meetingId,
        oldBusinessId: oid,
        ...body,
      } as never),
    delete: (meetingId: string, oid: string) =>
      this.client.admin.meetings.deleteOldBusiness.mutate({
        meetingId,
        oldBusinessId: oid,
      }),
  };
}
