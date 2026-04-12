import { TableCell, TableRow } from "@workspace/ui/components/table";
import type { TransactionItemProps } from "../types";
import React from "react";
import { Item } from "@workspace/ui/components/item";
import { cn } from "@workspace/ui/lib/utils";

interface CellProps {
  primary: string;
  secondary?: string[];
  align?: "left" | "right";
}

const Cell = ({ primary, secondary, align = "left" }: CellProps) => (
  <div
    className={`flex min-w-0 flex-col gap-0.5 ${align === "right" ? "items-end text-right" : "items-start"}`}
  >
    <span className="block w-full truncate text-[11px] leading-snug font-medium text-foreground">
      {primary}
    </span>
    {secondary && (
      <span className="block w-full truncate text-[0.65rem] leading-snug tracking-wide text-muted-foreground">
        {secondary.join(" \u2022 ")}
      </span>
    )}
  </div>
);

export const TransactionItem = React.forwardRef<
  HTMLDivElement,
  TransactionItemProps
>(
  (
    {
      category,
      categorySub,
      merchant,
      merchantSub,
      amount,
      sign = "debit",
      txDate,
      className = "",
      onClick,
      "aria-label": ariaLabel,
    },
    ref
  ) => {
    const amountColor =
      sign === "credit"
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-foreground";

    return (
      <Item
        ref={ref}
        className={className}
        render={
          <button
            type="button"
            tabIndex={0}
            aria-label={ariaLabel ?? `${merchant} - ${amount}`}
            onClick={onClick}
            className={[
              "group w-full cursor-pointer text-left outline-none hover:bg-accent",
              "grid grid-cols-[1fr_3fr_1fr] items-center gap-x-1 gap-y-0 rounded-none px-2! py-1!",
              "max-[360px]:grid-cols-1 max-[360px]:gap-y-1",
            ].join(" ")}
          >
            <Cell
              primary={category}
              secondary={categorySub ? [categorySub] : undefined}
            />

            <Cell primary={merchant} secondary={[merchantSub ?? "", txDate]} />

            <div className="flex min-w-0 flex-col items-end max-[360px]:items-start">
              <span
                className={`block truncate text-xs text-foreground tabular-nums ${amountColor}`}
              >
                {amount}
              </span>
            </div>
          </button>
        }
      />
    );
  }
);
