import {
  hasCompleteConditions,
  newCriterion,
  parseSelectedValues,
  type Criterion,
} from '@/data/mock-criteria-engine';

export type QuestionLogicType =
  | 'skip-logic'
  | 'compound-branching'
  | 'show-hide-question'
  | 'show-hide-options'
  | 'quota-control'
  | 'dynamic-text'
  | 'extraction'
  | 'scoring'
  | 'javascript-logic'
  | 'update-variables';

export interface QuestionLogicTypeOption {
  value: QuestionLogicType;
  label: string;
}

export const QUESTION_LOGIC_TYPE_OPTIONS: QuestionLogicTypeOption[] = [
  { value: 'skip-logic', label: 'Skip Logic' },
  { value: 'compound-branching', label: 'Compound Branching' },
  { value: 'show-hide-question', label: 'Show/Hide Question' },
  { value: 'show-hide-options', label: 'Show/Hide Options' },
  { value: 'quota-control', label: 'Quota Control' },
  { value: 'dynamic-text', label: 'Dynamic Text/Comments' },
  { value: 'extraction', label: 'Extraction' },
  { value: 'scoring', label: 'Scoring' },
  { value: 'javascript-logic', label: 'JavaScript Logic' },
  { value: 'update-variables', label: 'Update Variables' },
];

export const LOOKUP_TABLE_EXCLUDED_LOGIC_TYPES: readonly QuestionLogicType[] = [
  'quota-control',
  'dynamic-text',
  'extraction',
];

export function isLookupTableSurveyQuestion(question: {
  kind?: string;
  addQuestionTypeId?: string;
}): boolean {
  return question.kind === 'lookup-table' || question.addQuestionTypeId === 'lookup-table';
}

export function getQuestionLogicTypeOptions(question: {
  kind?: string;
  addQuestionTypeId?: string;
}): QuestionLogicTypeOption[] {
  if (!isLookupTableSurveyQuestion(question)) {
    return QUESTION_LOGIC_TYPE_OPTIONS;
  }
  return QUESTION_LOGIC_TYPE_OPTIONS.filter(
    (option) => !LOOKUP_TABLE_EXCLUDED_LOGIC_TYPES.includes(option.value)
  );
}

export function resolveLogicTypeForQuestion(
  logicType: QuestionLogicType,
  question: { kind?: string; addQuestionTypeId?: string }
): QuestionLogicType {
  const options = getQuestionLogicTypeOptions(question);
  if (options.some((option) => option.value === logicType)) {
    return logicType;
  }
  return options[0]?.value ?? 'skip-logic';
}

export interface BranchTargetOption {
  value: string;
  label: string;
}

export const NO_BRANCHING_OPTION: BranchTargetOption = {
  value: 'none',
  label: 'No Branching',
};

export const RANDOMIZER_LIMIT_OPTIONS: BranchTargetOption[] = Array.from(
  { length: 11 },
  (_, index) => ({
    value: String(index),
    label: String(index),
  })
);

export interface ShowHideOptionsCriterion extends Criterion {
  action: string;
  targetOptionId: string;
}

export interface ShowHideOptionsState {
  hideOptionByDefault: boolean;
  criteria: ShowHideOptionsCriterion[];
  collapsedCriterionIds: Set<string>;
  /** Show or hide for answer options not assigned to any criteria block. */
  uncoveredOptionsAction: '' | 'show' | 'hide';
  useLegacyMethod: boolean;
}

export interface ShowHideQuestionState {
  /** When true, the question is shown unless criteria are met (then hide). */
  showQuestionByDefault: boolean;
  dynamicOnPageLogic: boolean;
  criteria: Criterion[];
  collapsedCriterionIds: Set<string>;
}

export interface CompoundBranchingCriterion extends Criterion {
  /** Question id to jump to, or `none` for No Branching. */
  jumpTargetId: string;
  /** System custom variable to update, e.g. Custom 1. */
  customVariable: string;
  /** Value/token written into the custom variable. */
  customVariableValue: string;
}

export interface CompoundBranchingState {
  criteria: CompoundBranchingCriterion[];
  collapsedCriterionIds: Set<string>;
  /** Question id to jump to when no criteria match, or `none`. */
  defaultJumpTargetId: string;
}

