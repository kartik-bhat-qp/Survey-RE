import assert from 'node:assert/strict';
import test from 'node:test';
import { textAiSharedResponseValue } from '../src/data/mock-text-ai-widget-data.ts';
import { DEFAULT_TEXT_AI_SHARING, textAiSharePath, textAiSharingStorageKey } from '../src/data/text-ai-sharing.ts';
import { dashboardSharingStorageKey } from '../src/data/mock-shared-urls.ts';

test('shared Text Viewer selects the stored translation or the exact original response', () => {
  const source = { id: 4, value: 'bessere Kommunikation', translatedValue: 'Better communication', tags: ['communication'] };
  assert.equal(textAiSharedResponseValue(source, false), 'Better communication');
  assert.equal(textAiSharedResponseValue(source, true), 'bessere Kommunikation');
  assert.equal(textAiSharedResponseValue({ value: 'English response' }, false), 'English response');
  assert.equal(textAiSharedResponseValue({ value: 'No translation', translatedValue: '' }, false), 'No translation');
  assert.deepEqual(source.tags, ['communication']);
});

test('TextAI previews are opt-in and use dashboard-scoped links and sharing settings', () => {
  assert.equal(DEFAULT_TEXT_AI_SHARING.enabled, false);
  assert.equal(DEFAULT_TEXT_AI_SHARING.showOriginalResponses, false);
  assert.equal(textAiSharePath(42), '/text-ai/42/shared');
  assert.notEqual(textAiSharingStorageKey(42), textAiSharingStorageKey(43));
  assert.notEqual(textAiSharingStorageKey(42), dashboardSharingStorageKey(42));
});
