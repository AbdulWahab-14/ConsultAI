import { z } from 'zod';
import { sourceSchema, getCatalog } from '@/server/catalog';
import {
  requireAdmin,
  json,
  errorResponse,
  sameOrigin,
  body,
  runtime,
  HttpError,
} from '@/server/runtime';
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const user = await requireAdmin();
    const { id, action, source } = z
      .object({
        id: z.uuid(),
        action: z.enum(['APPROVE', 'REJECT', 'NEEDS_REVIEW']),
        source: sourceSchema.optional(),
      })
      .parse(await body(request, 20000));
    const version = await runtime()
      .DB.prepare('SELECT url,status FROM source_versions WHERE id=?')
      .bind(id)
      .first<{ url: string; status: string }>();
    if (!version) throw new HttpError(404, 'Source version not found.');
    if (action === 'APPROVE' && (!source || source.url !== version.url))
      throw new HttpError(
        400,
        'Reviewed summary must reference the captured source URL.',
      );
    const statements = [
      runtime()
        .DB.prepare(
          'UPDATE source_versions SET status=?,reviewed_by=? WHERE id=?',
        )
        .bind(action === 'APPROVE' ? 'VERIFIED' : action, user.userId, id),
      runtime()
        .DB.prepare(
          'INSERT INTO admin_audit (id,actor,action,record_id,at) VALUES (?,?,?,?,?)',
        )
        .bind(
          crypto.randomUUID(),
          user.userId,
          action,
          id,
          new Date().toISOString(),
        ),
    ];
    if (action === 'APPROVE' && source) {
      const catalog = await getCatalog();
      const reviewed = {
        ...source,
        status: 'VERIFIED' as const,
        verifiedAt: new Date().toISOString().slice(0, 10),
      };
      const next = [
        ...catalog.sources.filter((s) => s.id !== source.id),
        reviewed,
      ];
      statements.push(
        runtime()
          .DB.prepare(
            'INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
          )
          .bind('sources', JSON.stringify(next)),
      );
    }
    await runtime().DB.batch(statements);
    return json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
