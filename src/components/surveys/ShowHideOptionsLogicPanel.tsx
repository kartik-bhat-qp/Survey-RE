'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { SurveyQuestion as EditorSurveyQuestion } from '@/data/mock-survey-detail';
import { getQuestionsBySurvey } from '@/data/mock-survey-questions';
import {
  findBranchTargetOption,
  getUncoveredOptionIds,
  SELECT_PLACEHOLDER,
  SHOW_HIDE_CRITERIA_ACTION_OPTIONS,
  UNCOVERED_OPTIONS_ACTION_OPTIONS,
  type ShowHideOptionsCriterion,
  type ShowHideOptionsState,
} from '@/data/mock-question-logic';
import type { Criterion } from '@/data/mock-criteria-engine';
import { CriteriaEngineEditor } from '@/components/surveys/CriteriaEngineEditor';
import { OptionMultiSelect } from '@/components/surveys/OptionMultiSelect';
import { plainTextFromRichValue } from '@/components/surveys/QuestionRichTextField';
import quotaStyles from './CriteriaBasedQuotaModal.module.css';
import styles from './ShowHideOptionsLogicPanel.module.css';

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false }
);
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

const DEFAULT_VISIBILITY_DEPRECATION_TOOLTIP =
  'This option will not be available after Aug 30 2026';

interface ShowHideOptionsLogicPanelProps {
  state: ShowHideOptionsState;
  question: EditorSurveyQuestion;
  surveyId: number;
  onChange: (next: ShowHideOptionsState) => void;
}

function isShowHideCriterion(criterion: Criterion): criterion is ShowHideOptionsCriterion {
  return 'action' in criterion && 'targetOptionId' in criterion;
}

export function ShowHideOptionsLogicPanel({
  state,
  question,
  surveyId,
  onChange,
}: ShowHideOptionsLogicPanelProps) {
  const surveyQuestions = useMemo(
    () => getQuestionsBySurvey(surveyId).filter((q) => q.parentQuestionId === undefined),
    [surveyId]
  );
  const optionTargets = useMemo(
    () =>
      question.options.map((option) => ({
        value: option.id,
        label: plainTextFromRichValue(option.label),
      })),
    [question.options]
  );
  const uncoveredOptionIds = useMemo(
    () => getUncoveredOptionIds(optionTargets.map((opt) => opt.value), state),
    [optionTargets, state]
  );
  const hasUncoveredOptions = uncoveredOptionIds.length > 0;
  const selectedUncoveredAction =
    findBranchTargetOption(UNCOVERED_OPTIONS_ACTION_OPTIONS, state.uncoveredOptionsAction) ??
    SELECT_PLACEHOLDER;

  function patchCriterion(criterionId: string, patch: Partial<ShowHideOptionsCriterion>) {
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
      criteria: next.criteria.map((criterion) => {
        const existing = state.criteria.find((c) => c.id === criterion.id);
        if (existing) {
          return { ...criterion, action: existing.action, targetOptionId: existing.targetOptionId };
        }
        return {
          ...criterion,
          action: 'hide-option',
          targetOptionId: '',
        } as ShowHideOptionsCriterion;
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
        onChange={handleCriteriaEngineChange}
        showAddCriteria
        renderCriterionFooter={(criterion) => {
          if (!isShowHideCriterion(criterion)) return null;
          const selectedAction =
            findBranchTargetOption(SHOW_HIDE_CRITERIA_ACTION_OPTIONS, criterion.action) ??
            SHOW_HIDE_CRITERIA_ACTION_OPTIONS[0];

          return (
            <div className={`${quotaStyles.conditionRow} ${styles.actionRow}`}>
              <div className={styles.actionSelect}>
                <WuSelect
                  data={SHOW_HIDE_CRITERIA_ACTION_OPTIONS}
                  accessorKey={{ value: 'value', label: 'label' }}
                  value={selectedAction}
                  onSelect={(item) => {
                    const next = item as { value: string; label: string } | null;
                    if (!next) return;
                    patchCriterion(criterion.id, { action: next.value });
                  }}
                  variant="outlined"
                />
              </div>
              <div className={styles.actionSelectWide}>
                <OptionMultiSelect
                  options={optionTargets}
                  value={criterion.targetOptionId}
                  onChange={(next) => patchCriterion(criterion.id, { targetOptionId: next })}
                  triggerClassName={`${quotaStyles.menuTrigger} ${quotaStyles.conditionValue} ${styles.targetOptionTrigger}`}
                />
              </div>
            </div>
          );
        }}
      />

      {!state.useLegacyMethod ? (
        <div className={styles.uncoveredRow}>
          <span className={styles.uncoveredLabel}>
            For options which are not a part of any criteria
          </span>
          <div className={styles.uncoveredSelect}>
            <WuSelect
              data={[SELECT_PLACEHOLDER, ...UNCOVERED_OPTIONS_ACTION_OPTIONS]}
              accessorKey={{ value: 'value', label: 'label' }}
              value={selectedUncoveredAction}
              onSelect={(item) => {
                const next = item as { value: string; label: string } | null;
                if (!next) return;
                onChange({
                  ...state,
                  uncoveredOptionsAction:
                    next.value === 'show' || next.value === 'hide' ? next.value : '',
                });
              }}
              variant="outlined"
            />
          </div>
          {!hasUncoveredOptions ? (
            <span className={styles.uncoveredHint}>
              All answer options are currently assigned to criteria.
            </span>
          ) : null}
        </div>
      ) : null}

      {state.useLegacyMethod ? (
        <div className={styles.defaultRow}>
          <span
            className={`${styles.defaultLabel} ${
              !state.hideOptionByDefault ? styles.defaultLabelActive : ''
            }`}
          >
            Show option by default
          </span>
          <WuToggle
            checked={!state.hideOptionByDefault}
            onChange={(checked) =>
              onChange({ ...state, hideOptionByDefault: !checked })
            }
            aria-label="Toggle default option visibility"
          />
          <span
            className={`${styles.defaultLabel} ${
              state.hideOptionByDefault ? styles.defaultLabelActive : ''
            }`}
          >
            Hide option by default
          </span>
          <WuTooltip content={DEFAULT_VISIBILITY_DEPRECATION_TOOLTIP} position="top">
            <span
              className={styles.deprecatingSoonBadge}
              aria-label={DEFAULT_VISIBILITY_DEPRECATION_TOOLTIP}
            >
              Deprecating soon
            </span>
          </WuTooltip>
        </div>
      ) : null}

      <div className={styles.legacyToggleRow}>
        <WuToggle
          Label="Use legacy method"
          labelPosition="left"
          checked={state.useLegacyMethod}
          onChange={(checked) =>
            onChange({
              ...state,
              useLegacyMethod: checked,
              uncoveredOptionsAction: checked ? '' : state.uncoveredOptionsAction,
            })
          }
        />
      </div>
    </div>
  );
}
