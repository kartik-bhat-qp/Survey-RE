import type { AdvanceQuota, QuotaOption, QuestionQuotaScope } from '@/data/mock-advance-quotas';
import {
  getQuestionsBySurvey,
  resolvePickerSelection,
  type SurveyQuestion,
} from '@/data/mock-survey-questions';

export const CROSS_VARIABLE_PRIMARY_VARIABLES_INSTRUCTIONS =
  'Select the primary variables for quota creation. All possible combinations of the selected options will be used to generate the main quotas. You can add secondary variables in the next step to further refine your quota structure.';

export const CROSS_VARIABLE_SECONDARY_VARIABLES_INSTRUCTIONS =
  'Select the secondary variables to add as columns in the quota matrix (for example, which car you drive).';

export const CROSS_VARIABLE_MATRIX_INSTRUCTIONS =
  'Set an overall quota for each primary combination, then allocate targets across secondary variable options. Column values must sum to the overall for that row.';

export const CROSS_VARIABLE_QUOTA_TYPE_INSTRUCTIONS =
  'Choose how quota targets should be applied across the matrix.';

export const CROSS_VARIABLE_QUOTA_TYPE_OPTIONS: {
  id: QuestionQuotaScope;
  label: string;
  description: string;
}[] = [
  {
    id: 'max-count',
    label: 'Maximum quota',
    description: 'Cap responses at the target for each cell in the matrix.',
  },
  {
    id: 'min-count',
    label: 'Minimum count',
    description: 'Require at least the target count for each cell before closing quotas.',
  },
  {
    id: 'min-pct',
    label: 'Minimum count percentage',
    description: 'Set minimum targets as a percentage of the overall sample.',
  },
];

export function formatCrossVariableQuotaScope(scope: QuestionQuotaScope | undefined): string {
  return (
    CROSS_VARIABLE_QUOTA_TYPE_OPTIONS.find((option) => option.id === scope)?.label ??
    'Maximum quota'
  );
}

export const CROSS_VARIABLE_OVERALL_COLUMN_KEY = '__overall__';

export const CROSS_VARIABLE_DEFAULT_OVERALL = 100;

export interface CrossVariablePrimaryDimension {
  questionId: number;
  questionCode: string;
  questionText: string;
  values: string[];
}

export interface CrossVariableCombinationRow {
  id: string;
  label: string;
  segments: { questionId: number; value: string }[];
}

export interface CrossVariableColumn {
  columnKey: string;
  questionId: number;
  questionCode: string;
  questionText: string;
  optionLabel: string;
}

export interface CrossVariableMatrixState {
  cells: Record<string, Record<string, number>>;
}

