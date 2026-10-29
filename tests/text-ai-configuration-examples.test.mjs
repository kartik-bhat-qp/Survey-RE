import assert from 'node:assert/strict';
import test from 'node:test';
import { createConfigurationResponseExamples } from '../src/data/mock-text-ai-configuration-responses.ts';
import { ensureOutlierTheme, RESTAURANT_THEME_GROUPS } from '../src/data/text-ai-censored-subthemes.ts';

test('configuration examples add three uniquely identified responses to every baseline sub-theme', () => {
  const groups = ensureOutlierTheme(RESTAURANT_THEME_GROUPS);
  const rows = createConfigurationResponseExamples(groups);
  const keys = groups.flatMap(group => group.subThemes.map(sub => `${group.id}:${sub.id}`));
  assert.equal(rows.length, keys.length * 3);
  assert.equal(new Set(rows.map(row => row.id)).size, rows.length);
  for (const key of keys) assert.equal(rows.filter(row => row.subthemes.some(tag => tag.id === key)).length, 3);
  assert.deepEqual(createConfigurationResponseExamples(groups), rows);
  assert.ok(rows.filter(row => row.subthemes[0].id === 'outlier:censored').every(row => row.subthemes.length === 1));
  assert.ok(createConfigurationResponseExamples(ensureOutlierTheme(RESTAURANT_THEME_GROUPS, true, false)).every(row => row.subthemes[0].id !== 'outlier:censored'));
});
