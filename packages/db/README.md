# Database Package (`@workspace/db`)

PostgreSQL database layer using [Drizzle ORM](https://orm.drizzle.team/) with TypeScript.

## Architecture

```
packages/db/
├── src/
│   ├── index.ts        # Database connection singleton + exports
│   ├── schema.ts       # Database schema (tables, relations, types)
│   ├── seed.ts         # Database seeder (sample data)
│   ├── empty.ts       # Database cleaner (truncate all tables)
│   ├── create-db.ts   # Database creation script
│   └── drop-db.ts     # Database deletion script
├── drizzle.config.ts   # Drizzle Kit configuration
└── package.json        # npm scripts
```

## Schema Overview

### Tables

| Table          | Description                                                                         |
| -------------- | ----------------------------------------------------------------------------------- |
| `profiles`     | User workspaces (multi-tenant)                                                      |
| `accounts`     | Financial accounts (checking, savings, credit cards, investments, loans, mortgages) |
| `categories`   | Transaction categories (income/expense)                                             |
| `transactions` | Financial transactions with double-entry transfers                                  |

### Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  profiles   │       │   accounts  │       │ categories  │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │◄──1:m─│ profile_id  │       │ id (PK)     │
│ name        │       │ id (PK)     │       │ profile_id  │
│ currency    │       │ name        │       │ parent_id   │
│ ...         │       │ group       │       │ type        │
└─────────────┘       │ balance     │       └──────┬──────┘
       │              │ linked_id   │            │
       │  1:m         └──────┬──────┘            │ 1:m
       ▼                     │                    ▼
┌─────────────────────────────────────────────────────────────┐
│                      transactions                           │
├─────────────────────────────────────────────────────────────┤
│ id (PK)        │ profile_id  │ account_id  │ category_id  │
│ type           │ amount      │ description │ transfer_id  │
│ date           │ is_cleared  │             │              │
└─────────────────────────────────────────────────────────────┘
```

### Enums

| Enum               | Values                                                                         |
| ------------------ | ------------------------------------------------------------------------------ |
| `profile_type`     | PERSONAL, BUSINESS, SHARED                                                     |
| `account_group`    | checking, savings, cash, credit_card, investment, loan, mortgage, asset, other |
| `category_type`    | INCOME, EXPENSE                                                                |
| `transaction_type` | INCOME, EXPENSE, TRANSFER                                                      |
| `date_format`      | D MMM, YYYY, DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD                                |
| `week_start`       | SUNDAY, MONDAY                                                                 |

## Account Groups

| Group         | Description                     | includeInNetWorth default | Example         |
| ------------- | ------------------------------- | ------------------------- | --------------- |
| `checking`    | Chequing/current accounts       | true                      | TD Chequing     |
| `savings`     | Savings, HYSA, ISA, GIC         | true                      | EQ Bank Savings |
| `cash`        | Physical cash, e-wallets        | true                      | Cash Wallet     |
| `credit_card` | Credit & charge cards           | **false**                 | TD Visa         |
| `investment`  | Brokerage, RRSP, TFSA, 401k     | true                      | Wealthsimple    |
| `loan`        | Personal, auto, student loans   | **false**                 | Car Loan        |
| `mortgage`    | Home loans                      | **false**                 | Mortgage        |
| `asset`       | Property, vehicles (non-liquid) | true                      | House           |
| `other`       | Catch-all                       | true                      | Misc            |

**Key Features:**

- **Negative balances** for liabilities (credit_card, loan, mortgage)
- **Linked accounts**: credit card → payment account, mortgage → property asset
- **includeInNetWorth**: controls net worth calculation

## Database Connection

```typescript
import { getDatabase } from "@workspace/db";

const db = getDatabase(process.env.DATABASE_URL);
```

The package uses a **singleton pattern** to avoid creating multiple database connections.

## Type Exports

```typescript
import type {
  Profile,
  InsertProfile,
  Account,
  InsertAccount,
  Category,
  InsertCategory,
  Transaction,
  InsertTransaction,
} from "@workspace/db";
```

## Available Scripts

All scripts load environment variables from root `.env` automatically via `dotenv-cli`.

| Command                   | Description                                                |
| ------------------------- | ---------------------------------------------------------- |
| `pnpm db:create`          | Create database if it doesn't exist                        |
| `pnpm db:drop`            | Drop the entire database                                   |
| `pnpm db:push`            | Push schema changes to database (non-destructive)          |
| `pnpm db:push:force`      | Push schema with auto-approve for data loss                |
| `pnpm db:migrate`         | Run Drizzle migrations (creates versioned migration files) |
| `pnpm db:generate`        | Generate SQL from schema changes                           |
| `pnpm db:studio`          | Open Drizzle Studio (visual DB browser)                    |
| `pnpm db:seed`            | Seed database with sample data                             |
| `pnpm db:empty`           | Show table row counts (dry-run)                            |
| `pnpm db:empty --execute` | Truncate all tables                                        |
| `pnpm db:reset`           | Empty + reseed database                                    |
| `pnpm db:setup`           | Full setup: create + push                                  |
| `pnpm db:setup:seed`      | Full setup: create + push + seed                           |

## Quick Start on New Machine

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Ensure PostgreSQL is running (from repo root)
pnpm db:docker:up

# 3. Create database, tables, and seed data
pnpm db:setup:seed
```

## Seeded Data

| Entity                 | Count | Details                                                                                                            |
| ---------------------- | ----- | ------------------------------------------------------------------------------------------------------------------ |
| **Profile**            | 1     | "Personal Space" (CAD, default)                                                                                    |
| **Income Categories**  | 5     | Salary, Freelance, Investment, Gift, Other                                                                         |
| **Expense Categories** | 10    | Housing, Transportation, Food, Utilities, Healthcare, Entertainment, Shopping, Subscriptions, Personal Care, Other |
| **Accounts**           | 5     | Checking ($4,250), Savings ($15,000), Credit Card (-$1,250), Investment ($45,000), Cash ($200)                     |
| **Transactions**       | 14    | Income, expenses, and transfers (with transfer IDs for double-entry)                                               |

## Best Practices

1. **Multi-tenant isolation**: All tables (except profiles) include `profileId`
2. **Cascade deletes**: Foreign keys use `ON DELETE CASCADE`
3. **Soft deletes**: Tables have `isActive` flag
4. **Timestamps**: All tables have `createdAt` and `updatedAt`
5. **UUIDs**: All tables use UUID primary keys
6. **Numeric precision**: Money uses `numeric(15,2)` to avoid floating-point issues

## Troubleshooting

### "relation does not exist" after db:push

```bash
pnpm db:push:force
```

### Permission denied

```sql
ALTER USER postgres CREATEDB;
```

### Connection refused

Ensure PostgreSQL is running and port matches your `.env`:

```bash
psql -h localhost -p 5433 -U postgres -c "SELECT 1"
```
