import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({
  db: null as unknown as DatabaseSync,
  admin: true,
  failEmbed: false,
}));
vi.mock('../../server/runtime', () => {
  class HttpError extends Error {
    constructor(
      public status: number,
      message: string,
    ) {
      super(message);
    }
  }
  function prepare(sql: string) {
    let args: (string | number | null)[] = [];
    const statement = {
      bind: (...values: typeof args) => {
        args = values;
        return statement;
      },
      run: async () => state.db.prepare(sql).run(...args),
      all: async () => ({ results: state.db.prepare(sql).all(...args) }),
      first: async () => state.db.prepare(sql).get(...args) || null,
    };
    return statement;
  }
  return {
    runtime: () => ({
      DB: {
        prepare,
        batch: async (statements: { run: () => Promise<unknown> }[]) => {
          state.db.exec('BEGIN');
          try {
            const results = [];
            for (const s of statements) results.push(await s.run());
            state.db.exec('COMMIT');
            return results;
          } catch (e) {
            state.db.exec('ROLLBACK');
            throw e;
          }
        },
      },
    }),
    requireAdmin: async () => {
      if (!state.admin) throw new HttpError(403, 'Denied');
      return { userId: 'test-admin' };
    },
    sameOrigin: (r: Request) => {
      if (r.headers.get('origin') !== new URL(r.url).origin)
        throw new HttpError(403, 'Origin');
    },
    body: (r: Request) => r.json(),
    rateLimit: async () => {},
    HttpError,
    json: (v: unknown, status = 200) => Response.json(v, { status }),
    errorResponse: (e: Error) =>
      Response.json(
        { error: e.message },
        {
          status:
            e instanceof HttpError
              ? e.status
              : e.name === 'ZodError'
                ? 400
                : 503,
        },
      ),
  };
});
vi.mock('../../ai/embeddings', () => ({
  createEmbeddingProvider: () => ({
    profile: 'test:embedding:2',
    embed: async (texts: string[]) => {
      if (state.failEmbed) throw Error('Embedding unavailable');
      return texts.map(() => [1, 0]);
    },
  }),
}));
import { getCatalog } from '../../server/catalog';
import { PUT, GET } from '../../app/api/admin/catalog/route';
import { POST as capture } from '../../app/api/admin/sources/route';
import { POST as review } from '../../app/api/admin/review/route';
const req = (path: string, data: unknown, method: 'POST' | 'PUT' = 'POST') =>
  new Request('https://test.local' + path, {
    method,
    headers: {
      origin: 'https://test.local',
      'content-type': 'application/json',
    },
    body: JSON.stringify(data),
  });
