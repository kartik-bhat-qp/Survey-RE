'use client';

import { useMemo } from 'react';
import {
  getCrossVariableRowOverall,
  updateCrossVariableColumnKeepingOverall,
  updateCrossVariableOverall,
  type CrossVariableColumn,
  type CrossVariableCombinationRow,
  type CrossVariableMatrixState,
} from '@/data/mock-cross-variable-quota';
import styles from './CrossVariableQuotaMatrixStep.module.css';

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function parseFormattedNumber(raw: string): number {
  const cleaned = raw.replace(/,/g, '').trim();
  if (cleaned === '') return 0;
  const parsed = parseInt(cleaned, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

interface CrossVariableQuotaMatrixStepProps {
  rows: CrossVariableCombinationRow[];
  columns: CrossVariableColumn[];
  matrix: CrossVariableMatrixState;
  onMatrixChange: (next: CrossVariableMatrixState) => void;
}

export function CrossVariableQuotaMatrixStep({
  rows,
  columns,
  matrix,
  onMatrixChange,
}: CrossVariableQuotaMatrixStepProps) {
  const columnGroups = useMemo(() => {
    const groups: { questionId: number; questionText: string; columns: CrossVariableColumn[] }[] =
      [];
    for (const column of columns) {
      const existing = groups.find((group) => group.questionId === column.questionId);
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

  function updateRow(rowId: string, rowCells: Record<string, number>): void {
    onMatrixChange({
      cells: {
        ...matrix.cells,
        [rowId]: rowCells,
      },
    });
  }

  function handleOverallChange(rowId: string, value: number): void {
    const current = matrix.cells[rowId] ?? {};
    updateRow(rowId, updateCrossVariableOverall(current, columns, value));
  }

  function handleColumnChange(rowId: string, columnKey: string, value: number): void {
    const current = matrix.cells[rowId] ?? {};
    updateRow(
      rowId,
      updateCrossVariableColumnKeepingOverall(current, columns, columnKey, value)
    );
  }

  if (rows.length === 0 || columns.length === 0) {
    return (
      <p className={styles.emptyState}>
        Select primary and secondary variables to generate the quota matrix.
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
                key={group.questionId}
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
          {rows.map((row) => {
            const rowCells = matrix.cells[row.id] ?? {};
            const overall = getCrossVariableRowOverall(rowCells, columns);

            return (
              <tr key={row.id}>
                <th className={styles.rowHeader} scope="row">
                  {row.label}
                </th>
                <td className={`${styles.cell} ${styles.overallCell}`}>
                  <input
                    type="text"
                    inputMode="numeric"
                    className={`${styles.cellInput} ${styles.overallInput}`}
                    value={formatNumber(overall)}
                    aria-label={`${row.label}, overall quota`}
                    onChange={(event) =>
                      handleOverallChange(row.id, parseFormattedNumber(event.target.value))
                    }
                  />
                </td>
                {columns.map((column) => {
                  const value = rowCells[column.columnKey] ?? 0;
                  return (
                    <td key={`${row.id}-${column.columnKey}`} className={styles.cell}>
                      <input
                        type="text"
                        inputMode="numeric"
                        className={styles.cellInput}
                        value={formatNumber(value)}
                        aria-label={`${row.label}, ${column.questionText}, ${column.optionLabel}`}
                        onChange={(event) =>
                          handleColumnChange(
                            row.id,
                            column.columnKey,
                            parseFormattedNumber(event.target.value)
                          )
                        }
                      />
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
