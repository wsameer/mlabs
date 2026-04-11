import { WalletCardsIcon } from "lucide-react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty";

export function AccountsSection() {
  return (
    <div className="flex flex-col gap-5">
      <Empty className="rounded-xl border-none py-16 md:rounded-lg md:border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <WalletCardsIcon />
          </EmptyMedia>
          <EmptyTitle>Accounts</EmptyTitle>
          <EmptyDescription>
            Manage your bank accounts and credit cards. Coming soon.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  );
}
