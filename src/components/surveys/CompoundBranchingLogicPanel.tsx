'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { SurveyQuestion as EditorSurveyQuestion } from '@/data/mock-survey-detail';
import {
  getQuestionsBySurvey,
  isEditorQuestionForCriteria,
  toCriteriaQuestionsFromEditor,
  toCriteriaQuestionsFromSections,
} from '@/data/mock-survey-questions';
import {
  COMPOUND_BRANCH_CUSTOM_VARIABLE_OPTIONS,
  COMPOUND_BRANCH_CUSTOM_VARIABLE_VALUE_OPTIONS,
  NO_BRANCHING_OPTION,
  SELECT_PLACEHOLDER,
  findBranchTargetOption,
  type CompoundBranchingCriterion,
  type CompoundBranchingState,
} from '@/data/mock-question-logic';
import type { Criterion } from '@/data/mock-criteria-engine';
import type { QuestionLoopContext } from '@/data/mock-looping';
import { CriteriaEngineEditor } from '@/components/surveys/CriteriaEngineEditor';
import { plainTextFromRichValue } from '@/components/surveys/QuestionRichTextField';
import styles from './CompoundBranchingLogicPanel.module.css';

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);
const WuMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenu })),
  { ssr: false }
);
const WuMenuItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuItem })),
  { ssr: false }
);

interface CompoundBranchingLogicPanelProps {
  state: CompoundBranchingState;
  question: EditorSurveyQuestion;
  allQuestions: EditorSurveyQuestion[];
  sections?: { title: string; questions: EditorSurveyQuestion[] }[];
  surveyId: number;
  loopContextByQuestionId?: Record<number, QuestionLoopContext>;
  onChange: (next: CompoundBranchingState) => void;
}

function isCompoundCriterion(criterion: Criterion): criterion is CompoundBranchingCriterion {
  return 'jumpTargetId' in criterion && 'customVariable' in criterion;
}

function CustomVariableValueMenu({
  value,
  onChange,
  ariaLabel,
}: {
  value: string;
  onChange: (next: string) => void;
  ariaLabel: string;
}) {
  const [search, setSearch] = useState('');
  const selected =
    findBranchTargetOption(COMPOUND_BRANCH_CUSTOM_VARIABLE_VALUE_OPTIONS, value) ??
    SELECT_PLACEHOLDER;
  const filtered = COMPOUND_BRANCH_CUSTOM_VARIABLE_VALUE_OPTIONS.filter((option) =>
    option.label.toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <WuMenu
      Trigger={
        <button type="button" className={styles.valueMenuTrigger} aria-label={ariaLabel}>
          <span className={styles.valueMenuLabel}>{selected.label}</span>
          <span className={`wm-keyboard-arrow-down ${styles.valueMenuCaret}`} aria-hidden />
        </button>
      }
      align="start"
    >
      <div
        className={styles.valueSearchRow}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <input
          type="search"
          className={styles.valueSearchInput}
          placeholder="Search.."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => event.stopPropagation()}
          aria-label="Search variable values"
        />
      </div>
      <div className={styles.valueMenuList}>
        {filtered.map((option) => (
          <WuMenuItem key={option.value || 'select'} onSelect={() => onChange(option.value)}>
            {option.label}
          </WuMenuItem>
        ))}
      </div>
    </WuMenu>
  );
}