export type QuotaOverLimitAction =
  | 'none'
  | 'terminate-survey'
  | 'quota-overlimit'
  | 'quota-full-hide-option'
  | 'goto-thank-you'
  | 'skip-choice-continue';

export interface QuotaControlOptionState {
  quotaLimit: number;
  overLimitAction: QuotaOverLimitAction;
}

export interface QuotaControlState {
  byOptionId: Record<string, QuotaControlOptionState>;
}

export type DynamicTextBoxStatus = 'enabled' | 'disabled';

export interface DynamicTextOptionState {
  status: DynamicTextBoxStatus;
  labelName: string;
}

export interface DynamicTextCommentsState {
  aiPrompt: string;
  byOptionId: Record<string, DynamicTextOptionState>;
}

export type ExtractionSource =
  | 'selected-choices'
  | 'not-selected-choices'
  | 'displayed-choices'
  | 'not-displayed-choices'
  | 'all-choices';

export type ExtractionQuestionType =
  | 'single-select'
  | 'multi-select'
  | 'dropdown'
  | 'image'
  | 'single-row'
  | 'multiple-row'
  | 'email-address'
  | 'numeric'
  | 'drag-and-drop'
  | 'rank-order'
  | 'constant-sum'
  | 'star'
  | 'matrix-single-select'
  | 'matrix-multi-select'
  | 'spreadsheet'
  | 'image-chooser'
  | 'slider-text'
  | 'slider-numeric';

export interface ExtractionLogicState {
  extractSource: ExtractionSource;
  questionType: ExtractionQuestionType;
  alwaysExtractOptionId: string;
  neverExtractOptionId: string;
  lockedExtraction: boolean;
}

export const EXTRACTION_SOURCE_OPTIONS: BranchTargetOption[] = [
  { value: 'selected-choices', label: 'Selected Choices' },
  { value: 'not-selected-choices', label: 'Not Selected Choices' },
  { value: 'displayed-choices', label: 'Displayed Choices' },
  { value: 'not-displayed-choices', label: 'Not Displayed Choices' },
  { value: 'all-choices', label: 'All Choices' },
];

export interface ExtractionQuestionTypeGroup {
  label: string;
  options: BranchTargetOption[];
}

export const EXTRACTION_QUESTION_TYPE_GROUPS: ExtractionQuestionTypeGroup[] = [
  {
    label: 'Multiple Choice',
    options: [
      { value: 'single-select', label: 'Single Select' },
      { value: 'multi-select', label: 'Multi Select' },
      { value: 'dropdown', label: 'Dropdown' },
      { value: 'image', label: 'Image' },
    ],
  },
  {
    label: 'Text',
    options: [
      { value: 'single-row', label: 'Single Row' },
      { value: 'multiple-row', label: 'Multiple Row' },
      { value: 'email-address', label: 'Email Address' },
      { value: 'numeric', label: 'Numeric' },
    ],
  },
  {
    label: 'Ordering',
    options: [
      { value: 'drag-and-drop', label: 'Drag and Drop' },
      { value: 'rank-order', label: 'Rank Order' },
      { value: 'constant-sum', label: 'Constant Sum' },
    ],
  },
  {
    label: 'Rating',
    options: [{ value: 'star', label: 'Star' }],
  },
  {
    label: 'Matrix',
    options: [
      { value: 'matrix-single-select', label: 'Single Select' },
      { value: 'matrix-multi-select', label: 'Multi Select' },
      { value: 'spreadsheet', label: 'Spreadsheet' },
      { value: 'image-chooser', label: 'Image Chooser' },
    ],
  },
  {
    label: 'Slider',
    options: [
      { value: 'slider-text', label: 'Text' },
      { value: 'slider-numeric', label: 'Numeric' },
    ],
  },
];

export const EXTRACTION_QUESTION_TYPE_OPTIONS: BranchTargetOption[] =
  EXTRACTION_QUESTION_TYPE_GROUPS.flatMap((group) => group.options);

export function findExtractionQuestionTypeOption(
  value: string
): BranchTargetOption | null {
  return EXTRACTION_QUESTION_TYPE_OPTIONS.find((option) => option.value === value) ?? null;
}

