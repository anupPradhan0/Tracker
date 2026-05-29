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

```bash
cd Anurag

# Copy env and generate encryption key (32-byte base64)
cp .env.example .env
# On PowerShell: [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])

# Start PostgreSQL
docker compose up -d

# Install dependencies
pnpm install

# Build shared packages
pnpm --filter @anurag/types build
pnpm --filter @anurag/utils build

# Database migrate
pnpm db:push

# Run dev (web + server)
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

## Deployment notes

- Run `prisma migrate deploy` on production
- Set `NODE_ENV=production`, secure cookies, strong secrets
- Serve `apps/web` build via CDN; API on Railway/Render/Fly
