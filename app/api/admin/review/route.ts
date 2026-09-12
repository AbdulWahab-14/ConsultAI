import { contentHash } from '@/lib/knowledge';
import { indexStatements, recordStatement } from '@/server/knowledge';
import { z } from 'zod';
import { sourceSchema } from '@/server/catalog';
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
      .DB.prepare(
        'SELECT url,status,content_hash FROM source_versions WHERE id=?',
      )
      .bind(id)
      .first<{ url: string; status: string; content_hash: string }>();
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
      const today = new Date().toISOString().slice(0, 10);
      if (source.reviewDueAt < today)
        throw new HttpError(400, 'Set a future source review deadline.');
      const reviewed = {
        ...source,
        status: 'VERIFIED' as const,
        verifiedAt: today,
        contentHash: await contentHash(source.text),
        captureHash: version.content_hash,
      };
      statements.push(
        recordStatement('sources', reviewed),
        ...(await indexStatements([reviewed])),
      );
    }
    await runtime().DB.batch(statements);
    return json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
