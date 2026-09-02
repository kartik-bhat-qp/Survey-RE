import assert from 'node:assert/strict';
import test from 'node:test';
import {
  selectThemeReference,
  toggleDashboardReference,
} from '../src/data/ai-dashboard-references.ts';

const emptySelection = () => ({
  dashboardIds: [],
  themeReferenceDashboardId: null,
});

test('the first learned dashboard becomes the theme reference', () => {
  const selection = toggleDashboardReference(emptySelection(), 101);

  assert.deepEqual(selection, {
    dashboardIds: [101],
    themeReferenceDashboardId: 101,
  });
});

test('theme reference can only be changed to a selected dashboard', () => {
  const selected = toggleDashboardReference(
    toggleDashboardReference(emptySelection(), 101),
    102
  );

  assert.equal(selectThemeReference(selected, 102).themeReferenceDashboardId, 102);
  assert.equal(selectThemeReference(selected, 103), selected);
});

test('removing the theme reference promotes the next selected dashboard', () => {
  const selected = selectThemeReference(
    toggleDashboardReference(toggleDashboardReference(emptySelection(), 101), 102),
    102
  );

  assert.deepEqual(toggleDashboardReference(selected, 102), {
    dashboardIds: [101],
    themeReferenceDashboardId: 101,
  });
});

test('selection remains capped at five dashboards', () => {
  const selected = [101, 102, 103, 104, 105].reduce(
    (selection, id) => toggleDashboardReference(selection, id),
    emptySelection()
  );

  assert.equal(toggleDashboardReference(selected, 106), selected);
});