export function normalizeExtractionSource(source: string): ExtractionSource {
  if (source === 'unselected-choices') return 'not-selected-choices';
  const match = EXTRACTION_SOURCE_OPTIONS.find((option) => option.value === source);
  return (match?.value as ExtractionSource) ?? 'selected-choices';
}

export function normalizeExtractionQuestionType(value: string): ExtractionQuestionType {
  const match = findExtractionQuestionTypeOption(value);
  return (match?.value as ExtractionQuestionType) ?? 'single-select';
}

export const DYNAMIC_TEXT_BOX_STATUS_OPTIONS: BranchTargetOption[] = [
  { value: 'enabled', label: 'Enabled' },
  { value: 'disabled', label: 'Disabled' },
];

export const DYNAMIC_TEXT_MATRIX_LABEL_PLACEHOLDER = 'Please tell us why:';

export interface DynamicTextTargetOption {
  id: string;
  label: string;
}

export interface DynamicTextTargetGroup {
  id: string;
  /** Row label shown as "Answer options {label}". Empty for flat (non-matrix) lists. */
  label: string;
  options: DynamicTextTargetOption[];
}

export function buildDynamicTextCellId(rowId: string, columnId: string): string {
  return `mx:${rowId}:${columnId}`;
}

export function isMatrixDynamicTextQuestion(question: {
  kind?: string;
  matrix?: { rows?: unknown[]; columns?: unknown[] } | null;
}): boolean {
  if (!question.matrix?.rows?.length || !question.matrix?.columns?.length) return false;
  return (
    question.kind === 'multi-point-scales' ||
    question.kind === 'matrix-multi-select' ||
    question.kind === 'matrix-spreadsheet'
  );
}

function stripRichTextLabel(value: string): string {
  return value.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').trim();
}

/** Flat answer options, or matrix row groups × column scale points. */
export function getDynamicTextTargetGroups(question: {
  kind?: string;
  options: { id: string; label: string }[];
  matrix?: {
    rows: { id: string; label: string }[];
    columns: { id: string; label: string }[];
  } | null;
}): DynamicTextTargetGroup[] {
  if (isMatrixDynamicTextQuestion(question) && question.matrix) {
    return question.matrix.rows.map((row, rowIndex) => ({
      id: row.id,
      label: stripRichTextLabel(row.label) || `Row ${rowIndex + 1}`,
      options: question.matrix!.columns.map((column, columnIndex) => ({
        id: buildDynamicTextCellId(row.id, column.id),
        label: stripRichTextLabel(column.label) || String(columnIndex + 1),
      })),
    }));
  }

  return [
    {
      id: 'answer-options',
      label: '',
      options: question.options.map((option) => ({
        id: option.id,
        label: stripRichTextLabel(option.label) || option.id,
      })),
    },
  ];
}

export function getDynamicTextTargetIds(
  question: Parameters<typeof getDynamicTextTargetGroups>[0]
): string[] {
  return getDynamicTextTargetGroups(question).flatMap((group) =>
    group.options.map((option) => option.id)
  );
}


export const QUOTA_OVER_LIMIT_ACTION_OPTIONS: BranchTargetOption[] = [
  { value: 'none', label: 'No Branching' },
  { value: 'terminate-survey', label: 'Terminate Survey' },
  { value: 'quota-overlimit', label: 'Quota Overlimit' },
  { value: 'quota-full-hide-option', label: 'Quota Full - Hide Option' },
  { value: 'goto-thank-you', label: 'Goto Thank You Page' },
  { value: 'skip-choice-continue', label: 'Skip Choice and Continue Survey' },
];

export function getQuotaOverLimitActionLabel(action: QuotaOverLimitAction): string {
  return (
    QUOTA_OVER_LIMIT_ACTION_OPTIONS.find((option) => option.value === action)?.label ??
    'No Branching'
  );
}

export function formatQuotaControlOptionLabel(
  optionState: QuotaControlOptionState
): string | null {
  if (optionState.quotaLimit <= 0 && optionState.overLimitAction === 'none') return null;

  const limitPart = `= ${optionState.quotaLimit}`;
  if (optionState.overLimitAction === 'none') return limitPart;

  return `${limitPart} >> ${getQuotaOverLimitActionLabel(optionState.overLimitAction)}`;
}

