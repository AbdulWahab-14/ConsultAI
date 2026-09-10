-- Legacy vectors have unknown provenance: never compare them with new model vectors.
-- Reindex approved sources after this additive migration; transactional app data is unaffected.
ALTER TABLE document_chunks ADD COLUMN embedding_profile TEXT NOT NULL DEFAULT 'legacy:unknown';
