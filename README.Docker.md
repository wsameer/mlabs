# Docker Notes

SQLite is embedded, so local development does not need a database container.

## Local development (recommended)

```bash
cp .env.example .env
pnpm db:bootstrap
pnpm dev
```

Optional sample data:

```bash
pnpm db:bootstrap:seed
```

## Optional full-stack container (later/deployment testing)

`compose.yaml` includes an `app` service under the `full-stack` profile.
It mounts a persistent Docker volume at `/data` and uses:

- `DATABASE_URL=/data/mlabs.db`

Run it with:

```bash
docker compose --profile full-stack up --build
```
