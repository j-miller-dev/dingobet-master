# Build context: monorepo root
# docker build -f dingobet-web/Dockerfile .

# ─── Stage 1: Dependencies ───────────────────────────────────────────────────
FROM node:22-alpine AS deps

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY dingobet-web/package.json ./dingobet-web/

RUN pnpm install --frozen-lockfile --filter dingobet-web...


# ─── Stage 2: Builder ────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN corepack enable

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/dingobet-web/node_modules ./dingobet-web/node_modules

COPY package.json pnpm-workspace.yaml ./
COPY dingobet-web ./dingobet-web

# Required at build time for API calls baked into static pages
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_APP_NAME=DingoBet

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME

# Disable Next.js telemetry
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm --filter dingobet-web build


# ─── Stage 3: Production ─────────────────────────────────────────────────────
FROM node:22-alpine AS production

RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Standalone output bundles everything needed to run Next.js
COPY --from=builder --chown=app:app /app/dingobet-web/.next/standalone ./
COPY --from=builder --chown=app:app /app/dingobet-web/.next/static ./dingobet-web/.next/static
COPY --from=builder --chown=app:app /app/dingobet-web/public ./dingobet-web/public

USER app

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "dingobet-web/server.js"]
