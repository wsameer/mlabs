import { XIcon, WalletIcon, InfoIcon } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { useAccounts } from "@/features/accounts/api/use-accounts";
import { Alert, AlertAction, AlertTitle } from "@workspace/ui/components/alert";

export interface AccountScopeBannerProps {
  accountIds: string[] | undefined;
  onClear: () => void;
}

export function AccountScopeBanner({
  accountIds,
  onClear,
}: AccountScopeBannerProps) {
  const { data: accounts } = useAccounts();

  if (!accountIds || accountIds.length === 0) return null;

  const nameMap = new Map<string, string>();
  accounts?.forEach((a) => nameMap.set(a.id, a.name));

  const resolvedNames = accountIds
    .map((id) => nameMap.get(id))
    .filter((n): n is string => !!n);

  let label: string;
  if (resolvedNames.length === 0) {
    label = "Showing transactions for selected account";
  } else if (resolvedNames.length === 1) {
    label = `Showing transactions for ${resolvedNames[0]}`;
  } else {
    const [first, ...rest] = resolvedNames;
    label = `Showing transactions for ${first} +${rest.length} more`;
  }

  return (
    <Alert
      className="flex border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-50"
      data-testid="tx-account-scope-banner"
    >
      <InfoIcon />
      <AlertTitle>{label}</AlertTitle>
      <AlertAction>
        <Button
          type="button"
          size="xs"
          variant="destructive"
          onClick={onClear}
          data-testid="tx-account-scope-clear"
        >
          <XIcon data-icon="inline-end" />
          Clear
        </Button>
      </AlertAction>
    </Alert>
  );

  return (
    <div
      className="flex items-center justify-between gap-3 rounded-md border border-border bg-muted/60 px-3 py-2"
      data-testid="tx-account-scope-banner"
    >
      <div className="flex min-w-0 items-center gap-2">
        <WalletIcon className="size-4 shrink-0 text-muted-foreground" />
        <p className="truncate text-sm text-foreground">{label}</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClear}
        className="shrink-0 gap-1"
        data-testid="tx-account-scope-clear"
      >
        <XIcon className="size-3" />
        Clear
      </Button>
    </div>
  );
}
