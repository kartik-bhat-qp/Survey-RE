'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMemo, useRef, useState, type SyntheticEvent } from 'react';
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
  formatListenAiConversationsCompact,
  getListenAiConversationsRemaining,
  getListenAiCreditsBalanceTone,
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

function stopQuestionEvent(event: SyntheticEvent): void {
  event.stopPropagation();
}

function getSuggestedFirstQuestion(
  sourceQuestionText: string | undefined,
  responseFieldToken: string
): string | null {
  const source = sourceQuestionText?.trim().replace(/\?+$/, '');
  if (!source) return null;

  const lower = source.toLowerCase();

  if (lower.includes('like the most')) {
    return `What do you like the most about ${responseFieldToken}?`;
  }
  if (lower.startsWith('which ')) {
    return `What made you choose ${responseFieldToken}?`;
  }
  if (lower.startsWith('what ')) {
    return `Can you tell me more about why you answered ${responseFieldToken}?`;
  }
  return `Can you tell me more about ${responseFieldToken}?`;
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
  const suggestedFirstQuestion = useMemo(
    () => getSuggestedFirstQuestion(selectedSourceQuestion?.text, responseFieldToken),
    [responseFieldToken, selectedSourceQuestion?.text]
  );

  const independentSuggestion = useMemo(
    () => getListenAiIndependentOpenerSuggestion(config.study.objectives),
    [config.study.objectives]
  );
  const conversationsRemaining = getListenAiConversationsRemaining();
  const conversationsRemainingLabel = formatListenAiConversationsCompact(conversationsRemaining);
  const creditsBalanceTone = getListenAiCreditsBalanceTone(conversationsRemaining);

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
    const withMode = setListenAiConversationMode(config.study, nextMode);
    const nextOpener =
      nextMode === 'independent'
        ? getListenAiFirstQuestion(withMode).trim() ||
          getListenAiIndependentOpenerSuggestion(withMode.objectives)
        : getListenAiFirstQuestion(withMode);
    onConfigChange({
      ...config,
      study: updateListenAiFirstQuestion(withMode, nextOpener),
    });
  }

  function handleSourceQuestionChange(value: string): void {
    const selected = sourceQuestions.find((option) => option.value === value);
    const nextStudy = updateListenAiSourceQuestion(config.study, selected ?? null);
    const suggestion = selected
      ? getSuggestedFirstQuestion(
          selected.text,
          getListenAiResponseFieldToken(selected.code)
        )
      : null;
    onConfigChange({
      ...config,
      study: updateListenAiFirstQuestion(
        setListenAiConversationMode(nextStudy, 'followup'),
        suggestion ?? ''
      ),
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
                      placeholder={independentSuggestion}
                    />
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
                        placeholder={
                          suggestedFirstQuestion ??
                          'Enter the follow-up question you want to start with'
                        }
                      />
                    </div>
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
              <strong>
                {LISTENAI_CREDITS_PER_CONVERSATION} QuestionPro AI credit
                {LISTENAI_CREDITS_PER_CONVERSATION === 1 ? '' : 's'} per conversation
              </strong>
            </p>
          </div>
          <div className={styles.creditsStatus}>
            <Link
              href={CREDITS_WALLET_PATH}
              className={styles.creditsBalance}
              aria-label={`Balance covers about ${conversationsRemainingLabel} conversations more`}
            >
              <span
                className={`${styles.creditsStatusDot} ${
                  creditsBalanceTone === 'critical'
                    ? styles.creditsStatusDotCritical
                    : creditsBalanceTone === 'warning'
                      ? styles.creditsStatusDotWarning
                      : styles.creditsStatusDotHealthy
                }`}
                aria-hidden
              />
              <span className={styles.creditsBalanceText}>
                Balance covers ~{conversationsRemainingLabel} conversations more
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
