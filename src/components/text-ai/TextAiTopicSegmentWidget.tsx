'use client';

import { useMemo, useState } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { StandardLoader } from '@/components/ui/StandardLoader';
import { TextAiEmergingBadge } from '@/components/text-ai/TextAiEmergingBadge';
import { TextAiWidgetMenu } from '@/components/text-ai/TextAiWidgetMenu';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { TextAiSentimentResponsesModal } from '@/components/text-ai/TextAiSentimentResponsesModal';
import {
  TEXT_AI_SEGMENT_LABELS,
  type TextAiSegmentKey,
  type TextAiVerbatimModalContext,
} from '@/data/mock-text-ai-sentiment-verbatims';
import {
  formatTopicSegmentPercentage,
  GENDER_COLUMN_LABELS,
  GENDER_COMPARISON_LETTERS,
  getGenderSignificanceMarkers,
  getTopicSegmentMaxPercentage,
  TEXT_AI_GENDER_KEYS,
  TEXT_AI_TOPIC_SEGMENT_KEYS,
  topicRowHasSubtopics,
  type TextAiTopicSegmentCell,
  type TextAiTopicSegmentKey,
  type TextAiTopicSegmentRow,
  type TextAiTopicSegmentWidget,
  type TextAiGenderKey,
} from '@/data/mock-text-ai-topic-segment-widget';
import styles from './TextAiTopicSegmentWidget.module.css';

interface TextAiTopicSegmentWidgetProps {
  widget: TextAiTopicSegmentWidget;
  onDelete?: () => void;
}

const TEXT_AI_STAT_TEST_SEGMENTS: TextAiSegmentKey[] = [...TEXT_AI_TOPIC_SEGMENT_KEYS];

function resolveVisibleSegmentKeys(
  widget: TextAiTopicSegmentWidget,
  showAllForStatTesting: boolean
): TextAiTopicSegmentKey[] {
  if (showAllForStatTesting) return TEXT_AI_TOPIC_SEGMENT_KEYS;
  return widget.visibleSegmentKeys?.length
    ? widget.visibleSegmentKeys
    : TEXT_AI_TOPIC_SEGMENT_KEYS;
}

function SegmentCell({
  cell,
  barClassName,
  maxPercentage,
  significanceMarkers,
  showChiSquare,
  dimmed,
  onCountClick,
}: {
  cell: TextAiTopicSegmentCell;
  barClassName: string;
  maxPercentage: number;
  significanceMarkers?: { higherThan: string; lowerThan: string };
  showChiSquare?: boolean;
  dimmed?: boolean;
  onCountClick?: () => void;
}) {
  const barWidth = `${Math.max(4, (cell.percentage / maxPercentage) * 100)}%`;
  const hasMarkers =
    showChiSquare &&
    significanceMarkers &&
    (significanceMarkers.higherThan.length > 0 || significanceMarkers.lowerThan.length > 0);

  return (
    <div className={`${styles.segmentCell} ${dimmed ? styles.segmentCellDisabled : ''}`}>
      <div className={styles.metricRow}>
        {onCountClick ? (
          <button
            type="button"
            className={styles.countBtn}
            onClick={onCountClick}
            aria-label={`View ${cell.count.toLocaleString()} responses`}
          >
            {cell.count.toLocaleString()}
          </button>
        ) : (
          <span className={styles.count}>{cell.count.toLocaleString()}</span>
        )}
        <span className={styles.percentage}>
          {formatTopicSegmentPercentage(cell.percentage)}
          {hasMarkers ? (
            <span className={styles.significanceMarkers}>
              {significanceMarkers.higherThan ? (
                <sup
                  className={styles.comparisonHigher}
                  title={`Significantly higher than ${significanceMarkers.higherThan}`}
                >
                  {significanceMarkers.higherThan}
                </sup>
              ) : null}
              {significanceMarkers.lowerThan ? (
                <sup
                  className={styles.comparisonLower}
                  title={`Significantly lower than ${significanceMarkers.lowerThan}`}
                >
                  {significanceMarkers.lowerThan}
                </sup>
              ) : null}
            </span>
          ) : null}
        </span>
      </div>
      <div className={styles.barTrack} aria-hidden>
        <div className={`${styles.barFill} ${barClassName}`} style={{ width: barWidth }} />
      </div>
    </div>
  );
}