export function getQuotaControlOptionLabels(
  state: QuestionLogicState,
  optionIds: string[]
): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const optionId of optionIds) {
    const optionState = state.quotaControl.byOptionId[optionId];
    if (!optionState) continue;
    const label = formatQuotaControlOptionLabel(optionState);
    if (label) labels[optionId] = label;
  }
  return labels;
}

export function isQuotaControlConfigured(
  state: QuestionLogicState,
  optionIds: string[]
): boolean {
  return optionIds.some((optionId) => {
    const optionState = state.quotaControl.byOptionId[optionId];
    if (!optionState) return false;
    return optionState.quotaLimit > 0 || optionState.overLimitAction !== 'none';
  });
}

export function isQuotaControlLogicApplied(
  state: QuestionLogicState,
  optionIds: string[]
): boolean {
  if (state.logicType !== 'quota-control') return false;

  return isQuotaControlConfigured(state, optionIds);
}

export interface QuestionLogicState {
  logicType: QuestionLogicType;
  looping: boolean;
  branchByOptionId: Record<string, string>;
  defaultBranching: string;
  randomizerLimit: string;
  showHideQuestion: ShowHideQuestionState;
  showHideOptions: ShowHideOptionsState;
  compoundBranching: CompoundBranchingState;
  quotaControl: QuotaControlState;
  dynamicTextComments: DynamicTextCommentsState;
  extraction: ExtractionLogicState;
}

export const SELECT_PLACEHOLDER: BranchTargetOption = {
  value: '',
  label: '- Select -',
};

export type CompoundBranchJumpType =
  | 'none'
  | 'question'
  | 'terminate-survey'
  | 'goto-thank-you';

export const COMPOUND_BRANCH_JUMP_TYPE_OPTIONS: BranchTargetOption[] = [
  { value: 'none', label: 'No Branching' },
  { value: 'question', label: 'Question' },
  { value: 'terminate-survey', label: 'Terminate Survey' },
  { value: 'goto-thank-you', label: 'Thank You Page' },
];

export function isCompoundBranchJumpType(value: string): value is CompoundBranchJumpType {
  return COMPOUND_BRANCH_JUMP_TYPE_OPTIONS.some((option) => option.value === value);
}

export const COMPOUND_BRANCH_CUSTOM_VARIABLE_OPTIONS: BranchTargetOption[] = [
  SELECT_PLACEHOLDER,
  ...Array.from({ length: 20 }, (_, index) => ({
    value: `Custom ${index + 1}`,
    label: `Custom ${index + 1}`,
  })),
];

export const COMPOUND_BRANCH_CUSTOM_VARIABLE_VALUE_OPTIONS: BranchTargetOption[] = [
  SELECT_PLACEHOLDER,
  { value: 'email-address', label: 'Email Address' },
  { value: 'auto-generated-number', label: 'Auto Generated Number' },
  { value: 'date', label: 'Date' },
  { value: 'day', label: 'Day' },
  { value: 'time', label: 'Time' },
  { value: 'ip-address', label: 'IP Address' },
  { value: 'country', label: 'Country' },
  { value: 'region', label: 'Region' },
  { value: 'city', label: 'City' },
  { value: 'device-type', label: 'Device Type' },
  { value: 'browser', label: 'Browser' },
  { value: 'os', label: 'Operating System' },
  { value: 'language', label: 'Language' },
  { value: 'response-id', label: 'Response ID' },
];

export const SHOW_HIDE_CRITERIA_ACTION_OPTIONS: BranchTargetOption[] = [
  { value: 'hide-option', label: 'If criteria is met, hide option' },
  { value: 'show-option', label: 'If criteria is met, show option' },
];

export const UNCOVERED_OPTIONS_ACTION_OPTIONS: BranchTargetOption[] = [
  { value: 'show', label: 'Show options' },
  { value: 'hide', label: 'Hide options' },
];

export function getCriteriaCoveredOptionIds(state: {
  criteria: ShowHideOptionsCriterion[];
}): Set<string> {
  const ids = new Set<string>();
  for (const criterion of state.criteria) {
    for (const id of parseSelectedValues(criterion.targetOptionId)) {
      ids.add(id);
    }
  }
  return ids;
}

