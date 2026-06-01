'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { SurveyMatrix, SurveyMatrixColumn } from '@/data/mock-survey-detail';
import type {
  CardsCarouselResponseLayout,
  MultiPointAnswerType,
} from '@/data/mock-multi-point-settings';
import { plainTextFromRichValue } from '@/components/surveys/QuestionRichTextField';
import { SurveyPreviewFollowUpQuestion } from '@/components/surveys/SurveyPreviewFollowUpQuestion';
import type { SurveyQuestionPreviewFollowUp } from '@/data/survey-question-preview-session';
import styles from './MultiPointCardsCarouselPreview.module.css';

export interface MultiPointCardsCarouselPreviewProps {
  surveyTitle: string;
  questionText: string;
  required?: boolean;
  matrix: SurveyMatrix;
  questionWidthPercent: number;
  answerType: MultiPointAnswerType;
  responseLayout?: CardsCarouselResponseLayout;
  questionBelow?: SurveyQuestionPreviewFollowUp | null;
  onDone?: () => void;
  onClose?: () => void;
}

type SlideDirection = 'next' | 'prev';

const ADVANCE_AFTER_SELECT_MS = 480;
const HORIZONTAL_SCALE_POINTS_PER_ROW = 11;

function columnDisplayLabel(label: string, index: number): string {
  const plain = plainTextFromRichValue(label).trim();
  if (plain) return plain;
  return String(index + 1);
}

function chunkColumns(columns: SurveyMatrixColumn[], size: number): SurveyMatrixColumn[][] {
  const rows: SurveyMatrixColumn[][] = [];
  for (let index = 0; index < columns.length; index += size) {
    rows.push(columns.slice(index, index + size));
  }
  return rows;
}

interface CardCarouselNavProps {
  activeRowIndex: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  rowIds: { id: string }[];
  variant?: 'inline' | 'below';
}

function CardCarouselNav({
  activeRowIndex,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  rowIds,
  variant = 'inline',
}: CardCarouselNavProps) {
  return (
    <div
      className={
        variant === 'below' ? styles.cardNavRowBelow : styles.cardNavRow
      }
    >
      <button
        type="button"
        className={styles.cardNavBtnRound}
        aria-label="Previous card"
        disabled={!canGoPrev}
        onClick={onPrev}
      >
        <span className="wm-chevron-left" aria-hidden />
      </button>
      <div className={styles.cardDotsInline} aria-hidden>
        {rowIds.map((row, index) => (
          <span
            key={row.id}
            className={`${styles.cardDot} ${
              index === activeRowIndex ? styles.cardDotActive : ''
            }`}
          />
        ))}
      </div>
      <button
        type="button"
        className={styles.cardNavBtnRound}
        aria-label="Next card"
        disabled={!canGoNext}
        onClick={onNext}
      >
        <span className="wm-chevron-right" aria-hidden />
      </button>
    </div>
  );
}

