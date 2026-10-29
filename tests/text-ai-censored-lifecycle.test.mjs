import assert from 'node:assert/strict';
import test from 'node:test';
import { CENSORED_TAG, CENSORED_TAG_ID, containsCensoredResponse, ensureOutlierTheme, syncCensoredResponses, getDashboardExampleResponses, recodeCensoredAssignments, automaticCensoredAssignments, outlierResponseKey } from '../src/data/text-ai-censored-subthemes.ts';

const initial = { id: 1, name: 'Lifecycle', processedResponseIds: [], creationPreferences: { censoredSubthemesEnabled: true } };
const deletedFrames = { 'q1:medium:': [{ ...ensureOutlierTheme([])[0], subThemes: [] }] };
const incoming = [{ id: 'pending-1', text: 'Unrelated spam example', censored: true }];

test('single or mixed censored selection blocks actions until every Censored tag is removed', () => {
  const ordinary = { subthemes: [{ id: 'music:performance', label: 'Performance' }] };
  const censored = { subthemes: [CENSORED_TAG] };
  assert.equal(containsCensoredResponse([censored]), true);
  assert.equal(containsCensoredResponse([ordinary, censored]), true);
  assert.equal(containsCensoredResponse([ordinary, { subthemes: [] }]), false);
  assert.equal(containsCensoredResponse([]), false);
});

test('deleted Censored stays absent until fresh qualifying sync, which restores only Censored', () => {
  assert.equal(ensureOutlierTheme(deletedFrames['q1:medium:'], false)[0].subThemes.length, 0);
  const noMatch = syncCensoredResponses(initial, ['q1'], [{ ...incoming[0], censored: false }], deletedFrames);
  assert.deepEqual(noMatch.codeFrames, deletedFrames);
  const synced = syncCensoredResponses(initial, ['q1'], incoming, deletedFrames);
  assert.deepEqual(synced.codeFrames['q1:medium:'][0].subThemes.map(sub => sub.id), ['censored']);
  assert.equal(synced.dashboard.syncedCensoredResponses.length, 1);
  const rows = getDashboardExampleResponses(1, 'q1', {}, true, synced.dashboard.syncedCensoredResponses);
  assert.equal(rows.filter(row => row.text === incoming[0].text).length, 1);
  const repeat = syncCensoredResponses(synced.dashboard, ['q1'], incoming, deletedFrames);
  assert.deepEqual(repeat.codeFrames, deletedFrames);
  assert.equal(repeat.dashboard.syncedCensoredResponses.length, 1);
  assert.deepEqual(syncCensoredResponses({ ...initial, processedResponseIds: ['pending-1'] }, ['q1'], incoming, deletedFrames).codeFrames, deletedFrames);
});

test('sync respects creation opt-out and preserves old and newly released response exclusions during recoding', () => {
  const optedOut = { ...initial, creationPreferences: { censoredSubthemesEnabled: false } };
  assert.equal(syncCensoredResponses(optedOut, ['q1'], incoming, deletedFrames).dashboard, optedOut);
  const synced = syncCensoredResponses(initial, ['q1'], incoming, deletedFrames);
  const key = outlierResponseKey('q1', synced.dashboard.syncedCensoredResponses[0].id);
  const oldKey = outlierResponseKey('q1', 100004);
  const saved = { [key]: [], [oldKey]: [] };
  const recoded = recodeCensoredAssignments(saved, automaticCensoredAssignments('q1', false, synced.dashboard.syncedCensoredResponses), { [key]: true, [oldKey]: true });
  assert.ok(recoded[key].every(tag => tag.id !== CENSORED_TAG_ID));
  assert.ok(recoded[oldKey].every(tag => tag.id !== CENSORED_TAG_ID));
});
