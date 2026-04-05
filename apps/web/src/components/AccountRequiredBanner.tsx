import { AlertTriangleIcon } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";

import { useUiActions } from "@/hooks/use-ui-store";
import { useAppStore } from "@/stores";

export function AccountRequiredBanner() {
  const hasAccount = useAppStore((state) => state.hasAccount);
  const { setOpenCreateAccount } = useUiActions();

  if (hasAccount) {
    return null;
  }

  return (
    <Alert className="w-auto border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-50">
      <AlertTriangleIcon />
      <AlertTitle>Add a bank account</AlertTitle>
      <AlertDescription>
        Create your first account to unlock all features
      </AlertDescription>
      <AlertAction>
        <Button
          size="xs"
          variant="default"
          onClick={() => setOpenCreateAccount(true)}
        >
          Add account
        </Button>
      </AlertAction>
    </Alert>
  );
}
