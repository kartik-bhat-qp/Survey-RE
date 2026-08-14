'use client';

import type { CSSProperties, SyntheticEvent } from 'react';
import dynamic from 'next/dynamic';
import type {
  FlexMatrixCellType,
  SurveyMatrix,
  SurveyMatrixColumn,
  SurveyQuestion,
} from '@/data/mock-survey-detail';
import {
  FLEX_MATRIX_COLUMN_TYPES,
  FLEX_MATRIX_NUMERIC_PLACEHOLDER,
  FLEX_MATRIX_TEXT_PLACEHOLDER,
  resolveFlexMatrixCellType,
} from '@/data/mock-survey-detail';
import {
  QuestionRichTextField,
  plainTextFromRichValue,
} from '@/components/surveys/QuestionRichTextField';
import type { QuestionMenuAction } from '@/components/surveys/QuestionOptionsMenu';
import { QuestionWorkspaceActions } from '@/components/surveys/QuestionWorkspaceActions';
import { QuestionWorkspaceFooter } from '@/components/surveys/QuestionWorkspaceFooter';
import styles from './FlexMatrixQuestionRow.module.css';

const WuMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenu })),
  { ssr: false }
);

const WuMenuItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuItem })),
  { ssr: false }
);

function stopQuestionEvent(event: SyntheticEvent): void {
  event.stopPropagation();
}

function FlexMatrixCell({
  questionId,
  rowId,
  rowLabel,
  column,
}: {
  questionId: string;
  rowId: string;
  rowLabel: string;
  column: SurveyMatrixColumn;
}) {
  const cellType = resolveFlexMatrixCellType(column);
  const ariaLabel = `${plainTextFromRichValue(rowLabel)} ${plainTextFromRichValue(column.label)}`;

  if (cellType === 'radio' || cellType === 'checkbox') {
    return (
      <div className={styles.choiceCell}>
        <input
          type={cellType}
          disabled
          name={`${questionId}-${rowId}-${column.id}`}
          aria-label={ariaLabel}
        />
      </div>
    );
  }

  if (cellType === 'dropdown') {
    return (
      <span className={styles.dropdownBox} aria-label={ariaLabel}>
        <span className={styles.dropdownPlaceholder}>Select</span>
        <span className={`wm-keyboard-arrow-down ${styles.dropdownCaret}`} aria-hidden />
      </span>
    );
  }

  if (cellType === 'rank-order') {
    return (
      <span className={styles.rankBox} aria-label={ariaLabel}>
        #
      </span>
    );
  }

  if (cellType === 'rating-scale') {
    return (
      <div className={styles.ratingCell} aria-label={ariaLabel}>
        {[1, 2, 3, 4, 5].map((point) => (
          <span key={point} className={`wm-star-border ${styles.ratingStar}`} aria-hidden />
        ))}
      </div>
    );
  }

  if (cellType === 'numeric-slider') {
    return (
      <div className={styles.sliderCell} aria-label={ariaLabel}>
        <span className={styles.sliderTrack}>
          <span className={styles.sliderThumb} />
        </span>
      </div>
    );
  }

  return (
    <span className={styles.answerBox}>
      {cellType === 'numeric' ? FLEX_MATRIX_NUMERIC_PLACEHOLDER : FLEX_MATRIX_TEXT_PLACEHOLDER}
    </span>
  );
}

export interface FlexMatrixQuestionRowProps {
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
  onAddColumn: (sectionId: string, questionId: string, cellType: FlexMatrixCellType) => void;
  onRemoveColumn: (sectionId: string, questionId: string, columnId: string) => void;
  onBulkEditRows: (sectionId: string, questionId: string) => void;
}

export function FlexMatrixQuestionRow({
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
  onAddColumn,
  onRemoveColumn,
  onBulkEditRows,
}: FlexMatrixQuestionRowProps) {
  const matrixGridStyle = { '--matrix-cols': matrix.columns.length } as CSSProperties;

  return (
    <article className={styles.root}>
      <div className="flexMatrixCard">
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
                  <div className={styles.columnHeaderField}>
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
                  <WuMenu
                    Trigger={
                      <button
                        type="button"
                        className={styles.columnMenuBtn}
                        aria-label={`Column options for ${plainTextFromRichValue(column.label) || 'column'}`}
                        onPointerDown={stopQuestionEvent}
                        onClick={stopQuestionEvent}
                      >
                        <span className="wm-keyboard-arrow-down" aria-hidden />
                      </button>
                    }
                    align="start"
                    modal={false}
                  >
                    <WuMenuItem
                      onSelect={() => onRemoveColumn(sectionId, question.id, column.id)}
                    >
                      <span className={styles.removeColumnItem}>
                        <span className="wm-delete" aria-hidden />
                        Remove Column
                      </span>
                    </WuMenuItem>
                  </WuMenu>
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
                    <FlexMatrixCell
                      questionId={question.id}
                      rowId={row.id}
                      rowLabel={row.label}
                      column={column}
                    />
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
                Row
              </button>
              <WuMenu
                Trigger={
                  <button type="button" className={styles.addColumnBtn} aria-label="Add column">
                    Column
                    <span className="wm-keyboard-arrow-down" aria-hidden />
                  </button>
                }
                align="start"
                modal={false}
              >
                {FLEX_MATRIX_COLUMN_TYPES.map((columnType) => (
                  <WuMenuItem
                    key={columnType.id}
                    onSelect={() => onAddColumn(sectionId, question.id, columnType.id)}
                  >
                    {columnType.label}
                  </WuMenuItem>
                ))}
              </WuMenu>
              <span className={styles.matrixToolsSpacer} aria-hidden />
              <button
                type="button"
                className={styles.bulkEditLink}
                onClick={() => onBulkEditRows(sectionId, question.id)}
              >
                Bulk Edit Rows
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
