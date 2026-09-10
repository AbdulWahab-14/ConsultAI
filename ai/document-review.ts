import { z } from 'zod';
import { documentSystem } from './prompts/document-analysis.system';
export async function reviewDocument(text: string, key: string, model: string) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(30000),
    body: JSON.stringify({
      model,
      store: false,
      instructions: documentSystem,
      input: JSON.stringify({ untrustedDocument: text }),
      max_output_tokens: 1600,
      text: {
        format: {
          type: 'json_schema',
          name: 'document_review',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              observations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    criterion: { type: 'string' },
                    quote: { type: 'string' },
                    observation: { type: 'string' },
                    suggestion: { type: 'string' },
                  },
                  required: ['criterion', 'quote', 'observation', 'suggestion'],
                  additionalProperties: false,
                },
              },
            },
            required: ['observations'],
            additionalProperties: false,
          },
        },
      },
    }),
  });
  if (!response.ok) throw new Error('Document AI unavailable');
  const data = (await response.json()) as {
    output: { content?: { type: string; text?: string }[] }[];
  };
  const raw = data.output
    .flatMap((o) => o.content || [])
    .filter((c) => c.type === 'output_text')
    .map((c) => c.text)
    .join('');
  const parsed = z
    .object({
      observations: z
        .array(
          z.object({
            criterion: z.string().max(100),
            quote: z.string().max(1000),
            observation: z.string().max(1500),
            suggestion: z.string().max(1500),
          }),
        )
        .max(8),
    })
    .parse(JSON.parse(raw));
  const valid = parsed.observations.filter(
    (o) => o.quote.length > 0 && text.includes(o.quote),
  );
  if (!valid.length) throw new Error('No grounded observations returned');
  return (
    'AI WRITING REVIEW · quoted evidence checked against your document\n\n' +
    valid
      .map(
        (o) =>
          `${o.criterion}\nEvidence: “${o.quote}”\n${o.observation}\nNext: ${o.suggestion}`,
      )
      .join('\n\n')
  );
}
