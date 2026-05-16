# Cradle LinkRouter Backend — Modules 1 & 2

API-only backend for Cradle LinkRouter: Smart Intake, Auto-Routing, and Dynamic Cohort Orchestration.

## Quick Start

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Backend runs on `http://localhost:3000`.

## Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Founder | `founder@demo.com` | `demo123` |
| Admin | `admin@cradle.com` | `demo123` |
| Mentor | `mentor@cradle.com` | `demo123` |
| Investor | `investor@cradle.com` | `demo123` |

Use `Authorization: Bearer <token>` from `POST /api/auth/login`.

## Module 1 — Smart Intake

- `POST /api/applications` — JSON or multipart (`application`, `pitchDeck` PDF, `financialModel` CSV)
- `PATCH /api/applications/:id?reaudit=true`
- `POST /api/applications/:id/audit`
- Admin intake + `POST /api/admin/intake/:id/decision` (enrolls project `In_Program` on confirm)

## Module 2 — Cohort Orchestration

- `GET /api/matching/mentors` — 5 mentors with AI-derived skill matrices (2024 cohort)
- `POST /api/founder/roadblock` — startup problem → explainable mentor match → `LinkageEntity`
- `GET /api/mentor/dashboard` — assigned startups, intervention queue
- `GET /api/admin/cohort-health` — health scores, stale linkages, intervention alerts
- `POST /api/linkages/:id/feedback` — updates health score; may trigger `Requires_Intervention`
- `POST /api/admin/mentors/rebuild-skills` — recompute matrices from historical outcomes

## Module 3 — Preview

- `GET /api/investor/dashboard` — graduated startups with verified passports

## Test & Verify

```bash
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
