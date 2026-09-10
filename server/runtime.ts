import { env } from 'cloudflare:workers';
import { cookies } from 'next/headers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { demoProfile } from '@/lib/matching';
import type { State } from '@/components/workspace';
type Runtime = {
  DB: D1Database;
  DOCUMENTS: R2Bucket;
  OPENAI_API_KEY?: string;
  AI_MODEL?: string;
  EMBEDDING_MODEL?: string;
  ADMIN_EMAILS?: string;
  DATABASE_URL?: string;
};
export const runtime = () => env as unknown as Runtime;
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function identity(create = false) {
  const user = await getChatGPTUser();
  if (user)
    return {
      id: 'user:' + user.userId,
      account: user.displayName,
      email: user.email,
    };
  const jar = await cookies();
  let id = jar.get('consultai_demo')?.value;
  if (id && !/^[a-f0-9]{64}$/.test(id)) id = undefined;
  if (!id && create) {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    id = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    jar.set('consultai_demo', id, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  if (!id) throw new HttpError(401, 'Open the demo or sign in to continue.');
  return { id: 'demo:' + id, account: 'Private demo workspace', email: null };
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin || origin !== new URL(request.url).origin)
    throw new HttpError(403, 'Request origin is not allowed.');
}
export async function body(request: Request, max = 150000) {
  if (Number(request.headers.get('content-length') || 0) > max)
    throw new HttpError(413, 'Request is too large.');
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'A request body is required.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > max) {
      await reader.cancel();
      throw new HttpError(413, 'Request is too large.');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let off = 0;
  for (const c of chunks) {
    bytes.set(c, off);
    off += c.length;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new HttpError(400, 'Invalid JSON.');
  }
}
export async function loadState(id: string): Promise<State> {
  const row = await runtime()
    .DB.prepare('SELECT state FROM workspaces WHERE id = ?')
    .bind(id)
    .first<{ state: string }>();
  return row
    ? JSON.parse(row.state)
    : {
        profile: demoProfile,
        saved: [],
        compare: [],
        applications: [],
        checks: [],
        messages: [],
        reports: [],
      };
}
export async function saveState(id: string, state: State) {
  await runtime()
    .DB.prepare(
      'INSERT INTO workspaces (id,state,updated_at) VALUES (?,?,?) ON CONFLICT(id) DO UPDATE SET state=excluded.state, updated_at=excluded.updated_at',
    )
    .bind(id, JSON.stringify(state), new Date().toISOString())
    .run();
}
export async function rateLimit(owner: string, action: string, max = 20) {
  const bucket = Math.floor(Date.now() / 60000);
  const id = `${owner}:${action}:${bucket}`;
  const row = await runtime()
    .DB.prepare(
      'INSERT INTO rate_limits (id,count,expires) VALUES (?,1,?) ON CONFLICT(id) DO UPDATE SET count=count+1 RETURNING count',
    )
    .bind(id, bucket * 60000 + 120000)
    .first<{ count: number }>();
  if (row && row.count > max)
    throw new HttpError(429, 'Too many requests. Please retry in a minute.');
  await runtime()
    .DB.prepare('DELETE FROM rate_limits WHERE expires < ?')
    .bind(Date.now())
    .run();
}
export async function requireAdmin() {
  const user = await getChatGPTUser();
  const allow = (runtime().ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (!user || !allow.includes(user.email.toLowerCase()))
    throw new HttpError(
      403,
      'Sign in with an authorized administrator account.',
    );
  return user;
}
export const json = (value: unknown, status = 200) =>
  Response.json(value, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
export function errorResponse(e: unknown) {
  if (e instanceof HttpError) return json({ error: e.message }, e.status);
  if (e instanceof Error && e.name === 'ZodError')
    return json({ error: 'Please check the entered values.' }, 400);
  return json(
    { error: 'The service could not complete this request. Please retry.' },
    503,
  );
}
