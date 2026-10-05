import assert from 'node:assert/strict';
import test from 'node:test';
import { filterThemeResponses } from '../src/data/text-ai-theme-configuration-view.ts';
import { moveCodeFrameItems, stageCodeFrame, summarizeCodeFrameDrafts } from '../src/data/text-ai-code-frame-drafts.ts';
import { ensureOutlierTheme } from '../src/data/text-ai-censored-subthemes.ts';

const tag = (id, sentiment = 'neutral') => ({ id, label: id, sentiment });
const row = (id, tags) => ({ id, text: `Response ${id}`, subthemes: tags, responseSentiment: 'neutral', responseSentimentOverride: null });
const rows = [row(1, []), row(2, [tag('a:x', 'positive')]), row(3, [tag('a:x'), tag('b:y')]), row(4, [tag('b:y')]), row(100004, [tag('outlier:censored'), tag('a:x')])];
const filters = { showCensored: false, subthemeIds: new Set(), search: '', minimumTags: 'all', newestFirst: false, sentiment: '', startDate: '', endDate: '' };

test('selected sub-themes filter responses by their union and retain all tags on matching responses', () => {
  const selected = filterThemeResponses(rows, { ...filters, subthemeIds: new Set(['a:x', 'b:y']) });
  assert.deepEqual(selected.map(row => row.id), [2, 3, 4]);
  assert.equal(selected.find(row => row.id === 3).subthemes.length, 2);
  assert.equal(filterThemeResponses(rows, { ...filters, showCensored: true, subthemeIds: new Set(['a:x']) }).length, 3);
});
test('tag count and search filters never expose a hidden censored response through another tag', () => {
  assert.deepEqual(filterThemeResponses(rows, { ...filters, minimumTags: 'untagged' }).map(row => row.id), [1]);
  assert.deepEqual(filterThemeResponses(rows, { ...filters, minimumTags: 2 }).map(row => row.id), [3]);
  assert.deepEqual(filterThemeResponses(rows, { ...filters, search: 'a:x' }).map(row => row.id), []);
  assert.deepEqual(filterThemeResponses(rows, { ...filters, search: '100004' }), []);
});
test('collection-date sorting, date boundaries, sentiments and empty results work together', () => {
  assert.deepEqual(filterThemeResponses(rows, { ...filters, newestFirst: true }).map(row => row.id), [4, 3, 2, 1]);
  assert.deepEqual(filterThemeResponses(rows, { ...filters, startDate: '2026-09-02', endDate: '2026-09-03' }).map(row => row.id), [2, 3]);
  assert.deepEqual(filterThemeResponses(rows, { ...filters, sentiment: 'positive' }).map(row => row.id), [2]);
  assert.deepEqual(filterThemeResponses(rows, { ...filters, startDate: '2026-10-01' }), []);
});
test('moving sub-themes preserves descriptions and memberships with colliding child IDs', () => {
  const groups = [{ id: 'a', name: 'A', tone: 'blue', percentage: '0%', subThemes: [{ id: 'x', name: 'First', description: 'Retained description', percentage: '10%' }] },
    { id: 'b', name: 'B', tone: 'green', percentage: '0%', subThemes: [{ id: 'x', name: 'Second', percentage: '20%' }] }];
  const moved = moveCodeFrameItems(groups, ['a:x'], 'b');
  assert.equal(moved.groups[0].subThemes.length, 0);
  assert.equal(moved.groups[1].subThemes.length, 2);
  assert.equal(moved.groups[1].subThemes[1].description, 'Retained description');
  assert.notEqual(moved.tagIds['a:x'], 'b:x');
  assert.equal(groups[0].subThemes.length, 1);
  const rename = groups.map(group => group.id === 'a' ? { ...group, name: 'Renamed' } : group);
  const drafts = stageCodeFrame({}, 'q1:medium:', groups, rename);
  assert.equal(summarizeCodeFrameDrafts(drafts).themesUpdated, 1);
  assert.equal(summarizeCodeFrameDrafts(drafts).changes, 1);
  assert.deepEqual(stageCodeFrame(drafts, 'q1:medium:', rename, groups), {});
});
test('saved code frames gain missing Outlier while deliberate edits to its ordinary children persist', () => {
  const seeded = ensureOutlierTheme([]);
  const edited = [{ ...seeded[0], subThemes: seeded[0].subThemes.filter(sub => sub.id !== 'unmatched') }];
  assert.equal(ensureOutlierTheme(edited, false)[0].subThemes.some(sub => sub.id === 'unmatched'), false);
  assert.equal(ensureOutlierTheme(edited, false)[0].subThemes.some(sub => sub.id === 'censored'), true);
  assert.equal(ensureOutlierTheme([], false)[0].subThemes.length, 4);
  assert.throws(() => moveCodeFrameItems(seeded, ['outlier:censored'], 'missing'), /destination/);
});
