import { Button } from "@workspace/ui/components/button";

export const TransactionItem = ({ tag }: { tag: string }) => {
  return (
    <Button
      render={<li></li>}
      variant="ghost"
      className="flex h-max items-center justify-between rounded-none border-none px-3 py-2"
      nativeButton={false}
    >
      <div className="col-span-7 flex flex-col">
        <p className="overflow-hidden text-sm text-ellipsis">{tag}</p>
        <p
          className="mt-0.5 overflow-hidden text-ellipsis text-muted-foreground"
          style={{ fontSize: "11px" }}
        >
          Utilities / Heat & Hydro
        </p>
      </div>
      <div className="col-span-5 flex flex-col text-end">
        <p className="font-mono text-sm">$600</p>
        <p
          className="mt-0.5 overflow-hidden text-ellipsis text-muted-foreground"
          style={{ fontSize: "11px" }}
        >
          TD Chequing Bank
        </p>
      </div>
    </Button>
  );
};
