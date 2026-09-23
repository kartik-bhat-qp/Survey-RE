'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  filterQuestionTypeUsageRows,
  formatUsageChange,
  formatUsageCount,
  formatUsagePercent,
  getQuestionTypeUsageSurveyExamples,
  QUESTION_TYPE_USAGE_CATEGORY_OPTIONS,
  QUESTION_TYPE_USAGE_DEFAULT_DATE_FILTER,
  QUESTION_TYPE_USAGE_DEFAULT_PINNED,
  QUESTION_TYPE_USAGE_FILTER_TABS,
  QUESTION_TYPE_USAGE_SUMMARY,
  QUESTION_TYPE_USAGE_TREND_COLORS,
  resolveQuestionTypeUsageDataset,
  type QuestionTypeUsageDateFilter,
  type QuestionTypeUsageFilterTab,
  type QuestionTypeUsageRow,
  type QuestionTypeUsageTrendPoint,
} from '@/data/mock-question-type-usage';
import { QuestionTypeUsageFilterBar } from '@/components/surveys/QuestionTypeUsageFilterBar';
import styles from './QuestionTypeUsagePage.module.css';

const WuMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenu })),
  { ssr: false }
);
const WuMenuItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuItem })),
  { ssr: false }
);
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuModal = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModal })),
  { ssr: false }
);
const WuModalHeader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalHeader })),
  { ssr: false }
);
const WuModalContent = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalContent })),
  { ssr: false }
);
const WuModalFooter = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalFooter })),
  { ssr: false }
);
const WuModalClose = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalClose })),
  { ssr: false }
);

type TrendMetric = 'surveys' | 'share';

