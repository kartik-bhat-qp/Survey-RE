import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { textAiSharedResponseValue } from '../src/data/mock-text-ai-widget-data.ts';
import { getTextAiShare, updateTextAiShare } from '../src/lib/text-ai/share-store.ts';

test('shared Text Viewer selects the stored translation or the exact original response', () => {
  const source = { id: 4, value: 'bessere Kommunikation', translatedValue: 'Better communication', tags: ['communication'] };
  assert.equal(textAiSharedResponseValue(source, false), 'Better communication');
  assert.equal(textAiSharedResponseValue(source, true), 'bessere Kommunikation');
  assert.equal(textAiSharedResponseValue({ value: 'English response' }, false), 'English response');
  assert.equal(textAiSharedResponseValue({ value: 'No translation', translatedValue: '' }, false), 'No translation');
  assert.deepEqual(source.tags, ['communication']);
});

test('a shared link is public until protected or revoked, and only its owner can update it', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'survey-re-text-ai-share-'));
  const previousStorageDir = process.env.TEXT_AI_SHARE_STORAGE_DIR;
  const previousBlobToken = process.env.BLOB_READ_WRITE_TOKEN;
  process.env.TEXT_AI_SHARE_STORAGE_DIR = directory;
  delete process.env.BLOB_READ_WRITE_TOKEN;
  context.after(async () => {
    if (previousStorageDir === undefined) delete process.env.TEXT_AI_SHARE_STORAGE_DIR;
    else process.env.TEXT_AI_SHARE_STORAGE_DIR = previousStorageDir;
    if (previousBlobToken !== undefined) process.env.BLOB_READ_WRITE_TOKEN = previousBlobToken;
    await rm(directory, { recursive: true, force: true });
  });

  const token = randomBytes(16).toString('hex');
  const owner = randomBytes(32).toString('hex');
  const view = { dashboard: { name: 'Sample dashboard' }, showOriginalResponses: false };
  const original = { ...view, showOriginalResponses: true };

  assert.equal(await getTextAiShare(token), null);
  assert.equal(await updateTextAiShare(token, owner, { enabled: true, view }), true);
  assert.deepEqual(await getTextAiShare(token), view);
  assert.equal(await updateTextAiShare(token, '0'.repeat(64), { enabled: false }), false);

  const password = 'Example demo password';
  await updateTextAiShare(token, owner, { enabled: true, password });
  const stored = await readFile(join(directory, 'text-ai-shares/v1', `${token}.json`), 'utf8');
  assert.ok(!stored.includes(password) && !stored.includes(owner));
  assert.equal(await getTextAiShare(token), 'password-required');
  assert.equal(await getTextAiShare(token, 'Wrong password'), 'incorrect-password');
  assert.deepEqual(await getTextAiShare(token, password), view);

  await updateTextAiShare(token, owner, { enabled: true, view: original });
  assert.deepEqual(await getTextAiShare(token, password), original);
  await updateTextAiShare(token, owner, { enabled: true, password: null });
  assert.deepEqual(await getTextAiShare(token), original);
  await updateTextAiShare(token, owner, { enabled: false });
  assert.equal(await getTextAiShare(token), null);
  assert.equal(await updateTextAiShare(token, owner, { view }), false);
  assert.equal(await getTextAiShare(token), null);
});
