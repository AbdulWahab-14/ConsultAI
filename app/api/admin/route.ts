import { requireAdmin, json, errorResponse } from '@/server/runtime';
export async function GET() {
  try {
    await requireAdmin();
    return json({ authorized: true });
  } catch (e) {
    return errorResponse(e);
  }
}
