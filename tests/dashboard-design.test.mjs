import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_DASHBOARD_DESIGN, normalizeDashboardDesign, getDashboardDesignColors, getDashboardDesignColorVars, getReadableDesignColor, getTextAiDashboardDesign, saveTextAiDashboardDesign } from '../src/data/dashboard-design.ts';

test('stored values are validated and unknown/malformed values fall back safely', () => {
  for (const value of [null, undefined, 42, [], { theme: '__proto__', palette: 'unknown', typography: { fontFamily: { value: 'url(evil)' } } }]) {
    assert.deepEqual(normalizeDashboardDesign(value), DEFAULT_DASHBOARD_DESIGN);
  }
});

test('palette changes do not overwrite sentiment meaning, and sentiment changes do not overwrite series', () => {
  const base = getDashboardDesignColors(DEFAULT_DASHBOARD_DESIGN);
  const sequential = getDashboardDesignColors({ ...DEFAULT_DASHBOARD_DESIGN, palette: 'sequential' });
  assert.notDeepEqual(base.palette, sequential.palette);
  assert.deepEqual(base.sentiment, sequential.sentiment);
  const contrast = getDashboardDesignColors({ ...DEFAULT_DASHBOARD_DESIGN, sentiment: 'high-contrast' });
  assert.deepEqual(base.palette, contrast.palette);
  assert.notDeepEqual(base.sentiment, contrast.sentiment);
  const vars = getDashboardDesignColorVars({ ...DEFAULT_DASHBOARD_DESIGN, sentiment: 'high-contrast' });
  assert.equal(vars['--dashboard-sentiment-veryNegative'], '#a50026');
  assert.equal(vars['--dashboard-sentiment-veryPositive'], '#006837');
  assert.equal(vars['--dashboard-sentiment-neutral'], '#bdbdbd');
  assert.equal(getReadableDesignColor('#ffffff'), '#111111');
  assert.equal(getReadableDesignColor('#000000'), '#ffffff');
});

test('saving is isolated per dashboard and survives reading a fresh object', () => {
  const data = new Map();
  globalThis.window = { localStorage: { getItem: (key) => data.get(key), setItem: (key, value) => data.set(key, value) } };
  try {
    const modern = { ...DEFAULT_DASHBOARD_DESIGN, theme: 'modern', palette: 'diverging' };
    assert.equal(saveTextAiDashboardDesign(1, modern), true);
    assert.deepEqual(getTextAiDashboardDesign(1), modern);
    assert.deepEqual(getTextAiDashboardDesign(2), DEFAULT_DASHBOARD_DESIGN);
    data.set('text-ai-dashboard-design:2', '{broken');
    assert.deepEqual(getTextAiDashboardDesign(2), DEFAULT_DASHBOARD_DESIGN);
    window.localStorage.setItem = () => { throw new Error('quota exceeded'); };
    assert.equal(saveTextAiDashboardDesign(1, DEFAULT_DASHBOARD_DESIGN), false);
    assert.deepEqual(getTextAiDashboardDesign(1), modern);
  } finally { delete globalThis.window; }
});
