import { z } from 'zod';
import { contentHash } from '@/lib/knowledge';
import { recordStatement, indexStatements } from '@/server/knowledge';
import {
  getCatalog,
  weightsSchema,
  sourceSchema,
  programSchema,
  knowledgeHealth,
  scholarshipSchema,
  visaSchema,
} from '@/server/catalog';
import {
  requireAdmin,
  json,
  errorResponse,
  sameOrigin,
  body,
  runtime,
  HttpError,
} from '@/server/runtime';
export async function GET() {
  try {
    await requireAdmin();
    const catalog = await getCatalog();
    const reviews = await runtime()
      .DB.prepare(
        'SELECT id,url,status,created_at,substr(text,1,16000) AS text FROM source_versions ORDER BY created_at DESC LIMIT 30',
      )
      .all();
    const totals = await runtime()
      .DB.prepare('SELECT COUNT(*) AS count FROM workspaces')
      .first();
    const index = await runtime()
      .DB.prepare(
        'SELECT embedding_profile,COUNT(*) AS chunks,MAX(indexed_at) AS indexedAt FROM knowledge_chunks GROUP BY embedding_profile',
      )
      .all();
    return json({
      ...catalog,
      index: index.results,
      health: knowledgeHealth(catalog),
      reviews: reviews.results,
      users: totals,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
export async function PUT(request: Request) {
  try {
    sameOrigin(request);
    const user = await requireAdmin();
    const payload = z
      .discriminatedUnion('key', [
        z.object({ key: z.literal('weights'), value: weightsSchema }),
        z.object({
          key: z.literal('scholarships'),
          value: z.array(scholarshipSchema).max(200),
        }),
        z.object({
          key: z.literal('visas'),
          value: z.array(visaSchema).max(200),
        }),
        z.object({
          key: z.literal('sources'),
          value: z.array(sourceSchema).max(200),
        }),
        z.object({
          key: z.literal('programs'),
          value: z.array(programSchema).max(200),
        }),
      ])
      .parse(await body(request, 500000));
    const now = new Date().toISOString();
    const db = runtime().DB;
    const statements: D1PreparedStatement[] = [];
    if (payload.key === 'weights') {
      statements.push(
        db
          .prepare(
            'INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
          )
          .bind(payload.key, JSON.stringify(payload.value)),
      );
    } else {
      const catalog = await getCatalog();
      const records = payload.value;
      if (new Set(records.map((r) => r.id)).size !== records.length)
        throw new HttpError(400, 'Record IDs must be unique.');
      const next = { ...catalog, [payload.key]: records };
      for (const r of [...next.programs, ...next.scholarships, ...next.visas]) {
        if (
          r.sourceIds.some(
            (id) => !next.sources.some((source) => source.id === id),
          )
        )
          throw new HttpError(
            400,
            'Every linked source must exist. Remove dependent references before deleting a source.',
          );
      }
      for (const r of next.scholarships)
        if (r.programIds.some((id) => !next.programs.some((p) => p.id === id)))
          throw new HttpError(
            400,
            'Scholarship program references must exist.',
          );
      statements.push(
        db
          .prepare('DELETE FROM catalog_records WHERE kind=?')
          .bind(payload.key),
      );
      if (payload.key === 'sources') {
        const reviewed = await Promise.all(
          payload.value.map(async (r) => ({
            ...r,
            contentHash: await contentHash(r.text),
          })),
        );
        if (
          reviewed.some(
            (r) =>
              r.status === 'VERIFIED' &&
              (!r.verifiedAt ||
                r.reviewDueAt < new Date().toISOString().slice(0, 10)),
          )
        )
          throw new HttpError(
            400,
            'Verified sources need a verification date and a current review deadline.',
          );
        const changed = reviewed.filter((r) => {
          const old = catalog.sources.find((s) => s.id === r.id);
          return (
            !old ||
            old.contentHash !== r.contentHash ||
            old.status !== r.status ||
            old.reviewDueAt !== r.reviewDueAt
          );
        });
        statements.push(...(await indexStatements(changed)));
        statements.push(...reviewed.map((r) => recordStatement('sources', r)));
        for (const old of catalog.sources.filter(
          (s) => !reviewed.some((r) => r.id === s.id),
        ))
          statements.push(
            db
              .prepare('DELETE FROM knowledge_chunks WHERE source_id=?')
              .bind(old.id),
          );
      } else
        statements.push(...records.map((r) => recordStatement(payload.key, r)));
    }
    statements.push(
      db
        .prepare(
          'INSERT INTO admin_audit (id,actor,action,record_id,at) VALUES (?,?,?,?,?)',
        )
        .bind(
          crypto.randomUUID(),
          user.userId,
          'REVIEW_AND_PUBLISH_CATALOG',
          payload.key,
          now,
        ),
    );
    await db.batch(statements);
    return json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
