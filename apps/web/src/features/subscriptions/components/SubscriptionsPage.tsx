import { useLayoutConfig } from "@/features/layout/hooks/use-layout-config";

const FEATURE_IDEAS = [
  "Auto-detect recurring charges from transaction history",
  "Subscription list with merchant logo, cadence, and next charge date",
  "Monthly + yearly cost rollups, sorted by spend",
  "Upcoming-charges calendar so nothing surprises you",
  "Price-change alerts when a recurring charge increases",
  "Mark as cancelled — track it stops actually billing",
  "Unused-subscription suggestions (no usage signal in N days)",
  "Tag by category (streaming, software, utilities, memberships)",
  "Free-trial tracker with renewal-date reminders",
  "Annualized cost view — \"this costs you $X/year\"",
];

export function SubscriptionsPage() {
  useLayoutConfig({ pageTitle: "Subscriptions" });

  return (
    <div className="mx-auto w-full max-w-2xl p-6 md:p-8">
      <h2 className="text-lg font-semibold">Coming soon</h2>
      <p className="text-muted-foreground mt-1 text-sm">
        Possible features for this section:
      </p>
      <ul className="text-muted-foreground mt-4 list-disc space-y-2 pl-5 text-sm">
        {FEATURE_IDEAS.map((idea) => (
          <li key={idea}>{idea}</li>
        ))}
      </ul>
    </div>
  );
}
