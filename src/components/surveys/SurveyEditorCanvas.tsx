'use client';

import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { SurveyDetail, SurveyQuestion } from '@/data/mock-survey-detail';
import styles from './SurveyEditorCanvas.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenu })),
  { ssr: false }
);
const WuMenuItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuItem })),
  { ssr: false }
);

interface SurveyEditorCanvasProps {
  detail: SurveyDetail;
}

function AddQuestionButton({ onSelect }: { onSelect: (type: string) => void }) {
  return (
    <WuMenu
      Trigger={
        <WuButton size="sm" variant="primary">
          Add Question
          <span className="wm-arrow-drop-down" />
        </WuButton>
      }
      align="center"
    >
      <WuMenuItem onSelect={() => onSelect('Multiple Choice')}>Multiple Choice</WuMenuItem>
      <WuMenuItem onSelect={() => onSelect('Text')}>Text</WuMenuItem>
      <WuMenuItem onSelect={() => onSelect('Matrix')}>Matrix</WuMenuItem>
    </WuMenu>
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
      <div className={styles.questionLabel}>Q{question.number}</div>
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
      <div className={styles.questionActions}>
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

export function SurveyEditorCanvas({ detail }: SurveyEditorCanvasProps) {
  const { showToast } = useWuShowToast();

  function toast(message: string) {
    showToast({ message, variant: 'success' });
  }

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

        {detail.sections.map((section) => (
          <section key={section.id} className={styles.sectionCard}>
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

            <div className={styles.addQuestionRow}>
              <AddQuestionButton onSelect={(type) => toast(`Add ${type} question`)} />
            </div>

            {section.questions.map((question, index) => (
              <div key={question.id}>
                <QuestionRow
                  question={question}
                  onAction={(label) => toast(`${label}: ${question.text}`)}
                />

                {section.showPageBreak && index === 0 ? (
                  <div className={styles.pageBreak}>
                    <div className={styles.pageBreakLine} />
                    <div className={styles.pageBreakActions}>
                      <button
                        type="button"
                        className={styles.pageBreakBtn}
                        onClick={() => toast('Remove page break')}
                      >
                        Remove Page Break
                      </button>
                      <button
                        type="button"
                        className={styles.pageBreakBtn}
                        onClick={() => toast('Remove separator')}
                      >
                        Remove Separator
                      </button>
                      <button
                        type="button"
                        className={styles.pageBreakBtn}
                        onClick={() => toast('Split block')}
                      >
                        Split Block
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            ))}

            <div className={styles.addQuestionRow}>
              <AddQuestionButton onSelect={(type) => toast(`Add ${type} question`)} />
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
