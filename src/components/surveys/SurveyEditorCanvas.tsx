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
  createDefaultVanWestendorpData,
  DEFAULT_LOOKUP_TABLE_QUESTION_TEXT,
  DEFAULT_MULTI_POINT_QUESTION_TEXT,
  DEFAULT_NPS_MAX_LABEL,
  DEFAULT_NPS_MIN_LABEL,
  DEFAULT_VAN_WESTENDORP_QUESTION_TEXT,
} from '@/data/mock-survey-detail';
import { LookupTableQuestionRow } from '@/components/surveys/LookupTableQuestionRow';
import { NpsQuestionRow } from '@/components/surveys/NpsQuestionRow';
import { VanWestendorpQuestionRow } from '@/components/surveys/VanWestendorpQuestionRow';
import { AddQuestionMenu } from '@/components/surveys/AddQuestionMenu';
import { BulkEditLinesModal } from '@/components/surveys/BulkEditLinesModal';
import { BulkEditOptionsModal } from '@/components/surveys/BulkEditOptionsModal';
import { MultiPointScalesQuestionRow } from '@/components/surveys/MultiPointScalesQuestionRow';
import type { QuestionMenuAction } from '@/components/surveys/QuestionOptionsMenu';
import { QuestionWorkspaceActions } from '@/components/surveys/QuestionWorkspaceActions';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
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
  writeMultiPointQuestionPreviewSession,
  writeSelectManyQuestionPreviewSession,
  writeSelectOneQuestionPreviewSession,
} from '@/data/survey-question-preview-session';
import { toShowHideOptionsPreviewConfig } from '@/data/show-hide-options-preview';
import { QuotaControlOptionTag } from '@/components/surveys/QuotaControlOptionTag';
import {
  createDefaultQuestionLogicState,
  getQuotaControlOptionLabels,
  isQuotaControlLogicApplied,
  isShowHideOptionsLogicApplied,
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
    })),
  }));
}

