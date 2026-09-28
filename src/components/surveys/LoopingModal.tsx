'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { HelpFileLink } from '@/components/surveys/HelpFileLink';
import { plainTextFromRichValue } from '@/components/surveys/rich-text-utils';
import type { SurveySection } from '@/data/mock-survey-detail';
import {
  LOOPING_PIPING_TEXT_PLACEHOLDER,
  LOOP_ANSWER_FILTER_OPTIONS,
  LOOP_SOURCE_OPTIONS,
  MAX_LOOP_COLUMNS,
  MAX_LOOP_ROWS,
  PIPING_TEXT_OPTIONS,
  addLoopColumn,
  addLoopRow,
  applyQuestionLoopSource,
  countFilledLoops,
  createDefaultLoopingState,
  getPipingTextLabel,
  removeLastLoopColumn,
  removeLoopRow,
  setLoopCellValue,
  setLoopColumnPipingText,
  type LoopAnswerFilter,
  type LoopSource,
  type LoopingState,
} from '@/data/mock-looping';
import styles from './LoopingModal.module.css';

interface LoopingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Block the loop applies to. */
  section: SurveySection | null;
  /** Questions available as a loop source. */
  sections: SurveySection[];
  /** Previously saved looping config for this block, if any. */
  initialState?: LoopingState | null;
  /** Called when the user saves; `null` means looping was turned off. */
  onSave: (sectionId: string, state: LoopingState | null) => void;
}

interface LoopSourceQuestion {
  value: string;
  label: string;
  optionLabels: string[];
}

function buildLoopSourceQuestions(sections: SurveySection[]): LoopSourceQuestion[] {
  const questions: LoopSourceQuestion[] = [];
  let ordinal = 0;
  sections.forEach((section) => {
    section.questions.forEach((question) => {
      ordinal += 1;
      const text = plainTextFromRichValue(question.text) || question.code;
      const truncated = text.length > 40 ? `${text.slice(0, 40)}...` : text;
      questions.push({
        value: question.id,
        label: `${ordinal}. [${question.code}] ${truncated}`,
        optionLabels: (question.options ?? [])
          .map((option) => plainTextFromRichValue(option.label) || option.label)
          .filter((label) => label.trim().length > 0),
      });
    });
  });
  return questions;
}

