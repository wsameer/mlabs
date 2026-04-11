/**
 * Default categories seeded for every new workspace.
 * Used by both the dev seed script and the onboarding profile creation.
 */
export const DEFAULT_CATEGORIES = [
  // ── Income ──
  { name: "Salary", type: "INCOME" as const, icon: "💼", color: "#10b981", sortOrder: 1 },
  { name: "Freelance", type: "INCOME" as const, icon: "💻", color: "#3b82f6", sortOrder: 2 },
  { name: "Investment", type: "INCOME" as const, icon: "📈", color: "#8b5cf6", sortOrder: 3 },
  { name: "Gift", type: "INCOME" as const, icon: "🎁", color: "#ec4899", sortOrder: 4 },
  { name: "Other Income", type: "INCOME" as const, icon: "💰", color: "#6366f1", sortOrder: 5 },
  // ── Expense ──
  { name: "Housing", type: "EXPENSE" as const, icon: "🏠", color: "#ef4444", sortOrder: 1 },
  { name: "Transportation", type: "EXPENSE" as const, icon: "🚗", color: "#f97316", sortOrder: 2 },
  { name: "Food & Dining", type: "EXPENSE" as const, icon: "🍽️", color: "#84cc16", sortOrder: 3 },
  { name: "Utilities", type: "EXPENSE" as const, icon: "⚡", color: "#06b6d4", sortOrder: 4 },
  { name: "Healthcare", type: "EXPENSE" as const, icon: "🏥", color: "#ef4444", sortOrder: 5 },
  { name: "Entertainment", type: "EXPENSE" as const, icon: "🎬", color: "#ec4899", sortOrder: 6 },
  { name: "Shopping", type: "EXPENSE" as const, icon: "🛍️", color: "#a855f7", sortOrder: 7 },
  { name: "Subscriptions", type: "EXPENSE" as const, icon: "📱", color: "#3b82f6", sortOrder: 8 },
  { name: "Personal Care", type: "EXPENSE" as const, icon: "💆", color: "#8b5cf6", sortOrder: 9 },
  { name: "Other Expense", type: "EXPENSE" as const, icon: "📦", color: "#64748b", sortOrder: 10 },
];
