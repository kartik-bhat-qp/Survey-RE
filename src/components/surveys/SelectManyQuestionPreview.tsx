'use client';

import { useMemo, useState } from 'react';
import { SurveyPreviewFollowUpQuestion } from '@/components/surveys/SurveyPreviewFollowUpQuestion';
import { useSurveyPreviewPagination } from '@/components/surveys/useSurveyPreviewPagination';
import { useSurveyPreviewAnswers } from '@/components/surveys/SurveyPreviewAnswerContext';
import { DeepDiveConversationScreen } from '@/components/surveys/DeepDiveConversationScreen';
import {
  DEFAULT_QUESTION_SETTINGS,
  type AnswerDisplayOrder,
  type RandomizeAnswerCount,
} from '@/data/mock-question-settings';
import type { DeepDiveFollowUpSettings } from '@/data/mock-deepdive-question-settings';
import type { SurveyQuestionPreviewFollowUp } from '@/data/survey-question-preview-session';
import type { ShowHideOptionsPreviewConfig } from '@/data/show-hide-options-preview';
import shellStyles from './MultiPointCardsCarouselPreview.module.css';
import { SurveyPreviewRespondentFooter } from '@/components/surveys/SurveyPreviewRespondentFooter';
import styles from './SelectManyQuestionPreview.module.css';

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
  samePageFollowUps = [],
  nextPages = [],
  onDone,
  onClose,
}: SelectManyQuestionPreviewProps) {
  // When deepDive fires, switch to the conversation screen
  const [deepDiveLabel, setDeepDiveLabel] = useState<string | null>(null);

  const { answersByCode } = useSurveyPreviewAnswers();

  const pages = useMemo(() => {
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
    // On the first page, check whether DeepDive should fire
    if (pageIndex === 0 && deepDiveFollowUpSettings?.enabled) {
      const answer = answersByCode[questionCode];
      const selectedLabels = answer?.selectedLabels ?? [];
      if (selectedLabels.length > 0) {
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

          {currentPageQuestions.map((question, index) => (
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
