import type { Source } from '@/lib/catalog';
import { chunks, contentHash } from '@/lib/knowledge';
import { createEmbeddingProvider } from '@/ai/embeddings';
import { runtime, HttpError } from './runtime';

export async function indexStatements(sources: Source[]) {
  const env = runtime(),
    provider = createEmbeddingProvider(env);
  if (!provider)
    throw new HttpError(
      503,
      'Configure an embedding provider before publishing reviewed evidence.',
    );
  const statements: D1PreparedStatement[] = [];
  for (const source of sources) {
    statements.push(
      env.DB.prepare('DELETE FROM knowledge_chunks WHERE source_id=?').bind(
        source.id,
      ),
    );
    if (
      source.status !== 'VERIFIED' ||
      !source.verifiedAt ||
      new Date(source.reviewDueAt + 'T23:59:59Z') < new Date()
    )
      continue;
    const hash = await contentHash(source.text),
      pieces = chunks(source.text);
    const vectors = await provider.embed(pieces, 'RETRIEVAL_DOCUMENT');
    pieces.forEach((text, i) =>
      statements.push(
        env.DB.prepare(
          'INSERT INTO knowledge_chunks (id,source_id,source_hash,text,embedding_profile,embedding,indexed_at) VALUES (?,?,?,?,?,?,?)',
        ).bind(
          `${source.id}:${i}`,
          source.id,
          hash,
          text,
          provider.profile,
          JSON.stringify(vectors[i]),
          new Date().toISOString(),
        ),
      ),
    );
  }
  return statements;
}

export const catalogColumns =
  'key,kind,record_id,country,payload,ielts,ielts_component_min,academic,academic_requirement,tuition,tuition_currency,deadline,requirements,gpa,gpa_scale,minimum_credits,amount,currency,source_url,verified_at,review_due_at,status,content_hash';
export function recordStatement(kind: string, record: object) {
  const r = record as Record<string, unknown>;
  const values = [
    `${kind}:${String(r.id)}`,
    kind,
    r.id,
    r.country,
    JSON.stringify(r),
    r.ielts,
    r.ieltsComponentMin,
    r.academic,
    r.academicRequirement,
    r.officialTuitionAmount,
    r.tuitionCurrency,
    r.deadline,
    r.requirements,
    r.continuationGpa,
    r.gpaScale,
    r.minimumCredits,
    r.amount ?? r.fundsAmount,
    r.currency ?? r.fundsCurrency,
    r.url,
    r.verifiedAt,
    r.reviewDueAt,
    r.status,
    r.contentHash,
  ].map((v) => v ?? null);
  return runtime()
    .DB.prepare(
      `INSERT OR REPLACE INTO catalog_records (${catalogColumns}) VALUES (${values.map(() => '?').join(',')})`,
    )
    .bind(...values);
}