export function LoopingModal({
  open,
  onOpenChange,
  section,
  sections,
  initialState = null,
  onSave,
}: LoopingModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [state, setState] = useState<LoopingState>(() => createDefaultLoopingState());
  const sectionId = section?.id ?? null;
  const hydrationKeyRef = useRef<string | null>(null);
  const initialStateRef = useRef(initialState);
  initialStateRef.current = initialState;

  const sourceQuestions = useMemo(
    () => buildLoopSourceQuestions(sections),
    [sections]
  );

  useEffect(() => {
    if (!open) {
      hydrationKeyRef.current = null;
      return;
    }

    // Hydrate once per open/section; keep in-progress edits across parent re-renders.
    const hydrationKey = sectionId ?? '__none__';
    if (hydrationKeyRef.current === hydrationKey) return;
    hydrationKeyRef.current = hydrationKey;
    setState(initialStateRef.current ?? createDefaultLoopingState());
  }, [open, sectionId]);

  const handleModalOpenChange = useCallback(
    (nextOpen: boolean) => {
      queueMicrotask(() => onOpenChange(nextOpen));
    },
    [onOpenChange]
  );

  const handleSourceChange = useCallback(
    (nextSource: LoopSource) => {
      if (nextSource === 'direct') {
        setState((prev) => {
          const columns = prev.columns;
          return {
            ...prev,
            source: 'direct',
            sourceQuestionId: null,
            answerFilter: 'selected',
            rows: Array.from({ length: 4 }, (_, index) => ({
              id: `loop-row-direct-${Date.now()}-${index}`,
              valueByColumnId: Object.fromEntries(
                columns.map((column) => [column.id, ''])
              ),
            })),
          };
        });
        return;
      }
      const firstQuestion = sourceQuestions[0];
      if (!firstQuestion) {
        showToast({
          message: 'Add a question with answer options to loop on',
          variant: 'error',
        });
        return;
      }
      setState((prev) =>
        applyQuestionLoopSource(
          prev,
          firstQuestion.value,
          firstQuestion.optionLabels,
          'selected'
        )
      );
    },
    [showToast, sourceQuestions]
  );

  if (!open || !wick) {
    return null;
  }

  const {
    WuModal,
    WuModalHeader,
    WuModalContent,
    WuModalFooter,
    WuButton,
    WuInput,
    WuSelect,
    WuToggle,
  } = wick;

  const blockTitle = section?.title ?? 'this block';
  const sourceOption =
    LOOP_SOURCE_OPTIONS.find((option) => option.value === state.source) ??
    LOOP_SOURCE_OPTIONS[0];
  const selectedQuestion =
    sourceQuestions.find((question) => question.value === state.sourceQuestionId) ??
    null;
  const answerFilterOption =
    LOOP_ANSWER_FILTER_OPTIONS.find((option) => option.value === state.answerFilter) ??
    LOOP_ANSWER_FILTER_OPTIONS[1];
  const isQuestionSource = state.source === 'question';

  function handleSave(): void {
    if (!section) {
      handleModalOpenChange(false);
      return;
    }
    if (!state.enabled) {
      onSave(section.id, null);
      showToast({ message: `Looping turned off for ${blockTitle}`, variant: 'success' });
      handleModalOpenChange(false);
      return;
    }
    if (isQuestionSource && !state.answerFilter) {
      showToast({ message: 'Select which answers to loop on', variant: 'error' });
      return;
    }
    const loopCount = isQuestionSource ? state.rows.length : countFilledLoops(state);
    if (loopCount === 0) {
      showToast({
        message: isQuestionSource
          ? 'Selected question has no choices to loop on'
          : 'Add at least one piping text to save',
        variant: 'error',
      });
      return;
    }
    onSave(section.id, state);
    showToast({
      message: `Looping saved for ${blockTitle} — ${loopCount} loop${loopCount === 1 ? '' : 's'}`,
      variant: 'success',
    });
    handleModalOpenChange(false);
  }

  return (
    <WuModal
      open
      onOpenChange={handleModalOpenChange}
      className={styles.modal}
      variant="action"
      size="lg"
    >
      <WuModalHeader className={styles.header}>
        <span className={styles.headerTitle}>Looping</span>
        <HelpFileLink topic="looping" label="Looping help" />
      </WuModalHeader>

      <WuModalContent className={styles.content}>
        <div className={styles.enableRow}>
          <WuToggle
            Label={`Looping For ${blockTitle}`}
            labelPosition="left"
            checked={state.enabled}
            onChange={(checked: boolean) =>
              setState((prev) => ({ ...prev, enabled: checked }))
            }
          />
        </div>

        {state.enabled ? (
          <>
            <div
              className={
                isQuestionSource ? styles.configRowHorizontal : styles.configRowStacked
              }
            >
              <div className={styles.field}>
                <span className={styles.fieldLabel}>Select loop source</span>
                <div className={styles.sourceSelect}>
                  <WuSelect
                    data={LOOP_SOURCE_OPTIONS}
                    accessorKey={{ value: 'value', label: 'label' }}
                    value={sourceOption}
                    onSelect={(item: unknown) => {
                      const next = item as { value: LoopSource } | null;
                      if (!next) return;
                      handleSourceChange(next.value);
                    }}
                    variant="outlined"
                  />
                </div>
              </div>

              {isQuestionSource ? (
                <>
                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Select Question</span>
                    <div className={styles.questionSelect}>
                      <WuSelect
                        data={sourceQuestions}
                        accessorKey={{ value: 'value', label: 'label' }}
                        value={selectedQuestion ?? sourceQuestions[0]}
                        onSelect={(item: unknown) => {
                          const next = item as LoopSourceQuestion | null;
                          if (!next) return;
                          setState((prev) =>
                            applyQuestionLoopSource(
                              prev,
                              next.value,
                              next.optionLabels,
                              prev.answerFilter || 'selected'
                            )
                          );
                        }}
                        variant="outlined"
                      />
                    </div>
                  </div>

                  <div className={styles.field}>
                    <span className={styles.fieldLabel}>Select Answers</span>
                    <div className={styles.answerSelect}>
                      <WuSelect
                        data={LOOP_ANSWER_FILTER_OPTIONS}
                        accessorKey={{ value: 'value', label: 'label' }}
                        value={answerFilterOption}
                        onSelect={(item: unknown) => {
                          const next = item as {
                            value: LoopAnswerFilter;
                            label: string;
                          } | null;
                          if (!next) return;
                          setState((prev) => ({ ...prev, answerFilter: next.value }));
                        }}
                        variant="outlined"
                      />
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            <div className={styles.mergeSection}>
              {isQuestionSource ? (
                <h3 className={styles.mergeHeading}>Select merge fields</h3>
              ) : null}

              <div className={styles.tableWrap}>
                <div className={styles.columnControls}>
                  <button
                    type="button"
                    className={styles.circleBtn}
                    aria-label="Add piping text column"
                    disabled={state.columns.length >= MAX_LOOP_COLUMNS}
                    onClick={() => setState((prev) => addLoopColumn(prev))}
                  >
                    <span className="wm-add" aria-hidden />
                  </button>
                  <button
                    type="button"
                    className={styles.circleBtn}
                    aria-label="Remove piping text column"
                    disabled={state.columns.length <= 1}
                    onClick={() => setState((prev) => removeLastLoopColumn(prev))}
                  >
                    <span className="wm-remove" aria-hidden />
                  </button>
                </div>

                <table className={styles.loopTable}>
                  <thead>
                    <tr>
                      {!isQuestionSource ? (
                        <th className={styles.rowActionCell} aria-label="Row actions" />
                      ) : null}
                      <th className={styles.loopHeadCell}>Loop</th>
                      {state.columns.map((column) => (
                        <th key={column.id} className={styles.pipingHeadCell}>
                          <div className={styles.pipingSelect}>
                            <WuSelect
                              data={PIPING_TEXT_OPTIONS}
                              accessorKey={{ value: 'value', label: 'label' }}
                              value={
                                PIPING_TEXT_OPTIONS.find(
                                  (option) => option.value === column.pipingTextId
                                ) ?? PIPING_TEXT_OPTIONS[0]
                              }
                              onSelect={(item: unknown) => {
                                const next = item as { value: string } | null;
                                if (!next) return;
                                setState((prev) =>
                                  setLoopColumnPipingText(prev, column.id, next.value)
                                );
                              }}
                              variant="outlined"
                            />
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {state.rows.map((row, rowIndex) => {
                      const isLastRow = rowIndex === state.rows.length - 1;
                      return (
                        <tr key={row.id}>
                          {!isQuestionSource ? (
                            <td className={styles.rowActionCell}>
                              <div className={styles.rowActions}>
                                {isLastRow ? (
                                  <button
                                    type="button"
                                    className={styles.circleBtn}
                                    aria-label="Add loop"
                                    disabled={state.rows.length >= MAX_LOOP_ROWS}
                                    onClick={() => setState((prev) => addLoopRow(prev))}
                                  >
                                    <span className="wm-add" aria-hidden />
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  className={styles.circleBtn}
                                  aria-label={`Remove loop ${rowIndex + 1}`}
                                  disabled={state.rows.length <= 1}
                                  onClick={() =>
                                    setState((prev) => removeLoopRow(prev, row.id))
                                  }
                                >
                                  <span className="wm-remove" aria-hidden />
                                </button>
                              </div>
                            </td>
                          ) : null}
                          <td className={styles.loopCell}>
                            {isQuestionSource ? (
                              <span className={styles.loopSourceLabel}>
                                {row.sourceLabel ?? `Option ${rowIndex + 1}`}
                              </span>
                            ) : (
                              <span className={styles.loopNumber}>{rowIndex + 1}</span>
                            )}
                          </td>
                          {state.columns.map((column) => (
                            <td key={column.id} className={styles.pipingCell}>
                              <WuInput
                                variant="outlined"
                                value={row.valueByColumnId[column.id] ?? ''}
                                placeholder={LOOPING_PIPING_TEXT_PLACEHOLDER}
                                aria-label={`${getPipingTextLabel(column.pipingTextId)} for loop ${rowIndex + 1}`}
                                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                                  setState((prev) =>
                                    setLoopCellValue(
                                      prev,
                                      row.id,
                                      column.id,
                                      event.target.value
                                    )
                                  )
                                }
                              />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={styles.randomizeRow}>
              <WuToggle
                Label="Randomize Loops"
                labelPosition="left"
                checked={state.randomizeLoops}
                onChange={(checked: boolean) =>
                  setState((prev) => ({ ...prev, randomizeLoops: checked }))
                }
              />
            </div>
          </>
        ) : (
          <p className={styles.disabledHint}>
            Turn on looping to repeat {blockTitle} for each loop you define.
          </p>
        )}
      </WuModalContent>

      <WuModalFooter className={styles.footer}>
        <button
          type="button"
          className={styles.cancelLink}
          onClick={() => handleModalOpenChange(false)}
        >
          Cancel
        </button>
        <WuButton onClick={handleSave}>Save</WuButton>
      </WuModalFooter>
    </WuModal>
  );
}

