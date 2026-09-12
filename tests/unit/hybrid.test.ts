import { beforeEach, describe, expect, it, vi } from 'vitest';
import { contentHash, cosine, chunks } from '../../lib/knowledge';
const mocks = vi.hoisted(() => ({
  all: vi.fn(),
  bind: vi.fn(),
  prepare: vi.fn(),
  embed: vi.fn(),
}));
vi.mock('../../server/runtime', () => ({
  runtime: () => ({ DB: { prepare: mocks.prepare } }),
}));
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
        verifiedAt: '2026-09-12',
        reviewDueAt: '2099-01-01',
      },
      {
        id: 'stale',
        country: 'Germany',
        topic: 'admission',
        title: 'Old admission',
        text: 'Outdated evidence.',
        status: 'VERIFIED',
        verifiedAt: '2020-01-01',
        reviewDueAt: '2020-02-01',
      },
    ],
  }),
}));
vi.mock('../../ai/embeddings', () => ({
  createEmbeddingProvider: () => ({
    profile: 'gemini:gemini-embedding-001:1536',
    embed: mocks.embed,
  }),
}));
import { hybridRetrieve } from '../../ai/hybrid';
beforeEach(() => {
  mocks.prepare.mockReset().mockReturnValue({ bind: mocks.bind });
  mocks.bind.mockReset().mockReturnValue({ all: mocks.all });
  mocks.all.mockReset().mockResolvedValue({ results: [] });
  mocks.embed.mockReset().mockResolvedValue([[1, 0]]);
});
describe('D1 semantic retrieval', () => {
  it('ranks reviewed hash-matching embeddings and scopes the provider profile', async () => {
    mocks.all.mockResolvedValue({
      results: [
        {
          source_id: 'reviewed',
          source_hash: await contentHash('Reviewed evidence.'),
          text: 'Reviewed evidence.',
          embedding: '[1,0]',
        },
      ],
    });
    const result = await hybridRetrieve('German admission');
    expect(result.mode).toContain('embeddings (D1');
    expect(result.sources.map((s) => s.id)).toEqual(['reviewed']);
    expect(mocks.bind).toHaveBeenCalledWith('gemini:gemini-embedding-001:1536');
    expect(mocks.embed).toHaveBeenCalledWith(
      ['German admission'],
      'RETRIEVAL_QUERY',
    );
  });
  it('rejects stale text, wrong hashes and unrelated countries', async () => {
    expect((await hybridRetrieve('Korean visa')).sources).toEqual([]);
    expect(mocks.embed).not.toHaveBeenCalled();
    mocks.all.mockResolvedValue({
      results: [
        {
          source_id: 'reviewed',
          source_hash: 'old',
          text: 'Changed deadline.',
          embedding: '[1,0]',
        },
      ],
    });
    expect((await hybridRetrieve('German admission')).mode).toBe(
      'structured + keyword',
    );
    mocks.all.mockResolvedValue({
      results: [
        {
          source_id: 'reviewed',
          source_hash: await contentHash('Reviewed evidence.'),
          text: 'Injected text.',
          embedding: '[1,0]',
        },
      ],
    });
    expect((await hybridRetrieve('German admission')).mode).toBe(
      'structured + keyword',
    );
  });
  it('retains reviewed keyword retrieval when embeddings temporarily fail', async () => {
    mocks.embed.mockRejectedValue(new Error('quota'));
    expect((await hybridRetrieve('German admission')).sources[0].text).toBe(
      'Reviewed evidence.',
    );
  });
  it('handles malformed vectors and preserves exact overlapping evidence', () => {
    expect(cosine([1, 0], [1, 0])).toBe(1);
    expect(cosine([1], [1, 0])).toBe(-1);
    expect(cosine([0, 0], [1, 0])).toBe(-1);
    expect(cosine([NaN], [1])).toBe(-1);
    const text = 'a'.repeat(4000);
    expect(
      chunks(text).every((c) => text.includes(c) && c.length <= 1500),
    ).toBe(true);
  });
});
