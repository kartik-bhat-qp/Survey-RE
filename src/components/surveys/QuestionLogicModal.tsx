'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { SurveyQuestion } from '@/data/mock-survey-detail';
import type { QuestionLoopContext } from '@/data/mock-looping';
import {
  buildBranchTargetOptions,
  createDefaultQuestionLogicState,
  mergeQuestionLogicState,
  findBranchTargetOption,
  hasDynamicTextCommentsChanges,
  isCompoundBranchingLogicComplete,
  isShowHideOptionsLogicApplied,
  isShowHideOptionsLogicComplete,
  isShowHideQuestionLogicComplete,
  isQuotaControlLogicApplied,
  getDynamicTextTargetIds,
  createDefaultDynamicTextCommentsState,
  getQuestionLogicTypeOptions,
  resolveLogicTypeForQuestion,
  RANDOMIZER_LIMIT_OPTIONS,
  type QuestionLogicState,
  type QuestionLogicTypeOption,
} from '@/data/mock-question-logic';
import { HelpFileLink } from '@/components/surveys/HelpFileLink';
import { CompoundBranchingLogicPanel } from '@/components/surveys/CompoundBranchingLogicPanel';
import { DynamicTextCommentsLogicPanel } from '@/components/surveys/DynamicTextCommentsLogicPanel';
import { ExtractionLogicPanel } from '@/components/surveys/ExtractionLogicPanel';
import { QuotaControlAppliedIcon } from '@/components/surveys/QuotaControlAppliedIcon';
import { ShowHideOptionsAppliedIcon } from '@/components/surveys/ShowHideOptionsAppliedIcon';
import { ShowHideOptionsLogicPanel } from '@/components/surveys/ShowHideOptionsLogicPanel';
import { ShowHideQuestionLogicPanel } from '@/components/surveys/ShowHideQuestionLogicPanel';
import { plainTextFromRichValue } from '@/components/surveys/QuestionRichTextField';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  DYNAMIC_TEXT_SAVE_DISABLED_REASON,
} from '@/data/mock-multi-point-settings';
import styles from './QuestionLogicModal.module.css';

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

export interface QuestionLogicModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: SurveyQuestion;
  allQuestions: SurveyQuestion[];
  /** Survey blocks — used to group criteria question pickers by block header. */
  sections?: { title: string; questions: SurveyQuestion[] }[];
  surveyId: number;
  /** Loop choices for questions inside looped blocks, keyed by criteria question id. */
  loopContextByQuestionId?: Record<number, QuestionLoopContext>;
  initialState?: QuestionLogicState;
  onSave?: (state: QuestionLogicState) => void;
  /** Blocks enabling Dynamic Text/Comments when Cards carousel layout is on. */
  cardsCarouselEnabled?: boolean;
  onSwitchToMatrixLayout?: () => void;
}