beforeEach(() => {
  state.db = new DatabaseSync(':memory:');
  state.admin = true;
  state.failEmbed = false;
  state.db.exec(readFileSync('drizzle/0000_youthful_magik.sql', 'utf8'));
  state.db.exec(readFileSync('drizzle/0001_yielding_sentinel.sql', 'utf8'));
});
afterEach(() => {
  state.db.close();
  vi.unstubAllGlobals();
});
it('persists programs, scholarships and visas in typed SQL fields and validates references', async () => {
  const catalog = await getCatalog();
  for (const key of ['programs', 'scholarships', 'visas'] as const) {
    const record = { ...catalog[key][0], id: 'test-' + key };
    expect(
      (
        await PUT(
          req(
            '/api/admin/catalog',
            { key, value: [...catalog[key], record] },
            'PUT',
          ),
        )
      ).status,
    ).toBe(200);
    expect((await getCatalog())[key].some((r) => r.id === record.id)).toBe(
      true,
    );
    const edited = { ...record, country: 'United Kingdom' };
    expect(
      (
        await PUT(
          req(
            '/api/admin/catalog',
            { key, value: [...catalog[key], edited] },
            'PUT',
          ),
        )
      ).status,
    ).toBe(200);
    expect(
      (await getCatalog())[key].find((r) => r.id === record.id)?.country,
    ).toBe('United Kingdom');
    expect(
      (
        await PUT(
          req('/api/admin/catalog', { key, value: catalog[key] }, 'PUT'),
        )
      ).status,
    ).toBe(200);
  }
  const row = state.db
    .prepare(
      "SELECT ielts,ielts_component_min,tuition,tuition_currency FROM catalog_records WHERE key='programs:southampton'",
    )
    .get();
  expect(row).toMatchObject({
    ielts: 6.5,
    ielts_component_min: 6,
    tuition: 33000,
    tuition_currency: 'GBP',
  });
  const bad = { ...catalog.programs[0], sourceIds: ['missing'] };
  expect(
    (
      await PUT(
        req('/api/admin/catalog', { key: 'programs', value: [bad] }, 'PUT'),
      )
    ).status,
  ).toBe(400);
  expect((await getCatalog()).programs).toHaveLength(6);
});
it('captures changes without publishing, deduplicates, rejects and explicitly approves with index/hash audit', async () => {
  const before = await getCatalog(),
    source = before.sources.find((s) => s.id === 'saarland-cs')!;
  let html =
    '<main>Current official page captured for administrator review.</main>';
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(html, { headers: { 'content-type': 'text/html' } }),
    ),
  );
  const captured = (await (
    await capture(req('/api/admin/sources', { url: source.url }))
  ).json()) as { id: string };
  expect(captured.id).toBeTruthy();
  expect(
    (await getCatalog()).sources.find((s) => s.id === source.id)?.text,
  ).toBe(source.text);
  expect(
    (
      (await (
        await capture(req('/api/admin/sources', { url: source.url }))
      ).json()) as { message: string }
    ).message,
  ).toContain('unchanged');
  expect(
    (
      await review(
        req('/api/admin/review', { id: captured.id, action: 'REJECT' }),
      )
    ).status,
  ).toBe(200);
  html =
    '<main>Changed official evidence ready for human review and approval.</main>';
  const changed = (await (
    await capture(req('/api/admin/sources', { url: source.url }))
  ).json()) as { id: string };
  expect(
    state.db
      .prepare('SELECT status FROM source_versions WHERE id=?')
      .get(changed.id),
  ).toMatchObject({ status: 'SOURCE_CHANGED' });
  const proposed = {
    ...source,
    text: 'Changed official evidence ready for human review and approval.',
    reviewDueAt: '2099-01-01',
  };
  state.failEmbed = true;
  expect(
    (
      await review(
        req('/api/admin/review', {
          id: changed.id,
          action: 'APPROVE',
          source: proposed,
        }),
      )
    ).status,
  ).toBe(503);
  expect(
    (await getCatalog()).sources.find((s) => s.id === source.id)?.text,
  ).toBe(source.text);
  state.failEmbed = false;
  expect(
    (
      await review(
        req('/api/admin/review', {
          id: changed.id,
          action: 'APPROVE',
          source: proposed,
        }),
      )
    ).status,
  ).toBe(200);
  const published = (await getCatalog()).sources.find(
    (s) => s.id === source.id,
  )!;
  expect(published.text).toBe(proposed.text);
  expect(published.contentHash).toMatch(/^[a-f0-9]{64}$/);
  expect(published.captureHash).toMatch(/^[a-f0-9]{64}$/);
  expect(
    state.db
      .prepare(
        'SELECT source_hash,embedding_profile FROM knowledge_chunks WHERE source_id=?',
      )
      .get(source.id),
  ).toMatchObject({
    source_hash: published.contentHash,
    embedding_profile: 'test:embedding:2',
  });
  expect((await GET()).status).toBe(200);
});
it('blocks non-admin publication and unsafe source fetches', async () => {
  state.admin = false;
  expect((await GET()).status).toBe(403);
  expect(
    (await PUT(req('/api/admin/catalog', { key: 'visas', value: [] }, 'PUT')))
      .status,
  ).toBe(403);
  state.admin = true;
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  for (const url of [
    'http://127.0.0.1/',
    'https://evil.example/',
    'https://www.gov.uk:8080/',
  ])
    expect((await capture(req('/api/admin/sources', { url }))).status).toBe(
      400,
    );
  expect(fetchMock).not.toHaveBeenCalled();
});
