'use client';

import { useMemo, useState } from 'react';
import { SurveyPreviewFollowUpQuestion } from '@/components/surveys/SurveyPreviewFollowUpQuestion';
import { useSurveyPreviewPagination } from '@/components/surveys/useSurveyPreviewPagination';
import { useSurveyPreviewAnswers } from '@/components/surveys/SurveyPreviewAnswerContext';
import { DeepDiveConversationScreen } from '@/components/surveys/DeepDiveConversationScreen';
import {
  ListenAiRespondentFlow,
  findListenAiOnPage,
  resolveListenAiAnswerLabel,
} from '@/components/surveys/ListenAiRespondentFlow';
import type { ListenAiPreviewPayload } from '@/data/mock-listenai-question';
import {
  DEFAULT_QUESTION_SETTINGS,
  type AnswerDisplayOrder,
  type RandomizeAnswerCount,
} from '@/data/mock-question-settings';
import {
  shouldTriggerDeepDiveForSelection,
  type DeepDiveFollowUpSettings,
} from '@/data/mock-deepdive-question-settings';
import type { SurveyQuestionPreviewFollowUp } from '@/data/survey-question-preview-session';
import type { ShowHideOptionsPreviewConfig } from '@/data/show-hide-options-preview';
import shellStyles from './MultiPointCardsCarouselPreview.module.css';
import { SurveyPreviewRespondentFooter } from '@/components/surveys/SurveyPreviewRespondentFooter';

export interface SelectManyQuestionPreviewProps {
  surveyId: number;
  surveyTitle: string;
  questionCode: string;
  questionText: string;
  required?: boolean;
  options: { id: string; label: string }[];
  answerDisplayOrder?: AnswerDisplayOrder;
  randomizeAnswerCount?: RandomizeAnswerCount;
  alternateFlipReversed?: boolean;
  showHideOptions?: ShowHideOptionsPreviewConfig | null;
  deepDiveFollowUpSettings?: DeepDiveFollowUpSettings | null;
  listenAiLaunch?: ListenAiPreviewPayload | null;
  samePageFollowUps?: SurveyQuestionPreviewFollowUp[];
  nextPages?: SurveyQuestionPreviewFollowUp[][];
  onDone?: () => void;
  onClose?: () => void;
}

