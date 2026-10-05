'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { getTextAiRecodeLogs } from '@/data/text-ai-activity-logs';
import styles from './TextAiThemeLogs.module.css';

const PAGE_SIZE = 25;
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

function formatLogDateTime(occurredAt: string): string {
  return new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(occurredAt));
}
function logDay(occurredAt: string): string {
  return new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(new Date(occurredAt));
}

export function TextAiThemeLogs({ dashboardId }: { dashboardId: number }) {
  const [page, setPage] = useState(1);
  const [operation, setOperation] = useState('all');
  const allLogs = getTextAiRecodeLogs(dashboardId);
  const operations = [{ value: 'all', label: 'All operations' }, ...Array.from(new Map(allLogs.map(entry => [entry.action, { value: entry.action, label: entry.title }])).values())];
  const logs = allLogs.filter(entry => operation === 'all' || entry.action === operation);
  const pageCount = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visibleLogs = logs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  return <div className={styles.activity}>
    <div className={styles.historyControls}>
      <WuSelect data={operations} accessorKey={{ value: 'value', label: 'label' }}
        value={operations.find(option => option.value === operation) ?? operations[0]}
        onSelect={option => { if (!option || Array.isArray(option)) return; setOperation((option as {value:string}).value); setPage(1); }}
        variant="outlined" aria-label="Theme history operation" />
      {pageCount > 1 && <nav className={styles.pagination} aria-label="Theme history pages">
        <button type="button" aria-label="Previous page" disabled={safePage === 1} onClick={() => setPage(current => Math.max(1,current-1))}><span className="wm-chevron-left" aria-hidden /></button>
        <span>{safePage} of {pageCount}</span>
        <button type="button" aria-label="Next page" disabled={safePage === pageCount} onClick={() => setPage(current => Math.min(pageCount,current+1))}><span className="wm-chevron-right" aria-hidden /></button>
      </nav>}
    </div>
    {logs.length === 0 ? <div className={styles.emptyLogs}>
      <span className="wm-history" aria-hidden /><h3>No theme changes yet</h3>
      <p>Saved theme configuration changes, recoding and emerging-theme approvals will appear here.</p>
    </div> : <ol className={styles.timeline}>
      {visibleLogs.map((entry,index) => <li key={entry.id}>
        {(index === 0 || logDay(visibleLogs[index-1].occurredAt) !== logDay(entry.occurredAt)) && <h4 className={styles.logDay}>{logDay(entry.occurredAt)}</h4>}
        <span className={styles.timelineMarker} aria-hidden />
        <article className={styles.logCard}>
          <header><span className={styles.logIdentity}><strong>{entry.title}</strong><small>{entry.question}</small></span>
            <time className={styles.dateTime} dateTime={entry.occurredAt}>{formatLogDateTime(entry.occurredAt)}</time></header>
          <p>{entry.details}</p><footer>Kartik Bhat</footer>
        </article>
      </li>)}
    </ol>}
  </div>;
}
