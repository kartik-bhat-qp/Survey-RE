import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createDashboardWidgetInsightThread,
  getNextAiInsightRefreshAt,
  refreshDashboardWidgetInsightThread,
} from '../src/data/mock-dashboard-ai-insights.ts';

test('refresh frequencies schedule the next run at 24 hours, 48 hours, or one week', () => {
  const refreshedAt = '2026-08-27T06:30:00.000Z';

  assert.equal(getNextAiInsightRefreshAt(refreshedAt, '24-hours'), '2026-08-28T06:30:00.000Z');
  assert.equal(getNextAiInsightRefreshAt(refreshedAt, '48-hours'), '2026-08-29T06:30:00.000Z');
  assert.equal(getNextAiInsightRefreshAt(refreshedAt, '1-week'), '2026-09-03T06:30:00.000Z');
});

test('refresh replaces only AI text and preserves user insights and every comment', () => {
  const thread = createDashboardWidgetInsightThread('w-map');
  const aiInsightBefore = thread.items.find((item) => item.kind === 'ai');
  const userInsightBefore = thread.items.find((item) => item.kind === 'user');

  assert.ok(aiInsightBefore);
  assert.ok(userInsightBefore);

  const refreshed = refreshDashboardWidgetInsightThread(
    thread,
    '2026-08-27T08:00:00.000Z'
  );
  const aiInsightAfter = refreshed.items.find((item) => item.kind === 'ai');
  const userInsightAfter = refreshed.items.find((item) => item.kind === 'user');

  assert.ok(aiInsightAfter);
  assert.ok(userInsightAfter);
  assert.notEqual(aiInsightAfter.text, aiInsightBefore.text);
  assert.deepEqual(aiInsightAfter.comments, aiInsightBefore.comments);
  assert.deepEqual(userInsightAfter, userInsightBefore);
  assert.equal(refreshed.lastRefreshedAt, '2026-08-27T08:00:00.000Z');
});
