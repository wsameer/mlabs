import {
  useOpenCreateTransaction,
  useTransactionType,
  useUiActions,
} from "@/hooks/use-ui-store";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";

import { TransactionsWrapper } from "./components/TransactionsWrapper";

export function AddTransactionPopover() {
  const isOpen = useOpenCreateTransaction();
  const selectedTransactionType = useTransactionType();

  const { setOpenCreateTransaction } = useUiActions();
  const isTransfer = selectedTransactionType === "TRANSFER";

  return (
    <Dialog open={isOpen} onOpenChange={setOpenCreateTransaction}>
      <DialogContent className="sm:max-w-131.25" data-testid="tx-create-dialog">
        <DialogHeader>
          <DialogTitle className="text-left text-lg">
            Record
            {isTransfer ? " a " : " an "}
            {selectedTransactionType}
          </DialogTitle>
          <DialogDescription>
            Fill in the details below to record your transaction.
          </DialogDescription>
        </DialogHeader>
        <div className="no-scrollbar max-h-[60svh] overflow-y-auto">
          <TransactionsWrapper />
        </div>
        <DialogFooter>
          <DialogClose
            className="w-full"
            render={<Button variant="secondary" data-testid="tx-create-cancel">Cancel</Button>}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
