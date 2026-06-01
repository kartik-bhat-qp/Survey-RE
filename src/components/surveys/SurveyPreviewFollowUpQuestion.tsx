'use client';

import type { SurveyQuestionPreviewFollowUp } from '@/data/survey-question-preview-session';
import {
  resolveInputKind,
  resolveQuestionKind,
} from '@/data/survey-question-preview-utils';
import { plainTextFromRichValue } from '@/components/surveys/QuestionRichTextField';
import styles from './SurveyPreviewFollowUpQuestion.module.css';

interface SurveyPreviewFollowUpQuestionProps {
  question: SurveyQuestionPreviewFollowUp;
}

function columnLabel(label: string, index: number): string {
  const plain = plainTextFromRichValue(label).trim();
  if (plain) return plain;
  return String(index + 1);
}

export function SurveyPreviewFollowUpQuestion({ question }: SurveyPreviewFollowUpQuestionProps) {
  const kind = resolveQuestionKind(question.kind);
  const inputType = resolveInputKind(question.inputKind);

  return (
    <section className={styles.followUp} aria-label="Next question preview">
      <div className={styles.divider} role="separator" />

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
            {question.matrix.columns.map((column, index) => (
              <li key={column.id} className={styles.matrixScaleItem}>
                <input type={inputType} disabled aria-label={columnLabel(column.label, index)} />
                <span>{columnLabel(column.label, index)}</span>
              </li>
            ))}
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
        <ul className={styles.optionList}>
          {question.options.map((option) => (
            <li key={option.id} className={styles.optionItem}>
              <label className={styles.optionLabel}>
                <input type={inputType} disabled name={`follow-up-${question.code}`} />
                <span>{plainTextFromRichValue(option.label)}</span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
