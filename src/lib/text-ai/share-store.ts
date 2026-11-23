import { get, put, BlobPreconditionFailedError } from '@vercel/blob';
import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { promisify } from 'node:util';
import type { TextAiShareView } from '@/data/text-ai-sharing';

const deriveKey = promisify(scrypt);

interface ShareRecord {
  ownerHash: string;
  enabled: boolean;
  passwordHash: string | null;
  view: TextAiShareView;
}

interface StoredShare {
  record: ShareRecord;
  etag?: string;
}

export class ShareStoreUnavailable extends Error {}
export class ShareWriteConflict extends Error {}

function storePath(token: string): string {
  return `text-ai-shares/v1/${token}.json`;
}

function localPath(token: string): string {
  if (process.env.VERCEL && !process.env.TEXT_AI_SHARE_STORAGE_DIR) throw new ShareStoreUnavailable();
  return join(process.env.TEXT_AI_SHARE_STORAGE_DIR || join(process.cwd(), '.runtime'), storePath(token));
}

async function readShare(token: string): Promise<StoredShare | null> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await get(storePath(token), { access: 'private', useCache: false });
    if (!blob || blob.statusCode !== 200) return null;
    return { record: await new Response(blob.stream).json(), etag: blob.blob.etag };
  }

  try {
    return { record: JSON.parse(await readFile(localPath(token), 'utf8')) };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

async function writeShare(token: string, record: ShareRecord, etag?: string): Promise<void> {
  const value = JSON.stringify(record);
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      await put(storePath(token), value, { access: 'private', contentType: 'application/json', ifMatch: etag });
    } catch (error) {
      if (error instanceof BlobPreconditionFailedError) throw new ShareWriteConflict();
      throw error;
    }
    return;
  }

  const target = localPath(token);
  const draft = `${target}.${randomBytes(12).toString('hex')}.tmp`;
  await mkdir(dirname(target), { recursive: true });
  try {
    await writeFile(draft, value, { mode: 0o600 });
    await rename(draft, target);
  } finally {
    await rm(draft, { force: true });
  }
}

function ownerHash(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

function equalHash(a: string, b: string): boolean {
  return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = await deriveKey(password, salt, 32) as Buffer;
  return `${salt}:${hash.toString('hex')}`;
}

export async function getTextAiShare(token: string, password?: string): Promise<TextAiShareView | 'password-required' | 'incorrect-password' | null> {
  const stored = await readShare(token);
  if (!stored?.record.enabled) return null;
  const { record } = stored;
  if (record.passwordHash) {
    if (password === undefined) return 'password-required';
    const [salt, expected] = record.passwordHash.split(':');
    const hash = await deriveKey(password, salt, 32) as Buffer;
    if (!equalHash(hash.toString('hex'), expected)) return 'incorrect-password';
  }
  return record.view;
}

const pending = new Map<string, Promise<unknown>>();

export async function updateTextAiShare(token: string, key: string, update: {
  enabled?: boolean;
  view?: TextAiShareView;
  password?: string | null;
}): Promise<boolean> {
  // Serialize requests in this process. Blob writes also check the stored ETag across instances.
  const previous = pending.get(token) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(async () => {
    const stored = await readShare(token);
    const record = stored?.record;
    const hash = ownerHash(key);
    if (record && !equalHash(record.ownerHash, hash)) return false;
    const enabled = update.enabled ?? record?.enabled ?? false;
    if (!enabled && (!record || update.enabled === undefined)) return false;
    const view = update.view ?? record?.view;
    if (!view) return false;
    const passwordHash = update.password === undefined ? record?.passwordHash ?? null :
      update.password === null ? null : await hashPassword(update.password);
    await writeShare(token, { ownerHash: hash, enabled, passwordHash, view }, stored?.etag);
    return true;
  });
  pending.set(token, next);
  try {
    return await next;
  } finally {
    if (pending.get(token) === next) pending.delete(token);
  }
}
