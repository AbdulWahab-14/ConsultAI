import { cosine, contentHash } from '@/lib/knowledge';
import type { Source } from '@/lib/catalog';
import { runtime } from '@/server/runtime';
import { getCatalog } from '@/server/catalog';
import { createEmbeddingProvider } from './embeddings';
export async function hybridRetrieve(
  query: string,
): Promise<{ sources: Source[]; mode: string }> {
  const catalog = await getCatalog();
  const countries = [
    [/korea|kaist|unist/i, 'South Korea'],
    [/german|saarland|hbrs/i, 'Germany'],
    [/\buk\b|united kingdom|britain|sheffield|southampton/i, 'United Kingdom'],
  ]
    .filter(([pattern]) => (pattern as RegExp).test(query))
    .map(([, country]) => country);
  const topic = /visa|immigration/i.test(query)
    ? 'visa'
    : /scholarship|funding|stipend/i.test(query)
      ? 'scholarship'
      : null;
  const tokens = query
    .toLowerCase()
    .split(/\W+/)
    .filter((s) => s.length > 2);
  const candidates = catalog.sources.filter(
    (s) =>
      s.status === 'VERIFIED' &&
      !!s.verifiedAt &&
      new Date(s.reviewDueAt + 'T23:59:59Z') >= new Date() &&
      (!countries.length || countries.includes(s.country)) &&
      (!topic || s.topic === topic),
  );
  const lexical = candidates
    .map((s) => ({
      s,
      score: tokens.reduce(
        (n, t) =>
          n + ((s.title + ' ' + s.text).toLowerCase().includes(t) ? 1 : 0),
        0,
      ),
    }))
    .sort((a, b) => b.score - a.score);
  const config = runtime();
  const lexicalResult = {
    sources: lexical.slice(0, 4).map((x) => x.s),
    mode: 'structured + keyword',
  };
  const provider = createEmbeddingProvider(config);
  if (!provider || !candidates.length) return lexicalResult;
  try {
    const [vector] = await provider.embed([query], 'RETRIEVAL_QUERY');
    const indexed = await config.DB.prepare(
      'SELECT source_id,source_hash,text,embedding FROM knowledge_chunks WHERE embedding_profile=?',
    )
      .bind(provider.profile)
      .all<{
        source_id: string;
        source_hash: string;
        text: string;
        embedding: string;
      }>();
    const hashes = new Map(
      await Promise.all(
        candidates.map(async (s) => [s.id, await contentHash(s.text)] as const),
      ),
    );
    const safeRows = indexed.results
      .filter(
        (r) =>
          hashes.get(r.source_id) === r.source_hash &&
          candidates.find((s) => s.id === r.source_id)?.text.includes(r.text),
      )
      .map((r) => ({ ...r, score: cosine(vector, JSON.parse(r.embedding)) }))
      .filter((r) => r.score > -1)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
    if (!safeRows.length) return lexicalResult;
    const ranked = new Map<string, number>();
    lexical.forEach((r, i) => ranked.set(r.s.id, 1 / (60 + i + 1)));
    safeRows.forEach((r, i) =>
      ranked.set(
        String(r.source_id),
        (ranked.get(String(r.source_id)) || 0) + 1 / (60 + i + 1),
      ),
    );
    return {
      sources: candidates
        .sort((a, b) => (ranked.get(b.id) || 0) - (ranked.get(a.id) || 0))
        .slice(0, 4)
        .map((s) => ({
          ...s,
          text:
            safeRows
              .filter((r) => r.source_id === s.id)
              .map((r) => String(r.text))
              .join('\n')
              .slice(0, 6000) || s.text,
        })),
      mode: `structured + keyword + embeddings (D1; ${provider.profile})`,
    };
  } catch {
    return lexicalResult;
  }
}
