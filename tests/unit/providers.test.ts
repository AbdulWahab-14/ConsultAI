import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createAIProvider,
  GeminiProvider,
  OpenAIProvider,
  withGuidedFallback,
} from '../../ai/provider';
import { createEmbeddingProvider } from '../../ai/embeddings';
import { reviewDocument } from '../../ai/document-review';
import { sources } from '../../lib/catalog';
const config = { GEMINI_API_KEY: 'test-secret', AI_MODEL: 'test-model' };
const claim: import('../../ai/retrieval').Claim = {
  text: 'Read the official page.',
  kind: 'RECOMMENDATION',
  sourceIds: [],
  quote: null,
};
function reply(value: unknown, finishReason = 'STOP') {
  return {
    candidates: [
      { finishReason, content: { parts: [{ text: JSON.stringify(value) }] } },
    ],
  };
}
function mockResponse(data: unknown, status = 200) {
  return vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(async () => Response.json(data, { status })),
  );
}
afterEach(() => vi.unstubAllGlobals());
describe('vendor-independent structured AI', () => {
  it('defaults to Gemini and never silently uses another vendor key', () => {
    expect(createAIProvider(config)).toBeInstanceOf(GeminiProvider);
    expect(
      createAIProvider({ OPENAI_API_KEY: 'key', AI_MODEL: 'model' }),
    ).toBeNull();
    expect(createAIProvider({ ...config, AI_MODEL: '' })).toBeNull();
    expect(
      createAIProvider({ ...config, AI_PROVIDER: '__proto__' }),
    ).toBeNull();
    expect(
      createAIProvider({
        AI_PROVIDER: 'openai',
        OPENAI_API_KEY: 'key',
        AI_MODEL: 'model',
      }),
    ).toBeInstanceOf(OpenAIProvider);
  });
  it('uses Gemini header authentication, system instructions and JSON schema', async () => {
    mockResponse(reply({ claims: [claim] }));
    expect(
      await createAIProvider(config)!.consult({ question: 'Help' }, sources),
    ).toEqual([claim]);
    const [url, request] = vi.mocked(fetch).mock.calls[0];
    expect(url).toContain('/models/test-model:generateContent');
    expect(url).not.toContain('test-secret');
    expect(request!.headers).toHaveProperty('x-goog-api-key', 'test-secret');
    const body = JSON.parse(request!.body as string);
    expect(body.systemInstruction.parts[0].text).toContain('untrusted');
    expect(body.generationConfig.responseMimeType).toBe('application/json');
    expect(
      body.generationConfig.responseJsonSchema.properties.claims,
    ).toBeDefined();
    expect(
      JSON.parse(body.contents[0].parts[0].text).untrustedEvidence,
    ).toHaveLength(sources.length);
  });
  it('downgrades fabricated citations and preserves exact grounded quotes', async () => {
    const grounded = {
      ...claim,
      kind: 'FACT',
      sourceIds: [sources[0].id],
      quote: sources[0].text,
    };
    mockResponse(
      reply({ claims: [grounded, { ...grounded, sourceIds: ['invented'] }] }),
    );
    const result = await createAIProvider(config)!.consult({}, sources);
    expect(result[0].kind).toBe('FACT');
    expect(result[1].kind).toBe('UNVERIFIED');
  });
  it.each([
    [reply({ claims: [claim] }, 'SAFETY'), 200],
    [reply({ claims: [claim] }, 'MAX_TOKENS'), 200],
    [{ promptFeedback: { blockReason: 'SAFETY' } }, 200],
    [reply({ claims: [{ text: 'missing fields' }] }), 200],
    [
      {
        candidates: [
          { finishReason: 'STOP', content: { parts: [{ text: '{bad json' }] } },
        ],
      },
      200,
    ],
    [{}, 429],
    [{}, 500],
  ])(
    'falls back for blocked, truncated, invalid or unavailable AI (%#)',
    async (data, status) => {
      mockResponse(data, status as number);
      const fallback = [claim];
      expect(
        await withGuidedFallback(
          () => createAIProvider(config)!.consult({}, sources),
          fallback,
        ),
      ).toBe(fallback);
    },
  );
  it('falls back on network timeout', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new DOMException('timeout', 'TimeoutError')),
    );
    expect(
      await withGuidedFallback(
        () => createAIProvider(config)!.consult({}, []),
        [],
      ),
    ).toEqual([]);
  });
  it('validates document quotes through the same Gemini adapter', async () => {
    const observation = {
      criterion: 'Evidence',
      quote: 'I built a project.',
      observation: 'Specific example.',
      suggestion: 'Explain what you learned.',
    };
    mockResponse(reply({ observations: [observation] }));
    expect(
      await reviewDocument('I built a project.', createAIProvider(config)!),
    ).toContain('AI WRITING REVIEW');
    mockResponse(
      reply({ observations: [{ ...observation, quote: 'invented' }] }),
    );
    await expect(
      reviewDocument('I built a project.', createAIProvider(config)!),
    ).rejects.toThrow('grounded');
  });
  it('keeps OpenAI behind the shared claim validator', async () => {
    mockResponse({
      status: 'completed',
      output: [
        {
          content: [
            { type: 'output_text', text: JSON.stringify({ claims: [claim] }) },
          ],
        },
      ],
    });
    expect(
      await new OpenAIProvider('test-key', 'test-model').consult({}, []),
    ).toEqual([claim]);
  });
});
describe('embedding provenance and transport', () => {
  it('uses consistent model/dimension identity and distinct query/document tasks', async () => {
    const provider = createEmbeddingProvider(config)!;
    expect(provider.profile).toBe('gemini:gemini-embedding-001:1536');
    mockResponse({ embeddings: [{ values: Array(1536).fill(1) }] });
    for (const task of ['RETRIEVAL_QUERY', 'RETRIEVAL_DOCUMENT'] as const) {
      const [vector] = await provider.embed(['evidence'], task);
      expect(Math.hypot(...vector)).toBeCloseTo(1);
      const body = JSON.parse(
        vi.mocked(fetch).mock.lastCall![1]!.body as string,
      );
      expect(body.requests[0]).toMatchObject({
        taskType: task,
        outputDimensionality: 1536,
      });
    }
    expect(
      createEmbeddingProvider({
        EMBEDDING_PROVIDER: 'openai',
        OPENAI_API_KEY: 'key',
      })!.profile,
    ).not.toBe(provider.profile);
  });
  it.each([
    { embeddings: [] },
    { embeddings: [{ values: [1, 2] }] },
    { embeddings: [{ values: Array(1536).fill(0) }] },
  ])('rejects invalid vector batches (%#)', async ({ embeddings }) => {
    mockResponse({ embeddings });
    await expect(
      createEmbeddingProvider(config)!.embed(['query'], 'RETRIEVAL_QUERY'),
    ).rejects.toThrow();
  });
});
