# Cradle LinkRouter — Frontend UX Specification (Module 1)

**Purpose:** This document describes the UX, pages, user flows, and business logic for the Lovable frontend. It is aligned with the existing API-only backend in `web/`. Do not implement color palettes or visual design here — focus on structure, content, interactions, and API wiring.

**Product:** Cradle LinkRouter — Smart Intake & Auto-Routing  
**Module in scope:** Module 1 only (grant intake, AI pitch audit, ecosystem routing)  
**Language:** English (all copy, labels, errors)  

---

## 1. Product Summary

Cradle LinkRouter replaces manual startup screening with an intelligent intake engine. A founder submits a structured application; the system:

1. Creates a reusable **Ecosystem Project** entity (not a one-off form).
2. Runs an **AI Pitch Audit** comparing the startup to historical successful alumni benchmarks.
3. Applies **deterministic eligibility rules** for the Cradle Grant (hard constraints are never decided by AI alone).
4. Computes a **Readiness Score** with a transparent breakdown.
5. **Auto-routes** the startup to the best-fit programme if the grant is not suitable — without asking them to re-enter data.

**Core message for judges/users:** Rejected grant applications are not dead ends; they become routed ecosystem participants with explainable reasoning.

**Modules NOT built in backend (show as “Coming soon” cards only, no fake functionality):**

- Module 2: Dynamic Cohort Orchestration (mentor matching)
- Module 3: Verified Handoff (VC passport)

---

## 2. User Roles & Authentication

The backend uses **JWT Bearer tokens** (7-day expiry). After login, store `token` and `user` in `localStorage` and send `Authorization: Bearer <token>` on all protected API calls.

| Role | Email (demo) | Password | Primary goal | Landing route |
|------|----------------|----------|----------------|---------------|
| **Founder** | `founder@demo.com` | `demo123` | Submit application, view own results, edit & re-audit | `/apply` |
| **Admin** | `admin@cradle.com` | `demo123` | Review pipeline, validate AI/routing, override decisions | `/admin` |
| **Mentor** | `mentor@cradle.com` | `demo123` | Preview Module 2 cohort / mentorship dashboard | `/mentor` |
| **Investor** | `investor@cradle.com` | `demo123` | Preview Module 3 graduated startups & verified passports | `/investor` |

**Public (no auth):** Landing, Programmes catalog, Programme detail, `GET /api/health`, `GET /api/programmes*`.

**Login page:** `GET /api/auth/demo-users` returns one-click demo credentials (when `ENABLE_DEMO_RESET` is true). Show four role cards; on select → `POST /api/auth/login` → redirect by role.

**Session handling:**
- On app load, call `GET /api/auth/me` with stored token; if 401, clear storage and redirect to `/login`.
- Logout: clear `token` / `user` / `lastApplicationId` → `/login`.
- Founder `founderEmail` on submit must match logged-in founder email.

---

## 3. Information Architecture (Sitemap)

```
/login                     → Demo login (4 roles)
/                          → Landing (product overview + CTAs)
/apply                     → Founder: multi-step application form (auth required)
/apply/result/:id          → Founder: AI audit report + routing outcome (auth required)
/apply/edit/:id            → Founder: edit application + optional re-audit (auth required)
/programmes                → Public: list ecosystem programmes
/programmes/:slug          → Public: programme detail + rules (read-only)
/admin                     → Admin: dashboard metrics (auth required)
/admin/intake              → Admin: applications pipeline table
/admin/intake/:id          → Admin: full application review + decision actions
/mentor                    → Mentor: Module 2 preview dashboard (auth required)
/investor                  → Investor: Module 3 preview portfolio (auth required)
```

**Global navigation (role-aware, after login):**

- Logo / product name: **Cradle LinkRouter**
- **Founder:** `Apply` | `My applications` | `My result` (last `applicationId` from localStorage)
- **Admin:** `Dashboard` | `Intake` | `Reset demo` (if allowed)
- **Mentor:** `Mentor hub` (single page for MVP)
- **Investor:** `Portfolio` (single page for MVP)
- **All roles:** `Programmes` | `Logout`
- Footer line: `Powered by Gemini · Module 1: Smart Intake`

