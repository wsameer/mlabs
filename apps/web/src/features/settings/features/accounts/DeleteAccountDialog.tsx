import { useState } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { toast } from "sonner";
import type { Account } from "@workspace/types";
import { useDeleteAccount } from "@/features/accounts/api/use-accounts";
import { cn } from "@workspace/ui/lib/utils";
import { TriangleAlertIcon } from "lucide-react";

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
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account | null;
}

export function DeleteAccountDialog({ open, onOpenChange, account }: Props) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const deleteAccount = useDeleteAccount();
  const [confirmationText, setConfirmationText] = useState("");

  const isConfirmed =
    confirmationText.trim().toLowerCase() ===
    (account?.name ?? "").trim().toLowerCase();

  function handleOpenChange(next: boolean) {
    if (!next) setConfirmationText("");
    onOpenChange(next);
  }

  function handleClose() {
    handleOpenChange(false);
  }

  function handleDelete() {
    if (!account || !isConfirmed) return;

    deleteAccount.mutate(account.id, {
      onSuccess: () => {
        toast.success("Account deleted");
        handleClose();
      },
      onError: (err) => {
        toast.error(err.message || "Failed to delete account");
      },
    });
  }

  const title = "Delete account?";
  const description = "This action cannot be undone.";

  if (isDesktop) {
    return (
      <AlertDialog open={open} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="text-left">{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <DeleteContent
            accountName={account?.name}
            confirmationText={confirmationText}
            onConfirmationChange={setConfirmationText}
            isConfirmed={isConfirmed}
            isPending={deleteAccount.isPending}
            onCancel={handleClose}
            onDelete={handleDelete}
          />
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-left">{title}</DrawerTitle>
          <DrawerDescription className="text-left">
            {description}
          </DrawerDescription>
        </DrawerHeader>
        <DeleteContent
          accountName={account?.name}
          confirmationText={confirmationText}
          onConfirmationChange={setConfirmationText}
          isConfirmed={isConfirmed}
          isPending={deleteAccount.isPending}
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
  accountName?: string;
  confirmationText: string;
  onConfirmationChange: (value: string) => void;
  isConfirmed: boolean;
  isPending: boolean;
  onCancel: () => void;
  onDelete: () => void;
  className?: string;
}

function DeleteContent({
  accountName,
  confirmationText,
  onConfirmationChange,
  isConfirmed,
  isPending,
  onCancel,
  onDelete,
  className,
}: DeleteContentProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {accountName && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
          <div className="flex items-start gap-2.5">
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium">
                Delete &ldquo;{accountName}&rdquo;
              </p>
              <p className="text-xs text-muted-foreground">
                All transactions, balances, and history for this account will be
                permanently lost.
              </p>
            </div>
          </div>
        </div>
      )}

      {accountName && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="confirm-account-name" className="text-sm">
            To confirm, type<span>{accountName}</span>below
          </Label>
          <Input
            id="confirm-account-name"
            value={confirmationText}
            onChange={(e) => onConfirmationChange(e.target.value)}
            placeholder={accountName}
            autoComplete="off"
            autoFocus
          />
        </div>
      )}

      <div className="flex justify-end gap-2 md:hidden">
        <Button
          type="button"
          variant="destructive"
          onClick={onDelete}
          disabled={!isConfirmed || isPending}
          className="w-full"
        >
          {isPending ? "Deleting..." : "Delete permanently"}
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
          disabled={!isConfirmed || isPending}
        >
          {isPending ? "Deleting..." : "Delete permanently"}
        </Button>
      </div>
    </div>
  );
}
