'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  filterQuestionTypeUsageRows,
  formatUsageChange,
  formatUsageCount,
  formatUsagePercent,
  QUESTION_TYPE_USAGE_CATEGORY_OPTIONS,
  QUESTION_TYPE_USAGE_DEFAULT_PINNED,
  QUESTION_TYPE_USAGE_FILTER_TABS,
  QUESTION_TYPE_USAGE_ROWS,
  QUESTION_TYPE_USAGE_SUMMARY,
  QUESTION_TYPE_USAGE_TREND,
  QUESTION_TYPE_USAGE_TREND_COLORS,
  type QuestionTypeUsageFilterTab,
  type QuestionTypeUsageRow,
} from '@/data/mock-question-type-usage';
import styles from './QuestionTypeUsagePage.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenu })),
  { ssr: false }
);
const WuMenuItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuItem })),
  { ssr: false }
);

type TrendMetric = 'surveys' | 'share';

const TREND_SERIES_KEYS = [
  { id: 'matrix', key: 'matrix' as const, label: 'Matrix' },
  { id: 'multiple-choice', key: 'multipleChoice' as const, label: 'Multiple Choice' },
  { id: 'rank-order', key: 'rankOrder' as const, label: 'Rank Order' },
  { id: 'static-content', key: 'staticContent' as const, label: 'Static Content' },
  { id: 'text', key: 'text' as const, label: 'Text' },
];

