import { z } from 'zod';
import { sources } from '@/lib/catalog';
import {
  requireAdmin,
  json,
  errorResponse,
  sameOrigin,
  body,
  rateLimit,
  runtime,
  HttpError,
} from '@/server/runtime';
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const user = await requireAdmin();
    await rateLimit(user.userId, 'ingest', 5);
    const { url } = z
      .object({ url: z.url().max(2000) })
      .parse(await body(request, 4000));
    const parsed = new URL(url);
    const allowed = new Set(sources.map((s) => new URL(s.url).hostname));
    if (
      parsed.protocol !== 'https:' ||
      parsed.username ||
      parsed.password ||
      parsed.port ||
      !allowed.has(parsed.hostname)
    )
      throw new HttpError(
        400,
        'Choose an HTTPS URL on an existing official catalog domain.',
      );
    const response = await fetch(url, {
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
      headers: { Accept: 'text/html,text/plain' },
    });
    if (!response.ok)
      throw new HttpError(502, 'The official source could not be retrieved.');
    if (!/text\/(html|plain)/i.test(response.headers.get('content-type') || ''))
      throw new HttpError(
        400,
        'Only text or HTML sources are currently supported.',
      );
    const reader = response.body!.getReader();
    let text = '';
    let bytes = 0;
    const decoder = new TextDecoder();
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.length;
      if (bytes > 1000000) {
        await reader.cancel();
        throw new HttpError(413, 'Source exceeds the 1 MB limit.');
      }
      text += decoder.decode(part.value, { stream: true });
    }
    text += decoder.decode();
    text = text
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const hash = Array.from(
      new Uint8Array(
        await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)),
      ),
      (b) => b.toString(16).padStart(2, '0'),
    ).join('');
    const old = await runtime()
      .DB.prepare(
        'SELECT content_hash FROM source_versions WHERE url=? ORDER BY created_at DESC LIMIT 1',
      )
      .bind(url)
      .first<{ content_hash: string }>();
    if (old?.content_hash === hash)
      return json({
        message: 'Source unchanged. No duplicate version created.',
      });
    const id = crypto.randomUUID(),
      at = new Date().toISOString();
    await runtime().DB.batch([
      runtime()
        .DB.prepare(
          'INSERT INTO source_versions (id,url,content_hash,text,status,created_at) VALUES (?,?,?,?,?,?)',
        )
        .bind(id, url, hash, text, old ? 'SOURCE_CHANGED' : 'NEEDS_REVIEW', at),
      runtime()
        .DB.prepare(
          'INSERT INTO admin_audit (id,actor,action,record_id,at) VALUES (?,?,?,?,?)',
        )
        .bind(crypto.randomUUID(), user.userId, 'INGEST', id, at),
    ]);
    return json({
      message:
        'Source captured for human review. Critical facts were not published.',
      id,
    });
  } catch (e) {
    return errorResponse(e);
  }
}