---

## 4. Page Specifications

### 4.1 Landing Page (`/`)

**Goal:** Explain the product in 10 seconds and drive founders to apply while showing admins where to review.

**Sections:**

1. **Hero**
   - Headline: intelligent intake for Malaysia’s innovation ecosystem
   - Subhead: AI pitch audit + benchmark comparison + automatic programme routing
   - Primary CTA: `Submit application` → `/apply`
   - Secondary CTA: `Sign in` → `/login` (demo accounts for all four roles)

2. **How it works (3 steps)**
   - Step 1: Founder submits structured startup profile
   - Step 2: System runs AI Pitch Audit vs 2024 alumni benchmarks
   - Step 3: Startup is scored, checked against grant rules, and routed to the right programme

3. **Feature cards (Module 1)**
   - **AI Pitch Audit:** extracts risks, strengths, missing data; compares metrics to cohort benchmarks
   - **Ecosystem Routing:** if grant hard constraints fail, profile moves to Pre-Accelerator, Mentor Readiness, Financial Repair, or VC Readiness

4. **Future modules (disabled / “Coming soon”)**
   - Module 2: Mentor matching from historical outcomes
   - Module 3: Cradle Verified Passport for investors

**No API call required** (optional: `GET /api/health` in footer to show “Backend connected”).

---

### 4.2 Apply — Application Form (`/apply`)

**Goal:** Collect all data required for audit and routing in a guided, low-friction flow.

**Layout:** Multi-step wizard with progress indicator (6 steps). Show step names; allow Back/Next; validate per step before advancing.

**Auth:** Redirect unauthenticated users to `/login`. Pre-fill `founderEmail` from logged-in user (read-only).

**On final submit:**
- **Option A (JSON):** `POST /api/applications` with `Content-Type: application/json` and full body (see Section 6).
- **Option B (PDF pitch deck):** `POST /api/applications` as `multipart/form-data`:
  - field `application` — stringified JSON of the form body
  - field `pitchDeck` — PDF file (max 5 MB); backend extracts text and merges with `pitchText` for the audit
- Header: `Authorization: Bearer <token>`
- Show loading state: “Running AI Pitch Audit…” (backend runs audit synchronously on create)
- On success: redirect to `/apply/result/{applicationId}`
- On validation error: show field-level messages from API `details`
- On 401/403: redirect to login or show permission message

#### Step 1 — Founder
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| founderName | text | yes | min 2 chars |
| founderEmail | email | yes | |

#### Step 2 — Company
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| companyName | text | yes | |
| country | text | yes | default `Malaysia` |
| sector | select | yes | options: SaaS, Fintech, Healthtech, Cleantech, Edtech (+ Other free text if desired) |
| stage | select | yes | Idea, MVP, Revenue, Growth |
| incorporated | checkbox | yes | |
| companyAgeMonths | number | yes | ≥ 0 |

#### Step 3 — Product & Market
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| problem | textarea | yes | min 20 chars |
| solution | textarea | yes | min 20 chars |
| targetCustomers | textarea | yes | min 10 chars |

#### Step 4 — Traction
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| tractionSummary | textarea | yes | min 10 chars — pilots, customers, LOIs, etc. |

#### Step 5 — Financials
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| mrr | number (RM) | yes | ≥ 0 |
| activeUsers | number | yes | ≥ 0 |
| pilots | number | yes | ≥ 0 |
| revenueGrowthPct | number (%) | yes | 0–1000 |
| cac | number (RM) | yes | ≥ 0 |
| burnMonthly | number (RM) | yes | ≥ 0 |
| runwayMonths | number | yes | ≥ 0 |
| grossMarginPct | number (%) | yes | 0–100 |
| fundingAsk | number (RM) | yes | grant limit context: RM 500,000 |
| useOfFunds | textarea | yes | min 20 chars |

