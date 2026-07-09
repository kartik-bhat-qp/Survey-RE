'use client';

import { useMemo } from 'react';
import { SurveyPreviewFollowUpQuestion } from '@/components/surveys/SurveyPreviewFollowUpQuestion';
import { useSurveyPreviewPagination } from '@/components/surveys/useSurveyPreviewPagination';
import {
  DEFAULT_QUESTION_SETTINGS,
  type AnswerDisplayOrder,
  type RandomizeAnswerCount,
} from '@/data/mock-question-settings';
import type { DeepDiveFollowUpSettings } from '@/data/mock-deepdive-question-settings';
import type { SurveyQuestionPreviewFollowUp } from '@/data/survey-question-preview-session';
import type { ShowHideOptionsPreviewConfig } from '@/data/show-hide-options-preview';
import shellStyles from './MultiPointCardsCarouselPreview.module.css';
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
      deepDiveFollowUpSettings,
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
    deepDiveFollowUpSettings,
  ]);

  const { pageIndex, getFooterLabel, handleFooterAction } = useSurveyPreviewPagination(
    pages.length,
    0
  );

  const currentPageQuestions = pages[pageIndex] ?? [];

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
              onClick={() => handleFooterAction(onDone)}
            >
              {getFooterLabel(false)}
            </button>
          </div>
        </div>
      </div>

      <footer className={styles.respondentFooter}>
        <a href="#" className={styles.footerLink} onClick={(event) => event.preventDefault()}>
          Powered by QuestionPro
        </a>
        <span className={styles.footerLinks}>
          <a href="#" className={styles.footerLink} onClick={(event) => event.preventDefault()}>
            Privacy &amp; Data Security
          </a>
          <span className={styles.footerDivider}>|</span>
          <a href="#" className={styles.footerLink} onClick={(event) => event.preventDefault()}>
            Respondent Anonymity Assurance
          </a>
        </span>
      </footer>
    </div>
  );
}
