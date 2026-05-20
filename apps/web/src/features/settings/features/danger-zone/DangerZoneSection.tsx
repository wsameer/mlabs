import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  EraserIcon,
  RotateCcwIcon,
  Trash2Icon,
  type LucideIcon,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";

import { clearProfileId } from "@/lib/api-client";
import { useAppStore } from "@/stores";

import {
  useClearTransactions,
  useDeleteWorkspace,
  useFactoryReset,
} from "./api";
import { ResetConfirmDialog } from "./ResetConfirmDialog";

type ActionId = "clear-transactions" | "factory-reset" | "delete-workspace";

export function DangerZoneSection() {
  const appProfile = useAppStore((state) => state.appProfile);
  const fetchAppData = useAppStore((state) => state.fetchAppData);
  const queryClient = useQueryClient();

  const profileId = appProfile?.id ?? "";
  const workspaceName = appProfile?.name ?? "";

  const [openAction, setOpenAction] = useState<ActionId | null>(null);

  const clearTransactionsMutation = useClearTransactions(profileId);
  const factoryResetMutation = useFactoryReset(profileId);
  const deleteWorkspaceMutation = useDeleteWorkspace(profileId);

  function handleOpenChange(action: ActionId, next: boolean) {
    setOpenAction(next ? action : null);
  }

  function handleClearTransactions() {
    clearTransactionsMutation.mutate(
      { confirmName: workspaceName },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries();
          toast.success("All transactions cleared");
          setOpenAction(null);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to clear transactions");
        },
      }
    );
  }

  function handleFactoryReset() {
    factoryResetMutation.mutate(
      { confirmName: workspaceName },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries();
          toast.success("Workspace reset to factory defaults");
          setOpenAction(null);
        },
        onError: (err) => {
          toast.error(err.message || "Failed to reset workspace");
        },
      }
    );
  }

  function handleDeleteWorkspace() {
    deleteWorkspaceMutation.mutate(
      { confirmName: workspaceName },
      {
        onSuccess: async () => {
          queryClient.clear();
          clearProfileId();
          toast.success("Workspace deleted");
          setOpenAction(null);
          await fetchAppData();
        },
        onError: (err) => {
          toast.error(err.message || "Failed to delete workspace");
        },
      }
    );
  }

  if (!appProfile) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-sm font-medium">Danger zone</h2>
        <p className="text-xs text-muted-foreground">
          These actions are permanent and cannot be undone.
        </p>
      </div>

      <ActionCard
        icon={EraserIcon}
        title="Clear all transactions"
        description="Deletes every transaction and resets each account balance to zero. Accounts, categories, and preferences are preserved."
        buttonLabel="Clear transactions"
        onClick={() => handleOpenChange("clear-transactions", true)}
      />

      <ActionCard
        icon={RotateCcwIcon}
        title="Factory reset"
        description="Deletes all transactions, accounts, and categories, then re-seeds the default categories. The workspace and your preferences stay."
        buttonLabel="Factory reset"
        onClick={() => handleOpenChange("factory-reset", true)}
      />

      <ActionCard
        icon={Trash2Icon}
        title="Delete workspace"
        description="Permanently deletes the workspace and everything in it. You'll be returned to onboarding."
        buttonLabel="Delete workspace"
        onClick={() => handleOpenChange("delete-workspace", true)}
      />

      {openAction === "clear-transactions" && (
        <ResetConfirmDialog
          open
          onOpenChange={(next) => handleOpenChange("clear-transactions", next)}
          workspaceName={workspaceName}
          title="Clear all transactions?"
          description="This permanently deletes every transaction in this workspace and resets account balances."
          consequences={[
            "All transactions will be deleted.",
            "Every account balance will be reset to 0.",
            "Accounts, categories, and preferences will be kept.",
          ]}
          confirmLabel="Clear transactions"
          pendingLabel="Clearing..."
          isPending={clearTransactionsMutation.isPending}
          onConfirm={handleClearTransactions}
        />
      )}

      {openAction === "factory-reset" && (
        <ResetConfirmDialog
          open
          onOpenChange={(next) => handleOpenChange("factory-reset", next)}
          workspaceName={workspaceName}
          title="Factory reset this workspace?"
          description="This permanently deletes all data inside the workspace and re-seeds the default categories."
          consequences={[
            "All transactions, accounts, and categories will be deleted.",
            "Default categories will be re-seeded.",
            "The workspace and your preferences will be kept.",
          ]}
          confirmLabel="Factory reset"
          pendingLabel="Resetting..."
          isPending={factoryResetMutation.isPending}
          onConfirm={handleFactoryReset}
        />
      )}

      {openAction === "delete-workspace" && (
        <ResetConfirmDialog
          open
          onOpenChange={(next) => handleOpenChange("delete-workspace", next)}
          workspaceName={workspaceName}
          title="Delete this workspace?"
          description="This permanently deletes the workspace and everything inside it. There is no undo."
          consequences={[
            "The workspace, all accounts, categories, and transactions will be deleted.",
          ]}
          confirmLabel="Delete workspace"
          pendingLabel="Deleting..."
          isPending={deleteWorkspaceMutation.isPending}
          onConfirm={handleDeleteWorkspace}
        />
      )}
    </div>
  );
}

interface ActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  buttonLabel: string;
  onClick: () => void;
}

function ActionCard({
  icon: Icon,
  title,
  description,
  buttonLabel,
  onClick,
}: ActionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="size-3 text-destructive" aria-hidden />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button type="button" variant="destructive" size="sm" onClick={onClick}>
          {buttonLabel}
        </Button>
      </CardContent>
    </Card>
  );
}
