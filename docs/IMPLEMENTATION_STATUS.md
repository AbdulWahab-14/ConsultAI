# Implementation status

## Working product surfaces

Landing, editable demo/profile, dashboard, deterministic university/country matching, gates, explanations, source drawer, search/country filter, saved shortlist, comparison, scholarship leads, what-if scenarios, applications/tasks, preparation checklist/roadmap, printable strategy/profile snapshots, saved consultation, private text document review/download/deletion, account entry, protected admin catalog/weights, source ingestion/change detection/review/audit and pitch.

## Hackathon production configuration

Gemini live generation and document review are configured. The existing D1 database stores reviewed Gemini embeddings with hash/profile/freshness validation; no new PostgreSQL account is required. The owner confirmed the admin page opens in their signed-in session. See [hackathon verification](HACKATHON_VERIFICATION.md) for current scope and checks.

## Material differences from the complete brief

- Vinext/Workers/D1/R2/Sites identity instead of native Next.js/Vercel/PostgreSQL/Auth.js for transactional data.
- Six program records, 14 sources, four scholarship leads and three visa overviews; deliberately a small catalog.
- Costs are illustrative estimates and future-intake deadlines remain unverified.
- No streaming, automatic profile extraction, full consultation summaries or automatic AI source-field extraction.
- Text-only document ingestion; no PDF/Word parser or malware scanning.
- SQL fields store core admission, tuition, scholarship and visa facts; not every nuance is represented as a separate normalized requirement.
- Scholarship leads, not a complete nationality/age/degree eligibility engine.
- Official visa overviews are shown for selected destinations alongside the general preparation checklist; complete embassy-specific checklists are not claimed.
- Search/country filters only; large explorer pagination and additional filter dimensions remain.
- Profile report snapshots, not immutable report content with catalog-version locking; no public share links.
- Platform account recovery; no application-managed passwords, Google login or Auth.js tables.
- No B2B tenant model, payment plans, email notifications or application submission automation.
- No independent penetration test, production load test, retention/backup operations or real-student evaluation.

These gaps must remain visible in any handoff. Passing the included tests does not mean every item in the original 96-section commercial brief is complete.
