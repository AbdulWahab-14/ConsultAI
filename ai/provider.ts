import { z } from 'zod';
import { consultantSystem } from './prompts/consultant.system';
import { validateClaims, type Claim } from './retrieval';
import type { Source } from '@/lib/catalog';
export type AIConfig = {
  AI_PROVIDER?: string;
  GEMINI_API_KEY?: string;
  OPENAI_API_KEY?: string;
  AI_MODEL?: string;
};
export type StructuredRequest = {
  name: string;
  system: string;
  input: unknown;
  schema: Record<string, unknown>;
  maxTokens: number;
};
export interface AIProvider {
  generateStructured(request: StructuredRequest): Promise<unknown>;
  consult(input: unknown, sources: Source[]): Promise<Claim[]>;
}
const outputSchema = z
  .object({
    claims: z
      .array(
        z
          .object({
            text: z.string().max(2000),
            kind: z.enum(['FACT', 'ESTIMATE', 'RECOMMENDATION', 'UNVERIFIED']),
            sourceIds: z.array(z.string()).max(8),
            quote: z.string().nullable(),
          })
          .strict(),
      )
      .min(1)
      .max(8),
  })
  .strict();
// Shared validation is enforced independently of the vendor's schema enforcement.
export abstract class ValidatedProvider implements AIProvider {
  abstract generateStructured(request: StructuredRequest): Promise<unknown>;
  async consult(input: unknown, sources: Source[]) {
    const result = await this.generateStructured({
      name: 'consultation',
      system: consultantSystem,
      input: {
        studentContext: input,
        untrustedEvidence: sources.map(({ id, text }) => ({ id, text })),
      },
      schema: z.toJSONSchema(outputSchema),
      maxTokens: 1800,
    });
    return validateClaims(outputSchema.parse(result).claims, sources);
  }
}
export class GeminiProvider extends ValidatedProvider {
  constructor(
    private key: string,
    private model: string,
  ) {
    super();
  }
  async generateStructured(request: StructuredRequest) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(this.model.replace(/^models\//, ''))}:generateContent`,
      {
        method: 'POST',
        signal: AbortSignal.timeout(30000),
        headers: {
          'x-goog-api-key': this.key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: request.system }] },
          contents: [
            { role: 'user', parts: [{ text: JSON.stringify(request.input) }] },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            responseJsonSchema: request.schema,
            maxOutputTokens: Math.max(request.maxTokens, 8192),
          },
        }),
      },
    );
    if (!response.ok) throw new Error('AI unavailable');
    const data = (await response.json()) as {
      promptFeedback?: { blockReason?: string };
      candidates?: {
        finishReason?: string;
        content?: { parts?: { text?: string; thought?: boolean }[] };
      }[];
    };
    const candidate = data.candidates?.[0];
    if (data.promptFeedback?.blockReason || candidate?.finishReason !== 'STOP')
      throw new Error('AI response blocked or incomplete');
    const raw = candidate.content?.parts
      ?.filter((p) => !p.thought)
      .map((p) => p.text || '')
      .join('');
    if (!raw) throw new Error('AI response empty');
    return JSON.parse(raw) as unknown;
  }
}
export class OpenAIProvider extends ValidatedProvider {
  constructor(
    private key: string,
    private model: string,
  ) {
    super();
  }
  async generateStructured(request: StructuredRequest) {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      signal: AbortSignal.timeout(30000),
      headers: {
        Authorization: `Bearer ${this.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        store: false,
        instructions: request.system,
        input: JSON.stringify(request.input),
        max_output_tokens: request.maxTokens,
        text: {
          format: {
            type: 'json_schema',
            name: request.name,
            strict: true,
            schema: request.schema,
          },
        },
      }),
    });
    if (!response.ok) throw new Error('AI unavailable');
    const data = (await response.json()) as {
      status?: string;
      output?: { content?: { type: string; text?: string }[] }[];
    };
    if (data.status !== 'completed') throw new Error('AI response incomplete');
    const content = data.output?.flatMap((o) => o.content || []) || [];
    if (content.some((c) => c.type === 'refusal'))
      throw new Error('AI response blocked');
    return JSON.parse(
      content
        .filter((c) => c.type === 'output_text')
        .map((c) => c.text || '')
        .join(''),
    ) as unknown;
  }
}
// Add future adapters such as Groq here; routes and evidence validation stay unchanged.
export type ProviderFactory = (config: AIConfig) => AIProvider | null;
export const providerFactories: Record<string, ProviderFactory> = {
  gemini: (c) =>
    c.GEMINI_API_KEY && c.AI_MODEL
      ? new GeminiProvider(c.GEMINI_API_KEY, c.AI_MODEL)
      : null,
  openai: (c) =>
    c.OPENAI_API_KEY && c.AI_MODEL
      ? new OpenAIProvider(c.OPENAI_API_KEY, c.AI_MODEL)
      : null,
};
export function createAIProvider(config: AIConfig): AIProvider | null {
  const vendor = (config.AI_PROVIDER || 'gemini').trim().toLowerCase();
  return Object.hasOwn(providerFactories, vendor)
    ? providerFactories[vendor](config)
    : null;
}
export async function withGuidedFallback<T>(
  action: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await action();
  } catch {
    return fallback;
  }
}
