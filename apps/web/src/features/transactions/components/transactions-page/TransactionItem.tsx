import React from "react";

import type { TransactionType } from "@workspace/types";
import type { TransactionItemProps } from "../../types";

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
      type,
      className = "",
      onClick,
      "aria-label": ariaLabel,
    },
    ref
  ) => {
    function getAmountColor(type: TransactionType) {
      if (type === "EXPENSE") {
        return "text-red-600";
      }

      if (type === "INCOME") {
        return "text-emerald-600 dark:text-emerald-400";
      }

      return "text-foreground";
    }

    return (
      <li ref={ref}>
        <button
          type="button"
          tabIndex={0}
          aria-label={ariaLabel ?? `${merchant} - ${amount}`}
          onClick={onClick}
          className={[
            "group w-full cursor-pointer border-none text-left outline-none hover:bg-accent",
            "grid grid-cols-[minmax(0,10rem)_minmax(0,1fr)_8rem] items-center gap-x-4 gap-y-0 px-4 py-2.5",
            "max-[360px]:grid-cols-1 max-[360px]:gap-y-1",
            className,
          ].join(" ")}
        >
          <Cell
            primary={category}
            secondary={categorySub ? [categorySub] : undefined}
          />

          <Cell primary={merchant} secondary={[merchantSub ?? ""]} />

          <div className="flex min-w-0 flex-col items-end max-[360px]:items-start">
            <span
              className={`block truncate text-xs tabular-nums ${getAmountColor(type)}`}
            >
              {amount}
            </span>
          </div>
        </button>
      </li>
    );
  }
);
