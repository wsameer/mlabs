import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { transactionKeys } from "@/features/transactions/api/use-transactions";
import { accountKeys } from "@/features/accounts/api/use-accounts";
import type {
  DetectTransfersRequest,
  DetectTransfersResult,
  ApplyTransferMergesRequest,
  ApplyTransferMergesResult,
} from "@workspace/types";

export function useDetectTransfers() {
  return useMutation({
    mutationFn: (body: DetectTransfersRequest) =>
      apiClient<DetectTransfersResult>("/transactions/detect-transfers", {
        method: "POST",
        body,
      }),
  });
}

export function useApplyTransferMerges() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ApplyTransferMergesRequest) =>
      apiClient<ApplyTransferMergesResult>(
        "/transactions/apply-transfer-merges",
        {
          method: "POST",
          body,
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
    },
  });
}
