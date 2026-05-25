import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import type {
  CategoryWithSubcategories,
  DetectTransfersResult,
} from "@workspace/types";

import { useAccounts } from "@/features/accounts/api/use-accounts";
import { useCategories } from "@/features/categories/api/use-categories";
import {
  TransferDetectionReview,
  useDetectTransfers,
  useApplyTransferMerges,
} from "@/features/transactions/features/detect-transfers";

import { useCsvParser } from "./hooks/use-csv-parser";
import { useColumnMapping } from "./hooks/use-column-mapping";
import { useImportTransactions } from "./hooks/use-import-transactions";
import { transformRows, toApiPayload } from "./lib/csv-transform";

import { UploadStep } from "./components/UploadStep";
import { MapColumnsStep } from "./components/MapColumnsStep";
import { PreviewStep } from "./components/PreviewStep";
import { ImportingStep } from "./components/ImportingStep";
import { ResultsStep } from "./components/ResultsStep";

import type { ImportStep, ValidatedRow, ImportResult } from "./types";

export function ImportSection() {
  const [step, setStep] = useState<ImportStep>("upload");
  const [accountId, setAccountId] = useState("");
  const [fileName, setFileName] = useState("");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [detectionResult, setDetectionResult] =
    useState<DetectTransfersResult | null>(null);

  const { data: accounts } = useAccounts({ isActive: true });
  const { data: categories } = useCategories();
  const csvParser = useCsvParser();
  const columnMapping = useColumnMapping(csvParser.headers);
  const importMutation = useImportTransactions();
  const detectMutation = useDetectTransfers();
  const applyMergesMutation = useApplyTransferMerges();

  const validatedRows: ValidatedRow[] = useMemo(() => {
    if (csvParser.rows.length === 0) return [];
    return transformRows(
      csvParser.rows,
      columnMapping.mapping,
      columnMapping.amountMode,
      (categories ?? []) as CategoryWithSubcategories[]
    );
  }, [
    csvParser.rows,
    columnMapping.mapping,
    columnMapping.amountMode,
    categories,
  ]);

  const accountName = useMemo(
    () => accounts?.find((a) => a.id === accountId)?.name ?? "Unknown",
    [accounts, accountId]
  );

  const handleFileSelect = useCallback(
    (file: File) => {
      setFileName(file.name);
      csvParser.parseFile(file);
    },
    [csvParser]
  );

  const handleImport = useCallback(() => {
    const payload = toApiPayload(validatedRows, accountId);
    if (payload.length === 0) return;

    setStep("importing");
    importMutation.mutate(payload, {
      onSuccess: (result) => {
        setImportResult(result);
        toast.success(`Imported ${result.imported} transactions`);

        if (result.imported === 0 || result.importedIds.length === 0) {
          setStep("results");
          return;
        }

        detectMutation.mutate(
          {
            scope: "ids",
            ids: result.importedIds,
            dateToleranceDays: 1,
          },
          {
            onSuccess: (detection) => {
              if (
                detection.pairs.length === 0 &&
                detection.ambiguous.length === 0
              ) {
                setStep("results");
                return;
              }
              setDetectionResult(detection);
              setStep("transfer-review");
            },
            onError: () => {
              // Detection is optional polish — skip to results on failure.
              setStep("results");
            },
          }
        );
      },
      onError: (error) => {
        toast.error(error.message || "Import failed");
        setStep("preview");
      },
    });
  }, [validatedRows, accountId, importMutation, detectMutation]);

  const handleConfirmTransfers = useCallback(
    (pairs: { leftId: string; rightId: string }[]) => {
      if (pairs.length === 0) {
        setStep("results");
        return;
      }
      applyMergesMutation.mutate(
        { pairs },
        {
          onSuccess: (apply) => {
            setImportResult((prev) =>
              prev
                ? {
                    ...prev,
                    mergedTransfers: prev.mergedTransfers + apply.merged,
                  }
                : prev
            );
            if (apply.merged > 0) {
              toast.success(`Merged ${apply.merged} transfers`);
            }
            if (apply.errors.length > 0) {
              toast.error(`${apply.errors.length} pair(s) could not be merged`);
            }
            setStep("results");
          },
          onError: (err) => {
            toast.error(err.message || "Failed to apply merges");
            setStep("results");
          },
        }
      );
    },
    [applyMergesMutation]
  );

  const handleSkipTransfers = useCallback(() => {
    setStep("results");
  }, []);

  const handleReset = useCallback(() => {
    setStep("upload");
    setAccountId("");
    setFileName("");
    setImportResult(null);
    setDetectionResult(null);
    csvParser.reset();
  }, [csvParser]);

  return (
    <div className="mx-auto w-full">
      {step === "upload" && (
        <UploadStep
          accountId={accountId}
          onAccountChange={setAccountId}
          rowCount={csvParser.rowCount}
          fileName={fileName}
          parseError={csvParser.error}
          isParsing={csvParser.isLoading}
          onFileSelect={handleFileSelect}
          onNext={() => setStep("map")}
        />
      )}

      {step === "map" && (
        <MapColumnsStep
          headers={csvParser.headers}
          sampleRow={csvParser.rows[0] ?? []}
          mapping={columnMapping.mapping}
          amountMode={columnMapping.amountMode}
          onSetField={columnMapping.setField}
          onSetAmountMode={columnMapping.setAmountMode}
          hasRequiredMappings={columnMapping.hasRequiredMappings}
          onBack={() => setStep("upload")}
          onNext={() => setStep("preview")}
        />
      )}

      {step === "preview" && (
        <PreviewStep
          rows={validatedRows}
          onBack={() => setStep("map")}
          onImport={handleImport}
        />
      )}

      {step === "importing" && <ImportingStep />}

      {step === "transfer-review" && detectionResult && (
        <TransferDetectionReview
          result={detectionResult}
          onConfirm={handleConfirmTransfers}
          onCancel={handleSkipTransfers}
          isApplying={applyMergesMutation.isPending}
          cancelLabel="Skip"
          confirmLabel="Merge selected"
        />
      )}

      {step === "results" && importResult && (
        <ResultsStep
          result={importResult}
          accountName={accountName}
          onImportMore={handleReset}
        />
      )}
    </div>
  );
}
