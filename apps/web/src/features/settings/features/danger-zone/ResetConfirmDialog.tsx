import { useState } from "react";
import { TriangleAlertIcon } from "lucide-react";

import { useMediaQuery } from "@/hooks/use-media-query";
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
import { cn } from "@workspace/ui/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceName: string;
  title: string;
  description: string;
  consequences: string[];
  confirmLabel: string;
  pendingLabel: string;
  isPending: boolean;
  onConfirm: () => void;
}

export function ResetConfirmDialog({
  open,
  onOpenChange,
  workspaceName,
  title,
  description,
  consequences,
  confirmLabel,
  pendingLabel,
  isPending,
  onConfirm,
}: Props) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [confirmationText, setConfirmationText] = useState("");

  const isConfirmed =
    confirmationText.trim().toLowerCase() ===
    workspaceName.trim().toLowerCase();

  function handleOpenChange(next: boolean) {
    if (isPending) return;
    if (!next) setConfirmationText("");
    onOpenChange(next);
  }

  function handleCancel() {
    handleOpenChange(false);
  }

  if (isDesktop) {
    return (
      <AlertDialog open={open} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="text-left">{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </AlertDialogHeader>
          <Body
            workspaceName={workspaceName}
            consequences={consequences}
            confirmationText={confirmationText}
            onConfirmationChange={setConfirmationText}
            isConfirmed={isConfirmed}
            isPending={isPending}
            confirmLabel={confirmLabel}
            pendingLabel={pendingLabel}
            onCancel={handleCancel}
            onConfirm={onConfirm}
            showCancelButton
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
        <Body
          workspaceName={workspaceName}
          consequences={consequences}
          confirmationText={confirmationText}
          onConfirmationChange={setConfirmationText}
          isConfirmed={isConfirmed}
          isPending={isPending}
          confirmLabel={confirmLabel}
          pendingLabel={pendingLabel}
          onCancel={handleCancel}
          onConfirm={onConfirm}
          className="px-4"
        />
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline" disabled={isPending}>
              Cancel
            </Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

interface BodyProps {
  workspaceName: string;
  consequences: string[];
  confirmationText: string;
  onConfirmationChange: (value: string) => void;
  isConfirmed: boolean;
  isPending: boolean;
  confirmLabel: string;
  pendingLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  className?: string;
  showCancelButton?: boolean;
}

function Body({
  workspaceName,
  consequences,
  confirmationText,
  onConfirmationChange,
  isConfirmed,
  isPending,
  confirmLabel,
  pendingLabel,
  onCancel,
  onConfirm,
  className,
  showCancelButton = false,
}: BodyProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
        <div className="flex items-start gap-2.5">
          <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
          <ul className="flex flex-col gap-1 text-xs text-muted-foreground">
            {consequences.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm-workspace-name" className="text-xs">
          To confirm, type <code>{workspaceName}</code> below
        </Label>
        <Input
          id="confirm-workspace-name"
          value={confirmationText}
          onChange={(e) => onConfirmationChange(e.target.value)}
          placeholder={workspaceName}
          autoComplete="off"
          autoFocus
          disabled={isPending}
        />
      </div>

      <div className="flex justify-end gap-2 md:hidden">
        <Button
          type="button"
          variant="destructive"
          onClick={onConfirm}
          disabled={!isConfirmed || isPending}
          className="w-full"
        >
          {isPending ? pendingLabel : confirmLabel}
        </Button>
      </div>

      <div className="hidden justify-end gap-2 md:flex">
        {showCancelButton && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
        )}
        <Button
          type="button"
          variant="destructive"
          onClick={onConfirm}
          disabled={!isConfirmed || isPending}
        >
          {isPending ? pendingLabel : confirmLabel}
        </Button>
      </div>
    </div>
  );
}
