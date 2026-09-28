export type LoopSource = 'direct' | 'question';

export type LoopAnswerFilter =
  | ''
  | 'selected'
  | 'unselected'
  | 'displayed'
  | 'not-displayed'
  | 'all';

export const LOOP_SOURCE_OPTIONS: { value: LoopSource; label: string }[] = [
  { value: 'direct', label: 'Looping Directly' },
  { value: 'question', label: 'Looping based on question' },
];

export const LOOP_ANSWER_FILTER_OPTIONS: {
  value: LoopAnswerFilter;
  label: string;
}[] = [
  { value: '', label: '- Select -' },
  { value: 'selected', label: 'Selected Choices' },
  { value: 'unselected', label: 'Unselected Choices' },
  { value: 'displayed', label: 'Displayed Choices' },
  { value: 'not-displayed', label: 'Not Displayed Choices' },
  { value: 'all', label: 'All Choices' },
];

/** Piping text slots a loop column can be mapped to. */
export const PIPING_TEXT_OPTIONS: { value: string; label: string }[] = [
  { value: 'piping-text-1', label: 'Piping Text 1' },
  { value: 'piping-text-2', label: 'Piping Text 2' },
  { value: 'piping-text-3', label: 'Piping Text 3' },
  { value: 'piping-text-4', label: 'Piping Text 4' },
];

export const MAX_LOOP_COLUMNS = PIPING_TEXT_OPTIONS.length;
export const MAX_LOOP_ROWS = 20;

export interface LoopColumn {
  id: string;
  /** Selected piping text slot, e.g. `piping-text-1`. */
  pipingTextId: string;
}

export interface LoopRow {
  id: string;
  /** Piping text value per column id. */
  valueByColumnId: Record<string, string>;
  /** Option label when loops come from a question. */
  sourceLabel?: string;
}

export interface LoopingState {
  enabled: boolean;
  source: LoopSource;
  /** Question id whose options drive the loops when source is `question`. */
  sourceQuestionId: string | null;
  /** Which answer choices to loop over when source is `question`. */
  answerFilter: LoopAnswerFilter;
  columns: LoopColumn[];
  rows: LoopRow[];
  randomizeLoops: boolean;
}

export const LOOPING_PIPING_TEXT_PLACEHOLDER = 'Please add a piping text';

let loopIdCounter = 0;

function nextLoopId(prefix: string): string {
  loopIdCounter += 1;
  return `${prefix}-${loopIdCounter}`;
}

export function createLoopColumn(pipingTextId: string): LoopColumn {
  return { id: nextLoopId('loop-col'), pipingTextId };
}

export function createLoopRow(columns: LoopColumn[], sourceLabel?: string): LoopRow {
  const valueByColumnId: Record<string, string> = {};
  columns.forEach((column) => {
    valueByColumnId[column.id] = '';
  });
  return { id: nextLoopId('loop-row'), valueByColumnId, sourceLabel };
}

export function createDefaultLoopingState(): LoopingState {
  const columns = [
    createLoopColumn('piping-text-1'),
    createLoopColumn('piping-text-2'),
  ];
  return {
    enabled: true,
    source: 'direct',
    sourceQuestionId: null,
    answerFilter: 'selected',
    columns,
    rows: Array.from({ length: 4 }, () => createLoopRow(columns)),
    randomizeLoops: false,
  };
}

export function addLoopColumn(state: LoopingState): LoopingState {
  if (state.columns.length >= MAX_LOOP_COLUMNS) return state;
  const usedIds = new Set(state.columns.map((column) => column.pipingTextId));
  const nextOption =
    PIPING_TEXT_OPTIONS.find((option) => !usedIds.has(option.value)) ??
    PIPING_TEXT_OPTIONS[0];
  const column = createLoopColumn(nextOption.value);
  return {
    ...state,
    columns: [...state.columns, column],
    rows: state.rows.map((row) => ({
      ...row,
      valueByColumnId: { ...row.valueByColumnId, [column.id]: '' },
    })),
  };
}

export function removeLastLoopColumn(state: LoopingState): LoopingState {
  if (state.columns.length <= 1) return state;
  const removed = state.columns[state.columns.length - 1];
  return {
    ...state,
    columns: state.columns.slice(0, -1),
    rows: state.rows.map((row) => {
      const valueByColumnId = { ...row.valueByColumnId };
      delete valueByColumnId[removed.id];
      return { ...row, valueByColumnId };
    }),
  };
}

