import { WalletCardsIcon } from "lucide-react";

import { Spinner } from "@workspace/ui/components/spinner";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty";

import { AddAccountDialog } from "./AddAccountDialog";
import { EditAccountDialog } from "./EditAccountDialog";
import { DeleteAccountDialog } from "./DeleteAccountDialog";
import { AccountGroupList } from "./AccountGroupList";
import { useAccountsSection } from "./useAccountsSection";
import { Card, CardContent } from "@workspace/ui/components/card";

export function AccountsSection() {
  const {
    isPending,
    grouped,
    addOpen,
    setAddOpen,
    addDefaultGroup,
    editOpen,
    setEditOpen,
    editAccount,
    deleteOpen,
    setDeleteOpen,
    deleteTarget,
    handleAdd,
    handleEdit,
    handleDelete,
  } = useAccountsSection();

  return (
    <div className="flex flex-col gap-4">
      {isPending ? (
        <div className="flex justify-center py-12">
          <Spinner className="size-6 text-muted-foreground" />
        </div>
      ) : !grouped.length ? (
        <Empty className="rounded-xl border-none py-16 md:rounded-lg md:border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <WalletCardsIcon />
            </EmptyMedia>
            <EmptyTitle>No accounts</EmptyTitle>
            <EmptyDescription>
              Add your first account to start tracking your finances.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-5">
          {grouped.map(({ group, meta, accounts }) => (
            <Card key={group} size="sm">
              <CardContent>
                <AccountGroupList
                  group={group}
                  meta={meta}
                  accounts={accounts}
                  onAdd={handleAdd}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddAccountDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        defaultGroup={addDefaultGroup}
      />

      <EditAccountDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        account={editAccount}
      />

      <DeleteAccountDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        account={deleteTarget}
      />
    </div>
  );
}