function slugForId(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function resolveOptionsFor(question: SurveyQuestion): string[] {
  if (question.options && question.options.length > 0) return question.options;
  if (question.parentQuestionId !== undefined) {
    const parent = getQuestionsBySurvey(question.surveyId).find(
      (q) => q.id === question.parentQuestionId
    );
    return parent?.options ?? [];
  }
  return [];
}

function getDimensionValues(question: SurveyQuestion, rowLabel?: string): string[] {
  const options = resolveOptionsFor(question);
  if (options.length === 0) return [];
  if (rowLabel) {
    return options.map((option) => `${rowLabel} · ${option}`);
  }
  return options;
}

export function getSelectedQuestionsByIds(
  questions: SurveyQuestion[],
  selectedIds: ReadonlySet<number>
): SurveyQuestion[] {
  const flat: SurveyQuestion[] = [];
  for (const question of questions) {
    if (question.parentQuestionId !== undefined) continue;
    flat.push(question);
    const subLabels = question.matrixRows ?? [];
    subLabels.forEach((label, index) => {
      flat.push({
        id: question.id * 1000 + index + 1,
        surveyId: question.surveyId,
        code: question.code,
        text: label,
        type: question.type,
        parentQuestionId: question.id,
      });
    });
  }

  return flat.filter((q) => selectedIds.has(q.id));
}

export function buildPrimaryDimensions(
  selectedQuestions: SurveyQuestion[]
): CrossVariablePrimaryDimension[] {
  return selectedQuestions
    .map((picked) => {
      const { question, rowLabel } = resolvePickerSelection(picked);
      const values = getDimensionValues(question, rowLabel);
      if (values.length === 0) return null;
      return {
        questionId: question.id,
        questionCode: question.code,
        questionText: rowLabel ? `${question.text} — ${rowLabel}` : question.text,
        values,
      };
    })
    .filter((dimension): dimension is CrossVariablePrimaryDimension => dimension !== null);
}

export function buildCombinationRows(
  dimensions: CrossVariablePrimaryDimension[]
): CrossVariableCombinationRow[] {
  if (dimensions.length === 0) return [];

  const rows: CrossVariableCombinationRow[] = [];

  function walk(
    index: number,
    segments: { questionId: number; value: string }[],
    labels: string[]
  ): void {
    if (index >= dimensions.length) {
      const label = labels.join(' · ');
      rows.push({
        id: segments.map((s) => `${s.questionId}-${slugForId(s.value)}`).join('__'),
        label,
        segments,
      });
      return;
    }

    const dimension = dimensions[index];
    for (const value of dimension.values) {
      walk(index + 1, [...segments, { questionId: dimension.questionId, value }], [
        ...labels,
        value,
      ]);
    }
  }

  walk(0, [], []);
  return rows;
}

export function buildCrossVariableColumns(
  secondaryQuestions: SurveyQuestion[]
): CrossVariableColumn[] {
  const columns: CrossVariableColumn[] = [];

  for (const picked of secondaryQuestions) {
    const { question } = resolvePickerSelection(picked);
    const options = resolveOptionsFor(question);
    if (options.length === 0) {
      columns.push({
        columnKey: `${question.id}::__question__`,
        questionId: question.id,
        questionCode: question.code,
        questionText: question.text,
        optionLabel: question.text,
      });
      continue;
    }

    for (const optionLabel of options) {
      columns.push({
        columnKey: `${question.id}::${slugForId(optionLabel)}`,
        questionId: question.id,
        questionCode: question.code,
        questionText: question.text,
        optionLabel,
      });
    }
  }

  return columns;
}

function evenCountDistribute(count: number, total: number): number[] {
  if (count === 0) return [];
  const base = Math.floor(total / count);
  const remainder = total - base * count;
  return Array.from({ length: count }, (_, i) => (i < remainder ? base + 1 : base));
}

export function sumCrossVariableColumnValues(
  rowCells: Record<string, number>,
  columns: CrossVariableColumn[]
): number {
  return columns.reduce((sum, column) => sum + (rowCells[column.columnKey] ?? 0), 0);
}

export function getCrossVariableRowOverall(
  rowCells: Record<string, number>,
  columns: CrossVariableColumn[]
): number {
  const stored = rowCells[CROSS_VARIABLE_OVERALL_COLUMN_KEY];
  if (stored !== undefined) return stored;
  return sumCrossVariableColumnValues(rowCells, columns);
}

export function distributeColumnsToOverall(
  overall: number,
  columns: CrossVariableColumn[]
): Record<string, number> {
  const safeOverall = Math.max(0, Math.round(overall));
  const rowCells: Record<string, number> = {
    [CROSS_VARIABLE_OVERALL_COLUMN_KEY]: safeOverall,
  };

  if (columns.length === 0) return rowCells;

  const distributed = evenCountDistribute(columns.length, safeOverall);
  columns.forEach((column, index) => {
    rowCells[column.columnKey] = distributed[index] ?? 0;
  });

  return rowCells;
}

export function updateCrossVariableOverall(
  rowCells: Record<string, number>,
  columns: CrossVariableColumn[],
  overall: number
): Record<string, number> {
  return distributeColumnsToOverall(overall, columns);
}

export function updateCrossVariableColumnKeepingOverall(
  rowCells: Record<string, number>,
  columns: CrossVariableColumn[],
  columnKey: string,
  nextValue: number
): Record<string, number> {
  const overall = getCrossVariableRowOverall(rowCells, columns);
  const clamped = Math.max(0, Math.min(Math.round(nextValue), overall));
  const next: Record<string, number> = {
    ...rowCells,
    [CROSS_VARIABLE_OVERALL_COLUMN_KEY]: overall,
    [columnKey]: clamped,
  };

  const others = columns.filter((column) => column.columnKey !== columnKey);
  const remaining = overall - clamped;

  if (others.length === 0) return next;

  const otherSum = others.reduce((sum, column) => sum + (rowCells[column.columnKey] ?? 0), 0);

  if (otherSum <= 0) {
    const distributed = evenCountDistribute(others.length, remaining);
    others.forEach((column, index) => {
      next[column.columnKey] = distributed[index] ?? 0;
    });
    return next;
  }

  others.forEach((column) => {
    const previous = rowCells[column.columnKey] ?? 0;
    next[column.columnKey] = Math.round((previous / otherSum) * remaining);
  });

  const allocated = others.reduce((sum, column) => sum + (next[column.columnKey] ?? 0), 0);
  const drift = remaining - allocated;
  if (drift !== 0) {
    const first = others[0];
    next[first.columnKey] = (next[first.columnKey] ?? 0) + drift;
  }

  return next;
}

export function buildInitialCrossVariableMatrix(
  rows: CrossVariableCombinationRow[],
  columns: CrossVariableColumn[]
): CrossVariableMatrixState {
  const cells: Record<string, Record<string, number>> = {};

  for (const row of rows) {
    cells[row.id] = distributeColumnsToOverall(CROSS_VARIABLE_DEFAULT_OVERALL, columns);
  }

  return { cells };
}

export interface CrossVariableQuotaBatch {
  id: string;
  name?: string;
  quotaGroup: string;
  columns: CrossVariableColumn[];
  createdAt: number;
  quotaScope?: QuestionQuotaScope;
  primaryVariableLabels?: string[];
  secondaryVariableLabels?: string[];
  combinationRows?: CrossVariableCombinationRow[];
  matrix?: CrossVariableMatrixState;
}

export interface CrossVariableQuotaSaveResult {
  quotas: AdvanceQuota[];
  batch: CrossVariableQuotaBatch;
}

export interface BuildCrossVariableQuotasOptions {
  batchId?: string;
  quotaScope?: QuestionQuotaScope;
  matrixName?: string;
  primaryVariableLabels?: string[];
  secondaryVariableLabels?: string[];
  /** Preserve fill counts when updating an existing matrix. */
  existingQuotas?: AdvanceQuota[];
}

const MATRIX_NAME_MAX_LENGTH = 72;

function truncateMatrixLabel(value: string, maxLength = MATRIX_NAME_MAX_LENGTH): string {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}

function shortenVariableLabel(label: string): string {
  const trimmed = label.trim();
  if (trimmed.length <= 36) return trimmed;
  return `${trimmed.slice(0, 33).trimEnd()}…`;
}

export function buildCrossVariableMatrixNameFromLabels(
  primaryVariableLabels: string[],
  secondaryVariableLabels: string[]
): string {
  const primaryPart = primaryVariableLabels
    .map(shortenVariableLabel)
    .filter(Boolean)
    .join(' × ');
  const secondaryPart = secondaryVariableLabels
    .map(shortenVariableLabel)
    .filter(Boolean)
    .join(', ');

  if (primaryPart && secondaryPart) {
    return truncateMatrixLabel(`${primaryPart} by ${secondaryPart}`);
  }
  return truncateMatrixLabel(primaryPart || secondaryPart || 'Cross variable matrix');
}

export function inferCrossVariableMatrixName(batch: CrossVariableQuotaBatch): string {
  if (batch.name?.trim()) return batch.name.trim();

  if (batch.primaryVariableLabels?.length || batch.secondaryVariableLabels?.length) {
    return buildCrossVariableMatrixNameFromLabels(
      batch.primaryVariableLabels ?? [],
      batch.secondaryVariableLabels ??
        Array.from(new Set(batch.columns.map((column) => column.questionText)))
    );
  }

  const secondaryFromColumns = Array.from(
    new Set(batch.columns.map((column) => column.questionText))
  );
  if (secondaryFromColumns.length > 0) {
    return truncateMatrixLabel(secondaryFromColumns.map(shortenVariableLabel).join(', '));
  }

  return 'Cross variable matrix';
}

export function formatCrossVariableBatchLabel(
  batch: CrossVariableQuotaBatch | undefined,
  rowCount: number,
  fallbackIndex?: number
): string {
  const baseName = batch
    ? inferCrossVariableMatrixName(batch)
    : fallbackIndex != null
      ? `Matrix ${fallbackIndex}`
      : 'Cross variable matrix';
  return `${baseName} · ${rowCount} combinations`;
}

export function buildCrossVariableQuotas(
  rows: CrossVariableCombinationRow[],
  columns: CrossVariableColumn[],
  matrix: CrossVariableMatrixState,
  quotaGroup: string,
  buildOptions?: BuildCrossVariableQuotasOptions
): CrossVariableQuotaSaveResult {
  const now = Date.now();
  const batchId = buildOptions?.batchId ?? `cross-${now}`;
  const quotaScope = buildOptions?.quotaScope ?? 'max-count';
  const secondaryVariableLabels =
    buildOptions?.secondaryVariableLabels ??
    Array.from(new Set(columns.map((column) => column.questionText)));
  const primaryVariableLabels = buildOptions?.primaryVariableLabels ?? [];
  const matrixName =
    buildOptions?.matrixName?.trim() ||
    buildCrossVariableMatrixNameFromLabels(primaryVariableLabels, secondaryVariableLabels);
  const existingByName = new Map(
    (buildOptions?.existingQuotas ?? []).map((quota) => [quota.name, quota])
  );
  const secondaryLabels = Array.from(
    new Set(columns.map((column) => column.questionText))
  ).join(', ');

  const quotas = rows.map((row, rowIndex) => {
    const rowCells = matrix.cells[row.id] ?? {};
    const overallTarget = getCrossVariableRowOverall(rowCells, columns);
    const previous = existingByName.get(row.label);
    const options: QuotaOption[] = columns
      .map((column, colIndex) => {
        const target = Math.round(rowCells[column.columnKey] ?? 0);
        const prevOption = previous
          ? getCrossVariableOptionForColumn(previous, column)
          : undefined;
        return {
          id: `${row.id}-${colIndex}`,
          label: `${column.questionCode}: ${column.optionLabel}`,
          target,
          current: prevOption?.current ?? 0,
        };
      })
      .filter((option) => option.target > 0);

    return {
      id: previous?.id ?? `${batchId}-${rowIndex}`,
      name: row.label,
      quotaType: 'Cross variable' as const,
      description: `Primary combination · Overall ${overallTarget} · Columns: ${secondaryLabels || 'Secondary variables'}`,
      quotaGroup,
      multipleQuotaHandling: 'NA',
      target: overallTarget || CROSS_VARIABLE_DEFAULT_OVERALL,
      current: previous?.current ?? 0,
      crossVariableBatchId: batchId,
      questionQuotaScope: previous?.questionQuotaScope ?? quotaScope,
      options: options.length > 0 ? options : undefined,
    };
  });

  return {
    quotas,
    batch: {
      id: batchId,
      name: matrixName,
      quotaGroup,
      columns,
      createdAt: buildOptions?.batchId
        ? inferBatchCreatedAt(batchId)
        : now,
      quotaScope,
      primaryVariableLabels,
      secondaryVariableLabels,
      combinationRows: rows,
      matrix,
    },
  };
}

function inferBatchCreatedAt(batchId: string): number {
  const parsed = Number(batchId.replace('cross-', ''));
  return Number.isFinite(parsed) ? parsed : Date.now();
}

/** Restore matrix editor state from a saved batch or quota rows. */
export function resolveCrossVariableEditState(
  quotas: AdvanceQuota[],
  batch?: CrossVariableQuotaBatch
): {
  combinationRows: CrossVariableCombinationRow[];
  columns: CrossVariableColumn[];
  matrix: CrossVariableMatrixState;
} {
  const columns = batch?.columns ?? inferColumnsFromCrossVariableQuotas(quotas);

  if (batch?.combinationRows?.length && batch.matrix) {
    return {
      combinationRows: batch.combinationRows,
      columns,
      matrix: batch.matrix,
    };
  }

  const combinationRows: CrossVariableCombinationRow[] = quotas.map((quota) => ({
    id: quota.id,
    label: quota.name,
    segments: [],
  }));

  const cells: Record<string, Record<string, number>> = {};
  for (const quota of quotas) {
    const rowCells: Record<string, number> = {
      [CROSS_VARIABLE_OVERALL_COLUMN_KEY]: quota.target,
    };
    for (const column of columns) {
      const option = getCrossVariableOptionForColumn(quota, column);
      if (option) {
        rowCells[column.columnKey] = option.target;
      }
    }
    cells[quota.id] = rowCells;
  }

  return { combinationRows, columns, matrix: { cells } };
}

export interface CrossVariableTrackingSet {
  batchId: string;
  quotaGroup: string;
  columns: CrossVariableColumn[];
  rows: AdvanceQuota[];
}

function parseCrossVariableOptionLabel(label: string): {
  questionCode: string;
  optionLabel: string;
} {
  const separator = label.indexOf(': ');
  if (separator === -1) {
    return { questionCode: '', optionLabel: label };
  }
  return {
    questionCode: label.slice(0, separator),
    optionLabel: label.slice(separator + 2),
  };
}

export function inferCrossVariableBatchId(quota: AdvanceQuota): string | null {
  if (quota.crossVariableBatchId) return quota.crossVariableBatchId;
  const match = /^cross-(\d+)-\d+$/.exec(quota.id);
  return match ? `cross-${match[1]}` : null;
}

export function inferColumnsFromCrossVariableQuotas(
  quotas: AdvanceQuota[]
): CrossVariableColumn[] {
  const reference = quotas.find((quota) => quota.options && quota.options.length > 0);
  if (!reference?.options) return [];

  return reference.options.map((option) => {
    const { questionCode, optionLabel } = parseCrossVariableOptionLabel(option.label);
    return {
      columnKey: `${questionCode}::${slugForId(optionLabel)}`,
      questionId: 0,
      questionCode,
      questionText: questionCode,
      optionLabel,
    };
  });
}

function stableHash(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/** Prototype fill-in for current counts when none are recorded yet. */
export function withCrossVariableTrackingProgress(quota: AdvanceQuota): AdvanceQuota {
  if (quota.quotaType !== 'Cross variable') return quota;

  const rowSeed = stableHash(quota.id) % 100;
  const rowCurrent =
    quota.current ??
    Math.min(quota.target, Math.round(quota.target * (0.25 + (rowSeed % 55) / 100)));

  const options = quota.options?.map((option, index) => {
    const optionSeed = stableHash(`${quota.id}:${option.id}:${index}`) % 100;
    const current =
      option.current ??
      Math.min(option.target, Math.round(option.target * (0.15 + (optionSeed % 70) / 100)));
    return { ...option, current };
  });

  return { ...quota, current: rowCurrent, options };
}

export function resolveCrossVariableTrackingSets(
  quotas: AdvanceQuota[],
  batches: CrossVariableQuotaBatch[]
): CrossVariableTrackingSet[] {
  const crossQuotas = quotas.filter((quota) => quota.quotaType === 'Cross variable');
  if (crossQuotas.length === 0) return [];

  const batchById = new Map(batches.map((batch) => [batch.id, batch]));
  const grouped = new Map<string, AdvanceQuota[]>();

  for (const quota of crossQuotas) {
    const batchId = inferCrossVariableBatchId(quota) ?? quota.id;
    const existing = grouped.get(batchId) ?? [];
    existing.push(quota);
    grouped.set(batchId, existing);
  }

  return Array.from(grouped.entries())
    .map(([batchId, rows]) => {
      const batch = batchById.get(batchId);
      const sortedRows = [...rows].sort((a, b) => a.name.localeCompare(b.name));
      return {
        batchId,
        quotaGroup: batch?.quotaGroup ?? sortedRows[0]?.quotaGroup ?? 'NA',
        columns: batch?.columns ?? inferColumnsFromCrossVariableQuotas(sortedRows),
        rows: sortedRows.map(withCrossVariableTrackingProgress),
      };
    })
    .sort((a, b) => b.batchId.localeCompare(a.batchId));
}

export function getCrossVariableOptionForColumn(
  quota: AdvanceQuota,
  column: CrossVariableColumn
): QuotaOption | undefined {
  return quota.options?.find((option) => {
    const parsed = parseCrossVariableOptionLabel(option.label);
    return (
      parsed.questionCode === column.questionCode &&
      parsed.optionLabel === column.optionLabel
    );
  });
}

const PRIMARY_COMBINATION_SEPARATOR = ' · ';

/** First segment of a primary combination label (e.g. "Sedan" from "Sedan · Maruti Suzuki"). */
export function getCrossVariablePrimaryGroupKey(rowLabel: string): string {
  const parts = rowLabel.split(PRIMARY_COMBINATION_SEPARATOR);
  return parts[0]?.trim() || rowLabel;
}

/** Remaining segments after the group key, if any. */
export function getCrossVariablePrimaryDetailLabel(rowLabel: string): string {
  const parts = rowLabel.split(PRIMARY_COMBINATION_SEPARATOR);
  if (parts.length <= 1) return rowLabel;
  return parts.slice(1).join(PRIMARY_COMBINATION_SEPARATOR).trim();
}

export interface CrossVariablePrimaryRowGroup {
  key: string;
  label: string;
  rows: AdvanceQuota[];
}

export function groupCrossVariableRowsByPrimary(
  rows: AdvanceQuota[]
): CrossVariablePrimaryRowGroup[] {
  const groups = new Map<string, AdvanceQuota[]>();

  for (const row of rows) {
    const key = getCrossVariablePrimaryGroupKey(row.name);
    const existing = groups.get(key) ?? [];
    existing.push(row);
    groups.set(key, existing);
  }

  return Array.from(groups.entries())
    .map(([key, groupRows]) => ({
      key,
      label: key,
      rows: [...groupRows].sort((a, b) =>
        getCrossVariablePrimaryDetailLabel(a.name).localeCompare(
          getCrossVariablePrimaryDetailLabel(b.name)
        )
      ),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export interface CrossVariableAggregatedMetrics {
  overallCurrent: number;
  overallTarget: number;
  columns: { current: number; target: number }[];
}

export function aggregateCrossVariableRows(
  rows: AdvanceQuota[],
  columns: CrossVariableColumn[]
): CrossVariableAggregatedMetrics {
  const columnTotals = columns.map(() => ({ current: 0, target: 0 }));
  let overallCurrent = 0;
  let overallTarget = 0;

  for (const row of rows) {
    overallCurrent += row.current ?? 0;
    overallTarget += row.target;

    columns.forEach((column, index) => {
      const option = getCrossVariableOptionForColumn(row, column);
      if (!option) return;
      columnTotals[index].current += option.current ?? 0;
      columnTotals[index].target += option.target;
    });
  }

  return { overallCurrent, overallTarget, columns: columnTotals };
}
