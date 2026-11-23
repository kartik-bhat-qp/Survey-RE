import { getTextAiShare, ShareStoreUnavailable, ShareWriteConflict, updateTextAiShare } from '@/lib/text-ai/share-store';
import { isTextAiSharedDashboard, TEXT_AI_SHARE_TOKEN, type TextAiShareView } from '@/data/text-ai-sharing';

type Context = { params: Promise<{ token: string }> };
const NO_STORE = { 'Cache-Control': 'no-store' };

function reply(data: object, status = 200) {
  return Response.json(data, { status, headers: NO_STORE });
}

function storageError(error: unknown) {
  if (error instanceof ShareStoreUnavailable) return reply({ error: 'Shared link storage is unavailable for this deployment.' }, 503);
  if (error instanceof ShareWriteConflict) return reply({ error: 'Sharing settings changed. Try again.' }, 409);
  return reply({ error: 'Sharing is temporarily unavailable. Try again.' }, 503);
}

async function readView(token: string, password?: string) {
  if (!TEXT_AI_SHARE_TOKEN.test(token)) return reply({ error: 'Dashboard cannot be loaded.' }, 404);
  try {
    const result = await getTextAiShare(token, password);
    if (!result) return reply({ error: 'Dashboard cannot be loaded.' }, 404);
    if (result === 'password-required') return reply({ passwordRequired: true }, 401);
    if (result === 'incorrect-password') return reply({ error: 'Incorrect password. Try again.' }, 401);
    return reply({ view: result });
  } catch (error) {
    return storageError(error);
  }
}

export async function GET(_request: Request, { params }: Context) {
  return readView((await params).token);
}

export async function POST(request: Request, { params }: Context) {
  const body = await request.json().catch(() => null);
  if (typeof body?.password !== 'string' || body.password.length > 128) {
    return reply({ error: 'Enter the dashboard password.' }, 400);
  }
  return readView((await params).token, body.password);
}

export async function PUT(request: Request, { params }: Context) {
  const { token } = await params;
  const key = request.headers.get('Authorization')?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if (!TEXT_AI_SHARE_TOKEN.test(token) || !key) return reply({ error: 'Sharing link could not be managed.' }, 403);

  const raw = await request.text();
  if (Buffer.byteLength(raw) > 256 * 1024) return reply({ error: 'This dashboard is too large to share.' }, 413);
  let body: { enabled?: unknown; password?: unknown; view?: Partial<TextAiShareView> } | null;
  try {
    body = JSON.parse(raw);
  } catch {
    return reply({ error: 'Invalid sharing settings.' }, 400);
  }
  if (!body || (body.enabled !== undefined && typeof body.enabled !== 'boolean') ||
      (body.password !== undefined && body.password !== null &&
        (typeof body.password !== 'string' || !body.password.trim() || body.password.length > 128))) {
    return reply({ error: 'Invalid sharing settings.' }, 400);
  }
  const view = body.view;
  if (body.enabled !== false && (!view || typeof view.showOriginalResponses !== 'boolean' || !isTextAiSharedDashboard(view.dashboard))) {
    return reply({ error: 'The dashboard is still loading. Try again.' }, 400);
  }

  try {
    const updated = await updateTextAiShare(token, key, {
      enabled: body.enabled as boolean | undefined,
      password: body.password as string | null | undefined,
      view: body.enabled !== false ? view as TextAiShareView : undefined,
    });
    return updated ? reply({ enabled: body.enabled !== false }) : reply({ error: 'Sharing link could not be managed.' }, 403);
  } catch (error) {
    return storageError(error);
  }
}
