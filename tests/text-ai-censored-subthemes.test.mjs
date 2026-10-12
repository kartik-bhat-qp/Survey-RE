import assert from 'node:assert/strict';
import test from 'node:test';
import { CENSORED_TAG, CENSORED_TAG_ID, RESTAURANT_RESPONSES, restaurantResponses, isCensoredResponse, visibleCensoredResponses, addCensoredAwareTags, getDashboardExampleResponses, getOutlierDashboardRows } from '../src/data/text-ai-censored-subthemes.ts';
import { stageTagAssignment, commitTagDrafts } from '../src/data/text-ai-tag-drafts.ts';

test('automatic censorship is exclusive and does not censor actionable negative feedback', () => {
  const censored = RESTAURANT_RESPONSES.filter(isCensoredResponse);
  assert.equal(censored.length, 4);
  assert.ok(censored.every(response => response.subthemes.length === 1));
  assert.ok(!isCensoredResponse(RESTAURANT_RESPONSES[5]));
  assert.equal(visibleCensoredResponses(RESTAURANT_RESPONSES, false).length, 8);
  assert.equal(visibleCensoredResponses(RESTAURANT_RESPONSES, true).length, 12);
});
test('hidden mode excludes entire responses even when they carry additional tags', () => {
  const other = RESTAURANT_RESPONSES[0].subthemes[0];
  const tagged = { ...RESTAURANT_RESPONSES[8], subthemes: addCensoredAwareTags([CENSORED_TAG], [other], true) };
  assert.equal(tagged.subthemes.length, 2);
  assert.equal(visibleCensoredResponses([tagged], false).length, 0);
  assert.equal(visibleCensoredResponses([tagged], true).length, 1);
  assert.deepEqual(addCensoredAwareTags([other], [CENSORED_TAG], false), [CENSORED_TAG]);
});
test('bulk release retains text, preserves other tags and becomes visible only in committed dashboard state', () => {
  let drafts = {};
  for (const response of RESTAURANT_RESPONSES.filter(isCensoredResponse)) {
    drafts = stageTagAssignment(drafts, `restaurant-feedback-q1:medium:${response.id}`, response.subthemes, response.subthemes.filter(tag => tag.id !== CENSORED_TAG_ID));
  }
  assert.equal(visibleCensoredResponses(restaurantResponses({}), false).length, 8);
  const saved = commitTagDrafts({}, drafts);
  const after = restaurantResponses(saved);
  assert.equal(visibleCensoredResponses(after, false).length, 12);
  assert.ok(after.slice(8).every(response => response.subthemes.length === 0));
  assert.deepEqual(after.map(response => response.text), RESTAURANT_RESPONSES.map(response => response.text));
  assert.equal(visibleCensoredResponses(restaurantResponses(JSON.parse(JSON.stringify(saved))), false).length, 12);
});
test('release from a multi-tagged response preserves its regular assignment', () => {
  const ordinary = RESTAURANT_RESPONSES[0].subthemes[0];
  const before = [CENSORED_TAG, ordinary];
  const drafts = stageTagAssignment({}, 'restaurant-feedback-q1:medium:9', before, before.filter(tag => tag.id !== CENSORED_TAG_ID));
  const after = restaurantResponses(commitTagDrafts({}, drafts));
  assert.deepEqual(after[8].subthemes, [ordinary]);
  assert.equal(visibleCensoredResponses(after, false).length, 9);
});

test('every existing dashboard gets production Outlier children without losing saved code frames', async () => {
  const { ensureOutlierTheme, OUTLIER_THEME_GROUP, getSharedOutlierResponses } = await import('../src/data/text-ai-censored-subthemes.ts');
  const original = [{ id: 'custom', name: 'Saved custom theme', percentage: '0%', tone: 'blue', subThemes: [] }];
  const migrated = ensureOutlierTheme(original);
  assert.deepEqual(migrated[0], original[0]);
  assert.deepEqual(migrated[1], OUTLIER_THEME_GROUP);
  assert.deepEqual(ensureOutlierTheme(migrated), migrated);
  assert.equal(original.length, 1);
  const responses = getSharedOutlierResponses('existing-question', {});
  assert.equal(responses.length, 7);
  assert.equal(responses.filter(isCensoredResponse).length, 4);
  assert.equal(visibleCensoredResponses(responses, false).length, 3);
});

