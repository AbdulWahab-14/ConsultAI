# Deployment

The implemented hosting target is Sites / Cloudflare Workers with managed D1 and private R2. `.openai/hosting.json` binds `DB` and `DOCUMENTS`. A Site has been registered; publication is separate and should only be reported successful after terminal deployment verification.

Build with `npm run build`. The expected Worker artifact is `dist/server/index.js`, with a default fetch handler. Save source, generated D1 migrations and built assets together using the Sites packaging workflow. Sites applies packaged D1 migrations before Worker deployment.

## Runtime settings

| Variable              | Required for                                                          |
| --------------------- | --------------------------------------------------------------------- |
| `GEMINI_API_KEY`      | Gemini consultation, writing review and embeddings              |
| `AI_MODEL`            | Provider-specific structured-output model selection                         |
| `EMBEDDING_MODEL`     | Optional; default `gemini-embedding-001`, 1536 dimensions           |
| `ADMIN_EMAILS`        | Comma-separated administrator identity allowlist                      |
| `DATABASE_URL`        | Legacy external indexing script only; not used by active retrieval              |
| `DIRECT_URL`          | Reserved for an external migration connection; not consumed by Worker |
| `NEXT_PUBLIC_APP_URL` | Canonical application URL for future metadata/configuration           |
| `CATALOG_URL`         | Indexing script only; approved readable `/api/catalog` endpoint       |

No API key is required for the labeled guided demo. Do not put secrets in NEXT_PUBLIC variables. No Google OAuth or SMTP credentials are used: signup, login, recovery and logout belong to the Sites identity provider.

## Validation sequence

Typecheck, lint, unit tests, browser/API tests, production build, review SQL migrations, package, publish to the existing authorized audience, verify deployment status and test the resulting site. The additive D1 migration ships the reviewed Gemini embedding seed. No external PostgreSQL credentials are required.

## Vercel portability

This is not a ready-to-deploy Vercel build. Moving to native Next.js/Vercel requires replacing D1/R2 bindings and Sites identity, migrating user data, adapting the runtime helper and retesting authorization. Do not deploy it there with trusted-header authentication unchanged.

## Gemini configuration

Set `AI_PROVIDER=gemini` (the default), `GEMINI_API_KEY` as a secret, and `AI_MODEL` to a Gemini model supporting structured output. Set `EMBEDDING_PROVIDER=gemini` and `EMBEDDING_MODEL=gemini-embedding-001` for the active D1 embedding index. Both `.env` and hosted Sites variables require their own configuration. Redeploy after changing hosted settings.

To switch chat to the retained OpenAI adapter, set `AI_PROVIDER=openai`, `OPENAI_API_KEY` and an appropriate `AI_MODEL`. Embedding provider selection is independent and should remain unchanged unless you intend to reindex. Groq is a future adapter extension, not an active integration.

The active index uses D1 `knowledge_chunks`. The seeded vectors are Gemini 1536-dimensional document embeddings. Retrieval embeds each query with the query task type, filters by embedding profile, freshness and matching summary hash, and combines cosine rank with keyword rank. If embeddings are unavailable, generation may still use reviewed keyword evidence and reports that retrieval mode. Configured generation errors return an explicit 503 rather than a guided answer.

After changing embedding provider/model, use Admin > Reindex reviewed evidence. Source approvals index changed evidence atomically with publication. The retained Prisma scripts are not the active retrieval path.

Production runtime verified: `AI_PROVIDER=gemini`, `AI_MODEL=gemini-3.6-flash`, `EMBEDDING_PROVIDER=gemini`, `EMBEDDING_MODEL=gemini-embedding-001`; Gemini key is a server secret. The owner/admin is `mrkidz6667@gmail.com`. Share `/profile` for empty visitor onboarding.
