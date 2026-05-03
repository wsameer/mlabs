import { useState } from "react";
import { toast } from "sonner";
import type { Transaction, Account } from "@workspace/types";

import {
  useMergeAsTransfer,
  useTransferCounterLeg,
} from "../api/use-transactions";

import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import {
  NativeSelect,
  NativeSelectOption,
} from "@workspace/ui/components/native-select";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@workspace/ui/components/field";

interface Props {
  transaction: Transaction;
  accounts: Account[] | undefined;
  onMerged: () => void;
}

export function MergeTransferPanel({ transaction, accounts, onMerged }: Props) {
  const transferId = transaction.transferId ?? null;
  const counterQuery = useTransferCounterLeg(transferId, transaction.id);
  const merge = useMergeAsTransfer();
  const [pickedAccountId, setPickedAccountId] = useState("");

  if (!transferId) {
    return (
      <Alert>
        <AlertDescription className="text-xs">
          No transfer id found. Delete and recreate this transaction as a
          transfer if needed.
        </AlertDescription>
      </Alert>
    );
  }

  if (counterQuery.isLoading) {
    return (
      <Alert>
        <AlertDescription className="text-xs">
          Looking up counter leg...
        </AlertDescription>
      </Alert>
    );
  }

  if (counterQuery.data === "ambiguous") {
    return (
      <Alert variant="destructive">
        <AlertDescription className="text-xs">
          More than two rows share this transfer id. Remove duplicates before
          merging.
        </AlertDescription>
      </Alert>
    );
  }

  const counter = counterQuery.data ?? null;

  const handleMerge = (counterAccountId?: string) => {
    merge.mutate(
      { id: transaction.id, counterAccountId },
      {
        onSuccess: () => {
          toast.success("Transfer merged");
          onMerged();
        },
        onError: (err) => {
          toast.error(err.message || "Failed to merge transfer");
        },
      }
    );
  };

  if (counter) {
    const counterAccountName =
      accounts?.find((a) => a.id === counter.accountId)?.name ?? "another account";
    return (
      <Alert>
        <AlertDescription className="flex flex-col gap-2 text-xs">
          <span>
            Paired leg found in <strong>{counterAccountName}</strong>.
          </span>
          <Button
            type="button"
            size="sm"
            disabled={merge.isPending}
            onClick={() => handleMerge()}
            data-testid="tx-merge-transfer"
          >
            {merge.isPending ? "Merging..." : "Merge as transfer"}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const eligibleAccounts = accounts?.filter(
    (a) => a.id !== transaction.accountId
  );

  return (
    <Alert>
      <AlertDescription className="flex flex-col gap-2 text-xs">
        <span>No counter leg found yet. Pick the destination account:</span>
        <Field>
          <FieldLabel htmlFor="merge-counter-account">Counter account</FieldLabel>
          <NativeSelect
            id="merge-counter-account"
            className="w-full"
            value={pickedAccountId}
            onChange={(e) => setPickedAccountId(e.target.value)}
            data-testid="tx-merge-counter-account"
          >
            <NativeSelectOption value="">Select account...</NativeSelectOption>
            {eligibleAccounts?.map((a) => (
              <NativeSelectOption key={a.id} value={a.id}>
                {a.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          {pickedAccountId === "" && (
            <FieldError>Required</FieldError>
          )}
        </Field>
        <Button
          type="button"
          size="sm"
          disabled={!pickedAccountId || merge.isPending}
          onClick={() => handleMerge(pickedAccountId)}
          data-testid="tx-merge-transfer"
        >
          {merge.isPending ? "Merging..." : "Create counter leg & merge"}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