export function CompoundBranchingLogicPanel({
  state,
  question,
  allQuestions,
  sections,
  surveyId,
  loopContextByQuestionId,
  onChange,
}: CompoundBranchingLogicPanelProps) {
  const surveyQuestions = useMemo(() => {
    const fromEditor =
      sections && sections.length > 0
        ? toCriteriaQuestionsFromSections(surveyId, sections)
        : toCriteriaQuestionsFromEditor(surveyId, allQuestions);
    const catalog = fromEditor.length > 0 ? fromEditor : getQuestionsBySurvey(surveyId);
    return catalog.filter((item) => item.parentQuestionId === undefined);
  }, [allQuestions, sections, surveyId]);

  const questionJumpTargets = useMemo(
    () => [
      NO_BRANCHING_OPTION,
      ...allQuestions
        .filter((item) => item.id !== question.id && isEditorQuestionForCriteria(item))
        .map((item, index) => ({
          value: item.id,
          label: `${index + 1}. [${item.code}] ${plainTextFromRichValue(item.text)}`,
        })),
    ],
    [allQuestions, question.id]
  );

  const selectedDefaultJump =
    findBranchTargetOption(questionJumpTargets, state.defaultJumpTargetId) ??
    NO_BRANCHING_OPTION;

  function patchCriterion(criterionId: string, patch: Partial<CompoundBranchingCriterion>) {
    onChange({
      ...state,
      criteria: state.criteria.map((criterion) =>
        criterion.id === criterionId ? { ...criterion, ...patch } : criterion
      ),
    });
  }

  function handleCriteriaEngineChange(next: {
    criteria: Criterion[];
    collapsedCriterionIds: Set<string>;
  }) {
    onChange({
      ...state,
      criteria: next.criteria.map((criterion, index) => {
        const existing = state.criteria.find((item) => item.id === criterion.id);
        if (existing) {
          return {
            ...criterion,
            jumpTargetId: existing.jumpTargetId,
            customVariable: existing.customVariable,
            customVariableValue: existing.customVariableValue,
          };
        }
        return {
          ...criterion,
          name: criterion.name || `Criteria ${index + 1}`,
          jumpTargetId: NO_BRANCHING_OPTION.value,
          customVariable: COMPOUND_BRANCH_CUSTOM_VARIABLE_OPTIONS[0].value,
          customVariableValue: '',
        };
      }),
      collapsedCriterionIds: next.collapsedCriterionIds,
    });
  }

  return (
    <div className={styles.panel}>
      <CriteriaEngineEditor
        criteria={state.criteria}
        collapsedCriterionIds={state.collapsedCriterionIds}
        questions={surveyQuestions}
        loopContextByQuestionId={loopContextByQuestionId}
        onChange={handleCriteriaEngineChange}
        showAddCriteria
        modeControl="dropdown"
        renderCriterionFooter={(criterion) => {
          if (!isCompoundCriterion(criterion)) return null;

          const selectedJump =
            findBranchTargetOption(questionJumpTargets, criterion.jumpTargetId) ??
            NO_BRANCHING_OPTION;
          const selectedVariable =
            findBranchTargetOption(
              COMPOUND_BRANCH_CUSTOM_VARIABLE_OPTIONS,
              criterion.customVariable
            ) ?? COMPOUND_BRANCH_CUSTOM_VARIABLE_OPTIONS[0];

          return (
            <div className={styles.jumpRow}>
              <span className={styles.jumpLabel}>If criteria is met, jump to</span>
              <div className={styles.jumpSelect}>
                <WuSelect
                  data={questionJumpTargets}
                  accessorKey={{ value: 'value', label: 'label' }}
                  value={selectedJump}
                  onSelect={(item) => {
                    const next = item as { value: string; label: string } | null;
                    if (!next) return;
                    patchCriterion(criterion.id, { jumpTargetId: next.value });
                  }}
                  variant="outlined"
                  aria-label={`Jump question for ${criterion.name}`}
                />
              </div>
              <div className={styles.variableSelect}>
                <WuSelect
                  data={COMPOUND_BRANCH_CUSTOM_VARIABLE_OPTIONS}
                  accessorKey={{ value: 'value', label: 'label' }}
                  value={selectedVariable}
                  onSelect={(item) => {
                    const next = item as { value: string; label: string } | null;
                    if (!next) return;
                    patchCriterion(criterion.id, { customVariable: next.value });
                  }}
                  variant="outlined"
                  aria-label={`Custom variable for ${criterion.name}`}
                />
              </div>
              <div className={styles.valueSelect}>
                <CustomVariableValueMenu
                  value={criterion.customVariableValue}
                  onChange={(customVariableValue) =>
                    patchCriterion(criterion.id, { customVariableValue })
                  }
                  ariaLabel={`Custom variable value for ${criterion.name}`}
                />
              </div>
            </div>
          );
        }}
      />

      <div className={styles.defaultLogicBar}>
        <span className={styles.defaultLogicTitle}>Default Logic</span>
        <span className={styles.defaultLogicLabel}>If criteria not met, jump to</span>
        <div className={styles.defaultJumpSelect}>
          <WuSelect
            data={questionJumpTargets}
            accessorKey={{ value: 'value', label: 'label' }}
            value={selectedDefaultJump}
            onSelect={(item) => {
              const next = item as { value: string; label: string } | null;
              if (!next) return;
              onChange({ ...state, defaultJumpTargetId: next.value });
            }}
            variant="outlined"
            aria-label="Default jump question"
          />
        </div>
      </div>
    </div>
  );
}
