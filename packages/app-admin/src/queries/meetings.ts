import { useMutation } from "@tanstack/react-query";
import { useApi } from "@/data/api";
import { trpc } from "@/trpc";
import type {
  MeetingDetail,
  MeetingSummary,
  MotionsListResponse,
  OldBusinessItemWithMeeting,
} from "@satyrsmc/shared/types/meeting";

function useTrpcUtils() {
  return trpc.useUtils();
}

/** Data: MeetingSummary[] */
export function useMeetingsSuspense(sort?: "date" | "meeting_number") {
  return trpc.admin.meetings.list.useSuspenseQuery(
    sort ? { sort } : undefined
  );
}

/** Data: MeetingDetail */
export function useMeetingSuspense(id: string) {
  return trpc.admin.meetings.get.useSuspenseQuery({ id });
}

/** Data: MeetingSummary[] */
export function useMeetingsOptional(sort?: "date" | "meeting_number") {
  return trpc.admin.meetings.list.useQuery(sort ? { sort } : undefined);
}

/** Data: OldBusinessItemWithMeeting[] */
export function useOldBusinessSuspense() {
  return trpc.admin.meetings.listOldBusiness.useSuspenseQuery();
}

/** Data: MotionsListResponse */
export function useMotionsList(page: number, perPage: number, q?: string) {
  return trpc.admin.meetings.listMotions.useQuery({
    page,
    per_page: perPage,
    q,
  });
}

export function useCreateMeeting() {
  const api = useApi();
  const utils = useTrpcUtils();
  return useMutation({
    mutationFn: (body: {
      date: string;
      meeting_number: number;
      location?: string | null;
      previous_meeting_id?: string | null;
      agenda_content?: string;
      minutes_content?: string | null;
      agenda_template_id?: string;
    }) => api.meetings.create(body),
    onSuccess: () => utils.admin.meetings.list.invalidate(),
  });
}

export function useUpdateMeeting() {
  const api = useApi();
  const utils = useTrpcUtils();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api.meetings.update(id, body as never),
    onSuccess: (_, { id }) => {
      utils.admin.meetings.list.invalidate();
      utils.admin.meetings.get.invalidate({ id });
    },
  });
}

export function useDeleteMeeting() {
  const api = useApi();
  const utils = useTrpcUtils();
  return useMutation({
    mutationFn: (args: {
      id: string;
      delete_agenda?: boolean;
      delete_minutes?: boolean;
    }) =>
      api.meetings.delete(args.id, {
        delete_agenda: args.delete_agenda,
        delete_minutes: args.delete_minutes,
      }),
    onSuccess: () => utils.admin.meetings.list.invalidate(),
  });
}

export function useOldBusinessCreate() {
  const api = useApi();
  const utils = useTrpcUtils();
  return useMutation({
    mutationFn: ({
      meetingId,
      body,
    }: {
      meetingId: string;
      body: { description: string; order_index?: number };
    }) => api.meetings.oldBusiness.create(meetingId, body),
    onSuccess: (_, { meetingId }) =>
      utils.admin.meetings.get.invalidate({ id: meetingId }),
  });
}

export function useOldBusinessUpdate() {
  const api = useApi();
  const utils = useTrpcUtils();
  return useMutation({
    mutationFn: ({
      meetingId,
      id: oid,
      body,
    }: {
      meetingId: string;
      id: string;
      body: Record<string, unknown>;
    }) => api.meetings.oldBusiness.update(meetingId, oid, body),
    onSuccess: (_, { meetingId }) =>
      utils.admin.meetings.get.invalidate({ id: meetingId }),
  });
}

export function useOldBusinessDelete() {
  const api = useApi();
  const utils = useTrpcUtils();
  return useMutation({
    mutationFn: ({ meetingId, id: oid }: { meetingId: string; id: string }) =>
      api.meetings.oldBusiness.delete(meetingId, oid),
    onSuccess: (_, { meetingId }) =>
      utils.admin.meetings.get.invalidate({ id: meetingId }),
  });
}

export function useMotionCreate() {
  const api = useApi();
  const utils = useTrpcUtils();
  return useMutation({
    mutationFn: ({
      meetingId,
      body,
    }: {
      meetingId: string;
      body: {
        description?: string | null;
        result: "pass" | "fail";
        order_index?: number;
        mover_member_id: string;
        seconder_member_id: string;
      };
    }) => api.meetings.motions.create(meetingId, body),
    onSuccess: (_, { meetingId }) =>
      utils.admin.meetings.get.invalidate({ id: meetingId }),
  });
}

export function useMotionUpdate() {
  const api = useApi();
  const utils = useTrpcUtils();
  return useMutation({
    mutationFn: ({
      meetingId,
      motionId,
      body,
    }: {
      meetingId: string;
      motionId: string;
      body: Record<string, unknown>;
    }) => api.meetings.motions.update(meetingId, motionId, body),
    onSuccess: (_, { meetingId }) =>
      utils.admin.meetings.get.invalidate({ id: meetingId }),
  });
}

export function useMotionDelete() {
  const api = useApi();
  const utils = useTrpcUtils();
  return useMutation({
    mutationFn: ({ meetingId, motionId }: { meetingId: string; motionId: string }) =>
      api.meetings.motions.delete(meetingId, motionId),
    onSuccess: (_, { meetingId }) =>
      utils.admin.meetings.get.invalidate({ id: meetingId }),
  });
}

export function useActionItemCreate() {
  const api = useApi();
  const utils = useTrpcUtils();
  return useMutation({
    mutationFn: ({
      meetingId,
      body,
    }: {
      meetingId: string;
      body: {
        description: string;
        assignee_member_id?: string | null;
        due_date?: string | null;
        order_index?: number;
      };
    }) => api.meetings.actionItems.create(meetingId, body),
    onSuccess: (_, { meetingId }) =>
      utils.admin.meetings.get.invalidate({ id: meetingId }),
  });
}

export function useActionItemUpdate() {
  const api = useApi();
  const utils = useTrpcUtils();
  return useMutation({
    mutationFn: ({
      meetingId,
      actionItemId,
      body,
    }: {
      meetingId: string;
      actionItemId: string;
      body: Record<string, unknown>;
    }) => api.meetings.actionItems.update(meetingId, actionItemId, body),
    onSuccess: (_, { meetingId }) =>
      utils.admin.meetings.get.invalidate({ id: meetingId }),
  });
}

export function useActionItemDelete() {
  const api = useApi();
  const utils = useTrpcUtils();
  return useMutation({
    mutationFn: ({
      meetingId,
      actionItemId,
    }: {
      meetingId: string;
      actionItemId: string;
    }) => api.meetings.actionItems.delete(meetingId, actionItemId),
    onSuccess: (_, { meetingId }) =>
      utils.admin.meetings.get.invalidate({ id: meetingId }),
  });
}
