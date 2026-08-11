# Build context: monorepo root
# docker build -f dingobet-api/Dockerfile .

# ─── Stage 1: Builder ────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN corepack enable

WORKDIR /app

# Copy workspace manifests first for layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY dingobet-api/package.json ./dingobet-api/

# Install all dependencies (dev included for tsc + prisma generate)
RUN pnpm install --frozen-lockfile --filter dingobet-api...

# Copy API source
COPY dingobet-api ./dingobet-api

# Generate Prisma client (outputs to prisma/generated/prisma/)
RUN pnpm --filter dingobet-api exec prisma generate

# Compile TypeScript → dist/
RUN pnpm --filter dingobet-api build

# Create a clean production deployment (prod deps only, no symlinks)
RUN pnpm --filter dingobet-api deploy --prod /prod/dingobet-api


# ─── Stage 2: Production ─────────────────────────────────────────────────────
FROM node:22-alpine AS production

RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

# Production node_modules from pnpm deploy (no devDeps, no workspace symlinks)
COPY --from=builder --chown=app:app /prod/dingobet-api/node_modules ./node_modules

# Compiled application
COPY --from=builder --chown=app:app /app/dingobet-api/dist ./dist

# Prisma schema + migrations needed for `prisma migrate deploy`
# Run migrations via the `migrate` service in docker-compose, not here.
COPY --from=builder --chown=app:app /app/dingobet-api/prisma/schema.prisma ./prisma/schema.prisma
COPY --from=builder --chown=app:app /app/dingobet-api/prisma/migrations ./prisma/migrations

COPY --from=builder --chown=app:app /app/dingobet-api/package.json ./package.json

USER app

EXPOSE 4000

CMD ["node", "dist/src/index.js"]
