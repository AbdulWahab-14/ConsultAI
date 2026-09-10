import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  env: { DATABASE_URL: 'postgresql://unused', GEMINI_API_KEY: 'test-key' },
  sql: vi.fn(),
  embed: vi.fn(),
}));
vi.mock('../../server/runtime', () => ({ runtime: () => mocks.env }));
vi.mock('../../server/catalog', () => ({
  getCatalog: async () => ({
    sources: [
      {
        id: 'reviewed',
        country: 'Germany',
        topic: 'admission',
        title: 'German admission',
        text: 'Reviewed evidence.',
        status: 'VERIFIED',
        reviewDueAt: '2099-01-01',
      },
    ],
  }),
}));
vi.mock('@neondatabase/serverless', () => ({ neon: () => mocks.sql }));
vi.mock('../../ai/embeddings', () => ({
  createEmbeddingProvider: () => ({
    profile: 'gemini:gemini-embedding-001:1536',
    embed: mocks.embed,
  }),
}));
import { hybridRetrieve } from '../../ai/hybrid';
beforeEach(() => {
  mocks.sql.mockReset().mockResolvedValue([]);
  mocks.embed.mockReset().mockResolvedValue([Array(1536).fill(0.01)]);
});
describe('RAG survives provider switching', () => {
  it('filters vectors by the exact embedding profile and uses query task type', async () => {
    const result = await hybridRetrieve('German admission');
    expect(mocks.embed).toHaveBeenCalledWith(
      ['German admission'],
      'RETRIEVAL_QUERY',
    );
    const [strings, ...values] = mocks.sql.mock.calls[0];
    expect(strings.join('')).toContain('c.embedding_profile =');
    expect(values).toContain('gemini:gemini-embedding-001:1536');
    expect(result.mode).toBe('structured + keyword');
  });
  it('falls back to reviewed evidence on unavailable vectors or a missing migration', async () => {
    mocks.sql.mockRejectedValue(new Error('missing column'));
    expect((await hybridRetrieve('German admission')).sources[0].text).toBe(
      'Reviewed evidence.',
    );
    mocks.embed.mockRejectedValue(new Error('timeout'));
    expect((await hybridRetrieve('German admission')).mode).toBe(
      'structured + keyword',
    );
  });
  it('never queries unrelated evidence or admits stale indexed text', async () => {
    expect((await hybridRetrieve('Korean visa')).sources).toEqual([]);
    expect(mocks.embed).not.toHaveBeenCalled();
    mocks.sql.mockResolvedValue([
      {
        source_id: 'reviewed',
        source_hash: 'old',
        text: 'Outdated requirement',
      },
    ]);
    expect((await hybridRetrieve('German admission')).sources[0].text).toBe(
      'Reviewed evidence.',
    );
  });
});
