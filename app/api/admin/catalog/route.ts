import { z } from 'zod';
import {
  getCatalog,
  weightsSchema,
  sourceSchema,
  programSchema,
  knowledgeHealth,
} from '@/server/catalog';
import {
  requireAdmin,
  json,
  errorResponse,
  sameOrigin,
  body,
  runtime,
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
    return json({
      ...catalog,
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
    await runtime().DB.batch([
      runtime()
        .DB.prepare(
          'INSERT INTO settings (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value',
        )
        .bind(payload.key, JSON.stringify(payload.value)),
      runtime()
        .DB.prepare(
          'INSERT INTO admin_audit (id,actor,action,record_id,at) VALUES (?,?,?,?,?)',
        )
        .bind(
          crypto.randomUUID(),
          user.userId,
          'UPDATE_CATALOG',
          payload.key,
          now,
        ),
    ]);
    return json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
