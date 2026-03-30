import { useTransactionType, useUiActions } from "@/hooks/use-ui-store";
import { TransactionTypeSchema, type TransactionType } from "@workspace/types";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";

export const TransactionsWrapper = () => {
  const selectedTransactionType = useTransactionType();
  const { setTransactionType } = useUiActions();

  const transactionTypes = TransactionTypeSchema.options;

  return (
    <Tabs
      value={selectedTransactionType}
      onValueChange={(value) => setTransactionType(value as TransactionType)}
    >
      <TabsList className="grid w-full grid-cols-3">
        {transactionTypes.map((type) => (
          <TabsTrigger
            key={type}
            value={type}
            className="w-full text-center capitalize"
          >
            {type}
          </TabsTrigger>
        ))}
      </TabsList>
      {transactionTypes.map((type) => (
        <TabsContent key={type} value={type} className="mt-4">
          <h1>{type}</h1>
        </TabsContent>
      ))}
    </Tabs>
  );
};
