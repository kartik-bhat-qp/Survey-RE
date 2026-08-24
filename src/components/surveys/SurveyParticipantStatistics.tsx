'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  EMAIL_INVITATION_STATS,
  PARTICIPANT_DROPOUT_BLOCKWISE_ROWS,
  PARTICIPANT_DROPOUT_QUESTION_ROWS,
  PARTICIPANT_OVERALL_STATS,
  PARTICIPANT_RANGE_OPTIONS,
  buildDropoutCompletionUrls,
  downloadDropoutCompletionUrlsCsv,
  formatDropoutPercent,
  sumEmailInvitationStats,
} from '@/data/mock-participant-statistics';
import { formatNumber } from '@/data/mock-utils';
import styles from './SurveyParticipantStatistics.module.css';

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false }
);

function formatCount(value: number | null): string {
  return value == null ? '—' : formatNumber(value);
}

export function SurveyParticipantStatistics() {
  const { showToast } = useWuShowToast();
  const [range, setRange] = useState('all');
  const [blockwiseDropout, setBlockwiseDropout] = useState(false);
  const [viewedCount, setViewedCount] = useState(PARTICIPANT_OVERALL_STATS.viewed);
  const [lastRefreshed, setLastRefreshed] = useState(
    PARTICIPANT_OVERALL_STATS.lastRefreshedLabel
  );

  const stats = PARTICIPANT_OVERALL_STATS;
  const emailTotal = useMemo(
    () => sumEmailInvitationStats(EMAIL_INVITATION_STATS),
    []
  );
  const dropoutRows = blockwiseDropout
    ? PARTICIPANT_DROPOUT_BLOCKWISE_ROWS
    : PARTICIPANT_DROPOUT_QUESTION_ROWS;

  const selectedRangeOption =
    PARTICIPANT_RANGE_OPTIONS.find((opt) => opt.value === range) ?? null;

  function handleHelp(title: string, message: string) {
    showToast({ message: `${title}: ${message}`, variant: 'info' });
  }

  function handleDownloadCompletionUrls(scope: 'all' | string = 'all') {
    const rows = buildDropoutCompletionUrls(scope);
    if (rows.length === 0) {
      showToast({ message: 'No completion URLs to download', variant: 'error' });
      return;
    }
    const stamp = new Date().toISOString().slice(0, 10);
    const suffix = scope === 'all' ? 'all' : scope;
    downloadDropoutCompletionUrlsCsv(
      rows,
      `dropout-completion-urls-${suffix}-${stamp}.csv`
    );
    showToast({
      message: `Downloaded ${formatNumber(rows.length)} completion URL${rows.length === 1 ? '' : 's'}`,
      variant: 'success',
    });
  }

  function handleResetViewed() {
    setViewedCount(0);
    showToast({ message: 'Viewed count reset', variant: 'success' });
  }

  function handleRefreshStats() {
    setViewedCount(stats.viewed);
    setLastRefreshed(stats.lastRefreshedLabel);
    showToast({ message: 'Participant statistics refreshed', variant: 'success' });
  }

  const overallRows: {
    id: string;
    label: string;
    value: string;
    help?: string;
    reset?: boolean;
    barPct?: number;
    emphasized?: boolean;
    highlight?: boolean;
  }[] = [
    {
      id: 'viewed',
      label: 'Viewed',
      value: formatCount(viewedCount),
      help: 'Total number of users who clicked the survey link. Includes started and completed counts.',
      reset: true,
      highlight: true,
    },
    {
      id: 'total',
      label: 'Total',
      value: formatCount(stats.total),
      emphasized: true,
    },
    {
      id: 'completed',
      label: 'Completed',
      value: formatCount(stats.completed),
      help: 'Respondents who went through the whole survey and clicked Finish on the last page.',
      emphasized: true,
    },
    {
      id: 'completion-rate',
      label: 'Completion Rate',
      value: `${stats.completionRate}%`,
      help: 'Completed survey responses divided by the number of started survey responses.',
      barPct: stats.completionRate,
    },
    {
      id: 'dropouts',
      label: 'Drop Outs (After Starting)',
      value: formatCount(stats.dropouts),
      emphasized: true,
    },
    {
      id: 'timed-out',
      label: 'Timed Out',
      value: formatCount(stats.timedOut),
    },
    {
      id: 'quality',
      label: 'Quality Terminates',
      value: formatCount(stats.qualityTerminates),
    },
    {
      id: 'validation',
      label: 'Validation Errors',
      value: formatCount(stats.validationErrors),
      help: 'The number of times someone encountered a validation error during the survey.',
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHead}>
        <h1 id="overall-stats-title" className={styles.surveyTitle}>
          Overall Participant Statistics
        </h1>
        <button
          type="button"
          className={styles.helpBtn}
          aria-label="About overall participant statistics"
          onClick={() =>
            handleHelp(
              'Overall Participant Statistics',
              'Viewed, started, completed, terminated, and over-quota counts for this survey'
            )
          }
        >
          ?
        </button>
      </div>

      <section className={styles.overall} aria-labelledby="overall-stats-title">
        <div className={styles.rangeSelect}>
          <WuSelect
            value={selectedRangeOption}
            data={PARTICIPANT_RANGE_OPTIONS}
            accessorKey={{ value: 'value', label: 'label' }}
            onSelect={(opt) => {
              const next = Array.isArray(opt) ? opt[0] : opt;
              if (!next) return;
              setRange(next.value);
              showToast({
                message: `Showing ${next.label.toLowerCase()}`,
                variant: 'info',
              });
            }}
            variant="outlined"
            aria-label="Response date range"
          />
        </div>
        <div className={styles.statList}>
          <div className={styles.statHeader}>
            <span />
            <span>Count</span>
          </div>
          {overallRows.map((row) => (
            <div
              key={row.id}
              className={`${styles.statRow} ${row.highlight ? styles.statRowHighlight : ''}`}
            >
              <span className={styles.statLabel}>
                {row.label}
                {row.reset ? (
                  <>
                    {' '}
                    ({' '}
                    <button
                      type="button"
                      className={styles.resetLink}
                      onClick={handleResetViewed}
                    >
                      Reset
                    </button>{' '}
                    )
                  </>
                ) : null}
                {row.help ? (
                  <button
                    type="button"
                    className={styles.helpBtn}
                    aria-label={`About ${row.label}`}
                    onClick={() => handleHelp(row.label, row.help ?? '')}
                  >
                    ?
                  </button>
                ) : null}
              </span>
              {row.barPct != null ? (
                <span className={styles.statBar} aria-hidden>
                  <span
                    className={styles.statBarFill}
                    style={{ width: `${Math.min(row.barPct, 100)}%` }}
                  />
                </span>
              ) : (
                <span />
              )}
              <span
                className={`${styles.statValue} ${
                  row.emphasized ? styles.statValueEmphasized : ''
                }`}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>
        <div className={styles.statFooter}>
          <p className={styles.statMeta}>
            Last Refreshed : {lastRefreshed} (
            <button type="button" className={styles.resetLink} onClick={handleRefreshStats}>
              Refresh
            </button>
            )
          </p>
          <p className={styles.statMeta}>
            Response Rates - Explained
            <button
              type="button"
              className={styles.helpBtn}
              aria-label="About response rates"
              onClick={() =>
                handleHelp(
                  'Response Rates - Explained',
                  'Viewed is everyone who opened the survey. Total includes started and completed responses. Completion Rate is completed divided by started.'
                )
              }
            >
              ?
            </button>
          </p>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="email-stats-title">
        <div className={styles.sectionHead}>
          <h2 id="email-stats-title" className={styles.sectionTitle}>
            Email Invitation Participation Statistics
          </h2>
          <button
            type="button"
            className={styles.helpBtn}
            aria-label="About email invitation statistics"
            onClick={() =>
              handleHelp(
                'Email Invitation Participation Statistics',
                'Sent, opened, started, and completed counts by email list'
              )
            }
          >
            ?
          </button>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Email List</th>
                <th scope="col" className={styles.num}>
                  Sent
                </th>
                <th scope="col" className={styles.num}>
                  Bounced
                </th>
                <th scope="col" className={styles.num}>
                  Opened
                </th>
                <th scope="col" className={styles.num}>
                  Clicked
                </th>
                <th scope="col" className={styles.num}>
                  Started
                </th>
                <th scope="col" className={styles.num}>
                  Completed
                </th>
                <th scope="col" className={styles.num}>
                  Terminated
                </th>
                <th scope="col" className={styles.num}>
                  OverQuota
                </th>
                <th scope="col">Last Activity</th>
              </tr>
            </thead>
            <tbody>
              {EMAIL_INVITATION_STATS.map((row) => (
                <tr key={row.id}>
                  <td>{row.emailList}</td>
                  <td className={`${styles.num} ${row.sent == null ? styles.muted : ''}`}>
                    {formatCount(row.sent)}
                  </td>
                  <td className={`${styles.num} ${row.bounced == null ? styles.muted : ''}`}>
                    {formatCount(row.bounced)}
                  </td>
                  <td className={`${styles.num} ${row.opened == null ? styles.muted : ''}`}>
                    {formatCount(row.opened)}
                  </td>
                  <td className={`${styles.num} ${row.clicked == null ? styles.muted : ''}`}>
                    {formatCount(row.clicked)}
                  </td>
                  <td className={styles.num}>{formatCount(row.started)}</td>
                  <td className={styles.num}>{formatCount(row.completed)}</td>
                  <td className={styles.num}>{formatCount(row.terminated)}</td>
                  <td className={styles.num}>{formatCount(row.overQuota)}</td>
                  <td>{row.lastActivity}</td>
                </tr>
              ))}
              <tr className={styles.totalRow}>
                <td>Total</td>
                <td className={styles.num}>{formatCount(emailTotal.sent)}</td>
                <td className={styles.num}>{formatCount(emailTotal.bounced)}</td>
                <td className={styles.num}>{formatCount(emailTotal.opened)}</td>
                <td className={styles.num}>{formatCount(emailTotal.clicked)}</td>
                <td className={styles.num}>{formatCount(emailTotal.started)}</td>
                <td className={styles.num}>{formatCount(emailTotal.completed)}</td>
                <td className={styles.num}>{formatCount(emailTotal.terminated)}</td>
                <td className={styles.num}>{formatCount(emailTotal.overQuota)}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="dropout-analysis-title">
        <div className={styles.sectionToolbar}>
          <div className={styles.sectionHead}>
            <h2 id="dropout-analysis-title" className={styles.sectionTitle}>
              Drop-Out Analysis
            </h2>
            <button
              type="button"
              className={styles.helpBtn}
              aria-label="About drop-out analysis"
              onClick={() =>
                handleHelp(
                  'Drop-Out Analysis',
                  'Shows where respondents left the survey, with count, base %, and cumulative % by last completed question'
                )
              }
            >
              ?
            </button>
          </div>
          <div className={styles.sectionActions}>
            <button
              type="button"
              className={styles.primaryActionBtn}
              onClick={() => handleDownloadCompletionUrls('all')}
            >
              <span className="wm-download" aria-hidden />
              Completion URLs ({formatNumber(stats.dropouts)})
            </button>
          </div>
        </div>

        <div className={styles.dropoutToggleRow}>
          <WuToggle
            Label="Blockwise dropout analysis"
            labelPosition="left"
            checked={blockwiseDropout}
            onChange={(checked) => {
              setBlockwiseDropout(checked);
              showToast({
                message: checked
                  ? 'Showing blockwise drop-out analysis'
                  : 'Showing question-level drop-out analysis',
                variant: 'info',
              });
            }}
          />
        </div>

        <div className={styles.tableWrap}>
          <table className={`${styles.table} ${styles.dropoutTable}`}>
            <thead>
              <tr>
                <th scope="col">Last Completed Question</th>
                <th scope="col" className={styles.num}>
                  Count
                </th>
                <th scope="col" className={styles.num}>
                  Base %
                </th>
                <th scope="col" className={styles.num}>
                  Cumulative %
                </th>
                <th scope="col" className={styles.dropoutActionCol}>
                  <span className={styles.srOnly}>Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {dropoutRows.map((row) => (
                <tr key={row.id} className={row.isTotal ? styles.totalRow : undefined}>
                  <td className={styles.dropoutQuestion}>
                    <button
                      type="button"
                      className={styles.quotaNameBtn}
                      onClick={() =>
                        showToast({
                          message: `${row.label}: ${formatNumber(row.count)} dropouts (${formatDropoutPercent(row.basePercent)})`,
                          variant: 'info',
                        })
                      }
                    >
                      {row.label}
                    </button>
                  </td>
                  <td className={`${styles.num} ${styles.dropoutCount}`}>
                    {formatCount(row.count)}
                  </td>
                  <td className={styles.num}>{formatDropoutPercent(row.basePercent)}</td>
                  <td className={styles.num}>{formatDropoutPercent(row.cumulativePercent)}</td>
                  <td className={styles.dropoutActionCol}>
                    {row.isTotal || blockwiseDropout ? null : (
                      <button
                        type="button"
                        className={styles.rowDownloadBtn}
                        aria-label={`Download ${formatNumber(row.count)} completion URLs for ${row.label}`}
                        onClick={() => handleDownloadCompletionUrls(row.id)}
                      >
                        <span className="wm-download" aria-hidden />
                        <span className={styles.rowDownloadCount}>
                          {formatCount(row.count)}
                        </span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
