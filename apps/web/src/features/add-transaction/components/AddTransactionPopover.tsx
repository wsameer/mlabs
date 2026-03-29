import {
  useOpenCreateTransaction,
  useTransactionType,
  useUiActions,
} from "@/hooks/use-ui-store";
import { TransactionTypeSchema } from "@workspace/types";
import { Button } from "@workspace/ui/components/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";

export function AddTransactionPopover() {
  const isOpen = useOpenCreateTransaction();
  const selectedTransactionType = useTransactionType();
  const isMobile = useIsMobile();

  const { setOpenCreateTransaction } = useUiActions();

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={setOpenCreateTransaction}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="text-left text-xl font-light">
              Record
              {selectedTransactionType === TransactionTypeSchema.enum.transfer
                ? " a "
                : " an "}
              {selectedTransactionType}
            </DrawerTitle>
          </DrawerHeader>
          <div className="mb-10 px-4">
            <TransactionsWrapper />
          </div>
          <DrawerFooter>
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
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="text-left text-xl font-light">
            Record
            {selectedTransactionType === TransactionTypeSchema.enum.transfer
              ? " a "
              : " an "}
            {selectedTransactionType}
          </DialogTitle>
        </DialogHeader>
        <div className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4">
          <TransactionsWrapper />
        </div>
        <DialogFooter>
          <DialogClose
            className="w-full"
            render={<Button variant="secondary">Cancel</Button>}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
