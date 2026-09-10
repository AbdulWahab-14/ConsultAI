import {
  identity,
  runtime,
  json,
  errorResponse,
  HttpError,
} from '@/server/runtime';
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await identity();
    const { id } = await params;
    const doc = await runtime()
      .DB.prepare('SELECT object_key FROM documents WHERE id=? AND owner=?')
      .bind(id, user.id)
      .first<{ object_key: string }>();
    if (!doc) throw new HttpError(404, 'Document not found.');
    const file = await runtime().DOCUMENTS.get(doc.object_key);
    if (!file) return json({ error: 'File unavailable.' }, 404);
    return new Response(file.body, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="consultai-document.txt"',
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
