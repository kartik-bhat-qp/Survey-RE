'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { StandardLoader } from '@/components/ui/StandardLoader';
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
  topicRowHasSubtopics,
  type TextAiTopicSegmentCell,
  type TextAiTopicSegmentRow,
  type TextAiTopicSegmentWidget,
  type TextAiGenderKey,
} from '@/data/mock-text-ai-topic-segment-widget';
import styles from './TextAiTopicSegmentWidget.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

interface TextAiTopicSegmentWidgetProps {
  widget: TextAiTopicSegmentWidget;
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
  activeGenderSegments,
  onCountClick,
}: {
  row: TextAiTopicSegmentRow;
  maxPercentage: number;
  isExpanded?: boolean;
  onToggle?: () => void;
  isSubtopic?: boolean;
  isExpandable?: boolean;
  showChiSquare?: boolean;
  activeGenderSegments: ReadonlySet<TextAiGenderKey>;
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
              <span className={styles.topicLabel}>{row.topic}</span>
            </span>
          </button>
        ) : (
          <span className={styles.topicRowInner}>
            <span className={styles.topicLeading} aria-hidden />
            <span className={isSubtopic ? styles.subtopicLabel : styles.topicLabel}>{row.topic}</span>
          </span>
        )}
      </td>
      <td>
        <SegmentCell
          cell={row.overall}
          barClassName={styles.barOverall}
          maxPercentage={maxPercentage}
          onCountClick={
            onCountClick ? () => handleCountClick('overall', row.overall) : undefined
          }
        />
      </td>
      {TEXT_AI_GENDER_KEYS.map((genderKey) => {
        const enabled = activeGenderSegments.has(genderKey);
        const comparisons = enabled
          ? chi.pairwiseComparisons.filter(
              (pair) =>
                activeGenderSegments.has(pair.groupA) &&
                activeGenderSegments.has(pair.groupB)
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
  activeGenderSegments,
  onCountClick,
}: {
  row: TextAiTopicSegmentRow;
  maxPercentage: number;
  expandedRowIds: Set<string>;
  onToggle: (rowId: string) => void;
  showChiSquare: boolean;
  activeGenderSegments: ReadonlySet<TextAiGenderKey>;
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
        activeGenderSegments={activeGenderSegments}
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
            activeGenderSegments={activeGenderSegments}
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

export function TextAiTopicSegmentWidgetCard({ widget }: TextAiTopicSegmentWidgetProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());
  const [statTestingApplied, setStatTestingApplied] = useState(false);
  const [activeGenderSegments, setActiveGenderSegments] = useState<Set<TextAiGenderKey>>(
    () => new Set(TEXT_AI_GENDER_KEYS)
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

  const maxPercentage = useMemo(
    () => getTopicSegmentMaxPercentage(widget.rows),
    [widget.rows]
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
        setActiveGenderSegments(new Set(TEXT_AI_GENDER_KEYS));
        showToast({ message: 'Stat testing applied', variant: 'success' });
      } else {
        showToast({ message: 'Stat testing disabled', variant: 'success' });
      }
      return nextApplied;
    });
  }

  function toggleGenderSegment(key: TextAiGenderKey, checked: boolean): void {
    setActiveGenderSegments((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  const showChiSquare = statTestingApplied;

  return (
    <article className={styles.card}>
      <header className={styles.cardHeader}>
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
        <WuButton
          variant="iconOnly"
          size="sm"
          aria-label="Widget menu"
          onClick={() => showToast({ message: 'Widget menu', variant: 'success' })}
          Icon={<span className="wm-more-vert" />}
        />
      </header>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Topic</th>
              <th>
                <span>Overall</span>
              </th>
              {TEXT_AI_GENDER_KEYS.map((genderKey) => {
                const enabled = activeGenderSegments.has(genderKey);
                return (
                  <th
                    key={genderKey}
                    className={showChiSquare && !enabled ? styles.columnHeaderDisabled : undefined}
                  >
                    <span className={styles.headerWithToggle}>
                      {showChiSquare ? (
                        <input
                          type="checkbox"
                          className={styles.headerCheckbox}
                          checked={enabled}
                          onChange={(e) => toggleGenderSegment(genderKey, e.target.checked)}
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
                activeGenderSegments={activeGenderSegments}
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
            Uncheck a gender column to exclude it from stat testing. Excluded columns are
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
