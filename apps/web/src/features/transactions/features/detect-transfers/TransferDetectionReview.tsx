import { useMemo, useState } from "react";
import { ArrowRightIcon, SparklesIcon } from "lucide-react";
import type {
  DetectTransfersResult,
  DetectedTransferPair,
  DetectedTransferRow,
  AmbiguousTransferMatch,
} from "@workspace/types";

import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Card, CardContent } from "@workspace/ui/components/card";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select";

interface Props {
  result: DetectTransfersResult;
  onConfirm: (pairs: { leftId: string; rightId: string }[]) => void;
  onCancel?: () => void;
  isApplying?: boolean;
  cancelLabel?: string;
  confirmLabel?: string;
}

type SelectedPairs = {
  // pair id (from result) → { leftId, rightId } we will submit
  [pairId: string]: { leftId: string; rightId: string };
};

export function TransferDetectionReview({
  result,
  onConfirm,
  onCancel,
  isApplying = false,
  cancelLabel = "Skip",
  confirmLabel = "Merge selected",
}: Props) {
  const [selected, setSelected] = useState<SelectedPairs>(() => {
    // Default: all auto-detected pairs are pre-checked.
    const initial: SelectedPairs = {};
    for (const p of result.pairs) {
      initial[p.id] = { leftId: p.rows[0].id, rightId: p.rows[1].id };
    }
    return initial;
  });

  const [ambigChoices, setAmbigChoices] = useState<Record<string, string>>(
    () => {
      // Default: nothing chosen for ambiguous matches.
      const initial: Record<string, string> = {};
      for (const a of result.ambiguous) initial[a.id] = "";
      return initial;
    }
  );

  const togglePair = (p: DetectedTransferPair) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[p.id]) {
        delete next[p.id];
      } else {
        next[p.id] = { leftId: p.rows[0].id, rightId: p.rows[1].id };
      }
      return next;
    });
  };

  const setAmbigCounter = (a: AmbiguousTransferMatch, candidateId: string) => {
    setAmbigChoices((prev) => ({ ...prev, [a.id]: candidateId }));
    setSelected((prev) => {
      const next = { ...prev };
      if (!candidateId) {
        delete next[a.id];
      } else {
        next[a.id] = { leftId: a.row.id, rightId: candidateId };
      }
      return next;
    });
  };

  const totalSelected = useMemo(
    () => Object.keys(selected).length,
    [selected]
  );

  const handleConfirm = () => {
    onConfirm(Object.values(selected));
  };

  if (result.pairs.length === 0 && result.ambiguous.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-base font-semibold">No transfers detected</h3>
          <p className="text-sm text-muted-foreground">
            Scanned {result.scanned} transactions. Nothing matched the
            heuristic (same amount, opposite direction, on different accounts,
            within ±1 day).
          </p>
        </div>
        {onCancel && (
          <div className="flex justify-end">
            <Button variant="outline" onClick={onCancel}>
              {cancelLabel}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-base font-semibold">Review detected transfers</h3>
        <p className="text-sm text-muted-foreground">
          Scanned {result.scanned} transactions. Confirm the pairs to merge as
          transfers — uncheck anything that isn't actually a transfer.
        </p>
      </div>

      <ScrollArea className="max-h-[60svh]">
        <div className="flex flex-col gap-3">
          {result.pairs.length > 0 && (
            <div className="flex flex-col gap-2">
              {result.pairs.map((p) => (
                <PairCard
                  key={p.id}
                  pair={p}
                  checked={!!selected[p.id]}
                  onToggle={() => togglePair(p)}
                />
              ))}
            </div>
          )}

          {result.ambiguous.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Needs your help
              </p>
              {result.ambiguous.map((a) => (
                <AmbiguousCard
                  key={a.id}
                  match={a}
                  selectedCandidateId={ambigChoices[a.id] ?? ""}
                  onChoose={(id) => setAmbigCounter(a, id)}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isApplying}
          >
            {cancelLabel}
          </Button>
        )}
        <Button
          onClick={handleConfirm}
          disabled={isApplying || totalSelected === 0}
        >
          {isApplying
            ? "Merging…"
            : `${confirmLabel} (${totalSelected})`}
        </Button>
      </div>
    </div>
  );
}

function PairCard({
  pair,
  checked,
  onToggle,
}: {
  pair: DetectedTransferPair;
  checked: boolean;
  onToggle: () => void;
}) {
  const [from, to] = orderRows(pair.rows);
  return (
    <Card>
      <CardContent className="flex items-start gap-3 py-3">
        <Checkbox checked={checked} onCheckedChange={onToggle} />
        <div className="flex flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs">
            <Badge
              variant={pair.confidence === "explicit" ? "default" : "outline"}
              className="text-[0.65rem]"
            >
              {pair.confidence === "explicit" ? (
                "Linked by Transfer ID"
              ) : (
                <span className="flex items-center gap-1">
                  <SparklesIcon className="size-3" /> Auto-detected
                </span>
              )}
            </Badge>
            <span className="text-muted-foreground">
              ${from.amount} on {from.date}
            </span>
          </div>
          <RowDirection from={from} to={to} />
        </div>
      </CardContent>
    </Card>
  );
}

function AmbiguousCard({
  match,
  selectedCandidateId,
  onChoose,
}: {
  match: AmbiguousTransferMatch;
  selectedCandidateId: string;
  onChoose: (id: string) => void;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 py-3">
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="outline" className="text-[0.65rem]">
              Multiple candidates
            </Badge>
            <span className="text-muted-foreground">
              ${match.row.amount} on {match.row.date} —{" "}
              {match.row.accountName}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {match.row.description ?? "(no description)"}
          </p>
          <NativeSelect
            value={selectedCandidateId}
            onChange={(e) => onChoose(e.target.value)}
            className="w-full text-xs"
          >
            <NativeSelectOption value="">Not a transfer</NativeSelectOption>
            {match.candidates.map((c) => (
              <NativeSelectOption key={c.id} value={c.id}>
                Pair with {c.accountName} — ${c.amount} on {c.date}
                {c.description ? ` (${c.description})` : ""}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      </CardContent>
    </Card>
  );
}

function RowDirection({
  from,
  to,
}: {
  from: DetectedTransferRow;
  to: DetectedTransferRow;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="font-medium">{from.accountName}</span>
      <ArrowRightIcon className="size-3 text-muted-foreground" />
      <span className="font-medium">{to.accountName}</span>
      {from.description && (
        <span className="ml-auto truncate text-muted-foreground">
          {from.description}
        </span>
      )}
    </div>
  );
}

function orderRows(
  rows: readonly [DetectedTransferRow, DetectedTransferRow]
): [DetectedTransferRow, DetectedTransferRow] {
  // Display "from" (EXPENSE / outflow) → "to" (INCOME / inflow).
  if (rows[0].type === "EXPENSE") return [rows[0], rows[1]];
  if (rows[1].type === "EXPENSE") return [rows[1], rows[0]];
  return [rows[0], rows[1]];
}