#### Step 6 — Pitch (optional) + Review
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| pitchText | textarea | no | short pitch summary |
| pitchDeck | file (PDF) | no | max 5 MB; optional; extracted text feeds AI audit |

**Review step:** Read-only summary of all fields + `Submit and run audit` button.

**Business rules to surface in UI (helper text, not blocking unless backend rejects):**
- Grant requires Malaysia, incorporated, stage MVP+, funding ask ≤ RM 500k, runway ≥ 3 months
- Idea-stage or unincorporated startups will likely be routed to Pre-Accelerator

---

### 4.3 Application Result — Founder Report (`/apply/result/:id`)

**Goal:** Give the founder a clear, actionable outcome even when they are not grant-eligible.

**API:** `GET /api/applications/:id`  
Response shape: `{ application, audit, routing }`

**If `audit` is null:** Show “Audit pending” + button `Run audit` → `POST /api/applications/:id/audit` then refresh.

#### Section A — Header
- Company name (from `application.ecosystemProject.name`)
- Application status badge: `Submitted` | `Auditing` | `Eligible` | `Rejected` | `Routed` | `Needs_Review`
- Submitted date

#### Section B — Readiness Score (hero metric)
- Large score: `audit.readinessScore` / 100
- Sub-scores (bars or list) from `audit.scoreBreakdown`:
  - Eligibility Fit (30%)
  - Traction Strength (25%)
  - Financial Health (20%)
  - Market / Sector Fit (15%)
  - Data Completeness (10%)

#### Section C — Founder-facing narrative
- Title: **Your audit summary**
- Body: `audit.founderReport` (friendly prose)
- If `audit.aiFallback === true`: small note “AI summary generated using rule-based engine (Gemini unavailable)”

#### Section D — Recommended route (most important for demo)
- Programme name: `routing.recommendedProgramme.name` or `application.targetProgramme.name`
- Decision type label:
  - `Grant_Eligible` → “Recommended for Cradle Grant review”
  - `Auto_Routed` → “Routed to alternative programme”
  - `Needs_Review` → “Borderline — admin review required”
  - `Rejected` → “Not eligible at this time”
- Explanation: `routing.explanation`
- Reassurance copy when not grant-eligible: “Your profile has been preserved in the ecosystem — you do not need to re-apply.”

#### Section E — Benchmark comparison
- List `audit.benchmarkDeltas` as cards:
  - Metric name (format: `cac` → “CAC”, `runway_months` → “Runway”)
  - Your value vs median (p25–p75 range)
  - Status: below / within / above (use icon or label, not only color)
  - Message: `delta.message` (e.g. “CAC is 50% above the successful alumni median”)

#### Section F — Strengths
- Bullet list: `audit.strengths`

#### Section G — Risk flags
- List `audit.riskFlags` grouped by severity: high, medium, low
- Show `message` and optional `field` reference

#### Section H — Missing information
- List `audit.missingInformation` if non-empty
- CTA: **Update application** → `/apply/edit/:id` (uses `PATCH /api/applications/:id?reaudit=true`)
- Show `application.pitchDeckFileName` if a PDF was uploaded

#### Section I — Grant eligibility (transparency)
- Filter `audit.eligibilityResults` for `programmeSlug === "cradle-grant"`
- Show `hardPass` yes/no
- Checklist of rules with pass/fail and `message`

**Actions:**
- `Apply again` → `/apply`
- `View programmes` → `/programmes`
- Store `applicationId` in localStorage as `lastApplicationId` for quick access

---

### 4.4 Programmes Catalog (`/programmes`)

**Goal:** Show the ecosystem ladder — grant at top, alternative tracks below.

**API:** `GET /api/programmes`

**Layout:** Grid or list of programme cards.