export function getUncoveredOptionIds(
  optionIds: string[],
  state: ShowHideOptionsState
): string[] {
  const covered = getCriteriaCoveredOptionIds(state);
  return optionIds.filter((id) => !covered.has(id));
}

function createDefaultShowHideCriterion(index: number): ShowHideOptionsCriterion {
  return {
    ...newCriterion(),
    name: `Criteria ${index}`,
    action: 'hide-option',
    targetOptionId: '',
  };
}

export function createDefaultShowHideOptionsState(): ShowHideOptionsState {
  return {
    hideOptionByDefault: false,
    criteria: [createDefaultShowHideCriterion(1)],
    collapsedCriterionIds: new Set(),
    uncoveredOptionsAction: '',
    useLegacyMethod: false,
  };
}

export function createDefaultShowHideQuestionState(): ShowHideQuestionState {
  return {
    showQuestionByDefault: true,
    dynamicOnPageLogic: false,
    criteria: [
      {
        ...newCriterion(),
        name: 'Criteria 1',
      },
    ],
    collapsedCriterionIds: new Set(),
  };
}

export function isShowHideQuestionLogicComplete(state: ShowHideQuestionState): boolean {
  return state.criteria.every((criterion) => hasCompleteConditions(criterion));
}

export function isShowHideQuestionLogicApplied(state: ShowHideQuestionState): boolean {
  return isShowHideQuestionLogicComplete(state);
}

function createDefaultCompoundBranchingCriterion(
  index: number
): CompoundBranchingCriterion {
  return {
    ...newCriterion(),
    name: `Criteria ${index}`,
    jumpTargetId: NO_BRANCHING_OPTION.value,
    customVariable: COMPOUND_BRANCH_CUSTOM_VARIABLE_OPTIONS[0].value,
    customVariableValue: '',
  };
}

export function createDefaultCompoundBranchingState(): CompoundBranchingState {
  return {
    criteria: [createDefaultCompoundBranchingCriterion(1)],
    collapsedCriterionIds: new Set(),
    defaultJumpTargetId: NO_BRANCHING_OPTION.value,
  };
}

export function isCompoundBranchingLogicComplete(state: CompoundBranchingState): boolean {
  return state.criteria.every((criterion) => hasCompleteConditions(criterion));
}

/** True once IF conditions are complete and at least one criterion jumps to a question. */
export function isCompoundBranchingLogicApplied(state: CompoundBranchingState): boolean {
  if (!isCompoundBranchingLogicComplete(state)) return false;
  return state.criteria.some(
    (criterion) =>
      criterion.jumpTargetId.trim().length > 0 &&
      criterion.jumpTargetId !== NO_BRANCHING_OPTION.value
  );
}

export function createDefaultQuotaControlState(optionIds: string[]): QuotaControlState {
  const byOptionId: Record<string, QuotaControlOptionState> = {};
  for (const optionId of optionIds) {
    byOptionId[optionId] = {
      quotaLimit: 0,
      overLimitAction: NO_BRANCHING_OPTION.value as QuotaOverLimitAction,
    };
  }
  return { byOptionId };
}

export function createDefaultDynamicTextCommentsState(
  optionIds: string[]
): DynamicTextCommentsState {
  const byOptionId: Record<string, DynamicTextOptionState> = {};
  for (const optionId of optionIds) {
    byOptionId[optionId] = { status: 'disabled', labelName: '' };
  }
  return { aiPrompt: '', byOptionId };
}

export function hasDynamicTextCommentsChanges(
  state: DynamicTextCommentsState,
  optionIds: string[]
): boolean {
  if (state.aiPrompt.trim()) return true;
  return optionIds.some((optionId) => {
    const optionState = state.byOptionId[optionId];
    if (!optionState) return false;
    return optionState.status === 'enabled' || optionState.labelName.trim().length > 0;
  });
}

export function isDynamicTextCommentsConfigured(
  state: QuestionLogicState,
  optionIds: string[]
): boolean {
  return optionIds.some((optionId) => {
    const optionState = state.dynamicTextComments.byOptionId[optionId];
    return optionState?.status === 'enabled';
  });
}

