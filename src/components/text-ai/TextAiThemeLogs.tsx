'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  getTextAiRecodeLogs,
  type TextAiRecodeLogEntry,
} from '@/data/text-ai-activity-logs';
import styles from './TextAiThemeLogs.module.css';

const PAGE_SIZE = 5;
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

function formatLogDateTime(occurredAt: string): string {
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(occurredAt));
}

export function TextAiThemeLogs({ dashboardId }: { dashboardId: number }) {
  const [page, setPage] = useState(1);
  const logs: TextAiRecodeLogEntry[] = getTextAiRecodeLogs(dashboardId);
  const pageCount = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visibleLogs = useMemo(
    () => logs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [logs, safePage]
  );
  const firstItem = logs.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const lastItem = Math.min(safePage * PAGE_SIZE, logs.length);

  if (logs.length === 0) {
    return (
      <div className={styles.emptyLogs}>
        <span className="wm-history" aria-hidden />
        <h3>No theme changes yet</h3>
        <p>
          Granularity changes, recoding, sub-theme edits, and emerging-theme
          approvals will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.activity}>
      <nav className={styles.pagination} aria-label="Theme log pages">
        <button
          type="button"
          aria-label="Previous page"
          disabled={safePage === 1}
          onClick={() => setPage((current) => Math.max(1, current - 1))}
        >
          <span className="wm-chevron-left" aria-hidden />
        </button>
        <span>
          {firstItem}–{lastItem} of {logs.length}
        </span>
        <button
          type="button"
          aria-label="Next page"
          disabled={safePage === pageCount}
          onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
        >
          <span className="wm-chevron-right" aria-hidden />
        </button>
        <WuSelect
          data={[{ value: '5', label: '5' }]}
          accessorKey={{ value: 'value', label: 'label' }}
          value={{ value: '5', label: '5' }}
          onSelect={() => {}}
          variant="outlined"
          className={styles.pageSizeSelect}
          aria-label="Theme log items per page"
        />
      </nav>

      <ol className={styles.timeline}>
        {visibleLogs.map((entry) => (
          <li key={entry.id}>
            <span className={styles.timelineMarker} aria-hidden />
            <article className={styles.logCard}>
              <header>
                <span className={styles.logIdentity}>
                  <strong>{entry.title}</strong>
                  <small>{entry.question}</small>
                </span>
                <time className={styles.dateTime} dateTime={entry.occurredAt}>
                  {formatLogDateTime(entry.occurredAt)}
                </time>
              </header>
              <p>{entry.details}</p>
              <footer>Kartik Bhat</footer>
            </article>
          </li>
        ))}
      </ol>
    </div>
  );
}
