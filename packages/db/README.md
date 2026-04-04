# Database Package (`@workspace/db`)

SQLite database layer using [Drizzle ORM](https://orm.drizzle.team/) with TypeScript.

## Architecture

```
packages/db/
├── src/
│   ├── index.ts        # Database connection singleton + exports
│   ├── schema.ts       # Database schema (tables, relations, types)
│   ├── seed.ts         # Database seeder (sample data)
│   ├── empty.ts        # Database cleaner (dry-run + execute)
│   ├── create-db.ts    # Ensures sqlite file and directory exist
│   ├── drop-db.ts      # Deletes sqlite file (+ wal/shm)
│   └── path.ts         # Shared database path resolution helpers
├── drizzle.config.ts   # Drizzle Kit configuration (sqlite)
└── package.json        # npm scripts
```

## Database file

Default path is controlled by `DATABASE_URL` in root `.env`:

```env
DATABASE_URL=./data/mlabs.db
```

Relative paths are resolved from the repository root.

## Available scripts

| Command              | Description                                |
| -------------------- | ------------------------------------------ |
| `pnpm db:create`     | Create sqlite file if it does not exist    |
| `pnpm db:drop`       | Delete sqlite file                         |
| `pnpm db:push`       | Push schema changes to sqlite              |
| `pnpm db:push:force` | Push schema with auto-approve              |
| `pnpm db:generate`   | Generate SQL migration files from schema   |
| `pnpm db:migrate`    | Run generated migrations                   |
| `pnpm db:studio`     | Open Drizzle Studio                        |
| `pnpm db:seed`       | Seed sample data                           |
| `pnpm db:empty`      | Dry-run row counts per table               |
| `pnpm db:reset`      | Empty + reseed                             |
| `pnpm db:setup`      | Create DB file + push schema               |
| `pnpm db:setup:seed` | Create DB file + push schema + seed sample |

## Quick start

```bash
cp .env.example .env
pnpm db:setup:seed
```
