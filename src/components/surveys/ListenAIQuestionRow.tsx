'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from 'react';
import type { SurveyQuestion, SurveySection } from '@/data/mock-survey-detail';
import {
  getListenAiFirstQuestion,
  isListenAiStudySelected,
  getListenAiResponseFieldToken,
  listListenAiSourceQuestions,
  resetListenAiSurveyBinding,
  updateListenAiFirstQuestion,
  updateListenAiSourceQuestion,
  type ListenAiQuestionConfig,
} from '@/data/mock-listenai-question';
import type { ListenAiStudy } from '@/data/mock-listenai-studies';
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
const SUGGESTION_ROTATE_MS = 3000;
const MAX_SUGGESTIONS = 3;

function stopQuestionEvent(event: SyntheticEvent): void {
  event.stopPropagation();
}

function buildSuggestedFirstQuestions(
  sourceQuestionText: string | undefined,
  responseFieldToken: string
): string[] {
  const source = sourceQuestionText?.trim().replace(/\?+$/, '');
  if (!source) return [];

  const lower = source.toLowerCase();
  const suggestions: string[] = [];

  if (lower.includes('like the most')) {
    suggestions.push(
      `What do you like the most about ${responseFieldToken}?`,
      `What stands out most when you think about ${responseFieldToken}?`,
      `Can you share a recent experience that made you choose ${responseFieldToken}?`
    );
  } else if (lower.startsWith('which ')) {
    suggestions.push(
      `What made you choose ${responseFieldToken}?`,
      `What do you like the most about ${responseFieldToken}?`,
      `Can you tell me more about why ${responseFieldToken} stood out?`
    );
  } else if (lower.startsWith('what ')) {
    suggestions.push(
      `Can you tell me more about why you answered ${responseFieldToken}?`,
      `What do you like the most about ${responseFieldToken}?`,
      `What usually drives you toward ${responseFieldToken}?`
    );
  } else {
    suggestions.push(
      `Can you tell me more about ${responseFieldToken}?`,
      `What do you like the most about ${responseFieldToken}?`,
      `What made ${responseFieldToken} the right choice for you?`
    );
  }

  return suggestions.slice(0, MAX_SUGGESTIONS);
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
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const firstQuestionRef = useRef<HTMLTextAreaElement | null>(null);
  const hasStudy = isListenAiStudySelected(config);
  const sourceQuestions = useMemo(
    () => listListenAiSourceQuestions(sections, question.id),
    [question.id, sections]
  );
  const selectedSourceValue =
    sourceQuestions.find((option) => option.questionId === config.study.sourceQuestionId)?.value ??
    UNSET_STUDY_VALUE;
  const selectedSourceQuestion =
    sourceQuestions.find((option) => option.questionId === config.study.sourceQuestionId) ?? null;
  const responseFieldToken = getListenAiResponseFieldToken(config.study.sourceQuestionCode);
  const suggestedFirstQuestions = useMemo(
    () =>
      buildSuggestedFirstQuestions(selectedSourceQuestion?.text, responseFieldToken),
    [responseFieldToken, selectedSourceQuestion?.text]
  );
  const activeSuggestion =
    suggestedFirstQuestions.length > 0
      ? suggestedFirstQuestions[suggestionIndex % suggestedFirstQuestions.length]
      : null;

  useEffect(() => {
    setSuggestionIndex(0);
    if (suggestedFirstQuestions.length <= 1) return;

    const intervalId = window.setInterval(() => {
      setSuggestionIndex((current) => (current + 1) % suggestedFirstQuestions.length);
    }, SUGGESTION_ROTATE_MS);

    return () => window.clearInterval(intervalId);
  }, [suggestedFirstQuestions]);

  function handleSelectStudy(nextStudy: ListenAiStudy): void {
    onConfigChange({
      studyId: nextStudy.id,
      study: resetListenAiSurveyBinding(nextStudy),
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
      study: updateListenAiFirstQuestion(nextStudy, ''),
    });
  }

  function applySuggestedFirstQuestion(suggestion: string): void {
    onConfigChange({
      ...config,
      study: updateListenAiFirstQuestion(config.study, suggestion),
    });
    queueMicrotask(() => {
      firstQuestionRef.current?.focus();
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
                  <span className={styles.fieldLabel}>First ListenAI Question</span>
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
                {activeSuggestion ? (
                  <p className={styles.firstQuestionHelper} aria-live="polite">
                    <span className={styles.firstQuestionHelperPrefix}>
                      Suggested for this source question:
                    </span>
                    <button
                      type="button"
                      className={styles.firstQuestionExample}
                      title="Double-click to use this suggestion"
                      onDoubleClick={() => applySuggestedFirstQuestion(activeSuggestion)}
                    >
                      {activeSuggestion}
                    </button>
                  </p>
                ) : (
                  <p className={styles.firstQuestionHelper}>
                    Use Insert Response to reference the selected answer in your prompt.
                  </p>
                )}
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
