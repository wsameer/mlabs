import {
  getDatabase,
  categories,
  accounts,
  transactions,
  profiles,
  eq,
  DEFAULT_CATEGORIES,
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

    console.log(`✅ Created default profile: ${defaultProfile?.id}`);

    const profileId: string = defaultProfile!.id;

    // ============================================================================
    // Seed Default Categories
    // ============================================================================
    console.log("📥 Seeding default categories...");

    const seededCategories = await db
      .insert(categories)
      .values(DEFAULT_CATEGORIES.map((cat) => ({ ...cat, profileId })))
      .returning();

    console.log(`✅ Created ${seededCategories.length} categories`);

    const incomeCategories = seededCategories.filter(
      (c) => c.type === "INCOME"
    );
    const expenseCategories = seededCategories.filter(
      (c) => c.type === "EXPENSE"
    );

    // ============================================================================
    // Seed Accounts (all group types)
    // ============================================================================
    console.log("🏦 Seeding accounts...");

    const [checkingAccount] = await db
      .insert(accounts)
      .values({
        profileId,
        name: "TD Unlimited Chequing",
        group: "chequing",
        balance: "4250.75",
        currency: "CAD",
        icon: "wallet",
        notes: "Primary chequing account",
        institutionName: "TD",
        accountNumber: "4821",
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
        institutionName: "Equitable Bank",
        accountNumber: "7734",
        description: "High interest savings",
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
        balance: "-1250.00",
        currency: "CAD",
        icon: "credit-card",
        notes: "Primary rewards card",
        institutionName: "TD",
        accountNumber: "9032",
        creditLimit: "10000",
        linkedAccountId: checkingAccount.id,
        includeInNetWorth: true,
        sortOrder: 3,
      })
      .returning();

    if (!savingsAccount || !creditCard) {
      throw new Error("Failed to create savings or credit card account");
    }

    const [wealthSimpleCash] = await db
      .insert(accounts)
      .values({
        profileId,
        name: "WealthSimple Cash",
        group: "chequing",
        balance: "19111.53",
        currency: "CAD",
        icon: "wallet",
        institutionName: "WealthSimple",
        accountNumber: "6110",
        includeInNetWorth: true,
        sortOrder: 4,
      })
      .returning();

    const [tfsaAccount] = await db
      .insert(accounts)
      .values({
        profileId,
        name: "TFSA",
        group: "investment",
        balance: "45000.00",
        currency: "CAD",
        icon: "trending-up",
        institutionName: "WealthSimple",
        accountNumber: "3301",
        description: "Tax-free savings account",
        includeInNetWorth: true,
        sortOrder: 5,
        metadata: JSON.stringify({
          subtype: "TFSA",
          contributionRoom: "6500",
        }),
      })
      .returning();

    const [rrspAccount] = await db
      .insert(accounts)
      .values({
        profileId,
        name: "RRSP",
        group: "investment",
        balance: "20000.00",
        currency: "CAD",
        icon: "trending-up",
        institutionName: "WealthSimple",
        accountNumber: "3302",
        description: "Registered retirement savings",
        includeInNetWorth: true,
        sortOrder: 6,
        metadata: JSON.stringify({
          subtype: "RRSP",
          contributionRoom: "12500",
        }),
      })
      .returning();

    const [cashWallet] = await db
      .insert(accounts)
      .values({
        profileId,
        name: "Cash Wallet",
        group: "cash",
        balance: "200.00",
        currency: "CAD",
        icon: "banknote",
        includeInNetWorth: true,
        sortOrder: 7,
        metadata: JSON.stringify({ location: "Home safe" }),
      })
      .returning();

    const [loanAccount] = await db
      .insert(accounts)
      .values({
        profileId,
        name: "Toyota Auto Loan",
        group: "loan",
        balance: "-18500.00",
        currency: "CAD",
        institutionName: "Toyota Financial",
        accountNumber: "5590",
        description: "2023 RAV4 financing",
        originalAmount: "32000",
        interestRate: "4.99",
        includeInNetWorth: true,
        sortOrder: 8,
        metadata: JSON.stringify({
          loanType: "auto",
          termMonths: 72,
          startDate: "2023-06-01",
          maturityDate: "2029-06-01",
          monthlyPayment: "520.00",
        }),
      })
      .returning();

    const [mortgageAccount] = await db
      .insert(accounts)
      .values({
        profileId,
        name: "Home Mortgage",
        group: "mortgage",
        balance: "-385000.00",
        currency: "CAD",
        institutionName: "RBC",
        accountNumber: "8812",
        description: "Primary residence mortgage",
        originalAmount: "450000",
        interestRate: "5.14",
        includeInNetWorth: true,
        sortOrder: 9,
        metadata: JSON.stringify({
          termMonths: 60,
          amortizationMonths: 300,
          startDate: "2022-09-01",
          renewalDate: "2027-09-01",
          monthlyPayment: "2650.00",
          paymentFrequency: "biweekly",
        }),
      })
      .returning();

    const [homeAsset] = await db
      .insert(accounts)
      .values({
        profileId,
        name: "Primary Residence",
        group: "asset",
        balance: "620000.00",
        currency: "CAD",
        description: "Condo in Toronto",
        includeInNetWorth: true,
        sortOrder: 10,
        metadata: JSON.stringify({
          assetType: "property",
          purchaseDate: "2022-09-01",
          purchasePrice: "550000",
          location: "Toronto, ON",
        }),
      })
      .returning();

    const [carAsset] = await db
      .insert(accounts)
      .values({
        profileId,
        name: "2023 Toyota RAV4",
        group: "asset",
        balance: "28000.00",
        currency: "CAD",
        description: "Vehicle",
        includeInNetWorth: true,
        sortOrder: 11,
        metadata: JSON.stringify({
          assetType: "vehicle",
          purchaseDate: "2023-06-01",
          purchasePrice: "38000",
        }),
      })
      .returning();

    const [otherAccount] = await db
      .insert(accounts)
      .values({
        profileId,
        name: "Employer HSA",
        group: "other",
        balance: "1200.00",
        currency: "CAD",
        institutionName: "Sun Life",
        description: "Health spending account",
        includeInNetWorth: false,
        sortOrder: 12,
      })
      .returning();

    console.log("✅ Created 13 accounts (all group types)");

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
    const freelance = incomeCategories.find((c) => c.name === "Freelance");
    const investmentIncome = incomeCategories.find(
      (c) => c.name === "Investment"
    );
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
    const housing = expenseCategories.find((c) => c.name === "Housing");
    const healthcare = expenseCategories.find((c) => c.name === "Healthcare");

    if (
      !salary ||
      !food ||
      !transport ||
      !utilities ||
      !entertainment ||
      !shopping ||
      !subscriptions ||
      !housing ||
      !healthcare
    ) {
      throw new Error("Failed to find required categories");
    }

    // Transfer IDs for double-entry transfers
    const transferUuid1 = crypto.randomUUID();
    const transferUuid2 = crypto.randomUUID();
    const transferUuid3 = crypto.randomUUID();

    await db.insert(transactions).values([
      // ── Income ──
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
      {
        profileId,
        accountId: checkingAccount.id,
        categoryId: salary.id,
        type: "INCOME",
        amount: "5500.00",
        description: "Salary deposit",
        date: daysAgo(45),
        isCleared: true,
      },
      ...(freelance
        ? [
            {
              profileId,
              accountId: wealthSimpleCash!.id,
              categoryId: freelance.id,
              type: "INCOME" as const,
              amount: "1200.00",
              description: "Logo design project",
              date: daysAgo(10),
              isCleared: true,
            },
          ]
        : []),
      ...(investmentIncome
        ? [
            {
              profileId,
              accountId: tfsaAccount!.id,
              categoryId: investmentIncome.id,
              type: "INCOME" as const,
              amount: "320.50",
              description: "TFSA dividend payout",
              date: daysAgo(22),
              isCleared: true,
            },
            {
              profileId,
              accountId: rrspAccount!.id,
              categoryId: investmentIncome.id,
              type: "INCOME" as const,
              amount: "185.75",
              description: "RRSP dividend payout",
              date: daysAgo(22),
              isCleared: true,
            },
          ]
        : []),

      // ── Food & Dining ──
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
      {
        profileId,
        accountId: cashWallet!.id,
        categoryId: food.id,
        type: "EXPENSE",
        amount: "12.00",
        description: "Farmers market",
        date: daysAgo(6),
        isCleared: true,
      },

      // ── Transportation ──
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

      // ── Utilities ──
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
      {
        profileId,
        accountId: checkingAccount.id,
        categoryId: utilities.id,
        type: "EXPENSE",
        amount: "45.00",
        description: "Enbridge Gas",
        date: daysAgo(14),
        isCleared: true,
      },

      // ── Housing (mortgage payment from chequing) ──
      {
        profileId,
        accountId: checkingAccount.id,
        categoryId: housing.id,
        type: "EXPENSE",
        amount: "2650.00",
        description: "Mortgage payment - RBC",
        date: daysAgo(1),
        isCleared: true,
      },
      {
        profileId,
        accountId: checkingAccount.id,
        categoryId: housing.id,
        type: "EXPENSE",
        amount: "2650.00",
        description: "Mortgage payment - RBC",
        date: daysAgo(31),
        isCleared: true,
      },

      // ── Healthcare ──
      {
        profileId,
        accountId: otherAccount!.id,
        categoryId: healthcare.id,
        type: "EXPENSE",
        amount: "150.00",
        description: "Dental cleaning",
        date: daysAgo(20),
        isCleared: true,
      },

      // ── Entertainment ──
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

      // ── Shopping ──
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

      // ── Subscriptions ──
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

      // ── Loan payment ──
      {
        profileId,
        accountId: checkingAccount.id,
        categoryId: transport.id,
        type: "EXPENSE",
        amount: "520.00",
        description: "Auto loan payment - Toyota Financial",
        date: daysAgo(5),
        isCleared: true,
      },

      // ── Transfers ──
      // Chequing → Savings
      {
        profileId,
        accountId: checkingAccount.id,
        categoryId: null,
        type: "TRANSFER",
        amount: "500.00",
        description: "Transfer to savings",
        date: daysAgo(2),
        transferId: transferUuid1,
        isCleared: true,
      },
      {
        profileId,
        accountId: savingsAccount.id,
        categoryId: null,
        type: "TRANSFER",
        amount: "500.00",
        description: "Transfer from chequing",
        date: daysAgo(2),
        transferId: transferUuid1,
        isCleared: true,
      },
      // Chequing → TFSA contribution
      {
        profileId,
        accountId: checkingAccount.id,
        categoryId: null,
        type: "TRANSFER",
        amount: "500.00",
        description: "TFSA contribution",
        date: daysAgo(16),
        transferId: transferUuid2,
        isCleared: true,
      },
      {
        profileId,
        accountId: tfsaAccount!.id,
        categoryId: null,
        type: "TRANSFER",
        amount: "500.00",
        description: "TFSA contribution from chequing",
        date: daysAgo(16),
        transferId: transferUuid2,
        isCleared: true,
      },
      // Chequing → Credit card payment
      {
        profileId,
        accountId: checkingAccount.id,
        categoryId: null,
        type: "TRANSFER",
        amount: "800.00",
        description: "Visa payment",
        date: daysAgo(9),
        transferId: transferUuid3,
        isCleared: true,
      },
      {
        profileId,
        accountId: creditCard.id,
        categoryId: null,
        type: "TRANSFER",
        amount: "800.00",
        description: "Payment from chequing",
        date: daysAgo(9),
        transferId: transferUuid3,
        isCleared: true,
      },
    ]);

    console.log(
      "✅ Created 30 transactions (income, expenses, loan payments, transfers)"
    );

    // ============================================================================
    // Summary
    // ============================================================================
    console.log("\n✨ Database seeding completed successfully!");
    console.log(`📊 Summary:
  - Profiles: 1 (Default)
  - Income categories: ${incomeCategories.length}
  - Expense categories: ${expenseCategories.length}
  - Accounts: 13 (chequing x2, savings, credit card, investment x2, cash, loan, mortgage, asset x2, other)
  - Transactions: 30
    `);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seed();
