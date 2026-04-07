# shadcn/ui monorepo template

This is a Vite monorepo template with shadcn/ui.

## Local development (app + embedded SQLite)

```bash
cp .env.example .env
pnpm db:bootstrap
pnpm dev

# Seed data
Use `pnpm db:bootstrap:seed` instead of `pnpm db:bootstrap` if you want sample data.
```

## PROD
```bash
# local testing (no domain, Caddy serves on localhost)
docker compose -f docker-compose.prod.yml up -d

# VPS/Droplet with a real domain
DOMAIN=mlabs.yourdomain.com docker compose -f docker-compose.prod.yml up -d

# Custom image tag or port
IMAGE_TAG=abc1234 HOST_PORT=8080 docker compose -f docker-compose.prod.yml up -d
```

## Self host
```bash
docker run -p 3001:3001 -v mlabs_data:/data ghcr.io/<your-username>/mlabs:latest
```
