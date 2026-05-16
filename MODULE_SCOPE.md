# LinkRouter — Module Scope

## Current MVP Focus: Modules 1 & 2 (Backend Complete)

**Status:** API-only backend in `web/` — Module 1 + Module 2 MVP implemented  
**UI:** Built separately in Lovable  
**Module 3:** Investor preview API only (graduated passports from seed)

### Module 1 — Smart Intake & Auto-Routing ✅
- **Feature 1.1:** AI Pitch Audit — pitch text, PDF deck, financial CSV, benchmarks, readiness score
- **Feature 1.2:** Ecosystem Routing — auto-route to programmes; admin confirm enrolls project `In_Program`
- Auth (Founder, Admin, Mentor, Investor), applications CRUD, admin intake pipeline

### Module 2 — Dynamic Cohort Orchestration ✅
- **Feature 2.1:** Outcome-Based Mentor Entity — `MentorNode` + `HistoricalOutcome` → `dynamicSkillMatrix`
- **Feature 2.2:** Autonomous Matching — `POST /api/founder/roadblock` → explainable mentor match + `LinkageEntity`
- **Feature 2.3:** Cohort Health Dashboard — `GET /api/admin/cohort-health` (intervention queue, alerts)

### Module 3 — Verified Handoff (PREVIEW)
- Graduated startups + passport JSON in seed
- `GET /api/investor/dashboard` — read-only portfolio

### Integration Path
`Ecosystem_Project` from Module 1 intake → enrolled `In_Program` → founder roadblock → Module 2 linkage → cohort health monitoring.
