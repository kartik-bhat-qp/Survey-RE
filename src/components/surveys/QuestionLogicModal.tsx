'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { SurveyQuestion } from '@/data/mock-survey-detail';
import {
  buildBranchTargetOptions,
  createDefaultQuestionLogicState,
  findBranchTargetOption,
  isShowHideOptionsLogicComplete,
  QUESTION_LOGIC_TYPE_OPTIONS,
  RANDOMIZER_LIMIT_OPTIONS,
  type QuestionLogicState,
  type QuestionLogicTypeOption,
} from '@/data/mock-question-logic';
import { HelpFileLink } from '@/components/surveys/HelpFileLink';
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
  onSave?: (state: QuestionLogicState) => void;
}

export function QuestionLogicModal({
  open,
  onOpenChange,
  question,
  allQuestions,
  surveyId,
  onSave,
}: QuestionLogicModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [state, setState] = useState<QuestionLogicState>(() =>
    createDefaultQuestionLogicState(question.options.map((option) => option.id))
  );

  const isShowHideOptions = state.logicType === 'show-hide-options';

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
    setState(createDefaultQuestionLogicState(question.options.map((option) => option.id)));
  }, [open, question.id, question.options]);

  const selectedLogicType =
    QUESTION_LOGIC_TYPE_OPTIONS.find((option) => option.value === state.logicType) ??
    QUESTION_LOGIC_TYPE_OPTIONS[0];

  const selectedDefaultBranch =
    findBranchTargetOption(branchTargets, state.defaultBranching) ?? branchTargets[0];

  const selectedRandomizerLimit =
    RANDOMIZER_LIMIT_OPTIONS.find((option) => option.value === state.randomizerLimit) ??
    RANDOMIZER_LIMIT_OPTIONS[0];

  const canSave = isShowHideOptions
    ? isShowHideOptionsLogicComplete(
        state.showHideOptions,
        question.options.map((option) => option.id)
      )
    : true;

  function handleSave() {
    if (!canSave) return;
    onSave?.(state);
    onOpenChange(false);
    showToast({ message: 'Logic saved', variant: 'success' });
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
            isShowHideOptions ? styles.controlsRowCompact : ''
          }`}
        >
          <div className={styles.logicTypeField}>
            <WuSelect
              data={QUESTION_LOGIC_TYPE_OPTIONS}
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
          </div>
          {!isShowHideOptions ? (
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
      <WuModalFooter className={styles.modalFooter}>
        <WuButton variant="primary" disabled={!canSave} onClick={handleSave}>
          Save Logic
        </WuButton>
      </WuModalFooter>
    </WuModal>
  );
}
