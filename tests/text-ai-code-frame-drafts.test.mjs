import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeCodeFrameItems, parseCodeFrames, remapResponseTags, removeCodeFrameItems, stageCodeFrame, summarizeCodeFrameDrafts, validateCodeFrameName } from '../src/data/text-ai-code-frame-drafts.ts';
import { commitTagDrafts, stageTagAssignment } from '../src/data/text-ai-tag-drafts.ts';

const sub = (id, name = id) => ({ id, name, percentage: '0%' });
const theme = (id, subs = []) => ({ id, name: id, tone: 'blue', percentage: '0%', subThemes: subs });
const baseline = [theme('a', [sub('x'), sub('y')]), theme('b', [sub('z')])];
const scope = 'q1:medium:';
const tag = (id, sentiment = 'positive') => ({ id, label: id, sentiment });

test('create then delete a draft theme clears pending structure without touching the baseline', () => {
  const created = [...baseline, theme('new', [sub('child')])];
  const drafts = stageCodeFrame({}, scope, baseline, created);
  assert.equal(summarizeCodeFrameDrafts(drafts).themesAdded, 1);
  assert.equal(summarizeCodeFrameDrafts(drafts).subThemesAdded, 1);
  assert.deepEqual(stageCodeFrame(drafts, scope, created, removeCodeFrameItems(created, ['new'], [])), {});
  assert.equal(baseline.length, 2);
});

test('theme deletion includes children; individual sub-theme deletion preserves its parent', () => {
  const deleted = removeCodeFrameItems(baseline, ['a'], []);
  assert.deepEqual(deleted, [baseline[1]]);
  const summary = summarizeCodeFrameDrafts(stageCodeFrame({}, scope, baseline, deleted));
  assert.equal(summary.themesDeleted, 1);
  assert.equal(summary.subThemesDeleted, 0);
  const childOnly = removeCodeFrameItems(baseline, [], ['a:x']);
  assert.deepEqual(childOnly[0].subThemes, [sub('y')]);
  assert.equal(summarizeCodeFrameDrafts(stageCodeFrame({}, scope, baseline, childOnly)).subThemesDeleted, 1);
});

test('cross-theme merge preserves unrelated items and counts one merge', () => {
  const merged = mergeCodeFrameItems(baseline, ['a:x', 'b:z'], 'a', sub('merged'));
  assert.deepEqual(merged[0].subThemes.map((sub) => sub.id), ['y', 'merged']);
  assert.deepEqual(merged[1].subThemes, []);
  const summary = summarizeCodeFrameDrafts(stageCodeFrame({}, scope, baseline, merged));
  assert.equal(summary.merges, 1);
  assert.equal(summary.subThemesAdded, 0);
  assert.equal(summary.subThemesDeleted, 0);
});

test('merging overlapping assignments produces one tag and keeps raw response data', () => {
  const response = { id: 7, text: 'Original response', subthemes: [tag('a:x'), tag('b:z'), tag('a:y')] };
  const after = remapResponseTags(response.subthemes, new Set(['a:x', 'b:z']), tag('a:merged'));
  assert.deepEqual(after.map((tag) => tag.id), ['a:y', 'a:merged']);
  assert.equal(after[1].sentiment, 'positive');
  assert.equal(response.text, 'Original response');
  assert.equal(response.subthemes.length, 3);
  assert.equal(remapResponseTags([tag('a:x', 'negative'), tag('b:z')], new Set(['a:x', 'b:z']), tag('a:merged'))[0].sentiment, 'neutral');
});

test('deleting a new tagged sub-theme reverses both the structural and response draft', () => {
  const added = [{ ...baseline[0], subThemes: [...baseline[0].subThemes, sub('new')] }, baseline[1]];
  const structural = stageCodeFrame({}, scope, baseline, added);
  let assignments = stageTagAssignment({}, `${scope}1`, [tag('a:x')], [tag('a:x'), tag('a:new')]);
  const after = remapResponseTags(assignments[`${scope}1`].after, new Set(['a:new']));
  assignments = stageTagAssignment(assignments, `${scope}1`, [], after);
  assert.deepEqual(assignments, {});
  assert.deepEqual(stageCodeFrame(structural, scope, added, removeCodeFrameItems(added, [], ['a:new'])), {});
});

test('discard restores the saved structure and assignments; batches survive serialization', () => {
  const saved = { codeFrames: { [scope]: baseline }, assignments: { [`${scope}1`]: [tag('a:x')] } };
  const deleted = removeCodeFrameItems(baseline, ['a'], []);
  const drafts = stageCodeFrame({}, scope, baseline, deleted);
  assert.equal(summarizeCodeFrameDrafts(drafts).themesDeleted, 1);
  assert.deepEqual(commitTagDrafts(saved.assignments, {}), saved.assignments);
  assert.deepEqual(parseCodeFrames(JSON.parse(JSON.stringify(saved)).codeFrames), saved.codeFrames);
});

test('scopes remain independent and invalid names/merge selections cannot be submitted', () => {
  let drafts = stageCodeFrame({}, scope, baseline, [...baseline, theme('new')]);
  drafts = stageCodeFrame(drafts, 'q2:medium:', baseline, removeCodeFrameItems(baseline, [], ['a:x']));
  assert.equal(Object.keys(drafts).length, 2);
  assert.ok(validateCodeFrameName('  SPEED ', ['Speed']));
  assert.ok(validateCodeFrameName('   ', []));
  assert.equal(validateCodeFrameName(' Service ', []), null);
  assert.throws(() => mergeCodeFrameItems(baseline, ['a:x'], 'a', sub('m')));
  assert.throws(() => mergeCodeFrameItems(baseline, ['a:x', 'a:y'], 'missing', sub('m')));
  assert.throws(() => parseCodeFrames({ broken: [{}] }));
});