function TrendChart({
  metric,
  pinnedIds,
  trend,
  rows,
}: {
  metric: TrendMetric;
  pinnedIds: string[];
  trend: QuestionTypeUsageTrendPoint[];
  rows: QuestionTypeUsageRow[];
}) {
  const width = 560;
  const height = 220;
  const pad = { top: 16, right: 12, bottom: 28, left: 36 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  if (pinnedIds.length === 0 || trend.length === 0) {
    return (
      <div className={styles.trendEmpty}>
        <p>No types pinned yet.</p>
        <p className={styles.trendEmptyHint}>Pin a row in the table to add it here.</p>
      </div>
    );
  }

  const series = pinnedIds.map((id) => {
    const row = rows.find((item) => item.id === id);
    const raw = trend.map((point) => point.values[id] ?? 0);
    const values =
      metric === 'surveys'
        ? raw
        : trend.map((point) => {
            const total = pinnedIds.reduce((sum, pinId) => sum + (point.values[pinId] ?? 0), 0);
            return total ? ((point.values[id] ?? 0) / total) * 100 : 0;
          });
    return {
      id,
      label: row?.name ?? id,
      values,
      color: QUESTION_TYPE_USAGE_TREND_COLORS[id] ?? '#64748b',
    };
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
          pad.left + (trend.length === 1 ? plotW / 2 : (index / (trend.length - 1)) * plotW);
        const y = pad.top + plotH - (value / Math.max(maxY, 1)) * plotH;
        return `${x},${y}`;
      })
      .join(' ');

  return (
    <>
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
        {trend.map((point, index) => {
          const x =
            pad.left + (trend.length === 1 ? plotW / 2 : (index / (trend.length - 1)) * plotW);
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
            stroke={s.color}
            strokeWidth={2}
            points={pointsFor(s.values)}
          />
        ))}
      </svg>
      <div className={styles.trendLegend}>
        {series.map((s) => (
          <span key={s.id} className={styles.legendItem}>
            <span className={styles.legendSwatch} style={{ background: s.color }} aria-hidden />
            {s.label}
          </span>
        ))}
      </div>
    </>
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
  onViewSurveys,
}: {
  row: QuestionTypeUsageRow;
  expanded: boolean;
  pinned: boolean;
  onToggleExpand: () => void;
  onTogglePin: () => void;
  onViewSurveys: () => void;
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
          <button type="button" className={styles.typeNameBtn} onClick={onViewSurveys}>
            <span className={styles.typeName}>{row.name}</span>
          </button>
          <span className={styles.tierBadge}>{row.tier}</span>
          <button
            type="button"
            className={styles.viewSurveysBtn}
            onClick={onViewSurveys}
            aria-label={`View surveys using ${row.name}`}
            title="View surveys"
          >
            <span className="wm-open-in-new" aria-hidden />
          </button>
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

  const [dateFilter, setDateFilter] = useState<QuestionTypeUsageDateFilter>(
    QUESTION_TYPE_USAGE_DEFAULT_DATE_FILTER
  );
  const [minCompletes, setMinCompletes] = useState(QUESTION_TYPE_USAGE_SUMMARY.defaultMinCompletes);
  const [filtersLoading, setFiltersLoading] = useState(false);
  const [tab, setTab] = useState<QuestionTypeUsageFilterTab>('most-used');
  const [category, setCategory] = useState('all');
  const [trendMetric, setTrendMetric] = useState<TrendMetric>('surveys');
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [pinnedIds, setPinnedIds] = useState<string[]>([...QUESTION_TYPE_USAGE_DEFAULT_PINNED]);
  const [showRemaining, setShowRemaining] = useState(false);
  const [drilldownTypeId, setDrilldownTypeId] = useState<string | null>(null);

  const dataset = useMemo(
    () => resolveQuestionTypeUsageDataset(dateFilter, minCompletes),
    [dateFilter, minCompletes]
  );

  const summary = dataset.summary;
  const rows = dataset.rows;

  const filteredRows = useMemo(
    () => filterQuestionTypeUsageRows(rows, tab, category),
    [rows, tab, category]
  );

  const visibleRows = useMemo(() => {
    if (tab !== 'most-used' || showRemaining) return filteredRows;
    if (filteredRows.length <= 10) return filteredRows;
    return filteredRows.slice(0, filteredRows.length - summary.remainingTypesCount);
  }, [filteredRows, tab, showRemaining, summary.remainingTypesCount]);

  const selectedCategory =
    QUESTION_TYPE_USAGE_CATEGORY_OPTIONS.find((option) => option.value === category) ??
    QUESTION_TYPE_USAGE_CATEGORY_OPTIONS[0];

  const drilldownRow = drilldownTypeId
    ? rows.find((row) => row.id === drilldownTypeId) ?? null
    : null;
  const drilldownSurveys = drilldownTypeId
    ? getQuestionTypeUsageSurveyExamples(drilldownTypeId)
    : [];

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

  function handleDownload(): void {
    const header = 'Question type,Tier,Surveys,Share,Change';
    const lines = filteredRows.map(
      (row) =>
        `"${row.name}",${row.tier},${row.surveys},${(row.share * 100).toFixed(1)}%,${(
          row.change * 100
        ).toFixed(1)}%`
    );
    const csv = [header, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'question-type-usage.csv';
    anchor.click();
    URL.revokeObjectURL(url);
    showToast({ message: 'Downloaded question-type-usage.csv', variant: 'success' });
  }

  async function handleShare(): Promise<void> {
    const url = `${window.location.origin}/question-type-usage`;
    try {
      await navigator.clipboard.writeText(url);
      showToast({ message: 'Link copied to clipboard', variant: 'success' });
    } catch {
      showToast({ message: `Share link: ${url}`, variant: 'info' });
    }
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
        <div className={styles.headerActions}>
          <WuButton
            variant="link"
            size="sm"
            Icon={<span className="wm-download" aria-hidden />}
            onClick={handleDownload}
          >
            Download
          </WuButton>
          <WuButton
            size="sm"
            Icon={<span className="wm-share" aria-hidden />}
            onClick={() => void handleShare()}
          >
            Share
          </WuButton>
        </div>
      </header>

      <QuestionTypeUsageFilterBar
        surveysInScope={summary.surveysInScope}
        typesLoaded={summary.typesLoaded}
        dataCenterCode={summary.dataCenterCode}
        onLoadingChange={setFiltersLoading}
        onFiltersApplied={({ dateFilter: nextDate, minCompletes: nextMin }) => {
          setDateFilter(nextDate);
          setMinCompletes(nextMin);
          setShowRemaining(false);
        }}
      />
      <span className={styles.srOnly} aria-live="polite">
        {filtersLoading
          ? 'Updating filters'
          : `Showing ${formatUsageCount(summary.surveysInScope)} surveys and ${
              summary.typesInUse
            } types in use`}
      </span>

      <div className={styles.dbStrip}>
        <span className="wm-storage" aria-hidden />
        {summary.databaseCount} databases · {formatUsageCount(summary.surveysInScope)} surveys
      </div>

      <div className={`${styles.layout} ${filtersLoading ? styles.layoutLoading : ''}`}>
        <div className={styles.leftCol}>
          <div className={styles.kpiRow}>
            <button
              type="button"
              className={styles.kpiCardButton}
              onClick={() => setTab('all')}
            >
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
            </button>
            <button
              type="button"
              className={styles.kpiCardButton}
              onClick={() => setTab('declining')}
            >
              <p className={styles.kpiLabel}>Types in use</p>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue}>
                  {summary.typesInUse} / {summary.typesTotal}
                </span>
              </div>
              <p className={styles.kpiHint}>{summary.typesUnderThreshold} under 40 surveys</p>
            </button>
            <button
              type="button"
              className={styles.kpiCardButton}
              onClick={() => setTab('most-used')}
            >
              <p className={styles.kpiLabel}>Most used</p>
              <div className={styles.kpiValueRow}>
                <span className={styles.kpiValue}>
                  {formatUsagePercent(summary.mostUsedShare)} {summary.mostUsedName}
                </span>
              </div>
              <p className={styles.kpiHint}>
                in {formatUsageCount(summary.mostUsedSurveys)} surveys
              </p>
            </button>
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
            <TrendChart
              metric={trendMetric}
              pinnedIds={pinnedIds}
              trend={dataset.trend}
              rows={rows}
            />
            <div className={styles.pinRow}>
              {pinnedIds.map((id) => {
                const row = rows.find((item) => item.id === id);
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
                  onClick={() => {
                    setTab(item.id);
                    setShowRemaining(false);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.tableWrap}>
            {visibleRows.length === 0 ? (
              <EmptyState
                icon="wm-inbox"
                title={
                  tab === 'unused'
                    ? 'No unused question types'
                    : tab === 'declining'
                      ? 'No declining question types'
                      : 'No question types match this filter'
                }
                description="Try another tab or adjust the data set filters above."
              />
            ) : (
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
                  {visibleRows.map((row) => (
                    <TypeRow
                      key={row.id}
                      row={row}
                      expanded={expandedIds.includes(row.id)}
                      pinned={pinnedIds.includes(row.id)}
                      onToggleExpand={() => toggleExpand(row.id)}
                      onTogglePin={() => togglePin(row.id)}
                      onViewSurveys={() => setDrilldownTypeId(row.id)}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className={styles.tableFooter}>
            {tab === 'most-used' && summary.remainingTypesCount > 0 && !showRemaining ? (
              <button
                type="button"
                className={styles.footerLink}
                onClick={() => setShowRemaining(true)}
              >
                Show remaining {summary.remainingTypesCount} types{' '}
                {formatUsagePercent(summary.remainingShare, 1)} combined
              </button>
            ) : (
              <span className={styles.footerMeta}>
                {formatUsageCount(visibleRows.length)} types shown
              </span>
            )}
            <span className={styles.footerMeta}>
              {summary.decliningHardCount} down 20% or more
            </span>
          </div>
        </section>
      </div>

      {drilldownRow ? (
        <WuModal
          open
          onOpenChange={(open) => {
            if (!open) setDrilldownTypeId(null);
          }}
          variant="action"
          size="md"
        >
          <WuModalHeader>Surveys using {drilldownRow.name}</WuModalHeader>
          <WuModalContent>
            {drilldownSurveys.length === 0 ? (
              <EmptyState
                icon="wm-search"
                title="No sample surveys"
                description="This type has no surveys in the current data set."
              />
            ) : (
              <ul className={styles.drilldownList}>
                {drilldownSurveys.map((survey) => (
                  <li key={survey.id} className={styles.drilldownItem}>
                    <div className={styles.drilldownMain}>
                      <span className={styles.drilldownName}>{survey.name}</span>
                      <span className={styles.drilldownStatus}>{survey.status}</span>
                    </div>
                    <span className={styles.drilldownMeta}>
                      {formatUsageCount(survey.responses)} responses
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </WuModalContent>
          <WuModalFooter>
            <WuModalClose variant="secondary">Close</WuModalClose>
            <WuButton
              onClick={() => {
                showToast({
                  message: `Opened survey list for ${drilldownRow.name}`,
                  variant: 'success',
                });
                setDrilldownTypeId(null);
              }}
            >
              Done
            </WuButton>
          </WuModalFooter>
        </WuModal>
      ) : null}
    </div>
  );
}
