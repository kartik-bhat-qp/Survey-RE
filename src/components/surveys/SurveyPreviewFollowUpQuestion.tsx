'use client';

import { useMemo, useState } from 'react';
import type { SurveyQuestionPreviewFollowUp } from '@/data/survey-question-preview-session';
import {
  resolveInputKind,
  resolveQuestionKind,
} from '@/data/survey-question-preview-utils';
import { plainTextFromRichValue } from '@/components/surveys/QuestionRichTextField';
import { SurveyPreviewOptionsBlock } from '@/components/surveys/SurveyPreviewOptionsBlock';
import { usePreviewVisibleOptions } from '@/components/surveys/usePreviewVisibleOptions';
import {
  DEFAULT_QUESTION_SETTINGS,
  orderAnswerOptions,
} from '@/data/mock-question-settings';
import styles from './SurveyPreviewFollowUpQuestion.module.css';

interface SurveyPreviewFollowUpQuestionProps {
  question: SurveyQuestionPreviewFollowUp;
  surveyId: number;
  showDivider?: boolean;
}

function columnLabel(label: string, index: number): string {
  const plain = plainTextFromRichValue(label).trim();
  if (plain) return plain;
  return String(index + 1);
}

export function SurveyPreviewFollowUpQuestion({
  question,
  surveyId,
  showDivider = true,
}: SurveyPreviewFollowUpQuestionProps) {
  const kind = resolveQuestionKind(question.kind);
  const inputType = resolveInputKind(question.inputKind);
  const isMultiSelect = inputType === 'checkbox';

  const visibleOptions = usePreviewVisibleOptions(
    question.options,
    question.showHideOptions ?? null,
    surveyId
  );
  const visibleOptionIdsKey = visibleOptions.map((option) => option.id).join('|');
  const displayOptions = useMemo(
    () =>
      orderAnswerOptions(
        visibleOptions,
        question.answerDisplayOrder ?? DEFAULT_QUESTION_SETTINGS.answerDisplayOrder,
        question.alternateFlipReversed ?? false,
        question.randomizeAnswerCount ?? DEFAULT_QUESTION_SETTINGS.randomizeAnswerCount
      ),
    [
      question.alternateFlipReversed,
      question.answerDisplayOrder,
      question.randomizeAnswerCount,
      visibleOptionIdsKey,
      visibleOptions,
    ]
  );

  const [selectedMatrixColumnId, setSelectedMatrixColumnId] = useState<string | null>(null);
  const [selectedMatrixColumnIds, setSelectedMatrixColumnIds] = useState<string[]>([]);

  function toggleMatrixColumn(columnId: string): void {
    setSelectedMatrixColumnIds((prev) =>
      prev.includes(columnId) ? prev.filter((id) => id !== columnId) : [...prev, columnId]
    );
  }

  return (
    <section className={styles.followUp} aria-label="Next question preview">
      {showDivider ? <div className={styles.divider} role="separator" /> : null}

      <h2 className={styles.questionTitle}>
        {question.required ? <span className={styles.requiredMark}>*</span> : null}
        <span>{plainTextFromRichValue(question.text)}</span>
      </h2>

      {kind === 'multi-point-scales' && question.matrix ? (
        <div className={styles.matrixPreview}>
          <div className={styles.matrixAnchors}>
            <span>{plainTextFromRichValue(question.matrix.leftAnchor)}</span>
            <span>{plainTextFromRichValue(question.matrix.rightAnchor)}</span>
          </div>
          <ul className={styles.matrixScale}>
            {question.matrix.columns.map((column, index) => {
              const isChecked = isMultiSelect
                ? selectedMatrixColumnIds.includes(column.id)
                : selectedMatrixColumnId === column.id;

              return (
                <li key={column.id} className={styles.matrixScaleItem}>
                  <label className={styles.matrixScaleLabel}>
                    <input
                      type={inputType}
                      {...(isMultiSelect
                        ? {}
                        : { name: `follow-up-matrix-${question.code}` })}
                      checked={isChecked}
                      aria-label={columnLabel(column.label, index)}
                      onChange={() => {
                        if (isMultiSelect) {
                          toggleMatrixColumn(column.id);
                        } else {
                          setSelectedMatrixColumnId(column.id);
                        }
                      }}
                    />
                    <span>{columnLabel(column.label, index)}</span>
                  </label>
                </li>
              );
            })}
          </ul>
          {question.matrix.rows[0] ? (
            <p className={styles.matrixRowHint}>
              {plainTextFromRichValue(question.matrix.rows[0].label)}
              {question.matrix.rows.length > 1
                ? ` (+${question.matrix.rows.length - 1} more)`
                : ''}
            </p>
          ) : null}
        </div>
      ) : (
        <SurveyPreviewOptionsBlock
          questionCode={question.code}
          options={displayOptions}
          inputKind={inputType}
          groupName={`follow-up-${question.code}`}
        />
      )}
    </section>
  );
}
