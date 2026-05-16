# Cradle LinkRouter

Full-stack app: Next.js API (`src/app/api`) + Vite React UI (`client/`).

## Quick Start

```bash
cd web
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

- **API:** http://localhost:3000/api/health  
- **UI:** http://localhost:5173 (proxies `/api` → backend)

Production (single port):

```bash
npm run build
npm start
```

Serves the built UI from `public/` on http://localhost:3000 with API routes unchanged.

## Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Founder | `founder@demo.com` | `demo123` |
| Admin | `admin@cradle.com` | `demo123` |
| Mentor | `mentor@cradle.com` | `demo123` |
| Investor | `investor@cradle.com` | `demo123` |

The UI auto-signs in as Founder on Apply and Admin on the dashboard.

## Project layout

```
web/
  client/          # Vite + React UI (Module 1 screens)
  src/app/api/     # Next.js API routes
  prisma/          # SQLite schema + seeds
  public/          # Vite build output (after npm run build:ui)
```

## Environment

Copy `.env.example` to `.env`. Set `BACKEND_CORS_ORIGIN=http://localhost:5173` for local UI dev.

## Test

```bash
npm run test
```
npm run test    # 78 tests — unit + full API integration (Modules 1 & 2)
npm run build
```

Test layout:
- `module1.integration.test.ts` — intake, audit, routing, admin pipeline
- `module2.integration.test.ts` — mentors, matching, linkages, cohort health
- `z-full-coverage.integration.test.ts` — remaining endpoints, auth matrix, edge cases (runs last; includes demo reset)
- `src/server/services/**/*.test.ts` — eligibility, benchmarks, routing, readiness, skill matrix, CSV parser

## Environment

See `.env.example` — `DATABASE_URL`, `GEMINI_API_KEY`, `AUTH_SECRET`, `BACKEND_CORS_ORIGIN`.
