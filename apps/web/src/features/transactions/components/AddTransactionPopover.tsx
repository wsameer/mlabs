import {
  useOpenCreateTransaction,
  useTransactionType,
  useUiActions,
} from "@/hooks/use-ui-store";
import { Button } from "@workspace/ui/components/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@workspace/ui/components/drawer";
import { TransactionsWrapper } from "./TransactionsWrapper";
import { useIsMobile } from "@workspace/ui/hooks/use-mobile";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";

export function AddTransactionPopover() {
  const isOpen = useOpenCreateTransaction();
  const selectedTransactionType = useTransactionType();
  const isMobile = useIsMobile();

  const { setOpenCreateTransaction } = useUiActions();
  const isTransfer = selectedTransactionType === "TRANSFER";

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={setOpenCreateTransaction}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-left text-xl font-light">
              Record
              {isTransfer ? " a " : " an "}
              {selectedTransactionType}
            </DrawerTitle>
            <DrawerDescription className="text-left">
              Fill in the details below to record your transaction.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4">
            <TransactionsWrapper />
          </div>
          <DrawerFooter className="pt-2">
            <DrawerClose asChild>
              <Button className="w-full" variant="secondary">
                Cancel
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpenCreateTransaction}>
      <DialogContent className="sm:max-w-131.25">
        <DialogHeader>
          <DialogTitle className="text-left text-xl font-light">
            Record
            {isTransfer ? " a " : " an "}
            {selectedTransactionType}
          </DialogTitle>
          <DialogDescription>
            Fill in the details below to record your transaction.
          </DialogDescription>
        </DialogHeader>
        <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4">
          <TransactionsWrapper />
        </div>
        <DialogFooter className="pt-2">
          <DialogClose
            className="w-full"
            render={<Button variant="secondary">Cancel</Button>}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