export function QuestionLogicModal({
  open,
  onOpenChange,
  question,
  allQuestions,
  sections,
  surveyId,
  loopContextByQuestionId,
  initialState,
  onSave,
  cardsCarouselEnabled = false,
  onSwitchToMatrixLayout,
}: QuestionLogicModalProps) {
  const wick = useWickUILib();
  const router = useRouter();
  const { showToast } = useWuShowToast();
  const [state, setState] = useState<QuestionLogicState>(() =>
    createDefaultQuestionLogicState(question.options.map((option) => option.id))
  );

  const isShowHideQuestion = state.logicType === 'show-hide-question';
  const isShowHideOptions = state.logicType === 'show-hide-options';
  const isCompoundBranching = state.logicType === 'compound-branching';
  const isQuotaControl = state.logicType === 'quota-control';
  const isDynamicTextComments = state.logicType === 'dynamic-text';
  const isExtraction = state.logicType === 'extraction';
  const isAlternateLogicPanel =
    isShowHideQuestion ||
    isShowHideOptions ||
    isCompoundBranching ||
    isQuotaControl ||
    isDynamicTextComments ||
    isExtraction;
  const optionIds = useMemo(
    () => question.options.map((option) => option.id),
    [question.options]
  );
  const dynamicTextOptionIds = useMemo(
    () => getDynamicTextTargetIds(question),
    [question]
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
    hasDynamicTextCommentsChanges(initialState.dynamicTextComments, dynamicTextOptionIds);
  const canResetDynamicTextLogic =
    isDynamicTextComments &&
    (hasDynamicTextCommentsChanges(state.dynamicTextComments, dynamicTextOptionIds) ||
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

  const logicHydrationKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      logicHydrationKeyRef.current = null;
      return;
    }

    // Keep in-progress edits when parent re-renders (e.g. Cards carousel → Matrix).
    const hydrationKey = question.id;
    if (logicHydrationKeyRef.current === hydrationKey) return;
    logicHydrationKeyRef.current = hydrationKey;

    const merged = mergeQuestionLogicState(optionIds, initialState);
    const dynamicTextDefaults = createDefaultDynamicTextCommentsState(dynamicTextOptionIds);
    const withDynamicTextTargets: QuestionLogicState = {
      ...merged,
      dynamicTextComments: {
        aiPrompt:
          initialState?.dynamicTextComments?.aiPrompt ?? dynamicTextDefaults.aiPrompt,
        byOptionId: {
          ...dynamicTextDefaults.byOptionId,
          ...(initialState?.dynamicTextComments?.byOptionId ?? {}),
        },
      },
    };
    const logicType = resolveLogicTypeForQuestion(
      withDynamicTextTargets.logicType,
      question
    );
    setState(
      logicType === withDynamicTextTargets.logicType
        ? withDynamicTextTargets
        : { ...withDynamicTextTargets, logicType }
    );
  }, [open, question, question.id, initialState, optionIds, dynamicTextOptionIds]);

  const selectedLogicType =
    logicTypeOptions.find((option) => option.value === state.logicType) ??
    logicTypeOptions[0];

  const selectedDefaultBranch =
    findBranchTargetOption(branchTargets, state.defaultBranching) ?? branchTargets[0];

  const selectedRandomizerLimit =
    RANDOMIZER_LIMIT_OPTIONS.find((option) => option.value === state.randomizerLimit) ??
    RANDOMIZER_LIMIT_OPTIONS[0];

  const canSave = isShowHideQuestion
    ? isShowHideQuestionLogicComplete(state.showHideQuestion)
    : isShowHideOptions
      ? isShowHideOptionsLogicComplete(state.showHideOptions, optionIds)
      : isCompoundBranching
        ? isCompoundBranchingLogicComplete(state.compoundBranching)
        : isDynamicTextComments
          ? !cardsCarouselEnabled
          : true;
  const saveDisabledReason =
    isDynamicTextComments && cardsCarouselEnabled ? DYNAMIC_TEXT_SAVE_DISABLED_REASON : null;

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
      createDefaultDynamicTextCommentsState(dynamicTextOptionIds);
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

        {isShowHideQuestion ? (
          <ShowHideQuestionLogicPanel
            state={state.showHideQuestion}
            question={question}
            allQuestions={allQuestions}
            sections={sections}
            surveyId={surveyId}
            loopContextByQuestionId={loopContextByQuestionId}
            onChange={(showHideQuestion) => setState((prev) => ({ ...prev, showHideQuestion }))}
          />
        ) : isShowHideOptions ? (
          <ShowHideOptionsLogicPanel
            state={state.showHideOptions}
            question={question}
            allQuestions={allQuestions}
            sections={sections}
            surveyId={surveyId}
            loopContextByQuestionId={loopContextByQuestionId}
            onChange={(showHideOptions) => setState((prev) => ({ ...prev, showHideOptions }))}
          />
        ) : isCompoundBranching ? (
          <CompoundBranchingLogicPanel
            state={state.compoundBranching}
            question={question}
            allQuestions={allQuestions}
            sections={sections}
            surveyId={surveyId}
            loopContextByQuestionId={loopContextByQuestionId}
            onChange={(compoundBranching) =>
              setState((prev) => ({ ...prev, compoundBranching }))
            }
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
            cardsCarouselEnabled={cardsCarouselEnabled}
            onSwitchToMatrixLayout={onSwitchToMatrixLayout}
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
          <WuTooltip content={saveDisabledReason ?? undefined} position="top">
            <span className={styles.saveBtnWrap}>
              <WuButton variant="primary" disabled={!canSave} onClick={handleSave}>
                {isExtraction ? 'Save Extraction Logic' : 'Save Logic'}
              </WuButton>
            </span>
          </WuTooltip>
        ) : null}
      </WuModalFooter>
    </WuModal>
  );
}
