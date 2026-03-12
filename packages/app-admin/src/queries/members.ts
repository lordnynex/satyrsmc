import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi, type CreateMemberBody } from "@/data/api";
import { trpc } from "@/trpc";
import { queryKeys } from "@/queries/keys";

/** Data: Member[] */
export function useMembersSuspense() {
  return trpc.admin.members.list.useSuspenseQuery();
}

/** Data: Member[] */
export function useMembersOptional() {
  return trpc.admin.members.list.useQuery();
}

/** Data: Member */
export function useMemberSuspense(id: string) {
  return trpc.admin.members.get.useSuspenseQuery({ id });
}

/** Data: Member */
export function useMemberOptional(id: string, options?: { enabled?: boolean }) {
  return trpc.admin.members.get.useQuery(
    { id },
    { enabled: options?.enabled !== false && !!id, ...options },
  );
}

export function useCreateMember() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateMemberBody) => api.members.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.members }),
  });
}

export function useUpdateMember() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api.members.update(id, body),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.members });
      qc.invalidateQueries({ queryKey: queryKeys.member(id) });
    },
  });
}

export function useDeleteMember() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.members.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.members }),
  });
}
