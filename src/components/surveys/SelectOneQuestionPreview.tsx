'use client';

import { useMemo } from 'react';
import { SurveyPreviewFollowUpQuestion } from '@/components/surveys/SurveyPreviewFollowUpQuestion';
import { useSurveyPreviewPagination } from '@/components/surveys/useSurveyPreviewPagination';
import {
  DEFAULT_QUESTION_SETTINGS,
  type AnswerDisplayOrder,
} from '@/data/mock-question-settings';
import type { SurveyQuestionInputKind } from '@/data/mock-survey-detail';
import type { SurveyQuestionPreviewFollowUp } from '@/data/survey-question-preview-session';
import type { ShowHideOptionsPreviewConfig } from '@/data/show-hide-options-preview';
import shellStyles from './MultiPointCardsCarouselPreview.module.css';
import styles from './SelectOneQuestionPreview.module.css';

export interface SelectOneQuestionPreviewProps {
  surveyId: number;
  surveyTitle: string;
  questionCode: string;
  questionText: string;
  required?: boolean;
  options: { id: string; label: string }[];
  inputKind?: SurveyQuestionInputKind;
  answerDisplayOrder?: AnswerDisplayOrder;
  showHideOptions?: ShowHideOptionsPreviewConfig | null;
  isFirstQuestion?: boolean;
  priorPages?: SurveyQuestionPreviewFollowUp[][];
  samePageFollowUps?: SurveyQuestionPreviewFollowUp[];
  nextPages?: SurveyQuestionPreviewFollowUp[][];
  onDone?: () => void;
  onClose?: () => void;
}

export function SelectOneQuestionPreview({
  surveyId,
  surveyTitle,
  questionCode = 'Q',
  questionText,
  required,
  options,
  inputKind = 'radio',
  answerDisplayOrder = DEFAULT_QUESTION_SETTINGS.answerDisplayOrder,
  showHideOptions = null,
  isFirstQuestion = false,
  priorPages = [],
  samePageFollowUps = [],
  nextPages = [],
  onDone,
  onClose,
}: SelectOneQuestionPreviewProps) {
  const pages = useMemo(() => {
    const anchorPage: SurveyQuestionPreviewFollowUp = {
      code: questionCode,
      text: questionText,
      required,
      kind: 'standard',
      inputKind,
      options,
      answerDisplayOrder,
      showHideOptions,
    };

    return [...priorPages, [anchorPage, ...samePageFollowUps], ...nextPages];
  }, [
    answerDisplayOrder,
    inputKind,
    nextPages,
    options,
    priorPages,
    questionCode,
    questionText,
    required,
    samePageFollowUps,
    showHideOptions,
  ]);

  const startsFromSurveyBeginning = priorPages.length > 0 || isFirstQuestion;
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
              {getFooterLabel(startsFromSurveyBeginning && pageIndex === 0)}
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
