# Finance Tracker (Vishal)

Phase 1: Authentication only — Express + PostgreSQL + Prisma backend, Vite + React frontend.

## Prerequisites

- Node.js 20+
- pnpm (`corepack enable && corepack prepare pnpm@latest --activate`)
- Docker (optional, for local PostgreSQL)
- Google Cloud OAuth credentials

## Quick start

### 1. PostgreSQL

```bash
cd Vishal
docker compose up -d
```

Database URL (default):

```
postgresql://finance:finance@localhost:5434/finance_tracker
```

### 2. Environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit `backend/.env`:

- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` from [Google Cloud Console](https://console.cloud.google.com/)
- `JWT_SECRET` — generate with: `openssl rand -base64 32`
- `DATABASE_URL` — match your PostgreSQL instance

### 3. Google OAuth setup

Create a **Web application** OAuth client:

| Setting | Value |
|---------|--------|
| Authorized redirect URI | `http://localhost:4000/api/auth/callback` |
| Authorized JavaScript origin | `http://localhost:5173` |

### 4. Install and migrate

```bash
cd Vishal
pnpm install
pnpm --filter backend prisma:generate
pnpm --filter backend exec prisma migrate deploy
```

### 5. Run development

```bash
pnpm dev
```

- Backend: http://localhost:4000
- Frontend: http://localhost:5173

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/auth/google` | Start Google OAuth |
| GET | `/api/auth/callback` | OAuth callback (sets cookie, redirects to frontend) |
| GET | `/api/auth/me` | Current user (requires cookie) |
| POST | `/api/auth/logout` | Clear session cookie |

## Project structure

```
Vishal/
├── backend/          # Express + Prisma + Passport Google + JWT cookies
├── frontend/         # Vite + React + React Query + shadcn-style UI
├── docker-compose.yml
└── package.json      # pnpm workspace root
```

## Production notes

- Set `NODE_ENV=production`
- Use HTTPS; cookies use `secure: true` in production
- Set `FRONTEND_URL` to your deployed Vite URL
- Update Google redirect URI to production API callback
- Run `prisma migrate deploy` in CI/CD

## Manual verification

```bash
# Health
curl http://localhost:4000/api/health

# After browser login, test /me with cookies
curl -b cookies.txt http://localhost:4000/api/auth/me

# Logout
curl -X POST -b cookies.txt http://localhost:4000/api/auth/logout
```

## Out of scope (Phase 1)

Expense tracking, folders, pages, AI summaries, PDF export, and full dashboards are not included yet.
