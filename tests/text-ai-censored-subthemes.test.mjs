import assert from 'node:assert/strict';
import test from 'node:test';
import { CENSORED_TAG, CENSORED_TAG_ID, RESTAURANT_RESPONSES, restaurantResponses, isCensoredResponse, visibleCensoredResponses, addCensoredAwareTags, getDashboardExampleResponses, getOutlierDashboardRows, requiresCensoredRelease, parseCensoredReleases, rememberCensoredReleases, recodeCensoredAssignments, automaticCensoredAssignments } from '../src/data/text-ai-censored-subthemes.ts';
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
  const tagged = { ...RESTAURANT_RESPONSES[8], subthemes: [CENSORED_TAG, other] };
  assert.equal(tagged.subthemes.length, 2);
  assert.equal(visibleCensoredResponses([tagged], false).length, 0);
  assert.equal(visibleCensoredResponses([tagged], true).length, 1);
  assert.deepEqual(addCensoredAwareTags([other], [CENSORED_TAG], false), [CENSORED_TAG]);
});

test('adding a regular tag to Censored requires confirmation and replaces Censored atomically', () => {
  const ordinary = RESTAURANT_RESPONSES[0].subthemes[0];
  const before = [CENSORED_TAG];
  assert.equal(requiresCensoredRelease(before, [ordinary]), true);
  assert.throws(() => addCensoredAwareTags(before, [ordinary], true), /Confirm/);
  assert.deepEqual(before, [CENSORED_TAG]);
  assert.deepEqual(addCensoredAwareTags(before, [ordinary], true, true), [ordinary]);
  assert.deepEqual(addCensoredAwareTags([ordinary], [ordinary], true), [ordinary]);
  assert.equal(requiresCensoredRelease([CENSORED_TAG, ordinary], [ordinary]), false);
});

test('saved individual and bulk releases survive automatic recoding and serialization', () => {
  const automatic = automaticCensoredAssignments('restaurant-feedback-q1', true);
  const keys = Object.keys(automatic);
  const ordinary = RESTAURANT_RESPONSES[0].subthemes[0];
  let drafts = {};
  drafts = stageTagAssignment(drafts, keys[0], automatic[keys[0]], [ordinary]);
  drafts = stageTagAssignment(drafts, keys[1], automatic[keys[1]], []);
  const assignments = commitTagDrafts(automatic, drafts);
  const releases = rememberCensoredReleases({}, assignments, drafts);
  const persisted = JSON.parse(JSON.stringify({ assignments, releases }));
  const recoded = recodeCensoredAssignments(persisted.assignments, automatic, parseCensoredReleases(persisted.releases));
  assert.deepEqual(recoded[keys[0]], [ordinary]);
  assert.deepEqual(recoded[keys[1]], []);
  assert.deepEqual(recoded[keys[2]], [CENSORED_TAG]);
  assert.equal(visibleCensoredResponses(restaurantResponses(recoded), false).length, 10);
  assert.deepEqual(recodeCensoredAssignments(recoded, automatic, releases), recoded);
});

test('legacy restaurant and shared Outlier releases migrate without releasing untouched responses', () => {
  const restaurantKey = 'restaurant-feedback-q1:medium:9';
  const sharedKey = 'q1:outlier:100004';
  const otherQuestion = 'q2:outlier:100004';
  const releases = rememberCensoredReleases({}, { [restaurantKey]: [], [sharedKey]: [], [otherQuestion]: [CENSORED_TAG], 'q1:medium:9': [] });
  assert.deepEqual(releases, { [restaurantKey]: true, [sharedKey]: true });
  const automatic = { ...automaticCensoredAssignments('q1', false), ...automaticCensoredAssignments('q2', false) };
  const recoded = recodeCensoredAssignments({ [sharedKey]: [] }, automatic, releases);
  assert.deepEqual(recoded[sharedKey], []);
  assert.deepEqual(recoded[otherQuestion], [CENSORED_TAG]);
});

test('discarded releases do not create a durable marker and saved markers cannot be lost by later saves', () => {
  const key = 'restaurant-feedback-q1:medium:9';
  const saved = { [key]: [CENSORED_TAG] };
  const drafts = stageTagAssignment({}, key, saved[key], []);
  assert.deepEqual(rememberCensoredReleases({}, saved), {});
  const releases = rememberCensoredReleases({}, commitTagDrafts(saved, drafts), drafts);
  assert.deepEqual(rememberCensoredReleases(releases, {}, {}), { [key]: true });
  assert.deepEqual(recodeCensoredAssignments(saved, saved, {}), saved);
});

test('release metadata rejects corrupt values and safely handles older snapshots', () => {
  assert.deepEqual(parseCensoredReleases(undefined), {});
  assert.throws(() => parseCensoredReleases({ key: false }), /Invalid/);
  assert.throws(() => parseCensoredReleases([]), /Invalid/);
  assert.throws(() => parseCensoredReleases(null), /Invalid/);
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
