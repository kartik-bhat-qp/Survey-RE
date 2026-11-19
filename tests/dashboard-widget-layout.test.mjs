import test from 'node:test';
import assert from 'node:assert/strict';
import { AI_DASHBOARD_WIDGETS, AI_DASHBOARD_LAYOUT, createDashboardLayout } from '../src/data/mock-ai-widgets.ts';
import { stackLayoutSingleColumn, enforceFullWidthWidgets } from '../src/lib/ai-dashboard-layout.ts';
import { heatMapWidgetStorageKey, discardRetiredHeatMapCollections } from '../src/data/heat-map-baseline.ts';

test('driver widgets fill a dedicated row while ordinary widgets retain their two-column layout', () => {
  assert.equal(AI_DASHBOARD_LAYOUT.length, AI_DASHBOARD_WIDGETS.length);
  const driver = AI_DASHBOARD_LAYOUT.find(item => item.i === 'w-driver-analysis');
  assert.equal(driver.x, 0); assert.equal(driver.w, 12);
  assert.equal(driver.minW, 12); assert.equal(driver.maxW, 12);
  assert.deepEqual(driver.resizeHandles, ['s']);
  for (const item of AI_DASHBOARD_LAYOUT.filter(item => item.i !== driver.i)) {
    assert.equal(item.w, 6); assert.equal(item.minW, 2); assert.equal(item.h, 8);
  }
  for (const item of AI_DASHBOARD_LAYOUT.filter(item => item.i !== driver.i)) {
    assert.ok(item.y + item.h <= driver.y || item.y >= driver.y + driver.h);
  }
});
test('a restored or resized driver is forced to full width without changing its height or other widgets', () => {
  const previous = [{ i: 'driver', x: 6, y: 3, w: 4, h: 12 }, { i: 'ordinary', x: 0, y: 0, w: 3, h: 4 }];
  const next = enforceFullWidthWidgets(previous, new Set(['driver']), 12);
  assert.deepEqual([next[0].x, next[0].w, next[0].minW, next[0].maxW, next[0].h], [0,12,12,12,12]);
  assert.equal(next[1], previous[1]); assert.equal(previous[0].w,4);
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
