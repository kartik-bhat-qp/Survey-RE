'use client';

import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import * as Tooltip from '@radix-ui/react-tooltip';
import { TextAiWidgetMenu } from '@/components/text-ai/TextAiWidgetMenu';
import {
  formatTextAiKpiAnswer, formatTextAiKpiDelta,
  formatTextAiKpiScore, getTextAiKpiAnalysis, getTextAiKpiImpactUnit,
  textAiKpiFormula, type TextAiKpiConfig, type TextAiKpiId, type TextAiKpiDefinition, type TextAiKpiSentiment,
  type TextAiKpiThemeResult, type TextAiKpiResponseFilter,
  sortTextAiKpiRows, type TextAiKpiSort, type TextAiKpiSortColumn,
} from '@/data/mock-text-ai-kpi-by-theme';
import { limitTextAiWidgetItems, parseTextAiWidgetTopN } from '@/data/mock-text-ai-widget-settings';
import { defaultTextAiWidgetSettings, type TextAiWidgetSettingsProps } from '@/data/text-ai-widget-settings';
import styles from './TextAiKpiByThemeWidget.module.css';

const WuButton = dynamic(() => import('@npm-questionpro/wick-ui-lib').then(m => ({ default: m.WuButton })), { ssr: false });

// Load the dialog and its accessible title together, avoiding a title-less first render.
const ResponsesDialog = dynamic(() => import('@npm-questionpro/wick-ui-lib').then(m => {
  return function ResponsesDialogContent({ children, onClose, title = 'Supporting responses' }: { children: ReactNode; onClose: () => void; title?: string }) {
    return <m.WuModal open onOpenChange={open => { if (!open) onClose(); }} size="md" className={styles.modal}>
      <m.WuModalHeader className={styles.modalTitle}>{title}</m.WuModalHeader>
      <m.WuModalContent className={styles.modalContent}>{children}</m.WuModalContent>
    </m.WuModal>;
  };
}), { ssr: false });

interface TextAiKpiByThemeWidgetProps extends TextAiWidgetSettingsProps {
  question: string;
  onContentHeightChange?: (height: number) => void;
  kpiId?: TextAiKpiId;
  config?: TextAiKpiConfig;
  responseFilter?: TextAiKpiResponseFilter;
  onDelete?: () => void;
}
interface DrilldownContext {
  row: TextAiKpiThemeResult;
  definition: TextAiKpiDefinition;
  overallScore: number | null;
}
const SENTIMENT_LABELS: Record<TextAiKpiSentiment, string> = { positive: 'Positive', neutral: 'Neutral', negative: 'Negative' };

function describeImpact(row: TextAiKpiThemeResult, definition: TextAiKpiDefinition, overall: number | null): string {
  if (row.unavailableReason) return row.unavailableReason + '. Impact is unavailable.';
  return `Overall KPI is ${formatTextAiKpiScore(definition, overall)}. Without responses mentioning ${row.label}, it is ${formatTextAiKpiScore(definition, row.excludingScore)}. The difference is ${formatTextAiKpiDelta(definition, row.impact)} ${getTextAiKpiImpactUnit(definition)}.`;
}

function ImpactBar({ row, definition, extent, onClick, overall }: {
  row: TextAiKpiThemeResult; definition: TextAiKpiDefinition; extent: number; onClick: () => void; overall: number | null;
}) {
  const value = row.impact ?? 0;
  return <button type="button" className={styles.impactButton} onClick={onClick}
    title={describeImpact(row, definition, overall)} aria-label={describeImpact(row, definition, overall) + ' View calculation and responses.'}>
    {row.impact === null ? <span className={styles.unavailable}>{row.unavailableReason}</span> : <>
      <span className={styles.barTrack} aria-hidden="true">
        <span className={styles.zeroLine} />
        <span className={`${styles.impactBar} ${value < 0 ? styles.barNegative : styles.barPositive}`}
          style={{ left: `${value < 0 ? 50 - Math.abs(value) / extent * 50 : 50}%`, width: `${Math.abs(value) / extent * 50}%` }} />
      </span>
      <strong className={value < 0 ? styles.netNegative : value > 0 ? styles.netPositive : ''}>{formatTextAiKpiDelta(definition, row.impact)}</strong>
    </>}
  </button>;
}

