import type { LucideIcon } from "lucide-react";

import { CollapsibleGroup } from "@/components/CollapsibleGroup";
import { formatCurrency } from "../lib/format-utils";

interface AccountGroupSectionProps {
  id: string;
  label: string;
  icon: LucideIcon;
  accountCount: number;
  total: number;
  currency?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function AccountGroupSection({
  id,
  label,
  icon,
  accountCount,
  total,
  currency = "CAD",
  defaultOpen = false,
  children,
}: AccountGroupSectionProps) {
  return (
    <CollapsibleGroup
      id={id}
      label={label}
      icon={icon}
      count={accountCount}
      meta={formatCurrency(total, currency)}
      defaultOpen={defaultOpen}
    >
      {children}
    </CollapsibleGroup>
  );
}
