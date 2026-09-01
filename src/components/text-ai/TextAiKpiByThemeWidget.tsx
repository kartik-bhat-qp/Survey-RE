'use client';

import { useMemo, useState } from 'react';
import { TextAiWidgetMenu } from '@/components/text-ai/TextAiWidgetMenu';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  formatTextAiKpiAnswer,
  formatTextAiKpiDelta,
  getDefaultTextAiKpiId,
  getTextAiKpiAnalysis,
  type TextAiKpiDefinition,
  type TextAiKpiSentiment,
  type TextAiKpiThemeResult,
} from '@/data/mock-text-ai-kpi-by-theme';
import { formatThemeNetImpact } from '@/data/mock-text-ai-theme-impact';
import {
  limitTextAiWidgetItems,
  type TextAiWidgetTopN,
} from '@/data/mock-text-ai-widget-settings';
import styles from './TextAiKpiByThemeWidget.module.css';

interface TextAiKpiByThemeWidgetProps {
  question: string;
  onDelete?: () => void;
}

interface DrilldownContext {
  row: TextAiKpiThemeResult;
  definition: TextAiKpiDefinition;
}

type KpiSortKey =
  | 'responses'
  | 'netImpact'
  | 'delta'
  | 'sentiment';

interface KpiSortState {
  key: KpiSortKey;
  direction: 'ascending' | 'descending';
}

const SENTIMENT_LABELS: Record<TextAiKpiSentiment, string> = {
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Negative',
};

function getSortValue(row: TextAiKpiThemeResult, key: KpiSortKey): string | number {
  if (key === 'responses') return row.responseCount;
  if (key === 'netImpact') return row.netImpact;
  if (key === 'delta') return row.delta;
  return row.sentiment.positive;
}

function sortKpiRows(
  rows: readonly TextAiKpiThemeResult[],
  sortState: KpiSortState | null
): TextAiKpiThemeResult[] {
  if (!sortState) return [...rows];
  const multiplier = sortState.direction === 'ascending' ? 1 : -1;
  return [...rows].sort((left, right) => {
    const leftValue = getSortValue(left, sortState.key);
    const rightValue = getSortValue(right, sortState.key);
    return (Number(leftValue) - Number(rightValue)) * multiplier;
  });
}

function SortableHeader({
  label,
  sortKey,
  sortState,
  onSort,
  className,
  align = 'left',
}: {
  label: string;
  sortKey: KpiSortKey;
  sortState: KpiSortState | null;
  onSort: (key: KpiSortKey) => void;
  className?: string;
  align?: 'left' | 'right';
}) {
  const active = sortState?.key === sortKey;
  const ariaSort = active ? sortState.direction : 'none';
  return (
    <th
      className={className}
      aria-sort={ariaSort}
      style={align === 'right' ? { textAlign: 'right' } : undefined}
    >
      <button
        type="button"
        className={`${styles.sortButton} ${active ? styles.sortButtonActive : ''} ${
          align === 'right' ? styles.sortButtonRight : ''
        }`}
        onClick={() => onSort(sortKey)}
      >
        <span>{label}</span>
        <span className={styles.sortIndicator} aria-hidden>
          {active ? (sortState?.direction === 'ascending' ? '↑' : '↓') : '↕'}
        </span>
      </button>
    </th>
  );
}

function SentimentBar({ row }: { row: TextAiKpiThemeResult }) {
  return (
    <div className={styles.sentimentCell}>
      <div
        className={styles.sentimentBar}
        role="img"
        aria-label={`${row.sentiment.positive.toFixed(0)}% positive, ${row.sentiment.neutral.toFixed(0)}% neutral, ${row.sentiment.negative.toFixed(0)}% negative`}
      >
        <span
          className={styles.sentimentPositive}
          style={{ width: `${row.sentiment.positive}%` }}
        />
        <span
          className={styles.sentimentNeutral}
          style={{ width: `${row.sentiment.neutral}%` }}
        />
        <span
          className={styles.sentimentNegative}
          style={{ width: `${row.sentiment.negative}%` }}
        />
      </div>
      <span className={styles.sentimentValue}>
        {row.sentiment.positive.toFixed(0)}% positive
      </span>
    </div>
  );
}

