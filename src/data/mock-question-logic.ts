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

export interface QuestionLogicState {
  logicType: QuestionLogicType;
  looping: boolean;
  branchByOptionId: Record<string, string>;
  defaultBranching: string;
  randomizerLimit: string;
  showHideOptions: ShowHideOptionsState;
}

export const SELECT_PLACEHOLDER: BranchTargetOption = {
  value: '',
  label: '- Select -',
};

export const SHOW_HIDE_CRITERIA_ACTION_OPTIONS: BranchTargetOption[] = [
  { value: 'hide-option', label: 'If criteria is met, hide option' },
  { value: 'show-option', label: 'If criteria is met, show option' },
];

export const UNCOVERED_OPTIONS_ACTION_OPTIONS: BranchTargetOption[] = [
  { value: 'show', label: 'Show options' },
  { value: 'hide', label: 'Hide options' },
];

export function getCriteriaCoveredOptionIds(state: ShowHideOptionsState): Set<string> {
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
    showHideOptions: createDefaultShowHideOptionsState(),
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
