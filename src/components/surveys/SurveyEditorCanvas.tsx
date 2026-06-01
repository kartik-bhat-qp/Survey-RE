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
import { createDefaultMultiPointMatrix } from '@/data/mock-survey-detail';
import { AddQuestionMenu } from '@/components/surveys/AddQuestionMenu';
import { BulkEditLinesModal } from '@/components/surveys/BulkEditLinesModal';
import { BulkEditOptionsModal } from '@/components/surveys/BulkEditOptionsModal';
import { MultiPointScalesQuestionRow } from '@/components/surveys/MultiPointScalesQuestionRow';
import type { QuestionMenuAction } from '@/components/surveys/QuestionOptionsMenu';
import { QuestionOptionsMenu } from '@/components/surveys/QuestionOptionsMenu';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { MultiPointScalesSettingsPanel } from '@/components/surveys/MultiPointScalesSettingsPanel';
import { QuestionLogicModal } from '@/components/surveys/QuestionLogicModal';
import { QuestionSettingsPanel } from '@/components/surveys/QuestionSettingsPanel';
import {
  QuestionRichTextField,
  plainTextFromRichValue,
} from '@/components/surveys/QuestionRichTextField';
import {
  getDefaultSettingsForQuestion,
  type QuestionSettings,
} from '@/data/mock-question-settings';
import {
  DEFAULT_MULTI_POINT_SETTINGS,
  isCardsCarouselPreview,
  type MultiPointScalesSettings,
} from '@/data/mock-multi-point-settings';
import {
  findNextSurveyQuestion,
  toQuestionPreviewFollowUp,
} from '@/data/survey-question-preview-utils';
import { writeMultiPointQuestionPreviewSession } from '@/data/survey-question-preview-session';
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
    })),
  }));
}

