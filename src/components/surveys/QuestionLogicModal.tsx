'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { SurveyQuestion } from '@/data/mock-survey-detail';
import {
  buildBranchTargetOptions,
  createDefaultQuestionLogicState,
  mergeQuestionLogicState,
  findBranchTargetOption,
  hasDynamicTextCommentsChanges,
  isShowHideOptionsLogicApplied,
  isShowHideOptionsLogicComplete,
  isQuotaControlLogicApplied,
  getQuestionLogicTypeOptions,
  resolveLogicTypeForQuestion,
  RANDOMIZER_LIMIT_OPTIONS,
  type QuestionLogicState,
  type QuestionLogicTypeOption,
} from '@/data/mock-question-logic';
import { HelpFileLink } from '@/components/surveys/HelpFileLink';
import { DynamicTextCommentsLogicPanel } from '@/components/surveys/DynamicTextCommentsLogicPanel';
import { ExtractionLogicPanel } from '@/components/surveys/ExtractionLogicPanel';
import { QuotaControlAppliedIcon } from '@/components/surveys/QuotaControlAppliedIcon';
import { ShowHideOptionsAppliedIcon } from '@/components/surveys/ShowHideOptionsAppliedIcon';
import { ShowHideOptionsLogicPanel } from '@/components/surveys/ShowHideOptionsLogicPanel';
import { plainTextFromRichValue } from '@/components/surveys/QuestionRichTextField';
import { useWickUILib } from '@/components/ui/useWickUILib';
import styles from './QuestionLogicModal.module.css';

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false }
);

export interface QuestionLogicModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: SurveyQuestion;
  allQuestions: SurveyQuestion[];
  surveyId: number;
  initialState?: QuestionLogicState;
  onSave?: (state: QuestionLogicState) => void;
}

