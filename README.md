# ConsultAI

**Your verified AI consultant for studying abroad.**

[Open the live demo](https://consultai-study-strategy.mrkidz6667.chatgpt.site/profile) - new visitors create their own education profile.

[Production verification report](docs/HACKATHON_VERIFICATION.md)

An explainable study-planning application with a working guided demo, evidence drawers, university comparisons, a what-if simulator, persistent applications, private document reviews and an administrator knowledge center.

## Run locally

Requirements: Node 24+, npm, Chrome for browser tests.

```powershell
npm.cmd ci
Copy-Item .env.example .env
npx.cmd wrangler d1 execute DB --local --persist-to "$PWD/.wrangler/state" --file drizzle/0000_youthful_magik.sql --config .openai/local-wrangler.json
npx.cmd wrangler d1 execute DB --local --persist-to "$PWD/.wrangler/state" --file drizzle/0001_yielding_sentinel.sql --config .openai/local-wrangler.json
npm.cmd run dev
```

Open `http://localhost:3000/demo`. Do not reapply the initial migration to an initialized database. Generate additive migrations with `npm run db:generate` after schema changes.

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run test:browser
npm.cmd run build
```

The automated browser suite creates disposable demo data. The public demo requires no AI key. It labels its consultation answers as guided, rule-based answers. For live generative consultation and document review, configure `GEMINI_API_KEY` and `AI_MODEL` server-side.

## Product routes

| Route                                  | Purpose                                                          |
| -------------------------------------- | ---------------------------------------------------------------- |
| `/`                                    | Landing page                                                     |
| `/demo`                                | Blank profile setup for each new visitor          |
| `/dashboard`, `/profile`               | Command center and student profile                               |
| `/universities`, `/universities/kaist` | Explorer and explainable eligibility                             |
| `/countries`, `/scholarships`          | Country comparisons and scholarship leads                        |
| `/saved`, `/compare`                   | Saved shortlist and comparison                                   |
| `/simulator`                           | IELTS, grades, budget and degree scenarios                       |
| `/applications`, `/roadmap`, `/visa`   | Persistent application and preparation checklists                |
| `/consultant`, `/documents`            | Remembered consultations and private writing reviews             |
| `/report`                              | Printable strategy and saved profile snapshots                   |
| `/account`, `/login`, `/signup`        | Platform-managed sign-in/account entry                           |
| `/admin`                               | Authorized knowledge operations; public read-only source preview |
| `/pitch`                               | Product story and architecture                                   |

## Implemented architecture

React 19, TypeScript, Vinext's Next-compatible App Router, Tailwind, Shadcn/Base UI, Lucide, Zod, Cloudflare Workers, D1/Drizzle and private R2 storage. Sites owns production identity and infrastructure. The active RAG index is stored in D1: reviewed, overlapping evidence chunks, Gemini document/query embeddings, content hashes, cosine ranking and keyword rank fusion. Structured SQL fields retain admission, fee, scholarship and visa facts independently of vectors.

The deployed transactional store is D1, not PostgreSQL. This is a material difference from the initial preferred stack and enables a credential-free hosted demo. No external PostgreSQL service is needed. The earlier Prisma schema and indexing script are retained as a migration option; the active application uses D1 retrieval.

## Evidence and limitations

The reviewed demo catalog contains **six institutions**, **14 source records**, **four scholarship leads** and **three visa overviews**. Thirteen reviewed summaries are embedded; current KAIST application policy remains under review. Official URLs, verification dates, review deadlines and SHA-256 summary hashes accompany the evidence. New official pages were reviewed on 12 September 2026. Unknown admission equivalences and current-call deadlines remain unknown; PKR costs remain scenario estimates, separate from published currency-denominated tuition.

With Gemini configured, consultant and document requests use live structured generation. Provider failure returns an explicit retryable error, never a silent rule-based answer. Prepared introduction and safety responses remain intentionally deterministic; guided advice is available when no provider is configured.

Admins can review/publish universities and programs, scholarship requirements, visa records and sources. Refreshing an official URL creates a deduplicated captured version. Approval publishes the human-reviewed summary and updates its embedding index atomically; rejection never changes the published facts. Captured-page and summary hashes are distinguished. Full-page capture currently accepts HTML/plain text, up to 1 MB, from approved official hosts; PDF source ingestion is outside this demo workflow.

This is a demonstrable product foundation, not a claim that the complete commercial SaaS brief is finished. See [implementation status](docs/IMPLEMENTATION_STATUS.md) for remaining features and external dependencies. Do not represent rule-based answers as live LLM responses, or keyword retrieval as active pgvector when credentials are absent.

See [architecture](docs/ARCHITECTURE.md), [security](docs/SECURITY.md), [deployment](docs/DEPLOYMENT.md), and [demo script](docs/HACKATHON_DEMO.md).

New visitors start with an empty profile form on `/profile`, `/demo` or any personalized route. They must save their own education, goals and budget before analysis or consultation. Browser sessions and signed-in identities have separate workspaces. The Taha example remains only a test fixture; it is never automatically used as a new visitor profile. Legacy unedited sample sessions reopen setup; customized saved profiles are preserved.