interface CarouselSlideProps {
  slideKey: string;
  direction: SlideDirection;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

function CarouselSlide({
  slideKey,
  direction,
  children,
  className,
  style,
}: CarouselSlideProps) {
  return (
    <div
      key={slideKey}
      className={`${styles.carouselSlide} ${
        direction === 'next' ? styles.carouselSlideNext : styles.carouselSlidePrev
      } ${className ?? ''}`}
      style={style}
    >
      {children}
    </div>
  );
}

export function MultiPointCardsCarouselPreview({
  surveyTitle,
  questionText,
  required = false,
  matrix,
  questionWidthPercent,
  answerType,
  responseLayout = 'vertical',
  questionBelow = null,
  onDone,
  onClose,
}: MultiPointCardsCarouselPreviewProps) {
  const [activeRowIndex, setActiveRowIndex] = useState(0);
  const [selectionsByRowId, setSelectionsByRowId] = useState<Record<string, string>>({});
  const [slideDirection, setSlideDirection] = useState<SlideDirection>('next');
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rowCount = matrix.rows.length;
  const isFullWidth = questionWidthPercent >= 100;

  const cardColumnStyle: CSSProperties = isFullWidth
    ? { flex: '1 1 0', minWidth: 0, maxWidth: '100%' }
    : {
        flex: `0 0 ${questionWidthPercent}%`,
        width: `${questionWidthPercent}%`,
        maxWidth: `${questionWidthPercent}%`,
        minWidth: 0,
      };

  const cardStackStyle: CSSProperties = { width: '100%' };

  const horizontalWrapStyle: CSSProperties = isFullWidth
    ? { width: '100%', maxWidth: '100%' }
    : {
        width: `${questionWidthPercent}%`,
        maxWidth: `${questionWidthPercent}%`,
      };
  const activeRow = matrix.rows[activeRowIndex];
  const inputType = answerType === 'checkbox' ? 'checkbox' : 'radio';
  const isHorizontal =
    responseLayout === 'horizontal' ||
    String(responseLayout).toLowerCase() === 'horizontal';
  const canGoPrev = activeRowIndex > 0;
  const canGoNext = rowCount > 1 && activeRowIndex < rowCount - 1;

  useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current) {
        clearTimeout(advanceTimeoutRef.current);
      }
    };
  }, []);

  function goToNextCard(): void {
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
    setSlideDirection('next');
    setActiveRowIndex((index) => Math.min(index + 1, rowCount - 1));
  }

  function goToPrevCard(): void {
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
    setSlideDirection('prev');
    setActiveRowIndex((index) => Math.max(index - 1, 0));
  }

  function handleOptionSelect(rowId: string, columnId: string): void {
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }

    setSelectionsByRowId((prev) => ({ ...prev, [rowId]: columnId }));

    if (activeRowIndex >= rowCount - 1) {
      return;
    }

    advanceTimeoutRef.current = setTimeout(() => {
      advanceTimeoutRef.current = null;
      setSlideDirection('next');
      setActiveRowIndex((index) => Math.min(index + 1, rowCount - 1));
    }, ADVANCE_AFTER_SELECT_MS);
  }

  function renderScaleOption(
    column: SurveyMatrixColumn,
    globalIndex: number,
    layout: 'vertical' | 'horizontal'
  ) {
    if (!activeRow) return null;
    const isChecked = selectionsByRowId[activeRow.id] === column.id;
    const isFirstColumn = globalIndex === 0;
    const isLastColumn = globalIndex === matrix.columns.length - 1;

    return (
      <li
        key={column.id}
        className={layout === 'horizontal' ? styles.scaleOptionHorizontal : styles.scaleOption}
      >
        {layout === 'horizontal' && isFirstColumn ? (
          <span className={styles.scaleEndLabel}>
            {plainTextFromRichValue(matrix.leftAnchor)}
          </span>
        ) : layout === 'horizontal' && isLastColumn ? (
          <span className={styles.scaleEndLabel}>
            {plainTextFromRichValue(matrix.rightAnchor)}
          </span>
        ) : layout === 'horizontal' ? (
          <span className={styles.scaleEndLabelSpacer} aria-hidden />
        ) : null}
        <label
          className={`${styles.scaleInputLabel} ${
            isChecked ? styles.scaleInputLabelSelected : ''
          }`}
        >
          <input
            type={inputType}
            name={`preview-${activeRow.id}`}
            checked={isChecked}
            aria-label={columnDisplayLabel(column.label, globalIndex)}
            onChange={() => handleOptionSelect(activeRow.id, column.id)}
          />
          <span>{columnDisplayLabel(column.label, globalIndex)}</span>
        </label>
      </li>
    );
  }

  const verticalScaleOptions = activeRow && !isHorizontal ? (
    <ul className={styles.scaleOptions} aria-label="Rating scale">
      {matrix.columns.map((column, index) => renderScaleOption(column, index, 'vertical'))}
    </ul>
  ) : null;

  const horizontalScaleOptions = activeRow && isHorizontal ? (
    <div className={styles.scaleRowsWrap}>
      {chunkColumns(matrix.columns, HORIZONTAL_SCALE_POINTS_PER_ROW).map((rowColumns, rowIndex) => (
        <ul
          key={`scale-row-${rowIndex}`}
          className={styles.scaleOptionsHorizontal}
          aria-label={rowIndex === 0 ? 'Rating scale' : undefined}
        >
          {rowColumns.map((column, indexInRow) =>
            renderScaleOption(
              column,
              rowIndex * HORIZONTAL_SCALE_POINTS_PER_ROW + indexInRow,
              'horizontal'
            )
          )}
        </ul>
      ))}
    </div>
  ) : null;

  const cardNav = (
    <CardCarouselNav
      activeRowIndex={activeRowIndex}
      canGoPrev={canGoPrev}
      canGoNext={canGoNext}
      onPrev={goToPrevCard}
      onNext={goToNextCard}
      rowIds={matrix.rows}
      variant="below"
    />
  );

  return (
    <div className={styles.shell}>
      <header className={styles.previewHeader}>
        <span className={styles.previewHeaderTitle}>{surveyTitle}</span>
        <button
          type="button"
          className={styles.previewCloseBtn}
          aria-label="Close preview"
          onClick={onClose}
        >
          <span className="wm-close" aria-hidden />
        </button>
      </header>

      <div className={styles.previewCanvas}>
        <div className={styles.questionContainer}>
          <p className={styles.requiredNote}>Questions marked with a * are required</p>

          <h2 className={styles.questionTitle}>
            {required ? <span className={styles.requiredMark}>*</span> : null}
            <span>{plainTextFromRichValue(questionText)}</span>
          </h2>

          <div className={styles.questionContent}>
            {isHorizontal ? (
              <div className={styles.respondentLayoutHorizontal}>
                <CarouselSlide
                  slideKey={activeRow?.id ?? String(activeRowIndex)}
                  direction={slideDirection}
                  className={styles.horizontalSlideWrap}
                  style={horizontalWrapStyle}
                >
                  <div className={styles.horizontalCarouselUnit}>
                    <div className={styles.cardStackWrap}>
                      <div className={styles.cardBack} aria-hidden />
                      <div className={styles.cardBack2} aria-hidden />
                      <article className={styles.cardHorizontal}>
                        <span className={styles.cardProgress}>
                          {activeRowIndex + 1}/{rowCount}
                        </span>
                        <p className={styles.cardLabel}>
                          {activeRow ? plainTextFromRichValue(activeRow.label) : ''}
                        </p>
                      </article>
                    </div>
                    {cardNav}
                    <div className={styles.scaleBelowCard}>{horizontalScaleOptions}</div>
                  </div>
                </CarouselSlide>
              </div>
            ) : (
              <CarouselSlide
                slideKey={activeRow?.id ?? String(activeRowIndex)}
                direction={slideDirection}
                className={styles.respondentLayout}
              >
                <div className={styles.carouselColumn} style={cardColumnStyle}>
                  <div className={styles.cardStack} style={cardStackStyle}>
                    <div className={styles.cardBack} aria-hidden />
                    <div className={styles.cardBack2} aria-hidden />
                    <article className={styles.card}>
                      <span className={styles.cardProgress}>
                        {activeRowIndex + 1}/{rowCount}
                      </span>
                      <p className={styles.cardLabel}>
                        {activeRow ? plainTextFromRichValue(activeRow.label) : ''}
                      </p>
                    </article>
                  </div>
                  {cardNav}
                </div>

                <div className={styles.scaleColumn}>
                  <p className={styles.scaleAnchorTop}>
                    {plainTextFromRichValue(matrix.leftAnchor)}
                  </p>
                  {verticalScaleOptions}
                  <p className={styles.scaleAnchorBottom}>
                    {plainTextFromRichValue(matrix.rightAnchor)}
                  </p>
                </div>
              </CarouselSlide>
            )}
          </div>

          {questionBelow ? <SurveyPreviewFollowUpQuestion question={questionBelow} /> : null}

          <div className={styles.previewFooter}>
            <button type="button" className={styles.doneBtn} onClick={onDone}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
