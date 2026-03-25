import type { TransactionItemProps } from "@/features/add-transaction/types";
import React from "react";

interface CellProps {
  primary: string;
  secondary?: string[];
  align?: "left" | "right";
}

const Cell = ({ primary, secondary, align = "left" }: CellProps) => (
  <div
    className={`flex min-w-0 flex-col gap-0.5 ${align === "right" ? "items-end text-right" : "items-start"}`}
  >
    <span className="block w-full truncate text-xs leading-snug font-medium text-foreground">
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
  HTMLLIElement,
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
      <li
        ref={ref}
        role="button"
        tabIndex={0}
        aria-label={ariaLabel ?? `${merchant} - ${amount}`}
        className={[
          "group cursor-pointer outline-none hover:bg-primary/20",
          "grid grid-cols-[1fr_2fr_1fr] items-center gap-x-1 gap-y-0 px-3 py-2",
          "max-[360px]:grid-cols-1 max-[360px]:gap-y-1",
          className,
        ].join(" ")}
      >
        <Cell
          primary={category}
          secondary={categorySub ? [categorySub] : undefined}
        />

        <Cell primary={merchant} secondary={[merchantSub ?? "", txDate]} />

        <div className="flex min-w-0 flex-col items-end max-[360px]:items-start">
          <span
            className={`block truncate font-mono text-xs text-foreground tabular-nums ${amountColor}`}
          >
            $10000
          </span>
        </div>
      </li>
    );
  }
);
