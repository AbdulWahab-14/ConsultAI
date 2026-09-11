# ConsultAI

**Your verified AI consultant for studying abroad.**

An explainable study-planning application with a working guided demo, evidence drawers, university comparisons, a what-if simulator, persistent applications, private document reviews and an administrator knowledge center.

## Run locally

Requirements: Node 24+, npm, Chrome for browser tests.

```powershell
npm.cmd ci
Copy-Item .env.example .env
npx.cmd wrangler d1 execute DB --local --persist-to "$PWD/.wrangler/state" --file drizzle/0000_youthful_magik.sql --config .openai/local-wrangler.json
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

React 19, TypeScript, Vinext's Next-compatible App Router, Tailwind, Shadcn/Base UI, Lucide, Zod, Cloudflare Workers, D1/Drizzle and private R2 storage. Sites owns production identity and infrastructure. PostgreSQL/pgvector retrieval has a Prisma schema/migration, a Neon HTTP query adapter, and a deduplicating knowledge-index script.

The deployed transactional store is D1, not PostgreSQL. This is a material difference from the initial preferred stack and enables a credential-free hosted demo. PostgreSQL is an optional external retrieval index; no PostgreSQL connection has been provisioned by this project.

## Evidence and limitations

The initial catalog contains **three real institutions** and **seven source records**. Six specific source summaries were reviewed against official pages on 9 September 2026; current KAIST application policy remains under review. University PKR costs are deliberately labeled scenario estimates. No admission probabilities, current deadlines, exchange rates or scholarship awards are invented.

This is a demonstrable product foundation, not a claim that the complete commercial SaaS brief is finished. See [implementation status](docs/IMPLEMENTATION_STATUS.md) for remaining features and external dependencies. Do not represent rule-based answers as live LLM responses, or keyword retrieval as active pgvector when credentials are absent.

See [architecture](docs/ARCHITECTURE.md), [security](docs/SECURITY.md), [deployment](docs/DEPLOYMENT.md), and [demo script](docs/HACKATHON_DEMO.md).

New visitors start with an empty profile form on `/profile`, `/demo` or any personalized route. They must save their own education, goals and budget before analysis or consultation. Browser sessions and signed-in identities have separate workspaces. The Taha example remains only a test fixture; it is never automatically used as a new visitor profile. Legacy unedited sample sessions reopen setup; customized saved profiles are preserved.