**Each card shows:**
- Programme name
- Type: Grant | Pre-Accelerator | Mentorship | VC Readiness | Sandbox
- Short description
- Number of eligibility rules (from `rules.length`)
- Link: `View details` → `/programmes/:slug`

**Expected programmes (from seed):**
1. Cradle Grant Track
2. MYStartup Pre-Accelerator
3. Mentor Readiness Track
4. Financial Model Repair Track
5. VC Readiness Track

---

### 4.5 Programme Detail (`/programmes/:slug`)

**Goal:** Explain who each track is for and what rules apply.

**API:** `GET /api/programmes/:slug`

**Content:**
- Name, type, description
- **Eligibility rules table:**
  - ruleKey
  - ruleType (Hard / Soft)
  - failureReason (shown as requirement description)
- Note: “Rules are evaluated automatically when you submit an application.”

---

### 4.6 Login (`/login`)

**Goal:** One screen to demo all four ecosystem personas for judges.

**APIs:**
- `GET /api/auth/demo-users` → `{ users: [{ role, email, password, name, landingPath }] }`
- `POST /api/auth/login` → `{ token, user: { id, email, name, role } }`

**Layout:**
1. Product title + one-line value prop
2. Four **demo role cards** (Founder, Admin, Mentor, Investor) — each shows email; password is always `demo123` (display on screen for hackathon)
3. On card click: login with that email → store token → redirect to `landingPath`
4. Optional manual email/password form for the same accounts

**Post-login redirect map:**
| role | path |
|------|------|
| Founder | `/apply` |
| Admin | `/admin` |
| Mentor | `/mentor` |
| Investor | `/investor` |

---

### 4.7 Edit Application (`/apply/edit/:id`)

**Goal:** Let founders fix missing data without creating a duplicate application.

**API:** `PATCH /api/applications/:id?reaudit=true`  
Same body as create (partial fields allowed). Supports JSON or `multipart/form-data` (same shape as create).

**UX:** Reuse apply wizard with fields pre-filled from `GET /api/applications/:id`. On save: “Re-running audit…” then redirect to result page.

---

### 4.8 Admin Dashboard (`/admin`)

**Goal:** Operational overview for Cradle staff — throughput and health of intake.

**API:** `GET /api/admin/dashboard`

**Display:**

1. **Summary cards**
   - Total applications (`totals.applications`)
   - Total ecosystem projects (`totals.ecosystemProjects`)
   - Average readiness score (`totals.averageReadinessScore`, 1 decimal)

2. **Applications by status**
   - Chart or table from `applicationsByStatus[]`: status + count

3. **Latest applications table** (from `latestApplications`)
   - Columns: Company | Sector | Stage | Status | Readiness | Recommended programme | Submitted | Action
   - Readiness: from latest `intakeAudits[0].readinessScore` if present
   - Programme: from latest `routingDecisions[0].recommendedProgramme.name` or `targetProgramme.name`
   - Row click → `/admin/intake/:id`

4. **Demo utilities (optional, for hackathon)**
   - Button `Reset demo data` → `POST /api/admin/demo/reset` (confirm dialog)
   - Only show if backend allows (may 403 in production)

---

### 4.9 Admin Intake Pipeline (`/admin/intake`)

**Goal:** Full list of applications for triage — the admin’s main work queue.

**API:** `GET /api/admin/intake`

**Layout:** Sortable/filterable table (client-side filter is fine for MVP).

**Columns:**
| Column | Source |
|--------|--------|
| Company | ecosystemProject.name |
| Founder | ecosystemProject.founderName |
| Sector / Stage | ecosystemProject |
| Status | application.status |
| Readiness | intakeAudits[0].readinessScore |
| Grant hard pass | eligibility from audit (cradle-grant hardPass) |
| Routing | routingDecisions[0].decisionType |
| Programme | recommended programme name |
| Submitted | application.submittedAt |
| Action | View |

**Filters (UI only):**
- Status: All | Eligible | Routed | Needs_Review | Rejected
- Decision type: Grant_Eligible | Auto_Routed | Needs_Review

