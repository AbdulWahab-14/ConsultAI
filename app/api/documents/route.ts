import { createAIProvider } from '@/ai/provider';
import { reviewDocument } from '@/ai/document-review';
import { z } from 'zod';
import {
  identity,
  json,
  errorResponse,
  sameOrigin,
  body,
  rateLimit,
  runtime,
  HttpError,
} from '@/server/runtime';
export async function GET() {
  try {
    const user = await identity();
    const result = await runtime()
      .DB.prepare(
        'SELECT id,review,created_at FROM documents WHERE owner=? ORDER BY created_at DESC LIMIT 30',
      )
      .bind(user.id)
      .all();
    return json(result.results);
  } catch (e) {
    return errorResponse(e);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const user = await identity();
    await rateLimit(user.id, 'document', 5);
    const { text } = z
      .object({ text: z.string().min(50).max(20000) })
      .parse(await body(request, 100000));
    const id = crypto.randomUUID();
    const key = `${user.id}/${id}.txt`;
    const words = text.split(/\s+/).length;
    const checks = [
      ['Motivation', /because|motiv|interest|inspir/i],
      ['Academic background', /stud|project|course|research/i],
      ['Program fit', /university|program|curriculum|faculty/i],
      ['Career direction', /career|goal|future|aim/i],
      ['Specific evidence', /\d|developed|built|led|created/i],
    ] as const;
    let review = `RULE-BASED WRITING CHECK · not an AI assessment\n\n${words} words. ${checks.filter(([, r]) => r.test(text)).length}/${checks.length} broad writing signals detected. These keyword signals do not measure authenticity or admission quality.\n\n${checks.map(([name, re]) => `${name}: ${re.test(text) ? 'A possible signal was found; check it is specific and supported.' : 'Add a concrete, truthful explanation if relevant.'}`).join('\n')}\n\nNext: connect your experience to a specific course or research area, explain what you learned, and remove generic claims. Never add achievements you cannot substantiate.`;
    const provider = createAIProvider(runtime());
    if (provider) review = await reviewDocument(text, provider);
    await runtime().DOCUMENTS.put(key, text, {
      httpMetadata: { contentType: 'text/plain' },
    });
    await runtime()
      .DB.prepare(
        'INSERT INTO documents (id,owner,object_key,review,created_at) VALUES (?,?,?,?,?)',
      )
      .bind(id, user.id, key, review, new Date().toISOString())
      .run();
    return json({ id, review });
  } catch (e) {
    return errorResponse(e);
  }
}
export async function DELETE(request: Request) {
  try {
    sameOrigin(request);
    const user = await identity();
    const { id } = z.object({ id: z.uuid() }).parse(await body(request, 1000));
    const doc = await runtime()
      .DB.prepare('SELECT object_key FROM documents WHERE id=? AND owner=?')
      .bind(id, user.id)
      .first<{ object_key: string }>();
    if (!doc) throw new HttpError(404, 'Document not found.');
    await runtime().DOCUMENTS.delete(doc.object_key);
    await runtime()
      .DB.prepare('DELETE FROM documents WHERE id=? AND owner=?')
      .bind(id, user.id)
      .run();
    return json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
