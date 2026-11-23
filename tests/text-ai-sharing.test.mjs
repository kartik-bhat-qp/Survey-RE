import assert from 'node:assert/strict';
import test from 'node:test';
import { textAiSharedResponseValue } from '../src/data/mock-text-ai-widget-data.ts';
import { DEFAULT_TEXT_AI_SHARING, textAiSharePath, textAiSharingStorageKey } from '../src/data/text-ai-sharing.ts';
import { dashboardSharingStorageKey } from '../src/data/mock-shared-urls.ts';
import { getTextAiLanguageDemo, TEXT_AI_LANGUAGE_DEMOS, textAiLanguageDemoRows, textAiLanguageDemoSummary } from '../src/data/mock-text-ai-language-demos.ts';

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

test('language demos pair every original response with its English translation', () => {
  assert.deepEqual(TEXT_AI_LANGUAGE_DEMOS.map(demo => demo.language.code), ['es', 'fr', 'de']);
  for (const demo of TEXT_AI_LANGUAGE_DEMOS) {
    assert.equal(getTextAiLanguageDemo(demo.id), demo);
    assert.ok(demo.comments.length > 1);
    const rows = textAiLanguageDemoRows(demo);
    assert.equal(rows.length, demo.comments.length);
    rows.forEach((row, index) => {
      assert.equal(textAiSharedResponseValue(row, true), demo.comments[index].original);
      assert.equal(textAiSharedResponseValue(row, false), demo.comments[index].english);
      assert.notEqual(row.value, row.translatedValue);
    });
    assert.equal(textAiLanguageDemoSummary(demo).question, demo.question);
  }
  assert.equal(getTextAiLanguageDemo(1), undefined);
});
