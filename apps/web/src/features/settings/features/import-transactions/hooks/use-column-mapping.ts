import { useState, useCallback } from "react";
import { autoDetectColumns } from "../lib/csv-auto-detect";
import type { AmountMode, ColumnMapping, TransactionField } from "../types";

type ColumnMappingResult = {
  mapping: ColumnMapping;
  amountMode: AmountMode;
  setField: (field: TransactionField, columnIndex: number | null) => void;
  setAmountMode: (mode: AmountMode) => void;
  hasRequiredMappings: boolean;
};

type MappingState = {
  mapping: ColumnMapping;
  amountMode: AmountMode;
  prevHeaders: string[];
};

function detectFromHeaders(headers: string[]): MappingState {
  if (headers.length === 0) {
    return { mapping: {}, amountMode: "signed", prevHeaders: headers };
  }
  const detected = autoDetectColumns(headers);
  return {
    mapping: detected.mapping,
    amountMode: detected.amountMode,
    prevHeaders: headers,
  };
}

export function useColumnMapping(headers: string[]): ColumnMappingResult {
  const [state, setState] = useState<MappingState>(() =>
    detectFromHeaders(headers)
  );

  // Render-phase derived state update — no ref, no effect
  // Storing prevHeaders in state is the React-recommended pattern when refs are unavailable
  if (state.prevHeaders !== headers) {
    setState(detectFromHeaders(headers));
  }

  const setField = useCallback(
    (field: TransactionField, columnIndex: number | null) => {
      setState((prev) => ({
        ...prev,
        mapping: { ...prev.mapping, [field]: columnIndex },
      }));
    },
    []
  );

  const setAmountMode = useCallback((mode: AmountMode) => {
    setState((prev) => ({ ...prev, amountMode: mode }));
  }, []);

  const hasRequiredMappings =
    state.mapping.date != null &&
    (state.amountMode === "signed"
      ? state.mapping.amount != null
      : state.mapping.debit != null || state.mapping.credit != null);

  return {
    mapping: state.mapping,
    amountMode: state.amountMode,
    setField,
    setAmountMode,
    hasRequiredMappings,
  };
}
