import { neon } from '@neondatabase/serverless';
import type { Source } from '@/lib/catalog';
import { runtime } from '@/server/runtime';
import { getCatalog } from '@/server/catalog';
import { OpenAIProvider } from './provider';
export async function hybridRetrieve(
  query: string,
): Promise<{ sources: Source[]; mode: string }> {
  const catalog = await getCatalog();
  const country = /korea|kaist/i.test(query)
    ? 'South Korea'
    : /german/i.test(query)
      ? 'Germany'
      : /\buk\b|britain|sheffield/i.test(query)
        ? 'United Kingdom'
        : null;
  const topic = /visa|immigration/i.test(query)
    ? 'visa'
    : /scholarship|stipend/i.test(query)
      ? 'scholarship'
      : null;
  const tokens = query
    .toLowerCase()
    .split(/\W+/)
    .filter((s) => s.length > 2);
  const candidates = catalog.sources.filter(
    (s) =>
      s.status === 'VERIFIED' &&
      new Date(s.reviewDueAt) >= new Date() &&
      (!country || s.country === country) &&
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
  if (!config.DATABASE_URL || !config.OPENAI_API_KEY || !config.AI_MODEL)
    return {
      sources: lexical.slice(0, 4).map((x) => x.s),
      mode: 'structured + keyword',
    };
  const provider = new OpenAIProvider(
    config.OPENAI_API_KEY,
    config.AI_MODEL,
    config.EMBEDDING_MODEL,
  );
  const [vector] = await provider.embed([query]);
  if (vector.length !== 1536 || vector.some((n) => !Number.isFinite(n)))
    throw new Error('Invalid embedding');
  const sql = neon(config.DATABASE_URL);
  const rows =
    await sql`SELECT c.source_id, c.text, s."contentHash" AS source_hash FROM document_chunks c JOIN sources s ON s.id=c.source_id WHERE s."verificationStatus"='VERIFIED' AND s."reviewDueAt">NOW() AND c.source_id = ANY(${candidates.map((s) => s.id)}) AND embedding IS NOT NULL ORDER BY c.embedding <=> ${JSON.stringify(vector)}::vector LIMIT 6`;
  const hashes = new Map<string, string>();
  await Promise.all(
    candidates.map(async (s) => {
      const hash = Array.from(
        new Uint8Array(
          await crypto.subtle.digest(
            'SHA-256',
            new TextEncoder().encode(s.text),
          ),
        ),
        (b) => b.toString(16).padStart(2, '0'),
      ).join('');
      hashes.set(s.id, hash);
    }),
  );
  const safeRows = rows.filter(
    (r) => hashes.get(String(r.source_id)) === r.source_hash,
  );
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
    mode: 'structured + keyword + pgvector',
  };
}
