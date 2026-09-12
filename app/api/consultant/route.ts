import {
  consultationStatus,
  isIntroduction,
  type GuidedReason,
} from '@/ai/consultation-status';
import { getCatalog } from '@/server/catalog';
import { z } from 'zod';
import {
  identity,
  HttpError,
  loadState,
  saveState,
  json,
  errorResponse,
  sameOrigin,
  body,
  rateLimit,
  runtime,
} from '@/server/runtime';
import { guided } from '@/ai/guided';
import { hybridRetrieve } from '@/ai/hybrid';
import { createAIProvider } from '@/ai/provider';
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const user = await identity();
    await rateLimit(user.id, 'chat', 10);
    const { message } = z
      .object({ message: z.string().trim().min(1).max(4000) })
      .parse(await body(request, 20000));
    const state = await loadState(user.id);
    if (!state.profileCompleted)
      throw new HttpError(
        422,
        'Create and save your own profile before requesting personalized advice.',
      );
    const env = runtime();
    const catalog = await getCatalog();
    let answer = guided(message, state.profile, catalog);
    let mode = 'guided';
    let retrievalMode: string | null = null;
    const ai = createAIProvider(env);
    const introduction = isIntroduction(message);
    const safety = /fake|forge|guarantee|100%/i.test(message);
    const guidedReason: GuidedReason = introduction
      ? 'introduction'
      : safety
        ? 'safety'
        : !ai
          ? 'not_configured'
          : 'unavailable';
    if (ai && !safety && !introduction) {
      const result = await (async () => {
        const { sources: evidence, mode: retrieval } =
          await hybridRetrieve(message);
        retrievalMode = retrieval;
        const claims = await ai.consult(
          {
            profile: state.profile,
            saved: state.saved,
            applications: state.applications,
            messages: state.messages.slice(-8),
            question: message,
          },
          evidence,
        );
        const text = claims
          .map(
            (c) =>
              `${c.kind}: ${c.kind === 'FACT' ? c.quote : c.text}${
                c.sourceIds.length
                  ? '\n' +
                    c.sourceIds
                      .map((id) => {
                        const s = evidence.find((s) => s.id === id)!;
                        return `Source: ${s.organization} — ${s.url}`;
                      })
                      .join('\n')
                  : ''
              }`,
          )
          .join('\n\n');
        return { text, mode: 'ai' };
      })();
      answer = result.text;
      mode = result.mode;
    }
    state.messages = [
      ...state.messages,
      { role: 'user' as const, text: message },
      { role: 'assistant' as const, text: answer },
    ].slice(-100);
    await saveState(user.id, state);
    return json({
      state,
      mode,
      retrievalMode,
      responseStatus: consultationStatus(mode, guidedReason),
    });
  } catch (e) {
    return errorResponse(e);
  }
}