test('saved Outlier release is question-specific and remains independent of granularity', async () => {
  const { getSharedOutlierResponses, outlierResponseKey } = await import('../src/data/text-ai-censored-subthemes.ts');
  const response = getSharedOutlierResponses('q1', {}).find(isCensoredResponse);
  const saved = { [outlierResponseKey('q1', response.id)]: [] };
  assert.equal(visibleCensoredResponses(getSharedOutlierResponses('q1', saved), false).length, 4);
  assert.equal(visibleCensoredResponses(getSharedOutlierResponses('q2', saved), false).length, 3);
  assert.deepEqual(getSharedOutlierResponses('q1', JSON.parse(JSON.stringify(saved))).find(item => item.id === response.id).subthemes, []);
});

test('standard chart adapters include Censored as a normal neutral child only when enabled', () => {
  const source = getDashboardExampleResponses(1, 'q1', {});
  const hidden = getOutlierDashboardRows(source, false, true);
  const shown = getOutlierDashboardRows(source, true, true);
  assert.equal(hidden.analysisRows.length, 3);
  assert.equal(shown.analysisRows.length, 7);
  assert.ok(!hidden.analysisRows.some(row => row.tags.includes('Censored')));
  assert.ok(!hidden.sentimentRows[0].subthemes.some(row => row.id === CENSORED_TAG_ID));
  assert.ok(!hidden.comparisonRows[0].subtopics.some(row => row.id === CENSORED_TAG_ID));
  const sentiment = shown.sentimentRows[0].subthemes.find(row => row.id === CENSORED_TAG_ID);
  assert.equal(sentiment.mentions, 4);
  assert.equal(sentiment.sentiment.neutral, 100);
  assert.equal(shown.comparisonRows[0].subtopics.find(row => row.id === CENSORED_TAG_ID).overall.count, 4);
  assert.equal(shown.sentimentRows[0].mentions, 7);
  assert.equal(shown.comparisonRows[0].overall.count, 7);
});

test('McDonald’s uses its own saved response data within the shared dashboard widgets', () => {
  const questionId = 'restaurant-feedback-q1';
  const source = getDashboardExampleResponses(23, questionId, {});
  assert.deepEqual(source, RESTAURANT_RESPONSES);
  const hidden = getOutlierDashboardRows(source, false);
  assert.equal(hidden.analysisRows.length, 8);
  assert.equal(hidden.sentimentRows.length, 0);
  const shown = getOutlierDashboardRows(source, true);
  assert.equal(shown.analysisRows.length, 12);
  assert.equal(shown.comparisonRows[0].subtopics[0].overall.count, 4);
  const saved = { [`${questionId}:medium:9`]: [RESTAURANT_RESPONSES[0].subthemes[0]] };
  const released = getOutlierDashboardRows(getDashboardExampleResponses(23, questionId, saved), false);
  assert.equal(released.analysisRows.length, 9);
  assert.equal(released.analysisRows.find(row => row.id === 9).subtopic, 'Food quality');
  assert.equal(getOutlierDashboardRows(getDashboardExampleResponses(23, questionId, saved), true).comparisonRows[0].subtopics[0].overall.count, 3);
});

test('hidden mixed-tag Censored content cannot leak through any standard widget adapter', () => {
  const ordinary = RESTAURANT_RESPONSES[0].subthemes[0];
  const source = [{ ...RESTAURANT_RESPONSES[8], subthemes: [CENSORED_TAG, ordinary] }];
  const hidden = getOutlierDashboardRows(source, false);
  assert.deepEqual(hidden, { sentimentRows: [], comparisonRows: [], analysisRows: [] });
  const shown = getOutlierDashboardRows(source, true);
  assert.equal(shown.analysisRows[0].tags.length, 2);
  assert.equal(shown.comparisonRows[0].overall.count, 1);
  assert.equal(shown.sentimentRows[0].mentions, 1);
});
