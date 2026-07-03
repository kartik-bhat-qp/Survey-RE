'use client';

import dynamic from 'next/dynamic';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type SyntheticEvent } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type {
  SurveyDetail,
  SurveyMatrix,
  SurveyQuestion,
  SurveyQuestionOption,
  SurveySection,
} from '@/data/mock-survey-detail';
import {
  createDefaultLookupTableData,
  createDefaultLookupTableOptions,
  createDefaultMultiPointMatrix,
  createDefaultMatrixMultiSelectMatrix,
  createDefaultMatrixSpreadsheetMatrix,
  createDefaultStarRatingMatrix,
  createDefaultSmileyRatingData,
  createDefaultThumbsUpDownData,
  createDefaultTextSliderMatrix,
  createDefaultNumericSliderMatrix,
  createDefaultImageChooserSelectOneOptions,
  createDefaultImageChooserSelectManyOptions,
  createDefaultImageChooserRatingMatrix,
  createDefaultRankOrderOptions,
  createDefaultConstantSumOptions,
  createDefaultDragDropMatrix,
  DEFAULT_STAR_RATING_QUESTION_TEXT,
  DEFAULT_SMILEY_RATING_QUESTION_TEXT,
  DEFAULT_THUMBS_QUESTION_TEXT,
  DEFAULT_TEXT_SLIDER_QUESTION_TEXT,
  DEFAULT_NUMERIC_SLIDER_QUESTION_TEXT,
  DEFAULT_IMAGE_CHOOSER_SELECT_ONE_QUESTION_TEXT,
  DEFAULT_IMAGE_CHOOSER_SELECT_MANY_QUESTION_TEXT,
  DEFAULT_IMAGE_CHOOSER_RATING_QUESTION_TEXT,
  DEFAULT_RANK_ORDER_QUESTION_TEXT,
  DEFAULT_CONSTANT_SUM_QUESTION_TEXT,
  DEFAULT_DRAG_DROP_QUESTION_TEXT,
  createDefaultVanWestendorpData,
  DEFAULT_LOOKUP_TABLE_QUESTION_TEXT,
  DEFAULT_DROPDOWN_QUESTION_TEXT,
  DEFAULT_COMMENT_BOX_QUESTION_TEXT,
  DEFAULT_SINGLE_ROW_QUESTION_TEXT,
  DEFAULT_CONTACT_INFORMATION_QUESTION_TEXT,
  createDefaultDropdownOptions,
  createDefaultContactInformationOptions,
  SELECT_ONE_MAX_BULK_OPTIONS,
  DEFAULT_MULTI_POINT_QUESTION_TEXT,
  DEFAULT_MATRIX_MULTI_SELECT_QUESTION_TEXT,
  DEFAULT_MATRIX_SPREADSHEET_QUESTION_TEXT,
  DEFAULT_NPS_MAX_LABEL,
  DEFAULT_NPS_MIN_LABEL,
  DEFAULT_VAN_WESTENDORP_QUESTION_TEXT,
  DEFAULT_CAPTCHA_QUESTION_TEXT,
} from '@/data/mock-survey-detail';
import { getQuestionTypePreview } from '@/data/mock-add-question-previews';
import { LookupTableBulkConversionModal } from '@/components/surveys/LookupTableBulkConversionModal';
import { LookupTableQuestionRow } from '@/components/surveys/LookupTableQuestionRow';
import { DropdownQuestionRow } from '@/components/surveys/DropdownQuestionRow';
import { CommentBoxQuestionRow } from '@/components/surveys/CommentBoxQuestionRow';
import { CaptchaQuestionRow } from '@/components/surveys/CaptchaQuestionRow';
import { SingleRowTextQuestionRow } from '@/components/surveys/SingleRowTextQuestionRow';
import { EmailAddressQuestionRow } from '@/components/surveys/EmailAddressQuestionRow';
import { ContactInformationQuestionRow } from '@/components/surveys/ContactInformationQuestionRow';
import { StarRatingQuestionRow } from '@/components/surveys/StarRatingQuestionRow';
import { SmileyRatingQuestionRow } from '@/components/surveys/SmileyRatingQuestionRow';
import { ThumbsUpDownQuestionRow } from '@/components/surveys/ThumbsUpDownQuestionRow';
import { TextSliderQuestionRow } from '@/components/surveys/TextSliderQuestionRow';
import { NumericSliderQuestionRow } from '@/components/surveys/NumericSliderQuestionRow';
import { ImageChooserSelectOneQuestionRow } from '@/components/surveys/ImageChooserSelectOneQuestionRow';
import { ImageChooserSelectManyQuestionRow } from '@/components/surveys/ImageChooserSelectManyQuestionRow';
import { ImageChooserRatingQuestionRow } from '@/components/surveys/ImageChooserRatingQuestionRow';
import { RankOrderQuestionRow } from '@/components/surveys/RankOrderQuestionRow';
import { ConstantSumQuestionRow } from '@/components/surveys/ConstantSumQuestionRow';
import { DragDropQuestionRow } from '@/components/surveys/DragDropQuestionRow';
import {
  StaticContentQuestionRow,
  isStaticContentQuestionKind,
  resolveStaticContentVariant,
} from '@/components/surveys/StaticContentQuestionRow';
import { NpsQuestionRow } from '@/components/surveys/NpsQuestionRow';
import { SurveyAgentSidebar } from '@/components/surveys/SurveyAgentSidebar';
import { VanWestendorpQuestionRow } from '@/components/surveys/VanWestendorpQuestionRow';
import { AddQuestionMenu } from '@/components/surveys/AddQuestionMenu';
import { BulkEditLinesModal } from '@/components/surveys/BulkEditLinesModal';
import { BulkEditOptionsModal } from '@/components/surveys/BulkEditOptionsModal';
import { MultiPointScalesQuestionRow } from '@/components/surveys/MultiPointScalesQuestionRow';
import { MatrixMultiSelectQuestionRow } from '@/components/surveys/MatrixMultiSelectQuestionRow';
import { MatrixSpreadsheetQuestionRow } from '@/components/surveys/MatrixSpreadsheetQuestionRow';
import type { QuestionMenuAction } from '@/components/surveys/QuestionOptionsMenu';
import { QuestionWorkspaceActions } from '@/components/surveys/QuestionWorkspaceActions';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { CaptchaQuestionSettingsPanel } from '@/components/surveys/CaptchaQuestionSettingsPanel';
import { MultiPointScalesSettingsPanel } from '@/components/surveys/MultiPointScalesSettingsPanel';
import { QuestionLogicModal } from '@/components/surveys/QuestionLogicModal';
import { QuestionSettingsPanel } from '@/components/surveys/QuestionSettingsPanel';
import { QuestionValidationModal } from '@/components/surveys/QuestionValidationModal';
import {
  QuestionRichTextField,
  plainTextFromRichValue,
} from '@/components/surveys/QuestionRichTextField';
import {
  getAndAdvanceAlternateFlipState,
  getDefaultSettingsForQuestion,
  normalizeAnswerDisplayOrder,
  normalizeRandomizeAnswerCount,
  type QuestionSettings,
} from '@/data/mock-question-settings';
import {
  DEFAULT_CAPTCHA_SETTINGS,
  type CaptchaSettings,
} from '@/data/mock-captcha-settings';
import {
  DEFAULT_MULTI_POINT_SETTINGS,
  DEFAULT_NEW_MULTI_POINT_QUESTION_SETTINGS,
  isCardsCarouselPreview,
  type MultiPointScalesSettings,
} from '@/data/mock-multi-point-settings';
import { collectPreviewPagesAfterQuestion, hasPageBreakAtSlot, getPageBreakSlotKey } from '@/data/survey-page-breaks';
import {
  isFirstSurveyQuestion,
  isSelectManyPreviewQuestion,
  toQuestionPreviewFollowUp,
} from '@/data/survey-question-preview-utils';
import {
  writeCaptchaQuestionPreviewSession,
  writeMultiPointQuestionPreviewSession,
  writeSelectManyQuestionPreviewSession,
  writeSelectOneQuestionPreviewSession,
} from '@/data/survey-question-preview-session';
import { toShowHideOptionsPreviewConfig } from '@/data/show-hide-options-preview';
import { QuotaControlOptionTag } from '@/components/surveys/QuotaControlOptionTag';
import { DynamicTextCommentsOptionIcon } from '@/components/surveys/DynamicTextCommentsOptionIcon';
import { ExtractedQuestionBanner } from '@/components/surveys/ExtractedQuestionBanner';
import { ExtractionOptionTag } from '@/components/surveys/ExtractionOptionTag';
import {
  getExtractionOptionLabels,
  isExtractionLogicApplied,
  removeExtractedQuestionFromSection,
  upsertExtractedQuestionInSection,
} from '@/data/mock-question-extraction';
import type { SurveyQuestionExtractionSource } from '@/data/mock-survey-detail';
import {
  clearLookupTableUnsupportedLogic,
  collectLookupTableConversionLogicConflicts,
  createDefaultQuestionLogicState,
  getDynamicTextEnabledByOptionId,
  getQuotaControlOptionLabels,
  isDynamicTextCommentsConfigured,
  isQuotaControlConfigured,
  isShowHideOptionsLogicApplied,
  type LookupTableConversionLogicConflict,
  type QuestionLogicState,
} from '@/data/mock-question-logic';
import {
  createDefaultQuestionValidation,
  type QuestionValidationState,
} from '@/data/mock-question-validation';
import { QuestionWorkspaceFooter } from '@/components/surveys/QuestionWorkspaceFooter';
import {
  useSurveyWorkspaceSections,
  type SurveyQuestionTarget,
} from '@/components/surveys/SurveyWorkspaceSectionsContext';
import { getSurveyEditorSectionsStorageKey } from '@/data/survey-editor-persistence';
import { usePersistedState } from '@/hooks/usePersistedState';
import styles from './SurveyEditorCanvas.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

interface SurveyEditorCanvasProps {
  detail: SurveyDetail;
}

function cloneMatrix(matrix: SurveyMatrix): SurveyMatrix {
  return {
    leftAnchor: matrix.leftAnchor,
    rightAnchor: matrix.rightAnchor,
    columns: matrix.columns.map((column) => ({ ...column })),
    rows: matrix.rows.map((row) => ({ ...row })),
  };
}

function cloneSections(sections: SurveySection[]): SurveySection[] {
  return sections.map((sec) => ({
    ...sec,
    questions: sec.questions.map((q) => ({
      ...q,
      options: q.options.map((o) => ({ ...o })),
      ...(q.matrix ? { matrix: cloneMatrix(q.matrix) } : {}),
      ...(q.nps ? { nps: { ...q.nps } } : {}),
      ...(q.vanWestendorp
        ? {
            vanWestendorp: {
              priceLabel: q.vanWestendorp.priceLabel,
              rows: q.vanWestendorp.rows.map((row) => ({ ...row })),
            },
          }
        : {}),
      ...(q.lookupTable ? { lookupTable: { ...q.lookupTable } } : {}),
      ...(q.extractionSource ? { extractionSource: { ...q.extractionSource } } : {}),
    })),
  }));
}

function isMultiPointScalesQuestion(question: SurveyQuestion): boolean {
  return question.kind === 'multi-point-scales' && Boolean(question.matrix);
}

function isMatrixMultiSelectQuestion(question: SurveyQuestion): boolean {
  return question.kind === 'matrix-multi-select' || question.addQuestionTypeId === 'multi-select-matrix';
}

function isMatrixSpreadsheetQuestion(question: SurveyQuestion): boolean {
  return question.kind === 'matrix-spreadsheet' || question.addQuestionTypeId === 'spreadsheet';
}

function isStarRatingQuestion(question: SurveyQuestion): boolean {
  return question.kind === 'star-rating' || question.addQuestionTypeId === 'star-rating';
}

function isSmileyRatingQuestion(question: SurveyQuestion): boolean {
  return question.kind === 'smiley-rating' || question.addQuestionTypeId === 'smiley-rating';
}

function isThumbsUpDownQuestion(question: SurveyQuestion): boolean {
  return question.kind === 'thumbs-up-down' || question.addQuestionTypeId === 'thumbs';
}

function isTextSliderQuestion(question: SurveyQuestion): boolean {
  return question.kind === 'text-slider' || question.addQuestionTypeId === 'text-slider';
}

function isNumericSliderQuestion(question: SurveyQuestion): boolean {
  return question.kind === 'numeric-slider' || question.addQuestionTypeId === 'numeric-slider';
}

function isImageChooserSelectOneQuestion(question: SurveyQuestion): boolean {
  return (
    question.kind === 'image-chooser-select-one' ||
    question.addQuestionTypeId === 'image-select-one'
  );
}

function isImageChooserSelectManyQuestion(question: SurveyQuestion): boolean {
  return (
    question.kind === 'image-chooser-select-many' ||
    question.addQuestionTypeId === 'image-select-many'
  );
}

function isImageChooserRatingQuestion(question: SurveyQuestion): boolean {
  return (
    question.kind === 'image-chooser-rating' || question.addQuestionTypeId === 'image-rating'
  );
}

function isRankOrderQuestion(question: SurveyQuestion): boolean {
  return question.kind === 'rank-order' || question.addQuestionTypeId === 'rank-order';
}

function isConstantSumQuestion(question: SurveyQuestion): boolean {
  return question.kind === 'constant-sum' || question.addQuestionTypeId === 'constant-sum';
}

function isDragDropQuestion(question: SurveyQuestion): boolean {
  return question.kind === 'drag-drop' || question.addQuestionTypeId === 'drag-drop';
}

function isStaticContentQuestion(question: SurveyQuestion): boolean {
  return isStaticContentQuestionKind(question.kind, question.addQuestionTypeId);
}

function isNpsQuestion(question: SurveyQuestion): boolean {
  return question.kind === 'nps';
}

function isVanWestendorpQuestion(question: SurveyQuestion): boolean {
  return question.kind === 'van-westendorp';
}

function isLookupTableQuestion(question: SurveyQuestion): boolean {
  return question.kind === 'lookup-table' || question.addQuestionTypeId === 'lookup-table';
}

function isDropdownQuestion(question: SurveyQuestion): boolean {
  return question.addQuestionTypeId === 'dropdown';
}

function isCommentBoxQuestion(question: SurveyQuestion): boolean {
  return question.addQuestionTypeId === 'comment-box';
}

function isCaptchaQuestion(question: SurveyQuestion): boolean {
  return question.addQuestionTypeId === 'captcha';
}

function isSingleRowTextQuestion(question: SurveyQuestion): boolean {
  return question.addQuestionTypeId === 'single-row';
}

function isEmailAddressQuestion(question: SurveyQuestion): boolean {
  return question.addQuestionTypeId === 'email';
}

function isContactInformationQuestion(question: SurveyQuestion): boolean {
  return question.addQuestionTypeId === 'contact';
}

function isSelectOneQuestion(question: SurveyQuestion): boolean {
  return (
    !isLookupTableQuestion(question) &&
    !isDropdownQuestion(question) &&
    !isCommentBoxQuestion(question) &&
    !isCaptchaQuestion(question) &&
    !isSingleRowTextQuestion(question) &&
    !isEmailAddressQuestion(question) &&
    !isContactInformationQuestion(question) &&
    !isStarRatingQuestion(question) &&
    !isSmileyRatingQuestion(question) &&
    !isThumbsUpDownQuestion(question) &&
    !isTextSliderQuestion(question) &&
    !isNumericSliderQuestion(question) &&
    !isImageChooserSelectOneQuestion(question) &&
    !isImageChooserSelectManyQuestion(question) &&
    !isImageChooserRatingQuestion(question) &&
    !isRankOrderQuestion(question) &&
    !isConstantSumQuestion(question) &&
    !isDragDropQuestion(question) &&
    !isStaticContentQuestion(question) &&
    (question.addQuestionTypeId === 'select-one' ||
      (question.inputKind === 'radio' &&
        !isMultiPointScalesQuestion(question) &&
    !isMatrixMultiSelectQuestion(question) &&
    !isMatrixSpreadsheetQuestion(question) &&
        !isNpsQuestion(question) &&
        !isVanWestendorpQuestion(question)))
  );
}

function isSelectOnePreviewQuestion(
  question: SurveyQuestion,
  settings?: Pick<QuestionSettings, 'answerType'>
): boolean {
  return (
    !isSelectManyPreviewQuestion(question, settings) &&
    !isMultiPointScalesQuestion(question) &&
    !isMatrixMultiSelectQuestion(question) &&
    !isMatrixSpreadsheetQuestion(question) &&
    !isNpsQuestion(question) &&
    !isVanWestendorpQuestion(question) &&
    !isLookupTableQuestion(question) &&
    !isDropdownQuestion(question) &&
    !isCommentBoxQuestion(question) &&
    !isCaptchaQuestion(question) &&
    !isSingleRowTextQuestion(question) &&
    !isEmailAddressQuestion(question) &&
    !isContactInformationQuestion(question) &&
    !isStarRatingQuestion(question) &&
    !isSmileyRatingQuestion(question) &&
    !isThumbsUpDownQuestion(question) &&
    !isTextSliderQuestion(question) &&
    !isNumericSliderQuestion(question) &&
    !isImageChooserSelectOneQuestion(question) &&
    !isImageChooserSelectManyQuestion(question) &&
    !isImageChooserRatingQuestion(question) &&
    !isRankOrderQuestion(question) &&
    !isConstantSumQuestion(question) &&
    !isDragDropQuestion(question) &&
    !isStaticContentQuestion(question) &&
    question.options.length > 0
  );
}

function cloneQuestionForCopy(question: SurveyQuestion): SurveyQuestion {
  const ts = Date.now();
  return {
    ...question,
    id: `q-copy-${ts}`,
    options: question.options.map((option, index) => ({
      ...option,
      id: `opt-${ts}-${index}`,
    })),
    ...(question.matrix ? { matrix: cloneMatrix(question.matrix) } : {}),
    ...(question.nps ? { nps: { ...question.nps } } : {}),
    ...(question.vanWestendorp
      ? {
          vanWestendorp: {
            priceLabel: question.vanWestendorp.priceLabel,
            rows: question.vanWestendorp.rows.map((row) => ({ ...row })),
          },
        }
      : {}),
    ...(question.lookupTable ? { lookupTable: { ...question.lookupTable } } : {}),
    ...(question.smileyRating
      ? {
          smileyRating: {
            options: question.smileyRating.options.map((option, index) => ({
              ...option,
              id: `smiley-opt-${ts}-${index + 1}`,
            })),
          },
        }
      : {}),
    ...(question.thumbsUpDown
      ? {
          thumbsUpDown: {
            choices: question.thumbsUpDown.choices.map((choice, index) => ({
              ...choice,
              id: `thumbs-choice-${ts}-${index + 1}`,
            })),
          },
        }
      : {}),
    ...(question.extractionSource ? { extractionSource: { ...question.extractionSource } } : {}),
  };
}