function TopicSegmentRow({
  row,
  maxPercentage,
  isExpanded,
  onToggle,
  isSubtopic = false,
  isExpandable = false,
  showChiSquare = false,
  activeSegments,
  visibleSegmentKeys,
  onCountClick,
}: {
  row: TextAiTopicSegmentRow;
  maxPercentage: number;
  isExpanded?: boolean;
  onToggle?: () => void;
  isSubtopic?: boolean;
  isExpandable?: boolean;
  showChiSquare?: boolean;
  activeSegments: ReadonlySet<TextAiSegmentKey>;
  visibleSegmentKeys: readonly TextAiTopicSegmentKey[];
  parentTopicLabel?: string | null;
  onCountClick?: (segment: TextAiSegmentKey, cell: TextAiTopicSegmentCell) => void;
}) {
  function handleCountClick(segment: TextAiSegmentKey, cell: TextAiTopicSegmentCell) {
    if (cell.count <= 0) return;
    onCountClick?.(segment, cell);
  }
  const hasSubtopics = topicRowHasSubtopics(row);
  const showExpandControl = isExpandable && hasSubtopics;
  const { genderChiSquare: chi } = row;
  const showOverall = visibleSegmentKeys.includes('overall');
  const visibleGenderKeys = TEXT_AI_GENDER_KEYS.filter((key) =>
    visibleSegmentKeys.includes(key)
  );

  return (
    <tr className={isSubtopic ? styles.subtopicRow : undefined}>
      <td className={isSubtopic ? styles.subtopicCell : styles.topicCell}>
        {showExpandControl ? (
          <button
            type="button"
            className={styles.topicBtn}
            aria-expanded={isExpanded}
            onClick={onToggle}
          >
            <span className={styles.topicRowInner}>
              <span className={styles.topicLeading}>
                <span
                  className={`wm-chevron-right ${styles.topicChevron} ${
                    isExpanded ? styles.topicChevronExpanded : ''
                  }`}
                  aria-hidden
                />
              </span>
              <span className={styles.topicLabel}>
                <span>{row.topic}</span>
                {row.emerging ? <TextAiEmergingBadge /> : null}
              </span>
            </span>
          </button>
        ) : (
          <span className={styles.topicRowInner}>
            <span className={styles.topicLeading} aria-hidden />
            <span className={isSubtopic ? styles.subtopicLabel : styles.topicLabel}>
              <span>{row.topic}</span>
              {row.emerging ? <TextAiEmergingBadge /> : null}
            </span>
          </span>
        )}
      </td>
      {showOverall ? (
        <td>
          <SegmentCell
            cell={row.overall}
            barClassName={styles.barOverall}
            maxPercentage={maxPercentage}
            dimmed={showChiSquare && !activeSegments.has('overall')}
            onCountClick={
              onCountClick ? () => handleCountClick('overall', row.overall) : undefined
            }
          />
        </td>
      ) : null}
      {visibleGenderKeys.map((genderKey) => {
        const enabled = activeSegments.has(genderKey);
        const comparisons = enabled
          ? chi.pairwiseComparisons.filter(
              (pair) =>
                activeSegments.has(pair.groupA) && activeSegments.has(pair.groupB)
            )
          : [];
        const markers = enabled
          ? getGenderSignificanceMarkers(genderKey, row, comparisons)
          : { higherThan: '', lowerThan: '' };
        return (
          <td key={genderKey}>
            <SegmentCell
              cell={row[genderKey]}
              barClassName={
                genderKey === 'female'
                  ? styles.barFemale
                  : genderKey === 'otherGender'
                    ? styles.barOtherGender
                    : styles.barMale
              }
              maxPercentage={maxPercentage}
              significanceMarkers={markers}
              showChiSquare={showChiSquare && enabled}
              dimmed={showChiSquare && !enabled}
              onCountClick={
                onCountClick ? () => handleCountClick(genderKey, row[genderKey]) : undefined
              }
            />
          </td>
        );
      })}
    </tr>
  );
}

