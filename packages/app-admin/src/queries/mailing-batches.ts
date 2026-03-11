import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/data/api";
import { trpc } from "@/trpc";
import { queryKeys } from "@/queries/keys";
import type { MailingBatch } from "@satyrsmc/shared/client";

/** Data: MailingBatch */
export function useMailingBatchSuspense(id: string) {
  return trpc.admin.mailingBatches.get.useSuspenseQuery({ id });
}

export function useUpdateMailingBatchRecipientStatus() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      batchId,
      recipientId,
      status,
      reason,
    }: {
      batchId: string;
      recipientId: string;
      status: string;
      reason?: string;
    }) =>
      api.mailingBatches.updateRecipientStatus(batchId, recipientId, status, reason),
    onSuccess: (_, { batchId }) =>
      qc.invalidateQueries({ queryKey: queryKeys.mailingBatch(batchId) }),
  });
}
