import {
  useOpenCreateTransaction,
  useTransactionType,
  useUiActions,
} from "@/hooks/use-ui-store";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@workspace/ui/components/sheet";
import { Button } from "@workspace/ui/components/button";

import { TransactionsWrapper } from "./components/TransactionsWrapper";

export function AddTransactionPopover() {
  const isOpen = useOpenCreateTransaction();
  const selectedTransactionType = useTransactionType();
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const { setOpenCreateTransaction } = useUiActions();
  const isTransfer = selectedTransactionType === "TRANSFER";

  const title = (
    <>
      Record
      {isTransfer ? " a " : " an "}
      {selectedTransactionType}
    </>
  );
  const description = "Fill in the details below to record your transaction.";

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={setOpenCreateTransaction}>
        <DialogContent
          className="sm:max-w-131.25"
          data-testid="tx-create-dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-left text-lg">{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="no-scrollbar max-h-[60svh] overflow-y-auto">
            <TransactionsWrapper />
          </div>
          <DialogFooter>
            <DialogClose
              className="w-full"
              render={
                <Button variant="secondary" data-testid="tx-create-cancel">
                  Cancel
                </Button>
              }
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(nextOpen, eventDetails) => {
        // Clicks inside nested popovers (category picker, calendar) portal
        // outside the sheet's DOM tree, which Base UI treats as an outside
        // press and would otherwise close the sheet. Ignore those.
        if (!nextOpen && eventDetails?.reason === "outside-press") return;
        setOpenCreateTransaction(nextOpen);
      }}
    >
      <SheetContent
        side="bottom"
        className="max-h-[90svh] overflow-y-auto rounded-t-xl"
        data-testid="tx-create-dialog"
      >
        <SheetHeader className="p-4">
          <SheetTitle className="text-left text-lg">{title}</SheetTitle>
          <SheetDescription className="text-left">
            {description}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-0">
          <TransactionsWrapper />
        </div>
        <SheetFooter className="px-4 pt-2">
          <SheetClose
            className="w-full"
            render={
              <Button variant="secondary" data-testid="tx-create-cancel">
                Cancel
              </Button>
            }
          />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