export function SelectManyQuestionPreview({
  surveyId,
  surveyTitle,
  questionCode = 'Q',
  questionText,
  required,
  options,
  answerDisplayOrder = DEFAULT_QUESTION_SETTINGS.answerDisplayOrder,
  randomizeAnswerCount = DEFAULT_QUESTION_SETTINGS.randomizeAnswerCount,
  alternateFlipReversed,
  showHideOptions = null,
  deepDiveFollowUpSettings = null,
  listenAiLaunch = null,
  samePageFollowUps = [],
  nextPages = [],
  onDone,
  onClose,
}: SelectManyQuestionPreviewProps) {
  // When deepDive fires, switch to the conversation screen
  const [deepDiveLabel, setDeepDiveLabel] = useState<string | null>(null);
  const [listenAiPhase, setListenAiPhase] = useState<'idle' | 'active'>(
    listenAiLaunch ? 'active' : 'idle'
  );

  const { answersByCode } = useSurveyPreviewAnswers();

  const pages = useMemo(() => {
    if (listenAiLaunch) {
      return [...nextPages];
    }

    const anchorPage: SurveyQuestionPreviewFollowUp = {
      code: questionCode,
      text: questionText,
      required,
      kind: 'standard',
      inputKind: 'checkbox',
      options,
      answerDisplayOrder,
      randomizeAnswerCount,
      alternateFlipReversed,
      showHideOptions,
      deepDiveFollowUpSettings: null, // inline DeepDive removed; handled separately
    };

    return [[anchorPage, ...samePageFollowUps], ...nextPages];
  }, [
    alternateFlipReversed,
    answerDisplayOrder,
    listenAiLaunch,
    randomizeAnswerCount,
    nextPages,
    options,
    questionCode,
    questionText,
    required,
    samePageFollowUps,
    showHideOptions,
  ]);

  const { pageIndex, getFooterLabel, handleFooterAction } = useSurveyPreviewPagination(
    pages.length,
    0
  );

  const currentPageQuestions = pages[pageIndex] ?? [];
  const listenAiOnPage = findListenAiOnPage(currentPageQuestions);
  const surveyQuestionsOnPage = currentPageQuestions.filter((question) => question.kind !== 'listenai');
  const shouldShowListenAi =
    listenAiPhase === 'active' ||
    Boolean(listenAiOnPage && surveyQuestionsOnPage.length === 0);

  if (shouldShowListenAi) {
    const payload =
      listenAiLaunch && listenAiPhase === 'active'
        ? listenAiLaunch
        : (listenAiOnPage?.listenAi ?? null);
    return (
      <ListenAiRespondentFlow
        payload={payload}
        selectedAnswerLabel={resolveListenAiAnswerLabel(payload, answersByCode)}
        surveyId={surveyId}
        surveyTitle={surveyTitle}
        onClose={onClose}
        onComplete={() => {
          setListenAiPhase('idle');
          if (listenAiLaunch) {
            if (nextPages.length === 0) {
              onDone?.();
            }
            return;
          }
          handleFooterAction(onDone);
        }}
      />
    );
  }

  // ── If DeepDive conversation is active, show the full-screen conversation ──
  if (deepDiveLabel !== null && deepDiveFollowUpSettings?.enabled) {
    return (
      <div className={shellStyles.shell}>
        <header className={shellStyles.previewHeader}>
          <span className={shellStyles.previewHeaderTitle}>{surveyTitle}</span>
          <button
            type="button"
            className={shellStyles.previewCloseBtn}
            aria-label="Close preview"
            onClick={onClose}
          >
            <span className="wm-logout" aria-hidden />
          </button>
        </header>

        <div className={shellStyles.previewCanvas}>
          <div className={shellStyles.questionContainer}>
            <DeepDiveConversationScreen
              settings={deepDiveFollowUpSettings}
              selectedAnswerLabel={deepDiveLabel}
              onDone={() => {
                // Return to question flow and advance to next page (or close if last)
                setDeepDiveLabel(null);
                handleFooterAction(onDone);
              }}
            />
          </div>
        </div>

        <SurveyPreviewRespondentFooter surveyId={surveyId} />
      </div>
    );
  }

  // ── Normal question view ───────────────────────────────────────────────────
  function handleNext(): void {
    if (listenAiOnPage && surveyQuestionsOnPage.length > 0 && listenAiPhase === 'idle') {
      setListenAiPhase('active');
      return;
    }
    // On the first page, check whether DeepDive should fire
    if (pageIndex === 0 && deepDiveFollowUpSettings?.enabled) {
      const answer = answersByCode[questionCode];
      const selectedOptionIds = answer?.selectedOptionIds ?? [];
      const selectedLabels = answer?.selectedLabels ?? [];
      if (
        selectedLabels.length > 0 &&
        shouldTriggerDeepDiveForSelection(deepDiveFollowUpSettings, selectedOptionIds)
      ) {
        setDeepDiveLabel(selectedLabels[0]);
        return;
      }
    }
    handleFooterAction(onDone);
  }

  return (
    <div className={shellStyles.shell}>
      <header className={shellStyles.previewHeader}>
        <span className={shellStyles.previewHeaderTitle}>{surveyTitle}</span>
        <button
          type="button"
          className={shellStyles.previewCloseBtn}
          aria-label="Close preview"
          onClick={onClose}
        >
          <span className="wm-logout" aria-hidden />
        </button>
      </header>

      <div className={shellStyles.previewCanvas}>
        <div className={shellStyles.questionContainer}>
          <p className={shellStyles.requiredNote}>Questions marked with a * are required</p>

          {surveyQuestionsOnPage.map((question, index) => (
            <SurveyPreviewFollowUpQuestion
              key={`${question.code}-${pageIndex}`}
              question={question}
              surveyId={surveyId}
              showDivider={index > 0}
            />
          ))}

          <div className={shellStyles.previewFooter}>
            <button
              type="button"
              className={shellStyles.doneBtn}
              onClick={handleNext}
            >
              {getFooterLabel(false)}
            </button>
          </div>
        </div>
      </div>

      <SurveyPreviewRespondentFooter surveyId={surveyId} />
    </div>
  );
}
