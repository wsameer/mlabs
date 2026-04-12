import { useMediaQuery } from "@/hooks/use-media-query";
import { toast } from "sonner";
import type { Transaction } from "@workspace/types";
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
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@workspace/ui/components/drawer";

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
  const isDesktop = useMediaQuery("(min-width: 768px)");
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

  if (isDesktop) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
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

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-left">{title}</DrawerTitle>
          <DrawerDescription className="text-left">
            {description}
          </DrawerDescription>
        </DrawerHeader>
        <DeleteContent
          transaction={transaction}
          isPending={deleteTransaction.isPending}
          onCancel={handleClose}
          onDelete={handleDelete}
          className="px-4"
        />
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
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
    `${transaction.type.toLowerCase()} of $${transaction.amount}`;

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

      <div className="flex justify-end gap-2 md:hidden">
        <Button
          type="button"
          variant="destructive"
          onClick={onDelete}
          disabled={isPending}
          className="w-full"
        >
          {isPending ? "Deleting..." : "Delete"}
        </Button>
      </div>

      <div className="hidden justify-end gap-2 md:flex">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={onDelete}
          disabled={isPending}
        >
          {isPending ? "Deleting..." : "Delete"}
        </Button>
      </div>
    </div>
  );
}
