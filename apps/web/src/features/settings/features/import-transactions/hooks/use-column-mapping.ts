import { useState, useCallback, useEffect } from "react";
import { autoDetectColumns } from "../lib/csv-auto-detect";
import type { AmountMode, ColumnMapping, TransactionField } from "../types";

type ColumnMappingResult = {
  mapping: ColumnMapping;
  amountMode: AmountMode;
  setField: (field: TransactionField, columnIndex: number | null) => void;
  setAmountMode: (mode: AmountMode) => void;
  hasRequiredMappings: boolean;
};

export function useColumnMapping(headers: string[]): ColumnMappingResult {
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [amountMode, setAmountMode] = useState<AmountMode>("signed");

  // Auto-detect when headers change
  useEffect(() => {
    if (headers.length === 0) return;
    const detected = autoDetectColumns(headers);
    setMapping(detected.mapping);
    setAmountMode(detected.amountMode);
  }, [headers]);

  const setField = useCallback(
    (field: TransactionField, columnIndex: number | null) => {
      setMapping((prev) => ({ ...prev, [field]: columnIndex }));
    },
    []
  );

  const hasRequiredMappings =
    mapping.date != null &&
    (amountMode === "signed"
      ? mapping.amount != null
      : mapping.debit != null || mapping.credit != null);

  return {
    mapping,
    amountMode,
    setField,
    setAmountMode,
    hasRequiredMappings,
  };
}
