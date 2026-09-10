# Retrieval architecture

Structured requirements and fit calculations stay structured. The default evidence path uses reviewed catalog records, country/topic filters, freshness gates and bounded keyword ranking. It must be described as `structured + keyword`, not semantic retrieval.

When `DATABASE_URL` and the selected embedding provider key are set, `ai/hybrid.ts` adds a pgvector cosine search and reciprocal-rank fusion. The embedding dimension is 1536. Retrieved vectors are restricted to currently reviewed candidate source IDs and unexpired PostgreSQL records. A content hash must match the current reviewed catalog summary before vector text is admitted, preventing stale index content from replacing current evidence.

## Provision the external index

1. Create a PostgreSQL database supporting pgvector (Neon or Supabase).
2. Set the database URL securely in `.env` and the hosted runtime. Do not paste credentials into Git or public URLs.
3. Apply all migrations in `prisma/migrations` in order using Prisma migrate deploy with a migration-capable connection.
4. Set `GEMINI_API_KEY`, `EMBEDDING_PROVIDER=gemini`, `EMBEDDING_MODEL` and a readable `CATALOG_URL` ending in `/api/catalog`.
5. Run `npm run db:index`.

`scripts/index-knowledge.mjs` indexes only reviewed, unexpired sources, chunks with overlap, deduplicates on content hash, validates embeddings and uses a transaction per source. Index again after a human-approved source change. The initial catalog summaries are short; full prospectus/PDF extraction, background queue processing and retrieval evaluation on a large corpus are not finished.

A Korean D-2 visa question must not fall back to an unrelated scholarship page. With no verified Korean visa source, the correct response is that official evidence is missing. Unit and API tests cover this case.

The pgvector path and migrations are supplied but cannot be integration-tested until a PostgreSQL connection and AI key are configured.

Online retrieval and indexing share `ai/embeddings.ts`. Every chunk records `embedding_profile` (provider, model and dimensions); queries select only the identical profile. Old unknown vectors are excluded. Changing the embedding provider or model requires reindexing even if the dimensions match. Index deduplication checks both content hash and embedding profile. Gemini defaults to `gemini-embedding-001` with 1536 dimensions, using RETRIEVAL_QUERY online and RETRIEVAL_DOCUMENT when indexing. An unavailable vector backend falls back to the reviewed keyword path.
