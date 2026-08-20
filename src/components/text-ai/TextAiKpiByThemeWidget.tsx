'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { TextAiWidgetMenu } from '@/components/text-ai/TextAiWidgetMenu';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  TEXT_AI_KPI_DEFINITIONS,
  formatTextAiKpiAnswer,
  formatTextAiKpiDelta,
  formatTextAiKpiScore,
  getDefaultTextAiKpiId,
  getTextAiKpiAnalysis,
  type TextAiKpiDefinition,
  type TextAiKpiId,
  type TextAiKpiSentiment,
  type TextAiKpiThemeResult,
} from '@/data/mock-text-ai-kpi-by-theme';
import {
  DEFAULT_TEXT_AI_WIDGET_TOP_N,
  limitTextAiWidgetItems,
  type TextAiWidgetTopN,
} from '@/data/mock-text-ai-widget-settings';
import styles from './TextAiKpiByThemeWidget.module.css';

const WuCombobox = dynamic(
  () =>
    import('@npm-questionpro/wick-ui-lib').then((module) => ({
      default: module.WuCombobox,
    })),
  { ssr: false }
);

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
  | 'score'
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
  if (key === 'score') return row.score;
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
}: {
  label: string;
  sortKey: KpiSortKey;
  sortState: KpiSortState | null;
  onSort: (key: KpiSortKey) => void;
}) {
  const active = sortState?.key === sortKey;
  const ariaSort = active ? sortState.direction : 'none';
  return (
    <th aria-sort={ariaSort}>
      <button
        type="button"
        className={`${styles.sortButton} ${active ? styles.sortButtonActive : ''}`}
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
  const width = Math.min(50, (Math.abs(row.delta) / maximumDelta) * 100);
  const toneClass =
    row.tone === 'positive'
      ? styles.deltaPositive
      : row.tone === 'negative'
        ? styles.deltaNegative
        : styles.deltaNeutral;

  return (
    <div className={styles.deltaCell}>
      <span className={`${styles.deltaValue} ${toneClass}`}>
        {formatTextAiKpiDelta(definition, row.delta)}
      </span>
      <div className={styles.deltaTrack} aria-hidden>
        <span className={styles.deltaCenter} />
        <span
          className={`${styles.deltaFill} ${toneClass}`}
          style={
            row.delta >= 0
              ? { left: '50%', width: `${width}%` }
              : { right: '50%', width: `${width}%` }
          }
        />
      </div>
    </div>
  );
}

function KpiResultRow({
  row,
  definition,
  isSubtheme = false,
  expanded = false,
  onToggle,
  onDrilldown,
}: {
  row: TextAiKpiThemeResult;
  definition: TextAiKpiDefinition;
  isSubtheme?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  onDrilldown: (row: TextAiKpiThemeResult) => void;
}) {
  const hasSubthemes = Boolean(row.subthemes?.length);
  return (
    <tr className={isSubtheme ? styles.subthemeRow : undefined}>
      <td className={styles.themeCell}>
        {hasSubthemes ? (
          <div className={styles.themeControl}>
            <button
              type="button"
              className={styles.chevronButton}
              onClick={onToggle}
              aria-expanded={expanded}
              aria-label={`${expanded ? 'Collapse' : 'Expand'} ${row.label}`}
            >
              <span
                className={`wm-chevron-right ${styles.chevron} ${
                  expanded ? styles.chevronExpanded : ''
                }`}
                aria-hidden
              />
            </button>
            <button
              type="button"
              className={styles.themeLink}
              onClick={() => onDrilldown(row)}
              aria-label={`View responses for theme ${row.label}`}
            >
              {row.label}
            </button>
          </div>
        ) : isSubtheme ? (
          <button
            type="button"
            className={styles.subthemeLink}
            onClick={() => onDrilldown(row)}
            aria-label={`View responses for sub-theme ${row.label}`}
          >
            {row.label}
          </button>
        ) : null}
      </td>
      <td className={styles.responseCell}>
        <button
          type="button"
          className={styles.responseLink}
          onClick={() => onDrilldown(row)}
          aria-label={`View ${row.responseCount} matched responses for ${row.label}`}
        >
          {row.responseCount.toLocaleString('en-US')}
        </button>
        {row.lowSample ? <span className={styles.lowSample}>Low sample</span> : null}
      </td>
      <td className={styles.scoreCell}>
        {formatTextAiKpiScore(definition, row.score)}
      </td>
      <td>
        <DeltaVisual row={row} definition={definition} />
      </td>
      <td>
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
            <span className={styles.modalEyebrow}>Theme or sub-theme</span>
            <strong>{context.row.label}</strong>
          </div>
          <div>
            <span className={styles.modalEyebrow}>{context.definition.label}</span>
            <strong>{formatTextAiKpiScore(context.definition, context.row.score)}</strong>
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
  const [selectedKpiId, setSelectedKpiId] = useState<TextAiKpiId>(
    getDefaultTextAiKpiId
  );
  const [expandedThemeIds, setExpandedThemeIds] = useState<Set<string>>(
    () => new Set(['theme-0'])
  );
  const [drilldown, setDrilldown] = useState<DrilldownContext | null>(null);
  const [topN, setTopN] = useState<TextAiWidgetTopN>(DEFAULT_TEXT_AI_WIDGET_TOP_N);
  const [sortState, setSortState] = useState<KpiSortState | null>(null);
  const analysis = useMemo(() => getTextAiKpiAnalysis(selectedKpiId), [selectedKpiId]);
  const selectedKpiDefinition =
    TEXT_AI_KPI_DEFINITIONS.find((definition) => definition.id === selectedKpiId) ??
    TEXT_AI_KPI_DEFINITIONS[0];
  const kpiQuestionOptions = useMemo(() => [...TEXT_AI_KPI_DEFINITIONS], []);
  const sortedThemeRows = sortKpiRows(analysis.rows, sortState);
  const visibleRows = limitTextAiWidgetItems(sortedThemeRows, topN);

  function toggleTheme(themeId: string): void {
    setExpandedThemeIds((current) => {
      const next = new Set(current);
      if (next.has(themeId)) next.delete(themeId);
      else next.add(themeId);
      return next;
    });
  }

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

        <section className={styles.summaryBand} aria-label="KPI summary">
          <div className={styles.summaryMetric}>
            <span>Overall {analysis.definition.label}</span>
            <strong>{formatTextAiKpiScore(analysis.definition, analysis.overallScore)}</strong>
          </div>
          <div className={styles.summaryMetric}>
            <span>Paired responses</span>
            <strong>{analysis.pairedResponseCount.toLocaleString('en-US')}</strong>
          </div>
          <div className={styles.summaryQuestion}>
            <span>KPI question</span>
            <div className={styles.kpiSelectWrap}>
              <WuCombobox
                data={kpiQuestionOptions}
                accessorKey={{ value: 'id', label: 'question' }}
                value={selectedKpiDefinition}
                onSelect={(option) => {
                  if (!option || Array.isArray(option)) return;
                  setSelectedKpiId((option as TextAiKpiDefinition).id);
                }}
                enableSearch
                isEllipse
                maxHeight={280}
                noDataContent="No KPI questions found"
                variant="outlined"
                className={styles.kpiSelect}
                aria-label="KPI question"
              />
            </div>
          </div>
        </section>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Theme / sub-theme</th>
                <SortableHeader
                  label="Matched responses"
                  sortKey="responses"
                  sortState={sortState}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="KPI score"
                  sortKey="score"
                  sortState={sortState}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Δ vs overall"
                  sortKey="delta"
                  sortState={sortState}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Sentiment distribution"
                  sortKey="sentiment"
                  sortState={sortState}
                  onSort={handleSort}
                />
              </tr>
            </thead>
            <tbody>
              {visibleRows.flatMap((row) => {
                const expanded = expandedThemeIds.has(row.id);
                return [
                  <KpiResultRow
                    key={row.id}
                    row={row}
                    definition={analysis.definition}
                    expanded={expanded}
                    onToggle={() => toggleTheme(row.id)}
                    onDrilldown={(selectedRow) =>
                      setDrilldown({ row: selectedRow, definition: analysis.definition })
                    }
                  />,
                  ...(expanded
                    ? sortKpiRows(row.subthemes ?? [], sortState).map((subtheme) => (
                        <KpiResultRow
                          key={subtheme.id}
                          row={subtheme}
                          definition={analysis.definition}
                          isSubtheme
                          onDrilldown={(selectedRow) =>
                            setDrilldown({
                              row: selectedRow,
                              definition: analysis.definition,
                            })
                          }
                        />
                      ))
                    : []),
                ];
              })}
            </tbody>
          </table>
        </div>
        <footer className={styles.footerNote}>
          Scores use each KPI’s native calculation. Responses tagged to more than one theme
          appear in each applicable row; every response is counted once within a row. Samples
          below 30 are marked low sample.
        </footer>
      </article>

      <TextAiKpiResponsesModal
        context={drilldown}
        onClose={() => setDrilldown(null)}
      />
    </>
  );
}
