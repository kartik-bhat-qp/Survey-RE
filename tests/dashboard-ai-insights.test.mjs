import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createDashboardWidgetInsightThread,
  failDashboardWidgetInsightRefresh,
  getNextAiInsightRefreshAt,
  isAiInsightRefreshFrequency,
  refreshDashboardWidgetInsightThread,
} from '../src/data/mock-dashboard-ai-insights.ts';

test('refresh frequencies schedule the next run at 24 hours, 48 hours, or one week', () => {
  const refreshedAt = '2026-08-27T06:30:00.000Z';

  assert.equal(getNextAiInsightRefreshAt(refreshedAt, '24-hours'), '2026-08-28T06:30:00.000Z');
  assert.equal(getNextAiInsightRefreshAt(refreshedAt, '48-hours'), '2026-08-29T06:30:00.000Z');
  assert.equal(getNextAiInsightRefreshAt(refreshedAt, '1-week'), '2026-09-03T06:30:00.000Z');
  assert.equal(isAiInsightRefreshFrequency('48-hours'), true);
  assert.equal(isAiInsightRefreshFrequency('daily'), false);
});

test('refresh archives the previous AI run with its engagement and starts a clean run', () => {
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
  assert.notEqual(aiInsightAfter.id, aiInsightBefore.id);
  assert.notEqual(aiInsightAfter.text, aiInsightBefore.text);
  assert.deepEqual(aiInsightAfter.comments, []);
  assert.equal(aiInsightAfter.likes, 0);
  assert.equal(aiInsightAfter.refreshTrigger, 'widget');
  assert.deepEqual(refreshed.pastAiRuns, [aiInsightBefore]);
  assert.deepEqual(userInsightAfter, userInsightBefore);
  assert.equal(refreshed.lastRefreshedAt, '2026-08-27T08:00:00.000Z');
});

test('dashboard refresh records its trigger and keeps newest past runs first', () => {
  const original = createDashboardWidgetInsightThread('w-map');
  const first = refreshDashboardWidgetInsightThread(
    original,
    '2026-08-27T08:00:00.000Z',
    'dashboard'
  );
  const second = refreshDashboardWidgetInsightThread(
    first,
    '2026-08-27T09:00:00.000Z',
    'dashboard'
  );

  assert.equal(second.items[0].refreshTrigger, 'dashboard');
  assert.equal(second.pastAiRuns.length, 2);
  assert.equal(second.pastAiRuns[0].id, first.items[0].id);
  assert.equal(second.pastAiRuns[1].id, original.items[0].id);
  assert.equal(second.items.length, original.items.length);
});

test('three refreshes preserve the likes and comments assigned to every archived run', () => {
  const original = createDashboardWidgetInsightThread('w-map');
  const originalAi = original.items.find((item) => item.kind === 'ai');
  assert.ok(originalAi);

  const first = refreshDashboardWidgetInsightThread(
    {
      ...original,
      items: original.items.map((item) =>
        item.kind === 'ai'
          ? {
              ...item,
              likes: 4,
              likedByViewer: true,
              comments: [
                ...item.comments,
                {
                  id: 'run-1-comment',
                  author: 'Prabal Gupta',
                  initials: 'PG',
                  text: 'Comment assigned to run 1',
                  createdAtLabel: 'Just now',
                },
              ],
            }
          : item
      ),
    },
    '2026-08-27T08:00:00.000Z'
  );
  const second = refreshDashboardWidgetInsightThread(
    {
      ...first,
      items: first.items.map((item) =>
        item.kind === 'ai'
          ? {
              ...item,
              likes: 1,
              likedByViewer: true,
              comments: [
                {
                  id: 'run-2-comment',
                  author: 'Prabal Gupta',
                  initials: 'PG',
                  text: 'Comment assigned to run 2',
                  createdAtLabel: 'Just now',
                },
              ],
            }
          : item
      ),
    },
    '2026-08-27T09:00:00.000Z'
  );
  const third = refreshDashboardWidgetInsightThread(
    {
      ...second,
      items: second.items.map((item) =>
        item.kind === 'ai'
          ? {
              ...item,
              comments: [
                {
                  id: 'run-3-comment',
                  author: 'Prabal Gupta',
                  initials: 'PG',
                  text: 'Comment assigned to run 3',
                  createdAtLabel: 'Just now',
                },
              ],
            }
          : item
      ),
    },
    '2026-08-27T10:00:00.000Z'
  );

  assert.equal(third.pastAiRuns.length, 3);
  assert.equal(third.pastAiRuns[0].likes, 0);
  assert.deepEqual(third.pastAiRuns[0].comments.map((comment) => comment.text), [
    'Comment assigned to run 3',
  ]);
  assert.equal(third.pastAiRuns[1].likes, 1);
  assert.deepEqual(third.pastAiRuns[1].comments.map((comment) => comment.text), [
    'Comment assigned to run 2',
  ]);
  assert.equal(third.pastAiRuns[2].likes, 4);
  assert.deepEqual(third.pastAiRuns[2].comments.map((comment) => comment.text), [
    originalAi.comments[0].text,
    'Comment assigned to run 1',
  ]);
  assert.equal(third.items.find((item) => item.kind === 'ai')?.likes, 0);
  assert.deepEqual(third.items.find((item) => item.kind === 'ai')?.comments, []);
});

test('failed refresh retains the existing insight thread and successful refresh timestamp', () => {
  const thread = createDashboardWidgetInsightThread('w-segment-trend');
  const failed = failDashboardWidgetInsightRefresh(
    thread,
    '2026-08-27T08:15:00.000Z'
  );

  assert.deepEqual(failed.items, thread.items);
  assert.equal(failed.generation, thread.generation);
  assert.equal(failed.lastRefreshedAt, thread.lastRefreshedAt);
  assert.equal(failed.lastRefreshAttemptAt, '2026-08-27T08:15:00.000Z');
  assert.match(failed.lastRefreshError, /previous AI insight is still available/);

  const retried = refreshDashboardWidgetInsightThread(
    failed,
    '2026-08-27T08:20:00.000Z'
  );
  assert.equal(retried.lastRefreshError, undefined);
  assert.equal(retried.lastRefreshedAt, '2026-08-27T08:20:00.000Z');
  assert.deepEqual(retried.items[1], thread.items[1]);
  assert.deepEqual(retried.pastAiRuns, [thread.items[0]]);
});
