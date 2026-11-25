'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  INTEGRITY_FLAG_COUNTS,
  INTEGRITY_FLAGS,
  INTEGRITY_RISK_LABELS,
  INTEGRITY_SCORE_DISTRIBUTION,
  INTEGRITY_SUMMARY,
  RESPONDENT_INTEGRITY_RECORDS,
  formatCompletionTime,
  getIntegrityFlagLabel,
  type IntegrityFlagId,
  type IntegrityResponseStatus,
  type IntegrityRiskLevel,
} from '@/data/mock-respondent-integrity';
import { formatNumber, formatSmartDate } from '@/data/mock-utils';
import hubStyles from './SurveyAnalyticsHub.module.css';
import styles from './AnalyticsRespondentIntegrity.module.css';

const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

type IntegrityTab = 'overview' | 'respondents';
type RiskFilter = 'all' | IntegrityRiskLevel;

const TABS: { id: IntegrityTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'respondents', label: 'Respondents' },
];

const RISK_FILTERS: { value: RiskFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'high', label: 'High risk' },
  { value: 'medium', label: 'Medium risk' },
  { value: 'low', label: 'Low risk' },
];

const RISK_CLASS: Record<IntegrityRiskLevel, string> = {
  high: styles.riskHigh,
  medium: styles.riskMedium,
  low: styles.riskLow,
};

function pct(value: number, total: number): string {
  return `${((value / total) * 100).toFixed(1)}%`;
}