**Row action:** Open `/admin/intake/:id`

---

### 4.10 Admin Application Review (`/admin/intake/:id`)

**Goal:** Human-in-the-loop review with full transparency — admin sees exactly why the system recommended a route.

**APIs:**
- `GET /api/admin/intake/:id` → `{ application, programmes }`
- `POST /api/admin/intake/:id/decision` for admin actions

**Layout:** Two-column on desktop (stack on mobile): left = application data, right = audit + actions.

#### Left column — Application profile
- All normalized fields from `application.normalizedApplication` (parse JSON)
- Raw submitted snapshot expandable
- Ecosystem project metadata: state, sector, stage, country, founder email

#### Right column — System intelligence

1. **Readiness score + breakdown** (same as founder view but admin-oriented)

2. **AI admin summary**
   - `audit.aiSummary`
   - Model: `audit.modelUsed` or “fallback”

3. **Routing decision card**
   - `routing.decisionType`
   - `routing.explanation`
   - `routing.reasonCodes` as tags
   - Recommended programme name
   - `adminConfirmed` flag if already confirmed

4. **Grant eligibility checklist**
   - cradle-grant rules with pass/fail icons
   - hardPass summary

5. **Benchmark deltas** (table)

6. **Risk flags** (severity grouped)

7. **Missing information**

#### Admin decision panel (sticky footer or card)

**Programme selector:** dropdown of all `programmes` from API (for override).

**Admin note:** optional textarea.

**Actions (map to API `decision` enum):**

| Button | `decision` value | Effect |
|--------|------------------|--------|
| Approve for grant review | `approve_grant` | status → Eligible |
| Confirm recommended route | `confirm_route` | status → Routed, confirms routing |
| Request more info | `request_info` | status → Needs_Review |
| Reject | `reject` | status → Rejected |

On success: toast + refresh page or redirect to pipeline.

**Business rule copy for admin:** “AI recommends; admin confirms. Final accountability stays with Cradle.”

---

### 4.11 Mentor Hub (`/mentor`) — Module 2 preview

**Goal:** Show judges the future mentor-matching surface without faking live matching logic.

**API:** `GET /api/mentor/dashboard` (Mentor or Admin role)

**Banner (always visible):** “Module 2: Dynamic Cohort Orchestration — preview. Full mentor matching ships after Module 1.”

**Sections:**
1. **Stats row** — `stats.assignedStartups`, `stats.pendingLinkages`, `stats.completedSessions`
2. **Assigned startups** — table from `assignedStartups` (company, sector, stage, founder)
3. **Mentor-track pipeline** — from `pipeline` (company, readiness, suggested action)
4. **Upcoming sessions** — from `upcomingSessions` (startup, topic, date)

---

### 4.12 Investor Portfolio (`/investor`) — Module 3 preview

**Goal:** Show verified Cradle graduates as investor-ready “passports.”

**API:** `GET /api/investor/dashboard` (Investor or Admin role)

**Banner:** “Module 3: Verified Handoff — preview. Live investor workflows ship after Module 2.”

**Sections:**
1. **Stats** — `stats.graduatedStartups`, `stats.verifiedPassports`
2. **Portfolio cards** — each `portfolio[]` item:
   - Company name, sector, stage, founder
   - **Verified passport** — render key fields from `verifiedPassport` JSON (highlights, investorSummary, programmesCompleted, readinessAtGraduation)
   - Badge: “Cradle Verified” when `cradleVerified === true`

---

## 5. Key User Flows

### Flow 1 — Founder happy path (grant-eligible)
```
Landing → Apply (6 steps) → Submit
  → POST /api/applications (creates project + audit + routing)
  → Result page shows high readiness, Grant_Eligible, grant rules all pass
```

### Flow 2 — Founder routed path (demo-critical)
```
Landing → Apply with strong product but Idea stage OR high funding ask OR low runway
  → Result shows Auto_Routed to Pre-Accelerator or Financial Repair
  → Founder report explains why + what to improve
  → Grant checklist shows which hard rules failed
```

