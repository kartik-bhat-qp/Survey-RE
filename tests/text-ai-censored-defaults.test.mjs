import assert from 'node:assert/strict';
import test from 'node:test';
import { getTextAiThemePreferences } from '../src/data/text-ai-theme-preferences.ts';
import { CENSORED_TAG, normalizeCensoredSentiments, getOutlierDashboardRows } from '../src/data/text-ai-censored-subthemes.ts';

test('dashboard visibility defaults on for new and legacy preferences, preserving an explicit saved off choice', () => {
  const previousWindow = globalThis.window;
  const previousStorage = globalThis.localStorage;
  let stored = null;
  globalThis.window = {};
  globalThis.localStorage = { getItem: () => stored };
  try {
    assert.equal(getTextAiThemePreferences(23).showCensoredSubthemes, true);
    stored = JSON.stringify({ showThemesWithNoResponses: false });
    assert.equal(getTextAiThemePreferences(23).showCensoredSubthemes, true);
    assert.equal(getTextAiThemePreferences(23).showThemesWithNoResponses, false);
    stored = JSON.stringify({ showCensoredSubthemes: false });
    assert.equal(getTextAiThemePreferences(23).showCensoredSubthemes, false);
    stored = JSON.stringify({ showCensoredSubthemes: true });
    assert.equal(getTextAiThemePreferences(23).showCensoredSubthemes, true);
  } finally {
    if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow;
    if (previousStorage === undefined) delete globalThis.localStorage; else globalThis.localStorage = previousStorage;
  }
});

test('Censored responses and dashboard sentiment stay Neutral even with old saved sentiment overrides', () => {
  const censored = { id: 1, text: 'Synthetic unrelated content', responseSentiment: 'negative', responseSentimentOverride: 'very-negative', subthemes: [{ ...CENSORED_TAG, sentiment: 'negative' }] };
  const ordinary = { id: 2, text: 'Relevant criticism', responseSentiment: 'negative', responseSentimentOverride: 'negative', subthemes: [{ id: 'food:quality', label: 'Food quality', sentiment: 'negative' }] };
  const rows = normalizeCensoredSentiments([censored, ordinary]);
  assert.equal(rows[0].responseSentiment, 'neutral');
  assert.equal(rows[0].responseSentimentOverride, null);
  assert.equal(rows[0].subthemes[0].sentiment, 'neutral');
  assert.equal(rows[1], ordinary);
  assert.equal(censored.subthemes[0].sentiment, 'negative');
  const chart = getOutlierDashboardRows([censored], true, false);
  assert.equal(chart.sentimentRows[0].sentiment.neutral, 100);
  assert.equal(chart.sentimentRows[0].subthemes[0].sentiment.neutral, 100);
  const legacyMixed = { ...censored, subthemes: [...censored.subthemes, { id: 'food:quality', label: 'Food quality', sentiment: 'positive' }] };
  assert.equal(getOutlierDashboardRows([legacyMixed], true, false).analysisRows[0].subtopicTone, 'neutral');
});
