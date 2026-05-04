import {
  getDatabase,
  accounts,
  transactions,
  profiles,
  eq,
  seedCategoriesForProfile,
} from "./index.js";

// ── Config ────────────────────────────────────────────────────────────────────

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is required");
  process.exit(1);
}

const TZ = "America/Toronto";
const MONTHS_OF_HISTORY = 3;

// ── Seeded RNG (mulberry32) ───────────────────────────────────────────────────

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(42);

function jitter(base: number, pct: number): string {
  const delta = base * pct * (rng() * 2 - 1);
  return (base + delta).toFixed(2);
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function todayInToronto(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const d = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${d}`;
}

function daysAgo(n: number): string {
  const parts = todayInToronto().split("-");
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - n);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function monthsAgo(months: number, dayOfMonth = 1): string {
  const parts = todayInToronto().split("-");
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  let targetMonth = m - months;
  let targetYear = y;
  while (targetMonth < 1) {
    targetMonth += 12;
    targetYear -= 1;
  }
  const lastDay = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
  const day = Math.min(dayOfMonth, lastDay);
  return `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// ── Transaction row type ──────────────────────────────────────────────────────

type TxRow = {
  profileId: string;
  accountId: string;
  categoryId: string | null;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: string;
  description: string;
  date: string;
  transferId?: string;
  isCleared: boolean;
};

// ── Transfer pair helper ──────────────────────────────────────────────────────

type TransferPairOpts = {
  profileId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: string;
  description: string;
  date: string;
  isCleared?: boolean;
};

function makeTransferPair(opts: TransferPairOpts): [TxRow, TxRow] {
  const transferId = crypto.randomUUID();
  const base = {
    profileId: opts.profileId,
    categoryId: null,
    type: "TRANSFER" as const,
    amount: opts.amount,
    description: opts.description,
    date: opts.date,
    transferId,
    isCleared: opts.isCleared ?? true,
  };
  return [
    { ...base, accountId: opts.fromAccountId },
    { ...base, accountId: opts.toAccountId },
  ];
}

// ── Account definitions ───────────────────────────────────────────────────────

type AccountDef = {
  key: string;
  linkedAccountKey?: string;
  name: string;
  group:
    | "chequing"
    | "savings"
    | "cash"
    | "credit_card"
    | "investment"
    | "loan"
    | "mortgage"
    | "asset"
    | "other";
  balance: string;
  currency?: string;
  institutionName?: string;
  accountNumber?: string;
  description?: string;
  originalAmount?: string;
  interestRate?: string;
  creditLimit?: string;
  metadata?: Record<string, unknown>;
  icon?: string;
  includeInNetWorth: boolean;
  sortOrder: number;
  notes?: string;
};

const ACCOUNT_DEFS: AccountDef[] = [
  // ── Chequing ──
  {
    key: "checking",
    name: "TD Unlimited Chequing",
    group: "chequing",
    balance: "4250.75",
    currency: "CAD",
    icon: "wallet",
    institutionName: "TD",
    accountNumber: "4821",
    notes: "Primary chequing account",
    includeInNetWorth: true,
    sortOrder: 1,
  },
  {
    key: "wealthSimpleCash",
    name: "WealthSimple Cash",
    group: "chequing",
    balance: "19111.53",
    currency: "CAD",
    icon: "wallet",
    institutionName: "WealthSimple",
    accountNumber: "6110",
    includeInNetWorth: true,
    sortOrder: 2,
  },
  {
    key: "bmoUsd",
    name: "BMO USD Chequing",
    group: "chequing",
    balance: "3200.00",
    currency: "USD",
    icon: "wallet",
    institutionName: "BMO",
    accountNumber: "2244",
    description: "US dollar chequing for cross-border spending",
    includeInNetWorth: true,
    sortOrder: 3,
  },
  // ── Savings ──
  {
    key: "savings",
    name: "EQ Bank Savings",
    group: "savings",
    balance: "15000.00",
    currency: "CAD",
    icon: "piggy-bank",
    institutionName: "Equitable Bank",
    accountNumber: "7734",
    description: "High interest savings / emergency fund",
    includeInNetWorth: true,
    sortOrder: 4,
  },
  // ── Credit cards ──
  {
    key: "visa",
    linkedAccountKey: "checking",
    name: "TD Visa Infinite",
    group: "credit_card",
    balance: "-1250.00",
    currency: "CAD",
    icon: "credit-card",
    institutionName: "TD",
    accountNumber: "9032",
    creditLimit: "10000",
    notes: "Primary rewards card",
    includeInNetWorth: true,
    sortOrder: 5,
  },
  {
    key: "rogersCC",
    linkedAccountKey: "checking",
    name: "Rogers World Elite Mastercard",
    group: "credit_card",
    balance: "-420.00",
    currency: "CAD",
    icon: "credit-card",
    institutionName: "Rogers Bank",
    accountNumber: "5577",
    creditLimit: "12000",
    description: "No-fee cashback mastercard",
    includeInNetWorth: true,
    sortOrder: 6,
  },
  // ── Investments ──
  {
    key: "tfsa",
    name: "TFSA",
    group: "investment",
    balance: "45000.00",
    currency: "CAD",
    icon: "trending-up",
    institutionName: "WealthSimple",
    accountNumber: "3301",
    description: "Tax-free savings account",
    includeInNetWorth: true,
    sortOrder: 7,
    metadata: { subtype: "TFSA", contributionRoom: "6500" },
  },
  {
    key: "rrsp",
    name: "RRSP",
    group: "investment",
    balance: "20000.00",
    currency: "CAD",
    icon: "trending-up",
    institutionName: "WealthSimple",
    accountNumber: "3302",
    description: "Registered retirement savings",
    includeInNetWorth: true,
    sortOrder: 8,
    metadata: { subtype: "RRSP", contributionRoom: "12500" },
  },
  {
    key: "fhsa",
    name: "FHSA",
    group: "investment",
    balance: "8000.00",
    currency: "CAD",
    icon: "trending-up",
    institutionName: "WealthSimple",
    accountNumber: "3303",
    description: "First Home Savings Account",
    includeInNetWorth: true,
    sortOrder: 9,
    metadata: {
      subtype: "FHSA",
      contributionRoom: "8000",
      annualLimit: "8000",
    },
  },
  // ── Cash ──
  {
    key: "cash",
    name: "Cash Wallet",
    group: "cash",
    balance: "200.00",
    currency: "CAD",
    icon: "banknote",
    includeInNetWorth: true,
    sortOrder: 10,
    metadata: { location: "Home safe" },
  },
  // ── Loans ──
  {
    key: "autoLoan",
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
    sortOrder: 11,
    metadata: {
      loanType: "auto",
      termMonths: 72,
      startDate: "2023-06-01",
      maturityDate: "2029-06-01",
      monthlyPayment: "520.00",
    },
  },
  {
    key: "heloc",
    name: "Scotia HELOC",
    group: "loan",
    balance: "-12000.00",
    currency: "CAD",
    institutionName: "Scotiabank",
    accountNumber: "7721",
    description: "Home equity line of credit",
    originalAmount: "75000",
    interestRate: "7.20",
    includeInNetWorth: true,
    sortOrder: 12,
    metadata: {
      loanType: "heloc",
      creditLimit: "75000",
      paymentFrequency: "monthly",
      interestOnlyMinimum: "72.00",
    },
  },
  // ── Mortgage ──
  {
    key: "mortgage",
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
    sortOrder: 13,
    metadata: {
      termMonths: 60,
      amortizationMonths: 300,
      startDate: "2022-09-01",
      renewalDate: "2027-09-01",
      monthlyPayment: "2650.00",
      paymentFrequency: "biweekly",
    },
  },
  // ── Assets ──
  {
    key: "homeAsset",
    name: "Primary Residence",
    group: "asset",
    balance: "620000.00",
    currency: "CAD",
    description: "Condo in Toronto",
    includeInNetWorth: true,
    sortOrder: 14,
    metadata: {
      assetType: "property",
      purchaseDate: "2022-09-01",
      purchasePrice: "550000",
      location: "Toronto, ON",
    },
  },
  {
    key: "carAsset",
    name: "2023 Toyota RAV4",
    group: "asset",
    balance: "28000.00",
    currency: "CAD",
    description: "Vehicle",
    includeInNetWorth: true,
    sortOrder: 15,
    metadata: {
      assetType: "vehicle",
      purchaseDate: "2023-06-01",
      purchasePrice: "38000",
    },
  },
  // ── Other ──
  {
    key: "hsa",
    name: "Employer HSA",
    group: "other",
    balance: "1200.00",
    currency: "CAD",
    institutionName: "Sun Life",
    description: "Health spending account",
    includeInNetWorth: false,
    sortOrder: 16,
  },
];

// ── Recurring rules ───────────────────────────────────────────────────────────

type ExpenseRule = {
  kind: "monthly" | "biweekly";
  type: "INCOME" | "EXPENSE";
  accountKey: string;
  categoryName: string;
  amount: number;
  jitterPct: number;
  description: string;
  dayOfMonth?: number;
};

type TransferRule = {
  kind: "monthly" | "biweekly";
  type: "TRANSFER";
  fromAccountKey: string;
  toAccountKey: string;
  amount: number;
  jitterPct: number;
  description: string;
  dayOfMonth?: number;
};

type RecurringRule = ExpenseRule | TransferRule;

const RECURRING_RULES: RecurringRule[] = [
  // Income
  {
    kind: "biweekly",
    type: "INCOME",
    accountKey: "checking",
    categoryName: "Salary",
    amount: 5500,
    jitterPct: 0.02,
    description: "Salary deposit",
  },
  // Housing
  {
    kind: "biweekly",
    type: "EXPENSE",
    accountKey: "checking",
    categoryName: "Mortgage",
    amount: 2650,
    jitterPct: 0,
    description: "Mortgage payment - RBC",
  },
  // Utilities
  {
    kind: "monthly",
    type: "EXPENSE",
    accountKey: "checking",
    categoryName: "Heat & Hydro",
    amount: 125,
    jitterPct: 0.1,
    description: "Hydro One",
    dayOfMonth: 10,
  },
  {
    kind: "monthly",
    type: "EXPENSE",
    accountKey: "checking",
    categoryName: "Heat & Hydro",
    amount: 45,
    jitterPct: 0.15,
    description: "Enbridge Gas",
    dayOfMonth: 12,
  },
  {
    kind: "monthly",
    type: "EXPENSE",
    accountKey: "checking",
    categoryName: "Wifi",
    amount: 85,
    jitterPct: 0,
    description: "Rogers Internet",
    dayOfMonth: 15,
  },
  {
    kind: "monthly",
    type: "EXPENSE",
    accountKey: "checking",
    categoryName: "Phone Bill",
    amount: 75,
    jitterPct: 0,
    description: "Bell Mobility",
    dayOfMonth: 18,
  },
  // Entertainment (streaming)
  {
    kind: "monthly",
    type: "EXPENSE",
    accountKey: "rogersCC",
    categoryName: "Streaming",
    amount: 16.99,
    jitterPct: 0,
    description: "Netflix",
    dayOfMonth: 3,
  },
  {
    kind: "monthly",
    type: "EXPENSE",
    accountKey: "visa",
    categoryName: "Streaming",
    amount: 11.99,
    jitterPct: 0,
    description: "Spotify",
    dayOfMonth: 7,
  },
  // Healthcare
  {
    kind: "monthly",
    type: "EXPENSE",
    accountKey: "rogersCC",
    categoryName: "Gym & Fitness",
    amount: 49.99,
    jitterPct: 0,
    description: "GoodLife Fitness",
    dayOfMonth: 1,
  },
  // Transportation
  {
    kind: "monthly",
    type: "EXPENSE",
    accountKey: "checking",
    categoryName: "Subway",
    amount: 156,
    jitterPct: 0,
    description: "TTC Monthly Pass",
    dayOfMonth: 1,
  },
  {
    kind: "monthly",
    type: "EXPENSE",
    accountKey: "checking",
    categoryName: "Car Payment",
    amount: 520,
    jitterPct: 0,
    description: "Auto loan payment - Toyota Financial",
    dayOfMonth: 5,
  },
  {
    kind: "monthly",
    type: "EXPENSE",
    accountKey: "checking",
    categoryName: "Auto Insurance",
    amount: 185,
    jitterPct: 0,
    description: "Auto insurance - TD Insurance",
    dayOfMonth: 20,
  },
  // Transfers
  {
    kind: "monthly",
    type: "TRANSFER",
    fromAccountKey: "checking",
    toAccountKey: "tfsa",
    amount: 500,
    jitterPct: 0,
    description: "TFSA contribution",
    dayOfMonth: 16,
  },
  {
    kind: "monthly",
    type: "TRANSFER",
    fromAccountKey: "checking",
    toAccountKey: "fhsa",
    amount: 666,
    jitterPct: 0,
    description: "FHSA contribution",
    dayOfMonth: 16,
  },
  {
    kind: "monthly",
    type: "TRANSFER",
    fromAccountKey: "checking",
    toAccountKey: "visa",
    amount: 800,
    jitterPct: 0.15,
    description: "Visa payment",
    dayOfMonth: 20,
  },
  {
    kind: "monthly",
    type: "TRANSFER",
    fromAccountKey: "checking",
    toAccountKey: "rogersCC",
    amount: 250,
    jitterPct: 0.2,
    description: "Rogers Mastercard payment",
    dayOfMonth: 20,
  },
];

// ── One-off transaction definitions ──────────────────────────────────────────

type OneOffTx = {
  kind: "tx";
  accountKey: string;
  categoryName: string;
  type: "INCOME" | "EXPENSE";
  amount: string;
  description: string;
  daysBack: number;
  isCleared?: boolean;
};

type OneOffTransfer = {
  kind: "transfer";
  fromAccountKey: string;
  toAccountKey: string;
  amount: string;
  description: string;
  daysBack: number;
  isCleared?: boolean;
};

type OneOff = OneOffTx | OneOffTransfer;

const ONE_OFFS: OneOff[] = [
  // Groceries
  {
    kind: "tx",
    accountKey: "visa",
    categoryName: "Groceries",
    type: "EXPENSE",
    amount: "85.00",
    description: "Loblaws",
    daysBack: 1,
  },
  {
    kind: "tx",
    accountKey: "cash",
    categoryName: "Groceries",
    type: "EXPENSE",
    amount: "12.00",
    description: "Farmers market",
    daysBack: 6,
  },
  {
    kind: "tx",
    accountKey: "rogersCC",
    categoryName: "Groceries",
    type: "EXPENSE",
    amount: "112.45",
    description: "Metro",
    daysBack: 14,
  },
  {
    kind: "tx",
    accountKey: "rogersCC",
    categoryName: "Groceries",
    type: "EXPENSE",
    amount: "243.60",
    description: "Costco Wholesale",
    daysBack: 18,
  },
  {
    kind: "tx",
    accountKey: "visa",
    categoryName: "Groceries",
    type: "EXPENSE",
    amount: "67.20",
    description: "No Frills",
    daysBack: 40,
  },
  // Restaurants / Coffee / Takeout / Alcohol
  {
    kind: "tx",
    accountKey: "visa",
    categoryName: "Restaurants",
    type: "EXPENSE",
    amount: "42.00",
    description: "Thai Express",
    daysBack: 3,
  },
  {
    kind: "tx",
    accountKey: "visa",
    categoryName: "Coffee",
    type: "EXPENSE",
    amount: "6.50",
    description: "Tim Hortons",
    daysBack: 5,
  },
  {
    kind: "tx",
    accountKey: "visa",
    categoryName: "Coffee",
    type: "EXPENSE",
    amount: "5.25",
    description: "Tim Hortons",
    daysBack: 32,
  },
  {
    kind: "tx",
    accountKey: "visa",
    categoryName: "Coffee",
    type: "EXPENSE",
    amount: "6.80",
    description: "Tim Hortons",
    daysBack: 58,
  },
  {
    kind: "tx",
    accountKey: "visa",
    categoryName: "Takeout",
    type: "EXPENSE",
    amount: "38.50",
    description: "Uber Eats",
    daysBack: 22,
  },
  {
    kind: "tx",
    accountKey: "rogersCC",
    categoryName: "Takeout",
    type: "EXPENSE",
    amount: "29.75",
    description: "SkipTheDishes",
    daysBack: 47,
  },
  {
    kind: "tx",
    accountKey: "visa",
    categoryName: "Alcohol",
    type: "EXPENSE",
    amount: "54.25",
    description: "LCBO",
    daysBack: 11,
  },
  // Shopping (subs)
  {
    kind: "tx",
    accountKey: "rogersCC",
    categoryName: "Home Goods",
    type: "EXPENSE",
    amount: "89.99",
    description: "Canadian Tire",
    daysBack: 25,
  },
  {
    kind: "tx",
    accountKey: "visa",
    categoryName: "Home Goods",
    type: "EXPENSE",
    amount: "150.00",
    description: "Amazon.ca",
    daysBack: 4,
  },
  {
    kind: "tx",
    accountKey: "visa",
    categoryName: "Home Goods",
    type: "EXPENSE",
    amount: "89.99",
    description: "Amazon.ca",
    daysBack: 38,
  },
  // Healthcare (subs)
  {
    kind: "tx",
    accountKey: "visa",
    categoryName: "Pharmacy",
    type: "EXPENSE",
    amount: "38.75",
    description: "Shoppers Drug Mart",
    daysBack: 16,
  },
  {
    kind: "tx",
    accountKey: "hsa",
    categoryName: "Dental",
    type: "EXPENSE",
    amount: "150.00",
    description: "Dental cleaning",
    daysBack: 20,
  },
  // Transportation (subs)
  {
    kind: "tx",
    accountKey: "visa",
    categoryName: "Fuel",
    type: "EXPENSE",
    amount: "65.00",
    description: "Petro Canada",
    daysBack: 7,
  },
  {
    kind: "tx",
    accountKey: "visa",
    categoryName: "Fuel",
    type: "EXPENSE",
    amount: "72.40",
    description: "Shell",
    daysBack: 29,
  },
  {
    kind: "tx",
    accountKey: "visa",
    categoryName: "Fuel",
    type: "EXPENSE",
    amount: "68.15",
    description: "Petro Canada",
    daysBack: 55,
  },
  {
    kind: "tx",
    accountKey: "checking",
    categoryName: "Subway",
    type: "EXPENSE",
    amount: "40.00",
    description: "Presto top-up",
    daysBack: 42,
  },
  // Entertainment (subs)
  {
    kind: "tx",
    accountKey: "visa",
    categoryName: "Movies",
    type: "EXPENSE",
    amount: "25.00",
    description: "Cineplex",
    daysBack: 8,
  },
  {
    kind: "tx",
    accountKey: "rogersCC",
    categoryName: "Movies",
    type: "EXPENSE",
    amount: "52.30",
    description: "Cineplex - date night",
    daysBack: 35,
  },
  // Housing (subs)
  {
    kind: "tx",
    accountKey: "checking",
    categoryName: "Property Taxes",
    type: "EXPENSE",
    amount: "810.00",
    description: "City of Toronto property tax",
    daysBack: 60,
  },
  {
    kind: "tx",
    accountKey: "visa",
    categoryName: "Home Insurance",
    type: "EXPENSE",
    amount: "1680.00",
    description: "TD Home Insurance - annual",
    daysBack: 75,
  },
  // Income
  {
    kind: "tx",
    accountKey: "wealthSimpleCash",
    categoryName: "Freelance",
    type: "INCOME",
    amount: "1200.00",
    description: "Freelance logo project",
    daysBack: 10,
  },
  {
    kind: "tx",
    accountKey: "wealthSimpleCash",
    categoryName: "Freelance",
    type: "INCOME",
    amount: "2400.00",
    description: "Freelance website project",
    daysBack: 52,
  },
  {
    kind: "tx",
    accountKey: "tfsa",
    categoryName: "Dividends",
    type: "INCOME",
    amount: "320.50",
    description: "TFSA dividend payout",
    daysBack: 22,
  },
  {
    kind: "tx",
    accountKey: "rrsp",
    categoryName: "Dividends",
    type: "INCOME",
    amount: "185.75",
    description: "RRSP dividend payout",
    daysBack: 22,
  },
  {
    kind: "tx",
    accountKey: "checking",
    categoryName: "Refund",
    type: "INCOME",
    amount: "1450.00",
    description: "CRA tax refund",
    daysBack: 67,
  },
  {
    kind: "tx",
    accountKey: "checking",
    categoryName: "CRA Benefits",
    type: "INCOME",
    amount: "124.00",
    description: "GST/HST credit - CRA",
    daysBack: 45,
  },
  {
    kind: "tx",
    accountKey: "cash",
    categoryName: "Gift",
    type: "INCOME",
    amount: "200.00",
    description: "Birthday gift",
    daysBack: 48,
  },
  // USD transactions on BMO USD Chequing (raw USD, no conversion)
  {
    kind: "tx",
    accountKey: "bmoUsd",
    categoryName: "Home Goods",
    type: "EXPENSE",
    amount: "45.20",
    description: "Amazon.com",
    daysBack: 14,
  },
  {
    kind: "tx",
    accountKey: "bmoUsd",
    categoryName: "Events",
    type: "EXPENSE",
    amount: "312.00",
    description: "Marriott Seattle",
    daysBack: 41,
  },
  {
    kind: "tx",
    accountKey: "bmoUsd",
    categoryName: "Freelance",
    type: "INCOME",
    amount: "800.00",
    description: "US client payment",
    daysBack: 30,
  },
  // Pending
  {
    kind: "tx",
    accountKey: "rogersCC",
    categoryName: "Fuel",
    type: "EXPENSE",
    amount: "72.00",
    description: "Costco Gas (pending)",
    daysBack: 0,
    isCleared: false,
  },
  // One-off transfers
  {
    kind: "transfer",
    fromAccountKey: "checking",
    toAccountKey: "savings",
    amount: "500.00",
    description: "Transfer to savings",
    daysBack: 2,
  },
  {
    kind: "transfer",
    fromAccountKey: "checking",
    toAccountKey: "tfsa",
    amount: "500.00",
    description: "TFSA contribution (pending)",
    daysBack: 0,
    isCleared: false,
  },
];

// ── Main seed function ────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Starting database seed...");
  const db = getDatabase(DATABASE_URL!);

  try {
    // Profile
    console.log("👤 Creating default profile...");
    const existing = await db
      .select({ id: profiles.id })
      .from(profiles)
      .where(eq(profiles.isDefault, true))
      .limit(1);

    if (existing.length > 0) {
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
        timezone: TZ,
        isDefault: true,
        isActive: true,
        isSetupComplete: true,
      })
      .returning();

    const profileId = defaultProfile!.id;
    console.log(`✅ Created default profile: ${profileId}`);

    // Categories
    console.log("📥 Seeding default categories...");
    const seededCategories = await seedCategoriesForProfile(db, profileId);

    const catByName = new Map(seededCategories.map((c) => [c.name, c]));
    const incomeCount = seededCategories.filter(
      (c) => c.type === "INCOME"
    ).length;
    const expenseCount = seededCategories.filter(
      (c) => c.type === "EXPENSE"
    ).length;
    const parentCount = seededCategories.filter((c) => !c.parentId).length;
    const childCount = seededCategories.length - parentCount;
    console.log(
      `✅ Created ${seededCategories.length} categories (${parentCount} parents, ${childCount} sub-categories)`
    );

    // Accounts — insert all, then resolve linkedAccountKey references
    console.log("🏦 Seeding accounts...");
    const accountIdByKey = new Map<string, string>();

    for (const def of ACCOUNT_DEFS) {
      const { key, linkedAccountKey, metadata, ...rest } = def;
      const [inserted] = await db
        .insert(accounts)
        .values({
          ...rest,
          profileId,
          metadata: metadata ? JSON.stringify(metadata) : undefined,
        })
        .returning();
      accountIdByKey.set(key, inserted!.id);
    }

    for (const def of ACCOUNT_DEFS) {
      if (def.linkedAccountKey) {
        const linkedId = accountIdByKey.get(def.linkedAccountKey);
        const selfId = accountIdByKey.get(def.key);
        if (linkedId && selfId) {
          await db
            .update(accounts)
            .set({ linkedAccountId: linkedId })
            .where(eq(accounts.id, selfId));
        }
      }
    }

    console.log(`✅ Created ${ACCOUNT_DEFS.length} accounts`);

    // Transactions
    console.log("💳 Generating transactions...");
    const allTxRows: TxRow[] = [];
    const today = todayInToronto();

    // Expand recurring rules
    for (const rule of RECURRING_RULES) {
      if (rule.kind === "monthly") {
        for (let mo = 0; mo < MONTHS_OF_HISTORY; mo++) {
          const day = rule.dayOfMonth ?? 1;
          const date = monthsAgo(mo, day);
          if (date > today) continue;

          const amount =
            rule.jitterPct > 0
              ? jitter(rule.amount, rule.jitterPct)
              : rule.amount.toFixed(2);

          if (rule.type === "TRANSFER") {
            allTxRows.push(
              ...makeTransferPair({
                profileId,
                fromAccountId: accountIdByKey.get(rule.fromAccountKey)!,
                toAccountId: accountIdByKey.get(rule.toAccountKey)!,
                amount,
                description: rule.description,
                date,
              })
            );
          } else {
            allTxRows.push({
              profileId,
              accountId: accountIdByKey.get(rule.accountKey)!,
              categoryId: catByName.get(rule.categoryName)?.id ?? null,
              type: rule.type,
              amount,
              description: rule.description,
              date,
              isCleared: true,
            });
          }
        }
      } else {
        // biweekly: every 14 days going back across MONTHS_OF_HISTORY months
        const maxDays = MONTHS_OF_HISTORY * 30;
        for (let d = 0; d <= maxDays; d += 14) {
          const date = daysAgo(d);
          const amount =
            rule.jitterPct > 0
              ? jitter(rule.amount, rule.jitterPct)
              : rule.amount.toFixed(2);

          if (rule.type === "TRANSFER") {
            allTxRows.push(
              ...makeTransferPair({
                profileId,
                fromAccountId: accountIdByKey.get(rule.fromAccountKey)!,
                toAccountId: accountIdByKey.get(rule.toAccountKey)!,
                amount,
                description: rule.description,
                date,
              })
            );
          } else {
            allTxRows.push({
              profileId,
              accountId: accountIdByKey.get(rule.accountKey)!,
              categoryId: catByName.get(rule.categoryName)?.id ?? null,
              type: rule.type,
              amount,
              description: rule.description,
              date,
              isCleared: true,
            });
          }
        }
      }
    }

    // Expand one-offs
    for (const item of ONE_OFFS) {
      const date = daysAgo(item.daysBack);
      if (item.kind === "transfer") {
        allTxRows.push(
          ...makeTransferPair({
            profileId,
            fromAccountId: accountIdByKey.get(item.fromAccountKey)!,
            toAccountId: accountIdByKey.get(item.toAccountKey)!,
            amount: item.amount,
            description: item.description,
            date,
            isCleared: item.isCleared,
          })
        );
      } else {
        allTxRows.push({
          profileId,
          accountId: accountIdByKey.get(item.accountKey)!,
          categoryId: catByName.get(item.categoryName)?.id ?? null,
          type: item.type,
          amount: item.amount,
          description: item.description,
          date,
          isCleared: item.isCleared ?? true,
        });
      }
    }

    await db.insert(transactions).values(allTxRows);

    const incomeRows = allTxRows.filter((r) => r.type === "INCOME").length;
    const expenseRows = allTxRows.filter((r) => r.type === "EXPENSE").length;
    const xferLegs = allTxRows.filter((r) => r.type === "TRANSFER").length;
    const pendingRows = allTxRows.filter((r) => !r.isCleared).length;

    console.log(`\n✨ Database seeding completed successfully!`);
    console.log(`📊 Summary:
  - Profiles:     1 (Personal Space, CAD, America/Toronto)
  - Categories:   ${incomeCount} income + ${expenseCount} expense = ${seededCategories.length} total (${parentCount} parents, ${childCount} sub-categories)
  - Accounts:     ${ACCOUNT_DEFS.length} (chequing x3, savings, credit cards x2, investments x3, cash, loans x2, mortgage, assets x2, other x1)
  - Transactions: ${allTxRows.length} total
      • ${incomeRows} income
      • ${expenseRows} expense
      • ${xferLegs} transfer legs (${xferLegs / 2} pairs)
      • ${pendingRows} pending (isCleared = false)
  - History:      ${MONTHS_OF_HISTORY} months back from ${today}
    `);

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    console.error(
      "⚠️  Seed partially applied — run `pnpm db:reset` to retry from clean state"
    );
    process.exit(1);
  }
}

seed();
