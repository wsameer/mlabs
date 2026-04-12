import { CheckCircle2Icon, XCircleIcon } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

import { Button } from "@workspace/ui/components/button";
import { Card, CardContent } from "@workspace/ui/components/card";
import { TRANSACTIONS_ROUTE } from "@/constants";

import type { ImportResult } from "../types";

interface ResultsStepProps {
  result: ImportResult;
  accountName: string;
  onImportMore: () => void;
}

export function ResultsStep({
  result,
  accountName,
  onImportMore,
}: ResultsStepProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <CheckCircle2Icon className="mx-auto size-10 text-emerald-600" />
        <h3 className="mt-2 text-base font-semibold">Import Complete</h3>
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-emerald-600">
                {result.imported}
              </p>
              <p className="text-xs text-muted-foreground">Imported</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-destructive">
                {result.failed}
              </p>
              <p className="text-xs text-muted-foreground">Failed</p>
            </div>
          </div>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Transactions imported into <strong>{accountName}</strong>
          </p>
        </CardContent>
      </Card>

      {result.errors.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <p className="mb-2 text-sm font-medium">
              <XCircleIcon className="mr-1 inline-block size-4 text-destructive" />
              Failed Rows
            </p>
            <div className="max-h-40 space-y-1 overflow-y-auto text-xs text-muted-foreground">
              {result.errors.map((err) => (
                <p key={err.index}>
                  Row {err.index + 1}: {err.message}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={onImportMore}>
          Import More
        </Button>
        <Button
          onClick={() => navigate({ to: TRANSACTIONS_ROUTE })}
        >
          View Transactions
        </Button>
      </div>
    </div>
  );
}
