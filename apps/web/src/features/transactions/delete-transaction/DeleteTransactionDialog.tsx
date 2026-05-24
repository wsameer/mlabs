import { toast } from "sonner";
import type { Transaction } from "@workspace/types";
import { formatCurrency } from "@/features/accounts/lib/format-utils";
import { useDeleteTransaction } from "../api/use-transactions";
import { cn } from "@workspace/ui/lib/utils";

import { Button } from "@workspace/ui/components/button";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
}

export function DeleteTransactionDialog({
  open,
  onOpenChange,
  transaction,
}: Props) {
  const deleteTransaction = useDeleteTransaction();

  function handleClose() {
    onOpenChange(false);
  }

  function handleDelete() {
    if (!transaction) return;

    deleteTransaction.mutate(transaction.id, {
      onSuccess: () => {
        toast.success("Transaction deleted");
        handleClose();
      },
      onError: (err) => {
        toast.error(err.message || "Failed to delete transaction");
      },
    });
  }

  const isTransfer = transaction?.type === "TRANSFER";
  const title = "Are you absolutely sure?";
  const description = isTransfer
    ? "This will delete both sides of the transfer and reverse the balance changes on both accounts. This action cannot be undone."
    : "This will delete the transaction and reverse the balance change on the associated account. This action cannot be undone.";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid="tx-delete-dialog">
        <AlertDialogHeader className="text-left">
          <AlertDialogTitle className="text-left">{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <DeleteContent
          transaction={transaction}
          isPending={deleteTransaction.isPending}
          onCancel={handleClose}
          onDelete={handleDelete}
        />
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface DeleteContentProps {
  transaction: Transaction | null;
  isPending: boolean;
  onCancel: () => void;
  onDelete: () => void;
  className?: string;
}

function DeleteContent({
  transaction,
  isPending,
  onCancel,
  onDelete,
  className,
}: DeleteContentProps) {
  if (!transaction) return null;

  const label =
    transaction.description ||
    `${transaction.type.toLowerCase()} of ${formatCurrency(Number(transaction.signedAmount))}`;

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
        <p className="text-sm font-medium">Delete &ldquo;{label}&rdquo;?</p>
        {transaction.type === "TRANSFER" && (
          <p className="mt-1 text-xs text-muted-foreground">
            Both the outgoing and incoming transfer records will be removed.
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          data-testid="tx-delete-cancel"
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={onDelete}
          disabled={isPending}
          data-testid="tx-delete-confirm"
        >
          {isPending ? "Deleting..." : "Delete"}
        </Button>
      </div>
    </div>
  );
}