function TopicSegmentGroup({
  row,
  maxPercentage,
  expandedRowIds,
  onToggle,
  showChiSquare,
  activeSegments,
  visibleSegmentKeys,
  onCountClick,
}: {
  row: TextAiTopicSegmentRow;
  maxPercentage: number;
  expandedRowIds: Set<string>;
  onToggle: (rowId: string) => void;
  showChiSquare: boolean;
  activeSegments: ReadonlySet<TextAiSegmentKey>;
  visibleSegmentKeys: readonly TextAiTopicSegmentKey[];
  onCountClick: (
    row: TextAiTopicSegmentRow,
    parentTopicLabel: string | null,
    segment: TextAiSegmentKey,
    cell: TextAiTopicSegmentCell
  ) => void;
}) {
  const isExpanded = expandedRowIds.has(row.id);

  return (
    <>
      <TopicSegmentRow
        row={row}
        maxPercentage={maxPercentage}
        isExpanded={isExpanded}
        isExpandable
        showChiSquare={showChiSquare}
        activeSegments={activeSegments}
        visibleSegmentKeys={visibleSegmentKeys}
        onToggle={() => onToggle(row.id)}
        onCountClick={(segment, cell) => onCountClick(row, null, segment, cell)}
      />
      {isExpanded &&
        row.subtopics?.map((subtopic) => (
          <TopicSegmentRow
            key={subtopic.id}
            row={subtopic}
            maxPercentage={maxPercentage}
            isSubtopic
            parentTopicLabel={row.topic}
            showChiSquare={showChiSquare}
            activeSegments={activeSegments}
            visibleSegmentKeys={visibleSegmentKeys}
            onCountClick={(segment, cell) => onCountClick(subtopic, row.topic, segment, cell)}
          />
        ))}
    </>
  );
}

function GenderColumnHeader({ genderKey }: { genderKey: TextAiGenderKey }) {
  return (
    <>
      {GENDER_COLUMN_LABELS[genderKey]}
      <sup className={styles.headerLetter}>{GENDER_COMPARISON_LETTERS[genderKey]}</sup>
    </>
  );
}