function TextAiKpiResponsesModal({
  context,
  onClose,
}: {
  context: DrilldownContext | null;
  onClose: () => void;
}) {
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

  if (!context) return null;

  return (
    <ResponsesDialog onClose={onClose}>
        <div className={styles.modalContext}>
          <div>
            <span className={styles.modalEyebrow}>{context.row.parentTheme ? 'Subtheme' : 'Theme'}</span>
            <strong>{context.row.label}</strong>
            {context.row.parentTheme ? (
              <span className={styles.modalParentTheme}>{context.row.parentTheme}</span>
            ) : null}
          </div>
          <div>
            <span className={styles.modalEyebrow}>Observed impact</span>
            <strong>{formatTextAiKpiDelta(context.definition, context.row.impact)} {getTextAiKpiImpactUnit(context.definition)}</strong>
          </div>
          <div>
            <span className={styles.modalEyebrow}>Matched responses</span>
            <strong>{context.row.responseCount.toLocaleString('en-US')}</strong>
          </div>
        </div>
        <div className={styles.calculation}>
          <strong>How this is calculated</strong>
          <p>{describeImpact(context.row, context.definition, context.overallScore)}</p>
          <p>KPI among these respondents: {formatTextAiKpiScore(context.definition, context.row.score)}.
            Comparison group: {context.row.comparisonCount.toLocaleString('en-US')} responses.</p>
          <p>This is an observed difference, not a prediction of improvement. Searching below only filters this list.</p>
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
          <span>{filteredResponses.length.toLocaleString('en-US')} {filteredResponses.length === 1 ? 'response' : 'responses'}</span>
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
    </ResponsesDialog>
  );
}

