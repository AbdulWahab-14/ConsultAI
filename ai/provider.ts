import { z } from 'zod';
import { consultantSystem } from './prompts/consultant.system';
import { validateClaims, type Claim } from './retrieval';
import type { Source } from '@/lib/catalog';
export interface AIProvider {
  consult(input: unknown, sources: Source[]): Promise<Claim[]>;
  embed(texts: string[]): Promise<number[][]>;
}
const outputSchema = z.object({
  claims: z
    .array(
      z.object({
        text: z.string().max(2000),
        kind: z.enum(['FACT', 'ESTIMATE', 'RECOMMENDATION', 'UNVERIFIED']),
        sourceIds: z.array(z.string()),
        quote: z.string().nullable(),
      }),
    )
    .max(8),
});
export class OpenAIProvider implements AIProvider {
  constructor(
    private key: string,
    private model: string,
    private embeddingModel = 'text-embedding-3-small',
  ) {}
  async consult(input: unknown, sources: Source[]) {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.key}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(30000),
      body: JSON.stringify({
        model: this.model,
        store: false,
        instructions: consultantSystem,
        input: JSON.stringify({
          studentContext: input,
          untrustedEvidence: sources.map(({ id, text }) => ({ id, text })),
        }),
        max_output_tokens: 1800,
        text: {
          format: {
            type: 'json_schema',
            name: 'consultation',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                claims: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      text: { type: 'string' },
                      kind: {
                        type: 'string',
                        enum: [
                          'FACT',
                          'ESTIMATE',
                          'RECOMMENDATION',
                          'UNVERIFIED',
                        ],
                      },
                      sourceIds: { type: 'array', items: { type: 'string' } },
                      quote: { type: ['string', 'null'] },
                    },
                    required: ['text', 'kind', 'sourceIds', 'quote'],
                    additionalProperties: false,
                  },
                },
              },
              required: ['claims'],
              additionalProperties: false,
            },
          },
        },
      }),
    });
    if (!response.ok) throw new Error('AI unavailable');
    const data = (await response.json()) as {
      output: { content?: { type: string; text?: string }[] }[];
    };
    const text = data.output
      .flatMap((o) => o.content || [])
      .filter((c) => c.type === 'output_text')
      .map((c) => c.text)
      .join('');
    return validateClaims(outputSchema.parse(JSON.parse(text)).claims, sources);
  }
  async embed(texts: string[]) {
    const r = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.key}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(30000),
      body: JSON.stringify({
        model: this.embeddingModel,
        input: texts.slice(0, 32),
        dimensions: 1536,
      }),
    });
    if (!r.ok) throw new Error('Embeddings unavailable');
    const d = (await r.json()) as {
      data: { embedding: number[]; index: number }[];
    };
    return d.data.sort((a, b) => a.index - b.index).map((x) => x.embedding);
  }
}
