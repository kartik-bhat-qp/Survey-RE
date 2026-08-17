'use client';

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type SyntheticEvent } from 'react';
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
  FLEX_MATRIX_NUMERIC_SLIDER_MAX,
  FLEX_MATRIX_NUMERIC_SLIDER_MIN,
  FLEX_MATRIX_TEXT_PLACEHOLDER,
  RANK_ORDER_SELECT_PLACEHOLDER,
  resolveFlexMatrixCellType,
  resolveFlexMatrixColumnOptions,
} from '@/data/mock-survey-detail';
import {
  QuestionRichTextField,
  plainTextFromRichValue,
} from '@/components/surveys/QuestionRichTextField';
import type { QuestionMenuAction } from '@/components/surveys/QuestionOptionsMenu';
import { QuestionWorkspaceActions } from '@/components/surveys/QuestionWorkspaceActions';
import { QuestionWorkspaceFooter } from '@/components/surveys/QuestionWorkspaceFooter';
import { FlexMatrixEditAnswersModal } from '@/components/surveys/FlexMatrixEditAnswersModal';
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

function FlexMatrixOptionSelect({
  ariaLabel,
  options,
  searchLabel = 'Search options',
}: {
  ariaLabel: string;
  options: string[];
  searchLabel?: string;
}) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedValue, setSelectedValue] = useState<string | null>(null);

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return options;
    return options.filter((option) => option.toLowerCase().includes(query));
  }, [options, search]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        setSearch('');
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (selectedValue && !options.includes(selectedValue)) {
      setSelectedValue(null);
    }
  }, [options, selectedValue]);

  function handleSelect(value: string): void {
    setSelectedValue(value);
    setOpen(false);
    setSearch('');
  }

  return (
    <div
      ref={rootRef}
      className={styles.rankSelect}
      onPointerDown={stopQuestionEvent}
      onClick={stopQuestionEvent}
    >
      <button
        type="button"
        className={`${styles.rankSelectTrigger} ${open ? styles.rankSelectTriggerOpen : ''}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={styles.rankSelectValue}>
          {selectedValue ?? RANK_ORDER_SELECT_PLACEHOLDER}
        </span>
        <span className={`wm-keyboard-arrow-down ${styles.rankSelectCaret}`} aria-hidden />
      </button>

      {open ? (
        <div className={styles.rankSelectPanel} role="presentation">
          <label className={styles.rankSelectSearch}>
            <span className={`wm-search ${styles.rankSelectSearchIcon}`} aria-hidden />
            <input
              type="search"
              value={search}
              placeholder="Search..."
              aria-label={searchLabel}
              onChange={(event) => setSearch(event.target.value)}
              autoFocus
            />
          </label>
          <ul id={listboxId} className={styles.rankSelectList} role="listbox">
            {filteredOptions.map((option) => (
              <li key={option} role="option" aria-selected={selectedValue === option}>
                <button
                  type="button"
                  className={`${styles.rankSelectOption} ${
                    selectedValue === option ? styles.rankSelectOptionActive : ''
                  }`}
                  onClick={() => handleSelect(option)}
                >
                  {option}
                </button>
              </li>
            ))}
            {filteredOptions.length === 0 ? (
              <li className={styles.rankSelectEmpty}>No options found</li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function FlexMatrixRankSelect({
  ariaLabel,
  rankCount,
}: {
  ariaLabel: string;
  rankCount: number;
}) {
  const ranks = useMemo(
    () => Array.from({ length: Math.max(rankCount, 1) }, (_, index) => String(index + 1)),
    [rankCount]
  );

  return (
    <FlexMatrixOptionSelect
      ariaLabel={ariaLabel}
      options={ranks}
      searchLabel="Search ranks"
    />
  );
}

function FlexMatrixCell({
  questionId,
  rowId,
  rowLabel,
  column,
  rankCount,
}: {
  questionId: string;
  rowId: string;
  rowLabel: string;
  column: SurveyMatrixColumn;
  rankCount: number;
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
      <FlexMatrixOptionSelect
        ariaLabel={ariaLabel}
        options={resolveFlexMatrixColumnOptions(column)}
        searchLabel="Search answers"
      />
    );
  }

  if (cellType === 'rank-order') {
    return <FlexMatrixRankSelect ariaLabel={ariaLabel} rankCount={rankCount} />;
  }

  if (cellType === 'rating-scale') {
    const scaleOptions = resolveFlexMatrixColumnOptions(column);
    return (
      <div
        className={styles.ratingScaleCell}
        style={{ '--scale-cols': scaleOptions.length } as CSSProperties}
        role="radiogroup"
        aria-label={ariaLabel}
      >
        {scaleOptions.map((option) => (
          <div key={option} className={styles.ratingScaleChoice}>
            <input
              type="radio"
              disabled
              name={`${questionId}-${rowId}-${column.id}`}
              aria-label={`${ariaLabel} ${option}`}
            />
          </div>
        ))}
      </div>
    );
  }

  if (cellType === 'numeric-slider') {
    return (
      <div className={styles.sliderCell} aria-label={ariaLabel}>
        <span className={styles.sliderBound}>{FLEX_MATRIX_NUMERIC_SLIDER_MIN}</span>
        <span className={styles.sliderTrack}>
          <span className={styles.sliderThumb} />
        </span>
        <span className={styles.sliderBound}>{FLEX_MATRIX_NUMERIC_SLIDER_MAX}</span>
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
  onColumnOptionsChange: (
    sectionId: string,
    questionId: string,
    columnId: string,
    options: string[]
  ) => void;
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
  onColumnOptionsChange,
  onBulkEditRows,
}: FlexMatrixQuestionRowProps) {
  const matrixGridStyle = {
    '--flex-matrix-grid': [
      'minmax(9.5rem, 1.15fr)',
      ...matrix.columns.map((column) => {
        const cellType = resolveFlexMatrixCellType(column);
        if (cellType === 'rating-scale') {
          const pointCount = Math.max(resolveFlexMatrixColumnOptions(column).length, 1);
          return `minmax(${Math.max(pointCount * 2.25, 8.5)}rem, 1.15fr)`;
        }
        if (cellType === 'numeric-slider') {
          return 'minmax(9.5rem, 1.1fr)';
        }
        return 'minmax(7.5rem, 1fr)';
      }),
    ].join(' '),
  } as CSSProperties;
  const [editAnswersColumnId, setEditAnswersColumnId] = useState<string | null>(null);
  const editAnswersColumn = matrix.columns.find((column) => column.id === editAnswersColumnId);
  const hasEditAnswersColumns = matrix.columns.some((column) => {
    const cellType = resolveFlexMatrixCellType(column);
    return cellType === 'dropdown' || cellType === 'rating-scale';
  });

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
            <div className={`${styles.matrixRowLine} ${styles.matrixHeaderRow}`}>
              <span className={styles.rowLabelSpacer} aria-hidden />
              {matrix.columns.map((column) => {
                const isRatingScale = resolveFlexMatrixCellType(column) === 'rating-scale';
                const scaleOptions = isRatingScale
                  ? resolveFlexMatrixColumnOptions(column)
                  : [];
                return (
                  <div key={column.id} className={styles.columnHeader}>
                    <div className={styles.columnHeaderTop}>
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
                    {isRatingScale ? (
                      <div
                        className={styles.ratingScalePoints}
                        style={{ '--scale-cols': scaleOptions.length } as CSSProperties}
                      >
                        {scaleOptions.map((option) => (
                          <span key={option} className={styles.ratingScalePointLabel}>
                            {option}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
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
                      rankCount={matrix.rows.length}
                    />
                  </div>
                ))}
              </div>
            ))}

            {hasEditAnswersColumns ? (
              <div className={styles.matrixRowLine}>
                <span className={styles.rowLabelSpacer} aria-hidden />
                {matrix.columns.map((column) => {
                  const cellType = resolveFlexMatrixCellType(column);
                  const canEditAnswers =
                    cellType === 'dropdown' || cellType === 'rating-scale';
                  return (
                    <div key={`edit-answers-${column.id}`} className={styles.editAnswersCell}>
                      {canEditAnswers ? (
                        <button
                          type="button"
                          className={styles.editAnswersLink}
                          onClick={(event) => {
                            event.stopPropagation();
                            setEditAnswersColumnId(column.id);
                          }}
                          onPointerDown={stopQuestionEvent}
                        >
                          Edit Answers
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}

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

      <FlexMatrixEditAnswersModal
        open={Boolean(editAnswersColumn)}
        onOpenChange={(open) => {
          if (!open) setEditAnswersColumnId(null);
        }}
        optionLabels={
          editAnswersColumn ? resolveFlexMatrixColumnOptions(editAnswersColumn) : []
        }
        onSave={(options) => {
          if (!editAnswersColumn) return;
          onColumnOptionsChange(sectionId, question.id, editAnswersColumn.id, options);
        }}
      />
    </article>
  );
}
