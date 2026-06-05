'use client';

import type { CSSProperties, SyntheticEvent } from 'react';
import type { SurveyMatrix, SurveyQuestion } from '@/data/mock-survey-detail';
import type { MultiPointAnswerType } from '@/data/mock-multi-point-settings';
import {
  QuestionRichTextField,
  plainTextFromRichValue,
} from '@/components/surveys/QuestionRichTextField';
import type { QuestionMenuAction } from '@/components/surveys/QuestionOptionsMenu';
import { QuestionWorkspaceActions } from '@/components/surveys/QuestionWorkspaceActions';
import { QuestionWorkspaceFooter } from '@/components/surveys/QuestionWorkspaceFooter';
import styles from './MultiPointScalesQuestionRow.module.css';

function stopQuestionEvent(event: SyntheticEvent): void {
  event.stopPropagation();
}

export interface MultiPointScalesQuestionRowProps {
  question: SurveyQuestion;
  matrix: SurveyMatrix;
  answerType: MultiPointAnswerType;
  sectionId: string;
  showHideOptionsApplied?: boolean;
  onAction: (label: string) => void;
  onMenuAction: (action: QuestionMenuAction) => void;
  onOpenLogic: () => void;
  onOpenSettings: () => void;
  onQuestionTextChange: (sectionId: string, questionId: string, text: string) => void;
  onMatrixAnchorChange: (
    sectionId: string,
    questionId: string,
    anchor: 'leftAnchor' | 'rightAnchor',
    value: string
  ) => void;
  onMatrixColumnLabelChange: (
    sectionId: string,
    questionId: string,
    columnId: string,
    label: string
  ) => void;
  onMatrixRowLabelChange: (
    sectionId: string,
    questionId: string,
    rowId: string,
    label: string
  ) => void;
  onAddRow: (sectionId: string, questionId: string) => void;
  onBulkEditRows: (sectionId: string, questionId: string) => void;
  onBulkEditColumns: (sectionId: string, questionId: string) => void;
}

export function MultiPointScalesQuestionRow({
  question,
  matrix,
  answerType,
  sectionId,
  showHideOptionsApplied = false,
  onAction,
  onMenuAction,
  onOpenLogic,
  onOpenSettings,
  onQuestionTextChange,
  onMatrixAnchorChange,
  onMatrixColumnLabelChange,
  onMatrixRowLabelChange,
  onAddRow,
  onBulkEditRows,
  onBulkEditColumns,
}: MultiPointScalesQuestionRowProps) {
  const inputType =
    answerType === 'checkbox' ? 'checkbox' : answerType === 'radio' ? 'radio' : 'radio';
  const matrixGridStyle = { '--matrix-cols': matrix.columns.length } as CSSProperties;

  return (
    <article className={styles.root}>
      <div className={styles.card}>
        <div className={styles.cardInner}>
          <div className={styles.topBar}>
            <span className={styles.topSpacer} aria-hidden />
            <QuestionWorkspaceActions
              question={question}
              onAction={onAction}
              onOpenLogic={onOpenLogic}
              onOpenSettings={onOpenSettings}
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

          <div className={styles.matrixWrap} style={matrixGridStyle}>
            <div className={`${styles.matrixRowLine} ${styles.anchorRow}`}>
              <span className={styles.rowLabelSpacer} aria-hidden />
              <div className={styles.anchorField}>
                <QuestionRichTextField
                  variant="option"
                  value={matrix.leftAnchor}
                  onChange={(value) =>
                    onMatrixAnchorChange(sectionId, question.id, 'leftAnchor', value)
                  }
                  ariaLabel="Left anchor"
                  placeholder="Left Anchor"
                  onPointerDown={stopQuestionEvent}
                />
              </div>
              {matrix.columns.map((column) => (
                <span key={`anchor-gap-${column.id}`} className={styles.columnGap} aria-hidden />
              ))}
              <div className={styles.anchorField}>
                <QuestionRichTextField
                  variant="option"
                  value={matrix.rightAnchor}
                  onChange={(value) =>
                    onMatrixAnchorChange(sectionId, question.id, 'rightAnchor', value)
                  }
                  ariaLabel="Right anchor"
                  placeholder="Right Anchor"
                  toolbarAlign="end"
                  onPointerDown={stopQuestionEvent}
                />
              </div>
            </div>

            <div className={styles.matrixRowLine}>
              <span className={styles.rowLabelSpacer} aria-hidden />
              <span className={styles.anchorSlotSpacer} aria-hidden />
              {matrix.columns.map((column) => (
                <div key={column.id} className={styles.columnHeader}>
                  <QuestionRichTextField
                    variant="option"
                    value={column.label}
                    onChange={(label) =>
                      onMatrixColumnLabelChange(sectionId, question.id, column.id, label)
                    }
                    ariaLabel="Column label"
                    placeholder="Column"
                    onPointerDown={stopQuestionEvent}
                  />
                </div>
              ))}
              <span className={styles.anchorSlotSpacer} aria-hidden />
            </div>

            {matrix.rows.map((row) => (
              <div key={row.id} className={styles.matrixRowLine}>
                <div className={styles.rowLabelCell}>
                  <QuestionRichTextField
                    variant="option"
                    value={row.label}
                    onChange={(label) =>
                      onMatrixRowLabelChange(sectionId, question.id, row.id, label)
                    }
                    ariaLabel="Row label"
                    placeholder="Row"
                    onPointerDown={stopQuestionEvent}
                  />
                </div>
                <span className={styles.anchorSlotSpacer} aria-hidden />
                {matrix.columns.map((column) => (
                  <div key={`${row.id}-${column.id}`} className={styles.cell}>
                    <input
                      type={inputType}
                      disabled
                      name={`${question.id}-${row.id}`}
                      aria-label={`${plainTextFromRichValue(row.label)} ${plainTextFromRichValue(column.label)}`}
                    />
                  </div>
                ))}
                <span className={styles.anchorSlotSpacer} aria-hidden />
              </div>
            ))}

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
                Bulk Edit Rows
              </button>
              <button
                type="button"
                className={styles.bulkEditLink}
                onClick={() => onBulkEditColumns(sectionId, question.id)}
              >
                Bulk Edit Columns
              </button>
            </div>
          </div>
        </div>
        <QuestionWorkspaceFooter
          showHideOptionsApplied={showHideOptionsApplied}
          className={styles.footer}
        />
      </div>
    </article>
  );
}
