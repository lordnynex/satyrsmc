import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/data/api";
import { trpc } from "@/trpc";
import { queryKeys } from "@/queries/keys";
import type {
  ListPreview,
  MailingList,
  MailingListIncludedPage,
  MailingListStats,
} from "@satyrsmc/shared/client";

/** Data: MailingList[] */
export function useMailingListsSuspense() {
  return trpc.admin.mailingLists.list.useSuspenseQuery();
}

/** Data: MailingList[] */
export function useMailingListsOptional() {
  return trpc.admin.mailingLists.list.useQuery();
}

/** Data: MailingList */
export function useMailingListSuspense(id: string) {
  return trpc.admin.mailingLists.get.useSuspenseQuery({ id });
}

/** Data: ListPreview */
export function useMailingListPreview(id: string | null) {
  return trpc.admin.mailingLists.preview.useQuery(
    { id: id! },
    { enabled: !!id }
  );
}

/** Data: MailingListStats */
export function useMailingListStats(id: string | null) {
  return trpc.admin.mailingLists.getStats.useQuery(
    { id: id! },
    { enabled: !!id }
  );
}

/** Data: MailingListIncludedPage */
export function useMailingListIncluded(
  id: string | null,
  page: number,
  limit: number,
  q?: string
) {
  return trpc.admin.mailingLists.getIncluded.useQuery(
    { listId: id!, page, limit, q },
    { enabled: !!id }
  );
}

export function useMailingListMembers(listId: string | null) {
  const api = useApi();
  return useQuery({
    queryKey: queryKeys.mailingListMembers(listId ?? ""),
    queryFn: () => api.mailingLists.getMembers(listId!),
    enabled: !!listId,
  });
}

export function useCreateMailingList() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.mailingLists.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.mailingLists }),
  });
}

export function useUpdateMailingList() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api.mailingLists.update(id, body),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.mailingLists });
      qc.invalidateQueries({ queryKey: queryKeys.mailingList(id) });
    },
  });
}

export function useDeleteMailingList() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.mailingLists.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.mailingLists }),
  });
}

export function useMailingListAddMember() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, contactId }: { listId: string; contactId: string }) =>
      api.mailingLists.addMember(listId, contactId),
    onSuccess: (_, { listId }) => qc.invalidateQueries({ queryKey: queryKeys.mailingList(listId) }),
  });
}

export function useMailingListRemoveMember() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, contactId }: { listId: string; contactId: string }) =>
      api.mailingLists.removeMember(listId, contactId),
    onSuccess: (_, { listId }) => qc.invalidateQueries({ queryKey: queryKeys.mailingList(listId) }),
  });
}

export function useMailingListReinstateMember() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listId, contactId }: { listId: string; contactId: string }) =>
      api.mailingLists.reinstateMember(listId, contactId),
    onSuccess: (_, { listId }) => qc.invalidateQueries({ queryKey: queryKeys.mailingList(listId) }),
  });
}

export function useMailingListAddMembersBulk() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      listId,
      contactIds,
      source,
    }: {
      listId: string;
      contactIds: string[];
      source?: "manual" | "import" | "rule";
    }) => api.mailingLists.addMembersBulk(listId, contactIds, source),
    onSuccess: (_, { listId }) => qc.invalidateQueries({ queryKey: queryKeys.mailingList(listId) }),
  });
}

export function useMailingListAddAllContacts() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (listId: string) => api.mailingLists.addAllContacts(listId),
    onSuccess: (_, listId) => qc.invalidateQueries({ queryKey: queryKeys.mailingList(listId) }),
  });
}

export function useMailingListAddAllHellenics() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (listId: string) => api.mailingLists.addAllHellenics(listId),
    onSuccess: (_, listId) => qc.invalidateQueries({ queryKey: queryKeys.mailingList(listId) }),
  });
}
