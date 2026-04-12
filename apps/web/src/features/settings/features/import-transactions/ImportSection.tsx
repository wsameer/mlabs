import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";

import { useAccounts } from "@/features/accounts/api/use-accounts";
import { useCategories } from "@/features/categories/api/use-categories";

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

  const { data: accounts } = useAccounts({ isActive: true });
  const { data: categories } = useCategories();
  const csvParser = useCsvParser();
  const columnMapping = useColumnMapping(csvParser.headers);
  const importMutation = useImportTransactions();

  // Transform rows whenever mapping changes
  const validatedRows: ValidatedRow[] = useMemo(() => {
    if (csvParser.rows.length === 0) return [];
    return transformRows(
      csvParser.rows,
      columnMapping.mapping,
      columnMapping.amountMode,
      categories ?? []
    );
  }, [csvParser.rows, columnMapping.mapping, columnMapping.amountMode, categories]);

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
        setStep("results");
        toast.success(`Imported ${result.imported} transactions`);
      },
      onError: (error) => {
        toast.error(error.message || "Import failed");
        setStep("preview");
      },
    });
  }, [validatedRows, accountId, importMutation]);

  const handleReset = useCallback(() => {
    setStep("upload");
    setAccountId("");
    setFileName("");
    setImportResult(null);
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
