export type RemoveLogicOptionId =
  | 'skip-logic'
  | 'compound-branching'
  | 'show-hide-question'
  | 'show-hide-options'
  | 'scoring'
  | 'javascript';

export interface RemoveLogicOption {
  id: RemoveLogicOptionId;
  label: string;
}

export const REMOVE_LOGIC_OPTIONS: RemoveLogicOption[] = [
  { id: 'skip-logic', label: 'Skip Logic' },
  { id: 'compound-branching', label: 'Compound Branching' },
  { id: 'show-hide-question', label: 'Show/Hide Question Logic' },
  { id: 'show-hide-options', label: 'Show/Hide Options Logic' },
  { id: 'scoring', label: 'Scoring' },
  { id: 'javascript', label: 'JavaScript Logic' },
];

export type RemoveLogicSelections = Record<RemoveLogicOptionId, boolean>;

export function createDefaultRemoveLogicSelections(): RemoveLogicSelections {
  return {
    'skip-logic': false,
    'compound-branching': false,
    'show-hide-question': false,
    'show-hide-options': false,
    scoring: false,
    javascript: false,
  };
}
