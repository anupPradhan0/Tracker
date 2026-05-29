# Weekly Tracker Dashboard — Setup & API

This document covers the tracker features ported from the Anup reference project into the Vishal stack (Express + Prisma + PostgreSQL + React).

**Auth is unchanged** — all tracker routes use the existing `authMiddleware` and cookie JWT.

---

## Updated folder structure

```
Vishal/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma              # TrackerPage, TrackerDay, TrackerEntry, TrackerSettings
│   │   └── migrations/20250529140000_tracker/
│   └── src/
│       ├── controllers/
│       │   ├── trackerController.ts
│       │   ├── exportController.ts
│       │   ├── emailController.ts
│       │   └── cronController.ts
│       ├── services/
│       │   ├── trackerService.ts
│       │   ├── pdfService.ts
│       │   ├── emailService.ts
│       │   └── weeklyReportService.ts
│       ├── routes/
│       │   ├── trackerRoutes.ts
│       │   └── cronRoutes.ts
│       ├── validators/tracker.validator.ts
│       ├── types/tracker.ts
│       └── utils/tracker.ts
└── frontend/
    └── src/
        ├── pages/DashboardPage.tsx
        ├── components/tracker/
        │   ├── DayCard.tsx
        │   ├── EntryDialog.tsx
        │   └── SettingsPanel.tsx
        ├── hooks/useTracker.ts
        ├── services/trackerService.ts
        ├── lib/trackerUtils.ts
        └── types/tracker.ts
```

---

## Changed / new files

### Backend (new)
- `prisma/schema.prisma` — tracker models
- `prisma/migrations/20250529140000_tracker/`
- `src/controllers/trackerController.ts`, `exportController.ts`, `emailController.ts`, `cronController.ts`
- `src/services/trackerService.ts`, `pdfService.ts`, `emailService.ts`, `weeklyReportService.ts`
- `src/routes/trackerRoutes.ts`, `cronRoutes.ts`
- `src/validators/tracker.validator.ts`, `src/types/tracker.ts`, `src/utils/tracker.ts`
- `src/config/env.ts` — MAIL_* and CRON_SECRET
- `src/routes/index.ts` — mounts `/tracker` and `/cron`
- `.env.example` — email/cron vars

### Frontend (new / updated)
- `src/pages/DashboardPage.tsx` (replaces placeholder in routes)
- `src/components/tracker/*`, `src/components/ui/dialog.tsx`, `textarea.tsx`
- `src/hooks/useTracker.ts`, `src/services/trackerService.ts`, `src/lib/trackerUtils.ts`, `src/types/tracker.ts`
- `src/routes/AppRoutes.tsx`

### Unchanged
- All auth routes, controllers, services, and frontend auth pages

---

## Setup instructions

### 1. Database

```bash
cd Vishal
docker compose up -d
cd backend
pnpm prisma migrate deploy
```

### 2. Environment

Copy and fill `backend/.env` (see `.env.example`):

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection |
| `JWT_SECRET`, `COOKIE_SECRET` | Yes | Auth (existing) |
| `CLIENT_URL` | Yes | CORS origin |
| `MAIL_HOST`, `MAIL_USER`, `MAIL_PASSWORD` | For email | SMTP |
| `MAIL_PORT` | No | Default `587` |
| `CRON_SECRET` | Recommended | Protects cron endpoint |

### 3. Run

```bash
cd Vishal
pnpm dev
```

Open `http://localhost:5173`, register/login, go to **Dashboard**.

---

## API documentation

Base URL: `http://localhost:5000/api`  
All `/tracker/*` routes require auth cookie (`auth_token`).

### Settings

| Method | Path | Body | Response `data` |
|--------|------|------|-----------------|
| GET | `/tracker/settings` | — | `{ currency, monthlyBudget, weeklyReportsEnabled }` |
| PATCH | `/tracker/settings` | partial settings | same |

### Pages

| Method | Path | Description |
|--------|------|-------------|
| GET | `/tracker/pages` | List all pages |
| GET | `/tracker/pages/default` | Get or create first page (7 empty days) |
| GET | `/tracker/pages/:id` | Get page by id |
| POST | `/tracker/pages` | `{ title?, icon? }` |
| PATCH | `/tracker/pages/:id` | `{ title?, icon? }` |
| DELETE | `/tracker/pages/:id` | Delete page |

### Entries (`dayIndex` = 1–7, Mon–Sun)

| Method | Path | Body |
|--------|------|------|
| POST | `/tracker/pages/:id/days/:dayIndex/entries` | `{ title, amount, description?, category?, tags?[] }` |
| PATCH | `/tracker/pages/:id/days/:dayIndex/entries/:entryId` | partial entry |
| DELETE | `/tracker/pages/:id/days/:dayIndex/entries/:entryId` | — |

All entry mutations return the full updated `TrackerPage` in `data`.

### Export & email

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/tracker/export/pdf` | `{ pageId }` | PDF binary |
| GET | `/tracker/email/status` | — | `{ configured: boolean }` |
| POST | `/tracker/email/send` | `{ pageId? }` | `{ sent, to }` |

### Cron (no auth cookie — use Bearer secret)

| Method | Path | Headers |
|--------|------|---------|
| GET | `/cron/weekly-email` | `Authorization: Bearer <CRON_SECRET>` |

Sends reports to users with `weeklyReportsEnabled: true` (latest page, PDF attached).

Example crontab (Sunday 23:59):

```bash
59 23 * * 0 curl -s -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:5000/api/cron/weekly-email
```

---

## Email setup

1. Use an SMTP provider (Gmail App Password, SendGrid, Mailgun, etc.).
2. Set in `backend/.env`:

```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your@gmail.com
MAIL_PASSWORD=your-app-password
```

3. In the dashboard **Settings** (gear), enable **Weekly email reports**.
4. Use **Email report** on the dashboard for a manual send (includes PDF attachment).
5. Schedule `/api/cron/weekly-email` for automated weekly sends.

---

## PDF setup

- Uses **jsPDF** on the server (no extra system dependencies).
- **Export PDF** button downloads the weekly layout: title, totals, each day with entries.
- Email reports attach the same PDF.

---

## Feature summary

| Feature | Status |
|---------|--------|
| Weekly dashboard (7 days) | ✅ |
| Add / edit / delete entries | ✅ |
| Page total & per-day totals | ✅ |
| Dynamic entry counts | ✅ |
| PDF export | ✅ |
| Email with PDF attachment | ✅ (when MAIL_* configured) |
| Weekly cron emails | ✅ |
| Settings (currency, budget, email opt-in) | ✅ |
| Toast notifications (Sonner) | ✅ |
| Loading & validation | ✅ |
| Responsive grid UI (indigo theme) | ✅ |
| Auth | Unchanged |

---

## Bug fixes / improvements vs reference

- Standardized **dayIndex 1–7** (Mon–Sun) in API and UI labels.
- Relational PostgreSQL schema instead of MongoDB embedded documents.
- Weekly budget = `monthlyBudget / 4` (simplified vs Anup’s fixed-expenses model).
- Email includes **PDF attachment** (Anup reference did not attach PDFs).
- Route ordering: `/pages/default` registered before `/pages/:id`.