export function AnalyticsRespondentIntegrity({
  onAction,
}: {
  onAction: (message: string) => void;
}) {
  const [tab, setTab] = useState<IntegrityTab>('overview');
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all');
  const [flagFilter, setFlagFilter] = useState<IntegrityFlagId | ''>('');
  const [search, setSearch] = useState('');
  const [statusById, setStatusById] = useState<Record<string, IntegrityResponseStatus>>(() =>
    Object.fromEntries(RESPONDENT_INTEGRITY_RECORDS.map((row) => [row.responseId, row.status]))
  );

  const summary = INTEGRITY_SUMMARY;
  const maxBucket = Math.max(...INTEGRITY_SCORE_DISTRIBUTION.map((bucket) => bucket.count));
  const maxFlag = Math.max(...INTEGRITY_FLAG_COUNTS.map((flag) => flag.count));

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return RESPONDENT_INTEGRITY_RECORDS.filter((row) => {
      if (riskFilter !== 'all' && row.risk !== riskFilter) return false;
      if (flagFilter && !row.flags.includes(flagFilter)) return false;
      if (!query) return true;
      return (
        row.responseId.toLowerCase().includes(query) ||
        (row.respondent ?? '').toLowerCase().includes(query)
      );
    });
  }, [flagFilter, riskFilter, search]);

  const flaggedVisible = rows.filter(
    (row) => row.risk === 'high' && statusById[row.responseId] === 'included'
  );

  function setStatus(responseId: string, status: IntegrityResponseStatus): void {
    setStatusById((prev) => ({ ...prev, [responseId]: status }));
    onAction(
      status === 'excluded'
        ? `${responseId} excluded from reports`
        : `${responseId} included in reports again`
    );
  }

  function excludeAllHighRisk(): void {
    setStatusById((prev) => {
      const next = { ...prev };
      for (const row of flaggedVisible) next[row.responseId] = 'excluded';
      return next;
    });
    onAction(
      `${flaggedVisible.length} high-risk response${flaggedVisible.length === 1 ? '' : 's'} excluded from reports`
    );
  }

  function clearFilters(): void {
    setRiskFilter('all');
    setFlagFilter('');
    setSearch('');
  }

  function openRespondentsForFlag(flagId: IntegrityFlagId): void {
    setFlagFilter((current) => (current === flagId ? '' : flagId));
    setTab('respondents');
  }

  const tiles = [
    { value: `${summary.averageScore}/100`, label: 'Avg. integrity score', icon: 'wm-verified', accent: true },
    { value: formatNumber(summary.high), label: `High risk · ${pct(summary.high, summary.analyzed)}`, icon: 'wm-gpp-bad' },
    { value: formatNumber(summary.medium), label: `Medium risk · ${pct(summary.medium, summary.analyzed)}`, icon: 'wm-report-problem' },
    { value: formatNumber(summary.autoTerminated), label: 'Auto-terminated', icon: 'wm-block' },
  ];

  return (
    <div className={hubStyles.screen}>
      <div className={hubStyles.screenHeader}>
        <h1 className={hubStyles.title}>Respondent Integrity</h1>
        <span className={hubStyles.meta}>Last scored Nov 24, 2026 · 9:30 AM IST</span>
        <span className={hubStyles.headerSpacer} />
        <button
          type="button"
          className={hubStyles.ghostBtn}
          onClick={() => onAction('Integrity scores recalculated for 1,823 responses')}
        >
          <span className="wm-refresh" aria-hidden />
          Re-score
        </button>
        <button
          type="button"
          className={hubStyles.ghostBtn}
          onClick={() => onAction('Respondent integrity report exported to Download Center')}
        >
          <span className="wm-download" aria-hidden />
          Export
        </button>
      </div>

      <div className={styles.tabs} role="tablist" aria-label="Respondent Integrity">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={tab === item.id ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <>
          <div className={`${hubStyles.statRow} ${styles.statRow}`}>
            {tiles.map((tile) => (
              <div
                key={tile.label}
                className={
                  tile.accent ? `${hubStyles.statTile} ${hubStyles.statAccent}` : hubStyles.statTile
                }
              >
                <div className={hubStyles.statValue}>{tile.value}</div>
                <div className={hubStyles.statLabel}>
                  <span className={tile.icon} aria-hidden />
                  <span>{tile.label}</span>
                </div>
              </div>
            ))}
          </div>

          <div className={hubStyles.splitEqual}>
            <section className={hubStyles.card}>
              <div className={hubStyles.cardHeader}>
                <h2 className={hubStyles.cardTitle}>Integrity score distribution</h2>
                <span className={hubStyles.muted}>Higher is more trustworthy</span>
              </div>
              <div className={styles.chartBody}>
                <div className={styles.columns}>
                  {INTEGRITY_SCORE_DISTRIBUTION.map((bucket) => (
                    <div key={bucket.range} className={styles.column}>
                      <span className={styles.columnValue}>{formatNumber(bucket.count)}</span>
                      <div className={styles.columnTrack}>
                        <div
                          className={`${styles.columnFill} ${RISK_CLASS[bucket.risk]}`}
                          style={{ height: `${Math.max(4, (bucket.count / maxBucket) * 100)}%` }}
                        />
                      </div>
                      <span className={styles.columnLabel}>{bucket.range}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.legend}>
                  {(['high', 'medium', 'low'] as const).map((risk) => (
                    <span key={risk} className={styles.legendItem}>
                      <span className={`${styles.legendDot} ${RISK_CLASS[risk]}`} aria-hidden />
                      {INTEGRITY_RISK_LABELS[risk]}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <section className={hubStyles.card}>
              <div className={hubStyles.cardHeader}>
                <h2 className={hubStyles.cardTitle}>Top integrity flags</h2>
                <span className={hubStyles.muted}>Click a flag to open respondents</span>
              </div>
              <ul className={styles.flagList}>
                {INTEGRITY_FLAG_COUNTS.map((item) => {
                  const def = INTEGRITY_FLAGS.find((flag) => flag.id === item.id);
                  const active = flagFilter === item.id;
                  return (
                    <li key={item.id}>
                      <WuTooltip content={def?.description} position="top">
                        <button
                          type="button"
                          className={
                            active ? `${styles.flagRow} ${styles.flagRowActive}` : styles.flagRow
                          }
                          aria-pressed={active}
                          onClick={() => openRespondentsForFlag(item.id)}
                        >
                          <span className={styles.flagLabel}>{def?.label}</span>
                          <span className={styles.flagTrack}>
                            <span
                              className={styles.flagFill}
                              style={{ width: `${(item.count / maxFlag) * 100}%` }}
                            />
                          </span>
                          <span className={styles.flagCount}>{item.count}</span>
                        </button>
                      </WuTooltip>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        </>
      ) : (
        <section className={hubStyles.card}>
          <div className={hubStyles.cardHeader}>
            <div className={styles.cardTitleGroup}>
              <h2 className={hubStyles.cardTitle}>Respondents</h2>
              <span className={hubStyles.muted}>
                {formatNumber(summary.analyzed)} responses analyzed
              </span>
            </div>
            <div className={hubStyles.toolbar}>
              <div className={hubStyles.rangeGroup} role="group" aria-label="Risk level">
                {RISK_FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    className={
                      riskFilter === filter.value ? hubStyles.rangeBtnActive : hubStyles.rangeBtn
                    }
                    aria-pressed={riskFilter === filter.value}
                    onClick={() => setRiskFilter(filter.value)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <input
                type="search"
                className={hubStyles.input}
                style={{ height: '1.75rem', width: '13rem' }}
                placeholder="Search response ID or email"
                aria-label="Search respondents"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <button
                type="button"
                className={hubStyles.primaryBtn}
                disabled={flaggedVisible.length === 0}
                onClick={excludeAllHighRisk}
              >
                Exclude high risk ({flaggedVisible.length})
              </button>
            </div>
          </div>

          {flagFilter ? (
            <div className={styles.activeFilter}>
              Showing respondents flagged for <strong>{getIntegrityFlagLabel(flagFilter)}</strong>
              <button type="button" className={hubStyles.linkBtn} onClick={() => setFlagFilter('')}>
                Clear
              </button>
            </div>
          ) : null}

          {rows.length === 0 ? (
            <EmptyState
              icon="wm-verified-user"
              title="No respondents match these filters"
              description="Try a different risk level or flag, or clear the search."
              action={
                <button type="button" className={hubStyles.ghostBtn} onClick={clearFilters}>
                  Clear filters
                </button>
              }
            />
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className={hubStyles.table}>
                <thead>
                  <tr>
                    <th scope="col">Response ID</th>
                    <th scope="col">Respondent</th>
                    <th scope="col" className={hubStyles.right}>
                      Score
                    </th>
                    <th scope="col">Risk</th>
                    <th scope="col">Flags</th>
                    <th scope="col" className={hubStyles.right}>
                      Time taken
                    </th>
                    <th scope="col">Country</th>
                    <th scope="col">Submitted</th>
                    <th scope="col">Status</th>
                    <th scope="col" className={hubStyles.right}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const status = statusById[row.responseId];
                    return (
                      <tr
                        key={row.responseId}
                        className={status === 'excluded' ? styles.rowExcluded : undefined}
                      >
                        <td>
                          <button
                            type="button"
                            className={hubStyles.linkBtn}
                            onClick={() => onAction(`Opening response ${row.responseId}`)}
                          >
                            {row.responseId}
                          </button>
                        </td>
                        <td>
                          <span className={styles.respondent} title={row.respondent}>
                            {row.respondent ?? <span className={hubStyles.muted}>Anonymous</span>}
                          </span>
                          <span className={styles.collector}>{row.collector}</span>
                        </td>
                        <td className={hubStyles.right}>
                          <span className={styles.score}>{row.score}</span>
                        </td>
                        <td>
                          <span className={`${styles.riskBadge} ${RISK_CLASS[row.risk]}`}>
                            {INTEGRITY_RISK_LABELS[row.risk]}
                          </span>
                        </td>
                        <td>
                          {row.flags.length > 0 ? (
                            <span className={styles.flagChips}>
                              {row.flags.map((flag) => (
                                <span key={flag} className={styles.flagChip}>
                                  {getIntegrityFlagLabel(flag)}
                                </span>
                              ))}
                            </span>
                          ) : (
                            <span className={hubStyles.muted}>No flags</span>
                          )}
                        </td>
                        <td className={hubStyles.right}>
                          {formatCompletionTime(row.completionSeconds)}
                        </td>
                        <td>{row.country ?? <span className={hubStyles.muted}>Unknown</span>}</td>
                        <td>{formatSmartDate(row.submittedAt)}</td>
                        <td>
                          <span
                            className={
                              status === 'excluded'
                                ? `${styles.status} ${styles.statusExcluded}`
                                : styles.status
                            }
                          >
                            {status === 'excluded' ? 'Excluded' : 'Included'}
                          </span>
                        </td>
                        <td className={hubStyles.right}>
                          <button
                            type="button"
                            className={hubStyles.linkBtn}
                            onClick={() =>
                              setStatus(
                                row.responseId,
                                status === 'excluded' ? 'included' : 'excluded'
                              )
                            }
                          >
                            {status === 'excluded' ? 'Include' : 'Exclude'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className={styles.tableFooter}>
            Showing {rows.length} of {formatNumber(summary.analyzed)} responses
          </div>
        </section>
      )}
    </div>
  );
}
