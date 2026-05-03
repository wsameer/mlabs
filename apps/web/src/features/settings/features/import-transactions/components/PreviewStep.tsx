import { useMemo } from "react";
import { CheckCircle2Icon, AlertTriangleIcon, XCircleIcon } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { ScrollArea } from "@workspace/ui/components/scroll-area";

import type { ValidatedRow } from "../types";

interface PreviewStepProps {
  rows: ValidatedRow[];
  onBack: () => void;
  onImport: () => void;
}

export function PreviewStep({ rows, onBack, onImport }: PreviewStepProps) {
  const stats = useMemo(() => {
    let valid = 0;
    let warnings = 0;
    let errors = 0;
    for (const row of rows) {
      if (!row.validation.isValid) errors++;
      else if (row.validation.warnings.length > 0) warnings++;
      else valid++;
    }
    return { valid, warnings, errors, importable: valid + warnings };
  }, [rows]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-base font-semibold">Preview Import</h3>
        <p className="text-sm text-muted-foreground">
          Review your transactions before importing. Rows with errors will be
          skipped.
        </p>
      </div>

      <div className="flex gap-3 text-sm">
        <div className="flex items-center gap-1.5">
          <CheckCircle2Icon className="size-4 text-emerald-600" />
          <span>{stats.valid} valid</span>
        </div>
        <div className="flex items-center gap-1.5">
          <AlertTriangleIcon className="size-4 text-amber-500" />
          <span>{stats.warnings} warnings</span>
        </div>
        <div className="flex items-center gap-1.5">
          <XCircleIcon className="size-4 text-destructive" />
          <span>{stats.errors} errors</span>
        </div>
      </div>

      <ScrollArea className="h-[50svh] rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.index}
                className={
                  !row.validation.isValid ? "bg-destructive/5 opacity-60" : ""
                }
              >
                <TableCell className="text-xs text-muted-foreground">
                  {row.index + 1}
                </TableCell>
                <TableCell className="text-xs">{row.date}</TableCell>
                <TableCell className="max-w-40 truncate text-xs">
                  {row.description || "—"}
                </TableCell>
                <TableCell className="text-right text-xs font-medium tabular-nums">
                  {row.amount ? `$${row.amount}` : "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      row.isTransferLeg
                        ? "outline"
                        : row.type === "INCOME"
                          ? "default"
                          : "secondary"
                    }
                    className="text-[0.65rem]"
                  >
                    {row.isTransferLeg
                      ? `Transfer-${row.transferLeg}`
                      : row.type}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-24 truncate text-xs">
                  {row.subcategory
                    ? `${row.category || "—"} / ${row.subcategory}`
                    : row.category || "—"}
                </TableCell>
                <TableCell>
                  <StatusBadge validation={row.validation} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onImport} disabled={stats.importable === 0}>
          Import {stats.importable} Transactions
        </Button>
      </div>
    </div>
  );
}

function StatusBadge({
  validation,
}: {
  validation: ValidatedRow["validation"];
}) {
  if (!validation.isValid) {
    return (
      <Badge variant="destructive" className="text-[0.65rem]">
        Error
      </Badge>
    );
  }
  if (validation.warnings.length > 0) {
    return (
      <Badge variant="outline" className="text-[0.65rem] text-amber-600">
        Warn
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[0.65rem] text-emerald-600">
      OK
    </Badge>
  );
}
