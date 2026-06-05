# DingoBet 🎲

A full-stack sports betting platform built to demonstrate modern JS/TS ecosystem skills — real-world architecture, not a tutorial clone.

---

## Tech Stack

- **Frontend:** Next.js 14 + TypeScript + React
- **Backend:** Express.js (REST API)
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Auth:** JWT
- **Monorepo:** pnpm workspaces

---

## Features

- User registration, authentication, and wallet management
- Live odds display with sport and event browsing
- Single, multi, and parlay bet placement and settlement
- Bet history and transaction ledger per user
- Admin panel with odds sync triggering and event management
- KYC submission flow (admin approve/reject)
- Dockerised local development environment

---

## Architecture

Monorepo with two packages:

```
dingobet-master/
├── dingobet-api/     # Express + Prisma backend
└── dingobet-web/     # Next.js frontend
```

Separation of concerns between data layer (Prisma/PostgreSQL), business logic (Express services), and UI (React/Next.js) mirrors real production patterns.

---

## Run Locally

```bash
git clone https://github.com/j-miller-dev/dingobet-master
cd dingobet-master
cp dingobet-api/.env.example dingobet-api/.env
pnpm install
docker-compose up -d
pnpm --filter dingobet-api prisma migrate dev
pnpm dev
```

---

## Status

Core betting and wallet flows complete. SYSTEM bet settlement and cash-out scoped for v2.
