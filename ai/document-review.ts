import { z } from 'zod';
import { documentSystem } from './prompts/document-analysis.system';
import type { AIProvider } from './provider';
export async function reviewDocument(text: string, provider: AIProvider) {
  const schema = z
    .object({
      observations: z
        .array(
          z
            .object({
              criterion: z.string().max(100),
              quote: z.string().max(1000),
              observation: z.string().max(1500),
              suggestion: z.string().max(1500),
            })
            .strict(),
        )
        .min(1)
        .max(8),
    })
    .strict();
  const raw = await provider.generateStructured({
    name: 'document_review',
    system: documentSystem,
    input: { untrustedDocument: text },
    schema: z.toJSONSchema(schema),
    maxTokens: 1600,
  });
  const parsed = schema.parse(raw);
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