export function TextAiTopicSegmentWidgetCard({
  widget,
  onDelete,
}: TextAiTopicSegmentWidgetProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());
  const [statTestingApplied, setStatTestingApplied] = useState(false);
  const [activeSegments, setActiveSegments] = useState<Set<TextAiSegmentKey>>(
    () => new Set(TEXT_AI_STAT_TEST_SEGMENTS)
  );
  const [verbatimModalOpen, setVerbatimModalOpen] = useState(false);
  const [verbatimContext, setVerbatimContext] = useState<TextAiVerbatimModalContext | null>(
    null
  );

  function openVerbatimModal(
    row: TextAiTopicSegmentRow,
    parentTopicLabel: string | null,
    segment: TextAiSegmentKey,
    cell: TextAiTopicSegmentCell
  ) {
    setVerbatimContext({
      rowId: row.id,
      topicLabel: row.topic,
      parentTopicLabel,
      segment,
      segmentLabel: TEXT_AI_SEGMENT_LABELS[segment],
      count: cell.count,
    });
    setVerbatimModalOpen(true);
  }

  const showChiSquare = statTestingApplied;
  const visibleSegmentKeys = resolveVisibleSegmentKeys(widget, showChiSquare);
  const visibleGenderKeys = TEXT_AI_GENDER_KEYS.filter((key) =>
    visibleSegmentKeys.includes(key)
  );
  const showOverall = visibleSegmentKeys.includes('overall');
  const overallOnly =
    visibleSegmentKeys.length === 1 && visibleSegmentKeys[0] === 'overall';

  const maxPercentage = useMemo(
    () => getTopicSegmentMaxPercentage(widget.rows, visibleSegmentKeys),
    // visibleSegmentKeys is derived from widget.visibleSegmentKeys + showChiSquare
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [widget.rows, widget.visibleSegmentKeys, showChiSquare]
  );

  function toggleRow(rowId: string) {
    setExpandedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  }

  if (!wick) {
    return (
      <article className={styles.card}>
        <StandardLoader message="Loading widget…" />
      </article>
    );
  }

  function toggleStatTesting(): void {
    setStatTestingApplied((isApplied) => {
      const nextApplied = !isApplied;
      if (nextApplied) {
        setActiveSegments(new Set(TEXT_AI_STAT_TEST_SEGMENTS));
        showToast({ message: 'Stat testing applied', variant: 'success' });
      } else {
        showToast({ message: 'Stat testing disabled', variant: 'success' });
      }
      return nextApplied;
    });
  }

  function toggleSegment(key: TextAiSegmentKey, checked: boolean): void {
    setActiveSegments((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  return (
    <article className={styles.card}>
      <header className={`${styles.cardHeader} text-ai-widget-drag-handle`}>
        <div className={styles.cardHeaderMain}>
          <h2 className={styles.cardTitle}>{widget.question}</h2>
          <button
            type="button"
            className={`${styles.chiToggle} ${showChiSquare ? styles.chiToggleActive : ''}`}
            onClick={toggleStatTesting}
            aria-pressed={showChiSquare}
          >
            {statTestingApplied ? 'Disable Stat Testing' : 'Stat testing'}
          </button>
        </div>
        <TextAiWidgetMenu widgetTitle={widget.question} onDelete={onDelete} />
      </header>

      <div className={styles.tableWrap}>
        <table
          className={`${styles.table} ${overallOnly ? styles.tableOverallOnly : ''}`}
        >
          <thead>
            <tr>
              <th>Topic</th>
              {showOverall ? (
                <th
                  className={
                    showChiSquare && !activeSegments.has('overall')
                      ? styles.columnHeaderDisabled
                      : undefined
                  }
                >
                  <span className={styles.headerWithToggle}>
                    {showChiSquare ? (
                      <input
                        type="checkbox"
                        className={styles.headerCheckbox}
                        checked={activeSegments.has('overall')}
                        onChange={(e) => toggleSegment('overall', e.target.checked)}
                        aria-label="Include Overall in stat testing"
                      />
                    ) : null}
                    <span>Overall</span>
                  </span>
                </th>
              ) : null}
              {visibleGenderKeys.map((genderKey) => {
                const enabled = activeSegments.has(genderKey);
                return (
                  <th
                    key={genderKey}
                    className={
                      showChiSquare && !enabled ? styles.columnHeaderDisabled : undefined
                    }
                  >
                    <span className={styles.headerWithToggle}>
                      {showChiSquare ? (
                        <input
                          type="checkbox"
                          className={styles.headerCheckbox}
                          checked={enabled}
                          onChange={(e) => toggleSegment(genderKey, e.target.checked)}
                          aria-label={`Include ${GENDER_COLUMN_LABELS[genderKey]} in stat testing`}
                        />
                      ) : null}
                      <span>
                        <GenderColumnHeader genderKey={genderKey} />
                      </span>
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {widget.rows.map((row) => (
              <TopicSegmentGroup
                key={row.id}
                row={row}
                maxPercentage={maxPercentage}
                expandedRowIds={expandedRowIds}
                onToggle={toggleRow}
                showChiSquare={showChiSquare}
                activeSegments={activeSegments}
                visibleSegmentKeys={visibleSegmentKeys}
                onCountClick={openVerbatimModal}
              />
            ))}
          </tbody>
        </table>
      </div>

      {showChiSquare ? (
        <div className={styles.chiLegend} aria-label="Stat testing note">
          <p className={styles.chiLegendTitle}>Stat testing note</p>
          <p className={styles.chiLegendText}>
            Superscript letters identify the comparison columns: Male <sup>a</sup>,
            Female <sup>b</sup>, and Other gender <sup>c</sup>. Green letters indicate a
            significantly higher value than the referenced column; red letters indicate a
            significantly lower value.
          </p>
          <p className={styles.chiLegendText}>
            Uncheck a column to exclude it from stat testing. Excluded columns are
            dimmed and their pairwise significance markers are hidden until the column is
            selected again.
          </p>
          <p className={`${styles.chiLegendText} ${styles.chiLegendNote}`}>
            Bases below 30 are not included in stat testing.
          </p>
        </div>
      ) : null}

      <TextAiSentimentResponsesModal
        open={verbatimModalOpen}
        onOpenChange={setVerbatimModalOpen}
        context={verbatimContext}
      />
    </article>
  );
}
