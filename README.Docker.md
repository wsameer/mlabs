# Docker (Database Only for Local Development)

This project currently runs:
- app locally (`pnpm dev`)
- PostgreSQL in Docker (`docker compose`)

## 1. Prepare environment

```bash
cp .env.example .env
```

Default database config:
- host: `localhost`
- port: `5433`
- db: `mlabs_dev`
- user: `postgres`

## 2. Start PostgreSQL in Docker

```bash
pnpm db:docker:up
pnpm db:docker:status
```

If you need logs:

```bash
pnpm db:docker:logs
```

## 3. Bootstrap schema

Run once on a fresh DB:

```bash
pnpm db:bootstrap
```

Optional seed data:

```bash
pnpm db:bootstrap:seed
```

## 4. Run the app locally

```bash
pnpm dev
```

## Useful commands

```bash
# stop DB container (keeps data volume)
pnpm db:docker:down

# restart DB container
pnpm db:docker:restart

# reset DB container and delete all DB data
pnpm db:docker:reset
```

## Data persistence

Postgres data is stored in a named Docker volume: `mlabs_db_data`.
That means restarting containers does not wipe data unless you run a reset with `-v`.
