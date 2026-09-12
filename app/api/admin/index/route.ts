import {
  requireAdmin,
  sameOrigin,
  rateLimit,
  runtime,
  json,
  errorResponse,
} from '@/server/runtime';
import { getCatalog } from '@/server/catalog';
import { indexStatements } from '@/server/knowledge';
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const user = await requireAdmin();
    await rateLimit(user.userId, 'reindex', 1);
    const catalog = await getCatalog();
    const statements = await indexStatements(catalog.sources);
    statements.push(
      runtime()
        .DB.prepare(
          'INSERT INTO admin_audit (id,actor,action,record_id,at) VALUES (?,?,?,?,?)',
        )
        .bind(
          crypto.randomUUID(),
          user.userId,
          'REINDEX',
          'sources',
          new Date().toISOString(),
        ),
    );
    await runtime().DB.batch(statements);
    return json({
      message:
        'Reviewed evidence indexed with the configured embedding provider.',
    });
  } catch (error) {
    return errorResponse(error);
  }
}