function DeltaVisual({
  row,
  definition,
}: {
  row: TextAiKpiThemeResult;
  definition: TextAiKpiDefinition;
}) {
  const maximumDelta =
    definition.kind === 'mean'
      ? definition.scaleMax - definition.scaleMin
      : definition.kind === 'nps'
        ? 200
        : 100;
  const width = Math.min(100, (Math.abs(row.delta) / maximumDelta) * 100);
  const formatted = formatTextAiKpiDelta(definition, row.delta);
  const isPositive = row.delta > 0;
  const isNegative = row.delta < 0;

  return (
    <div
      className={styles.deltaTrack}
      role="img"
      aria-label={`${row.label} impact per mention: ${formatted}`}
    >
      <div className={styles.deltaNegative}>
        {isNegative ? (
          <>
            <span className={`${styles.coeffLabel} ${styles.deltaNegative}`}>
              {formatted}
            </span>
            <span className={styles.negativeBar} style={{ width: `${width}%` }} />
          </>
        ) : null}
      </div>
      <span className={styles.deltaAxis} aria-hidden />
      <div className={styles.deltaPositive}>
        {isPositive ? (
          <>
            <span className={styles.positiveBar} style={{ width: `${width}%` }} />
            <span className={`${styles.coeffLabel} ${styles.deltaPositive}`}>
              {formatted}
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}

function KpiResultRow({
  row,
  definition,
  onDrilldown,
}: {
  row: TextAiKpiThemeResult;
  definition: TextAiKpiDefinition;
  onDrilldown: (row: TextAiKpiThemeResult) => void;
}) {
  return (
    <tr>
      <td className={styles.themeCell}>
        <button
          type="button"
          className={styles.subthemeLink}
          onClick={() => onDrilldown(row)}
          aria-label={`View responses for sub-theme ${row.label}`}
        >
          <span className={styles.subthemeName}>{row.label}</span>
          {row.parentTheme ? (
            <span className={styles.parentTheme}>{row.parentTheme}</span>
          ) : null}
        </button>
      </td>
      <td className={styles.countCell}>
        <button
          type="button"
          className={styles.countLink}
          onClick={() => onDrilldown(row)}
          aria-label={`View ${row.responseCount} matched responses for ${row.label}`}
        >
          {row.responseCount.toLocaleString('en-US')}
        </button>
        {row.lowSample ? <span className={styles.lowSample}>Low sample</span> : null}
      </td>
      <td
        className={`${styles.netCell} ${
          row.netImpact > 0
            ? styles.netPositive
            : row.netImpact < 0
              ? styles.netNegative
              : ''
        }`}
      >
        {formatThemeNetImpact(row.netImpact)}
      </td>
      <td className={styles.deltaCell}>
        <DeltaVisual row={row} definition={definition} />
      </td>
      <td className={styles.sentimentCellWrap}>
        <SentimentBar row={row} />
      </td>
    </tr>
  );
}

function TextAiKpiResponsesModal({
  context,
  onClose,
}: {
  context: DrilldownContext | null;
  onClose: () => void;
}) {
  const wick = useWickUILib();
  const [search, setSearch] = useState('');
  const filteredResponses = useMemo(() => {
    if (!context) return [];
    const term = search.trim().toLowerCase();
    if (!term) return context.row.responses;
    return context.row.responses.filter(
      (response) =>
        response.id.toLowerCase().includes(term) ||
        response.text.toLowerCase().includes(term)
    );
  }, [context, search]);

  if (!context || !wick) return null;
  const { WuModal, WuModalHeader, WuModalContent } = wick;

  return (
    <WuModal
      open
      onOpenChange={(open) => {
        if (!open) {
          setSearch('');
          onClose();
        }
      }}
      size="md"
      className={styles.modal}
    >
      <WuModalHeader className={styles.modalTitle}>Supporting responses</WuModalHeader>
      <WuModalContent className={styles.modalContent}>
        <div className={styles.modalContext}>
          <div>
            <span className={styles.modalEyebrow}>Sub-theme</span>
            <strong>{context.row.label}</strong>
            {context.row.parentTheme ? (
              <span className={styles.modalParentTheme}>{context.row.parentTheme}</span>
            ) : null}
          </div>
          <div>
            <span className={styles.modalEyebrow}>Net impact</span>
            <strong>{formatThemeNetImpact(context.row.netImpact)}</strong>
          </div>
          <div>
            <span className={styles.modalEyebrow}>Matched responses</span>
            <strong>{context.row.responseCount.toLocaleString('en-US')}</strong>
          </div>
        </div>
        <div className={styles.modalQuestion}>
          <span className={styles.modalEyebrow}>KPI question</span>
          <strong>
            {context.definition.code} · {context.definition.question}
          </strong>
        </div>
        <div className={styles.searchWrap}>
          <span className="wm-search" aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search responses"
            aria-label="Search supporting responses"
          />
          <span>{filteredResponses.length.toLocaleString('en-US')} responses</span>
        </div>
        <div className={styles.responseList}>
          {filteredResponses.map((response) => {
            const answer = response.answers[context.definition.id];
            return (
              <article className={styles.responseItem} key={response.id}>
                <div className={styles.responseItemHeader}>
                  <span>{response.id}</span>
                  <span
                    className={`${styles.sentimentPill} ${
                      styles[`sentimentPill${response.sentiment}`]
                    }`}
                  >
                    {SENTIMENT_LABELS[response.sentiment]}
                  </span>
                </div>
                <div className={styles.responseDetails}>
                  <div className={styles.openEndedResponse}>
                    <span className={styles.responseFieldLabel}>Open-ended response</span>
                    <p>{response.text}</p>
                  </div>
                  <div className={styles.responseKpiPanel}>
                    <div>
                      <span className={styles.responseFieldLabel}>KPI</span>
                      <strong>{context.definition.label}</strong>
                    </div>
                    <div>
                      <span className={styles.responseFieldLabel}>KPI question</span>
                      <p>{context.definition.question}</p>
                    </div>
                    <div>
                      <span className={styles.responseFieldLabel}>KPI response</span>
                      <strong className={styles.kpiAnswer}>
                        {answer === undefined
                          ? 'No KPI answer'
                          : formatTextAiKpiAnswer(context.definition, answer)}
                      </strong>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
          {filteredResponses.length === 0 ? (
            <p className={styles.emptyState}>No responses match your search.</p>
          ) : null}
        </div>
      </WuModalContent>
    </WuModal>
  );
}

export function TextAiKpiByThemeWidget({
  question,
  onDelete,
}: TextAiKpiByThemeWidgetProps) {
  const [drilldown, setDrilldown] = useState<DrilldownContext | null>(null);
  const [topN, setTopN] = useState<TextAiWidgetTopN>(10);
  const [sortState, setSortState] = useState<KpiSortState>({
    key: 'responses',
    direction: 'descending',
  });
  const analysis = useMemo(() => getTextAiKpiAnalysis(getDefaultTextAiKpiId()), []);
  const subthemeRows = useMemo(
    () => analysis.rows.flatMap((row) => row.subthemes ?? []),
    [analysis.rows]
  );
  const sortedRows = sortKpiRows(subthemeRows, sortState);
  const visibleRows = limitTextAiWidgetItems(sortedRows, topN);

  function handleSort(key: KpiSortKey): void {
    setSortState((current) => ({
      key,
      direction:
        current?.key === key && current.direction === 'ascending'
          ? 'descending'
          : 'ascending',
    }));
  }

  return (
    <>
      <article className={styles.card}>
        <header className={`${styles.cardHeader} text-ai-widget-drag-handle`}>
          <div className={styles.cardHeaderMain}>
            <div className={styles.titleBlock}>
              <h2 className={styles.cardTitle}>{question}</h2>
              <span className={styles.widgetLabel}>KPI by Theme</span>
            </div>
          </div>
          <TextAiWidgetMenu
            widgetTitle={`${question} KPI by Theme`}
            topN={topN}
            onTopNChange={setTopN}
            onDelete={onDelete}
          />
        </header>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.subthemeHeading}>Sub-theme</th>
                <SortableHeader
                  label="n"
                  sortKey="responses"
                  sortState={sortState}
                  onSort={handleSort}
                  className={styles.countHeading}
                  align="right"
                />
                <SortableHeader
                  label="Net impact"
                  sortKey="netImpact"
                  sortState={sortState}
                  onSort={handleSort}
                  className={styles.netHeading}
                  align="right"
                />
                <SortableHeader
                  label="Impact per mention"
                  sortKey="delta"
                  sortState={sortState}
                  onSort={handleSort}
                  className={styles.deltaHeading}
                />
                <SortableHeader
                  label="Sentiment"
                  sortKey="sentiment"
                  sortState={sortState}
                  onSort={handleSort}
                  className={styles.sentimentHeading}
                  align="right"
                />
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <KpiResultRow
                  key={row.id}
                  row={row}
                  definition={analysis.definition}
                  onDrilldown={(selectedRow) =>
                    setDrilldown({ row: selectedRow, definition: analysis.definition })
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
      </article>

      <TextAiKpiResponsesModal
        context={drilldown}
        onClose={() => setDrilldown(null)}
      />
    </>
  );
}
