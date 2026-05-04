import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { transactionKeys } from "@/features/transactions/api/use-transactions";
import { accountKeys } from "@/features/accounts/api/use-accounts";
import type {
  BulkCreateIncomeExpense,
  BulkImportResult,
} from "@workspace/types";

export function useImportTransactions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (transactions: BulkCreateIncomeExpense[]) =>
      apiClient<BulkImportResult>("/transactions/bulk", {
        method: "POST",
        body: { transactions },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: accountKeys.lists() });
    },
  });
}
