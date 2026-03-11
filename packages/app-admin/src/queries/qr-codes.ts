import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/data/api";
import { trpc } from "@/trpc";
import { queryKeys } from "@/queries/keys";
import type { QrCode } from "@satyrsmc/shared/client";

/** Data: QrCode[] */
export function useQrCodesSuspense() {
  return trpc.admin.qrCodes.list.useSuspenseQuery();
}

/** Data: QrCode */
export function useQrCodeSuspense(id: string) {
  return trpc.admin.qrCodes.get.useSuspenseQuery({ id });
}

export function useCreateQrCode() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      body: Parameters<typeof api.qrCodes.create>[0]
    ) => api.qrCodes.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.qrCodes }),
  });
}

export function useUpdateQrCode() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: Parameters<typeof api.qrCodes.update>[1];
    }) => api.qrCodes.update(id, body),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: queryKeys.qrCodes });
      qc.invalidateQueries({ queryKey: queryKeys.qrCode(id) });
    },
  });
}

export function useDeleteQrCode() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.qrCodes.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.qrCodes }),
  });
}

/** Data: string (image URL) */
export function useQrCodeImageUrl(id: string, size?: number) {
  const api = useApi();
  return useQuery({
    queryKey: [...queryKeys.qrCode(id), "image", size ?? 256],
    queryFn: () => api.qrCodes.getImageUrl(id, size ?? 256),
    enabled: !!id,
  });
}
