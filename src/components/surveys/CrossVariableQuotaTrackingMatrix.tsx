'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AdvanceQuota } from '@/data/mock-advance-quotas';
import {
  aggregateCrossVariableRows,
  getCrossVariableOptionForColumn,
  getCrossVariablePrimaryDetailLabel,
  groupCrossVariableRowsByPrimary,
  type CrossVariableColumn,
  type CrossVariableTrackingSet,
} from '@/data/mock-cross-variable-quota';
import styles from './CrossVariableQuotaTrackingMatrix.module.css';

function formatCount(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function progressTone(pct: number): 'low' | 'mid' | 'high' {
  if (pct >= 80) return 'high';
  if (pct >= 50) return 'mid';
  return 'low';
}

function TrackingCell({
  current,
  target,
  ariaLabel,
}: {
  current: number;
  target: number;
  ariaLabel: string;
}) {
  const pct = target === 0 ? 0 : Math.min((current / target) * 100, 100);
  const tone = progressTone(pct);

  return (
    <div className={styles.trackingCell} title={`${current} of ${target} (${Math.round(pct)}%)`}>
      <span
        className={`${styles.trackingValue} ${
          tone === 'high'
            ? styles.trackingValueHigh
            : tone === 'mid'
              ? styles.trackingValueMid
              : styles.trackingValueLow
        }`}
        aria-label={ariaLabel}
      >
        {formatCount(current)}/{formatCount(target)}
      </span>
      <span className={styles.trackingBar} aria-hidden>
        <span
          className={`${styles.trackingBarFill} ${
            tone === 'high'
              ? styles.trackingBarFillHigh
              : tone === 'mid'
                ? styles.trackingBarFillMid
                : styles.trackingBarFillLow
          }`}
          style={{ width: `${pct}%` }}
        />
      </span>
    </div>
  );
}

function MatrixDataCells({
  rowLabel,
  overallCurrent,
  overallTarget,
  columnMetrics,
  columns,
  rows,
}: {
  rowLabel: string;
  overallCurrent: number;
  overallTarget: number;
  columnMetrics: { current: number; target: number }[];
  columns: CrossVariableColumn[];
  rows: AdvanceQuota[];
}) {
  return (
    <>
      <td className={`${styles.cell} ${styles.overallCell}`}>
        <TrackingCell
          current={overallCurrent}
          target={overallTarget}
          ariaLabel={`${rowLabel}, overall progress`}
        />
      </td>
      {columns.map((column, index) => {
        const metrics = columnMetrics[index] ?? { current: 0, target: 0 };

        if (metrics.target > 0) {
          return (
            <td key={`${rowLabel}-${column.columnKey}`} className={styles.cell}>
              <TrackingCell
                current={metrics.current}
                target={metrics.target}
                ariaLabel={`${rowLabel}, ${column.questionText}, ${column.optionLabel}`}
              />
            </td>
          );
        }

        const hasChildValue = rows.some((row) => {
          const option = getCrossVariableOptionForColumn(row, column);
          return (option?.target ?? 0) > 0;
        });

        return (
          <td key={`${rowLabel}-${column.columnKey}`} className={styles.cell}>
            {hasChildValue ? (
              <TrackingCell
                current={metrics.current}
                target={metrics.target}
                ariaLabel={`${rowLabel}, ${column.questionText}, ${column.optionLabel}`}
              />
            ) : (
              <span className={styles.emptyCell}>—</span>
            )}
          </td>
        );
      })}
    </>
  );
}

interface CrossVariableQuotaTrackingMatrixProps {
  trackingSet: CrossVariableTrackingSet;
}

export function CrossVariableQuotaTrackingMatrix({
  trackingSet,
}: CrossVariableQuotaTrackingMatrixProps) {
  const { rows, columns, batchId } = trackingSet;
  const [expandedGroupKeys, setExpandedGroupKeys] = useState<Set<string>>(() => new Set());

  const rowGroups = useMemo(() => groupCrossVariableRowsByPrimary(rows), [rows]);

  useEffect(() => {
    setExpandedGroupKeys(new Set());
  }, [batchId]);

  const columnGroups = useMemo(() => {
    const groups: { questionId: number; questionText: string; columns: CrossVariableColumn[] }[] =
      [];
    for (const column of columns) {
      const existing = groups.find((group) => group.questionText === column.questionText);
      if (existing) {
        existing.columns.push(column);
      } else {
        groups.push({
          questionId: column.questionId,
          questionText: column.questionText,
          columns: [column],
        });
      }
    }
    return groups;
  }, [columns]);

  function toggleGroup(groupKey: string): void {
    setExpandedGroupKeys((prev) => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  }

  if (rows.length === 0 || columns.length === 0) {
    return (
      <p className={styles.emptyState}>
        No cross variable quotas to track yet. Create a cross variable quota matrix to see
        progress here.
      </p>
    );
  }

  return (
    <div className={styles.matrixWrap}>
      <table className={styles.matrix}>
        <thead>
          <tr>
            <th className={styles.cornerCell} rowSpan={2} scope="col">
              Primary combination
            </th>
            <th className={styles.overallHeader} rowSpan={2} scope="col">
              Overall
            </th>
            {columnGroups.map((group) => (
              <th
                key={group.questionText}
                className={styles.groupHeader}
                colSpan={group.columns.length}
                scope="colgroup"
              >
                <span className={styles.groupTitle}>{group.questionText}</span>
              </th>
            ))}
          </tr>
          <tr>
            {columnGroups.flatMap((group) =>
              group.columns.map((column) => (
                <th key={column.columnKey} className={styles.optionHeader} scope="col">
                  {column.optionLabel}
                </th>
              ))
            )}
          </tr>
        </thead>
        <tbody>
          {rowGroups.map((group) => {
            const isExpanded = expandedGroupKeys.has(group.key);
            const aggregate = aggregateCrossVariableRows(group.rows, columns);
            const hasChildren = group.rows.length > 1;

            return (
              <GroupRows
                key={group.key}
                group={group}
                columns={columns}
                aggregate={aggregate}
                hasChildren={hasChildren}
                isExpanded={isExpanded}
                onToggle={() => toggleGroup(group.key)}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function GroupRows({
  group,
  columns,
  aggregate,
  hasChildren,
  isExpanded,
  onToggle,
}: {
  group: ReturnType<typeof groupCrossVariableRowsByPrimary>[number];
  columns: CrossVariableColumn[];
  aggregate: ReturnType<typeof aggregateCrossVariableRows>;
  hasChildren: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const childCount = group.rows.length;
  const singleRowLabel = childCount === 1 ? group.rows[0].name : group.label;

  return (
    <>
      <tr className={styles.groupRow}>
        <th className={`${styles.rowHeader} ${styles.groupRowHeader}`} scope="row">
          {hasChildren ? (
            <button
              type="button"
              className={styles.groupHeaderBtn}
              aria-expanded={isExpanded}
              aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${group.label}`}
              onClick={onToggle}
            >
              <span
                className={`wm-keyboard-arrow-down ${styles.expandIcon} ${
                  isExpanded ? styles.expandIconExpanded : ''
                }`}
                aria-hidden
              />
              <span className={styles.groupLabel}>{group.label}</span>
              <span className={styles.groupCount}>{childCount}</span>
            </button>
          ) : (
            <span className={styles.groupLabel} title={singleRowLabel}>
              {singleRowLabel}
            </span>
          )}
        </th>
        <MatrixDataCells
          rowLabel={group.label}
          overallCurrent={aggregate.overallCurrent}
          overallTarget={aggregate.overallTarget}
          columnMetrics={aggregate.columns}
          columns={columns}
          rows={group.rows}
        />
      </tr>
      {hasChildren && isExpanded
        ? group.rows.map((row) => {
            const rowCurrent = row.current ?? 0;
            const rowTarget = row.target;
            const detailLabel = getCrossVariablePrimaryDetailLabel(row.name);

            return (
              <tr key={row.id} className={styles.childRow}>
                <th className={`${styles.rowHeader} ${styles.childRowHeader}`} scope="row">
                  <span className={styles.childLabel}>{detailLabel}</span>
                </th>
                <MatrixDataCells
                  rowLabel={row.name}
                  overallCurrent={rowCurrent}
                  overallTarget={rowTarget}
                  columnMetrics={columns.map((column) => {
                    const option = getCrossVariableOptionForColumn(row, column);
                    return {
                      current: option?.current ?? 0,
                      target: option?.target ?? 0,
                    };
                  })}
                  columns={columns}
                  rows={[row]}
                />
              </tr>
            );
          })
        : null}
    </>
  );
}
