'use client';

import dynamic from 'next/dynamic';
import { useMemo, useRef, useState, type SyntheticEvent } from 'react';
import type { SurveyQuestion, SurveySection } from '@/data/mock-survey-detail';
import {
  getListenAiFirstQuestion,
  isListenAiStudySelected,
  getListenAiResponseFieldToken,
  listListenAiSourceQuestions,
  updateListenAiFirstQuestion,
  updateListenAiSourceQuestion,
  type ListenAiQuestionConfig,
} from '@/data/mock-listenai-question';
import type { ListenAiStudy } from '@/data/mock-listenai-studies';
import { generateListenAiFirstQuestionFromSource } from '@/data/mock-listenai-interview';
import { QuestionRichTextField } from '@/components/surveys/QuestionRichTextField';
import { QuestionWorkspaceActions } from '@/components/surveys/QuestionWorkspaceActions';
import { QuestionWorkspaceFooter } from '@/components/surveys/QuestionWorkspaceFooter';
import type { QuestionMenuAction } from '@/components/surveys/QuestionOptionsMenu';
import styles from './ListenAIQuestionRow.module.css';

const ListenAIStudyPickerModal = dynamic(
  () =>
    import('@/components/surveys/ListenAIStudyPickerModal').then((m) => ({
      default: m.ListenAIStudyPickerModal,
    })),
  { ssr: false }
);

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

const UNSET_STUDY_VALUE = '';

function stopQuestionEvent(event: SyntheticEvent): void {
  event.stopPropagation();
}

export interface ListenAIQuestionRowProps {
  question: SurveyQuestion;
  sectionId: string;
  sections: SurveySection[];
  config: ListenAiQuestionConfig;
  showHideOptionsApplied?: boolean;
  onAction: (label: string) => void;
  onMenuAction: (action: QuestionMenuAction) => void;
  onOpenLogic: () => void;
  onOpenSettings: () => void;
  onQuestionTextChange: (sectionId: string, questionId: string, text: string) => void;
  onConfigChange: (config: ListenAiQuestionConfig) => void;
}

export function ListenAIQuestionRow({
  question,
  sectionId,
  sections,
  config,
  showHideOptionsApplied = false,
  onAction,
  onMenuAction,
  onOpenLogic,
  onOpenSettings,
  onQuestionTextChange,
  onConfigChange,
}: ListenAIQuestionRowProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerCreateMode, setPickerCreateMode] = useState(false);
  const firstQuestionRef = useRef<HTMLTextAreaElement | null>(null);
  const hasStudy = isListenAiStudySelected(config);
  const sourceQuestions = useMemo(
    () => listListenAiSourceQuestions(sections, question.id),
    [question.id, sections]
  );
  const selectedSourceValue =
    sourceQuestions.find((option) => option.questionId === config.study.sourceQuestionId)?.value ??
    UNSET_STUDY_VALUE;
  const responseFieldToken = getListenAiResponseFieldToken(config.study.sourceQuestionCode);

  function handleSelectStudy(nextStudy: ListenAiStudy): void {
    onConfigChange({
      studyId: nextStudy.id,
      study: nextStudy,
    });
  }

  function openPicker(createMode: boolean): void {
    setPickerCreateMode(createMode);
    setPickerOpen(true);
  }

  function handleSourceQuestionChange(value: string): void {
    const selected = sourceQuestions.find((option) => option.value === value);
    const nextStudy = updateListenAiSourceQuestion(config.study, selected ?? null);
    onConfigChange({
      ...config,
      study:
        selected != null
          ? updateListenAiFirstQuestion(
              nextStudy,
              generateListenAiFirstQuestionFromSource(selected.text)
            )
          : nextStudy,
    });
  }

  function insertResponseFieldAtCursor(): void {
    const field = firstQuestionRef.current;
    const current = getListenAiFirstQuestion(config.study);
    if (!field) {
      onConfigChange({
        ...config,
        study: updateListenAiFirstQuestion(
          config.study,
          `${current}${current ? ' ' : ''}${responseFieldToken}`
        ),
      });
      return;
    }

    const start = field.selectionStart ?? current.length;
    const end = field.selectionEnd ?? current.length;
    const nextText = current.slice(0, start) + responseFieldToken + current.slice(end);

    onConfigChange({
      ...config,
      study: updateListenAiFirstQuestion(config.study, nextText),
    });

    queueMicrotask(() => {
      field.focus();
      const nextPosition = start + responseFieldToken.length;
      field.setSelectionRange(nextPosition, nextPosition);
    });
  }

  return (
    <article className={styles.root}>
      <div className="listenAiCard">
        <div className={styles.cardInner}>
          <div className={styles.topBar}>
            <span className={styles.topSpacer} aria-hidden />
            <QuestionWorkspaceActions
              question={question}
              onAction={onAction}
              onOpenLogic={onOpenLogic}
              onOpenSettings={onOpenSettings}
              onMenuAction={onMenuAction}
              showValidation={false}
              menuBtnClassName={styles.menuBtn}
            />
          </div>

          <div className={styles.questionTextWrap}>
            <QuestionRichTextField
              value={question.text}
              onChange={(text) => onQuestionTextChange(sectionId, question.id, text)}
              ariaLabel="Question text"
              placeholder="Enter question text"
              onPointerDown={stopQuestionEvent}
            />
          </div>

          {hasStudy ? (
            <div
              className={styles.targetField}
              onPointerDown={stopQuestionEvent}
              onClick={(event) => event.stopPropagation()}
            >
              <label className={styles.formRow}>
                <span className={styles.fieldLabel}>Select Source Question</span>
                <select
                  className={styles.nativeSelect}
                  value={selectedSourceValue}
                  onChange={(event) => handleSourceQuestionChange(event.target.value)}
                  aria-label="Select source question"
                >
                  <option value={UNSET_STUDY_VALUE}>Select a question</option>
                  {sourceQuestions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.formRow}>
                <span className={styles.labelRow}>
                  <span className={styles.fieldLabel}>First Question</span>
                  <button
                    type="button"
                    className={styles.inlineInsertBtn}
                    onClick={insertResponseFieldAtCursor}
                  >
                    Insert Response
                  </button>
                </span>
                <textarea
                  ref={firstQuestionRef}
                  className={styles.firstQuestionInput}
                  rows={3}
                  value={getListenAiFirstQuestion(config.study)}
                  onChange={(event) =>
                    onConfigChange({
                      ...config,
                      study: updateListenAiFirstQuestion(config.study, event.target.value),
                    })
                  }
                  placeholder="Ask the first ListenAI question"
                />
              </label>
            </div>
          ) : (
            <div
              className={styles.emptyState}
              onPointerDown={stopQuestionEvent}
              onClick={(event) => event.stopPropagation()}
            >
              <p className={styles.emptyTitle}>Connect a ListenAI study</p>
              <p className={styles.emptyCopy}>
                Respondents will be sent to this study for an AI interview, then return to the next
                survey question.
              </p>
              <WuButton variant="primary" onClick={() => openPicker(false)}>
                Connect study
              </WuButton>
            </div>
          )}
        </div>

        <QuestionWorkspaceFooter
          showHideOptionsApplied={showHideOptionsApplied}
          className={styles.footer}
        />
      </div>

      {pickerOpen ? (
        <ListenAIStudyPickerModal
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          selectedStudyId={config.studyId}
          initialCreateMode={pickerCreateMode}
          sections={sections}
          currentQuestionId={question.id}
          onSelectStudy={handleSelectStudy}
        />
      ) : null}
    </article>
  );
}
