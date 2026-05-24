import { useState, useCallback } from "react";
import { DownloadIcon, AlertCircleIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@workspace/ui/components/button";
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select";
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { Spinner } from "@workspace/ui/components/spinner";

import { useAccounts } from "@/features/accounts/api/use-accounts";
import { useCategories } from "@/features/categories/api/use-categories";

import { useExportTransactions } from "./hooks/use-export-transactions";
import { transactionsToCsv, buildExportFilename } from "./lib/csv-build";

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function BackupSection() {
  const [accountId, setAccountId] = useState("");
  const { data: accounts } = useAccounts({ isActive: true });
  const { data: categories } = useCategories();
  const { fetchAll, isLoading, error } = useExportTransactions();

  const account = accounts?.find((a) => a.id === accountId);
  const canExport = !!accountId && !isLoading;

  const handleExport = useCallback(async () => {
    if (!account) return;
    try {
      const transactions = await fetchAll(account.id);
      if (transactions.length === 0) {
        toast.info("No transactions to export for this account");
        return;
      }
      const csv = transactionsToCsv(transactions, categories ?? []);
      const filename = buildExportFilename(account.name, new Date());
      downloadCsv(filename, csv);
      toast.success(`Exported ${transactions.length} transactions`);
    } catch {
      // error state handled by the hook; surface a toast as well
      toast.error("Failed to export transactions");
    }
  }, [account, fetchAll, categories]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-base font-semibold">Export Transactions</h3>
        <p className="text-sm text-muted-foreground">
          Download all transactions for an account as a CSV. The file uses the
          same column layout the import flow expects, so it can be re-imported
          into another account.
        </p>
      </div>

      <Alert>
        <AlertCircleIcon className="size-4" />
        <AlertDescription>
          Transfer rows include a Transfer ID for reference, but the import flow
          does not currently re-link transfer pairs — they will come back as
          plain income/expense.
        </AlertDescription>
      </Alert>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="export-account">Account</FieldLabel>
          <NativeSelect
            id="export-account"
            className="w-full"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            <NativeSelectOption value="">Select account...</NativeSelectOption>
            {accounts?.map((a) => (
              <NativeSelectOption key={a.id} value={a.id}>
                {a.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
      </FieldGroup>

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button onClick={handleExport} disabled={!canExport}>
          {isLoading ? (
            <>
              <Spinner className="size-4" />
              Preparing…
            </>
          ) : (
            <>
              <DownloadIcon className="size-4" />
              Download CSV
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
