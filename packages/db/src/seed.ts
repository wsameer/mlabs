import { getDatabase, categories, accounts, transactions, profiles } from "./index.js";

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

    const [defaultProfile] = await db
      .insert(profiles)
      .values({
        firstName: "Demo",
        lastName: "User",
        name: "Personal Space",
        icon: "💰",
        description: "Default space for demo data",
        currency: "CAD",
        dateFormat: "MM/DD/YYYY",
        aiAssistantEnabled: false,
        isDefault: true,
        isSetupComplete: true,
      })
      .returning();

    console.log(`✅ Created default profile: ${defaultProfile.id}`);

    const profileId = defaultProfile.id;

    // ============================================================================
    // Seed Income Categories
    // ============================================================================
    console.log("📥 Seeding income categories...");

    const incomeCategories = await db
      .insert(categories)
      .values([
        { profileId, name: "Salary", type: "INCOME", color: "#10b981", icon: "💼", sortOrder: 1 },
        { profileId, name: "Freelance", type: "INCOME", color: "#3b82f6", icon: "💻", sortOrder: 2 },
        { profileId, name: "Investment", type: "INCOME", color: "#8b5cf6", icon: "📈", sortOrder: 3 },
        { profileId, name: "Gift", type: "INCOME", color: "#ec4899", icon: "🎁", sortOrder: 4 },
        { profileId, name: "Other Income", type: "INCOME", color: "#6366f1", icon: "💰", sortOrder: 5 },
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
        { profileId, name: "Housing", type: "EXPENSE", color: "#ef4444", icon: "🏠", sortOrder: 1 },
        { profileId, name: "Transportation", type: "EXPENSE", color: "#f97316", icon: "🚗", sortOrder: 2 },
        { profileId, name: "Food & Dining", type: "EXPENSE", color: "#84cc16", icon: "🍽️", sortOrder: 3 },
        { profileId, name: "Utilities", type: "EXPENSE", color: "#06b6d4", icon: "⚡", sortOrder: 4 },
        { profileId, name: "Healthcare", type: "EXPENSE", color: "#ef4444", icon: "🏥", sortOrder: 5 },
        { profileId, name: "Entertainment", type: "EXPENSE", color: "#ec4899", icon: "🎬", sortOrder: 6 },
        { profileId, name: "Shopping", type: "EXPENSE", color: "#a855f7", icon: "🛍️", sortOrder: 7 },
        { profileId, name: "Subscriptions", type: "EXPENSE", color: "#3b82f6", icon: "📱", sortOrder: 8 },
        { profileId, name: "Personal Care", type: "EXPENSE", color: "#8b5cf6", icon: "💆", sortOrder: 9 },
        { profileId, name: "Other Expense", type: "EXPENSE", color: "#64748b", icon: "📦", sortOrder: 10 },
      ])
      .returning();

    console.log(`✅ Created ${expenseCategories.length} expense categories`);

    // ============================================================================
    // Seed Accounts
    // ============================================================================
    console.log("🏦 Seeding accounts...");

    const chequingAccount = await db
      .insert(accounts)
      .values({
        profileId,
        name: "TD Chequing",
        type: "CHEQUING",
        balance: "4250.75",
        currency: "CAD",
        icon: "wallet",
        sortOrder: 1,
        notes: "Primary chequing account",
      })
      .returning();

    const savingsAccount = await db
      .insert(accounts)
      .values({
        profileId,
        name: "EQ Bank Savings",
        type: "SAVINGS",
        balance: "15000.00",
        currency: "CAD",
        icon: "piggy-bank",
        sortOrder: 2,
        notes: "Emergency fund",
      })
      .returning();

    const creditCard = await db
      .insert(accounts)
      .values({
        profileId,
        name: "TD Visa Infinite",
        type: "CREDIT_CARD",
        balance: "1250.00",
        currency: "CAD",
        icon: "credit-card",
        sortOrder: 3,
        notes: "Primary rewards card",
        defaultPaymentAccountId: chequingAccount[0].id,
      })
      .returning();

    const tfsa = await db
      .insert(accounts)
      .values({
        profileId,
        name: "Wealthsimple TFSA",
        type: "TFSA",
        balance: "45000.00",
        currency: "CAD",
        icon: "landmark",
        sortOrder: 4,
      })
      .returning();

    const rrsp = await db
      .insert(accounts)
      .values({
        profileId,
        name: "Questrade RRSP",
        type: "RRSP",
        balance: "32500.00",
        currency: "CAD",
        icon: "trending-up",
        sortOrder: 5,
      })
      .returning();

    const fhsa = await db
      .insert(accounts)
      .values({
        profileId,
        name: "CIBC FHSA",
        type: "FHSA",
        balance: "8000.00",
        currency: "CAD",
        icon: "home",
        sortOrder: 6,
      })
      .returning();

    console.log("✅ Created 6 accounts");

    // ============================================================================
    // Seed Transactions
    // ============================================================================
    console.log("💳 Seeding transactions...");

    const salary = incomeCategories.find((c) => c.name === "Salary")!;
    const food = expenseCategories.find((c) => c.name === "Food & Dining")!;
    const transport = expenseCategories.find((c) => c.name === "Transportation")!;
    const utilities = expenseCategories.find((c) => c.name === "Utilities")!;
    const entertainment = expenseCategories.find((c) => c.name === "Entertainment")!;
    const shopping = expenseCategories.find((c) => c.name === "Shopping")!;
    const subscriptions = expenseCategories.find((c) => c.name === "Subscriptions")!;

    // Generate dates for the last 30 days
    const today = new Date();
    const daysAgo = (days: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() - days);
      return d;
    };

    await db.insert(transactions).values([
      // Income
      {
        profileId,
        accountId: chequingAccount[0].id,
        categoryId: salary.id,
        type: "INCOME",
        amount: "5500.00",
        description: "Salary deposit",
        date: daysAgo(15),
      },
      // Food & Dining
      {
        profileId,
        accountId: creditCard[0].id,
        categoryId: food.id,
        type: "EXPENSE",
        amount: "85.50",
        description: "Loblaws groceries",
        date: daysAgo(1),
      },
      {
        profileId,
        accountId: creditCard[0].id,
        categoryId: food.id,
        type: "EXPENSE",
        amount: "42.00",
        description: "Thai Express",
        date: daysAgo(3),
      },
      {
        profileId,
        accountId: creditCard[0].id,
        categoryId: food.id,
        type: "EXPENSE",
        amount: "6.50",
        description: "Tim Hortons",
        date: daysAgo(5),
      },
      // Transportation
      {
        profileId,
        accountId: creditCard[0].id,
        categoryId: transport.id,
        type: "EXPENSE",
        amount: "65.00",
        description: "Gas - Petro Canada",
        date: daysAgo(7),
      },
      {
        profileId,
        accountId: chequingAccount[0].id,
        categoryId: transport.id,
        type: "EXPENSE",
        amount: "156.00",
        description: "TTC Monthly Pass",
        date: daysAgo(28),
      },
      // Utilities
      {
        profileId,
        accountId: chequingAccount[0].id,
        categoryId: utilities.id,
        type: "EXPENSE",
        amount: "125.00",
        description: "Hydro One",
        date: daysAgo(10),
      },
      {
        profileId,
        accountId: chequingAccount[0].id,
        categoryId: utilities.id,
        type: "EXPENSE",
        amount: "85.00",
        description: "Rogers Internet",
        date: daysAgo(12),
      },
      // Entertainment
      {
        profileId,
        accountId: creditCard[0].id,
        categoryId: entertainment.id,
        type: "EXPENSE",
        amount: "25.00",
        description: "Cineplex",
        date: daysAgo(8),
      },
      // Shopping
      {
        profileId,
        accountId: creditCard[0].id,
        categoryId: shopping.id,
        type: "EXPENSE",
        amount: "150.00",
        description: "Amazon.ca",
        date: daysAgo(4),
      },
      // Subscriptions
      {
        profileId,
        accountId: creditCard[0].id,
        categoryId: subscriptions.id,
        type: "EXPENSE",
        amount: "16.99",
        description: "Netflix",
        date: daysAgo(20),
      },
      {
        profileId,
        accountId: creditCard[0].id,
        categoryId: subscriptions.id,
        type: "EXPENSE",
        amount: "11.99",
        description: "Spotify",
        date: daysAgo(18),
      },
      // Transfer
      {
        profileId,
        accountId: chequingAccount[0].id,
        categoryId: null,
        type: "TRANSFER",
        amount: "500.00",
        description: "Transfer to savings",
        date: daysAgo(2),
        toAccountId: savingsAccount[0].id,
      },
    ]);

    console.log("✅ Created 13 transactions");

    // ============================================================================
    // Summary
    // ============================================================================
    console.log("\n✨ Database seeding completed successfully!");
    console.log(`📊 Summary:
  - Profiles: 1 (Default)
  - Income categories: ${incomeCategories.length}
  - Expense categories: ${expenseCategories.length}
  - Accounts: 6
  - Transactions: 13
    `);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seed();