function isMultiPointScalesQuestion(question: SurveyQuestion): boolean {
  return question.kind === 'multi-point-scales' && Boolean(question.matrix);
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
  onSelect,
  onPageControl,
}: {
  sectionId: string;
  /** Position in the section's question list where the new question is inserted. */
  insertIndex: number;
  onSelect: (
    sectionId: string,
    insertIndex: number,
    category: string,
    typeLabel: string,
    typeId: string
  ) => void;
  onPageControl: (action: string) => void;
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
          onClick={() => onPageControl('Remove Page Break')}
        >
          Remove Page Break
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
  onAction,
  onOpenLogic,
  onOpenSettings,
  onMenuAction,
  onQuestionTextChange,
  onOptionLabelChange,
}: {
  question: SurveyQuestion;
  sectionId: string;
  onAction: (label: string) => void;
  onMenuAction: (action: QuestionMenuAction) => void;
  onOpenLogic: () => void;
  onOpenSettings: () => void;
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
          {question.options.map((option) => (
            <li key={option.id} className={styles.optionItem}>
              <input
                type="radio"
                className={styles.optionRadio}
                name={question.id}
                disabled
                aria-label={`${plainTextFromRichValue(option.label)} radio`}
              />
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
              {option.logicLabel ? (
                <span className={styles.logicTag}>
                  <span className="wm-call-split" aria-hidden />
                  {option.logicLabel}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
      <div
        className={styles.questionActions}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <button type="button" className={styles.actionLink} onClick={() => onAction('Validation')}>
          Validation
        </button>
        <button type="button" className={styles.actionLink} onClick={() => onOpenLogic()}>
          Logic
        </button>
        <button
          type="button"
          className={styles.actionLink}
          onClick={(event) => {
            event.stopPropagation();
            onOpenSettings();
          }}
        >
          Settings
        </button>
        <QuestionOptionsMenu onAction={onMenuAction} triggerClassName={styles.menuBtn} />
      </div>
    </article>
  );
}

function SelectManyQuestionRow({
  question,
  sectionId,
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
            <div
              className={styles.selectManyActions}
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className={styles.actionLink}
                onClick={() => onAction('Validation')}
              >
                Validation
              </button>
              <button type="button" className={styles.actionLink} onClick={() => onOpenLogic()}>
                Logic
              </button>
              <button
                type="button"
                className={styles.actionLink}
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenSettings();
                }}
              >
                Settings
              </button>
              <QuestionOptionsMenu onAction={onMenuAction} triggerClassName={styles.menuBtn} />
            </div>
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
            {question.options.map((option) => (
              <li key={option.id} className={styles.selectManyOptionItem}>
                <span className={styles.selectManyOptionCheckbox}>
                  <input
                    type="checkbox"
                    disabled
                    name={`${question.id}-${option.id}`}
                    aria-label={`${plainTextFromRichValue(option.label)} checkbox`}
                  />
                </span>
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
              </li>
            ))}
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
        <div
          className={styles.selectManyFooter}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <span className={`wm-check-circle ${styles.selectManyFooterIcon}`} aria-hidden />
        </div>
      </div>
    </article>
  );
}

export function SurveyEditorCanvas({ detail }: SurveyEditorCanvasProps) {
  const { showToast } = useWuShowToast();
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
    setQuestionSettingsByKey({});
    setMultiPointSettingsByKey({});
    setBulkEditMatrixTarget(null);
    setDeleteQuestionTarget(null);
  }, [detail.survey.id]);

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

  const handleOpenLogic = useCallback((sectionId: string, questionId: string) => {
    setLogicTarget({ sectionId, questionId });
  }, []);

  const handleOpenSettings = useCallback((sectionId: string, questionId: string) => {
    const questionKey = `${sectionId}:${questionId}`;
    setSelectedQuestionKey(questionKey);
    setSettingsTarget({ sectionId, questionId });
  }, []);

  const handleSettingsChange = useCallback(
    (questionKey: string, settings: QuestionSettings) => {
      setQuestionSettingsByKey((prev) => ({ ...prev, [questionKey]: settings }));
    },
    []
  );

  const getQuestionSettings = useCallback(
    (question: SurveyQuestion, questionKey: string): QuestionSettings => {
      return (
        questionSettingsByKey[questionKey] ??
        getDefaultSettingsForQuestion(question.inputKind)
      );
    },
    [questionSettingsByKey]
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
          if (isMultiPointScalesQuestion(question) && question.matrix) {
            const questionKey = `${sectionId}:${questionId}`;
            const mpSettings = getMultiPointSettings(questionKey);
            if (isCardsCarouselPreview(mpSettings)) {
              const nextQuestion = findNextSurveyQuestion(sections, sectionId, questionId);
              writeMultiPointQuestionPreviewSession({
                surveyId: detail.survey.id,
                surveyTitle: detail.editorTitle,
                questionText: question.text,
                required: question.required,
                matrix: question.matrix,
                settings: mpSettings,
                questionBelow: nextQuestion
                  ? toQuestionPreviewFollowUp(nextQuestion)
                  : null,
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
    [detail.editorTitle, detail.survey.id, sections, showToast, getMultiPointSettings]
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
              text: `Question ${nextNum}`,
              required: true,
              kind: 'multi-point-scales',
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
          [questionKey]: DEFAULT_MULTI_POINT_SETTINGS,
        }));
        showToast({ message: 'Multi-Point Scales question added', variant: 'success' });
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
                    onSelect={handleAddQuestionSelect}
                    onPageControl={handlePageControl}
                  />

                  {section.questions.map((question, questionIndex) => {
                    const questionKey = `${section.id}:${question.id}`;
                    const isSelected = selectedQuestionKey === questionKey;
                    const isMultiPoint = isMultiPointScalesQuestion(question);
                    const multiPointSettings = getMultiPointSettings(questionKey);
                    return (
                      <Fragment key={question.id}>
                        <div
                          id={`survey-question-${section.id}-${question.id}`}
                          className={`${styles.questionBlock} ${
                            question.inputKind === 'checkbox' ? styles.questionBlockSelectMany : ''
                          } ${
                            isMultiPoint ? styles.questionBlockMultiPoint : ''
                          } ${isSelected ? styles.questionBlockSelected : ''}`}
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
                            {isMultiPoint && question.matrix ? (
                              <MultiPointScalesQuestionRow
                                question={question}
                                matrix={question.matrix}
                                answerType={multiPointSettings.answerType}
                                sectionId={section.id}
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
                            ) : question.inputKind === 'checkbox' ? (
                              <SelectManyQuestionRow
                                question={question}
                                sectionId={section.id}
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
                                onOptionLabelChange={handleOptionLabelChange}
                              />
                            )}
                          </div>
                        </div>

                        <AddQuestionToolbar
                          sectionId={section.id}
                          insertIndex={questionIndex + 1}
                          onSelect={handleAddQuestionSelect}
                          onPageControl={handlePageControl}
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
            onChange={(next) => handleSettingsChange(settingsQuestionKey, next)}
            onClose={() => setSettingsTarget(null)}
          />
        )
      ) : null}

      {logicQuestion ? (
        <QuestionLogicModal
          open={logicTarget !== null}
          onOpenChange={(open) => {
            if (!open) setLogicTarget(null);
          }}
          question={logicQuestion}
          allQuestions={allQuestions}
          surveyId={detail.survey.id}
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