export function QuestionLogicModal({
  open,
  onOpenChange,
  question,
  allQuestions,
  surveyId,
  initialState,
  onSave,
}: QuestionLogicModalProps) {
  const wick = useWickUILib();
  const router = useRouter();
  const { showToast } = useWuShowToast();
  const [state, setState] = useState<QuestionLogicState>(() =>
    createDefaultQuestionLogicState(question.options.map((option) => option.id))
  );

  const isShowHideOptions = state.logicType === 'show-hide-options';
  const isQuotaControl = state.logicType === 'quota-control';
  const isDynamicTextComments = state.logicType === 'dynamic-text';
  const isExtraction = state.logicType === 'extraction';
  const isAlternateLogicPanel =
    isShowHideOptions || isQuotaControl || isDynamicTextComments || isExtraction;
  const optionIds = useMemo(
    () => question.options.map((option) => option.id),
    [question.options]
  );
  const logicTypeOptions = useMemo(
    () => getQuestionLogicTypeOptions(question),
    [question]
  );
  const showHideOptionsApplied = isShowHideOptionsLogicApplied(state, optionIds);
  const quotaControlApplied = isQuotaControlLogicApplied(state, optionIds);
  const savedShowHideOptionsApplied =
    initialState != null && isShowHideOptionsLogicApplied(initialState, optionIds);
  const canResetShowHideLogic =
    isShowHideOptions && (showHideOptionsApplied || savedShowHideOptionsApplied);
  const savedDynamicTextCommentsApplied =
    initialState != null &&
    initialState.logicType === 'dynamic-text' &&
    hasDynamicTextCommentsChanges(initialState.dynamicTextComments, optionIds);
  const canResetDynamicTextLogic =
    isDynamicTextComments &&
    (hasDynamicTextCommentsChanges(state.dynamicTextComments, optionIds) ||
      savedDynamicTextCommentsApplied);

  const branchTargets = useMemo(
    () =>
      buildBranchTargetOptions(
        allQuestions.map((item) => ({
          id: item.id,
          code: item.code,
          label: plainTextFromRichValue(item.text),
        })),
        question.id
      ),
    [allQuestions, question.id]
  );

  useEffect(() => {
    if (!open) return;
    const merged = mergeQuestionLogicState(optionIds, initialState);
    const logicType = resolveLogicTypeForQuestion(merged.logicType, question);
    setState(logicType === merged.logicType ? merged : { ...merged, logicType });
  }, [open, question, question.id, initialState, optionIds]);

  const selectedLogicType =
    logicTypeOptions.find((option) => option.value === state.logicType) ??
    logicTypeOptions[0];

  const selectedDefaultBranch =
    findBranchTargetOption(branchTargets, state.defaultBranching) ?? branchTargets[0];

  const selectedRandomizerLimit =
    RANDOMIZER_LIMIT_OPTIONS.find((option) => option.value === state.randomizerLimit) ??
    RANDOMIZER_LIMIT_OPTIONS[0];

  const canSave = isShowHideOptions
    ? isShowHideOptionsLogicComplete(state.showHideOptions, optionIds)
    : true;

  function handleSave() {
    if (!canSave) return;
    onSave?.(state);
    onOpenChange(false);
    showToast({
      message: isExtraction ? 'Extraction logic saved' : 'Logic saved',
      variant: 'success',
    });
  }

  function handleResetShowHideLogic() {
    const defaultState = createDefaultQuestionLogicState(optionIds);
    setState(defaultState);
    onSave?.(defaultState);
    onOpenChange(false);
    showToast({ message: 'Show/Hide Options logic reset', variant: 'success' });
  }

  function handleResetDynamicTextLogic() {
    const defaultDynamicTextComments =
      createDefaultQuestionLogicState(optionIds).dynamicTextComments;
    setState((prev) => {
      const nextState = {
        ...prev,
        dynamicTextComments: defaultDynamicTextComments,
      };
      onSave?.(nextState);
      return nextState;
    });
    showToast({ message: 'Dynamic Text/Comments logic reset', variant: 'success' });
  }

  function handleGoToQuotaManagement(): void {
    onOpenChange(false);
    router.push(`/surveys/${surveyId}/advance-quotas`);
  }

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuButton } = wick;
  const questionLabel = plainTextFromRichValue(question.text) || `Question ${question.number}`;

  return (
    <WuModal
      open
      onOpenChange={onOpenChange}
      size="lg"
      className={styles.modal}
      variant="action"
    >
      <WuModalHeader className={styles.modalTitle}>Logic</WuModalHeader>
      <WuModalContent className={styles.content}>
        <div className={styles.questionBar}>Question: {questionLabel}</div>

        <div
          className={`${styles.controlsRow} ${
            isAlternateLogicPanel ? styles.controlsRowCompact : ''
          }`}
        >
          <div className={styles.logicTypeField}>
            <WuSelect
              data={logicTypeOptions}
              accessorKey={{ value: 'value', label: 'label' }}
              value={selectedLogicType}
              onSelect={(item) => {
                const next = item as QuestionLogicTypeOption | null;
                if (!next) return;
                setState((prev) => ({ ...prev, logicType: next.value }));
              }}
              variant="outlined"
            />
            <HelpFileLink topic="logicType" label="Logic type help" />
            {showHideOptionsApplied ? <ShowHideOptionsAppliedIcon /> : null}
            {quotaControlApplied ? <QuotaControlAppliedIcon /> : null}
          </div>
          {!isAlternateLogicPanel ? (
            <div className={styles.loopingField}>
              <WuToggle
                Label="Looping"
                labelPosition="left"
                checked={state.looping}
                onChange={(checked) => setState((prev) => ({ ...prev, looping: checked }))}
              />
              <HelpFileLink topic="looping" label="Looping help" />
            </div>
          ) : null}
        </div>

        {isShowHideOptions ? (
          <ShowHideOptionsLogicPanel
            state={state.showHideOptions}
            question={question}
            surveyId={surveyId}
            onChange={(showHideOptions) => setState((prev) => ({ ...prev, showHideOptions }))}
          />
        ) : isQuotaControl ? (
          <div className={styles.quotaControlRedirectPanel}>
            <div className={styles.quotaControlRedirectCard}>
              <div className={styles.quotaControlRedirectIconWrap} aria-hidden>
                <span className={`wm-pie-chart ${styles.quotaControlRedirectIcon}`} />
              </div>
              <p className={styles.quotaControlRedirectTitle}>Quota Control has moved</p>
              <p className={styles.quotaControlRedirectText}>
                Quota control logic has been moved to Quota Management. Set up limits, targets, and
                over-limit actions there instead of in question logic.
              </p>
              <WuButton variant="primary" size="sm" onClick={handleGoToQuotaManagement}>
                Go to Quota Management
              </WuButton>
            </div>
          </div>
        ) : isDynamicTextComments ? (
          <DynamicTextCommentsLogicPanel
            question={question}
            state={state.dynamicTextComments}
            onChange={(dynamicTextComments) =>
              setState((prev) => ({ ...prev, dynamicTextComments }))
            }
            onReset={handleResetDynamicTextLogic}
            canReset={canResetDynamicTextLogic}
          />
        ) : isExtraction ? (
          <ExtractionLogicPanel
            question={question}
            state={state.extraction}
            onChange={(extraction) => setState((prev) => ({ ...prev, extraction }))}
          />
        ) : (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>If selected, jump to question</th>
                    <th>
                      <span className={styles.headerLabel}>
                        Piping Text
                        <HelpFileLink topic="pipingText" label="Piping text help" />
                      </span>
                    </th>
                    <th>
                      <span className={styles.headerLabel}>
                        Variable Assignment
                        <HelpFileLink topic="variableAssignment" label="Variable assignment help" />
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {question.options.map((option) => {
                    const branchValue = state.branchByOptionId[option.id] ?? 'none';
                    const selectedBranch =
                      findBranchTargetOption(branchTargets, branchValue) ?? branchTargets[0];

                    return (
                      <tr key={option.id}>
                        <td>
                          <div className={styles.optionBranchCell}>
                            <span className={styles.optionLabel}>
                              {plainTextFromRichValue(option.label)}
                            </span>
                            <div className={styles.branchSelect}>
                              <WuSelect
                                data={branchTargets}
                                accessorKey={{ value: 'value', label: 'label' }}
                                value={selectedBranch}
                                onSelect={(item) => {
                                  const next = item as { value: string; label: string } | null;
                                  if (!next) return;
                                  setState((prev) => ({
                                    ...prev,
                                    branchByOptionId: {
                                      ...prev.branchByOptionId,
                                      [option.id]: next.value,
                                    },
                                  }));
                                }}
                                variant="outlined"
                              />
                            </div>
                          </div>
                        </td>
                        <td />
                        <td />
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className={styles.footerPanel}>
              <div className={styles.footerRow}>
                <div className={styles.footerField}>
                  <span className={styles.footerLabel}>Default Branching:</span>
                  <div className={styles.footerSelect}>
                    <WuSelect
                      data={branchTargets}
                      accessorKey={{ value: 'value', label: 'label' }}
                      value={selectedDefaultBranch}
                      onSelect={(item) => {
                        const next = item as { value: string; label: string } | null;
                        if (!next) return;
                        setState((prev) => ({ ...prev, defaultBranching: next.value }));
                      }}
                      variant="outlined"
                    />
                  </div>
                </div>
                <p className={styles.footerHint}>
                  If no branching options are selected, default branching will be executed.
                </p>
              </div>

              <div className={styles.footerRow}>
                <div className={styles.footerField}>
                  <span className={styles.footerLabel}>Branching Randomizer - Limit choices to:</span>
                  <div className={styles.footerSelectNarrow}>
                    <WuSelect
                      data={RANDOMIZER_LIMIT_OPTIONS}
                      accessorKey={{ value: 'value', label: 'label' }}
                      value={selectedRandomizerLimit}
                      onSelect={(item) => {
                        const next = item as { value: string; label: string } | null;
                        if (!next) return;
                        setState((prev) => ({ ...prev, randomizerLimit: next.value }));
                      }}
                      variant="outlined"
                    />
                  </div>
                  <HelpFileLink topic="branchingRandomizer" label="Branching randomizer help" />
                </div>
                <p className={styles.footerHint}>
                  Limit the number of branch/logic destinations by randomizing and choosing
                </p>
              </div>
            </div>
          </>
        )}
      </WuModalContent>
      <WuModalFooter
        className={
          canResetShowHideLogic ? styles.modalFooterWithReset : styles.modalFooter
        }
      >
        {canResetShowHideLogic ? (
          <WuButton variant="secondary" onClick={handleResetShowHideLogic}>
            Reset
          </WuButton>
        ) : null}
        {!isQuotaControl ? (
          <WuButton variant="primary" disabled={!canSave} onClick={handleSave}>
            {isExtraction ? 'Save Extraction Logic' : 'Save Logic'}
          </WuButton>
        ) : null}
      </WuModalFooter>
    </WuModal>
  );
}
