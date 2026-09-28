import assert from 'node:assert/strict';
import test from 'node:test';
import { stageTagAssignment, summarizeTagDrafts, commitTagDrafts, parseTagAssignments } from '../src/data/text-ai-tag-drafts.ts';

const service = { id: 'service:speed', label: 'Speed', sentiment: 'negative' };
const staff = { id: 'staff:friendliness', label: 'Friendliness', sentiment: 'positive' };
const key = 'q1:medium:1';

test('staging leaves saved assignments untouched; only commit publishes the batch', () => {
  const saved = { [key]: [service], 'q2:medium:1': [staff] };
  const drafts = stageTagAssignment({}, key, saved[key], [staff]);
  assert.deepEqual(saved[key], [service]);
  assert.deepEqual(summarizeTagDrafts(drafts), { added: 1, removed: 1, changes: 2, responses: 1 });
  const committed = commitTagDrafts(saved, drafts);
  assert.deepEqual(committed[key], [staff]);
  assert.deepEqual(committed['q2:medium:1'], [staff]);
  assert.deepEqual(commitTagDrafts(saved, {}), saved); // Cancel uses the saved baseline.
});

test('remove then restore, or add then remove, produces no pending changes', () => {
  const removed = stageTagAssignment({}, key, [service], []);
  assert.deepEqual(stageTagAssignment(removed, key, [], [service]), {});
  const added = stageTagAssignment({}, key, [service], [service, staff]);
  assert.deepEqual(stageTagAssignment(added, key, [service, staff], [service]), {});
});

test('repeated edits compare against the original baseline and deduplicate assignments', () => {
  let drafts = stageTagAssignment({}, key, [service], [service, staff, staff]);
  drafts = stageTagAssignment(drafts, key, [service, staff], [staff]);
  assert.deepEqual(drafts[key].before, [service]);
  assert.deepEqual(summarizeTagDrafts(drafts), { added: 1, removed: 1, changes: 2, responses: 1 });
  assert.deepEqual(stageTagAssignment({}, key, [service, staff], [staff, service]), {});
});

test('question and granularity scopes do not leak edits into responses with the same ID', () => {
  let drafts = stageTagAssignment({}, key, [service], []);
  drafts = stageTagAssignment(drafts, 'q2:medium:1', [staff], [staff, service]);
  drafts = stageTagAssignment(drafts, 'q1:high:1', [service], []);
  assert.equal(summarizeTagDrafts(drafts).responses, 3);
  assert.deepEqual(commitTagDrafts({}, drafts), { [key]: [], 'q2:medium:1': [staff, service], 'q1:high:1': [] });
});

test('discard after a save retains the saved change, including a completely untagged response', () => {
  const saved = commitTagDrafts({}, stageTagAssignment({}, key, [service], []));
  const draft = stageTagAssignment({}, key, saved[key], [staff]);
  assert.equal(summarizeTagDrafts(draft).added, 1);
  assert.deepEqual(commitTagDrafts(saved, {}), { [key]: [] });
  assert.deepEqual(parseTagAssignments(JSON.stringify(saved)), saved);
});

test('invalid persisted data is rejected rather than silently overwriting saved work', () => {
  assert.deepEqual(parseTagAssignments(null), {});
  for (const input of ['bad JSON', '[]', 'null', '{"q":null}', '{"q":[{}]}']) {
    assert.throws(() => parseTagAssignments(input));
  }
});
