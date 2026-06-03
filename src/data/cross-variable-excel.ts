import {
  CROSS_VARIABLE_OVERALL_COLUMN_KEY,
  getCrossVariableOptionForColumn,
  type CrossVariableColumn,
  type CrossVariableCombinationRow,
  type CrossVariableMatrixState,
} from '@/data/mock-cross-variable-quota';
import type { AdvanceQuota } from '@/data/mock-advance-quotas';

export type CrossVariableExcelImportMode = 'targets' | 'current';

export interface CrossVariableExcelImportResult {
  updated: number;
  skipped: number;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }

  cells.push(current.trim());
  return cells;
}

export function parseSpreadsheetText(text: string): string[][] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  if (!normalized) return [];

  const delimiter = normalized.includes('\t') && !normalized.includes(',') ? '\t' : ',';
  return normalized
    .split('\n')
    .map((line) => {
      if (delimiter === '\t') {
        return line.split('\t').map((cell) => cell.trim());
      }
      return parseCsvLine(line);
    })
    .filter((row) => row.some((cell) => cell.length > 0));
}

function parseNumericCell(raw: string): number | null {
  const cleaned = raw.replace(/,/g, '').trim();
  if (cleaned === '') return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase();
}

function findColumnIndex(headers: string[], column: CrossVariableColumn): number {
  const candidates = [
    column.optionLabel,
    `${column.questionCode}: ${column.optionLabel}`,
    `${column.questionText}: ${column.optionLabel}`,
  ].map(normalizeLabel);

  return headers.findIndex((header) => candidates.includes(normalizeLabel(header)));
}

export function buildCrossVariableExcelTemplate(
  combinationRows: CrossVariableCombinationRow[],
  columns: CrossVariableColumn[]
): string {
  const headers = ['Primary combination', 'Overall', ...columns.map((c) => c.optionLabel)];
  const dataRows = combinationRows.map((row) => {
    const values = ['', '100', ...columns.map(() => '0')];
    values[0] = row.label;
    return values.join(',');
  });

  return [headers.join(','), ...dataRows].join('\n');
}

export function downloadCrossVariableTemplate(
  combinationRows: CrossVariableCombinationRow[],
  columns: CrossVariableColumn[],
  filename = 'cross-variable-quota-template.csv'
): void {
  const csv = buildCrossVariableExcelTemplate(combinationRows, columns);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function applyExcelImportToMatrix(
  rows: CrossVariableCombinationRow[],
  columns: CrossVariableColumn[],
  matrix: CrossVariableMatrixState,
  sheet: string[][]
): { matrix: CrossVariableMatrixState; result: CrossVariableExcelImportResult } {
  if (sheet.length < 2) {
    return { matrix, result: { updated: 0, skipped: 0 } };
  }

  const headers = sheet[0].map((cell) => cell.trim());
  const overallIndex = headers.findIndex((header) =>
    ['overall', 'total'].includes(normalizeLabel(header))
  );
  const rowByLabel = new Map(rows.map((row) => [normalizeLabel(row.label), row]));

  let updated = 0;
  let skipped = 0;
  const nextCells = { ...matrix.cells };

  for (let lineIndex = 1; lineIndex < sheet.length; lineIndex += 1) {
    const line = sheet[lineIndex];
    const rowLabel = line[0]?.trim();
    if (!rowLabel) {
      skipped += 1;
      continue;
    }

    const combination = rowByLabel.get(normalizeLabel(rowLabel));
    if (!combination) {
      skipped += 1;
      continue;
    }

    const rowCells = { ...(nextCells[combination.id] ?? {}) };

    if (overallIndex >= 0) {
      const overall = parseNumericCell(line[overallIndex] ?? '');
      if (overall !== null) {
        rowCells[CROSS_VARIABLE_OVERALL_COLUMN_KEY] = Math.max(0, overall);
      }
    }

    for (const column of columns) {
      const colIndex = findColumnIndex(headers, column);
      if (colIndex < 0) continue;
      const value = parseNumericCell(line[colIndex] ?? '');
      if (value !== null) {
        rowCells[column.columnKey] = Math.max(0, value);
      }
    }

    nextCells[combination.id] = rowCells;
    updated += 1;
  }

  return {
    matrix: { cells: nextCells },
    result: { updated, skipped },
  };
}

export function applyExcelImportToQuotaCurrents(
  quotas: AdvanceQuota[],
  columns: CrossVariableColumn[],
  sheet: string[][]
): { quotas: AdvanceQuota[]; result: CrossVariableExcelImportResult } {
  if (sheet.length < 2) {
    return { quotas, result: { updated: 0, skipped: 0 } };
  }

  const headers = sheet[0].map((cell) => cell.trim());
  const overallIndex = headers.findIndex((header) =>
    ['overall', 'total', 'current overall'].includes(normalizeLabel(header))
  );
  const quotaByLabel = new Map(quotas.map((quota) => [normalizeLabel(quota.name), quota]));

  let updated = 0;
  let skipped = 0;
  const nextQuotas = quotas.map((quota) => ({ ...quota, options: quota.options?.map((o) => ({ ...o })) }));

  for (let lineIndex = 1; lineIndex < sheet.length; lineIndex += 1) {
    const line = sheet[lineIndex];
    const rowLabel = line[0]?.trim();
    if (!rowLabel) {
      skipped += 1;
      continue;
    }

    const quota = quotaByLabel.get(normalizeLabel(rowLabel));
    if (!quota) {
      skipped += 1;
      continue;
    }

    const quotaIndex = nextQuotas.findIndex((q) => q.id === quota.id);
    if (quotaIndex < 0) continue;

    const nextQuota = nextQuotas[quotaIndex];

    if (overallIndex >= 0) {
      const overall = parseNumericCell(line[overallIndex] ?? '');
      if (overall !== null) {
        nextQuota.current = Math.max(0, overall);
      }
    }

    if (nextQuota.options) {
      for (const column of columns) {
        const colIndex = findColumnIndex(headers, column);
        if (colIndex < 0) continue;
        const value = parseNumericCell(line[colIndex] ?? '');
        if (value === null) continue;

        const option = getCrossVariableOptionForColumn(nextQuota, column);
        if (option) {
          option.current = Math.max(0, value);
        }
      }

      if (overallIndex < 0) {
        nextQuota.current = nextQuota.options.reduce(
          (sum, option) => sum + (option.current ?? 0),
          0
        );
      }
    }

    updated += 1;
  }

  return { quotas: nextQuotas, result: { updated, skipped } };
}

export async function readSpreadsheetFile(file: File): Promise<string[][]> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    throw new Error('Excel workbooks are not supported in this prototype. Save as CSV and import again.');
  }

  const text = await file.text();
  return parseSpreadsheetText(text);
}
