import {
  getDatabase,
  categories,
  accounts,
  transactions,
  profiles,
  eq,
} from "./index.js";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

async function seed() {
  console.log("🌱 Starting database seed...");

  const db = getDatabase(DATABASE_URL!);

  try {
    // ============================================================================
    // Seed Default Profile
    // ============================================================================
    console.log("👤 Creating default profile...");

    const existingDefaultProfile = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.isDefault, true))
      .limit(1);

    if (existingDefaultProfile.length > 0) {
      console.log("✅ Default profile already exists, skipping seed");
      process.exit(0);
    }

    const [defaultProfile] = await db
      .insert(profiles)
      .values({
        name: "Personal Space",
        icon: "💰",
        type: "PERSONAL",
        currency: "CAD",
        dateFormat: "D MMM, YYYY",
        weekStart: "MONDAY",
        timezone: "America/Toronto",
        isDefault: true,
        isActive: true,
        isSetupComplete: true,
      })
      .returning();

    console.log(`✅ Created default profile: ${defaultProfile.id}`);

    const profileId: string = defaultProfile.id;

    // ============================================================================
    // Seed Income Categories
    // ============================================================================
    console.log("📥 Seeding income categories...");

    const incomeCategories = await db
      .insert(categories)
      .values([
        {
          profileId,
          name: "Salary",
          type: "INCOME",
          icon: "💼",
          color: "#10b981",
          sortOrder: 1,
        },
        {
          profileId,
          name: "Freelance",
          type: "INCOME",
          icon: "💻",
          color: "#3b82f6",
          sortOrder: 2,
        },
        {
          profileId,
          name: "Investment",
          type: "INCOME",
          icon: "📈",
          color: "#8b5cf6",
          sortOrder: 3,
        },
        {
          profileId,
          name: "Gift",
          type: "INCOME",
          icon: "🎁",
          color: "#ec4899",
          sortOrder: 4,
        },
        {
          profileId,
          name: "Other Income",
          type: "INCOME",
          icon: "💰",
          color: "#6366f1",
          sortOrder: 5,
        },
      ])
      .returning();

    console.log(`✅ Created ${incomeCategories.length} income categories`);

    // ============================================================================
    // Seed Expense Categories
    // ============================================================================
    console.log("📤 Seeding expense categories...");

    const expenseCategories = await db
      .insert(categories)
      .values([
        {
          profileId,
          name: "Housing",
          type: "EXPENSE",
          icon: "🏠",
          color: "#ef4444",
          sortOrder: 1,
        },
        {
          profileId,
          name: "Transportation",
          type: "EXPENSE",
          icon: "🚗",
          color: "#f97316",
          sortOrder: 2,
        },
        {
          profileId,
          name: "Food & Dining",
          type: "EXPENSE",
          icon: "🍽️",
          color: "#84cc16",
          sortOrder: 3,
        },
        {
          profileId,
          name: "Utilities",
          type: "EXPENSE",
          icon: "⚡",
          color: "#06b6d4",
          sortOrder: 4,
        },
        {
          profileId,
          name: "Healthcare",
          type: "EXPENSE",
          icon: "🏥",
          color: "#ef4444",
          sortOrder: 5,
        },
        {
          profileId,
          name: "Entertainment",
          type: "EXPENSE",
          icon: "🎬",
          color: "#ec4899",
          sortOrder: 6,
        },
        {
          profileId,
          name: "Shopping",
          type: "EXPENSE",
          icon: "🛍️",
          color: "#a855f7",
          sortOrder: 7,
        },
        {
          profileId,
          name: "Subscriptions",
          type: "EXPENSE",
          icon: "📱",
          color: "#3b82f6",
          sortOrder: 8,
        },
        {
          profileId,
          name: "Personal Care",
          type: "EXPENSE",
          icon: "💆",
          color: "#8b5cf6",
          sortOrder: 9,
        },
        {
          profileId,
          name: "Other Expense",
          type: "EXPENSE",
          icon: "📦",
          color: "#64748b",
          sortOrder: 10,
        },
      ])
      .returning();

    console.log(`✅ Created ${expenseCategories.length} expense categories`);

    // ============================================================================
    // Seed Accounts
    // ============================================================================
    console.log("🏦 Seeding accounts...");

    const [checkingAccount] = await db
      .insert(accounts)
      .values({
        profileId,
        name: "TD Chequing",
        group: "checking",
        balance: "4250.75",
        currency: "CAD",
        icon: "wallet",
        notes: "Primary checking account",
        includeInNetWorth: true,
        sortOrder: 1,
      })
      .returning();

    const [savingsAccount] = await db
      .insert(accounts)
      .values({
        profileId,
        name: "EQ Bank Savings",
        group: "savings",
        balance: "15000.00",
        currency: "CAD",
        icon: "piggy-bank",
        notes: "Emergency fund",
        includeInNetWorth: true,
        sortOrder: 2,
      })
      .returning();

    if (!checkingAccount) {
      throw new Error("Failed to create checking account");
    }

    const [creditCard] = await db
      .insert(accounts)
      .values({
        profileId,
        name: "TD Visa Infinite",
        group: "credit_card",
        balance: "-1250.00", // Negative for liability
        currency: "CAD",
        icon: "credit-card",
        notes: "Primary rewards card",
        linkedAccountId: checkingAccount.id,
        includeInNetWorth: false,
        sortOrder: 3,
      })
      .returning();

    if (!savingsAccount || !creditCard) {
      throw new Error("Failed to create savings or credit card account");
    }

    await db.insert(accounts).values([
      {
        profileId,
        name: "Wealthsimple",
        group: "investment",
        balance: "45000.00",
        currency: "CAD",
        icon: "trending-up",
        includeInNetWorth: true,
        sortOrder: 4,
      },
      {
        profileId,
        name: "Cash Wallet",
        group: "cash",
        balance: "200.00",
        currency: "CAD",
        icon: "banknote",
        includeInNetWorth: true,
        sortOrder: 5,
      },
    ]);

    console.log("✅ Created 5 accounts");

    // ============================================================================
    // Seed Transactions
    // ============================================================================
    console.log("💳 Seeding transactions...");

    const today = new Date();
    const daysAgo = (days: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() - days);
      return d.toISOString().split("T")[0]; // YYYY-MM-DD format
    };

    const salary = incomeCategories.find((c) => c.name === "Salary");
    const food = expenseCategories.find((c) => c.name === "Food & Dining");
    const transport = expenseCategories.find(
      (c) => c.name === "Transportation"
    );
    const utilities = expenseCategories.find((c) => c.name === "Utilities");
    const entertainment = expenseCategories.find(
      (c) => c.name === "Entertainment"
    );
    const shopping = expenseCategories.find((c) => c.name === "Shopping");
    const subscriptions = expenseCategories.find(
      (c) => c.name === "Subscriptions"
    );

    if (
      !salary ||
      !food ||
      !transport ||
      !utilities ||
      !entertainment ||
      !shopping ||
      !subscriptions
    ) {
      throw new Error("Failed to find required categories");
    }

    // Generate a transfer ID for the transfer transaction
    const transferUuid = crypto.randomUUID();

    await db.insert(transactions).values([
      // Income (positive amount, checking account)
      {
        profileId,
        accountId: checkingAccount.id,
        categoryId: salary.id,
        type: "INCOME",
        amount: "5500.00",
        description: "Salary deposit",
        date: daysAgo(15),
        isCleared: true,
      },
      // Food & Dining (expense, credit card)
      {
        profileId,
        accountId: creditCard.id,
        categoryId: food.id,
        type: "EXPENSE",
        amount: "85.50",
        description: "Loblaws groceries",
        date: daysAgo(1),
        isCleared: true,
      },
      {
        profileId,
        accountId: creditCard.id,
        categoryId: food.id,
        type: "EXPENSE",
        amount: "42.00",
        description: "Thai Express",
        date: daysAgo(3),
        isCleared: true,
      },
      {
        profileId,
        accountId: creditCard.id,
        categoryId: food.id,
        type: "EXPENSE",
        amount: "6.50",
        description: "Tim Hortons",
        date: daysAgo(5),
        isCleared: true,
      },
      // Transportation
      {
        profileId,
        accountId: creditCard.id,
        categoryId: transport.id,
        type: "EXPENSE",
        amount: "65.00",
        description: "Gas - Petro Canada",
        date: daysAgo(7),
        isCleared: true,
      },
      {
        profileId,
        accountId: checkingAccount.id,
        categoryId: transport.id,
        type: "EXPENSE",
        amount: "156.00",
        description: "TTC Monthly Pass",
        date: daysAgo(28),
        isCleared: true,
      },
      // Utilities
      {
        profileId,
        accountId: checkingAccount.id,
        categoryId: utilities.id,
        type: "EXPENSE",
        amount: "125.00",
        description: "Hydro One",
        date: daysAgo(10),
        isCleared: true,
      },
      {
        profileId,
        accountId: checkingAccount.id,
        categoryId: utilities.id,
        type: "EXPENSE",
        amount: "85.00",
        description: "Rogers Internet",
        date: daysAgo(12),
        isCleared: true,
      },
      // Entertainment
      {
        profileId,
        accountId: creditCard.id,
        categoryId: entertainment.id,
        type: "EXPENSE",
        amount: "25.00",
        description: "Cineplex",
        date: daysAgo(8),
        isCleared: true,
      },
      // Shopping
      {
        profileId,
        accountId: creditCard.id,
        categoryId: shopping.id,
        type: "EXPENSE",
        amount: "150.00",
        description: "Amazon.ca",
        date: daysAgo(4),
        isCleared: true,
      },
      // Subscriptions
      {
        profileId,
        accountId: creditCard.id,
        categoryId: subscriptions.id,
        type: "EXPENSE",
        amount: "16.99",
        description: "Netflix",
        date: daysAgo(20),
        isCleared: true,
      },
      {
        profileId,
        accountId: creditCard.id,
        categoryId: subscriptions.id,
        type: "EXPENSE",
        amount: "11.99",
        description: "Spotify",
        date: daysAgo(18),
        isCleared: true,
      },
      // Transfer: checking → savings (both sides of the transfer)
      {
        profileId,
        accountId: checkingAccount.id,
        categoryId: null,
        type: "TRANSFER",
        amount: "500.00",
        description: "Transfer to savings",
        date: daysAgo(2),
        transferId: transferUuid,
        isCleared: true,
      },
      {
        profileId,
        accountId: savingsAccount.id,
        categoryId: null,
        type: "TRANSFER",
        amount: "500.00",
        description: "Transfer from checking",
        date: daysAgo(2),
        transferId: transferUuid,
        isCleared: true,
      },
    ]);

    console.log("✅ Created 14 transactions (including 2 for transfer)");

    // ============================================================================
    // Summary
    // ============================================================================
    console.log("\n✨ Database seeding completed successfully!");
    console.log(`📊 Summary:
  - Profiles: 1 (Default)
  - Income categories: ${incomeCategories.length}
  - Expense categories: ${expenseCategories.length}
  - Accounts: 5
  - Transactions: 14
    `);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seed();
