import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/data/api";
import { trpc } from "@/trpc";
import { queryKeys } from "@/queries/keys";
import type { CommitteeSortField } from "@satyrsmc/shared/client";

/** Data: CommitteeSummary[] */
export function useCommitteesSuspense(sort?: CommitteeSortField) {
  return trpc.admin.committees.list.useSuspenseQuery(sort ? { sort } : undefined);
}

/** Data: CommitteeDetail */
export function useCommitteeSuspense(id: string) {
  return trpc.admin.committees.get.useSuspenseQuery({ id });
}

/** Data: CommitteeMeetingSummary[] */
export function useCommitteeMeetingsSuspense(committeeId: string) {
  return trpc.admin.committees.listMeetings.useSuspenseQuery({ committeeId });
}

/** Data: CommitteeMeetingDetail */
export function useCommitteeMeetingSuspense(committeeId: string, meetingId: string) {
  return trpc.admin.committees.getMeeting.useSuspenseQuery({
    committeeId,
    meetingId,
  });
}

export function useCreateCommittee() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      description?: string | null;
      purpose?: string | null;
      formed_date: string;
      chairperson_member_id?: string | null;
      member_ids?: string[];
    }) => api.committees.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.committees() }),
  });
}

export function useUpdateCommittee() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api.committees.update(id, body),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.committees() });
      qc.invalidateQueries({ queryKey: queryKeys.committee(id) });
    },
  });
}

export function useDeleteCommittee() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.committees.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.committees() }),
  });
}

export function useCommitteeAddMember() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ committeeId, memberId }: { committeeId: string; memberId: string }) =>
      api.committees.addMember(committeeId, memberId),
    onSuccess: (_, { committeeId }) =>
      qc.invalidateQueries({ queryKey: queryKeys.committee(committeeId) }),
  });
}

export function useCommitteeRemoveMember() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ committeeId, memberId }: { committeeId: string; memberId: string }) =>
      api.committees.removeMember(committeeId, memberId),
    onSuccess: (_, { committeeId }) =>
      qc.invalidateQueries({ queryKey: queryKeys.committee(committeeId) }),
  });
}

export function useCreateCommitteeMeeting() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ committeeId, body }: { committeeId: string; body: Record<string, unknown> }) =>
      api.committees.createMeeting(committeeId, body as never),
    onSuccess: (_, { committeeId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.committeeMeetings(committeeId) });
      qc.invalidateQueries({ queryKey: queryKeys.committee(committeeId) });
    },
  });
}

export function useUpdateCommitteeMeeting() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      committeeId,
      meetingId,
      body,
    }: {
      committeeId: string;
      meetingId: string;
      body: Record<string, unknown>;
    }) => api.committees.updateMeeting(committeeId, meetingId, body as never),
    onSuccess: (_, { committeeId, meetingId }) =>
      qc.invalidateQueries({
        queryKey: queryKeys.committeeMeeting(committeeId, meetingId),
      }),
  });
}

export function useDeleteCommitteeMeeting() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ committeeId, meetingId }: { committeeId: string; meetingId: string }) =>
      api.committees.deleteMeeting(committeeId, meetingId),
    onSuccess: (_, { committeeId }) =>
      qc.invalidateQueries({ queryKey: queryKeys.committeeMeetings(committeeId) }),
  });
}
