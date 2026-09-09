'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { SurveyQuestion as EditorSurveyQuestion } from '@/data/mock-survey-detail';
import {
  getQuestionsBySurvey,
  toCriteriaQuestionsFromEditor,
} from '@/data/mock-survey-questions';
import type { ShowHideQuestionState } from '@/data/mock-question-logic';
import type { Criterion } from '@/data/mock-criteria-engine';
import { CriteriaEngineEditor } from '@/components/surveys/CriteriaEngineEditor';
import styles from './ShowHideQuestionLogicPanel.module.css';

const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false }
);

interface ShowHideQuestionLogicPanelProps {
  state: ShowHideQuestionState;
  question: EditorSurveyQuestion;
  allQuestions: EditorSurveyQuestion[];
  surveyId: number;
  onChange: (next: ShowHideQuestionState) => void;
}

export function ShowHideQuestionLogicPanel({
  state,
  question,
  allQuestions,
  surveyId,
  onChange,
}: ShowHideQuestionLogicPanelProps) {
  const surveyQuestions = useMemo(() => {
    const fromEditor = toCriteriaQuestionsFromEditor(surveyId, allQuestions);
    const catalog = fromEditor.length > 0 ? fromEditor : getQuestionsBySurvey(surveyId);
    const currentCriteriaIds = new Set(
      toCriteriaQuestionsFromEditor(surveyId, [question]).map((item) => item.id)
    );
    return catalog.filter(
      (item) => item.parentQuestionId === undefined && !currentCriteriaIds.has(item.id)
    );
  }, [allQuestions, question, surveyId]);

  const criteriaActionLabel = state.showQuestionByDefault
    ? 'If criteria is met, hide question'
    : 'If criteria is met, show question';

  function handleCriteriaEngineChange(next: {
    criteria: Criterion[];
    collapsedCriterionIds: Set<string>;
  }) {
    onChange({
      ...state,
      criteria: next.criteria.map((criterion, index) => {
        const existing = state.criteria.find((item) => item.id === criterion.id);
        return {
          ...criterion,
          name: existing?.name || criterion.name || `Criteria ${index + 1}`,
        };
      }),
      collapsedCriterionIds: next.collapsedCriterionIds,
    });
  }

  return (
    <div className={styles.panel}>
      <div className={styles.toggleStack}>
        <div className={styles.defaultRow}>
          <span
            className={`${styles.defaultLabel} ${
              state.showQuestionByDefault ? styles.defaultLabelActive : ''
            }`}
          >
            Show question by default
          </span>
          <WuToggle
            checked={state.showQuestionByDefault}
            onChange={(checked) =>
              onChange({ ...state, showQuestionByDefault: checked })
            }
            aria-label="Toggle default question visibility"
          />
          <span
            className={`${styles.defaultLabel} ${
              !state.showQuestionByDefault ? styles.defaultLabelActive : ''
            }`}
          >
            Hide question by default
          </span>
        </div>

        <div className={styles.dynamicRow}>
          <WuToggle
            Label="Dynamic (On Page) Logic"
            labelPosition="left"
            checked={state.dynamicOnPageLogic}
            onChange={(checked) =>
              onChange({ ...state, dynamicOnPageLogic: checked })
            }
          />
        </div>
      </div>

      <CriteriaEngineEditor
        criteria={state.criteria}
        collapsedCriterionIds={state.collapsedCriterionIds}
        questions={surveyQuestions}
        onChange={handleCriteriaEngineChange}
        showAddCriteria
        modeControl="dropdown"
        renderCriterionFooter={() => (
          <div className={styles.actionSummary}>{criteriaActionLabel}</div>
        )}
      />
    </div>
  );
}