### Flow 3 — Admin review path
```
Admin Dashboard → see latest application
  → Intake pipeline → open application
  → Review AI summary + benchmarks + routing
  → Confirm route OR approve grant OR request info
  → POST decision → status updates
```

### Flow 4 — Mentor preview (Module 2 storytelling)
```
Login as mentor@cradle.com → /mentor
  → Show assigned startups (In_Program) + mentor-track pipeline + upcoming sessions
  → Banner: “Module 2 preview — full matching coming soon”
```

### Flow 5 — Investor preview (Module 3 storytelling)
```
Login as investor@cradle.com → /investor
  → Show graduated startups with verified passport JSON
  → Banner: “Module 3 preview — live VC handoff coming soon”
```

### Flow 6 — Judge demo script (5–7 minutes)
1. **Login** — show four demo roles; sign in as **Admin** → PayFlow MY in intake
2. **Logout** → sign in as **Founder** → open GreenRoute result (Idea → Pre-Accelerator routing)
3. **Apply** — submit live or upload PDF pitch deck
4. **Result** — benchmark delta + routing explanation
5. **Admin** — confirm route on borderline application
6. **Mentor** + **Investor** — 30s each on preview dashboards (ecosystem story arc)

---

## 6. API Integration Reference

### Base configuration
```text
VITE_API_URL=http://localhost:3000
```

**Authenticated requests:** `Authorization: Bearer <token>`  
**JSON requests:** `Content-Type: application/json`  
**Multipart (PDF):** `Content-Type: multipart/form-data` — do not set JSON content-type manually when using FormData.  
CORS is enabled on backend (`BACKEND_CORS_ORIGIN`).

### Endpoints used by frontend

| Method | Path | Auth | Used on page |
|--------|------|------|----------------|
| GET | `/api/health` | no | optional status indicator |
| GET | `/api/auth/demo-users` | no | Login (demo cards) |
| POST | `/api/auth/login` | no | Login |
| GET | `/api/auth/me` | yes | session bootstrap |
| GET | `/api/programmes` | no | Programmes catalog |
| GET | `/api/programmes/:slug` | no | Programme detail |
| GET | `/api/applications` | yes | Founder “my apps” list |
| POST | `/api/applications` | Founder, Admin | Apply submit |
| GET | `/api/applications/:id` | yes | Result page |
| PATCH | `/api/applications/:id` | Founder, Admin | Edit application |
| POST | `/api/applications/:id/audit` | Founder, Admin | Re-run audit |
| GET | `/api/admin/dashboard` | Admin | Admin dashboard |
| GET | `/api/admin/intake` | Admin | Intake pipeline |
| GET | `/api/admin/intake/:id` | Admin | Admin review |
| POST | `/api/admin/intake/:id/decision` | Admin | Admin actions |
| POST | `/api/admin/demo/reset` | Admin | Demo reset |
| GET | `/api/mentor/dashboard` | Mentor, Admin | Mentor hub |
| GET | `/api/investor/dashboard` | Investor, Admin | Investor portfolio |

### POST `/api/auth/login` — request body
```json
{ "email": "founder@demo.com", "password": "demo123" }
```
**Response:** `{ "token": "jwt...", "user": { "id", "email", "name", "role" } }`  
`role` is one of: `Founder` | `Admin` | `Mentor` | `Investor`.

### POST `/api/applications` — request body (JSON)
Must match backend schema exactly:

```json
{
  "founderName": "string",
  "founderEmail": "string",
  "companyName": "string",
  "country": "string",
  "sector": "string",
  "stage": "Idea | MVP | Revenue | Growth",
  "incorporated": true,
  "companyAgeMonths": 0,
  "problem": "string",
  "solution": "string",
  "targetCustomers": "string",
  "tractionSummary": "string",
  "mrr": 0,
  "activeUsers": 0,
  "pilots": 0,
  "revenueGrowthPct": 0,
  "cac": 0,
  "burnMonthly": 0,
  "runwayMonths": 0,
  "grossMarginPct": 0,
  "fundingAsk": 0,
  "useOfFunds": "string",
  "pitchText": "optional string"
}
```

