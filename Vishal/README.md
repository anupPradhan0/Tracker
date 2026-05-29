# Finance Tracker (Vishal)

Express + PostgreSQL + Prisma backend, Vite + React frontend — auth plus **weekly tracker dashboard** (entries, PDF export, email reports).

See **[TRACKER_SETUP.md](./TRACKER_SETUP.md)** for tracker API, email, PDF, and cron setup.

## Prerequisites

- Node.js 20+
- pnpm (`corepack enable && corepack prepare pnpm@latest --activate`)
- Docker (optional, for local PostgreSQL)

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

- `JWT_SECRET` — generate with: `openssl rand -base64 32`
- `COOKIE_SECRET` — generate with: `openssl rand -base64 32`
- `DATABASE_URL` — match your PostgreSQL instance

### 3. Install and migrate

```bash
cd Vishal
pnpm install
pnpm --filter backend prisma:generate
pnpm --filter backend exec prisma migrate deploy
```

### 4. Run development

```bash
pnpm dev
```

- Backend: http://localhost:5000
- Frontend: http://localhost:5173

**Port conflict:** If port 5000 is already in use (e.g. another Docker service), set `PORT=5001` in `backend/.env` and `VITE_API_URL=http://localhost:5001` in `frontend/.env`.

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/register` | Register with email/password (sets cookie) |
| POST | `/api/auth/login` | Login (sets cookie) |
| GET | `/api/auth/me` | Current user (requires cookie) |
| POST | `/api/auth/logout` | Clear session cookie |

## Project structure

```
Vishal/
├── backend/          # Express + Prisma + JWT cookies + bcrypt
├── frontend/         # Vite + React + React Query + shadcn-style UI
├── docker-compose.yml
└── package.json      # pnpm workspace root
```

## Production notes

- Set `NODE_ENV=production`
- Use HTTPS; cookies use `secure: true` in production
- Set `CLIENT_URL` to your deployed Vite URL
- Run `prisma migrate deploy` in CI/CD

## Manual verification

```bash
# Health
curl http://localhost:5000/api/health

# Register
curl -c cookies.txt -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"pass12"}'

# Current user
curl -b cookies.txt http://localhost:5000/api/auth/me

# Logout
curl -X POST -b cookies.txt http://localhost:5000/api/auth/logout
```

## Tracker features

- Weekly dashboard (Mon–Sun) with add/edit/delete entries
- PDF export and email reports (with PDF attachment)
- Settings: currency, monthly budget, weekly email opt-in
- Cron: `GET /api/cron/weekly-email` (see TRACKER_SETUP.md)

Not included: OAuth (email/password auth only). Folders and nested pages are supported — see TRACKER_SETUP.md. AI uses **Cohere**.
