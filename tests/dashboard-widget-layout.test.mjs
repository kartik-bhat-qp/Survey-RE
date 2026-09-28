import test from 'node:test';
import assert from 'node:assert/strict';
import { AI_DASHBOARD_WIDGETS, AI_DASHBOARD_LAYOUT, createDashboardLayout } from '../src/data/mock-ai-widgets.ts';
import { stackLayoutSingleColumn } from '../src/lib/ai-dashboard-layout.ts';
import { heatMapWidgetStorageKey, discardRetiredHeatMapCollections } from '../src/data/heat-map-baseline.ts';

test('every default widget has one equal-width column and desktop rows are paired', () => {
  assert.equal(AI_DASHBOARD_WIDGETS.filter(widget => widget.type === 'heat-map').length, 1);
  assert.equal(AI_DASHBOARD_LAYOUT.length, AI_DASHBOARD_WIDGETS.length);
  for (let index = 0; index < AI_DASHBOARD_LAYOUT.length; index++) {
    const item = AI_DASHBOARD_LAYOUT[index];
    assert.equal(item.i, AI_DASHBOARD_WIDGETS[index].id);
    assert.equal(item.w, 1);
    assert.equal(item.maxW, 1);
    assert.equal(item.x, index % 2);
    assert.equal(item.y, Math.floor(index / 2));
    assert.equal(item.h, 1);
  }
});
test('mobile stacks every fixed widget without losing order', () => {
  const desktop = createDashboardLayout(AI_DASHBOARD_WIDGETS);
  const mobile = stackLayoutSingleColumn(desktop);
  assert.deepEqual(mobile.map(item => item.i), desktop.map(item => item.i));
  assert.ok(mobile.every((item, index) => item.x === 0 && item.y === index && item.w === 1 && item.maxW === 1));
});
test('settings isolation includes dashboard, tab and widget identities', () => {
  const keys = new Set([heatMapWidgetStorageKey(1,'tab-1','w-heat-map'), heatMapWidgetStorageKey(2,'tab-1','w-heat-map'), heatMapWidgetStorageKey(1,'tab-2','w-heat-map'), heatMapWidgetStorageKey(1,'tab-1','other-fixed-widget')]);
  assert.equal(keys.size, 4);
});

test('retirement removes only obsolete dynamic heat-map records and keeps fixed settings', () => {
  const fixed = heatMapWidgetStorageKey(2,'tab-1','w-heat-map');
  const retired = heatMapWidgetStorageKey(2,'tab-1','w-heat-map-39ee8c30-9b5d-4b4c-bade-627badf1970e');
  const values = new Map([[fixed,'settings'],[retired,'old settings'],['survey-re:dashboard:2:added-heat-maps:v1','old collection'],['unrelated-app','keep'],['survey-re:dashboard:2:sharing','keep']]);
  const storage = { get length() { return values.size; }, key(index) { return [...values.keys()][index] ?? null; }, removeItem(key) { values.delete(key); } };
  discardRetiredHeatMapCollections(storage);
  assert.deepEqual([...values.keys()], [fixed,'unrelated-app','survey-re:dashboard:2:sharing']);
});