**Response (success):**
```json
{
  "applicationId": "cuid",
  "audit": { /* AuditPayload — see types below */ },
  "application": { /* full application with relations */ }
}
```

### POST `/api/applications` — multipart (optional PDF)
```
FormData:
  application = JSON.stringify({ ...same fields as above... })
  pitchDeck   = File (application/pdf, max 5MB)
```

### PATCH `/api/applications/:id?reaudit=true`
Partial update — send only changed fields (same schema, all fields optional).  
Set `reaudit=true` to re-run AI audit after save. Supports JSON or multipart (same as POST).

### GET `/api/mentor/dashboard` — response highlights
```json
{
  "module": "dynamic-cohort-orchestration",
  "status": "preview",
  "assignedStartups": [],
  "pipeline": [],
  "upcomingSessions": []
}
```

### GET `/api/investor/dashboard` — response highlights
```json
{
  "module": "verified-handoff",
  "status": "preview",
  "portfolio": [
    { "name": "NovaAnalytics", "verifiedPassport": { "cradleVerified": true, ... } }
  ]
}
```

### POST `/api/admin/intake/:id/decision` — request body
```json
{
  "decision": "approve_grant | confirm_route | reject | request_info",
  "programmeId": "optional programme cuid",
  "adminNote": "optional string"
}
```

### Application status values
`Submitted` | `Auditing` | `Audited` | `Eligible` | `Rejected` | `Routed` | `Needs_Review`

### Routing decision types
`Grant_Eligible` | `Auto_Routed` | `Needs_Review` | `Rejected`

---

## 7. Business Logic (What the UI Must Communicate)

### 7.1 AI Pitch Audit (Feature 1.1)
- AI analyzes structured application + optional pitch text.
- AI compares metrics to **2024 alumni benchmarks** for same sector + stage.
- AI outputs: strengths, risk flags, missing fields, admin summary, founder report.
- **AI does NOT alone approve or reject grants.**

### 7.2 Eligibility engine (deterministic)
Hard rules for Cradle Grant (examples):
- Country = Malaysia
- Incorporated = true
- Stage in MVP, Revenue, Growth
- Funding ask ≤ RM 500,000
- Runway ≥ 3 months
- Sector not in excluded list (Gambling, Adult)

UI must show pass/fail per rule — this is critical for judge trust.

### 7.3 Readiness score
Weighted composite (display all components):
- 30% Eligibility Fit
- 25% Traction Strength
- 20% Financial Health
- 15% Market / Sector Fit
- 10% Data Completeness

Grant eligibility for routing additionally requires readiness ≥ 65 when hard rules pass.

### 7.4 Ecosystem routing (Feature 1.2)
Routing priority (simplified for UI copy):

| Condition | Typical route |
|-----------|----------------|
| Grant hard pass + readiness ≥ 65 | Cradle Grant Track |
| Idea stage or not incorporated | MYStartup Pre-Accelerator |
| Runway < 3 months OR missing key financials | Financial Model Repair |
| Growth + MRR > 50k | VC Readiness |
| Readiness 50–64 | Mentor Readiness (Needs_Review) |
| Other grant failures | Pre-Accelerator (default) |

**Key UX principle:** When routed away from grant, emphasize profile preservation and next steps — not rejection.

### 7.5 Ecosystem Project entity
Each application creates/links an `Ecosystem_Project` with state `Lead`. UI can mention: “This creates your ecosystem passport entry for future programmes.”

---

## 8. UX States & Edge Cases

