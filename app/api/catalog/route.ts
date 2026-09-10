import { getCatalog } from '@/server/catalog';
import { json, errorResponse } from '@/server/runtime';
export async function GET() {
  try {
    return json(await getCatalog());
  } catch (e) {
    return errorResponse(e);
  }
}
