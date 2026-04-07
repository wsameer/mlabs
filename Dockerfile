# syntax=docker/dockerfile:1

ARG NODE_VERSION=24.14.1
ARG PNPM_VERSION=9.7.0

FROM node:${NODE_VERSION}-alpine

WORKDIR /app

RUN apk add --no-cache libc6-compat \
  && npm install -g pnpm@${PNPM_VERSION}

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter=web exec vite build

ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_URL=/data/mlabs.db
ENV WEB_DIST_PATH=/app/apps/web/dist

EXPOSE 3001
VOLUME ["/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -qO- http://localhost:3001/api/health || exit 1

CMD ["sh", "-c", "pnpm start:prod"]
