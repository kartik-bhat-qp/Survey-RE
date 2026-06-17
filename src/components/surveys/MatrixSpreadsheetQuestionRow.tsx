'use client';

import type { CSSProperties, SyntheticEvent } from 'react';
import type { SurveyMatrix, SurveyQuestion } from '@/data/mock-survey-detail';
import { SPREADSHEET_ANSWER_PLACEHOLDER } from '@/data/mock-survey-detail';
import { QuestionRichTextField } from '@/components/surveys/QuestionRichTextField';
import type { QuestionMenuAction } from '@/components/surveys/QuestionOptionsMenu';
import { QuestionWorkspaceActions } from '@/components/surveys/QuestionWorkspaceActions';
import { QuestionWorkspaceFooter } from '@/components/surveys/QuestionWorkspaceFooter';
import styles from './MatrixSpreadsheetQuestionRow.module.css';

function stopQuestionEvent(event: SyntheticEvent): void {
  event.stopPropagation();
}

export interface MatrixSpreadsheetQuestionRowProps {
  question: SurveyQuestion;
  matrix: SurveyMatrix;
  sectionId: string;
  showHideOptionsApplied?: boolean;
  onAction: (label: string) => void;
  onMenuAction: (action: QuestionMenuAction) => void;
  onOpenLogic: () => void;
  onOpenSettings: () => void;
  onOpenValidation: () => void;
  onQuestionTextChange: (sectionId: string, questionId: string, text: string) => void;
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

export function MatrixSpreadsheetQuestionRow({
  question,
  matrix,
  sectionId,
  showHideOptionsApplied = false,
  onAction,
  onMenuAction,
  onOpenLogic,
  onOpenSettings,
  onOpenValidation,
  onQuestionTextChange,
  onMatrixColumnLabelChange,
  onMatrixRowLabelChange,
  onAddRow,
  onBulkEditRows,
  onBulkEditColumns,
}: MatrixSpreadsheetQuestionRowProps) {
  const matrixGridStyle = { '--matrix-cols': matrix.columns.length } as CSSProperties;

  return (
    <article className={styles.root}>
      <div className="matrixSpreadsheetCard">
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

          <div className={styles.matrixWrap} style={matrixGridStyle}>
            <div className={styles.matrixRowLine}>
              <span className={styles.rowLabelSpacer} aria-hidden />
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
                {matrix.columns.map((column) => (
                  <div key={`${row.id}-${column.id}`} className={styles.cell}>
                    <span className={styles.answerBox}>{SPREADSHEET_ANSWER_PLACEHOLDER}</span>
                  </div>
                ))}
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
