# Implementation status

## Working product surfaces

Landing, editable demo/profile, dashboard, deterministic university/country matching, gates, explanations, source drawer, search/country filter, saved shortlist, comparison, scholarship leads, what-if scenarios, applications/tasks, preparation checklist/roadmap, printable strategy/profile snapshots, saved consultation, private text document review/download/deletion, account entry, protected admin catalog/weights, source ingestion/change detection/review/audit and pitch.

## External configuration needed

- Live AI: `OPENAI_API_KEY` and `AI_MODEL`. Provider and document-review code exist, but cannot be confirmed live without credentials.
- Administrator: sign in through the host and configure `ADMIN_EMAILS`.
- Semantic retrieval: a PostgreSQL/pgvector database, schema migration, embeddings key and index run. The default demo does not use a vector database.

## Material differences from the complete brief

- Vinext/Workers/D1/R2/Sites identity instead of native Next.js/Vercel/PostgreSQL/Auth.js for transactional data.
- Only three initial program records and seven sources; no comprehensive scholarship or visa requirements database.
- Costs are illustrative estimates and future-intake deadlines remain unverified.
- No streaming, automatic profile extraction, full consultation summaries or automatic AI source-field extraction.
- Text-only document ingestion; no PDF/Word parser or malware scanning.
- Source-level provenance rather than a normalized fact table for every requirement.
- Scholarship leads, not a complete nationality/age/degree eligibility engine.
- General preparation checklist and user task statuses, not source-backed personalized visa checklists for every destination.
- Search/country filters only; large explorer pagination and additional filter dimensions remain.
- Profile report snapshots, not immutable report content with catalog-version locking; no public share links.
- Platform account recovery; no application-managed passwords, Google login or Auth.js tables.
- No B2B tenant model, payment plans, email notifications or application submission automation.
- No independent penetration test, production load test, retention/backup operations or real-student evaluation.

These gaps must remain visible in any handoff. Passing the included tests does not mean every item in the original 96-section commercial brief is complete.
