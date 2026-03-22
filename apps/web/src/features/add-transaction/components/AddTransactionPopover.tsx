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

export function AddTransactionPopover() {
  const isOpen = useOpenCreateTransaction();
  const selectedTransactionType = useTransactionType();

  const { setOpenCreateTransaction } = useUiActions();

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
