import { useRef } from "react";
import { UploadIcon, FileSpreadsheetIcon, AlertCircleIcon } from "lucide-react";

import { useAccounts } from "@/features/accounts/api/use-accounts";
import { Button } from "@workspace/ui/components/button";
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@workspace/ui/components/field";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { Badge } from "@workspace/ui/components/badge";
import { Spinner } from "@workspace/ui/components/spinner";

interface UploadStepProps {
  accountId: string;
  onAccountChange: (id: string) => void;
  rowCount: number;
  fileName: string;
  parseError: string | null;
  isParsing: boolean;
  onFileSelect: (file: File) => void;
  onNext: () => void;
}

export function UploadStep({
  accountId,
  onAccountChange,
  rowCount,
  fileName,
  parseError,
  isParsing,
  onFileSelect,
  onNext,
}: UploadStepProps) {
  const { data: accounts } = useAccounts({ isActive: true });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canProceed = accountId && rowCount > 0 && !parseError;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-base font-semibold">Import Transactions</h3>
        <p className="text-sm text-muted-foreground">
          Upload a CSV file to import transactions into an account.
        </p>
      </div>

      <Alert>
        <AlertCircleIcon className="size-4" />
        <AlertDescription>
          Maximum 500 transactions per import. Only CSV files are supported.
          Transfers cannot be imported — import them as income/expense and
          convert manually.
        </AlertDescription>
      </Alert>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="import-account">Target Account</FieldLabel>
          <NativeSelect
            id="import-account"
            className="w-full"
            value={accountId}
            onChange={(e) => onAccountChange(e.target.value)}
          >
            <NativeSelectOption value="">Select account...</NativeSelectOption>
            {accounts?.map((account) => (
              <NativeSelectOption key={account.id} value={account.id}>
                {account.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>

        <Field>
          <FieldLabel>CSV File</FieldLabel>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileSelect(file);
            }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-8 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/50"
          >
            {isParsing ? (
              <Spinner className="size-5" />
            ) : fileName ? (
              <>
                <FileSpreadsheetIcon className="size-5" />
                <span className="font-medium text-foreground">{fileName}</span>
                <Badge variant="secondary">{rowCount} rows</Badge>
              </>
            ) : (
              <>
                <UploadIcon className="size-5" />
                <span>Click to select a CSV file</span>
              </>
            )}
          </button>
        </Field>
      </FieldGroup>

      {parseError && (
        <Alert variant="destructive">
          <AlertCircleIcon className="size-4" />
          <AlertDescription>{parseError}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!canProceed}>
          Next: Map Columns
        </Button>
      </div>
    </div>
  );
}
