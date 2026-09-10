# Deployment

The implemented hosting target is Sites / Cloudflare Workers with managed D1 and private R2. `.openai/hosting.json` binds `DB` and `DOCUMENTS`. A Site has been registered; publication is separate and should only be reported successful after terminal deployment verification.

Build with `npm run build`. The expected Worker artifact is `dist/server/index.js`, with a default fetch handler. Save source, generated D1 migrations and built assets together using the Sites packaging workflow. Sites applies packaged D1 migrations before Worker deployment.

## Runtime settings

| Variable              | Required for                                                          |
| --------------------- | --------------------------------------------------------------------- |
| `OPENAI_API_KEY`      | Live generative consultation, writing review, embeddings              |
| `AI_MODEL`            | Explicit Responses-compatible model selection                         |
| `EMBEDDING_MODEL`     | Optional; default `text-embedding-3-small`, 1536 dimensions           |
| `ADMIN_EMAILS`        | Comma-separated administrator identity allowlist                      |
| `DATABASE_URL`        | Optional Neon-compatible PostgreSQL HTTP retrieval index              |
| `DIRECT_URL`          | Reserved for an external migration connection; not consumed by Worker |
| `NEXT_PUBLIC_APP_URL` | Canonical application URL for future metadata/configuration           |
| `CATALOG_URL`         | Indexing script only; approved readable `/api/catalog` endpoint       |

No API key is required for the labeled guided demo. Do not put secrets in NEXT_PUBLIC variables. No Google OAuth or SMTP credentials are used: signup, login, recovery and logout belong to the Sites identity provider.

## Validation sequence

Typecheck, lint, unit tests, browser/API tests, production build, review SQL migrations, package, publish privately, verify deployment status and test the resulting site. PostgreSQL schema can be validated without connecting; applying migrations and testing embeddings requires real external credentials.

## Vercel portability

This is not a ready-to-deploy Vercel build. Moving to native Next.js/Vercel requires replacing D1/R2 bindings and Sites identity, migrating user data, adapting the runtime helper and retesting authorization. Do not deploy it there with trusted-header authentication unchanged.
