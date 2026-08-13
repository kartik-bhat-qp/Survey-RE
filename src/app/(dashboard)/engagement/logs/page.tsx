'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { PageContainer } from '@/components/ui/PageContainer';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  ENGAGEMENT_GIT_ACTION_LABEL,
  ENGAGEMENT_LOGS_URL,
  MOCK_ENGAGEMENT_GIT_LOGS,
  formatEngagementLogTime,
  type EngagementGitAction,
  type EngagementGitLogEntry,
} from '@/data/mock-engagement-logs';
import styles from './EngagementLogs.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);

function isLogEntry(value: unknown): value is EngagementGitLogEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<EngagementGitLogEntry>;
  return (
    typeof entry.id === 'string' &&
    (entry.action === 'push' || entry.action === 'pull') &&
    typeof entry.summary === 'string' &&
    Array.isArray(entry.changes) &&
    typeof entry.createdAt === 'string'
  );
}

function ActionBadge({ action }: { action: EngagementGitAction }) {
  return (
    <span
      className={`${styles.badge} ${
        action === 'push' ? styles.badgePush : styles.badgePull
      }`}
    >
      {ENGAGEMENT_GIT_ACTION_LABEL[action]}
    </span>
  );
}

export default function EngagementLogsPage() {
  const [logs, setLogs] = useState<EngagementGitLogEntry[]>(MOCK_ENGAGEMENT_GIT_LOGS);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<'all' | EngagementGitAction>('all');

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${ENGAGEMENT_LOGS_URL}?t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('Failed to load logs');
      const data: unknown = await response.json();
      if (Array.isArray(data) && data.every(isLogEntry)) {
        setLogs(data);
      }
    } catch {
      setLogs(MOCK_ENGAGEMENT_GIT_LOGS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return logs.filter((entry) => {
      if (actionFilter !== 'all' && entry.action !== actionFilter) return false;
      if (!term) return true;
      const haystack = [
        entry.summary,
        entry.branch,
        entry.remote,
        entry.author,
        ...entry.changes,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [logs, search, actionFilter]);

  return (
    <PageContainer>
      <PageHeader
        title="Logs"
        description="High-level summaries of git pushes and pulls for this workspace."
        action={
          <WuButton variant="secondary" onClick={() => void loadLogs()}>
            Refresh
          </WuButton>
        }
      />

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <WuInput
            variant="outlined"
            placeholder="Search logs"
            Icon={<span className="wm-search" />}
            iconPosition="left"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className={styles.filters} role="group" aria-label="Filter by action">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'push', label: 'Push' },
              { id: 'pull', label: 'Pull' },
            ] as const
          ).map((option) => (
            <button
              key={option.id}
              type="button"
              className={`${styles.filterChip} ${
                actionFilter === option.id ? styles.filterChipActive : ''
              }`}
              onClick={() => setActionFilter(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className={styles.loading}>Loading logs…</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="wm-search-off"
          title="No logs found"
          description={
            search.trim() || actionFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Git push and pull activity will appear here automatically'
          }
        />
      ) : (
        <ul className={styles.list}>
          {filtered.map((entry) => (
            <li key={entry.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitleRow}>
                  <ActionBadge action={entry.action} />
                  <h2 className={styles.cardTitle}>{entry.summary}</h2>
                </div>
                <time className={styles.cardTime} dateTime={entry.createdAt}>
                  {formatEngagementLogTime(entry.createdAt)}
                </time>
              </div>
              <div className={styles.meta}>
                <span>{entry.remote}/{entry.branch}</span>
                <span aria-hidden>·</span>
                <span>{entry.author}</span>
              </div>
              <ul className={styles.changes}>
                {entry.changes.map((change) => (
                  <li key={change}>{change}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  );
}