function insertQuestionAtIndex(
  questions: SurveyQuestion[],
  insertIndex: number,
  newQuestion: SurveyQuestion
): SurveyQuestion[] {
  const next = [...questions];
  const index = Math.max(0, Math.min(insertIndex, next.length));
  next.splice(index, 0, newQuestion);
  return next;
}

function replaceFirstQuestionInList(
  questions: SurveyQuestion[],
  replacement: SurveyQuestion
): SurveyQuestion[] {
  if (questions.length === 0) {
    return [{ ...replacement, code: 'Q1', number: 1 }];
  }
  const first = questions[0];
  return [
    {
      ...replacement,
      id: first.id,
      code: 'Q1',
      number: 1,
    },
    ...questions.slice(1),
  ];
}

function applyFirstQuestionUpdate(
  sections: SurveySection[],
  newQuestion: SurveyQuestion
): SurveySection[] {
  return sections.map((section, sectionIndex) => {
    if (sectionIndex !== 0) return section;
    return {
      ...section,
      questions: replaceFirstQuestionInList(section.questions, newQuestion),
    };
  });
}

function nextQuestionNumber(questions: SurveyQuestion[]): number {
  return questions.reduce((max, question) => Math.max(max, question.number), 0) + 1;
}

function isOtherOptionLabel(label: string): boolean {
  return /^other$/i.test(label.trim());
}

function isNotApplicableOptionLabel(label: string): boolean {
  return /^(na|n\/a|not applicable)$/i.test(label.trim());
}

function questionHasOtherOption(question: SurveyQuestion): boolean {
  return question.options.some((option) => isOtherOptionLabel(option.label));
}

function questionHasNotApplicableOption(question: SurveyQuestion): boolean {
  return question.options.some((option) => isNotApplicableOptionLabel(option.label));
}

function countBulkEditOptions(
  labels: string[],
  otherOption: boolean,
  notApplicableOption: boolean
): number {
  let count = labels.length;
  if (otherOption && !labels.some(isOtherOptionLabel)) count += 1;
  if (notApplicableOption && !labels.some(isNotApplicableOptionLabel)) count += 1;
  return count;
}

function applyBulkEditToQuestion(
  question: SurveyQuestion,
  payload: {
    optionLabels: string[];
    otherOption: boolean;
    notApplicableOption: boolean;
  },
  convertToLookupTable: boolean
): SurveyQuestion {
  const options = applyBulkOptionLabels(
    question.options,
    payload.optionLabels,
    payload.otherOption,
    payload.notApplicableOption
  );

  if (!convertToLookupTable) {
    return { ...question, options };
  }

  const firstOptionLabel = plainTextFromRichValue(options[0]?.label ?? '');

  return {
    ...question,
    kind: 'lookup-table',
    addQuestionTypeId: 'lookup-table',
    options,
    lookupTable: { selectedValue: firstOptionLabel },
  };
}

function applyBulkOptionLabels(
  existing: SurveyQuestionOption[],
  labels: string[],
  otherOption: boolean,
  notApplicableOption: boolean
): SurveyQuestionOption[] {
  const lines = [...labels];
  if (otherOption && !lines.some(isOtherOptionLabel)) {
    lines.push('Other');
  }
  if (notApplicableOption && !lines.some(isNotApplicableOptionLabel)) {
    lines.push('NA');
  }

  return lines.map((label, index) => {
    const previous = existing[index];
    return previous
      ? { ...previous, label }
      : { id: `opt-${Date.now()}-${index}`, label };
  });
}

function stopQuestionEvent(event: SyntheticEvent): void {
  event.stopPropagation();
}

function QuestionCodeField({
  sectionId,
  question,
  onCodeChange,
}: {
  sectionId: string;
  question: SurveyQuestion;
  onCodeChange: (sectionId: string, questionId: string, code: string) => void;
}) {
  return (
    <div className={styles.questionCodeGutter}>
      <input
        type="text"
        className={styles.questionCodeInput}
        value={question.code}
        aria-label="Question code"
        onChange={(event) => onCodeChange(sectionId, question.id, event.target.value)}
        onBlur={() => {
          if (!question.code.trim()) {
            onCodeChange(sectionId, question.id, `Q${question.number}`);
          }
        }}
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  );
}

function AddQuestionToolbar({
  sectionId,
  insertIndex,
  hasPageBreak,
  onSelect,
  onPageControl,
  onTogglePageBreak,
}: {
  sectionId: string;
  /** Position in the section's question list where the new question is inserted. */
  insertIndex: number;
  hasPageBreak: boolean;
  onSelect: (
    sectionId: string,
    insertIndex: number,
    category: string,
    typeLabel: string,
    typeId: string
  ) => void;
  onPageControl: (action: string) => void;
  onTogglePageBreak: () => void;
}) {
  return (
    <div className={styles.addQuestionToolbar}>
      <div className={styles.addQuestionToolbarCenter}>
        <AddQuestionMenu
          onSelect={(category, typeLabel, typeId) =>
            onSelect(sectionId, insertIndex, category, typeLabel, typeId)
          }
        />
      </div>
      <div className={styles.addQuestionToolbarRight}>
        <button
          type="button"
          className={styles.pageBreakBtn}
          onClick={onTogglePageBreak}
        >
          {hasPageBreak ? 'Remove Page Break' : 'Add Page Break'}
        </button>
        <button
          type="button"
          className={styles.pageBreakBtn}
          onClick={() => onPageControl('Remove Separator')}
        >
          Remove Separator
        </button>
        <button
          type="button"
          className={styles.pageBreakBtn}
          onClick={() => onPageControl('Split Block')}
        >
          Split Block
        </button>
      </div>
    </div>
  );
}

function QuestionRow({
  question,
  sectionId,
  showHideOptionsApplied,
  dynamicTextCommentsApplied,
  dynamicTextEnabledByOptionId,
  extractionApplied,
  quotaControlApplied,
  quotaOptionLabels,
  extractionOptionLabels,
  extractionSource,
  onModifyExtraction,
  onExtractionSourceClick,
  onAction,
  onOpenLogic,
  onOpenSettings,
  onOpenValidation,
  onMenuAction,
  onQuestionTextChange,
  onOptionLabelChange,
}: {
  question: SurveyQuestion;
  sectionId: string;
  showHideOptionsApplied: boolean;
  dynamicTextCommentsApplied: boolean;
  dynamicTextEnabledByOptionId: Record<string, boolean>;
  extractionApplied: boolean;
  quotaControlApplied: boolean;
  quotaOptionLabels: Record<string, string>;
  extractionOptionLabels: Record<string, string>;
  extractionSource?: SurveyQuestionExtractionSource;
  onModifyExtraction?: () => void;
  onExtractionSourceClick?: () => void;
  onAction: (label: string) => void;
  onMenuAction: (action: QuestionMenuAction) => void;
  onOpenLogic: () => void;
  onOpenSettings: () => void;
  onOpenValidation: () => void;
  onQuestionTextChange: (sectionId: string, questionId: string, text: string) => void;
  onOptionLabelChange: (
    sectionId: string,
    questionId: string,
    optionId: string,
    label: string
  ) => void;
}) {
  return (
    <article className={styles.questionRow}>
      <div className={styles.questionRowMain}>
        <div className={styles.questionBody}>
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
          {extractionSource && onModifyExtraction && onExtractionSourceClick ? (
            <ExtractedQuestionBanner
              extractionSource={extractionSource}
              onModifyExtraction={onModifyExtraction}
              onSourceClick={onExtractionSourceClick}
            />
          ) : null}
          <ul className={styles.options}>
            {question.options.map((option) => {
              const quotaLabel = quotaOptionLabels[option.id];
              const extractionLabel = extractionOptionLabels[option.id];
              return (
              <li
                key={option.id}
                className={styles.optionItem}
              >
                <input
                  type="radio"
                  className={styles.optionRadio}
                  name={question.id}
                  disabled
                  aria-label={`${plainTextFromRichValue(option.label)} radio`}
                />
                <div className={styles.optionMain}>
                  <QuestionRichTextField
                    variant="option"
                    value={option.label}
                    onChange={(label) =>
                      onOptionLabelChange(sectionId, question.id, option.id, label)
                    }
                    ariaLabel="Answer option"
                    placeholder="Option"
                    onPointerDown={stopQuestionEvent}
                  />
                  {dynamicTextEnabledByOptionId[option.id] ? (
                    <DynamicTextCommentsOptionIcon />
                  ) : null}
                  {extractionLabel ? (
                    <ExtractionOptionTag label={extractionLabel} />
                  ) : null}
                  {quotaLabel ? <QuotaControlOptionTag label={quotaLabel} /> : null}
                </div>
                {!quotaLabel && !extractionLabel && option.logicLabel ? (
                  <span className={styles.logicTag}>
                    <span className="wm-call-split" aria-hidden />
                    {option.logicLabel}
                  </span>
                ) : null}
              </li>
            );
            })}
          </ul>
        </div>
        <QuestionWorkspaceActions
          question={question}
          onAction={onAction}
          onOpenLogic={onOpenLogic}
          onOpenSettings={onOpenSettings}
          onOpenValidation={onOpenValidation}
          onMenuAction={onMenuAction}
          className={styles.questionActions}
          menuBtnClassName={styles.menuBtn}
        />
      </div>
      <QuestionWorkspaceFooter
        showHideOptionsApplied={showHideOptionsApplied}
        dynamicTextCommentsApplied={dynamicTextCommentsApplied}
        extractionApplied={extractionApplied}
        quotaControlApplied={quotaControlApplied}
        className={styles.questionRowFooter}
      />
    </article>
  );
}

function SelectOneQuestionRow({
  question,
  sectionId,
  showHideOptionsApplied,
  dynamicTextCommentsApplied,
  dynamicTextEnabledByOptionId,
  extractionApplied,
  quotaControlApplied,
  quotaOptionLabels,
  extractionOptionLabels,
  extractionSource,
  onModifyExtraction,
  onExtractionSourceClick,
  onAction,
  onOpenLogic,
  onOpenSettings,
  onOpenValidation,
  onMenuAction,
  onAddOption,
  onBulkEdit,
  onQuestionTextChange,
  onOptionLabelChange,
}: {
  question: SurveyQuestion;
  sectionId: string;
  showHideOptionsApplied: boolean;
  dynamicTextCommentsApplied: boolean;
  dynamicTextEnabledByOptionId: Record<string, boolean>;
  extractionApplied: boolean;
  quotaControlApplied: boolean;
  quotaOptionLabels: Record<string, string>;
  extractionOptionLabels: Record<string, string>;
  extractionSource?: SurveyQuestionExtractionSource;
  onModifyExtraction?: () => void;
  onExtractionSourceClick?: () => void;
  onAction: (label: string) => void;
  onMenuAction: (action: QuestionMenuAction) => void;
  onOpenLogic: () => void;
  onOpenSettings: () => void;
  onOpenValidation: () => void;
  onAddOption: (sectionId: string, questionId: string) => void;
  onBulkEdit: (sectionId: string, questionId: string) => void;
  onQuestionTextChange: (sectionId: string, questionId: string, text: string) => void;
  onOptionLabelChange: (
    sectionId: string,
    questionId: string,
    optionId: string,
    label: string
  ) => void;
}) {
  return (
    <article className={styles.selectManyBlock}>
      <div className={styles.selectManyCard}>
        <div className={styles.selectManyCardInner}>
          <div className={styles.selectManyTopBar}>
            <span className={styles.selectManyTopSpacer} aria-hidden />
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
          <div className={styles.selectManyQuestionTextWrap}>
            {question.required ? <span className={styles.required}>*</span> : null}
            <QuestionRichTextField
              value={question.text}
              onChange={(text) => onQuestionTextChange(sectionId, question.id, text)}
              ariaLabel="Question text"
              placeholder="Enter question text"
              onPointerDown={stopQuestionEvent}
            />
          </div>
          {extractionSource && onModifyExtraction && onExtractionSourceClick ? (
            <ExtractedQuestionBanner
              extractionSource={extractionSource}
              onModifyExtraction={onModifyExtraction}
              onSourceClick={onExtractionSourceClick}
            />
          ) : null}
          <ul className={styles.selectManyOptions}>
            {question.options.map((option) => {
              const quotaLabel = quotaOptionLabels[option.id];
              const extractionLabel = extractionOptionLabels[option.id];
              return (
              <li key={option.id} className={styles.selectManyOptionItem}>
                <span className={styles.selectOneOptionRadio}>
                  <input
                    type="radio"
                    className={styles.optionRadio}
                    disabled
                    name={question.id}
                    aria-label={`${plainTextFromRichValue(option.label)} radio`}
                  />
                </span>
                <div className={styles.selectManyOptionMain}>
                  <div className={styles.selectManyOptionEditor}>
                    <QuestionRichTextField
                      variant="option"
                      value={option.label}
                      onChange={(label) =>
                        onOptionLabelChange(sectionId, question.id, option.id, label)
                      }
                      ariaLabel="Answer option"
                      placeholder="Option"
                      onPointerDown={stopQuestionEvent}
                    />
                  </div>
                  {dynamicTextEnabledByOptionId[option.id] ? (
                    <DynamicTextCommentsOptionIcon />
                  ) : null}
                  {extractionLabel ? (
                    <ExtractionOptionTag label={extractionLabel} />
                  ) : null}
                  {quotaLabel ? <QuotaControlOptionTag label={quotaLabel} /> : null}
                </div>
              </li>
            );
            })}
          </ul>
          <div
            className={styles.selectManyOptionTools}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={styles.addOptionBtn}
              aria-label="Add option"
              onClick={() => onAddOption(sectionId, question.id)}
            >
              <span className="wm-add" aria-hidden />
            </button>
            <span className={styles.selectManyOptionToolsSpacer} aria-hidden />
            <button
              type="button"
              className={styles.bulkEditLink}
              onClick={(event) => {
                event.stopPropagation();
                onBulkEdit(sectionId, question.id);
              }}
            >
              Bulk Edit
            </button>
          </div>
        </div>
        <QuestionWorkspaceFooter
          showHideOptionsApplied={showHideOptionsApplied}
          dynamicTextCommentsApplied={dynamicTextCommentsApplied}
          extractionApplied={extractionApplied}
          quotaControlApplied={quotaControlApplied}
          className={styles.selectManyFooter}
        />
      </div>
    </article>
  );
}

function SelectManyQuestionRow({
  question,
  sectionId,
  showHideOptionsApplied,
  dynamicTextCommentsApplied,
  dynamicTextEnabledByOptionId,
  extractionApplied,
  quotaControlApplied,
  quotaOptionLabels,
  extractionOptionLabels,
  extractionSource,
  onModifyExtraction,
  onExtractionSourceClick,
  onAction,
  onOpenLogic,
  onOpenSettings,
  onMenuAction,
  onAddOption,
  onBulkEdit,
  onQuestionTextChange,
  onOptionLabelChange,
}: {
  question: SurveyQuestion;
  sectionId: string;
  showHideOptionsApplied: boolean;
  dynamicTextCommentsApplied: boolean;
  dynamicTextEnabledByOptionId: Record<string, boolean>;
  extractionApplied: boolean;
  quotaControlApplied: boolean;
  quotaOptionLabels: Record<string, string>;
  extractionOptionLabels: Record<string, string>;
  extractionSource?: SurveyQuestionExtractionSource;
  onModifyExtraction?: () => void;
  onExtractionSourceClick?: () => void;
  onAction: (label: string) => void;
  onMenuAction: (action: QuestionMenuAction) => void;
  onOpenLogic: () => void;
  onOpenSettings: () => void;
  onAddOption: (sectionId: string, questionId: string) => void;
  onBulkEdit: (sectionId: string, questionId: string) => void;
  onQuestionTextChange: (sectionId: string, questionId: string, text: string) => void;
  onOptionLabelChange: (
    sectionId: string,
    questionId: string,
    optionId: string,
    label: string
  ) => void;
}) {
  return (
    <article className={styles.selectManyBlock}>
      <div className={styles.selectManyCard}>
        <div className={styles.selectManyCardInner}>
          <div className={styles.selectManyTopBar}>
            <span className={styles.selectManyTopSpacer} aria-hidden />
            <QuestionWorkspaceActions
              question={question}
              onAction={onAction}
              onOpenLogic={onOpenLogic}
              onOpenSettings={onOpenSettings}
              onMenuAction={onMenuAction}
              menuBtnClassName={styles.menuBtn}
            />
          </div>
          <div className={styles.selectManyQuestionTextWrap}>
            {question.required ? <span className={styles.required}>*</span> : null}
            <QuestionRichTextField
              value={question.text}
              onChange={(text) => onQuestionTextChange(sectionId, question.id, text)}
              ariaLabel="Question text"
              placeholder="Enter question text"
              onPointerDown={stopQuestionEvent}
            />
          </div>
          {extractionSource && onModifyExtraction && onExtractionSourceClick ? (
            <ExtractedQuestionBanner
              extractionSource={extractionSource}
              onModifyExtraction={onModifyExtraction}
              onSourceClick={onExtractionSourceClick}
            />
          ) : null}
          <ul className={styles.selectManyOptions}>
            {question.options.map((option) => {
              const quotaLabel = quotaOptionLabels[option.id];
              const extractionLabel = extractionOptionLabels[option.id];
              return (
              <li key={option.id} className={styles.selectManyOptionItem}>
                <span className={styles.selectManyOptionCheckbox}>
                  <input
                    type="checkbox"
                    disabled
                    name={`${question.id}-${option.id}`}
                    aria-label={`${plainTextFromRichValue(option.label)} checkbox`}
                  />
                </span>
                <div className={styles.selectManyOptionMain}>
                  <div className={styles.selectManyOptionEditor}>
                    <QuestionRichTextField
                      variant="option"
                      value={option.label}
                      onChange={(label) =>
                        onOptionLabelChange(sectionId, question.id, option.id, label)
                      }
                      ariaLabel="Answer option"
                      placeholder="Option"
                      onPointerDown={stopQuestionEvent}
                    />
                  </div>
                  {dynamicTextEnabledByOptionId[option.id] ? (
                    <DynamicTextCommentsOptionIcon />
                  ) : null}
                  {extractionLabel ? (
                    <ExtractionOptionTag label={extractionLabel} />
                  ) : null}
                  {quotaLabel ? <QuotaControlOptionTag label={quotaLabel} /> : null}
                </div>
              </li>
            );
            })}
          </ul>
          <div
            className={styles.selectManyOptionTools}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={styles.addOptionBtn}
              aria-label="Add option"
              onClick={() => onAddOption(sectionId, question.id)}
            >
              <span className="wm-add" aria-hidden />
            </button>
            <span className={styles.selectManyOptionToolsSpacer} aria-hidden />
            <button
              type="button"
              className={styles.bulkEditLink}
              onClick={(event) => {
                event.stopPropagation();
                onBulkEdit(sectionId, question.id);
              }}
            >
              Bulk Edit
            </button>
          </div>
        </div>
        <QuestionWorkspaceFooter
          showHideOptionsApplied={showHideOptionsApplied}
          dynamicTextCommentsApplied={dynamicTextCommentsApplied}
          extractionApplied={extractionApplied}
          quotaControlApplied={quotaControlApplied}
          className={styles.selectManyFooter}
        />
      </div>
    </article>
  );
}

