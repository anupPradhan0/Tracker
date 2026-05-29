# Anurag — Expense Tracker SaaS

Production-grade mobile-first expense tracker with React + Vite frontend, Express + Prisma + PostgreSQL backend.

**Auth:** Email/password + JWT only (no Google OAuth).

## Stack

- **Frontend:** React, TypeScript, Vite, TanStack Query, shadcn-style UI, Tailwind, React Hook Form, Zod
- **Backend:** Node.js, Express, PostgreSQL, Prisma, JWT, bcrypt
- **Package manager:** pnpm

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for PostgreSQL)

## Quick start

### Option A — Docker (full stack)

```bash
cd Anurag

cp .env.example .env
# Set JWT_* secrets and ENCRYPTION_KEY (see below)

pnpm docker:up:all
```

- **Web:** http://localhost:5173 (nginx serves the built app, proxies `/api` to the API container)
- **API:** http://localhost:4000/api/v1/health

Postgres only (run web/API on host with `pnpm dev`):

```bash
docker compose up -d
pnpm install && pnpm db:push && pnpm dev
```

### Option B — Local dev (Postgres in Docker)

```bash
cd Anurag

cp .env.example .env
# On PowerShell: [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])

docker compose up -d

pnpm install
pnpm --filter @anurag/types build
pnpm --filter @anurag/utils build
pnpm db:push
pnpm dev
```

- **Web:** http://localhost:5173
- **API:** http://localhost:4000/api/v1/health

## Project structure

```
Anurag/
├── apps/
│   ├── web/          # Vite React frontend
│   └── server/       # Express API
└── packages/
    ├── types/        # Shared Zod schemas & DTOs
    └── utils/        # Shared utilities
```

## Environment variables

See [.env.example](.env.example). Required for server:

- `DATABASE_URL`
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` (min 32 chars)
- `ENCRYPTION_KEY` (32-byte base64 for AI key encryption)
- `CLIENT_URL`

Optional: `MAIL_*` for email AI summaries.

## Features

- Signup / login / logout (JWT + refresh cookie)
- Expenses CRUD with categories, search, filters
- Monthly budgets with exceeded warnings
- Dashboard analytics & charts
- Per-user encrypted AI keys (Gemini / OpenAI)
- AI spending summaries
- Email AI summary (requires SMTP config)

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run web + server |
| `pnpm build` | Build all packages |
| `pnpm db:push` | Push Prisma schema |
| `pnpm db:studio` | Open Prisma Studio |

## Docker

| Command | Description |
|---------|-------------|
| `pnpm docker:up` | Start Postgres only |
| `pnpm docker:up:all` | Build & start Postgres + API + web (`--profile app`) |
| `pnpm docker:down` | Stop all containers |

Images:

- **api** — Express API; runs `prisma db push` on start, then `node dist/index.js`
- **web** — nginx + Vite production build; `VITE_API_URL=/api/v1` with reverse proxy to `api:4000`

## Deployment notes

- Run `prisma migrate deploy` on production (or `db push` for early setups)
- Set `NODE_ENV=production`, secure cookies, strong secrets
- Use `docker compose --profile app up -d --build` or serve `apps/web` via CDN with API on Railway/Render/Fly