| State | UX behavior |
|-------|-------------|
| Loading submit | Full-page or inline spinner; disable form; “Running AI Pitch Audit…” |
| Validation error (400) | Show API field errors |
| Network error | Retry button |
| Audit missing on result | Show “Run audit” CTA |
| aiFallback true | Informational banner, not error |
| Empty benchmark deltas | “Insufficient benchmark data for this sector/stage” |
| Demo reset 403 | Hide reset button or show “Not available in production” |
| 401 Unauthorized | Clear token, redirect `/login` |
| 403 Forbidden | Show “You don’t have access” (e.g. founder email mismatch) |

**localStorage suggestions:**
- `authToken` — JWT from login
- `authUser` — `{ id, email, name, role }`
- `lastApplicationId` — for “View my last result”

---

## 9. Content & Messaging Guidelines

**Tone:** Professional, supportive, transparent. Avoid harsh “rejected” language when auto-routed.

**Preferred phrases:**
- “Routed to [Programme]” instead of “Rejected”
- “Above alumni median” / “Below alumni median” for benchmarks
- “Hard constraint not met” for rule failures
- “Admin review recommended” for Needs_Review

**Explainability:** Always show *why* — rule messages, benchmark messages, routing explanation. This is a core judging criterion.

---

## 10. Out of Scope for Lovable Frontend (MVP)

Do not build unless backend adds APIs later:

- Excel financial model upload
- Real-time notifications / websockets
- Full Module 2 mentor matching workflows (backend provides **preview** dashboard only)
- Full Module 3 live VC deal room (backend provides **preview** portfolio only)
- Email notifications
- Multi-tenant organization management
- OpenAPI / Swagger UI

---

## 11. Suggested Component Map (for Lovable)

| Component | Used on |
|-----------|---------|
| `AppShell` / layout with nav | all pages |
| `LoginRoleCards` | /login |
| `AuthGuard` | protected routes |
| `MentorDashboard` | /mentor |
| `InvestorPortfolio` | /investor |
| `ApplicationStepper` | /apply |
| `ReadinessScoreCard` | result, admin review |
| `ScoreBreakdownBars` | result, admin review |
| `BenchmarkComparisonList` | result, admin review |
| `RiskFlagList` | result, admin review |
| `EligibilityChecklist` | result, admin review |
| `RoutingDecisionCard` | result, admin review |
| `ApplicationStatusBadge` | tables, headers |
| `IntakePipelineTable` | /admin/intake |
| `AdminDecisionPanel` | /admin/intake/:id |
| `ProgrammeCard` | /programmes |

---

## 12. Demo Data Hint

After `npm run db:seed` on backend:

| Account | What to show |
|---------|----------------|
| `admin@cradle.com` | PayFlow MY (grant candidate), HealthSync, GreenRoute in intake pipeline |
| `founder@demo.com` | GreenRoute application (Idea → likely Pre-Accelerator); submit new apps as this user |
| `mentor@cradle.com` | PayFlow MY as In_Program assigned startup |
| `investor@cradle.com` | NovaAnalytics & FarmLink graduated passports |

**Seeded applications (all pre-audited):**
- **PayFlow MY** — Fintech, Revenue, In_Program (admin + mentor demo)
- **GreenRoute** — Cleantech, Idea, founder@demo.com (founder routing demo)
- **HealthSync** — Healthtech, MVP (admin pipeline variety)

---

## 13. Success Criteria for Frontend

The Lovable frontend is complete when:

1. Login works for all four demo roles with correct post-login navigation.
2. A founder can submit (JSON or PDF pitch deck) and land on a rich result page.
3. A founder can edit an application and re-audit via PATCH.
4. The result page shows readiness score, benchmarks, risks, and routing explanation.
5. An admin can see pipeline + open any application with full audit transparency.
6. An admin can confirm route / approve grant / request info / reject via API.
7. Mentor and investor preview pages load real API data with “Module 2/3 preview” banners.
8. Programmes catalog explains the ecosystem ladder.
9. All copy is English and all data comes from real API responses (no hardcoded fake audit results).