export function getDynamicTextEnabledByOptionId(
  state: QuestionLogicState,
  optionIds: string[]
): Record<string, boolean> {
  const enabledByOptionId: Record<string, boolean> = {};
  for (const optionId of optionIds) {
    if (state.dynamicTextComments.byOptionId[optionId]?.status === 'enabled') {
      enabledByOptionId[optionId] = true;
    }
  }
  return enabledByOptionId;
}

export type LookupTableUnsupportedLogicType =
  | 'quota-control'
  | 'dynamic-text'
  | 'extraction';

const LOOKUP_TABLE_UNSUPPORTED_LOGIC_LABELS: Record<
  LookupTableUnsupportedLogicType,
  string
> = {
  'quota-control': 'Quota Control',
  'dynamic-text': 'Dynamic Text/Comments',
  extraction: 'Extraction',
};

export interface LookupTableConversionLogicConflict {
  logicType: LookupTableUnsupportedLogicType;
  typeLabel: string;
}

export function collectLookupTableConversionLogicConflicts(
  state: QuestionLogicState,
  optionIds: string[]
): LookupTableConversionLogicConflict[] {
  const conflicts: LookupTableConversionLogicConflict[] = [];

  if (isQuotaControlConfigured(state, optionIds)) {
    conflicts.push({
      logicType: 'quota-control',
      typeLabel: LOOKUP_TABLE_UNSUPPORTED_LOGIC_LABELS['quota-control'],
    });
  }

  if (isDynamicTextCommentsConfigured(state, optionIds)) {
    conflicts.push({
      logicType: 'dynamic-text',
      typeLabel: LOOKUP_TABLE_UNSUPPORTED_LOGIC_LABELS['dynamic-text'],
    });
  }

  if (state.logicType === 'extraction') {
    conflicts.push({
      logicType: 'extraction',
      typeLabel: LOOKUP_TABLE_UNSUPPORTED_LOGIC_LABELS.extraction,
    });
  }

  return conflicts;
}

export function clearLookupTableUnsupportedLogic(
  state: QuestionLogicState,
  optionIds: string[],
  logicType: LookupTableUnsupportedLogicType
): QuestionLogicState {
  if (logicType === 'quota-control') {
    return {
      ...state,
      logicType: state.logicType === 'quota-control' ? 'skip-logic' : state.logicType,
      quotaControl: createDefaultQuotaControlState(optionIds),
    };
  }

  if (logicType === 'dynamic-text') {
    return {
      ...state,
      logicType: state.logicType === 'dynamic-text' ? 'skip-logic' : state.logicType,
      dynamicTextComments: createDefaultDynamicTextCommentsState(optionIds),
    };
  }

  return {
    ...state,
    logicType: state.logicType === 'extraction' ? 'skip-logic' : state.logicType,
    extraction: createDefaultExtractionLogicState(),
  };
}

export function createDefaultExtractionLogicState(): ExtractionLogicState {
  return {
    extractSource: 'selected-choices',
    questionType: 'single-select',
    alwaysExtractOptionId: '',
    neverExtractOptionId: '',
    lockedExtraction: false,
  };
}

export function buildExtractionOptionTargets(
  options: { id: string; label: string }[]
): BranchTargetOption[] {
  return options.map((option) => ({ value: option.id, label: option.label }));
}

export function isShowHideOptionsLogicApplied(
  state: QuestionLogicState,
  optionIds: string[]
): boolean {
  return (
    state.logicType === 'show-hide-options' &&
    isShowHideOptionsLogicComplete(state.showHideOptions, optionIds)
  );
}

export function isShowHideOptionsLogicComplete(
  state: ShowHideOptionsState,
  optionIds: string[]
): boolean {
  const criteriaComplete = state.criteria.every(
    (criterion) =>
      hasCompleteConditions(criterion) && parseSelectedValues(criterion.targetOptionId).length > 0
  );
  if (!criteriaComplete) return false;

  if (state.useLegacyMethod) return true;

  const uncovered = getUncoveredOptionIds(optionIds, state);
  if (uncovered.length === 0) return true;

  return state.uncoveredOptionsAction === 'show' || state.uncoveredOptionsAction === 'hide';
}

