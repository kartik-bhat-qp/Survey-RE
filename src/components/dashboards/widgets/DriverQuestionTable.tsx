'use client';

import { WidgetQuestionSelection } from '../WidgetQuestionSelection';
import { matrixPickerRowId, type SurveyQuestion } from '@/data/mock-survey-questions';
import type { DriverQuestionChoice } from '@/data/driver-scoring';

interface Props {
  surveyId: number;
  questions: SurveyQuestion[];
  choices: DriverQuestionChoice[];
  primary: string | null;
  selected: string[];
  multiple?: boolean;
  onChange: (ids: string[]) => void;
}

export function DriverQuestionTable({ surveyId, questions, choices, primary, selected, multiple = false, onChange }: Props) {
  const eligible = new Set(choices.map(choice => choice.outcome.rowId));
  const idsByPicker = new Map<number, string[]>();
  const checked: number[] = [];
  const reasons: Record<number, string> = {};

  function register(pickerId: number, ids: string[]) {
    const available = ids.filter(id => eligible.has(id) && (!multiple || id !== primary));
    idsByPicker.set(pickerId, available);
    if (!available.length) {
      reasons[pickerId] = multiple && ids.includes(primary ?? '')
        ? 'Already selected as the primary question.' : questions.find(q => q.id === pickerId)?.type === 'Text'
          ? 'Text questions need a numeric encoding rule before driver analysis.'
          : questions.find(q => q.id === pickerId)?.type === 'Multiple Select'
            ? 'Multiple Select questions need a rule for combining answers before driver analysis.'
            : 'Choose a single-answer or rating question with at least two answer values.';
    } else if (available.every(id => selected.includes(id))) {
      checked.push(pickerId);
    } else if (multiple && new Set([...selected, ...available]).size > 10) {
      reasons[pickerId] = 'Select up to 10 driver questions.';
    }
  }

  for (const q of questions) {
    if (q.matrixRows?.length) {
      const rows = q.matrixRows.map((_, i) => `${q.id}:r${i}`);
      rows.forEach((id, i) => register(matrixPickerRowId(q.id, i), [id]));
      register(q.id, rows);
      if (!multiple) reasons[q.id] = 'Expand the matrix to select a primary question row.';
    } else {
      register(q.id, [`${q.id}:r0`]);
    }
  }

  return <WidgetQuestionSelection surveyId={surveyId} questionCatalog={questions} multiSelect={multiple}
    wholeQuestionsOnly={false} showSelectAll={false} selectedQuestionId={checked[0]} selectedQuestionIds={checked}
    unavailableQuestionIds={Object.keys(reasons).map(Number)} unavailableQuestionReasons={reasons}
    toolbarContent={multiple && <span aria-live="polite">{selected.length} of 10 drivers selected</span>}
    onSelectQuestion={q => onChange(idsByPicker.get(q.id) ?? [])}
    onToggleQuestion={(q, include) => {
      const ids = idsByPicker.get(q.id) ?? [];
      onChange(include ? [...new Set([...selected, ...ids])].slice(0, 10) : selected.filter(id => !ids.includes(id)));
    }} />;
}
