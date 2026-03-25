export interface TransactionItemProps {
  id: number;
  /** Transaction category label  (e.g. "Utilities") */
  category: string;
  /** Category sub-label (e.g. "Heat & Hydro") */
  categorySub?: string;
  /** Merchant / payee name */
  merchant: string;
  /** Account + date line (e.g. "TD Chequing Bank") */
  merchantSub?: string;
  // Transaction date
  txDate: string;
  /** Formatted amount string (e.g. "$600.00") */
  amount: string;
  /** Optional sign for colouring: "debit" | "credit" */
  sign?: "debit" | "credit";
  /** Accessible label for the button */
  "aria-label"?: string;
  onClick?: React.MouseEventHandler<HTMLLIElement>;
  /** Arbitrary className forwarded to the root element */
  className?: string;
}
