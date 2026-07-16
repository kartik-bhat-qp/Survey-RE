'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { SurveyMatrix, SurveyMatrixColumn } from '@/data/mock-survey-detail';
import type {
  CardsCarouselResponseLayout,
  MultiPointAnswerType,
} from '@/data/mock-multi-point-settings';
import { plainTextFromRichValue } from '@/components/surveys/QuestionRichTextField';
import { isHtmlContent, toEditorHtml } from '@/components/surveys/rich-text-utils';
import { SurveyPreviewFollowUpQuestion } from '@/components/surveys/SurveyPreviewFollowUpQuestion';
import { SurveyPreviewRespondentFooter } from '@/components/surveys/SurveyPreviewRespondentFooter';
import { useSurveyPreviewDevice } from '@/components/surveys/SurveyPreviewDeviceContext';
import { useSurveyPreviewScroll } from '@/components/surveys/SurveyPreviewScrollContext';
import { useSurveyPreviewPagination } from '@/components/surveys/useSurveyPreviewPagination';
import type { SurveyQuestionPreviewFollowUp } from '@/data/survey-question-preview-session';
import styles from './MultiPointCardsCarouselPreview.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

export interface MultiPointCardsCarouselPreviewProps {
  surveyId: number;
  surveyTitle: string;
  questionText: string;
  required?: boolean;
  matrix: SurveyMatrix;
  questionWidthPercent: number;
  answerType: MultiPointAnswerType;
  responseLayout?: CardsCarouselResponseLayout;
  samePageFollowUps?: SurveyQuestionPreviewFollowUp[];
  nextPages?: SurveyQuestionPreviewFollowUp[][];
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

function CardRowLabel({ label }: { label: string }) {
  const plain = plainTextFromRichValue(label);
  if (!plain) return null;

  if (isHtmlContent(label)) {
    return (
      <div className={styles.cardLabelWrap}>
        <div
          className={styles.cardLabel}
          dangerouslySetInnerHTML={{ __html: toEditorHtml(label) }}
        />
      </div>
    );
  }

  return (
    <div className={styles.cardLabelWrap}>
      <p className={styles.cardLabel}>{plain}</p>
    </div>
  );
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
  variant?: 'inline' | 'below' | 'mobile';
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
  if (variant === 'mobile') {
    return (
      <div className={styles.cardNavRowMobile}>
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
          className={styles.cardNavBtnMobileNext}
          aria-label="Next Item"
          disabled={!canGoNext}
          onClick={onNext}
        >
          <span className="wm-chevron-right" aria-hidden />
        </button>
      </div>
    );
  }

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
        aria-label="Next Item"
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
  surveyId,
  surveyTitle,
  questionText,
  required = false,
  matrix,
  questionWidthPercent,
  answerType,
  responseLayout = 'vertical',
  samePageFollowUps = [],
  nextPages = [],
  onDone,
  onClose,
}: MultiPointCardsCarouselPreviewProps) {
  const device = useSurveyPreviewDevice();
  const isMobile = device === 'mobile';
  const { pageIndex, getFooterLabel, handleFooterAction, goToPrevPage } =
    useSurveyPreviewPagination(1 + nextPages.length);
  const [activeRowIndex, setActiveRowIndex] = useState(0);
  const [selectionsByRowId, setSelectionsByRowId] = useState<Record<string, string[]>>({});
  const [slideDirection, setSlideDirection] = useState<SlideDirection>('next');
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewScroll = useSurveyPreviewScroll();
  const rowCount = matrix.rows.length;
  const isFullWidth = questionWidthPercent >= 100;
  const isCheckbox = answerType === 'checkbox';

  function getRowSelections(rowId: string): string[] {
    return selectionsByRowId[rowId] ?? [];
  }

  function isColumnSelected(rowId: string, columnId: string): boolean {
    return getRowSelections(rowId).includes(columnId);
  }

  const cardColumnStyle: CSSProperties = isFullWidth
    ? { flex: '1 1 0', minWidth: 0, maxWidth: '100%' }
    : {
        flex: `0 0 ${questionWidthPercent}%`,
        width: `${questionWidthPercent}%`,
        maxWidth: `${questionWidthPercent}%`,
        minWidth: 0,
      };

  const cardStackStyle: CSSProperties = { width: '100%' };

  const horizontalCardBlockStyle: CSSProperties = isFullWidth
    ? { width: '100%', maxWidth: '100%' }
    : {
        width: `${questionWidthPercent}%`,
        maxWidth: `${questionWidthPercent}%`,
        minWidth: 0,
      };

  const activeRow = matrix.rows[activeRowIndex];
  const inputType = isCheckbox ? 'checkbox' : 'radio';
  const isHorizontal =
    responseLayout === 'horizontal' ||
    String(responseLayout).toLowerCase() === 'horizontal';
  const canGoPrev = activeRowIndex > 0;
  const canGoNext = rowCount > 1 && activeRowIndex < rowCount - 1;
  const activeRowHasSelection = activeRow ? getRowSelections(activeRow.id).length > 0 : false;
  const showNextCardAction = isCheckbox && activeRowHasSelection && canGoNext;

  const scrollMobilePreviewToTop = useCallback((): void => {
    if (!isMobile) return;
    previewScroll?.scrollToTop('smooth');
  }, [isMobile, previewScroll]);

  useEffect(() => {
    if (!isMobile || isCheckbox) return;
    scrollMobilePreviewToTop();
  }, [activeRowIndex, isCheckbox, isMobile, scrollMobilePreviewToTop]);

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
    if (isCheckbox) {
      scrollMobilePreviewToTop();
    }
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

    if (isCheckbox) {
      setSelectionsByRowId((prev) => {
        const current = prev[rowId] ?? [];
        const next = current.includes(columnId)
          ? current.filter((id) => id !== columnId)
          : [...current, columnId];
        return { ...prev, [rowId]: next };
      });
      return;
    }

    setSelectionsByRowId((prev) => ({ ...prev, [rowId]: [columnId] }));

    if (isMobile) {
      scrollMobilePreviewToTop();
    }

    if (activeRowIndex >= rowCount - 1) {
      return;
    }

    advanceTimeoutRef.current = setTimeout(() => {
      advanceTimeoutRef.current = null;
      setSlideDirection('next');
      setActiveRowIndex((index) => Math.min(index + 1, rowCount - 1));
      window.requestAnimationFrame(() => {
        previewScroll?.scrollToTop('auto');
      });
    }, ADVANCE_AFTER_SELECT_MS);
  }

  function renderNextCardButton(className?: string): ReactNode {
    if (!showNextCardAction) return null;

    return (
      <WuButton
        type="button"
        variant="secondary"
        size="sm"
        className={className ?? styles.nextCardBtn}
        onClick={goToNextCard}
      >
        Next Item
      </WuButton>
    );
  }

  function renderVerticalScaleOption(column: SurveyMatrixColumn, globalIndex: number) {
    if (!activeRow) return null;
    const isChecked = isColumnSelected(activeRow.id, column.id);

    return (
      <li key={column.id} className={styles.scaleOption}>
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

  function renderHorizontalScaleRow(rowColumns: SurveyMatrixColumn[], rowStartIndex: number) {
    if (!activeRow) return null;
    const gridStyle = { '--scale-cols': rowColumns.length } as CSSProperties;

    return (
      <div
        key={`scale-block-${rowStartIndex}`}
        className={styles.horizontalScaleBlock}
        style={gridStyle}
      >
        <ul className={`${styles.scaleHorizontalGridRow} ${styles.scaleAnchorRow}`}>
          {rowColumns.map((column, indexInRow) => {
            const globalIndex = rowStartIndex + indexInRow;
            const isFirstColumn = globalIndex === 0;
            const isLastColumn = globalIndex === matrix.columns.length - 1;
            return (
              <li key={`anchor-${column.id}`} className={styles.scaleGridCell}>
                {isFirstColumn ? (
                  <span className={styles.scaleEndLabel}>
                    {plainTextFromRichValue(matrix.leftAnchor)}
                  </span>
                ) : isLastColumn ? (
                  <span className={styles.scaleEndLabel}>
                    {plainTextFromRichValue(matrix.rightAnchor)}
                  </span>
                ) : (
                  <span className={styles.scaleEndLabelSpacer} aria-hidden />
                )}
              </li>
            );
          })}
        </ul>
        <ul className={`${styles.scaleHorizontalGridRow} ${styles.scaleRadioRow}`}>
          {rowColumns.map((column, indexInRow) => {
            const globalIndex = rowStartIndex + indexInRow;
            const isChecked = isColumnSelected(activeRow.id, column.id);
            return (
              <li key={`radio-${column.id}`} className={styles.scaleGridCell}>
                <label
                  className={`${styles.scaleRadioOnly} ${
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
                </label>
              </li>
            );
          })}
        </ul>
        <ul className={`${styles.scaleHorizontalGridRow} ${styles.scaleLabelRow}`}>
          {rowColumns.map((column, indexInRow) => {
            const globalIndex = rowStartIndex + indexInRow;
            const isChecked = isColumnSelected(activeRow.id, column.id);
            return (
              <li key={`label-${column.id}`} className={styles.scaleGridCell}>
                <span
                  className={`${styles.scaleColumnLabel} ${
                    isChecked ? styles.scaleColumnLabelSelected : ''
                  }`}
                >
                  {columnDisplayLabel(column.label, globalIndex)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  const verticalScaleOptions = activeRow && !isHorizontal ? (
    <ul className={styles.scaleOptions} aria-label="Rating scale">
      {matrix.columns.map((column, index) => renderVerticalScaleOption(column, index))}
    </ul>
  ) : null;

  const horizontalScaleOptions = activeRow && isHorizontal ? (
    <div className={styles.scaleRowsWrap} aria-label="Rating scale">
      {chunkColumns(matrix.columns, HORIZONTAL_SCALE_POINTS_PER_ROW).map((rowColumns, rowIndex) =>
        renderHorizontalScaleRow(rowColumns, rowIndex * HORIZONTAL_SCALE_POINTS_PER_ROW)
      )}
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
      variant={isMobile ? 'mobile' : 'below'}
    />
  );

  const mobileLeftAnchor = plainTextFromRichValue(matrix.leftAnchor).trim();
  const mobileRightAnchor = plainTextFromRichValue(matrix.rightAnchor).trim();

  const mobileScaleBlock = activeRow ? (
    <div className={styles.mobileScaleBlock}>
      {mobileLeftAnchor ? (
        <p className={styles.mobileScaleAnchorTop}>{mobileLeftAnchor}</p>
      ) : null}
      <ul className={styles.mobileScaleOptions} aria-label="Rating scale">
        {matrix.columns.map((column, index) => {
          const isChecked = isColumnSelected(activeRow.id, column.id);
          return (
            <li key={column.id} className={styles.mobileScaleOption}>
              <label
                className={`${styles.mobileScaleLabel} ${
                  isChecked ? styles.mobileScaleLabelSelected : ''
                }`}
              >
                <input
                  type={inputType}
                  name={`preview-mobile-${activeRow.id}`}
                  checked={isChecked}
                  aria-label={columnDisplayLabel(column.label, index)}
                  onChange={() => handleOptionSelect(activeRow.id, column.id)}
                />
                <span>{columnDisplayLabel(column.label, index)}</span>
              </label>
            </li>
          );
        })}
      </ul>
      {mobileRightAnchor ? (
        <p className={styles.mobileScaleAnchorBottom}>{mobileRightAnchor}</p>
      ) : null}
      {renderNextCardButton(styles.mobileNextCardBtn)}
    </div>
  ) : null;

  function handleMobileBack(): void {
    if (pageIndex > 0) {
      goToPrevPage();
      return;
    }
    if (activeRowIndex > 0) {
      goToPrevCard();
    }
  }

  const canMobileBack = pageIndex > 0 || activeRowIndex > 0;

  const currentPageQuestions = pageIndex > 0 ? (nextPages[pageIndex - 1] ?? []) : [];
  const currentPagePrimary = currentPageQuestions[0] ?? null;
  const currentPageFollowUps = currentPageQuestions.slice(1);

  return (
    <div className={`${styles.shell} ${isMobile ? styles.shellMobile : ''}`}>
      {isMobile ? (
        <div className={styles.mobileStripeBar} aria-hidden />
      ) : (
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
      )}

      <div className={`${styles.previewCanvas} ${isMobile ? styles.previewCanvasMobile : ''}`}>
        <div
          className={`${styles.questionContainer} ${
            isMobile ? styles.questionContainerMobile : ''
          }`}
        >
          {!isMobile ? (
            <p className={styles.requiredNote}>Questions marked with a * are required</p>
          ) : null}

          {pageIndex === 0 ? (
            <>
              {!isMobile ? (
                <h2 className={styles.questionTitle}>
                  {required ? <span className={styles.requiredMark}>*</span> : null}
                  <span>{plainTextFromRichValue(questionText)}</span>
                </h2>
              ) : null}

              <div className={styles.questionContent}>
                {isMobile ? (
                  <CarouselSlide
                    slideKey={activeRow?.id ?? String(activeRowIndex)}
                    direction={slideDirection}
                    className={styles.mobileSlideWrap}
                  >
                    <div className={styles.mobileCarouselUnit}>
                      <article className={styles.mobileCard}>
                        {activeRow?.imageSrc ? (
                          <img
                            src={activeRow.imageSrc}
                            alt={plainTextFromRichValue(activeRow.label)}
                            className={styles.mobileCardImage}
                          />
                        ) : (
                          <div className={styles.mobileCardFallback}>
                            {activeRow ? <CardRowLabel label={activeRow.label} /> : null}
                          </div>
                        )}
                      </article>
                      {cardNav}
                      {mobileScaleBlock}
                    </div>
                  </CarouselSlide>
                ) : isHorizontal ? (
              <div className={styles.respondentLayoutHorizontal}>
                <CarouselSlide
                  slideKey={activeRow?.id ?? String(activeRowIndex)}
                  direction={slideDirection}
                  className={styles.horizontalSlideWrap}
                >
                  <div className={styles.horizontalCarouselUnit}>
                    <div className={styles.horizontalCardBlock} style={horizontalCardBlockStyle}>
                      <div className={styles.cardStackWrap}>
                        <div className={styles.cardBack} aria-hidden />
                        <div className={styles.cardBack2} aria-hidden />
                        <article className={styles.cardHorizontal}>
                          <span className={styles.cardProgress}>
                            {activeRowIndex + 1}/{rowCount}
                          </span>
                          {activeRow ? <CardRowLabel label={activeRow.label} /> : null}
                        </article>
                      </div>
                      {cardNav}
                    </div>
                    <div className={styles.scaleBelowCard}>
                      {horizontalScaleOptions}
                      {renderNextCardButton()}
                    </div>
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
                      {activeRow ? <CardRowLabel label={activeRow.label} /> : null}
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
                  {renderNextCardButton()}
                </div>
              </CarouselSlide>
            )}
          </div>

          {samePageFollowUps.map((question) => (
            <SurveyPreviewFollowUpQuestion
              key={question.code}
              question={question}
              surveyId={surveyId}
            />
          ))}
            </>
          ) : currentPagePrimary ? (
            <>
              <SurveyPreviewFollowUpQuestion
                question={currentPagePrimary}
                surveyId={surveyId}
                showDivider={false}
              />
              {currentPageFollowUps.map((question) => (
                <SurveyPreviewFollowUpQuestion
                  key={question.code}
                  question={question}
                  surveyId={surveyId}
                />
              ))}
            </>
          ) : null}

          <div
            className={`${styles.previewFooter} ${isMobile ? styles.previewFooterMobile : ''}`}
          >
            {isMobile ? (
              <>
                <button
                  type="button"
                  className={styles.mobileBackBtn}
                  aria-label="Back"
                  disabled={!canMobileBack}
                  onClick={handleMobileBack}
                >
                  <span className="wm-chevron-left" aria-hidden />
                </button>
                <button
                  type="button"
                  className={styles.mobileNextBtn}
                  onClick={() => handleFooterAction(onDone)}
                >
                  {getFooterLabel(false)}
                </button>
              </>
            ) : (
              <button
                type="button"
                className={styles.doneBtn}
                onClick={() => handleFooterAction(onDone)}
              >
                {getFooterLabel(false)}
              </button>
            )}
          </div>
        </div>
      </div>

      <SurveyPreviewRespondentFooter surveyId={surveyId} />
    </div>
  );
}