export function TextAiKpiByThemeWidget({ question, kpiId = 'nps', config, responseFilter, onDelete, settings, onOpenSettings, responseFilters, preview, onContentHeightChange }: TextAiKpiByThemeWidgetProps) {
  const cardRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (preview || !onContentHeightChange || !cardRef.current) return;
    const card = cardRef.current;
    const observer = new ResizeObserver(() => onContentHeightChange(card.getBoundingClientRect().height));
    observer.observe(card);
    return () => observer.disconnect();
  }, [preview, onContentHeightChange]);
  const selectedKpi = kpiId;
  const s = settings ?? defaultTextAiWidgetSettings('kpi-by-theme', 'Impact on KPI');
  const [drilldown, setDrilldown] = useState<DrilldownContext | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDrilldown(null);
  }, [config, responseFilters, responseFilter]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const topN = parseTextAiWidgetTopN(s.display === 'All' ? 'all' : s.display.replace('Top ', ''));
  useEffect(() => {
    // A change to the settings default resets the local disclosure state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExpanded(new Set());
  }, [s.expanded]);
  const [sort, setSort] = useState<TextAiKpiSort>({ column: 'impact', direction: 'ascending' });
  const analysis = useMemo(() => getTextAiKpiAnalysis(selectedKpi, responseFilters ?? responseFilter, config), [selectedKpi, responseFilter, responseFilters, config]);
  const { definition } = analysis;
  const visibleRows = limitTextAiWidgetItems(sortTextAiKpiRows(analysis.rows, sort), topN);
  const isExpanded = (id: string) => s.expanded ? !expanded.has(id) : expanded.has(id);
  const allExpanded = visibleRows.length > 0 && visibleRows.every(row => isExpanded(row.id));
  const allRows = analysis.rows.flatMap(row => [row, ...(row.subthemes ?? [])]);
  const maxImpact = Math.max(...allRows.map(row => Math.abs(row.impact ?? 0)), 0);
  // One symmetric scale for parents and children, unchanged by expansion or sorting.
  const step = definition.kind === 'mean' ? 0.1 : 5;
  const extent = Math.max(step, Math.ceil(maxImpact / step) * step);
  const unit = getTextAiKpiImpactUnit(definition);
  const impactLabel = `Impact (${definition.kind === 'top-box' ? 'pp' : 'pts'})`;
  const scoreLabel = config?.name.trim() || (definition.kind === 'nps' ? 'NPS' : definition.kind === 'top-box' ? 'CSAT' : 'Mean rating');
  const title = s.name;
  const openResponses = (row: TextAiKpiThemeResult) => setDrilldown({ row, definition, overallScore: analysis.overallScore });
  function toggle(id: string) {
    setExpanded(current => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }
  function sortHeading(column: TextAiKpiSortColumn, label: string, description?: string) {
    const active = sort.column === column;
    return <span className={styles.headingContent}>{description && <Tooltip.Provider delayDuration={150}><Tooltip.Root><Tooltip.Trigger asChild><button type="button" className={styles.infoButton} aria-label={`About ${label}`}><span className="wm-info" aria-hidden /></button></Tooltip.Trigger><Tooltip.Portal><Tooltip.Content className={styles.headerTooltip} sideOffset={6}>{description}<Tooltip.Arrow /></Tooltip.Content></Tooltip.Portal></Tooltip.Root></Tooltip.Provider>}<button type="button" className={styles.sortButton} onClick={() => setSort({ column, direction: active && sort.direction === 'ascending' ? 'descending' : 'ascending' })} aria-label={`Sort by ${label}`}>
      <span className={styles.headingLabel} title={label}>{label}</span><span aria-hidden="true" className={`${styles.sortIcons} ${active ? styles.sortedIcons : ''}`}>
        {(!active || sort.direction !== 'ascending') && <span className={`wm-arrow-drop-down ${styles.sortDown}`} />}
        {(!active || sort.direction !== 'descending') && <span className={`wm-arrow-drop-up ${styles.sortUp}`} />}
      </span>
    </button></span>;
  }
  function renderRow(row: TextAiKpiThemeResult, child = false) {
    return <tr key={row.id} className={child ? styles.childRow : undefined}>
      <th scope="row" className={styles.themeCell}>
        <div className={styles.themeLabel}>
          {!child && Boolean(row.subthemes?.length) ? <button type="button" className={styles.expandButton}
            aria-label={`${isExpanded(row.id) ? 'Collapse' : 'Expand'} ${row.label}`} aria-expanded={isExpanded(row.id)} onClick={() => toggle(row.id)}>
            <span aria-hidden="true" className={`wm-chevron-right ${isExpanded(row.id) ? styles.expandedChevron : ''}`} />
          </button> : <span className={styles.indent} />}
          <button type="button" className={styles.themeLink} onClick={() => openResponses(row)}>{row.label}</button>
        </div>
      </th>
      <td><ImpactBar row={row} definition={definition} extent={extent} overall={analysis.overallScore} onClick={() => openResponses(row)} /></td>
      <td className={styles.scoreCell}>{formatTextAiKpiScore(definition, row.score)}</td>
      <td className={styles.countCell}>
        <button type="button" className={styles.countLink} aria-label={`View ${row.responseCount} responses for ${row.label}`} onClick={() => openResponses(row)}>{row.responseCount.toLocaleString('en-US')}</button>
        {row.lowSample && <span className={styles.lowSample} title="Fewer than 30 responses in this group or the comparison group. Interpret cautiously.">Small sample</span>}
      </td>
      <td className={styles.scoreCell}>{row.responseShare.toFixed(1)}%</td>
    </tr>;
  }
  return <>
    <article ref={cardRef} className={styles.card} aria-label="Impact on KPI widget">
      <header className={`${styles.cardHeader} text-ai-widget-drag-handle`}>
        <h2 className={styles.cardTitle}>{s.showName ? title : ''}</h2>
        <div className={styles.headerActions}>
          <WuButton variant="iconOnly" size="sm" disabled={!visibleRows.length}
            aria-label={allExpanded ? 'Collapse all themes' : 'Expand all themes'} title={allExpanded ? 'Collapse all' : 'Expand all'}
            Icon={<span className={allExpanded ? 'wm-shadow-minus' : 'wm-shadow-add'} aria-hidden />}
            onClick={() => setExpanded(allExpanded !== s.expanded ? new Set() : new Set(visibleRows.map(row => row.id)))} />
          <TextAiWidgetMenu widgetTitle={title} onOpenSettings={onOpenSettings} onDelete={onDelete} preview={preview} />
        </div>
      </header>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr>
            <th scope="col" className={styles.themeHeading} aria-sort={sort.column === 'theme' ? sort.direction : undefined}>{sortHeading('theme', 'Theme / subtheme')}</th>
            <th scope="col" className={styles.impactHeading} aria-sort={sort.column === 'impact' ? sort.direction : undefined}>{sortHeading('impact', impactLabel, `Overall ${scoreLabel} minus ${scoreLabel} excluding responses mentioning this topic, in ${unit}. Negative values are associated with a lower KPI. This is an observed difference, not a predicted causal effect.`)}</th>
            <th scope="col" className={styles.scoreHeading} aria-sort={sort.column === 'score' ? sort.direction : undefined} title="KPI among the respondents in this row">{sortHeading('score', scoreLabel, `${scoreLabel} among the unique respondents mentioning this topic. ${config ? textAiKpiFormula(config) : 'Calculated using the selected KPI question.'} Only matched analyzed text and included KPI answers enter the base.`)}</th>
            <th scope="col" className={styles.countHeading} aria-sort={sort.column === 'responses' ? sort.direction : undefined}>{sortHeading('responses', 'Responses')}</th>
            <th scope="col" className={styles.shareHeading} aria-sort={sort.column === 'share' ? sort.direction : undefined}>{sortHeading('share', 'Share of base', 'Unique responses mentioning this topic ÷ all eligible matched responses × 100. Subthemes use the same overall base. Topics can overlap, so shares may add up to more than 100%.')}</th>
          </tr></thead>
          <tbody>

            {analysis.pairedResponseCount === 0 ? <tr><td colSpan={5} className={styles.emptyState}>No eligible responses. Change the KPI in widget settings or adjust dashboard filters.</td></tr> : visibleRows.map(row => <Fragment key={row.id}>{renderRow(row)}{isExpanded(row.id) && sortTextAiKpiRows(row.subthemes ?? [], sort).map(child => renderRow(child, true))}</Fragment>)}
          </tbody>
          {s.showOverall && <tfoot>
            <tr className={styles.overallRow}>
              <th scope="row"><button type="button" className={styles.overallButton} onClick={() => setDetailsOpen(true)} title="Baseline across all eligible analyzed responses, not a sum of themes. View coverage and calculation details.">Overall</button></th>
              <td className={styles.baselineCell}><span title="Baseline for comparison; overall impact is not defined.">—</span></td>
              <td className={styles.scoreCell}>{formatTextAiKpiScore(definition, analysis.overallScore)}</td>
              <td className={styles.countCell}>{analysis.pairedResponseCount.toLocaleString('en-US')}</td>
              <td className={styles.scoreCell}>{analysis.pairedResponseCount ? '100.0%' : '—'}</td>
            </tr>
          </tfoot>}
        </table>
      </div>
    </article>
    {detailsOpen && <ResponsesDialog title="About this analysis" onClose={() => setDetailsOpen(false)}>
      <div className={styles.settingsForm}>
        <p><strong>Analyzed text question:</strong> {question}</p>
        <p><strong>KPI question:</strong> {definition.code} · {definition.question}</p>
        <p><strong>Overall:</strong> {formatTextAiKpiScore(definition, analysis.overallScore)} across {analysis.pairedResponseCount.toLocaleString('en-US')} unique responses with analyzed, nonblank text and a valid KPI. The selected response filters apply to the entire calculation.</p>
        <p><strong>Text coverage:</strong> {analysis.coverage === null ? 'Unavailable' : `${analysis.coverage.toFixed(1)}%`} of {analysis.scoredResponseCount.toLocaleString('en-US')} valid KPI responses have analyzed text. {analysis.sourceResponseCount - analysis.pairedResponseCount} source responses are excluded because the KPI is missing/invalid or text is blank/unanalyzed.</p>
        <p><strong>Impact:</strong> overall KPI − KPI excluding responses mentioning this theme. Click an impact to inspect both values and the supporting responses.</p>
        <p>Each row’s {scoreLabel} is the KPI among its respondents. Subthemes use the same overall base. Themes can overlap, so their counts, shares and impacts do not add up. Observed differences do not predict the effect of fixing an issue.</p>
        <p className={styles.prototypeNote}>Sample data: synthetic restaurant feedback, shared across question selections in this prototype.</p>
      </div>
    </ResponsesDialog>}
    {drilldown && <TextAiKpiResponsesModal key={`${selectedKpi}-${drilldown.row.id}`} context={drilldown} onClose={() => setDrilldown(null)} />}
  </>;
}
