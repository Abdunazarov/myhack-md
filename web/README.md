# Cradle LinkRouter Backend — Module 1: Smart Intake & Auto-Routing

API-only backend for the Cradle LinkRouter Smart Intake module. The UI is expected to live in a separate Lovable repo and consume this backend over HTTP.

## Quick Start

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Backend runs on `http://localhost:3000`.

## Environment

Copy `.env.example` to `.env` and set:

- `DATABASE_URL` — SQLite default: `file:./dev.db`
- `GEMINI_API_KEY` — Gemini API key; without it the backend uses deterministic fallback audit
- `GEMINI_MODEL` — defaults to `gemini-2.0-flash`
- `BACKEND_CORS_ORIGIN` — defaults to `*` for Lovable/local integration
- `ENABLE_DEMO_RESET` — enables `POST /api/admin/demo/reset` and `GET /api/auth/demo-users`
- `AUTH_SECRET` — JWT signing secret (min 16 chars)

Do not commit `.env`.

## Demo accounts (after `npm run db:seed`)

| Role | Email | Password |
|------|-------|----------|
| Founder | `founder@demo.com` | `demo123` |
| Admin | `admin@cradle.com` | `demo123` |
| Mentor | `mentor@cradle.com` | `demo123` |
| Investor | `investor@cradle.com` | `demo123` |

Send `Authorization: Bearer <token>` from `POST /api/auth/login` on protected routes.

## API Surface

- `GET /api/health`
- `POST /api/auth/login` · `GET /api/auth/me` · `GET /api/auth/demo-users`
- `GET /api/programmes` · `GET /api/programmes/:slug`
- `GET|POST /api/applications` · `GET|PATCH /api/applications/:id` · `POST /api/applications/:id/audit`
- `GET /api/admin/dashboard` · `GET /api/admin/intake` · `GET /api/admin/intake/:id` · `POST /api/admin/intake/:id/decision`
- `POST /api/admin/demo/reset`
- `GET /api/mentor/dashboard` · `GET /api/investor/dashboard`

`POST /api/applications` accepts JSON or `multipart/form-data` (`application` JSON + optional `pitchDeck` PDF).

## Test & Verify

```bash
npm run test
npm run build
```

## Google integration

Gemini API powers AI Pitch Audit (Feature 1.1).
