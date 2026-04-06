# Docker and Deploy

SQLite is embedded, so local development does not need a separate database
container.

## Local development

```bash
cp .env.example .env
pnpm db:bootstrap
pnpm dev
```

Optional sample data:

```bash
pnpm db:bootstrap:seed
```

## Single-container production

The app is set up to run as one container:

- Hono API serves `/api/*`
- Vite frontend is served as static files by the same Hono process
- SQLite lives at `/data/mlabs.db`

Build and run locally:

```bash
docker build -t mlabs .
docker run -p 3001:3001 -v mlabs_data:/data mlabs
```

Or with Compose:

```bash
docker compose --profile full-stack up --build
```

## Recommended first deploy

The easiest real deployment for this stack is a Docker host with persistent
storage, such as Railway, a VPS, or later PikaPods.

Recommended production env vars:

- `NODE_ENV=production`
- `PORT=3001`
- `DATABASE_URL=/data/mlabs.db`
- `WEB_DIST_PATH=/app/apps/web/dist`

On Railway:

1. Deploy from your GitHub repo.
2. Let Railway build from the `Dockerfile`.
3. Attach a persistent volume and mount it at `/data`.
4. Set the env vars above.
5. Generate a public domain for the service.

## Vercel

Vercel is still a good option for the frontend alone, but not for the full app
while SQLite is a local file. The current full-stack deploy target should be a
single long-running container with a persistent volume.
