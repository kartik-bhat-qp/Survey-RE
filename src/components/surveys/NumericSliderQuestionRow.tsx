'use client';

import type { SyntheticEvent } from 'react';
import type { SurveyMatrix, SurveyQuestion } from '@/data/mock-survey-detail';
import { QuestionRichTextField } from '@/components/surveys/QuestionRichTextField';
import { QuestionWorkspaceActions } from '@/components/surveys/QuestionWorkspaceActions';
import { QuestionWorkspaceFooter } from '@/components/surveys/QuestionWorkspaceFooter';
import { NumericSliderMatrixPreview } from '@/components/surveys/NumericSliderMatrixPreview';
import type { QuestionMenuAction } from '@/components/surveys/QuestionOptionsMenu';
import styles from './NumericSliderQuestionRow.module.css';

function stopQuestionEvent(event: SyntheticEvent): void {
  event.stopPropagation();
}

export interface NumericSliderQuestionRowProps {
  question: SurveyQuestion;
  matrix: SurveyMatrix;
  sectionId: string;
  showHideOptionsApplied?: boolean;
  dynamicTextCommentsApplied?: boolean;
  extractionApplied?: boolean;
  quotaControlApplied?: boolean;
  onAction: (label: string) => void;
  onMenuAction: (action: QuestionMenuAction) => void;
  onOpenLogic: () => void;
  onOpenSettings: () => void;
  onOpenValidation: () => void;
  onQuestionTextChange: (sectionId: string, questionId: string, text: string) => void;
  onMatrixAnchorChange: (
    sectionId: string,
    questionId: string,
    anchor: 'leftAnchor' | 'rightAnchor',
    value: string
  ) => void;
  onMatrixRowLabelChange: (
    sectionId: string,
    questionId: string,
    rowId: string,
    label: string
  ) => void;
  onAddRow: (sectionId: string, questionId: string) => void;
  onBulkEditRows: (sectionId: string, questionId: string) => void;
}

export function NumericSliderQuestionRow({
  question,
  matrix,
  sectionId,
  showHideOptionsApplied = false,
  dynamicTextCommentsApplied = false,
  extractionApplied = false,
  quotaControlApplied = false,
  onAction,
  onMenuAction,
  onOpenLogic,
  onOpenSettings,
  onOpenValidation,
  onQuestionTextChange,
  onMatrixAnchorChange,
  onMatrixRowLabelChange,
  onAddRow,
  onBulkEditRows,
}: NumericSliderQuestionRowProps) {
  return (
    <article className={styles.root}>
      <div className="numericSliderCard">
        <div className={styles.cardInner}>
          <div className={styles.topBar}>
            <span className={styles.topSpacer} aria-hidden />
            <QuestionWorkspaceActions
              question={question}
              onAction={onAction}
              onOpenLogic={onOpenLogic}
              onOpenSettings={onOpenSettings}
              onOpenValidation={onOpenValidation}
              onMenuAction={onMenuAction}
              menuBtnClassName={styles.menuBtn}
            />
          </div>
          <div className={styles.questionTextWrap}>
            {question.required ? <span className={styles.required}>*</span> : null}
            <QuestionRichTextField
              value={question.text}
              onChange={(text) => onQuestionTextChange(sectionId, question.id, text)}
              ariaLabel="Question text"
              placeholder="Enter question text"
              onPointerDown={stopQuestionEvent}
            />
          </div>
          <NumericSliderMatrixPreview
            matrix={matrix}
            onMatrixAnchorChange={(anchor, value) =>
              onMatrixAnchorChange(sectionId, question.id, anchor, value)
            }
            onMatrixRowLabelChange={(rowId, label) =>
              onMatrixRowLabelChange(sectionId, question.id, rowId, label)
            }
          />
          <div
            className={styles.matrixTools}
            onClick={stopQuestionEvent}
            onKeyDown={stopQuestionEvent}
          >
            <button
              type="button"
              className={styles.addRowBtn}
              aria-label="Add row"
              onClick={() => onAddRow(sectionId, question.id)}
            >
              <span className="wm-add" aria-hidden />
            </button>
            <span className={styles.matrixToolsSpacer} aria-hidden />
            <button
              type="button"
              className={styles.bulkEditLink}
              onClick={() => onBulkEditRows(sectionId, question.id)}
            >
              Edit Rows in Bulk
            </button>
          </div>
        </div>
        <QuestionWorkspaceFooter
          showHideOptionsApplied={showHideOptionsApplied}
          dynamicTextCommentsApplied={dynamicTextCommentsApplied}
          extractionApplied={extractionApplied}
          quotaControlApplied={quotaControlApplied}
          className={styles.footer}
        />
      </div>
    </article>
  );
}