export function createDefaultQuestionLogicState(
  optionIds: string[]
): QuestionLogicState {
  const branchByOptionId: Record<string, string> = {};
  for (const optionId of optionIds) {
    branchByOptionId[optionId] = NO_BRANCHING_OPTION.value;
  }

  return {
    logicType: 'skip-logic',
    looping: false,
    branchByOptionId,
    defaultBranching: NO_BRANCHING_OPTION.value,
    randomizerLimit: '0',
    showHideQuestion: createDefaultShowHideQuestionState(),
    showHideOptions: createDefaultShowHideOptionsState(),
    compoundBranching: createDefaultCompoundBranchingState(),
    quotaControl: createDefaultQuotaControlState(optionIds),
    dynamicTextComments: createDefaultDynamicTextCommentsState(optionIds),
    extraction: createDefaultExtractionLogicState(),
  };
}

export function mergeQuestionLogicState(
  optionIds: string[],
  initial?: QuestionLogicState
): QuestionLogicState {
  const defaults = createDefaultQuestionLogicState(optionIds);
  if (!initial) return defaults;

  return {
    ...defaults,
    ...initial,
    branchByOptionId: { ...defaults.branchByOptionId, ...initial.branchByOptionId },
    showHideQuestion: {
      ...defaults.showHideQuestion,
      ...(initial.showHideQuestion ?? {}),
      criteria:
        initial.showHideQuestion?.criteria?.map((criterion, index) => ({
          ...newCriterion(),
          ...criterion,
          name: criterion.name?.trim() || `Criteria ${index + 1}`,
        })) ?? defaults.showHideQuestion.criteria,
      collapsedCriterionIds:
        initial.showHideQuestion?.collapsedCriterionIds ??
        defaults.showHideQuestion.collapsedCriterionIds,
    },
    showHideOptions: initial.showHideOptions ?? defaults.showHideOptions,
    compoundBranching: {
      ...defaults.compoundBranching,
      ...(initial.compoundBranching ?? {}),
      criteria:
        initial.compoundBranching?.criteria?.map((criterion, index) => ({
          ...createDefaultCompoundBranchingCriterion(index + 1),
          ...criterion,
          jumpTargetId:
            criterion.jumpTargetId?.trim() ||
            NO_BRANCHING_OPTION.value,
          customVariable:
            criterion.customVariable?.trim() ||
            COMPOUND_BRANCH_CUSTOM_VARIABLE_OPTIONS[0].value,
          customVariableValue: criterion.customVariableValue ?? '',
        })) ?? defaults.compoundBranching.criteria,
      collapsedCriterionIds:
        initial.compoundBranching?.collapsedCriterionIds ??
        defaults.compoundBranching.collapsedCriterionIds,
      defaultJumpTargetId:
        initial.compoundBranching?.defaultJumpTargetId?.trim() ||
        defaults.compoundBranching.defaultJumpTargetId,
    },
    quotaControl: {
      byOptionId: {
        ...defaults.quotaControl.byOptionId,
        ...(initial.quotaControl?.byOptionId ?? {}),
      },
    },
    dynamicTextComments: {
      aiPrompt: initial.dynamicTextComments?.aiPrompt ?? defaults.dynamicTextComments.aiPrompt,
      byOptionId: {
        ...defaults.dynamicTextComments.byOptionId,
        ...(initial.dynamicTextComments?.byOptionId ?? {}),
      },
    },
    extraction: {
      ...defaults.extraction,
      ...(initial.extraction ?? {}),
      extractSource: normalizeExtractionSource(
        initial.extraction?.extractSource ?? defaults.extraction.extractSource
      ),
      questionType: normalizeExtractionQuestionType(
        initial.extraction?.questionType ?? defaults.extraction.questionType
      ),
    },
  };
}

export function buildBranchTargetOptions(
  questions: { id: string; code: string; label: string }[],
  currentQuestionId: string
): BranchTargetOption[] {
  return [
    NO_BRANCHING_OPTION,
    ...questions
      .filter((question) => question.id !== currentQuestionId)
      .map((question) => ({
        value: question.id,
        label: `${question.code} — ${question.label}`,
      })),
  ];
}

export function findBranchTargetOption(
  options: BranchTargetOption[],
  value: string
): BranchTargetOption | null {
  return options.find((option) => option.value === value) ?? null;
}
