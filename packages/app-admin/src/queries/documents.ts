import { useMutation } from "@tanstack/react-query";
import { useApi } from "@/data/api";
import { trpc } from "@/trpc";

export function useUpdateDocument() {
  const api = useApi();
  const utils = trpc.useUtils();
  return useMutation({
    mutationFn: ({
      id,
      body,
      meetingId,
    }: {
      id: string;
      body: { content: string };
      meetingId?: string;
    }) => api.documents.update(id, body),
    onSuccess: (_, { meetingId }) => {
      if (meetingId) {
        utils.admin.meetings.get.invalidate({ id: meetingId });
      }
    },
  });
}

export function useExportDocumentPdf() {
  const api = useApi();
  return useMutation({
    mutationFn: ({ documentId, filename }: { documentId: string; filename: string }) =>
      api.documents.exportPdf(documentId, filename),
  });
}
