'use client';

import dynamic from 'next/dynamic';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type SyntheticEvent } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type {
  SurveyDetail,
  SurveyQuestion,
  SurveyQuestionOption,
  SurveySection,
} from '@/data/mock-survey-detail';
import { AddQuestionMenu } from '@/components/surveys/AddQuestionMenu';
import { BulkEditOptionsModal } from '@/components/surveys/BulkEditOptionsModal';
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
import styles from './SurveyEditorCanvas.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

interface SurveyEditorCanvasProps {
  detail: SurveyDetail;
}

function cloneSections(sections: SurveySection[]): SurveySection[] {
  return sections.map((sec) => ({
    ...sec,
    questions: sec.questions.map((q) => ({
      ...q,
      options: q.options.map((o) => ({ ...o })),
    })),
  }));
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
  onSelect,
  onPageControl,
}: {
  sectionId: string;
  onSelect: (sectionId: string, category: string, typeLabel: string, typeId: string) => void;
  onPageControl: (action: string) => void;
}) {
  return (
    <div className={styles.addQuestionToolbar}>
      <div className={styles.addQuestionToolbarCenter}>
        <AddQuestionMenu
          onSelect={(category, typeLabel, typeId) =>
            onSelect(sectionId, category, typeLabel, typeId)
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
  onQuestionTextChange,
  onOptionLabelChange,
}: {
  question: SurveyQuestion;
  sectionId: string;
  onAction: (label: string) => void;
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
        <button
          type="button"
          className={styles.menuBtn}
          aria-label="Question options"
          onClick={() => onAction('More options')}
        >
          <span className="wm-more-vert" />
        </button>
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
  onAddOption,
  onBulkEdit,
  onQuestionTextChange,
  onOptionLabelChange,
}: {
  question: SurveyQuestion;
  sectionId: string;
  onAction: (label: string) => void;
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
              <button
                type="button"
                className={styles.menuBtn}
                aria-label="Question options"
                onClick={() => onAction('More options')}
              >
                <span className="wm-more-vert" />
              </button>
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

  const handleAddQuestionSelect = useCallback(
    (sectionId: string, category: string, typeLabel: string, typeId: string) => {
      if (typeId === 'select-many') {
        const ts = Date.now();
        const newId = `q-new-${ts}`;
        pendingScrollQuestionRef.current = { sectionId, questionId: newId };
        setSelectedQuestionKey(`${sectionId}:${newId}`);
        setSections((prev) =>
          prev.map((sec) => {
            if (sec.id !== sectionId) return sec;
            const maxNum = sec.questions.reduce((m, q) => Math.max(m, q.number), 0);
            const nextNum = maxNum + 1;
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
            return { ...sec, questions: [...sec.questions, newQuestion] };
          })
        );
        showToast({ message: 'Select Many question added', variant: 'success' });
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
                    onSelect={handleAddQuestionSelect}
                    onPageControl={handlePageControl}
                  />

                  {section.questions.map((question) => {
                    const questionKey = `${section.id}:${question.id}`;
                    const isSelected = selectedQuestionKey === questionKey;
                    return (
                      <Fragment key={question.id}>
                        <div
                          id={`survey-question-${section.id}-${question.id}`}
                          className={`${styles.questionBlock} ${
                            question.inputKind === 'checkbox' ? styles.questionBlockSelectMany : ''
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
                            {question.inputKind === 'checkbox' ? (
                              <SelectManyQuestionRow
                                question={question}
                                sectionId={section.id}
                                onAction={(label) =>
                                  toast(`${label}: ${plainTextFromRichValue(question.text)}`)
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
        <QuestionSettingsPanel
          question={settingsQuestion}
          settings={getQuestionSettings(settingsQuestion, settingsQuestionKey)}
          onChange={(next) => handleSettingsChange(settingsQuestionKey, next)}
          onClose={() => setSettingsTarget(null)}
        />
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
    </div>
  );
}
