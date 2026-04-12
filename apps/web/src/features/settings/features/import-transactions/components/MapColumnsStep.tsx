import { InfoIcon } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select";
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { Badge } from "@workspace/ui/components/badge";

import { MAPPABLE_FIELDS } from "../lib/csv-auto-detect";
import type { AmountMode, ColumnMapping, TransactionField } from "../types";

interface MapColumnsStepProps {
  headers: string[];
  sampleRow: string[];
  mapping: ColumnMapping;
  amountMode: AmountMode;
  onSetField: (field: TransactionField, index: number | null) => void;
  onSetAmountMode: (mode: AmountMode) => void;
  hasRequiredMappings: boolean;
  onBack: () => void;
  onNext: () => void;
}

export function MapColumnsStep({
  headers,
  sampleRow,
  mapping,
  amountMode,
  onSetField,
  onSetAmountMode,
  hasRequiredMappings,
  onBack,
  onNext,
}: MapColumnsStepProps) {
  // Filter fields based on amount mode
  const visibleFields = MAPPABLE_FIELDS.filter((f) => {
    if (amountMode === "signed")
      return f.field !== "debit" && f.field !== "credit";
    if (amountMode === "split") return f.field !== "amount";
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-base font-semibold">Map Columns</h3>
        <p className="text-sm text-muted-foreground">
          Match your CSV columns to transaction fields. We auto-detected what we
          could.
        </p>
      </div>

      <Alert>
        <InfoIcon className="size-4" />
        <AlertDescription>
          <strong>Transfer transactions</strong> cannot be imported
          automatically. Import them as income/expense and convert them manually
          after import.
        </AlertDescription>
      </Alert>

      <Field>
        <FieldLabel>Amount Format</FieldLabel>
        <NativeSelect
          value={amountMode}
          onChange={(e) => onSetAmountMode(e.target.value as AmountMode)}
          className="w-full"
        >
          <NativeSelectOption value="signed">
            Single amount column (negative = expense)
          </NativeSelectOption>
          <NativeSelectOption value="split">
            Separate debit and credit columns
          </NativeSelectOption>
        </NativeSelect>
      </Field>

      <FieldGroup>
        {visibleFields.map(({ field, label, required }) => {
          const selectedIndex = mapping[field];
          const sampleValue =
            selectedIndex != null ? (sampleRow[selectedIndex] ?? "") : "";

          return (
            <Field key={field}>
              <FieldLabel>
                {label}
                {required && <span className="ml-1 text-destructive">*</span>}
              </FieldLabel>
              <div className="flex items-center gap-2">
                <NativeSelect
                  value={selectedIndex != null ? String(selectedIndex) : ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    onSetField(field, val === "" ? null : Number(val));
                  }}
                  className="flex-1"
                >
                  <NativeSelectOption value="">-- Skip --</NativeSelectOption>
                  {headers.map((header, i) => (
                    <NativeSelectOption key={i} value={String(i)}>
                      {header}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                {sampleValue && (
                  <Badge
                    variant="outline"
                    className="max-w-32 truncate text-xs"
                  >
                    {sampleValue}
                  </Badge>
                )}
              </div>
            </Field>
          );
        })}
      </FieldGroup>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} disabled={!hasRequiredMappings}>
          Next: Preview
        </Button>
      </div>
    </div>
  );
}
