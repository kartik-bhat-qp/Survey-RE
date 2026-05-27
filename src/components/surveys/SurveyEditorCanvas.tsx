'use client';

import dynamic from 'next/dynamic';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type {
  SurveyDetail,
  SurveyQuestion,
  SurveySection,
} from '@/data/mock-survey-detail';
import { AddQuestionMenu } from '@/components/surveys/AddQuestionMenu';
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
  onAction,
}: {
  question: SurveyQuestion;
  onAction: (label: string) => void;
}) {
  return (
    <article className={styles.questionRow}>
      <div className={styles.questionBody}>
        <p className={styles.questionText}>
          {question.required ? <span className={styles.required}>*</span> : null}
          {question.text}
        </p>
        <ul className={styles.options}>
          {question.options.map((option) => (
            <li key={option.id} className={styles.optionItem}>
              <label className={styles.optionLabel}>
                <input type="radio" name={question.id} disabled />
                <span>{option.label}</span>
              </label>
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
        <button type="button" className={styles.actionLink} onClick={() => onAction('Logic')}>
          Logic
        </button>
        <button type="button" className={styles.actionLink} onClick={() => onAction('Settings')}>
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
  onAddOption,
  onBulkEdit,
}: {
  question: SurveyQuestion;
  sectionId: string;
  onAction: (label: string) => void;
  onAddOption: (sectionId: string, questionId: string) => void;
  onBulkEdit: (sectionId: string, questionId: string) => void;
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
              <button type="button" className={styles.actionLink} onClick={() => onAction('Logic')}>
                Logic
              </button>
              <button
                type="button"
                className={styles.actionLink}
                onClick={() => onAction('Settings')}
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
          <p className={styles.selectManyQuestionText}>
            {question.required ? <span className={styles.required}>*</span> : null}
            {question.text}
          </p>
          <ul className={styles.selectManyOptions}>
            {question.options.map((option) => (
              <li key={option.id} className={styles.selectManyOptionItem}>
                <label className={styles.selectManyOptionLabel}>
                  <input type="checkbox" disabled name={`${question.id}-${option.id}`} />
                  <span>{option.label}</span>
                </label>
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
              onClick={() => onBulkEdit(sectionId, question.id)}
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

  const handleBulkEdit = useCallback(
    (sectionId: string, questionId: string) => {
      toast(`Bulk Edit: ${sectionId} / ${questionId}`);
    },
    [toast]
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
    <div className={styles.canvas}>
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
                            {question.inputKind === 'checkbox' ? (
                              <SelectManyQuestionRow
                                question={question}
                                sectionId={section.id}
                                onAction={(label) => toast(`${label}: ${question.text}`)}
                                onAddOption={handleAddOption}
                                onBulkEdit={handleBulkEdit}
                              />
                            ) : (
                              <QuestionRow
                                question={question}
                                onAction={(label) => toast(`${label}: ${question.text}`)}
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
      </div>

      <button
        type="button"
        className={styles.fab}
        aria-label="Add"
        onClick={() => toast('Quick add')}
      >
        <span className="wm-add" />
      </button>
    </div>
  );
}