function isMultiPointScalesQuestion(question: SurveyQuestion): boolean {
  return question.kind === 'multi-point-scales' && Boolean(question.matrix);
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

function isSelectOneQuestion(question: SurveyQuestion): boolean {
  return (
    !isLookupTableQuestion(question) &&
    (question.addQuestionTypeId === 'select-one' ||
      (question.inputKind === 'radio' &&
        !isMultiPointScalesQuestion(question) &&
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
    !isNpsQuestion(question) &&
    !isVanWestendorpQuestion(question) &&
    !isLookupTableQuestion(question) &&
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
  quotaControlApplied,
  quotaOptionLabels,
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
  quotaControlApplied: boolean;
  quotaOptionLabels: Record<string, string>;
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
          <ul className={styles.options}>
            {question.options.map((option) => {
              const quotaLabel = quotaOptionLabels[option.id];
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
                  {quotaLabel ? <QuotaControlOptionTag label={quotaLabel} /> : null}
                </div>
                {!quotaLabel && option.logicLabel ? (
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
  quotaControlApplied,
  quotaOptionLabels,
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
  quotaControlApplied: boolean;
  quotaOptionLabels: Record<string, string>;
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
          <ul className={styles.selectManyOptions}>
            {question.options.map((option) => {
              const quotaLabel = quotaOptionLabels[option.id];
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
  quotaControlApplied,
  quotaOptionLabels,
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
  quotaControlApplied: boolean;
  quotaOptionLabels: Record<string, string>;
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
          <ul className={styles.selectManyOptions}>
            {question.options.map((option) => {
              const quotaLabel = quotaOptionLabels[option.id];
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
  const [sections, setSections] = useState<SurveySection[]>(() => cloneSections(detail.sections));
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
  const [bulkEditMatrixTarget, setBulkEditMatrixTarget] = useState<{
    sectionId: string;
    questionId: string;
    target: 'rows' | 'columns';
  } | null>(null);
  const [deleteQuestionTarget, setDeleteQuestionTarget] = useState<{
    sectionId: string;
    questionId: string;
  } | null>(null);
  const [pageBreakBySlotKey, setPageBreakBySlotKey] = useState<Record<string, boolean>>({});
  const pendingScrollQuestionRef = useRef<{ sectionId: string; questionId: string } | null>(
    null
  );
  const toast = useCallback(
    (message: string) => {
      showToast({ message, variant: 'success' });
    },
    [showToast]
  );

  useEffect(() => {
    setSections(cloneSections(detail.sections));
    setSelectedQuestionKey(null);
    setSettingsTarget(null);
    setLogicTarget(null);
    setValidationTarget(null);
    setQuestionSettingsByKey({});
    setLogicByQuestionKey({});
    setValidationByQuestionKey({});
    setMultiPointSettingsByKey({});
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

  const handleBulkEditSave = useCallback(
    (payload: {
      optionLabels: string[];
      otherOption: boolean;
      notApplicableOption: boolean;
    }) => {
      if (!bulkEditTarget) return;
      const { sectionId, questionId } = bulkEditTarget;
      setSections((prev) =>
        prev.map((sec) => {
          if (sec.id !== sectionId) return sec;
          return {
            ...sec,
            questions: sec.questions.map((q) => {
              if (q.id !== questionId) return q;
              return {
                ...q,
                options: applyBulkOptionLabels(
                  q.options,
                  payload.optionLabels,
                  payload.otherOption,
                  payload.notApplicableOption
                ),
              };
            }),
          };
        })
      );
      setBulkEditTarget(null);
    },
    [bulkEditTarget]
  );

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
        getDefaultSettingsForQuestion(question.inputKind);
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
            const previewUrl = `${window.location.origin}/surveys/preview/${detail.survey.id}?kind=select-many`;
            window.open(previewUrl, '_blank', 'noopener,noreferrer');
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
            const previewUrl = `${window.location.origin}/surveys/preview/${detail.survey.id}?kind=select-one`;
            window.open(previewUrl, '_blank', 'noopener,noreferrer');
            return;
          }
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
              const previewUrl = `${window.location.origin}/surveys/preview/${detail.survey.id}`;
              window.open(previewUrl, '_blank', 'noopener,noreferrer');
              return;
            }
            showToast({
              message: 'Preview requires Cards carousel layout',
              variant: 'info',
            });
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
        pendingScrollQuestionRef.current = { sectionId, questionId: newId };
        setSelectedQuestionKey(`${sectionId}:${newId}`);
        setSections((prev) =>
          prev.map((sec) => {
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
          })
        );
        showToast({ message: 'Select One question added', variant: 'success' });
        return;
      }

      if (typeId === 'select-many') {
        const ts = Date.now();
        const newId = `q-new-${ts}`;
        pendingScrollQuestionRef.current = { sectionId, questionId: newId };
        setSelectedQuestionKey(`${sectionId}:${newId}`);
        setSections((prev) =>
          prev.map((sec) => {
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
          })
        );
        showToast({ message: 'Select Many question added', variant: 'success' });
        return;
      }

      if (typeId === 'multi-point') {
        const ts = Date.now();
        const newId = `q-new-${ts}`;
        const questionKey = `${sectionId}:${newId}`;
        pendingScrollQuestionRef.current = { sectionId, questionId: newId };
        setSelectedQuestionKey(questionKey);
        setSettingsTarget({ sectionId, questionId: newId });
        setSections((prev) =>
          prev.map((sec) => {
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
          })
        );
        setMultiPointSettingsByKey((prev) => ({
          ...prev,
          [questionKey]: DEFAULT_NEW_MULTI_POINT_QUESTION_SETTINGS,
        }));
        showToast({ message: 'Multi-Point Scales question added', variant: 'success' });
        return;
      }

      if (typeId === 'nps') {
        const ts = Date.now();
        const newId = `q-new-${ts}`;
        pendingScrollQuestionRef.current = { sectionId, questionId: newId };
        setSelectedQuestionKey(`${sectionId}:${newId}`);
        setSections((prev) =>
          prev.map((sec) => {
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
          })
        );
        showToast({ message: 'Net Promoter Score question added', variant: 'success' });
        return;
      }

      if (typeId === 'lookup-table') {
        const ts = Date.now();
        const newId = `q-new-${ts}`;
        pendingScrollQuestionRef.current = { sectionId, questionId: newId };
        setSelectedQuestionKey(`${sectionId}:${newId}`);
        setSections((prev) =>
          prev.map((sec) => {
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
          })
        );
        showToast({ message: 'Lookup Table question added', variant: 'success' });
        return;
      }

      if (typeId === 'van-westendorp') {
        const ts = Date.now();
        const newId = `q-new-${ts}`;
        pendingScrollQuestionRef.current = { sectionId, questionId: newId };
        setSelectedQuestionKey(`${sectionId}:${newId}`);
        setSections((prev) =>
          prev.map((sec) => {
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
          })
        );
        showToast({ message: 'Van Westendorp question added', variant: 'success' });
        return;
      }

      showToast({ message: `Add ${typeLabel} (${category})`, variant: 'success' });
    },
    [showToast]
  );

  return (
    <div
      className={`${styles.canvas} ${
        settingsQuestion ? styles.canvasWithSettings : ''
      }`}
    >
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
                    const isNps = isNpsQuestion(question);
                    const isVanWestendorp = isVanWestendorpQuestion(question);
                    const isLookupTable = isLookupTableQuestion(question);
                    const isSelectOne = isSelectOneQuestion(question);
                    const multiPointSettings = getMultiPointSettings(questionKey);
                    const savedLogic = logicByQuestionKey[questionKey];
                    const questionOptionIds = question.options.map((option) => option.id);
                    const showHideOptionsApplied =
                      savedLogic != null &&
                      isShowHideOptionsLogicApplied(savedLogic, questionOptionIds);
                    const quotaControlApplied =
                      savedLogic != null &&
                      isQuotaControlLogicApplied(savedLogic, questionOptionIds);
                    const quotaOptionLabels =
                      savedLogic != null
                        ? getQuotaControlOptionLabels(savedLogic, questionOptionIds)
                        : {};
                    return (
                      <Fragment key={question.id}>
                        <div
                          id={`survey-question-${section.id}-${question.id}`}
                          className={`${styles.questionBlock} ${
                            question.inputKind === 'checkbox' ? styles.questionBlockSelectMany : ''
                          } ${isSelectOne ? styles.questionBlockSelectOne : ''} ${
                            isMultiPoint ? styles.questionBlockMultiPoint : ''
                          } ${isNps ? styles.questionBlockNps : ''} ${
                            isVanWestendorp ? styles.questionBlockVanWestendorp : ''
                          } ${isLookupTable ? styles.questionBlockLookupTable : ''} ${
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
                                quotaControlApplied={quotaControlApplied}
                                quotaOptionLabels={quotaOptionLabels}
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
                                quotaControlApplied={quotaControlApplied}
                                quotaOptionLabels={quotaOptionLabels}
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
                                quotaControlApplied={quotaControlApplied}
                                quotaOptionLabels={quotaOptionLabels}
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

      {settingsQuestion && settingsQuestionKey ? (
        isMultiPointScalesQuestion(settingsQuestion) ? (
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