export function SurveyEditorCanvas({ detail }: SurveyEditorCanvasProps) {
  const { showToast } = useWuShowToast();
  const {
    setWorkspaceSections,
    setWorkspaceLogic,
    registerRemoveQuestions,
    registerClearShowHideLogic,
  } = useSurveyWorkspaceSections();
  const sectionsStorageKey = useMemo(
    () => getSurveyEditorSectionsStorageKey(detail.survey.id),
    [detail.survey.id]
  );
  const [sections, setSections] = usePersistedState<SurveySection[]>(
    sectionsStorageKey,
    cloneSections(detail.sections)
  );
  const [selectedQuestionKey, setSelectedQuestionKey] = useState<string | null>(null);
  const [bulkEditTarget, setBulkEditTarget] = useState<{
    sectionId: string;
    questionId: string;
  } | null>(null);
  const [logicTarget, setLogicTarget] = useState<{
    sectionId: string;
    questionId: string;
  } | null>(null);
  const [settingsTarget, setSettingsTarget] = useState<{
    sectionId: string;
    questionId: string;
  } | null>(null);
  const [questionSettingsByKey, setQuestionSettingsByKey] = useState<
    Record<string, QuestionSettings>
  >({});
  const [logicByQuestionKey, setLogicByQuestionKey] = useState<
    Record<string, QuestionLogicState>
  >({});
  const [validationByQuestionKey, setValidationByQuestionKey] = useState<
    Record<string, QuestionValidationState>
  >({});
  const [validationTarget, setValidationTarget] = useState<{
    sectionId: string;
    questionId: string;
  } | null>(null);
  const [multiPointSettingsByKey, setMultiPointSettingsByKey] = useState<
    Record<string, MultiPointScalesSettings>
  >({});
  const [captchaSettingsByKey, setCaptchaSettingsByKey] = useState<
    Record<string, CaptchaSettings>
  >({});
  const [bulkEditMatrixTarget, setBulkEditMatrixTarget] = useState<{
    sectionId: string;
    questionId: string;
    target: 'rows' | 'columns';
  } | null>(null);
  const [deleteQuestionTarget, setDeleteQuestionTarget] = useState<{
    sectionId: string;
    questionId: string;
  } | null>(null);
  const [lookupTableBulkConversionOpen, setLookupTableBulkConversionOpen] = useState(false);
  const [surveyAgentOpen, setSurveyAgentOpen] = useState(false);
  const [lookupTableBulkConversionConflicts, setLookupTableBulkConversionConflicts] = useState<
    LookupTableConversionLogicConflict[]
  >([]);
  const [pendingLookupTableBulkConversion, setPendingLookupTableBulkConversion] = useState<{
    sectionId: string;
    questionId: string;
    payload: {
      optionLabels: string[];
      otherOption: boolean;
      notApplicableOption: boolean;
    };
  } | null>(null);
  const [pageBreakBySlotKey, setPageBreakBySlotKey] = useState<Record<string, boolean>>({});
  const pendingScrollQuestionRef = useRef<{ sectionId: string; questionId: string } | null>(
    null
  );
  const previewLaunchGuardRef = useRef<{ signature: string; at: number } | null>(null);
  const toast = useCallback(
    (message: string) => {
      showToast({ message, variant: 'success' });
    },
    [showToast]
  );

  useEffect(() => {
    setSelectedQuestionKey(null);
    setSettingsTarget(null);
    setLogicTarget(null);
    setValidationTarget(null);
    setQuestionSettingsByKey({});
    setLogicByQuestionKey({});
    setValidationByQuestionKey({});
    setMultiPointSettingsByKey({});
    setCaptchaSettingsByKey({});
    setBulkEditMatrixTarget(null);
    setDeleteQuestionTarget(null);
    setPageBreakBySlotKey({});
  }, [detail.survey.id]);

  useEffect(() => {
    setWorkspaceSections(sections);
  }, [sections, setWorkspaceSections]);

  useEffect(() => {
    setWorkspaceLogic(logicByQuestionKey);
  }, [logicByQuestionKey, setWorkspaceLogic]);

  const removeQuestionsByTarget = useCallback(
    (targets: SurveyQuestionTarget[]) => {
      if (targets.length === 0) return;

      const targetKeys = new Set(
        targets.map((target) => `${target.sectionId}:${target.questionId}`)
      );
      const targetIdsBySection = new Map<string, Set<string>>();
      for (const target of targets) {
        const ids = targetIdsBySection.get(target.sectionId) ?? new Set<string>();
        ids.add(target.questionId);
        targetIdsBySection.set(target.sectionId, ids);
      }

      setSections((prev) =>
        prev.map((section) => {
          const removeIds = targetIdsBySection.get(section.id);
          if (!removeIds) return section;
          return {
            ...section,
            questions: section.questions.filter((question) => !removeIds.has(question.id)),
          };
        })
      );

      setSelectedQuestionKey((prev) => (prev && targetKeys.has(prev) ? null : prev));
      setSettingsTarget((prev) =>
        prev && targetKeys.has(`${prev.sectionId}:${prev.questionId}`) ? null : prev
      );
      setLogicTarget((prev) =>
        prev && targetKeys.has(`${prev.sectionId}:${prev.questionId}`) ? null : prev
      );
      setLogicByQuestionKey((prev) => {
        const next = { ...prev };
        for (const key of targetKeys) {
          delete next[key];
        }
        return next;
      });
      setBulkEditTarget((prev) =>
        prev && targetKeys.has(`${prev.sectionId}:${prev.questionId}`) ? null : prev
      );
      setBulkEditMatrixTarget((prev) =>
        prev && targetKeys.has(`${prev.sectionId}:${prev.questionId}`) ? null : prev
      );
      setDeleteQuestionTarget((prev) =>
        prev && targetKeys.has(`${prev.sectionId}:${prev.questionId}`) ? null : prev
      );
    },
    []
  );

  const clearShowHideLogicByTarget = useCallback((targets: SurveyQuestionTarget[]) => {
    if (targets.length === 0) return;

    const targetKeys = new Set(
      targets.map((target) => `${target.sectionId}:${target.questionId}`)
    );

    setLogicByQuestionKey((prev) => {
      const next = { ...prev };
      for (const key of targetKeys) {
        delete next[key];
      }
      return next;
    });
  }, []);

  useEffect(() => {
    registerRemoveQuestions(removeQuestionsByTarget);
    return () => registerRemoveQuestions(null);
  }, [registerRemoveQuestions, removeQuestionsByTarget]);

  useEffect(() => {
    registerClearShowHideLogic(clearShowHideLogicByTarget);
    return () => registerClearShowHideLogic(null);
  }, [registerClearShowHideLogic, clearShowHideLogicByTarget]);

  useEffect(() => {
    const pending = pendingScrollQuestionRef.current;
    if (!pending) return;
    pendingScrollQuestionRef.current = null;
    const el = document.getElementById(
      `survey-question-${pending.sectionId}-${pending.questionId}`
    );
    if (!el) return;
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    });
  }, [sections]);

  const handlePageControl = useCallback(
    (action: string) => {
      toast(action);
    },
    [toast]
  );

  const handleTogglePageBreak = useCallback(
    (sectionId: string, insertIndex: number) => {
      const section = sections.find((sec) => sec.id === sectionId);
      if (!section) return;

      const slotKey = getPageBreakSlotKey(sectionId, insertIndex, section.questions);
      const nextHasPageBreak = !hasPageBreakAtSlot(pageBreakBySlotKey, slotKey);
      setPageBreakBySlotKey((prev) => ({ ...prev, [slotKey]: nextHasPageBreak }));
      toast(nextHasPageBreak ? 'Page break added' : 'Page break removed');
    },
    [pageBreakBySlotKey, sections, toast]
  );

  const handleAddOption = useCallback(
    (sectionId: string, questionId: string) => {
      setSections((prev) =>
        prev.map((sec) => {
          if (sec.id !== sectionId) return sec;
          return {
            ...sec,
            questions: sec.questions.map((q) => {
              if (q.id !== questionId) return q;
              const nextIndex = q.options.length + 1;
              return {
                ...q,
                options: [
                  ...q.options,
                  { id: `opt-${Date.now()}`, label: `Option ${nextIndex}` },
                ],
              };
            }),
          };
        })
      );
      toast('Option added');
    },
    [toast]
  );

  const handleBulkEdit = useCallback((sectionId: string, questionId: string) => {
    setBulkEditTarget({ sectionId, questionId });
  }, []);

  const handleQuestionTextChange = useCallback(
    (sectionId: string, questionId: string, text: string) => {
      setSections((prev) =>
        prev.map((sec) => {
          if (sec.id !== sectionId) return sec;
          return {
            ...sec,
            questions: sec.questions.map((q) =>
              q.id === questionId ? { ...q, text } : q
            ),
          };
        })
      );
    },
    []
  );

  const handleOptionLabelChange = useCallback(
    (sectionId: string, questionId: string, optionId: string, label: string) => {
      setSections((prev) =>
        prev.map((sec) => {
          if (sec.id !== sectionId) return sec;
          return {
            ...sec,
            questions: sec.questions.map((q) => {
              if (q.id !== questionId) return q;
              return {
                ...q,
                options: q.options.map((option) =>
                  option.id === optionId ? { ...option, label } : option
                ),
              };
            }),
          };
        })
      );
    },
    []
  );

  const handleSmileyOptionLabelChange = useCallback(
    (sectionId: string, questionId: string, optionId: string, label: string) => {
      setSections((prev) =>
        prev.map((sec) => {
          if (sec.id !== sectionId) return sec;
          return {
            ...sec,
            questions: sec.questions.map((q) => {
              if (q.id !== questionId || !q.smileyRating) return q;
              return {
                ...q,
                smileyRating: {
                  ...q.smileyRating,
                  options: q.smileyRating.options.map((option) =>
                    option.id === optionId ? { ...option, label } : option
                  ),
                },
              };
            }),
          };
        })
      );
    },
    []
  );

  const handleThumbsChoiceLabelChange = useCallback(
    (sectionId: string, questionId: string, choiceId: string, label: string) => {
      setSections((prev) =>
        prev.map((sec) => {
          if (sec.id !== sectionId) return sec;
          return {
            ...sec,
            questions: sec.questions.map((q) => {
              if (q.id !== questionId || !q.thumbsUpDown) return q;
              return {
                ...q,
                thumbsUpDown: {
                  ...q.thumbsUpDown,
                  choices: q.thumbsUpDown.choices.map((choice) =>
                    choice.id === choiceId ? { ...choice, label } : choice
                  ),
                },
              };
            }),
          };
        })
      );
    },
    []
  );

  const applyLookupTableBulkConversion = useCallback(
    (
      sectionId: string,
      questionId: string,
      payload: {
        optionLabels: string[];
        otherOption: boolean;
        notApplicableOption: boolean;
      }
    ) => {
      setSections((prev) =>
        prev.map((sec) => {
          if (sec.id !== sectionId) return sec;
          return {
            ...sec,
            questions: sec.questions.map((q) => {
              if (q.id !== questionId) return q;
              return applyBulkEditToQuestion(q, payload, true);
            }),
          };
        })
      );
      setBulkEditTarget(null);
    },
    []
  );

  const handleBulkEditSave = useCallback(
    (payload: {
      optionLabels: string[];
      otherOption: boolean;
      notApplicableOption: boolean;
    }): 'saved' | 'converted' | 'blocked' => {
      if (!bulkEditTarget) return 'saved';
      const { sectionId, questionId } = bulkEditTarget;
      const question = sections
        .find((sec) => sec.id === sectionId)
        ?.questions.find((q) => q.id === questionId);

      if (!question) return 'saved';

      const optionCount = countBulkEditOptions(
        payload.optionLabels,
        payload.otherOption,
        payload.notApplicableOption
      );
      const requiresLookupTable =
        isSelectOneQuestion(question) && optionCount > SELECT_ONE_MAX_BULK_OPTIONS;

      if (requiresLookupTable) {
        const questionKey = `${sectionId}:${questionId}`;
        const optionIds = question.options.map((option) => option.id);
        const savedLogic =
          logicByQuestionKey[questionKey] ?? createDefaultQuestionLogicState(optionIds);
        const conflicts = collectLookupTableConversionLogicConflicts(savedLogic, optionIds);

        if (conflicts.length > 0) {
          setPendingLookupTableBulkConversion({ sectionId, questionId, payload });
          setLookupTableBulkConversionConflicts(conflicts);
          setLookupTableBulkConversionOpen(true);
          setBulkEditTarget(null);
          return 'blocked';
        }

        applyLookupTableBulkConversion(sectionId, questionId, payload);
        return 'converted';
      }

      setSections((prev) =>
        prev.map((sec) => {
          if (sec.id !== sectionId) return sec;
          return {
            ...sec,
            questions: sec.questions.map((q) => {
              if (q.id !== questionId) return q;
              return applyBulkEditToQuestion(q, payload, false);
            }),
          };
        })
      );
      setBulkEditTarget(null);
      return 'saved';
    },
    [applyLookupTableBulkConversion, bulkEditTarget, logicByQuestionKey, sections]
  );

  const handleRemoveLookupTableConflict = useCallback(
    (conflict: LookupTableConversionLogicConflict) => {
      if (!pendingLookupTableBulkConversion) return;
      const { sectionId, questionId, payload } = pendingLookupTableBulkConversion;
      const questionKey = `${sectionId}:${questionId}`;
      const question = sections
        .find((sec) => sec.id === sectionId)
        ?.questions.find((q) => q.id === questionId);
      if (!question) return;

      const optionIds = question.options.map((option) => option.id);
      const currentLogic =
        logicByQuestionKey[questionKey] ?? createDefaultQuestionLogicState(optionIds);
      const nextLogic = clearLookupTableUnsupportedLogic(
        currentLogic,
        optionIds,
        conflict.logicType
      );
      const nextConflicts = collectLookupTableConversionLogicConflicts(nextLogic, optionIds);

      setLogicByQuestionKey((prev) => ({
        ...prev,
        [questionKey]: nextLogic,
      }));

      if (conflict.logicType === 'extraction') {
        setSections((prev) =>
          prev.map((sec) => {
            if (sec.id !== sectionId) return sec;
            return {
              ...sec,
              questions: removeExtractedQuestionFromSection(sec.questions, questionId),
            };
          })
        );
      }

      setLookupTableBulkConversionConflicts(nextConflicts);
      showToast({
        message: `${conflict.typeLabel} logic removed`,
        variant: 'success',
      });
    },
    [logicByQuestionKey, pendingLookupTableBulkConversion, sections, showToast]
  );

  const handleSaveAsLookupTable = useCallback(() => {
    if (!pendingLookupTableBulkConversion) return;
    const { sectionId, questionId, payload } = pendingLookupTableBulkConversion;
    const questionKey = `${sectionId}:${questionId}`;
    const question = sections
      .find((sec) => sec.id === sectionId)
      ?.questions.find((q) => q.id === questionId);
    if (!question) return;

    const optionIds = question.options.map((option) => option.id);
    const savedLogic =
      logicByQuestionKey[questionKey] ?? createDefaultQuestionLogicState(optionIds);
    const remainingConflicts = collectLookupTableConversionLogicConflicts(
      savedLogic,
      optionIds
    );
    if (remainingConflicts.length > 0) return;

    applyLookupTableBulkConversion(sectionId, questionId, payload);
    setPendingLookupTableBulkConversion(null);
    setLookupTableBulkConversionOpen(false);
    setLookupTableBulkConversionConflicts([]);
    showToast({
      message: 'Question converted to Lookup Table with answer options updated',
      variant: 'success',
    });
  }, [
    applyLookupTableBulkConversion,
    logicByQuestionKey,
    pendingLookupTableBulkConversion,
    sections,
    showToast,
  ]);

  const bulkEditQuestion = bulkEditTarget
    ? sections
        .find((sec) => sec.id === bulkEditTarget.sectionId)
        ?.questions.find((q) => q.id === bulkEditTarget.questionId)
    : undefined;

  const bulkEditMatrixQuestion = bulkEditMatrixTarget
    ? sections
        .find((sec) => sec.id === bulkEditMatrixTarget.sectionId)
        ?.questions.find((q) => q.id === bulkEditMatrixTarget.questionId)
    : undefined;

  const logicQuestion = logicTarget
    ? sections
        .find((sec) => sec.id === logicTarget.sectionId)
        ?.questions.find((q) => q.id === logicTarget.questionId)
    : undefined;

  const logicQuestionKey = logicTarget
    ? `${logicTarget.sectionId}:${logicTarget.questionId}`
    : null;

  const allQuestions = useMemo(
    () => sections.flatMap((section) => section.questions),
    [sections]
  );

  const settingsQuestionKey = settingsTarget
    ? `${settingsTarget.sectionId}:${settingsTarget.questionId}`
    : null;

  const settingsQuestion = settingsTarget
    ? sections
        .find((sec) => sec.id === settingsTarget.sectionId)
        ?.questions.find((q) => q.id === settingsTarget.questionId)
    : undefined;

  const validationQuestion = validationTarget
    ? sections
        .find((sec) => sec.id === validationTarget.sectionId)
        ?.questions.find((q) => q.id === validationTarget.questionId)
    : undefined;

  const validationQuestionKey = validationTarget
    ? `${validationTarget.sectionId}:${validationTarget.questionId}`
    : null;

  const handleOpenLogic = useCallback((sectionId: string, questionId: string) => {
    setLogicTarget({ sectionId, questionId });
  }, []);

  const getQuestionLogic = useCallback(
    (questionKey: string, question: SurveyQuestion): QuestionLogicState =>
      logicByQuestionKey[questionKey] ??
      createDefaultQuestionLogicState(question.options.map((option) => option.id)),
    [logicByQuestionKey]
  );

  const handleLogicSave = useCallback(
    (sectionId: string, questionId: string, state: QuestionLogicState) => {
      const questionKey = `${sectionId}:${questionId}`;
      setLogicByQuestionKey((prev) => ({
        ...prev,
        [questionKey]: state,
      }));

      let extractedQuestionId: string | null = null;
      setSections((prev) =>
        prev.map((sec) => {
          if (sec.id !== sectionId) return sec;
          const sourceIndex = sec.questions.findIndex((question) => question.id === questionId);
          if (sourceIndex < 0) return sec;

          if (state.logicType !== 'extraction') {
            return {
              ...sec,
              questions: removeExtractedQuestionFromSection(sec.questions, questionId),
            };
          }

          const sourceQuestion = sec.questions[sourceIndex];
          const result = upsertExtractedQuestionInSection(
            sec.questions,
            sourceIndex,
            sourceQuestion,
            state.extraction
          );
          extractedQuestionId = result.extractedQuestionId;
          return { ...sec, questions: result.questions };
        })
      );

      if (extractedQuestionId) {
        pendingScrollQuestionRef.current = {
          sectionId,
          questionId: extractedQuestionId,
        };
        setSelectedQuestionKey(`${sectionId}:${extractedQuestionId}`);
      }
    },
    []
  );

  const handleModifyExtraction = useCallback((sectionId: string, sourceQuestionId: string) => {
    setLogicTarget({ sectionId, questionId: sourceQuestionId });
    pendingScrollQuestionRef.current = { sectionId, questionId: sourceQuestionId };
    setSelectedQuestionKey(`${sectionId}:${sourceQuestionId}`);
  }, []);

  const handleExtractionSourceClick = useCallback(
    (sectionId: string, sourceQuestionId: string) => {
      pendingScrollQuestionRef.current = { sectionId, questionId: sourceQuestionId };
      setSelectedQuestionKey(`${sectionId}:${sourceQuestionId}`);
    },
    []
  );

  const handleOpenSettings = useCallback((sectionId: string, questionId: string) => {
    const questionKey = `${sectionId}:${questionId}`;
    setSelectedQuestionKey(questionKey);
    setSettingsTarget({ sectionId, questionId });
  }, []);

  const handleOpenValidation = useCallback((sectionId: string, questionId: string) => {
    setValidationTarget({ sectionId, questionId });
  }, []);

  const getQuestionValidation = useCallback(
    (question: SurveyQuestion, questionKey: string): QuestionValidationState =>
      validationByQuestionKey[questionKey] ?? createDefaultQuestionValidation(question.required),
    [validationByQuestionKey]
  );

  const handleValidationApply = useCallback(
    (sectionId: string, questionId: string, state: QuestionValidationState) => {
      const questionKey = `${sectionId}:${questionId}`;
      setValidationByQuestionKey((prev) => ({
        ...prev,
        [questionKey]: state,
      }));
    },
    []
  );

  const handleSettingsChange = useCallback(
    (questionKey: string, settings: QuestionSettings, question: SurveyQuestion) => {
      setQuestionSettingsByKey((prev) => ({ ...prev, [questionKey]: settings }));

      const isStandardChoiceQuestion =
        (!question.kind || question.kind === 'standard') && question.options.length > 0;
      if (!isStandardChoiceQuestion) return;

      const nextInputKind =
        settings.answerType === 'checkbox'
          ? 'checkbox'
          : settings.answerType === 'radio'
            ? 'radio'
            : null;
      if (!nextInputKind || question.inputKind === nextInputKind) return;

      const [sectionId, questionId] = questionKey.split(':');
      setSections((prev) =>
        prev.map((sec) => {
          if (sec.id !== sectionId) return sec;
          return {
            ...sec,
            questions: sec.questions.map((item) => {
              if (item.id !== questionId) return item;
              return {
                ...item,
                inputKind: nextInputKind,
                addQuestionTypeId:
                  nextInputKind === 'checkbox'
                    ? 'select-many'
                    : item.addQuestionTypeId === 'select-many'
                      ? undefined
                      : item.addQuestionTypeId,
              };
            }),
          };
        })
      );
    },
    []
  );

  const getQuestionSettings = useCallback(
    (question: SurveyQuestion, questionKey: string): QuestionSettings => {
      const settings =
        questionSettingsByKey[questionKey] ??
        getDefaultSettingsForQuestion(question.inputKind, question.addQuestionTypeId);
      return {
        ...settings,
        answerDisplayOrder: normalizeAnswerDisplayOrder(settings.answerDisplayOrder),
        randomizeAnswerCount: normalizeRandomizeAnswerCount(
          settings.randomizeAnswerCount,
          question.options.length
        ),
      };
    },
    [questionSettingsByKey]
  );

  const buildPreviewFollowUp = useCallback(
    (itemSectionId: string, followUpQuestion: SurveyQuestion) => {
      const questionKey = `${itemSectionId}:${followUpQuestion.id}`;
      const questionSettings = getQuestionSettings(followUpQuestion, questionKey);
      const questionLogic = getQuestionLogic(questionKey, followUpQuestion);
      const optionIds = followUpQuestion.options.map((option) => option.id);

      return {
        ...toQuestionPreviewFollowUp(followUpQuestion, questionSettings),
        answerDisplayOrder: questionSettings.answerDisplayOrder,
        randomizeAnswerCount: questionSettings.randomizeAnswerCount,
        alternateFlipReversed:
          questionSettings.answerDisplayOrder === 'alternate-flip'
            ? getAndAdvanceAlternateFlipState(detail.survey.id, followUpQuestion.code)
            : undefined,
        showHideOptions: toShowHideOptionsPreviewConfig(questionLogic, optionIds),
      };
    },
    [detail.survey.id, getQuestionLogic, getQuestionSettings]
  );

  const getMultiPointSettings = useCallback(
    (questionKey: string): MultiPointScalesSettings => {
      return {
        ...DEFAULT_MULTI_POINT_SETTINGS,
        ...multiPointSettingsByKey[questionKey],
      };
    },
    [multiPointSettingsByKey]
  );

  const handleMultiPointSettingsChange = useCallback(
    (questionKey: string, settings: MultiPointScalesSettings) => {
      setMultiPointSettingsByKey((prev) => ({ ...prev, [questionKey]: settings }));
    },
    []
  );

  const openQuestionPreviewTab = useCallback((signature: string, url: string) => {
    const now = Date.now();
    const lastLaunch = previewLaunchGuardRef.current;
    if (lastLaunch && lastLaunch.signature === signature && now - lastLaunch.at < 750) {
      return;
    }
    previewLaunchGuardRef.current = { signature, at: now };
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const getCaptchaSettings = useCallback(
    (questionKey: string): CaptchaSettings => {
      return {
        ...DEFAULT_CAPTCHA_SETTINGS,
        ...captchaSettingsByKey[questionKey],
      };
    },
    [captchaSettingsByKey]
  );

  const handleCaptchaSettingsChange = useCallback(
    (questionKey: string, settings: CaptchaSettings) => {
      setCaptchaSettingsByKey((prev) => ({ ...prev, [questionKey]: settings }));
    },
    []
  );

  const updateQuestionMatrix = useCallback(
    (
      sectionId: string,
      questionId: string,
      updater: (matrix: SurveyMatrix) => SurveyMatrix
    ) => {
      setSections((prev) =>
        prev.map((sec) => {
          if (sec.id !== sectionId) return sec;
          return {
            ...sec,
            questions: sec.questions.map((q) => {
              if (q.id !== questionId || !q.matrix) return q;
              return { ...q, matrix: updater(q.matrix) };
            }),
          };
        })
      );
    },
    []
  );

  const handleMatrixAnchorChange = useCallback(
    (
      sectionId: string,
      questionId: string,
      anchor: 'leftAnchor' | 'rightAnchor',
      value: string
    ) => {
      updateQuestionMatrix(sectionId, questionId, (matrix) => ({
        ...matrix,
        [anchor]: value,
      }));
    },
    [updateQuestionMatrix]
  );

  const handleMatrixColumnLabelChange = useCallback(
    (sectionId: string, questionId: string, columnId: string, label: string) => {
      updateQuestionMatrix(sectionId, questionId, (matrix) => ({
        ...matrix,
        columns: matrix.columns.map((column) =>
          column.id === columnId ? { ...column, label } : column
        ),
      }));
    },
    [updateQuestionMatrix]
  );

  const handleMatrixRowLabelChange = useCallback(
    (sectionId: string, questionId: string, rowId: string, label: string) => {
      updateQuestionMatrix(sectionId, questionId, (matrix) => ({
        ...matrix,
        rows: matrix.rows.map((row) => (row.id === rowId ? { ...row, label } : row)),
      }));
    },
    [updateQuestionMatrix]
  );

  const handleAddMatrixRow = useCallback(
    (sectionId: string, questionId: string) => {
      updateQuestionMatrix(sectionId, questionId, (matrix) => {
        const nextIndex = matrix.rows.length + 1;
        return {
          ...matrix,
          rows: [
            ...matrix.rows,
            { id: `row-${Date.now()}`, label: `Row ${nextIndex}` },
          ],
        };
      });
      toast('Row added');
    },
    [toast, updateQuestionMatrix]
  );

  const handleBulkEditMatrixSave = useCallback(
    (lines: string[]) => {
      if (!bulkEditMatrixTarget) return;
      const { sectionId, questionId, target } = bulkEditMatrixTarget;
      updateQuestionMatrix(sectionId, questionId, (matrix) => {
        if (target === 'rows') {
          return {
            ...matrix,
            rows: lines.map((label, index) => {
              const existing = matrix.rows[index];
              return existing
                ? { ...existing, label }
                : { id: `row-${Date.now()}-${index}`, label };
            }),
          };
        }
        return {
          ...matrix,
          columns: lines.map((label, index) => {
            const existing = matrix.columns[index];
            return existing
              ? { ...existing, label }
              : { id: `col-${Date.now()}-${index}`, label };
          }),
        };
      });
      setBulkEditMatrixTarget(null);
    },
    [bulkEditMatrixTarget, updateQuestionMatrix]
  );

  const handleQuestionCodeChange = useCallback(
    (sectionId: string, questionId: string, code: string) => {
      setSections((prev) =>
        prev.map((sec) => {
          if (sec.id !== sectionId) return sec;
          return {
            ...sec,
            questions: sec.questions.map((q) =>
              q.id === questionId ? { ...q, code } : q
            ),
          };
        })
      );
    },
    []
  );

  const handleQuestionMenuAction = useCallback(
    (sectionId: string, questionId: string, action: QuestionMenuAction) => {
      const section = sections.find((sec) => sec.id === sectionId);
      const question = section?.questions.find((q) => q.id === questionId);
      if (!question) return;

      const questionLabel = plainTextFromRichValue(question.text) || question.code;

      switch (action) {
        case 'preview': {
          const questionKey = `${sectionId}:${questionId}`;
          const questionSettings = getQuestionSettings(question, questionKey);
          const questionLogic = getQuestionLogic(questionKey, question);
          const optionIds = question.options.map((option) => option.id);
          const showHideOptions = toShowHideOptionsPreviewConfig(questionLogic, optionIds);
          const { samePageFollowUps, nextPages } = collectPreviewPagesAfterQuestion(
            sections,
            sectionId,
            questionId,
            pageBreakBySlotKey,
            buildPreviewFollowUp
          );
          const previewBaseUrl = `${window.location.origin}/surveys/preview/${detail.survey.id}`;
          const previewSignature = `${detail.survey.id}:${questionKey}`;

          if (isMultiPointScalesQuestion(question) && question.matrix) {
            const mpSettings = getMultiPointSettings(questionKey);
            if (isCardsCarouselPreview(mpSettings)) {
              writeMultiPointQuestionPreviewSession({
                surveyId: detail.survey.id,
                surveyTitle: detail.editorTitle,
                questionText: question.text,
                required: question.required,
                matrix: question.matrix,
                settings: mpSettings,
                samePageFollowUps,
                nextPages,
              });
              openQuestionPreviewTab(previewSignature, previewBaseUrl);
              return;
            }
            showToast({
              message: 'Preview requires Cards carousel layout',
              variant: 'info',
            });
            return;
          }

          if (isSelectManyPreviewQuestion(question, questionSettings)) {
            writeSelectManyQuestionPreviewSession({
              surveyId: detail.survey.id,
              surveyTitle: detail.editorTitle,
              questionCode: question.code,
              questionText: question.text,
              required: question.required,
              options: question.options.map((option) => ({
                id: option.id,
                label: option.label,
              })),
              answerDisplayOrder: questionSettings.answerDisplayOrder,
              randomizeAnswerCount: questionSettings.randomizeAnswerCount,
              alternateFlipReversed:
                questionSettings.answerDisplayOrder === 'alternate-flip'
                  ? getAndAdvanceAlternateFlipState(detail.survey.id, question.code)
                  : undefined,
              showHideOptions,
              samePageFollowUps,
              nextPages,
            });
            openQuestionPreviewTab(
              `${previewSignature}:select-many`,
              `${previewBaseUrl}?kind=select-many`
            );
            return;
          }

          if (isSelectOnePreviewQuestion(question, questionSettings)) {
            writeSelectOneQuestionPreviewSession({
              surveyId: detail.survey.id,
              surveyTitle: detail.editorTitle,
              questionCode: question.code,
              questionText: question.text,
              required: question.required,
              options: question.options.map((option) => ({
                id: option.id,
                label: option.label,
              })),
              answerDisplayOrder: questionSettings.answerDisplayOrder,
              randomizeAnswerCount: questionSettings.randomizeAnswerCount,
              alternateFlipReversed:
                questionSettings.answerDisplayOrder === 'alternate-flip'
                  ? getAndAdvanceAlternateFlipState(detail.survey.id, question.code)
                  : undefined,
              showHideOptions,
              isFirstQuestion: isFirstSurveyQuestion(sections, sectionId, questionId),
              samePageFollowUps,
              nextPages,
            });
            openQuestionPreviewTab(
              `${previewSignature}:select-one`,
              `${previewBaseUrl}?kind=select-one`
            );
            return;
          }

          if (isCaptchaQuestion(question)) {
            const captchaSettings = getCaptchaSettings(questionKey);
            writeCaptchaQuestionPreviewSession({
              surveyId: detail.survey.id,
              surveyTitle: detail.editorTitle,
              questionCode: question.code,
              questionText: question.text,
              required: question.required,
              captchaSettings,
              isFirstQuestion: isFirstSurveyQuestion(sections, sectionId, questionId),
              samePageFollowUps,
              nextPages,
            });
            openQuestionPreviewTab(
              `${previewSignature}:captcha`,
              `${previewBaseUrl}?kind=captcha`
            );
            return;
          }

          showToast({
            message: `Preview is not available for ${questionLabel}`,
            variant: 'info',
          });
          return;
        }
        case 'copy': {
          const copy = cloneQuestionForCopy(question);
          const sourceKey = `${sectionId}:${questionId}`;
          setSections((prev) =>
            prev.map((sec) => {
              if (sec.id !== sectionId) return sec;
              const index = sec.questions.findIndex((q) => q.id === questionId);
              const maxNum = sec.questions.reduce((m, q) => Math.max(m, q.number), 0);
              const inserted = {
                ...copy,
                number: maxNum + 1,
                code: `Q${maxNum + 1}`,
              };
              const nextQuestions = [...sec.questions];
              nextQuestions.splice(index + 1, 0, inserted);
              return { ...sec, questions: nextQuestions };
            })
          );
          if (isMultiPointScalesQuestion(question)) {
            const sourceSettings = getMultiPointSettings(sourceKey);
            setMultiPointSettingsByKey((prev) => ({
              ...prev,
              [`${sectionId}:${copy.id}`]: sourceSettings,
            }));
          }
          toast('Question copied');
          return;
        }
        case 'save-to-library':
          toast('Question saved to library');
          return;
        case 'reorder':
          toast('Reorder question');
          return;
        case 'delete':
          setDeleteQuestionTarget({ sectionId, questionId });
          return;
        default:
          return;
      }
    },
    [
      detail.editorTitle,
      detail.survey.id,
      pageBreakBySlotKey,
      sections,
      showToast,
      getMultiPointSettings,
      getQuestionSettings,
      getQuestionLogic,
      buildPreviewFollowUp,
      openQuestionPreviewTab,
      getCaptchaSettings,
    ]
  );

  const handleConfirmDeleteQuestion = useCallback(() => {
    if (!deleteQuestionTarget) return;
    const { sectionId, questionId } = deleteQuestionTarget;
    const questionKey = `${sectionId}:${questionId}`;
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.id !== sectionId) return sec;
        return {
          ...sec,
          questions: sec.questions.filter((q) => q.id !== questionId),
        };
      })
    );
    if (selectedQuestionKey === questionKey) {
      setSelectedQuestionKey(null);
    }
    if (settingsTarget?.sectionId === sectionId && settingsTarget.questionId === questionId) {
      setSettingsTarget(null);
    }
    setLogicTarget((prev) =>
      prev?.sectionId === sectionId && prev.questionId === questionId ? null : prev
    );
    setLogicByQuestionKey((prev) => {
      const next = { ...prev };
      delete next[questionKey];
      return next;
    });
    setDeleteQuestionTarget(null);
    toast('Question deleted');
  }, [deleteQuestionTarget, selectedQuestionKey, settingsTarget, toast]);

  const handleAddQuestionSelect = useCallback(
    (
      sectionId: string,
      insertIndex: number,
      category: string,
      typeLabel: string,
      typeId: string
    ) => {
      if (typeId === 'select-one') {
        const ts = Date.now();
        const newId = `q-new-${ts}`;
        setSections((prev) => {
          const next = prev.map((sec) => {
            if (sec.id !== sectionId) return sec;
            const nextNum = nextQuestionNumber(sec.questions);
            const newQuestion: SurveyQuestion = {
              id: newId,
              code: `Q${nextNum}`,
              number: nextNum,
              text: `Question ${nextNum}`,
              required: true,
              inputKind: 'radio',
              addQuestionTypeId: 'select-one',
              options: [
                { id: `opt-${ts}-1`, label: 'Option 1' },
                { id: `opt-${ts}-2`, label: 'Option 2' },
              ],
            };
            return {
              ...sec,
              questions: insertQuestionAtIndex(sec.questions, insertIndex, newQuestion),
            };
          });
          pendingScrollQuestionRef.current = {
            sectionId,
            questionId: newId,
          };
          setSelectedQuestionKey(`${sectionId}:${newId}`);
          return next;
        });
        showToast({ message: 'Select One question added', variant: 'success' });
        return;
      }

      if (typeId === 'select-many') {
        const ts = Date.now();
        const newId = `q-new-${ts}`;
        setSections((prev) => {
          const next = prev.map((sec) => {
            if (sec.id !== sectionId) return sec;
            const nextNum = nextQuestionNumber(sec.questions);
            const newQuestion: SurveyQuestion = {
              id: newId,
              code: `Q${nextNum}`,
              number: nextNum,
              text: `Question ${nextNum}`,
              required: true,
              inputKind: 'checkbox',
              addQuestionTypeId: 'select-many',
              options: [
                { id: `opt-${ts}-1`, label: 'Option 1' },
                { id: `opt-${ts}-2`, label: 'Option 2' },
              ],
            };
            return {
              ...sec,
              questions: insertQuestionAtIndex(sec.questions, insertIndex, newQuestion),
            };
          });
          pendingScrollQuestionRef.current = {
            sectionId,
            questionId: newId,
          };
          setSelectedQuestionKey(`${sectionId}:${newId}`);
          return next;
        });
        showToast({ message: 'Select Many question added', variant: 'success' });
        return;
      }

      if (typeId === 'dropdown') {
        const ts = Date.now();
        const newId = `q-new-${ts}`;
        setSections((prev) => {
          const next = prev.map((sec) => {
            if (sec.id !== sectionId) return sec;
            const nextNum = nextQuestionNumber(sec.questions);
            const newQuestion: SurveyQuestion = {
              id: newId,
              code: `Q${nextNum}`,
              number: nextNum,
              text: DEFAULT_DROPDOWN_QUESTION_TEXT,
              required: true,
              inputKind: 'radio',
              addQuestionTypeId: 'dropdown',
              options: createDefaultDropdownOptions().map((option, index) => ({
                ...option,
                id: `opt-${ts}-${index + 1}`,
              })),
            };
            return {
              ...sec,
              questions: insertQuestionAtIndex(sec.questions, insertIndex, newQuestion),
            };
          });
          const questionKey = `${sectionId}:${newId}`;
          pendingScrollQuestionRef.current = {
            sectionId,
            questionId: newId,
          };
          setSelectedQuestionKey(questionKey);
          setQuestionSettingsByKey((settings) => ({
            ...settings,
            [questionKey]: getDefaultSettingsForQuestion('radio', 'dropdown'),
          }));
          return next;
        });
        showToast({ message: 'Drop-down Menu question added', variant: 'success' });
        return;
      }

      if (typeId === 'comment-box') {
        const ts = Date.now();
        const newId = `q-new-${ts}`;
        setSections((prev) => {
          const next = prev.map((sec) => {
            if (sec.id !== sectionId) return sec;
            const nextNum = nextQuestionNumber(sec.questions);
            const newQuestion: SurveyQuestion = {
              id: newId,
              code: `Q${nextNum}`,
              number: nextNum,
              text: DEFAULT_COMMENT_BOX_QUESTION_TEXT,
              required: true,
              addQuestionTypeId: 'comment-box',
              options: [],
            };
            return {
              ...sec,
              questions: insertQuestionAtIndex(sec.questions, insertIndex, newQuestion),
            };
          });
          pendingScrollQuestionRef.current = {
            sectionId,
            questionId: newId,
          };
          setSelectedQuestionKey(`${sectionId}:${newId}`);
          return next;
        });
        showToast({ message: 'Comment Box question added', variant: 'success' });
        return;
      }

      if (typeId === 'single-row') {
        const ts = Date.now();
        const newId = `q-new-${ts}`;
        setSections((prev) => {
          const next = prev.map((sec) => {
            if (sec.id !== sectionId) return sec;
            const nextNum = nextQuestionNumber(sec.questions);
            const newQuestion: SurveyQuestion = {
              id: newId,
              code: `Q${nextNum}`,
              number: nextNum,
              text: DEFAULT_SINGLE_ROW_QUESTION_TEXT,
              required: true,
              addQuestionTypeId: 'single-row',
              options: [],
            };
            return {
              ...sec,
              questions: insertQuestionAtIndex(sec.questions, insertIndex, newQuestion),
            };
          });
          pendingScrollQuestionRef.current = {
            sectionId,
            questionId: newId,
          };
          setSelectedQuestionKey(`${sectionId}:${newId}`);
          return next;
        });
        showToast({ message: 'Single Row Text question added', variant: 'success' });
        return;
      }

      if (typeId === 'email') {
        const ts = Date.now();
        const newId = `q-new-${ts}`;
        setSections((prev) => {
          const next = prev.map((sec) => {
            if (sec.id !== sectionId) return sec;
            const nextNum = nextQuestionNumber(sec.questions);
            const newQuestion: SurveyQuestion = {
              id: newId,
              code: `Q${nextNum}`,
              number: nextNum,
              text: `Question ${nextNum}`,
              required: true,
              addQuestionTypeId: 'email',
              options: [],
            };
            return {
              ...sec,
              questions: insertQuestionAtIndex(sec.questions, insertIndex, newQuestion),
            };
          });
          pendingScrollQuestionRef.current = {
            sectionId,
            questionId: newId,
          };
          setSelectedQuestionKey(`${sectionId}:${newId}`);
          return next;
        });
        showToast({ message: 'Email Address question added', variant: 'success' });
        return;
      }

      if (typeId === 'contact') {
        const ts = Date.now();
        const newId = `q-new-${ts}`;
        setSections((prev) => {
          const next = prev.map((sec) => {
            if (sec.id !== sectionId) return sec;
            const nextNum = nextQuestionNumber(sec.questions);
            const newQuestion: SurveyQuestion = {
              id: newId,
              code: `Q${nextNum}`,
              number: nextNum,
              text: DEFAULT_CONTACT_INFORMATION_QUESTION_TEXT,
              required: true,
              addQuestionTypeId: 'contact',
              options: createDefaultContactInformationOptions().map((option, index) => ({
                ...option,
                id: `contact-field-${ts}-${index + 1}`,
              })),
            };
            return {
              ...sec,
              questions: insertQuestionAtIndex(sec.questions, insertIndex, newQuestion),
            };
          });
          pendingScrollQuestionRef.current = {
            sectionId,
            questionId: newId,
          };
          setSelectedQuestionKey(`${sectionId}:${newId}`);
          return next;
        });
        showToast({ message: 'Contact Information question added', variant: 'success' });
        return;
      }

      if (typeId === 'star-rating') {
        const ts = Date.now();
        const newId = `q-new-${ts}`;
        setSections((prev) => {
          const next = prev.map((sec) => {
            if (sec.id !== sectionId) return sec;
            const nextNum = nextQuestionNumber(sec.questions);
            const newQuestion: SurveyQuestion = {
              id: newId,
              code: `Q${nextNum}`,
              number: nextNum,
              text: DEFAULT_STAR_RATING_QUESTION_TEXT,
              required: true,
              kind: 'star-rating',
              addQuestionTypeId: 'star-rating',
              options: [],
              matrix: createDefaultStarRatingMatrix(),
            };
            return {
              ...sec,
              questions: insertQuestionAtIndex(sec.questions, insertIndex, newQuestion),
            };
          });
          pendingScrollQuestionRef.current = {
            sectionId,
            questionId: newId,
          };
          setSelectedQuestionKey(`${sectionId}:${newId}`);
          return next;
        });
        showToast({ message: 'Star Rating question added', variant: 'success' });
        return;
      }

      if (typeId === 'smiley-rating') {
        const ts = Date.now();
        const newId = `q-new-${ts}`;
        setSections((prev) => {
          const next = prev.map((sec) => {
            if (sec.id !== sectionId) return sec;
            const nextNum = nextQuestionNumber(sec.questions);
            const newQuestion: SurveyQuestion = {
              id: newId,
              code: `Q${nextNum}`,
              number: nextNum,
              text: DEFAULT_SMILEY_RATING_QUESTION_TEXT,
              required: true,
              kind: 'smiley-rating',
              addQuestionTypeId: 'smiley-rating',
              options: [],
              smileyRating: createDefaultSmileyRatingData(),
            };
            return {
              ...sec,
              questions: insertQuestionAtIndex(sec.questions, insertIndex, newQuestion),
            };
          });
          pendingScrollQuestionRef.current = {
            sectionId,
            questionId: newId,
          };
          setSelectedQuestionKey(`${sectionId}:${newId}`);
          return next;
        });
        showToast({ message: 'Smiley Rating question added', variant: 'success' });
        return;
      }

      if (typeId === 'thumbs') {
        const ts = Date.now();
        const newId = `q-new-${ts}`;
        setSections((prev) => {
          const next = prev.map((sec) => {
            if (sec.id !== sectionId) return sec;
            const nextNum = nextQuestionNumber(sec.questions);
            const newQuestion: SurveyQuestion = {
              id: newId,
              code: `Q${nextNum}`,
              number: nextNum,
              text: DEFAULT_THUMBS_QUESTION_TEXT,
              required: true,
              kind: 'thumbs-up-down',
              addQuestionTypeId: 'thumbs',
              options: [],
              thumbsUpDown: createDefaultThumbsUpDownData(),
            };
            return {
              ...sec,
              questions: insertQuestionAtIndex(sec.questions, insertIndex, newQuestion),
            };
          });
          pendingScrollQuestionRef.current = {
            sectionId,
            questionId: newId,
          };
          setSelectedQuestionKey(`${sectionId}:${newId}`);
          return next;
        });
        showToast({ message: 'Thumbs Up/Down question added', variant: 'success' });
        return;
      }

      if (typeId === 'text-slider') {
        const ts = Date.now();
        const newId = `q-new-${ts}`;
        setSections((prev) => {
          const next = prev.map((sec) => {
            if (sec.id !== sectionId) return sec;
            const nextNum = nextQuestionNumber(sec.questions);
            const newQuestion: SurveyQuestion = {
              id: newId,
              code: `Q${nextNum}`,
              number: nextNum,
              text: DEFAULT_TEXT_SLIDER_QUESTION_TEXT,
              required: true,
              kind: 'text-slider',
              addQuestionTypeId: 'text-slider',
              options: [],
              matrix: createDefaultTextSliderMatrix(),
            };
            return {
              ...sec,
              questions: insertQuestionAtIndex(sec.questions, insertIndex, newQuestion),
            };
          });
          pendingScrollQuestionRef.current = {
            sectionId,
            questionId: newId,
          };
          setSelectedQuestionKey(`${sectionId}:${newId}`);
          return next;
        });
        showToast({ message: 'Text Slider question added', variant: 'success' });
        return;
      }

      if (typeId === 'numeric-slider') {
        const ts = Date.now();
        const newId = `q-new-${ts}`;
        setSections((prev) => {
          const next = prev.map((sec) => {
            if (sec.id !== sectionId) return sec;
            const nextNum = nextQuestionNumber(sec.questions);
            const newQuestion: SurveyQuestion = {
              id: newId,
              code: `Q${nextNum}`,
              number: nextNum,
              text: DEFAULT_NUMERIC_SLIDER_QUESTION_TEXT,
              required: true,
              kind: 'numeric-slider',
              addQuestionTypeId: 'numeric-slider',
              options: [],
              matrix: createDefaultNumericSliderMatrix(),
            };
            return {
              ...sec,
              questions: insertQuestionAtIndex(sec.questions, insertIndex, newQuestion),
            };
          });
          pendingScrollQuestionRef.current = {
            sectionId,
            questionId: newId,
          };
          setSelectedQuestionKey(`${sectionId}:${newId}`);
          return next;
        });
        showToast({ message: 'Numeric Slider question added', variant: 'success' });
        return;
      }

      if (typeId === 'image-select-one') {
        const ts = Date.now();
        const newId = `q-new-${ts}`;
        setSections((prev) => {
          const next = prev.map((sec) => {
            if (sec.id !== sectionId) return sec;
            const nextNum = nextQuestionNumber(sec.questions);
            const newQuestion: SurveyQuestion = {
              id: newId,
              code: `Q${nextNum}`,
              number: nextNum,
              text: DEFAULT_IMAGE_CHOOSER_SELECT_ONE_QUESTION_TEXT,
              required: true,
              kind: 'image-chooser-select-one',
              addQuestionTypeId: 'image-select-one',
              options: createDefaultImageChooserSelectOneOptions(),
            };
            return {
              ...sec,
              questions: insertQuestionAtIndex(sec.questions, insertIndex, newQuestion),
            };
          });
          pendingScrollQuestionRef.current = {
            sectionId,
            questionId: newId,
          };
          setSelectedQuestionKey(`${sectionId}:${newId}`);
          return next;
        });
        showToast({ message: 'Image Chooser Select One question added', variant: 'success' });
        return;
      }

      if (typeId === 'image-select-many') {
        const ts = Date.now();
        const newId = `q-new-${ts}`;
        setSections((prev) => {
          const next = prev.map((sec) => {
            if (sec.id !== sectionId) return sec;
            const nextNum = nextQuestionNumber(sec.questions);
            const newQuestion: SurveyQuestion = {
              id: newId,
              code: `Q${nextNum}`,
              number: nextNum,
              text: DEFAULT_IMAGE_CHOOSER_SELECT_MANY_QUESTION_TEXT,
              required: true,
              kind: 'image-chooser-select-many',
              addQuestionTypeId: 'image-select-many',
              options: createDefaultImageChooserSelectManyOptions(),
            };
            return {
              ...sec,
              questions: insertQuestionAtIndex(sec.questions, insertIndex, newQuestion),
            };
          });
          pendingScrollQuestionRef.current = {
            sectionId,
            questionId: newId,
          };
          setSelectedQuestionKey(`${sectionId}:${newId}`);
          return next;
        });
        showToast({ message: 'Image Chooser Select Many question added', variant: 'success' });
        return;
      }

      if (typeId === 'image-rating') {
        const ts = Date.now();
        const newId = `q-new-${ts}`;
        setSections((prev) => {
          const next = prev.map((sec) => {
            if (sec.id !== sectionId) return sec;
            const nextNum = nextQuestionNumber(sec.questions);
            const newQuestion: SurveyQuestion = {
              id: newId,
              code: `Q${nextNum}`,
              number: nextNum,
              text: DEFAULT_IMAGE_CHOOSER_RATING_QUESTION_TEXT,
              required: true,
              kind: 'image-chooser-rating',
              addQuestionTypeId: 'image-rating',
              options: [],
              matrix: createDefaultImageChooserRatingMatrix(),
            };
            return {
              ...sec,
              questions: insertQuestionAtIndex(sec.questions, insertIndex, newQuestion),
            };
          });
          pendingScrollQuestionRef.current = {
            sectionId,
            questionId: newId,
          };
          setSelectedQuestionKey(`${sectionId}:${newId}`);
          return next;
        });
        showToast({ message: 'Image Chooser Rating question added', variant: 'success' });
        return;
      }

      if (typeId === 'rank-order') {
        const ts = Date.now();
        const newId = `q-new-${ts}`;
        setSections((prev) => {
          const next = prev.map((sec) => {
            if (sec.id !== sectionId) return sec;
            const nextNum = nextQuestionNumber(sec.questions);
            const newQuestion: SurveyQuestion = {
              id: newId,
              code: `Q${nextNum}`,
              number: nextNum,
              text: DEFAULT_RANK_ORDER_QUESTION_TEXT,
              required: true,
              kind: 'rank-order',
              addQuestionTypeId: 'rank-order',
              options: createDefaultRankOrderOptions(),
            };
            return {
              ...sec,
              questions: insertQuestionAtIndex(sec.questions, insertIndex, newQuestion),
            };
          });
          pendingScrollQuestionRef.current = {
            sectionId,
            questionId: newId,
          };
          setSelectedQuestionKey(`${sectionId}:${newId}`);
          return next;
        });
        showToast({ message: 'Rank Order question added', variant: 'success' });
        return;
      }

      if (typeId === 'constant-sum') {
        const ts = Date.now();
        const newId = `q-new-${ts}`;
        setSections((prev) => {
          const next = prev.map((sec) => {
            if (sec.id !== sectionId) return sec;
            const nextNum = nextQuestionNumber(sec.questions);
            const newQuestion: SurveyQuestion = {
              id: newId,
              code: `Q${nextNum}`,
              number: nextNum,
              text: DEFAULT_CONSTANT_SUM_QUESTION_TEXT,
              required: true,
              kind: 'constant-sum',
              addQuestionTypeId: 'constant-sum',
              options: createDefaultConstantSumOptions(),
            };
            return {
              ...sec,
              questions: insertQuestionAtIndex(sec.questions, insertIndex, newQuestion),
            };
          });
          pendingScrollQuestionRef.current = {
            sectionId,
            questionId: newId,
          };
          setSelectedQuestionKey(`${sectionId}:${newId}`);
          return next;
        });
        showToast({ message: 'Constant Sum question added', variant: 'success' });
        return;
      }

      if (typeId === 'drag-drop') {
        const ts = Date.now();
        const newId = `q-new-${ts}`;
        setSections((prev) => {
          const next = prev.map((sec) => {
            if (sec.id !== sectionId) return sec;
            const nextNum = nextQuestionNumber(sec.questions);
            const newQuestion: SurveyQuestion = {
              id: newId,
              code: `Q${nextNum}`,
              number: nextNum,
              text: DEFAULT_DRAG_DROP_QUESTION_TEXT,
              required: true,
              kind: 'drag-drop',
              addQuestionTypeId: 'drag-drop',
              options: [],
              matrix: createDefaultDragDropMatrix(),
            };
            return {
              ...sec,
              questions: insertQuestionAtIndex(sec.questions, insertIndex, newQuestion),
            };
          });
          pendingScrollQuestionRef.current = {
            sectionId,
            questionId: newId,
          };
          setSelectedQuestionKey(`${sectionId}:${newId}`);
          return next;
        });
        showToast({ message: 'Drag and Drop question added', variant: 'success' });
        return;
      }

      if (
        typeId === 'presentation' ||
        typeId === 'section-heading' ||
        typeId === 'section-subheading'
      ) {
        const ts = Date.now();
        const newId = `q-new-${ts}`;
        const toastLabel =
          typeId === 'presentation'
            ? 'Presentation Text'
            : typeId === 'section-heading'
              ? 'Section Heading'
              : 'Section Sub-Heading';
        setSections((prev) => {
          const next = prev.map((sec) => {
            if (sec.id !== sectionId) return sec;
            const nextNum = nextQuestionNumber(sec.questions);
            const newQuestion: SurveyQuestion = {
              id: newId,
              code: `Q${nextNum}`,
              number: nextNum,
              text: '',
              kind: typeId,
              addQuestionTypeId: typeId,
              options: [],
            };
            return {
              ...sec,
              questions: insertQuestionAtIndex(sec.questions, insertIndex, newQuestion),
            };
          });
          pendingScrollQuestionRef.current = {
            sectionId,
            questionId: newId,
          };
          setSelectedQuestionKey(`${sectionId}:${newId}`);
          return next;
        });
        showToast({ message: `${toastLabel} added`, variant: 'success' });
        return;
      }

      if (typeId === 'multi-point') {
        const ts = Date.now();
        const newId = `q-new-${ts}`;
        setSettingsTarget(null);
        setSections((prev) => {
          const next = prev.map((sec) => {
            if (sec.id !== sectionId) return sec;
            const nextNum = nextQuestionNumber(sec.questions);
            const newQuestion: SurveyQuestion = {
              id: newId,
              code: `Q${nextNum}`,
              number: nextNum,
              text: DEFAULT_MULTI_POINT_QUESTION_TEXT,
              required: true,
              kind: 'multi-point-scales',
              addQuestionTypeId: 'multi-point',
              options: [],
              matrix: createDefaultMultiPointMatrix(),
            };
            return {
              ...sec,
              questions: insertQuestionAtIndex(sec.questions, insertIndex, newQuestion),
            };
          });
          const questionKey = `${sectionId}:${newId}`;
          pendingScrollQuestionRef.current = {
            sectionId,
            questionId: newId,
          };
          setSelectedQuestionKey(questionKey);
          setSettingsTarget({ sectionId, questionId: newId });
          setMultiPointSettingsByKey((settings) => ({
            ...settings,
            [questionKey]: DEFAULT_NEW_MULTI_POINT_QUESTION_SETTINGS,
          }));
          return next;
        });
        showToast({ message: 'Multi-Point Scales question added', variant: 'success' });
        return;
      }

      if (typeId === 'multi-select-matrix') {
        const ts = Date.now();
        const newId = `q-new-${ts}`;
        setSections((prev) => {
          const next = prev.map((sec) => {
            if (sec.id !== sectionId) return sec;
            const nextNum = nextQuestionNumber(sec.questions);
            const newQuestion: SurveyQuestion = {
              id: newId,
              code: `Q${nextNum}`,
              number: nextNum,
              text: DEFAULT_MATRIX_MULTI_SELECT_QUESTION_TEXT,
              required: true,
              kind: 'matrix-multi-select',
              addQuestionTypeId: 'multi-select-matrix',
              options: [],
              matrix: createDefaultMatrixMultiSelectMatrix(),
            };
            return {
              ...sec,
              questions: insertQuestionAtIndex(sec.questions, insertIndex, newQuestion),
            };
          });
          pendingScrollQuestionRef.current = {
            sectionId,
            questionId: newId,
          };
          setSelectedQuestionKey(`${sectionId}:${newId}`);
          return next;
        });
        showToast({ message: 'Basic Matrix Multi-Select question added', variant: 'success' });
        return;
      }

      if (typeId === 'spreadsheet') {
        const ts = Date.now();
        const newId = `q-new-${ts}`;
        setSections((prev) => {
          const next = prev.map((sec) => {
            if (sec.id !== sectionId) return sec;
            const nextNum = nextQuestionNumber(sec.questions);
            const newQuestion: SurveyQuestion = {
              id: newId,
              code: `Q${nextNum}`,
              number: nextNum,
              text: DEFAULT_MATRIX_SPREADSHEET_QUESTION_TEXT,
              required: true,
              kind: 'matrix-spreadsheet',
              addQuestionTypeId: 'spreadsheet',
              options: [],
              matrix: createDefaultMatrixSpreadsheetMatrix(),
            };
            return {
              ...sec,
              questions: insertQuestionAtIndex(sec.questions, insertIndex, newQuestion),
            };
          });
          pendingScrollQuestionRef.current = {
            sectionId,
            questionId: newId,
          };
          setSelectedQuestionKey(`${sectionId}:${newId}`);
          return next;
        });
        showToast({ message: 'Spreadsheet question added', variant: 'success' });
        return;
      }

      if (typeId === 'nps') {
        const ts = Date.now();
        const newId = `q-new-${ts}`;
        setSections((prev) => {
          const next = prev.map((sec) => {
            if (sec.id !== sectionId) return sec;
            const nextNum = nextQuestionNumber(sec.questions);
            const newQuestion: SurveyQuestion = {
              id: newId,
              code: `Q${nextNum}`,
              number: nextNum,
              text: `Question ${nextNum}`,
              required: true,
              kind: 'nps',
              addQuestionTypeId: 'nps',
              options: [],
              nps: {
                minLabel: DEFAULT_NPS_MIN_LABEL,
                maxLabel: DEFAULT_NPS_MAX_LABEL,
              },
            };
            return {
              ...sec,
              questions: insertQuestionAtIndex(sec.questions, insertIndex, newQuestion),
            };
          });
          pendingScrollQuestionRef.current = {
            sectionId,
            questionId: newId,
          };
          setSelectedQuestionKey(`${sectionId}:${newId}`);
          return next;
        });
        showToast({ message: 'Net Promoter Score question added', variant: 'success' });
        return;
      }

      if (typeId === 'lookup-table') {
        const ts = Date.now();
        const newId = `q-new-${ts}`;
        setSections((prev) => {
          const next = prev.map((sec) => {
            if (sec.id !== sectionId) return sec;
            const nextNum = nextQuestionNumber(sec.questions);
            const newQuestion: SurveyQuestion = {
              id: newId,
              code: `Q${nextNum}`,
              number: nextNum,
              text: DEFAULT_LOOKUP_TABLE_QUESTION_TEXT,
              required: true,
              kind: 'lookup-table',
              addQuestionTypeId: 'lookup-table',
              options: createDefaultLookupTableOptions(),
              lookupTable: createDefaultLookupTableData(),
            };
            return {
              ...sec,
              questions: insertQuestionAtIndex(sec.questions, insertIndex, newQuestion),
            };
          });
          pendingScrollQuestionRef.current = {
            sectionId,
            questionId: newId,
          };
          setSelectedQuestionKey(`${sectionId}:${newId}`);
          return next;
        });
        showToast({ message: 'Lookup Table question added', variant: 'success' });
        return;
      }

      if (typeId === 'van-westendorp') {
        const ts = Date.now();
        const newId = `q-new-${ts}`;
        setSections((prev) => {
          const next = prev.map((sec) => {
            if (sec.id !== sectionId) return sec;
            const nextNum = nextQuestionNumber(sec.questions);
            const newQuestion: SurveyQuestion = {
              id: newId,
              code: `Q${nextNum}`,
              number: nextNum,
              text: DEFAULT_VAN_WESTENDORP_QUESTION_TEXT,
              required: true,
              kind: 'van-westendorp',
              addQuestionTypeId: 'van-westendorp',
              options: [],
              vanWestendorp: createDefaultVanWestendorpData(),
            };
            return {
              ...sec,
              questions: insertQuestionAtIndex(sec.questions, insertIndex, newQuestion),
            };
          });
          pendingScrollQuestionRef.current = {
            sectionId,
            questionId: newId,
          };
          setSelectedQuestionKey(`${sectionId}:${newId}`);
          return next;
        });
        showToast({ message: 'Van Westendorp question added', variant: 'success' });
        return;
      }

      if (typeId === 'captcha') {
        const ts = Date.now();
        const newId = `q-new-${ts}`;
        setSections((prev) => {
          const next = prev.map((sec) => {
            if (sec.id !== sectionId) return sec;
            const nextNum = nextQuestionNumber(sec.questions);
            const newQuestion: SurveyQuestion = {
              id: newId,
              code: `Q${nextNum}`,
              number: nextNum,
              text: DEFAULT_CAPTCHA_QUESTION_TEXT,
              required: true,
              addQuestionTypeId: 'captcha',
              options: [],
            };
            return {
              ...sec,
              questions: insertQuestionAtIndex(sec.questions, insertIndex, newQuestion),
            };
          });
          pendingScrollQuestionRef.current = {
            sectionId,
            questionId: newId,
          };
          setSelectedQuestionKey(`${sectionId}:${newId}`);
          return next;
        });
        showToast({ message: 'Captcha question added', variant: 'success' });
        return;
      }

      {
        const preview = getQuestionTypePreview(typeId, category, typeLabel);
        const ts = Date.now();
        const newId = `q-new-${ts}`;
        setSections((prev) => {
          const next = prev.map((sec) => {
            if (sec.id !== sectionId) return sec;
            const nextNum = nextQuestionNumber(sec.questions);
            const newQuestion: SurveyQuestion = {
              id: newId,
              code: `Q${nextNum}`,
              number: nextNum,
              text: preview.question,
              required: true,
              addQuestionTypeId: typeId,
              options: (preview.options ?? []).map((label, index) => ({
                id: `opt-${ts}-${index + 1}`,
                label,
              })),
            };
            return {
              ...sec,
              questions: insertQuestionAtIndex(sec.questions, insertIndex, newQuestion),
            };
          });
          pendingScrollQuestionRef.current = {
            sectionId,
            questionId: newId,
          };
          setSelectedQuestionKey(`${sectionId}:${newId}`);
          return next;
        });
        showToast({ message: `${typeLabel} question added`, variant: 'success' });
      }
    },
    [showToast]
  );

  return (
    <div
      className={`${styles.canvas} ${
        settingsQuestion ? styles.canvasWithSettings : ''
      }`}
    >
      <SurveyAgentSidebar
        open={surveyAgentOpen}
        surveyId={detail.survey.id}
        onClose={() => setSurveyAgentOpen(false)}
      />

      <div className={styles.canvasMain}>
      <div className={styles.workspace}>
        <div className={styles.titleCard}>
          <button type="button" className={styles.addLogoBtn} onClick={() => toast('Add logo')}>
            Add Logo
          </button>
          <h1 className={styles.title}>{detail.editorTitle}</h1>
        </div>

        <div className={styles.addBlockRow}>
          <WuButton size="sm" variant="secondary" onClick={() => toast('Add block')}>
            <span className="wm-add" />
            Add Block
          </WuButton>
        </div>

        {sections.map((section) => (
          <section key={section.id} className={styles.sectionCard}>
            <div className={styles.sectionBlockSurface}>
              <header className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>{section.title}</h2>
                <button
                  type="button"
                  className={styles.menuBtn}
                  aria-label="Block options"
                  onClick={() => toast(`${section.title} block options`)}
                >
                  <span className="wm-more-vert" />
                </button>
              </header>

              <div className={styles.sectionQuestionCanvas}>
                <div className={styles.sectionQuestionSheet}>
                  <AddQuestionToolbar
                    sectionId={section.id}
                    insertIndex={0}
                    hasPageBreak={hasPageBreakAtSlot(
                      pageBreakBySlotKey,
                      getPageBreakSlotKey(section.id, 0, section.questions)
                    )}
                    onSelect={handleAddQuestionSelect}
                    onPageControl={handlePageControl}
                    onTogglePageBreak={() => handleTogglePageBreak(section.id, 0)}
                  />

                  {section.questions.map((question, questionIndex) => {
                    const questionKey = `${section.id}:${question.id}`;
                    const isSelected = selectedQuestionKey === questionKey;
                    const isMultiPoint = isMultiPointScalesQuestion(question);
                    const isMatrixMultiSelect = isMatrixMultiSelectQuestion(question);
                    const isMatrixSpreadsheet = isMatrixSpreadsheetQuestion(question);
                    const isNps = isNpsQuestion(question);
                    const isVanWestendorp = isVanWestendorpQuestion(question);
                    const isLookupTable = isLookupTableQuestion(question);
                    const isDropdown = isDropdownQuestion(question);
                    const isCommentBox = isCommentBoxQuestion(question);
                    const isCaptcha = isCaptchaQuestion(question);
                    const isSingleRowText = isSingleRowTextQuestion(question);
                    const isEmailAddress = isEmailAddressQuestion(question);
                    const isContactInformation = isContactInformationQuestion(question);
                    const isStarRating = isStarRatingQuestion(question);
                    const isSmileyRating = isSmileyRatingQuestion(question);
                    const isThumbsUpDown = isThumbsUpDownQuestion(question);
                    const isTextSlider = isTextSliderQuestion(question);
                    const isNumericSlider = isNumericSliderQuestion(question);
                    const isImageChooserSelectOne = isImageChooserSelectOneQuestion(question);
                    const isImageChooserSelectMany = isImageChooserSelectManyQuestion(question);
                    const isImageChooserRating = isImageChooserRatingQuestion(question);
                    const isRankOrder = isRankOrderQuestion(question);
                    const isConstantSum = isConstantSumQuestion(question);
                    const isDragDrop = isDragDropQuestion(question);
                    const isStaticContent = isStaticContentQuestion(question);
                    const isSelectOne = isSelectOneQuestion(question);
                    const multiPointSettings = getMultiPointSettings(questionKey);
                    const captchaSettings = getCaptchaSettings(questionKey);
                    const savedLogic = logicByQuestionKey[questionKey];
                    const questionOptionIds = question.options.map((option) => option.id);
                    const showHideOptionsApplied =
                      savedLogic != null &&
                      isShowHideOptionsLogicApplied(savedLogic, questionOptionIds);
                    const quotaControlApplied =
                      savedLogic != null &&
                      isQuotaControlConfigured(savedLogic, questionOptionIds);
                    const dynamicTextCommentsApplied =
                      savedLogic != null &&
                      isDynamicTextCommentsConfigured(savedLogic, questionOptionIds);
                    const dynamicTextEnabledByOptionId =
                      savedLogic != null
                        ? getDynamicTextEnabledByOptionId(savedLogic, questionOptionIds)
                        : {};
                    const extractionApplied =
                      savedLogic != null &&
                      !question.extractionSource &&
                      isExtractionLogicApplied(savedLogic);
                    const quotaOptionLabels =
                      savedLogic != null
                        ? getQuotaControlOptionLabels(savedLogic, questionOptionIds)
                        : {};
                    const extractionOptionLabels =
                      savedLogic != null && !question.extractionSource
                        ? getExtractionOptionLabels(
                            savedLogic,
                            question.code,
                            questionOptionIds
                          )
                        : {};
                    const extractionRowProps = question.extractionSource
                      ? {
                          extractionSource: question.extractionSource,
                          onModifyExtraction: () =>
                            handleModifyExtraction(
                              section.id,
                              question.extractionSource!.sourceQuestionId
                            ),
                          onExtractionSourceClick: () =>
                            handleExtractionSourceClick(
                              section.id,
                              question.extractionSource!.sourceQuestionId
                            ),
                        }
                      : {};
                    return (
                      <Fragment key={question.id}>
                        <div
                          id={`survey-question-${section.id}-${question.id}`}
                          className={`${styles.questionBlock} ${
                            question.inputKind === 'checkbox' ? styles.questionBlockSelectMany : ''
                          } ${isSelectOne ? styles.questionBlockSelectOne : ''} ${
                            isMultiPoint ? styles.questionBlockMultiPoint : ''
                          } ${isMatrixMultiSelect ? styles.questionBlockMatrixMultiSelect : ''} ${
                            isMatrixSpreadsheet ? styles.questionBlockMatrixSpreadsheet : ''
                          } ${isVanWestendorp ? styles.questionBlockVanWestendorp : ''} ${
                            isDropdown ? styles.questionBlockDropdown : ''
                          } ${isCommentBox ? styles.questionBlockCommentBox : ''} ${
                            isCaptcha ? styles.questionBlockSingleRowText : ''
                          } ${isSingleRowText ? styles.questionBlockSingleRowText : ''} ${
                            isEmailAddress ? styles.questionBlockEmailAddress : ''
                          } ${isContactInformation ? styles.questionBlockContactInformation : ''} ${
                            isStarRating ? styles.questionBlockStarRating : ''
                          } ${isSmileyRating ? styles.questionBlockSmileyRating : ''} ${
                            isThumbsUpDown ? styles.questionBlockThumbsUpDown : ''
                          } ${isTextSlider ? styles.questionBlockTextSlider : ''} ${
                            isNumericSlider ? styles.questionBlockNumericSlider : ''
                          } ${
                            isImageChooserSelectOne ? styles.questionBlockImageChooserSelectOne : ''
                          } ${
                            isImageChooserSelectMany ? styles.questionBlockImageChooserSelectMany : ''
                          } ${
                            isImageChooserRating ? styles.questionBlockImageChooserRating : ''
                          } ${isRankOrder ? styles.questionBlockRankOrder : ''} ${
                            isConstantSum ? styles.questionBlockConstantSum : ''
                          } ${isDragDrop ? styles.questionBlockDragDrop : ''} ${
                            isStaticContent ? styles.questionBlockStaticContent : ''
                          } ${
                            isSelected ? styles.questionBlockSelected : ''
                          }`}
                        >
                          <div
                            className={styles.questionCodeColumn}
                            onClick={() => setSelectedQuestionKey(questionKey)}
                          >
                            <QuestionCodeField
                              sectionId={section.id}
                              question={question}
                              onCodeChange={handleQuestionCodeChange}
                            />
                          </div>
                          <div
                            className={styles.questionShell}
                            onClick={() => setSelectedQuestionKey(questionKey)}
                          >
                            {isNps ? (
                              <NpsQuestionRow
                                question={question}
                                sectionId={section.id}
                                showHideOptionsApplied={showHideOptionsApplied}
                                onAction={(label) =>
                                  toast(`${label}: ${plainTextFromRichValue(question.text)}`)
                                }
                                onMenuAction={(action) =>
                                  handleQuestionMenuAction(section.id, question.id, action)
                                }
                                onOpenLogic={() => handleOpenLogic(section.id, question.id)}
                                onOpenSettings={() =>
                                  handleOpenSettings(section.id, question.id)
                                }
                                onQuestionTextChange={handleQuestionTextChange}
                              />
                            ) : isLookupTable ? (
                              <LookupTableQuestionRow
                                question={question}
                                sectionId={section.id}
                                showHideOptionsApplied={showHideOptionsApplied}
                                onAction={(label) =>
                                  toast(`${label}: ${plainTextFromRichValue(question.text)}`)
                                }
                                onMenuAction={(action) =>
                                  handleQuestionMenuAction(section.id, question.id, action)
                                }
                                onOpenLogic={() => handleOpenLogic(section.id, question.id)}
                                onOpenSettings={() =>
                                  handleOpenSettings(section.id, question.id)
                                }
                                onOpenValidation={() =>
                                  handleOpenValidation(section.id, question.id)
                                }
                                onEditLookupTable={() => toast('Edit lookup table')}
                                onBulkEdit={handleBulkEdit}
                                onQuestionTextChange={handleQuestionTextChange}
                              />
                            ) : isDropdown ? (
                              <DropdownQuestionRow
                                question={question}
                                sectionId={section.id}
                                showHideOptionsApplied={showHideOptionsApplied}
                                dynamicTextCommentsApplied={dynamicTextCommentsApplied}
                                extractionApplied={extractionApplied}
                                quotaControlApplied={quotaControlApplied}
                                onAction={(label) =>
                                  toast(`${label}: ${plainTextFromRichValue(question.text)}`)
                                }
                                onMenuAction={(action) =>
                                  handleQuestionMenuAction(section.id, question.id, action)
                                }
                                onOpenLogic={() => handleOpenLogic(section.id, question.id)}
                                onOpenSettings={() =>
                                  handleOpenSettings(section.id, question.id)
                                }
                                onOpenValidation={() =>
                                  handleOpenValidation(section.id, question.id)
                                }
                                onBulkEdit={handleBulkEdit}
                                onQuestionTextChange={handleQuestionTextChange}
                              />
                            ) : isCaptcha ? (
                              <CaptchaQuestionRow
                                question={question}
                                sectionId={section.id}
                                recaptchaType={captchaSettings.recaptchaType}
                                captchaFeedbackStyle={captchaSettings.captchaFeedbackStyle}
                                showV2OnV3VerificationFailed={
                                  captchaSettings.showV2OnV3VerificationFailed
                                }
                                showHideOptionsApplied={showHideOptionsApplied}
                                onAction={(label) =>
                                  toast(`${label}: ${plainTextFromRichValue(question.text)}`)
                                }
                                onMenuAction={(action) =>
                                  handleQuestionMenuAction(section.id, question.id, action)
                                }
                                onOpenLogic={() => handleOpenLogic(section.id, question.id)}
                                onOpenSettings={() =>
                                  handleOpenSettings(section.id, question.id)
                                }
                                onOpenValidation={() =>
                                  handleOpenValidation(section.id, question.id)
                                }
                                onQuestionTextChange={handleQuestionTextChange}
                              />
                            ) : isCommentBox ? (
                              <CommentBoxQuestionRow
                                question={question}
                                sectionId={section.id}
                                showHideOptionsApplied={showHideOptionsApplied}
                                dynamicTextCommentsApplied={dynamicTextCommentsApplied}
                                extractionApplied={extractionApplied}
                                quotaControlApplied={quotaControlApplied}
                                onAction={(label) =>
                                  toast(`${label}: ${plainTextFromRichValue(question.text)}`)
                                }
                                onMenuAction={(action) =>
                                  handleQuestionMenuAction(section.id, question.id, action)
                                }
                                onOpenLogic={() => handleOpenLogic(section.id, question.id)}
                                onOpenSettings={() =>
                                  handleOpenSettings(section.id, question.id)
                                }
                                onOpenValidation={() =>
                                  handleOpenValidation(section.id, question.id)
                                }
                                onAddAnswerRow={() => toast('Add answer row')}
                                onQuestionTextChange={handleQuestionTextChange}
                              />
                            ) : isSingleRowText ? (
                              <SingleRowTextQuestionRow
                                question={question}
                                sectionId={section.id}
                                showHideOptionsApplied={showHideOptionsApplied}
                                dynamicTextCommentsApplied={dynamicTextCommentsApplied}
                                extractionApplied={extractionApplied}
                                quotaControlApplied={quotaControlApplied}
                                onAction={(label) =>
                                  toast(`${label}: ${plainTextFromRichValue(question.text)}`)
                                }
                                onMenuAction={(action) =>
                                  handleQuestionMenuAction(section.id, question.id, action)
                                }
                                onOpenLogic={() => handleOpenLogic(section.id, question.id)}
                                onOpenSettings={() =>
                                  handleOpenSettings(section.id, question.id)
                                }
                                onOpenValidation={() =>
                                  handleOpenValidation(section.id, question.id)
                                }
                                onAddAnswerRow={() => toast('Add answer row')}
                                onQuestionTextChange={handleQuestionTextChange}
                              />
                            ) : isEmailAddress ? (
                              <EmailAddressQuestionRow
                                question={question}
                                sectionId={section.id}
                                showHideOptionsApplied={showHideOptionsApplied}
                                dynamicTextCommentsApplied={dynamicTextCommentsApplied}
                                extractionApplied={extractionApplied}
                                quotaControlApplied={quotaControlApplied}
                                onAction={(label) =>
                                  toast(`${label}: ${plainTextFromRichValue(question.text)}`)
                                }
                                onMenuAction={(action) =>
                                  handleQuestionMenuAction(section.id, question.id, action)
                                }
                                onOpenLogic={() => handleOpenLogic(section.id, question.id)}
                                onOpenSettings={() =>
                                  handleOpenSettings(section.id, question.id)
                                }
                                onOpenValidation={() =>
                                  handleOpenValidation(section.id, question.id)
                                }
                                onAddAnswerRow={() => toast('Add answer row')}
                                onQuestionTextChange={handleQuestionTextChange}
                              />
                            ) : isContactInformation ? (
                              <ContactInformationQuestionRow
                                question={question}
                                sectionId={section.id}
                                showHideOptionsApplied={showHideOptionsApplied}
                                dynamicTextCommentsApplied={dynamicTextCommentsApplied}
                                extractionApplied={extractionApplied}
                                quotaControlApplied={quotaControlApplied}
                                onAction={(label) =>
                                  toast(`${label}: ${plainTextFromRichValue(question.text)}`)
                                }
                                onMenuAction={(action) =>
                                  handleQuestionMenuAction(section.id, question.id, action)
                                }
                                onOpenLogic={() => handleOpenLogic(section.id, question.id)}
                                onOpenSettings={() =>
                                  handleOpenSettings(section.id, question.id)
                                }
                                onOpenValidation={() =>
                                  handleOpenValidation(section.id, question.id)
                                }
                                onAddField={() => toast('Add contact field')}
                                onQuestionTextChange={handleQuestionTextChange}
                              />
                            ) : isStarRating && question.matrix ? (
                              <StarRatingQuestionRow
                                question={question}
                                matrix={question.matrix}
                                sectionId={section.id}
                                showHideOptionsApplied={showHideOptionsApplied}
                                dynamicTextCommentsApplied={dynamicTextCommentsApplied}
                                extractionApplied={extractionApplied}
                                quotaControlApplied={quotaControlApplied}
                                onAction={(label) =>
                                  toast(`${label}: ${plainTextFromRichValue(question.text)}`)
                                }
                                onMenuAction={(action) =>
                                  handleQuestionMenuAction(section.id, question.id, action)
                                }
                                onOpenLogic={() => handleOpenLogic(section.id, question.id)}
                                onOpenSettings={() =>
                                  handleOpenSettings(section.id, question.id)
                                }
                                onOpenValidation={() =>
                                  handleOpenValidation(section.id, question.id)
                                }
                                onQuestionTextChange={handleQuestionTextChange}
                                onMatrixRowLabelChange={handleMatrixRowLabelChange}
                                onAddRow={handleAddMatrixRow}
                                onBulkEditRows={(secId, qId) =>
                                  setBulkEditMatrixTarget({
                                    sectionId: secId,
                                    questionId: qId,
                                    target: 'rows',
                                  })
                                }
                              />
                            ) : isSmileyRating && question.smileyRating ? (
                              <SmileyRatingQuestionRow
                                question={question}
                                smileyRating={question.smileyRating}
                                sectionId={section.id}
                                showHideOptionsApplied={showHideOptionsApplied}
                                dynamicTextCommentsApplied={dynamicTextCommentsApplied}
                                extractionApplied={extractionApplied}
                                quotaControlApplied={quotaControlApplied}
                                onAction={(label) =>
                                  toast(`${label}: ${plainTextFromRichValue(question.text)}`)
                                }
                                onMenuAction={(action) =>
                                  handleQuestionMenuAction(section.id, question.id, action)
                                }
                                onOpenLogic={() => handleOpenLogic(section.id, question.id)}
                                onOpenSettings={() =>
                                  handleOpenSettings(section.id, question.id)
                                }
                                onOpenValidation={() =>
                                  handleOpenValidation(section.id, question.id)
                                }
                                onQuestionTextChange={handleQuestionTextChange}
                                onSmileyOptionLabelChange={handleSmileyOptionLabelChange}
                              />
                            ) : isThumbsUpDown && question.thumbsUpDown ? (
                              <ThumbsUpDownQuestionRow
                                question={question}
                                thumbsUpDown={question.thumbsUpDown}
                                sectionId={section.id}
                                showHideOptionsApplied={showHideOptionsApplied}
                                dynamicTextCommentsApplied={dynamicTextCommentsApplied}
                                extractionApplied={extractionApplied}
                                quotaControlApplied={quotaControlApplied}
                                onAction={(label) =>
                                  toast(`${label}: ${plainTextFromRichValue(question.text)}`)
                                }
                                onMenuAction={(action) =>
                                  handleQuestionMenuAction(section.id, question.id, action)
                                }
                                onOpenLogic={() => handleOpenLogic(section.id, question.id)}
                                onOpenSettings={() =>
                                  handleOpenSettings(section.id, question.id)
                                }
                                onOpenValidation={() =>
                                  handleOpenValidation(section.id, question.id)
                                }
                                onQuestionTextChange={handleQuestionTextChange}
                                onThumbsChoiceLabelChange={handleThumbsChoiceLabelChange}
                              />
                            ) : isStaticContent ? (
                              <StaticContentQuestionRow
                                question={question}
                                sectionId={section.id}
                                variant={resolveStaticContentVariant(question)}
                                showHideOptionsApplied={showHideOptionsApplied}
                                onAction={(label) =>
                                  toast(`${label}: ${plainTextFromRichValue(question.text)}`)
                                }
                                onMenuAction={(action) =>
                                  handleQuestionMenuAction(section.id, question.id, action)
                                }
                                onOpenLogic={() => handleOpenLogic(section.id, question.id)}
                                onOpenSettings={() =>
                                  handleOpenSettings(section.id, question.id)
                                }
                                onQuestionTextChange={handleQuestionTextChange}
                              />
                            ) : isDragDrop && question.matrix ? (
                              <DragDropQuestionRow
                                question={question}
                                matrix={question.matrix}
                                sectionId={section.id}
                                showHideOptionsApplied={showHideOptionsApplied}
                                dynamicTextCommentsApplied={dynamicTextCommentsApplied}
                                extractionApplied={extractionApplied}
                                quotaControlApplied={quotaControlApplied}
                                onAction={(label) =>
                                  toast(`${label}: ${plainTextFromRichValue(question.text)}`)
                                }
                                onMenuAction={(action) =>
                                  handleQuestionMenuAction(section.id, question.id, action)
                                }
                                onOpenLogic={() => handleOpenLogic(section.id, question.id)}
                                onOpenSettings={() =>
                                  handleOpenSettings(section.id, question.id)
                                }
                                onOpenValidation={() =>
                                  handleOpenValidation(section.id, question.id)
                                }
                                onQuestionTextChange={handleQuestionTextChange}
                                onMatrixAnchorChange={handleMatrixAnchorChange}
                                onMatrixRowLabelChange={handleMatrixRowLabelChange}
                                onAddRow={handleAddMatrixRow}
                                onBulkEditRows={(secId, qId) =>
                                  setBulkEditMatrixTarget({
                                    sectionId: secId,
                                    questionId: qId,
                                    target: 'rows',
                                  })
                                }
                              />
                            ) : isConstantSum ? (
                              <ConstantSumQuestionRow
                                question={question}
                                sectionId={section.id}
                                showHideOptionsApplied={showHideOptionsApplied}
                                dynamicTextCommentsApplied={dynamicTextCommentsApplied}
                                extractionApplied={extractionApplied}
                                quotaControlApplied={quotaControlApplied}
                                onAction={(label) =>
                                  toast(`${label}: ${plainTextFromRichValue(question.text)}`)
                                }
                                onMenuAction={(action) =>
                                  handleQuestionMenuAction(section.id, question.id, action)
                                }
                                onOpenLogic={() => handleOpenLogic(section.id, question.id)}
                                onOpenSettings={() =>
                                  handleOpenSettings(section.id, question.id)
                                }
                                onOpenValidation={() =>
                                  handleOpenValidation(section.id, question.id)
                                }
                                onQuestionTextChange={handleQuestionTextChange}
                                onOptionLabelChange={handleOptionLabelChange}
                                onAddOption={handleAddOption}
                                onBulkEdit={handleBulkEdit}
                              />
                            ) : isRankOrder ? (
                              <RankOrderQuestionRow
                                question={question}
                                sectionId={section.id}
                                showHideOptionsApplied={showHideOptionsApplied}
                                dynamicTextCommentsApplied={dynamicTextCommentsApplied}
                                extractionApplied={extractionApplied}
                                quotaControlApplied={quotaControlApplied}
                                onAction={(label) =>
                                  toast(`${label}: ${plainTextFromRichValue(question.text)}`)
                                }
                                onMenuAction={(action) =>
                                  handleQuestionMenuAction(section.id, question.id, action)
                                }
                                onOpenLogic={() => handleOpenLogic(section.id, question.id)}
                                onOpenSettings={() =>
                                  handleOpenSettings(section.id, question.id)
                                }
                                onOpenValidation={() =>
                                  handleOpenValidation(section.id, question.id)
                                }
                                onQuestionTextChange={handleQuestionTextChange}
                                onOptionLabelChange={handleOptionLabelChange}
                                onAddOption={handleAddOption}
                                onBulkEdit={handleBulkEdit}
                              />
                            ) : isImageChooserRating && question.matrix ? (
                              <ImageChooserRatingQuestionRow
                                question={question}
                                matrix={question.matrix}
                                sectionId={section.id}
                                showHideOptionsApplied={showHideOptionsApplied}
                                dynamicTextCommentsApplied={dynamicTextCommentsApplied}
                                extractionApplied={extractionApplied}
                                quotaControlApplied={quotaControlApplied}
                                onAction={(label) =>
                                  toast(`${label}: ${plainTextFromRichValue(question.text)}`)
                                }
                                onMenuAction={(action) =>
                                  handleQuestionMenuAction(section.id, question.id, action)
                                }
                                onOpenLogic={() => handleOpenLogic(section.id, question.id)}
                                onOpenSettings={() =>
                                  handleOpenSettings(section.id, question.id)
                                }
                                onOpenValidation={() =>
                                  handleOpenValidation(section.id, question.id)
                                }
                                onQuestionTextChange={handleQuestionTextChange}
                                onMatrixRowLabelChange={handleMatrixRowLabelChange}
                                onEditImage={() => toast('Edit image')}
                                onAddRow={handleAddMatrixRow}
                                onBulkEditRows={(secId, qId) =>
                                  setBulkEditMatrixTarget({
                                    sectionId: secId,
                                    questionId: qId,
                                    target: 'rows',
                                  })
                                }
                                onBulkEditColumns={(secId, qId) =>
                                  setBulkEditMatrixTarget({
                                    sectionId: secId,
                                    questionId: qId,
                                    target: 'columns',
                                  })
                                }
                              />
                            ) : isImageChooserSelectMany ? (
                              <ImageChooserSelectManyQuestionRow
                                question={question}
                                sectionId={section.id}
                                showHideOptionsApplied={showHideOptionsApplied}
                                dynamicTextCommentsApplied={dynamicTextCommentsApplied}
                                extractionApplied={extractionApplied}
                                quotaControlApplied={quotaControlApplied}
                                onAction={(label) =>
                                  toast(`${label}: ${plainTextFromRichValue(question.text)}`)
                                }
                                onMenuAction={(action) =>
                                  handleQuestionMenuAction(section.id, question.id, action)
                                }
                                onOpenLogic={() => handleOpenLogic(section.id, question.id)}
                                onOpenSettings={() =>
                                  handleOpenSettings(section.id, question.id)
                                }
                                onOpenValidation={() =>
                                  handleOpenValidation(section.id, question.id)
                                }
                                onQuestionTextChange={handleQuestionTextChange}
                                onOptionLabelChange={handleOptionLabelChange}
                                onEditImage={() => toast('Edit image')}
                                onAddOption={handleAddOption}
                                onBulkEdit={handleBulkEdit}
                              />
                            ) : isImageChooserSelectOne ? (
                              <ImageChooserSelectOneQuestionRow
                                question={question}
                                sectionId={section.id}
                                showHideOptionsApplied={showHideOptionsApplied}
                                dynamicTextCommentsApplied={dynamicTextCommentsApplied}
                                extractionApplied={extractionApplied}
                                quotaControlApplied={quotaControlApplied}
                                onAction={(label) =>
                                  toast(`${label}: ${plainTextFromRichValue(question.text)}`)
                                }
                                onMenuAction={(action) =>
                                  handleQuestionMenuAction(section.id, question.id, action)
                                }
                                onOpenLogic={() => handleOpenLogic(section.id, question.id)}
                                onOpenSettings={() =>
                                  handleOpenSettings(section.id, question.id)
                                }
                                onOpenValidation={() =>
                                  handleOpenValidation(section.id, question.id)
                                }
                                onQuestionTextChange={handleQuestionTextChange}
                                onOptionLabelChange={handleOptionLabelChange}
                                onEditImage={() => toast('Edit image')}
                                onAddOption={handleAddOption}
                                onBulkEdit={handleBulkEdit}
                              />
                            ) : isNumericSlider && question.matrix ? (
                              <NumericSliderQuestionRow
                                question={question}
                                matrix={question.matrix}
                                sectionId={section.id}
                                showHideOptionsApplied={showHideOptionsApplied}
                                dynamicTextCommentsApplied={dynamicTextCommentsApplied}
                                extractionApplied={extractionApplied}
                                quotaControlApplied={quotaControlApplied}
                                onAction={(label) =>
                                  toast(`${label}: ${plainTextFromRichValue(question.text)}`)
                                }
                                onMenuAction={(action) =>
                                  handleQuestionMenuAction(section.id, question.id, action)
                                }
                                onOpenLogic={() => handleOpenLogic(section.id, question.id)}
                                onOpenSettings={() =>
                                  handleOpenSettings(section.id, question.id)
                                }
                                onOpenValidation={() =>
                                  handleOpenValidation(section.id, question.id)
                                }
                                onQuestionTextChange={handleQuestionTextChange}
                                onMatrixAnchorChange={handleMatrixAnchorChange}
                                onMatrixRowLabelChange={handleMatrixRowLabelChange}
                                onAddRow={handleAddMatrixRow}
                                onBulkEditRows={(secId, qId) =>
                                  setBulkEditMatrixTarget({
                                    sectionId: secId,
                                    questionId: qId,
                                    target: 'rows',
                                  })
                                }
                              />
                            ) : isTextSlider && question.matrix ? (
                              <TextSliderQuestionRow
                                question={question}
                                matrix={question.matrix}
                                sectionId={section.id}
                                showHideOptionsApplied={showHideOptionsApplied}
                                dynamicTextCommentsApplied={dynamicTextCommentsApplied}
                                extractionApplied={extractionApplied}
                                quotaControlApplied={quotaControlApplied}
                                onAction={(label) =>
                                  toast(`${label}: ${plainTextFromRichValue(question.text)}`)
                                }
                                onMenuAction={(action) =>
                                  handleQuestionMenuAction(section.id, question.id, action)
                                }
                                onOpenLogic={() => handleOpenLogic(section.id, question.id)}
                                onOpenSettings={() =>
                                  handleOpenSettings(section.id, question.id)
                                }
                                onOpenValidation={() =>
                                  handleOpenValidation(section.id, question.id)
                                }
                                onQuestionTextChange={handleQuestionTextChange}
                                onMatrixAnchorChange={handleMatrixAnchorChange}
                                onMatrixColumnLabelChange={handleMatrixColumnLabelChange}
                                onMatrixRowLabelChange={handleMatrixRowLabelChange}
                                onAddRow={handleAddMatrixRow}
                                onBulkEditRows={(secId, qId) =>
                                  setBulkEditMatrixTarget({
                                    sectionId: secId,
                                    questionId: qId,
                                    target: 'rows',
                                  })
                                }
                                onBulkEditColumns={(secId, qId) =>
                                  setBulkEditMatrixTarget({
                                    sectionId: secId,
                                    questionId: qId,
                                    target: 'columns',
                                  })
                                }
                              />
                            ) : isVanWestendorp ? (
                              <VanWestendorpQuestionRow
                                question={question}
                                sectionId={section.id}
                                showHideOptionsApplied={showHideOptionsApplied}
                                onAction={(label) =>
                                  toast(`${label}: ${plainTextFromRichValue(question.text)}`)
                                }
                                onMenuAction={(action) =>
                                  handleQuestionMenuAction(section.id, question.id, action)
                                }
                                onOpenLogic={() => handleOpenLogic(section.id, question.id)}
                                onOpenSettings={() =>
                                  handleOpenSettings(section.id, question.id)
                                }
                                onQuestionTextChange={handleQuestionTextChange}
                              />
                            ) : isMatrixSpreadsheet && question.matrix ? (
                              <MatrixSpreadsheetQuestionRow
                                question={question}
                                matrix={question.matrix}
                                sectionId={section.id}
                                showHideOptionsApplied={showHideOptionsApplied}
                                onAction={(label) =>
                                  toast(`${label}: ${plainTextFromRichValue(question.text)}`)
                                }
                                onMenuAction={(action) =>
                                  handleQuestionMenuAction(section.id, question.id, action)
                                }
                                onOpenLogic={() => handleOpenLogic(section.id, question.id)}
                                onOpenSettings={() =>
                                  handleOpenSettings(section.id, question.id)
                                }
                                onOpenValidation={() =>
                                  handleOpenValidation(section.id, question.id)
                                }
                                onQuestionTextChange={handleQuestionTextChange}
                                onMatrixColumnLabelChange={handleMatrixColumnLabelChange}
                                onMatrixRowLabelChange={handleMatrixRowLabelChange}
                                onAddRow={handleAddMatrixRow}
                                onBulkEditRows={(secId, qId) =>
                                  setBulkEditMatrixTarget({
                                    sectionId: secId,
                                    questionId: qId,
                                    target: 'rows',
                                  })
                                }
                                onBulkEditColumns={(secId, qId) =>
                                  setBulkEditMatrixTarget({
                                    sectionId: secId,
                                    questionId: qId,
                                    target: 'columns',
                                  })
                                }
                              />
                            ) : isMatrixMultiSelect && question.matrix ? (
                              <MatrixMultiSelectQuestionRow
                                question={question}
                                matrix={question.matrix}
                                sectionId={section.id}
                                showHideOptionsApplied={showHideOptionsApplied}
                                onAction={(label) =>
                                  toast(`${label}: ${plainTextFromRichValue(question.text)}`)
                                }
                                onMenuAction={(action) =>
                                  handleQuestionMenuAction(section.id, question.id, action)
                                }
                                onOpenLogic={() => handleOpenLogic(section.id, question.id)}
                                onOpenSettings={() =>
                                  handleOpenSettings(section.id, question.id)
                                }
                                onOpenValidation={() =>
                                  handleOpenValidation(section.id, question.id)
                                }
                                onQuestionTextChange={handleQuestionTextChange}
                                onMatrixColumnLabelChange={handleMatrixColumnLabelChange}
                                onMatrixRowLabelChange={handleMatrixRowLabelChange}
                                onAddRow={handleAddMatrixRow}
                                onBulkEditRows={(secId, qId) =>
                                  setBulkEditMatrixTarget({
                                    sectionId: secId,
                                    questionId: qId,
                                    target: 'rows',
                                  })
                                }
                                onBulkEditColumns={(secId, qId) =>
                                  setBulkEditMatrixTarget({
                                    sectionId: secId,
                                    questionId: qId,
                                    target: 'columns',
                                  })
                                }
                              />
                            ) : isMultiPoint && question.matrix ? (
                              <MultiPointScalesQuestionRow
                                question={question}
                                matrix={question.matrix}
                                answerType={multiPointSettings.answerType}
                                sectionId={section.id}
                                showHideOptionsApplied={showHideOptionsApplied}
                                onAction={(label) =>
                                  toast(`${label}: ${plainTextFromRichValue(question.text)}`)
                                }
                                onMenuAction={(action) =>
                                  handleQuestionMenuAction(section.id, question.id, action)
                                }
                                onOpenLogic={() => handleOpenLogic(section.id, question.id)}
                                onOpenSettings={() =>
                                  handleOpenSettings(section.id, question.id)
                                }
                                onQuestionTextChange={handleQuestionTextChange}
                                onMatrixAnchorChange={handleMatrixAnchorChange}
                                onMatrixColumnLabelChange={handleMatrixColumnLabelChange}
                                onMatrixRowLabelChange={handleMatrixRowLabelChange}
                                onAddRow={handleAddMatrixRow}
                                onBulkEditRows={(secId, qId) =>
                                  setBulkEditMatrixTarget({
                                    sectionId: secId,
                                    questionId: qId,
                                    target: 'rows',
                                  })
                                }
                                onBulkEditColumns={(secId, qId) =>
                                  setBulkEditMatrixTarget({
                                    sectionId: secId,
                                    questionId: qId,
                                    target: 'columns',
                                  })
                                }
                              />
                            ) : isSelectOne ? (
                              <SelectOneQuestionRow
                                question={question}
                                sectionId={section.id}
                                showHideOptionsApplied={showHideOptionsApplied}
                                dynamicTextCommentsApplied={dynamicTextCommentsApplied}
                                dynamicTextEnabledByOptionId={dynamicTextEnabledByOptionId}
                                extractionApplied={extractionApplied}
                                quotaControlApplied={quotaControlApplied}
                                quotaOptionLabels={quotaOptionLabels}
                                extractionOptionLabels={extractionOptionLabels}
                                {...extractionRowProps}
                                onAction={(label) =>
                                  toast(`${label}: ${plainTextFromRichValue(question.text)}`)
                                }
                                onMenuAction={(action) =>
                                  handleQuestionMenuAction(section.id, question.id, action)
                                }
                                onOpenLogic={() => handleOpenLogic(section.id, question.id)}
                                onOpenSettings={() =>
                                  handleOpenSettings(section.id, question.id)
                                }
                                onOpenValidation={() =>
                                  handleOpenValidation(section.id, question.id)
                                }
                                onAddOption={handleAddOption}
                                onBulkEdit={handleBulkEdit}
                                onQuestionTextChange={handleQuestionTextChange}
                                onOptionLabelChange={handleOptionLabelChange}
                              />
                            ) : question.inputKind === 'checkbox' ? (
                              <SelectManyQuestionRow
                                question={question}
                                sectionId={section.id}
                                showHideOptionsApplied={showHideOptionsApplied}
                                dynamicTextCommentsApplied={dynamicTextCommentsApplied}
                                dynamicTextEnabledByOptionId={dynamicTextEnabledByOptionId}
                                extractionApplied={extractionApplied}
                                quotaControlApplied={quotaControlApplied}
                                quotaOptionLabels={quotaOptionLabels}
                                extractionOptionLabels={extractionOptionLabels}
                                {...extractionRowProps}
                                onAction={(label) =>
                                  toast(`${label}: ${plainTextFromRichValue(question.text)}`)
                                }
                                onMenuAction={(action) =>
                                  handleQuestionMenuAction(section.id, question.id, action)
                                }
                                onOpenLogic={() => handleOpenLogic(section.id, question.id)}
                                onOpenSettings={() =>
                                  handleOpenSettings(section.id, question.id)
                                }
                                onAddOption={handleAddOption}
                                onBulkEdit={handleBulkEdit}
                                onQuestionTextChange={handleQuestionTextChange}
                                onOptionLabelChange={handleOptionLabelChange}
                              />
                            ) : (
                              <QuestionRow
                                question={question}
                                sectionId={section.id}
                                showHideOptionsApplied={showHideOptionsApplied}
                                dynamicTextCommentsApplied={dynamicTextCommentsApplied}
                                dynamicTextEnabledByOptionId={dynamicTextEnabledByOptionId}
                                extractionApplied={extractionApplied}
                                quotaControlApplied={quotaControlApplied}
                                quotaOptionLabels={quotaOptionLabels}
                                extractionOptionLabels={extractionOptionLabels}
                                {...extractionRowProps}
                                onAction={(label) =>
                                  toast(`${label}: ${plainTextFromRichValue(question.text)}`)
                                }
                                onMenuAction={(action) =>
                                  handleQuestionMenuAction(section.id, question.id, action)
                                }
                                onOpenLogic={() => handleOpenLogic(section.id, question.id)}
                                onOpenSettings={() =>
                                  handleOpenSettings(section.id, question.id)
                                }
                                onOpenValidation={() =>
                                  handleOpenValidation(section.id, question.id)
                                }
                                onQuestionTextChange={handleQuestionTextChange}
                                onOptionLabelChange={handleOptionLabelChange}
                              />
                            )}
                          </div>
                        </div>

                        <AddQuestionToolbar
                          sectionId={section.id}
                          insertIndex={questionIndex + 1}
                          hasPageBreak={hasPageBreakAtSlot(
                            pageBreakBySlotKey,
                            getPageBreakSlotKey(section.id, questionIndex + 1, section.questions)
                          )}
                          onSelect={handleAddQuestionSelect}
                          onPageControl={handlePageControl}
                          onTogglePageBreak={() =>
                            handleTogglePageBreak(section.id, questionIndex + 1)
                          }
                        />
                      </Fragment>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        ))}

        <div className={styles.addBlockRow}>
          <WuButton size="sm" variant="secondary" onClick={() => toast('Add block')}>
            <span className="wm-add" />
            Add Block
          </WuButton>
        </div>

        <div className={styles.workspaceFooter} aria-label="Survey footer and thank you page">
          <WuButton
            size="sm"
            variant="secondary"
            className={styles.workspaceFooterBtn}
            onClick={() => toast('Edit Footer')}
          >
            Edit Footer
          </WuButton>
          <WuButton
            size="sm"
            variant="secondary"
            className={styles.workspaceFooterBtn}
            onClick={() => toast('Thank You Page')}
          >
            Thank You Page
          </WuButton>
        </div>
      </div>
      </div>

      {!surveyAgentOpen ? (
        <button
          type="button"
          className={styles.surveyAgentFab}
          aria-label="Open research agent"
          title="Open research agent"
          onClick={() => setSurveyAgentOpen(true)}
        >
          <span className={`wc-ai ${styles.surveyAgentFabIcon}`} aria-hidden />
        </button>
      ) : null}

      {settingsQuestion && settingsQuestionKey ? (
        isCaptchaQuestion(settingsQuestion) ? (
          <CaptchaQuestionSettingsPanel
            settings={getCaptchaSettings(settingsQuestionKey)}
            onChange={(next) => handleCaptchaSettingsChange(settingsQuestionKey, next)}
            onClose={() => setSettingsTarget(null)}
          />
        ) : isMultiPointScalesQuestion(settingsQuestion) ? (
          <MultiPointScalesSettingsPanel
            settings={getMultiPointSettings(settingsQuestionKey)}
            onChange={(next) => handleMultiPointSettingsChange(settingsQuestionKey, next)}
            onClose={() => setSettingsTarget(null)}
          />
        ) : (
          <QuestionSettingsPanel
            question={settingsQuestion}
            settings={getQuestionSettings(settingsQuestion, settingsQuestionKey)}
            onChange={(next) =>
              handleSettingsChange(settingsQuestionKey, next, settingsQuestion)
            }
            onClose={() => setSettingsTarget(null)}
          />
        )
      ) : null}

      {logicQuestion && logicQuestionKey && logicTarget ? (
        <QuestionLogicModal
          open={logicTarget !== null}
          onOpenChange={(open) => {
            if (!open) setLogicTarget(null);
          }}
          question={logicQuestion}
          allQuestions={allQuestions}
          surveyId={detail.survey.id}
          initialState={getQuestionLogic(logicQuestionKey, logicQuestion)}
          onSave={(state) =>
            handleLogicSave(logicTarget.sectionId, logicTarget.questionId, state)
          }
        />
      ) : null}

      {validationQuestion && validationQuestionKey && validationTarget ? (
        <QuestionValidationModal
          open={validationTarget !== null}
          onOpenChange={(open) => {
            if (!open) setValidationTarget(null);
          }}
          required={validationQuestion.required}
          initialState={getQuestionValidation(validationQuestion, validationQuestionKey)}
          onApply={(state) =>
            handleValidationApply(
              validationTarget.sectionId,
              validationTarget.questionId,
              state
            )
          }
        />
      ) : null}

      <BulkEditLinesModal
        open={bulkEditMatrixTarget !== null && bulkEditMatrixQuestion?.matrix !== undefined}
        title={
          bulkEditMatrixTarget?.target === 'columns' ? 'Bulk Edit Columns' : 'Bulk Edit Rows'
        }
        fieldLabel={
          bulkEditMatrixTarget?.target === 'columns'
            ? 'Columns — one per line'
            : 'Rows — one per line'
        }
        lines={
          bulkEditMatrixTarget?.target === 'columns'
            ? (bulkEditMatrixQuestion?.matrix?.columns.map((column) =>
                plainTextFromRichValue(column.label)
              ) ?? [])
            : (bulkEditMatrixQuestion?.matrix?.rows.map((row) =>
                plainTextFromRichValue(row.label)
              ) ?? [])
        }
        onOpenChange={(open) => {
          if (!open) setBulkEditMatrixTarget(null);
        }}
        onSave={handleBulkEditMatrixSave}
      />

      <BulkEditOptionsModal
        open={bulkEditTarget !== null && bulkEditQuestion !== undefined}
        onOpenChange={(open) => {
          if (!open) setBulkEditTarget(null);
        }}
        optionLabels={
          bulkEditQuestion?.options.map((option) =>
            plainTextFromRichValue(option.label)
          ) ?? []
        }
        otherOption={
          bulkEditQuestion ? questionHasOtherOption(bulkEditQuestion) : false
        }
        notApplicableOption={
          bulkEditQuestion ? questionHasNotApplicableOption(bulkEditQuestion) : false
        }
        onSave={handleBulkEditSave}
      />

      <LookupTableBulkConversionModal
        open={lookupTableBulkConversionOpen}
        onOpenChange={(open) => {
          setLookupTableBulkConversionOpen(open);
          if (!open) {
            setPendingLookupTableBulkConversion(null);
            setLookupTableBulkConversionConflicts([]);
          }
        }}
        conflicts={lookupTableBulkConversionConflicts}
        canSaveAsLookupTable={
          lookupTableBulkConversionOpen && lookupTableBulkConversionConflicts.length === 0
        }
        onRemoveLogic={handleRemoveLookupTableConflict}
        onSaveAsLookupTable={handleSaveAsLookupTable}
      />

      <ConfirmModal
        open={deleteQuestionTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteQuestionTarget(null);
        }}
        title="Delete question?"
        description="This question will be removed from the survey. This action cannot be undone in this prototype."
        confirmLabel="Delete"
        variant="critical"
        onConfirm={handleConfirmDeleteQuestion}
      />
    </div>
  );
}