function TrendChart({ metric }: { metric: TrendMetric }) {
  const width = 560;
  const height = 220;
  const pad = { top: 16, right: 12, bottom: 28, left: 36 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const series = TREND_SERIES_KEYS.map((seriesDef) => {
    const raw = QUESTION_TYPE_USAGE_TREND.map((point) => point[seriesDef.key]);
    const values =
      metric === 'surveys'
        ? raw
        : QUESTION_TYPE_USAGE_TREND.map((point) => {
            const total =
              point.matrix +
              point.multipleChoice +
              point.rankOrder +
              point.staticContent +
              point.text;
            return total ? (point[seriesDef.key] / total) * 100 : 0;
          });
    return { ...seriesDef, values };
  });

  const maxY = Math.max(...series.flatMap((s) => s.values), 1);
  const yTicks =
    metric === 'surveys'
      ? [0, 100, 200, 300, 400].filter((t) => t <= Math.ceil(maxY / 100) * 100 || t === 0)
      : [0, 20, 40, 60, 80];

  const pointsFor = (values: number[]) =>
    values
      .map((value, index) => {
        const x =
          pad.left +
          (QUESTION_TYPE_USAGE_TREND.length === 1
            ? plotW / 2
            : (index / (QUESTION_TYPE_USAGE_TREND.length - 1)) * plotW);
        const y = pad.top + plotH - (value / Math.max(maxY, 1)) * plotH;
        return `${x},${y}`;
      })
      .join(' ');

  return (
    <svg
      className={styles.trendSvg}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Trend over time by ${metric === 'surveys' ? 'survey count' : 'share percent'}`}
    >
      {yTicks.map((tick) => {
        const y = pad.top + plotH - (tick / Math.max(maxY, 1)) * plotH;
        return (
          <g key={tick}>
            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={y}
              y2={y}
              className={styles.trendGrid}
            />
            <text x={pad.left - 8} y={y + 4} className={styles.trendAxisLabel} textAnchor="end">
              {tick}
            </text>
          </g>
        );
      })}
      {QUESTION_TYPE_USAGE_TREND.map((point, index) => {
        const x =
          pad.left +
          (QUESTION_TYPE_USAGE_TREND.length === 1
            ? plotW / 2
            : (index / (QUESTION_TYPE_USAGE_TREND.length - 1)) * plotW);
        return (
          <text
            key={point.month}
            x={x}
            y={height - 8}
            className={styles.trendAxisLabel}
            textAnchor="middle"
          >
            {point.month}
          </text>
        );
      })}
      {series.map((s) => (
        <polyline
          key={s.id}
          fill="none"
          stroke={QUESTION_TYPE_USAGE_TREND_COLORS[s.id]}
          strokeWidth={2}
          points={pointsFor(s.values)}
        />
      ))}
    </svg>
  );
}

function ShareBar({ share }: { share: number }) {
  return (
    <div className={styles.shareCell}>
      <div className={styles.shareTrack} aria-hidden>
        <div className={styles.shareFill} style={{ width: `${Math.min(100, share * 100)}%` }} />
      </div>
      <span className={styles.shareValue}>{formatUsagePercent(share)}</span>
    </div>
  );
}

function TypeRow({
  row,
  expanded,
  pinned,
  onToggleExpand,
  onTogglePin,
}: {
  row: QuestionTypeUsageRow;
  expanded: boolean;
  pinned: boolean;
  onToggleExpand: () => void;
  onTogglePin: () => void;
}) {
  const changePositive = row.change > 0;
  const changeNegative = row.change < 0;
  const hasChildren = Boolean(row.children?.length);

  return (
    <>
      <tr className={styles.tableRow}>
        <td className={styles.typeCell}>
          <button
            type="button"
            className={styles.expandBtn}
            aria-label={expanded ? `Collapse ${row.name}` : `Expand ${row.name}`}
            aria-expanded={expanded}
            disabled={!hasChildren}
            onClick={onToggleExpand}
          >
            <span
              className={`wm-chevron-right ${styles.expandIcon} ${
                expanded ? styles.expandIconOpen : ''
              }`}
              aria-hidden
            />
          </button>
          <span className={`${row.icon} ${styles.typeIcon}`} aria-hidden />
          <span className={styles.typeName}>{row.name}</span>
          <span className={styles.tierBadge}>{row.tier}</span>
          <button
            type="button"
            className={pinned ? styles.pinBtnActive : styles.pinBtn}
            aria-label={pinned ? `Unpin ${row.name} from trend` : `Pin ${row.name} to trend`}
            aria-pressed={pinned}
            onClick={onTogglePin}
            title="Pin to trend chart"
          >
            <span className="wm-bookmark" aria-hidden />
          </button>
        </td>
        <td className={styles.numCell}>{formatUsageCount(row.surveys)}</td>
        <td>
          <ShareBar share={row.share} />
        </td>
        <td
          className={[
            styles.changeCell,
            changePositive ? styles.changeUp : '',
            changeNegative ? styles.changeDown : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {formatUsageChange(row.change)}
        </td>
      </tr>
      {expanded && row.children
        ? row.children.map((child) => (
            <tr key={child.id} className={styles.childRow}>
              <td className={styles.typeCell}>
                <span className={styles.childIndent} />
                <span className={styles.childName}>{child.name}</span>
              </td>
              <td className={styles.numCell}>{formatUsageCount(child.surveys)}</td>
              <td colSpan={2} />
            </tr>
          ))
        : null}
    </>
  );
}

export function QuestionTypeUsagePage() {
  const { showToast } = useWuShowToast();
  const summary = QUESTION_TYPE_USAGE_SUMMARY;

  const [minCompletes, setMinCompletes] = useState(String(summary.defaultMinCompletes));
  const [draftMinCompletes, setDraftMinCompletes] = useState(String(summary.defaultMinCompletes));
  const [tab, setTab] = useState<QuestionTypeUsageFilterTab>('most-used');
  const [category, setCategory] = useState('all');
  const [trendMetric, setTrendMetric] = useState<TrendMetric>('surveys');
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [pinnedIds, setPinnedIds] = useState<string[]>([...QUESTION_TYPE_USAGE_DEFAULT_PINNED]);

  const filteredRows = useMemo(
    () => filterQuestionTypeUsageRows(QUESTION_TYPE_USAGE_ROWS, tab, category),
    [tab, category]
  );

  const visibleRows =
    tab === 'most-used' ? filteredRows.slice(0, Math.max(10, filteredRows.length - 1)) : filteredRows;

  const selectedCategory =
    QUESTION_TYPE_USAGE_CATEGORY_OPTIONS.find((option) => option.value === category) ??
    QUESTION_TYPE_USAGE_CATEGORY_OPTIONS[0];

  function handleApply(): void {
    const parsed = Number.parseInt(draftMinCompletes, 10);
    if (Number.isNaN(parsed) || parsed < 0) {
      showToast({ message: 'Enter a valid minimum completes value', variant: 'error' });
      return;
    }
    setMinCompletes(String(parsed));
    setDraftMinCompletes(String(parsed));
    showToast({
      message: `Filters applied · min ${parsed} completes`,
      variant: 'success',
    });
  }

  function toggleExpand(id: string): void {
    setExpandedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function togglePin(id: string): void {
    setPinnedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 5) {
        showToast({ message: 'Pin up to 5 types in the trend chart', variant: 'info' });
        return prev;
      }
      return [...prev, id];
    });
  }

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Question type usage</h1>
          <p className={styles.subtitle}>
            Surveys using each type at least once · a survey counts once per type · this data centre
          </p>
        </div>
        <div className={styles.meta}>
          <span>{summary.dataCenterCode}</span>
          <span className={styles.metaDot} aria-hidden>
            ·
          </span>
          <span>{summary.fetchedAtLabel}</span>
        </div>
      </header>

      <section className={styles.filterBar} aria-label="Data set filters">
        <div className={styles.filterLeft}>
          <span className={styles.dataSetLabel}>Data set</span>
          <label className={styles.filterField}>
            <span className={styles.filterLabel}>Surveys created</span>
            <button
              type="button"
              className={styles.dateTrigger}
              onClick={() =>
                showToast({
                  message: 'Date range picker is not available in this prototype',
                  variant: 'info',
                })
              }
            >
              <span className="wm-calendar-today" aria-hidden />
              {summary.defaultDateRangeLabel}
            </button>
          </label>
          <label className={styles.filterField}>
            <span className={styles.filterLabel}>Min completes</span>
            <input
              className={styles.minInput}
              type="number"
              min={0}
              value={draftMinCompletes}
              onChange={(e) => setDraftMinCompletes(e.target.value)}
              aria-label="Minimum completes"
            />
          </label>
          <WuButton onClick={handleApply}>Apply</WuButton>
        </div>
        <div className={styles.filterRight}>
          <div className={styles.filterStats}>
            <span>Showing {summary.rangeDays} days</span>
            <span className={styles.metaDot} aria-hidden>
              ·
            </span>
            <span>
              {formatUsageCount(summary.surveysInScope)} surveys · {summary.typesLoaded} types loaded
            </span>
          </div>
          <button
            type="button"
            className={styles.ghostBtn}
            onClick={() =>
              showToast({
                message: 'Views below already filter instantly in this prototype',
                variant: 'info',
              })
            }
          >
            Views below filter instantly
          </button>
        </div>
      </section>

      <div className={styles.dbStrip}>
        <span className="wm-storage" aria-hidden />
        {summary.databaseCount} databases · {formatUsageCount(summary.surveysInScope)} surveys
      </div>

      <div className={styles.layout}>
        <div className={styles.leftCol}>
          <div className={styles.kpiRow}>
            <article className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Surveys in scope</p>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue}>{formatUsageCount(summary.surveysInScope)}</span>
                <span className={styles.kpiChangeDown}>
                  {formatUsageChange(summary.surveysChange)}
                </span>
              </div>
              <p className={styles.kpiHint}>
                more than {minCompletes} completes · second half vs first
              </p>
            </article>
            <article className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Types in use</p>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue}>
                  {summary.typesInUse} / {summary.typesTotal}
                </span>
              </div>
              <p className={styles.kpiHint}>{summary.typesUnderThreshold} under 40 surveys</p>
            </article>
            <article className={styles.kpiCard}>
              <p className={styles.kpiLabel}>Most used</p>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue}>
                  {formatUsagePercent(summary.mostUsedShare)} {summary.mostUsedName}
                </span>
              </div>
              <p className={styles.kpiHint}>
                in {formatUsageCount(summary.mostUsedSurveys)} surveys
              </p>
            </article>
          </div>

          <section className={styles.trendCard} aria-labelledby="trend-heading">
            <div className={styles.trendHeader}>
              <div>
                <h2 id="trend-heading" className={styles.sectionTitle}>
                  Trend over time
                </h2>
                <p className={styles.sectionSub}>
                  Surveys created per month · {pinnedIds.length} shown
                </p>
              </div>
              <div className={styles.metricToggle} role="group" aria-label="Trend metric">
                <button
                  type="button"
                  className={
                    trendMetric === 'surveys' ? styles.metricToggleOn : styles.metricToggleBtn
                  }
                  onClick={() => setTrendMetric('surveys')}
                >
                  Surveys
                </button>
                <button
                  type="button"
                  className={
                    trendMetric === 'share' ? styles.metricToggleOn : styles.metricToggleBtn
                  }
                  onClick={() => setTrendMetric('share')}
                >
                  Share %
                </button>
              </div>
            </div>
            <p className={styles.trendNote}>
              The current month is excluded — it is still running, so its counts would read as a
              fall.
            </p>
            <TrendChart metric={trendMetric} />
            <div className={styles.trendLegend}>
              {TREND_SERIES_KEYS.map((series) => (
                <span key={series.id} className={styles.legendItem}>
                  <span
                    className={styles.legendSwatch}
                    style={{ background: QUESTION_TYPE_USAGE_TREND_COLORS[series.id] }}
                    aria-hidden
                  />
                  {series.label}
                </span>
              ))}
            </div>
            <div className={styles.pinRow}>
              {pinnedIds.map((id) => {
                const row = QUESTION_TYPE_USAGE_ROWS.find((item) => item.id === id);
                if (!row) return null;
                return (
                  <button
                    key={id}
                    type="button"
                    className={styles.pinChip}
                    onClick={() => togglePin(id)}
                    aria-label={`Unpin ${row.name}`}
                  >
                    <span
                      className={styles.pinChipDot}
                      style={{
                        background: QUESTION_TYPE_USAGE_TREND_COLORS[id] ?? '#64748b',
                      }}
                      aria-hidden
                    />
                    {row.name}
                    <span className="wm-close" aria-hidden />
                  </button>
                );
              })}
              <span className={styles.pinHint}>Pin a row in the table to add it here</span>
            </div>
          </section>
        </div>

        <section className={styles.tableCard} aria-labelledby="types-heading">
          <div className={styles.tableHeader}>
            <div className={styles.tableTitleRow}>
              <h2 id="types-heading" className={styles.sectionTitle}>
                Question types
              </h2>
              <WuMenu
                Trigger={
                  <button type="button" className={styles.categoryTrigger}>
                    {selectedCategory.label}
                    <span className="wm-keyboard-arrow-down" aria-hidden />
                  </button>
                }
                align="start"
              >
                {QUESTION_TYPE_USAGE_CATEGORY_OPTIONS.map((option) => (
                  <WuMenuItem key={option.value} onSelect={() => setCategory(option.value)}>
                    {option.label}
                  </WuMenuItem>
                ))}
              </WuMenu>
            </div>
            <div className={styles.tabRow} role="tablist" aria-label="Question type filters">
              {QUESTION_TYPE_USAGE_FILTER_TABS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.id}
                  className={tab === item.id ? styles.tabOn : styles.tab}
                  onClick={() => setTab(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Question type</th>
                  <th scope="col">Surveys</th>
                  <th scope="col">Share</th>
                  <th scope="col">Change</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className={styles.emptyCell}>
                      No question types match this filter.
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((row) => (
                    <TypeRow
                      key={row.id}
                      row={row}
                      expanded={expandedIds.includes(row.id)}
                      pinned={pinnedIds.includes(row.id)}
                      onToggleExpand={() => toggleExpand(row.id)}
                      onTogglePin={() => togglePin(row.id)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className={styles.tableFooter}>
            <button
              type="button"
              className={styles.footerLink}
              onClick={() =>
                showToast({
                  message: `${summary.remainingTypesCount} remaining type · ${formatUsagePercent(
                    summary.remainingShare,
                    1
                  )} combined`,
                  variant: 'info',
                })
              }
            >
              Show remaining {summary.remainingTypesCount} types{' '}
              {formatUsagePercent(summary.remainingShare, 1)} combined
            </button>
            <span className={styles.footerMeta}>
              {summary.decliningHardCount} down 20% or more
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