export function addLoopRow(state: LoopingState): LoopingState {
  if (state.rows.length >= MAX_LOOP_ROWS) return state;
  return { ...state, rows: [...state.rows, createLoopRow(state.columns)] };
}

export function removeLoopRow(state: LoopingState, rowId: string): LoopingState {
  if (state.rows.length <= 1) return state;
  return { ...state, rows: state.rows.filter((row) => row.id !== rowId) };
}

export function setLoopCellValue(
  state: LoopingState,
  rowId: string,
  columnId: string,
  value: string
): LoopingState {
  return {
    ...state,
    rows: state.rows.map((row) =>
      row.id === rowId
        ? { ...row, valueByColumnId: { ...row.valueByColumnId, [columnId]: value } }
        : row
    ),
  };
}

export function setLoopColumnPipingText(
  state: LoopingState,
  columnId: string,
  pipingTextId: string
): LoopingState {
  return {
    ...state,
    columns: state.columns.map((column) =>
      column.id === columnId ? { ...column, pipingTextId } : column
    ),
  };
}

/** Rebuilds loop rows from the selected question's options. */
export function applyQuestionLoopSource(
  state: LoopingState,
  questionId: string,
  optionLabels: string[],
  answerFilter: LoopAnswerFilter = state.answerFilter || 'selected'
): LoopingState {
  const rows = optionLabels.length
    ? optionLabels.map((label) => createLoopRow(state.columns, label))
    : [createLoopRow(state.columns)];
  return {
    ...state,
    source: 'question',
    sourceQuestionId: questionId,
    answerFilter,
    rows,
  };
}

export function getPipingTextLabel(pipingTextId: string): string {
  return (
    PIPING_TEXT_OPTIONS.find((option) => option.value === pipingTextId)?.label ??
    PIPING_TEXT_OPTIONS[0].label
  );
}

export function countFilledLoops(state: LoopingState): number {
  return state.rows.filter((row) =>
    Object.values(row.valueByColumnId).some((value) => value.trim().length > 0)
  ).length;
}

/* ── Referring to a specific loop from logic ──────────────────────────────── */

/** Matches when the condition is true in at least one loop. */
export const LOOP_REF_ANY = 'loop:any';
/** Matches only when the condition is true in every loop. */
export const LOOP_REF_ALL = 'loop:all';
/** The loop currently being shown — only valid inside the same looped block. */
export const LOOP_REF_CURRENT = 'loop:current';

export function loopRefForIndex(index: number): string {
  return `loop:${index + 1}`;
}

export interface LoopReferenceOption {
  value: string;
  label: string;
}

export interface QuestionLoopContext {
  blockTitle: string;
  /** True when the logic being edited lives in the same looped block. */
  sameBlock: boolean;
  options: LoopReferenceOption[];
  defaultRef: string;
}

/** Display label for each loop: its option label, its first piping text, or `Loop N`. */
export function getLoopLabels(state: LoopingState): string[] {
  return state.rows.map((row, index) => {
    const label = loopRowLabel(row);
    return label || `Loop ${index + 1}`;
  });
}

function loopRowLabel(row: LoopRow): string {
  if (row.sourceLabel?.trim()) return row.sourceLabel.trim();
  const firstFilled = Object.values(row.valueByColumnId).find(
    (value) => value.trim().length > 0
  );
  return firstFilled?.trim() ?? '';
}

export function buildLoopReferenceOptions(
  state: LoopingState,
  sameBlock: boolean
): LoopReferenceOption[] {
  const options: LoopReferenceOption[] = [];
  if (sameBlock) {
    options.push({ value: LOOP_REF_CURRENT, label: 'Current loop' });
  }
  options.push(
    { value: LOOP_REF_ANY, label: 'Any loop' },
    { value: LOOP_REF_ALL, label: 'All loops' }
  );
  state.rows.forEach((row, index) => {
    const label = loopRowLabel(row);
    options.push({
      value: loopRefForIndex(index),
      label: label
        ? `Loop ${index + 1}: ${truncateLoopLabel(label)}`
        : `Loop ${index + 1}`,
    });
  });
  return options;
}

export function getDefaultLoopRef(sameBlock: boolean): string {
  return sameBlock ? LOOP_REF_CURRENT : LOOP_REF_ANY;
}

export function getLoopRefLabel(
  options: LoopReferenceOption[],
  loopRef: string | null
): string {
  if (!loopRef) return options[0]?.label ?? 'Any loop';
  return options.find((option) => option.value === loopRef)?.label ?? 'Any loop';
}

function truncateLoopLabel(label: string, max = 24): string {
  return label.length > max ? `${label.slice(0, max)}...` : label;
}
