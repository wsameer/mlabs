import { useState, useCallback } from "react";
import {
  DownloadIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  SparklesIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { DetectTransfersResult } from "@workspace/types";

import { Button } from "@workspace/ui/components/button";
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select";
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { Spinner } from "@workspace/ui/components/spinner";
import { Separator } from "@workspace/ui/components/separator";

import { useAccounts } from "@/features/accounts/api/use-accounts";
import { useCategories } from "@/features/categories/api/use-categories";
import {
  TransferDetectionReview,
  useDetectTransfers,
  useApplyTransferMerges,
} from "@/features/transactions/features/detect-transfers";

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
  return (
    <div className="flex flex-col gap-8">
      <ExportPanel />
      <Separator />
      <FindTransfersPanel />
    </div>
  );
}

function ExportPanel() {
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
      toast.error("Failed to export transactions");
    }
  }, [account, fetchAll, categories]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-base font-semibold">Export Transactions</h3>
        <p className="text-sm text-muted-foreground">
          Download all transactions for an account as a CSV. The file uses the
          same column layout the import flow expects, so it can be re-imported
          into another mlabs install or another account.
        </p>
      </div>

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

function FindTransfersPanel() {
  const detectMutation = useDetectTransfers();
  const applyMutation = useApplyTransferMerges();
  const [result, setResult] = useState<DetectTransfersResult | null>(null);

  const handleScan = useCallback(() => {
    detectMutation.mutate(
      { scope: "all", dateToleranceDays: 1 },
      {
        onSuccess: (data) => {
          setResult(data);
          if (data.pairs.length === 0 && data.ambiguous.length === 0) {
            toast.info(
              `Scanned ${data.scanned} transactions — no transfer candidates found.`
            );
          }
        },
        onError: (err) => {
          toast.error(err.message || "Scan failed");
        },
      }
    );
  }, [detectMutation]);

  const handleConfirm = useCallback(
    (pairs: { leftId: string; rightId: string }[]) => {
      if (pairs.length === 0) {
        setResult(null);
        return;
      }
      applyMutation.mutate(
        { pairs },
        {
          onSuccess: (apply) => {
            if (apply.merged > 0) {
              toast.success(`Merged ${apply.merged} transfers`);
            }
            if (apply.errors.length > 0) {
              toast.error(`${apply.errors.length} pair(s) could not be merged`);
            }
            setResult(null);
          },
          onError: (err) => {
            toast.error(err.message || "Failed to apply merges");
          },
        }
      );
    },
    [applyMutation]
  );

  const handleCancel = useCallback(() => {
    setResult(null);
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-base font-semibold">Find transfers</h3>
        <p className="text-sm text-muted-foreground">
          Scan all your transactions for likely transfer pairs — same amount,
          opposite direction, on different accounts, within ±1 day. Useful after
          importing bank CSVs that don&apos;t mark transfers explicitly.
        </p>
      </div>

      {!result && (
        <div className="flex justify-end">
          <Button
            onClick={handleScan}
            disabled={detectMutation.isPending}
            variant="outline"
          >
            {detectMutation.isPending ? (
              <>
                <Spinner className="size-4" />
                Scanning…
              </>
            ) : (
              <>
                <SparklesIcon className="size-4" />
                Scan for transfers
              </>
            )}
          </Button>
        </div>
      )}

      {result && (
        <>
          <TransferDetectionReview
            result={result}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
            isApplying={applyMutation.isPending}
            cancelLabel="Done"
            confirmLabel="Merge selected"
          />
          {(result.pairs.length > 0 || result.ambiguous.length > 0) && (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleScan}
                disabled={detectMutation.isPending || applyMutation.isPending}
              >
                <RefreshCwIcon className="size-3.5" />
                Re-scan
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
