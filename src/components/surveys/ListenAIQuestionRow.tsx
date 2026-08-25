'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type SyntheticEvent } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { CREDITS_WALLET_PATH } from '@/data/mock-credits-wallet';
import type { SurveyQuestion, SurveySection } from '@/data/mock-survey-detail';
import {
  getListenAiFirstQuestion,
  getListenAiIndependentOpenerSuggestion,
  isListenAiStudySelected,
  getListenAiResponseFieldToken,
  listListenAiSourceQuestions,
  LISTENAI_CREDITS_PER_CONVERSATION,
  LISTENAI_CREDITS_REMAINING,
  resetListenAiSurveyBinding,
  setListenAiConversationMode,
  updateListenAiFirstQuestion,
  updateListenAiSourceQuestion,
  type ListenAiQuestionConfig,
} from '@/data/mock-listenai-question';
import {
  isListenAiIndependentConversation,
  normalizeListenAiConversationMode,
  type ListenAiConversationMode,
  type ListenAiStudy,
} from '@/data/mock-listenai-studies';
import { formatNumber } from '@/data/mock-utils';
import { QuestionWorkspaceActions } from '@/components/surveys/QuestionWorkspaceActions';
import { ShowHideOptionsAppliedIcon } from '@/components/surveys/ShowHideOptionsAppliedIcon';
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
  onConfigChange,
}: ListenAIQuestionRowProps) {
  const { showToast } = useWuShowToast();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerCreateMode, setPickerCreateMode] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const firstQuestionRef = useRef<HTMLTextAreaElement | null>(null);
  const hasStudy = isListenAiStudySelected(config);
  const conversationMode = normalizeListenAiConversationMode(config.study);
  const isIndependent = isListenAiIndependentConversation(config.study);
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

  const independentSuggestion = useMemo(
    () => getListenAiIndependentOpenerSuggestion(config.study.objectives),
    [config.study.objectives]
  );

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

  function handleConversationModeChange(nextMode: ListenAiConversationMode): void {
    if (nextMode === conversationMode) return;
    onConfigChange({
      ...config,
      study: setListenAiConversationMode(config.study, nextMode),
    });
  }

  function handleSourceQuestionChange(value: string): void {
    const selected = sourceQuestions.find((option) => option.value === value);
    const nextStudy = updateListenAiSourceQuestion(config.study, selected ?? null);
    onConfigChange({
      ...config,
      study: updateListenAiFirstQuestion(
        setListenAiConversationMode(nextStudy, 'followup'),
        ''
      ),
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

          {hasStudy ? (
            <div
              className={styles.targetField}
              onPointerDown={stopQuestionEvent}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={styles.formRow}>
                <span className={styles.fieldLabel}>Conversation mode</span>
                <div className={styles.modeToggle} role="group" aria-label="Conversation mode">
                  <button
                    type="button"
                    className={
                      !isIndependent ? styles.modeToggleActive : styles.modeToggleInactive
                    }
                    aria-pressed={!isIndependent}
                    onClick={() => handleConversationModeChange('followup')}
                  >
                    Follow-up
                  </button>
                  <button
                    type="button"
                    className={
                      isIndependent ? styles.modeToggleActive : styles.modeToggleInactive
                    }
                    aria-pressed={isIndependent}
                    onClick={() => handleConversationModeChange('independent')}
                  >
                    Independent
                  </button>
                </div>
                <p className={styles.modeHelper}>
                  {isIndependent
                    ? 'The conversation stands on its own. Respondents answer your opening question, then the AI probes toward your objectives.'
                    : 'The conversation starts from an answer the respondent already gave in this survey.'}
                </p>
              </div>

              {isIndependent ? (
                <>
                  <label className={styles.formRow}>
                    <span className={styles.fieldLabel}>
                      Enter the opening question of the conversation
                    </span>
                    <textarea
                      ref={firstQuestionRef}
                      className={`${styles.firstQuestionInput} ${styles.firstQuestionInputBare}`}
                      rows={3}
                      value={getListenAiFirstQuestion(config.study)}
                      onChange={(event) =>
                        onConfigChange({
                          ...config,
                          study: updateListenAiFirstQuestion(config.study, event.target.value),
                        })
                      }
                      placeholder="Enter the question the AI interviewer opens with"
                    />
                    <p className={styles.firstQuestionHelper} aria-live="polite">
                      <span className={styles.firstQuestionHelperPrefix}>
                        Suggested from your objectives:
                      </span>
                      <button
                        type="button"
                        className={styles.firstQuestionExample}
                        title="Click to use this suggestion"
                        onClick={() => applySuggestedFirstQuestion(independentSuggestion)}
                      >
                        {independentSuggestion}
                      </button>
                    </p>
                  </label>
                </>
              ) : (
                <>
                  <label className={styles.formRow}>
                    <span className={styles.fieldLabel}>
                      Select the survey question you want to follow-up on
                    </span>
                    <select
                      className={styles.nativeSelect}
                      value={selectedSourceValue}
                      onChange={(event) => handleSourceQuestionChange(event.target.value)}
                      aria-label="Select the survey question you want to follow-up on"
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
                    <span className={styles.fieldLabel}>
                      Enter the follow-up question you want to start with
                    </span>
                    <div className={styles.firstQuestionInputWrap}>
                      <button
                        type="button"
                        className={styles.inlineInsertBtn}
                        onClick={insertResponseFieldAtCursor}
                      >
                        Insert Response
                      </button>
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
                        placeholder="Enter the follow-up question you want to start with"
                      />
                    </div>
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
                </>
              )}
            </div>
          ) : (
            <div
              className={styles.emptyState}
              onPointerDown={stopQuestionEvent}
              onClick={(event) => event.stopPropagation()}
            >
              <p className={styles.emptyTitle}>Connect a Conversation study</p>
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

        <div
          className={styles.creditsFooter}
          onPointerDown={stopQuestionEvent}
          onClick={(event) => event.stopPropagation()}
          aria-label="Conversation credits"
        >
          {showHideOptionsApplied ? <ShowHideOptionsAppliedIcon /> : null}
          <div className={styles.creditsRate}>
            <span className={`wc-ai ${styles.creditsAiIcon}`} aria-hidden />
            <p className={styles.creditsRateText}>
              <strong>{LISTENAI_CREDITS_PER_CONVERSATION} credits</strong>
              {' per conversation'}
            </p>
          </div>
          <Link
            href={CREDITS_WALLET_PATH}
            className={styles.creditsBalance}
            aria-label={`${formatNumber(LISTENAI_CREDITS_REMAINING)} credits left`}
          >
            <span className={styles.creditsBalanceText}>
              {formatNumber(LISTENAI_CREDITS_REMAINING)} credits left
            </span>
          </Link>
          <button
            type="button"
            className={styles.buyCreditsBtn}
            onClick={() => showToast({ message: 'Buy credits', variant: 'info' })}
          >
            Buy credits
          </button>
        </div>
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
