import { getCatalog } from '@/server/catalog';
import {
  identity,
  loadState,
  saveState,
  json,
  errorResponse,
  sameOrigin,
  body,
  rateLimit,
  HttpError,
} from '@/server/runtime';
import { stateSchema } from '@/lib/validation';
export async function GET() {
  try {
    const user = await identity(true);
    return json({ state: await loadState(user.id), account: user.account });
  } catch (e) {
    return errorResponse(e);
  }
}
export async function PUT(request: Request) {
  try {
    sameOrigin(request);
    const user = await identity();
    await rateLimit(user.id, 'save', 60);
    const next = stateSchema.parse(await body(request));
    const catalog = await getCatalog();
    const ids = new Set(catalog.programs.map((p) => p.id));
    if (
      [
        ...next.saved,
        ...next.compare,
        ...next.applications.map((a) => a.universityId),
      ].some((id) => !ids.has(id))
    )
      throw new HttpError(400, 'Choose a university from the catalog.');
    next.saved = [...new Set(next.saved)];
    next.compare = [...new Set(next.compare)];
    next.checks = [...new Set(next.checks)];
    const previous = await loadState(user.id);
    next.messages = previous.messages;
    await saveState(user.id, next);
    return json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
