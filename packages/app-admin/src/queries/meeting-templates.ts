import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/data/api";
import { trpc } from "@/trpc";
import { queryKeys } from "@/queries/keys";

/** Data: MeetingTemplate[] */
export function useMeetingTemplatesSuspense(type?: "agenda" | "minutes") {
  return trpc.admin.meetingTemplates.list.useSuspenseQuery(type ? { type } : undefined);
}

/** Data: MeetingTemplate[] */
export function useMeetingTemplatesOptional(type?: "agenda" | "minutes") {
  return trpc.admin.meetingTemplates.list.useQuery(type ? { type } : undefined);
}

/** Data: MeetingTemplate */
export function useMeetingTemplateSuspense(id: string) {
  return trpc.admin.meetingTemplates.get.useSuspenseQuery({ id });
}

export function useCreateMeetingTemplate() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; type: "agenda" | "minutes"; content: string }) =>
      api.meetingTemplates.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.meetingTemplates() }),
  });
}

export function useUpdateMeetingTemplate() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api.meetingTemplates.update(id, body),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.meetingTemplates() });
      qc.invalidateQueries({ queryKey: queryKeys.meetingTemplate(id) });
    },
  });
}

export function useDeleteMeetingTemplate() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.meetingTemplates.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.meetingTemplates() }),
  });
}
