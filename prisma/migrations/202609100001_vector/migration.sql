CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE sources (id TEXT PRIMARY KEY, url TEXT NOT NULL UNIQUE, country TEXT NOT NULL, topic TEXT NOT NULL, authority TEXT NOT NULL, "verificationStatus" TEXT NOT NULL DEFAULT 'NEEDS_REVIEW', "retrievedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(), "verifiedAt" TIMESTAMPTZ, "effectiveDate" TIMESTAMPTZ, "reviewDueAt" TIMESTAMPTZ, "contentHash" TEXT NOT NULL, confidence DOUBLE PRECISION NOT NULL DEFAULT 0);
CREATE TABLE source_documents (id TEXT PRIMARY KEY, source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE, text TEXT NOT NULL, content_hash TEXT NOT NULL UNIQUE);
CREATE TABLE document_chunks (id TEXT PRIMARY KEY, document_id TEXT NOT NULL REFERENCES source_documents(id) ON DELETE CASCADE, source_id TEXT NOT NULL REFERENCES sources(id) ON DELETE CASCADE, text TEXT NOT NULL, ordinal INTEGER NOT NULL, embedding vector(1536), UNIQUE(document_id,ordinal));
CREATE INDEX document_chunks_source_id_idx ON document_chunks(source_id);
CREATE INDEX document_chunks_embedding_idx ON document_chunks USING hnsw (embedding vector_cosine_ops);
