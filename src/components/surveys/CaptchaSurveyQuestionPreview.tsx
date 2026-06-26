'use client';

import type { CaptchaSettings } from '@/data/mock-captcha-settings';
import type { SurveyQuestionPreviewFollowUp } from '@/data/survey-question-preview-session';
import { CaptchaQuestionPreview } from '@/components/surveys/CaptchaQuestionPreview';
import { CaptchaInvisibleVerification } from '@/components/surveys/CaptchaInvisibleRespondentPreview';
import { plainTextFromRichValue } from '@/components/surveys/QuestionRichTextField';
import { SurveyPreviewFollowUpQuestion } from '@/components/surveys/SurveyPreviewFollowUpQuestion';
import { useSurveyPreviewPagination } from '@/components/surveys/useSurveyPreviewPagination';
import shellStyles from './MultiPointCardsCarouselPreview.module.css';
import questionStyles from './SurveyPreviewFollowUpQuestion.module.css';
import footerStyles from './SelectOneQuestionPreview.module.css';

export interface CaptchaSurveyQuestionPreviewProps {
  surveyId: number;
  surveyTitle: string;
  questionCode?: string;
  questionText: string;
  required?: boolean;
  captchaSettings: CaptchaSettings;
  isFirstQuestion?: boolean;
  samePageFollowUps?: SurveyQuestionPreviewFollowUp[];
  nextPages?: SurveyQuestionPreviewFollowUp[][];
  onDone?: () => void;
  onClose?: () => void;
}

export function CaptchaSurveyQuestionPreview({
  surveyId,
  surveyTitle,
  questionText,
  required,
  captchaSettings,
  isFirstQuestion = false,
  samePageFollowUps = [],
  nextPages = [],
  onDone,
  onClose,
}: CaptchaSurveyQuestionPreviewProps) {
  const { recaptchaType, captchaFeedbackStyle, showV2OnV3VerificationFailed } =
    captchaSettings;

  const totalPages = 1 + nextPages.length;
  const { pageIndex, getFooterLabel, handleFooterAction } = useSurveyPreviewPagination(
    totalPages,
    0
  );
  const footerLabel = getFooterLabel(isFirstQuestion && pageIndex === 0);
  const plainQuestion = plainTextFromRichValue(questionText);
  const isCaptchaPage = pageIndex === 0;
  const followUpPageQuestions = isCaptchaPage ? [] : (nextPages[pageIndex - 1] ?? []);

  function handleAdvance(): void {
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
          {isCaptchaPage ? (
            recaptchaType === 'v2' ? (
              <>
                <p className={shellStyles.requiredNote}>Questions marked with a * are required</p>
                <h2 className={questionStyles.questionTitle}>
                  {required ? <span className={questionStyles.requiredMark}>*</span> : null}
                  <span>{plainQuestion || 'Select Captcha and Verify'}</span>
                </h2>
                <CaptchaQuestionPreview variant="v2" />
                {samePageFollowUps.map((question, index) => (
                  <SurveyPreviewFollowUpQuestion
                    key={`${question.code}-same-page`}
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
                    {footerLabel}
                  </button>
                </div>
              </>
            ) : (
              <>
                <CaptchaQuestionPreview variant="invisible" />
                {samePageFollowUps.map((question, index) => (
                  <SurveyPreviewFollowUpQuestion
                    key={`${question.code}-same-page`}
                    question={question}
                    surveyId={surveyId}
                    showDivider={index > 0}
                  />
                ))}
                <CaptchaInvisibleVerification
                  feedbackStyle={captchaFeedbackStyle}
                  showV2OnVerificationFailed={showV2OnV3VerificationFailed}
                  autoPlayPreview
                  footerLabel={footerLabel}
                  onAdvance={handleAdvance}
                />
              </>
            )
          ) : (
            <>
              <p className={shellStyles.requiredNote}>Questions marked with a * are required</p>
              {followUpPageQuestions.map((question, index) => (
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
                  {footerLabel}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <footer className={footerStyles.respondentFooter}>
        <a href="#" className={footerStyles.footerLink} onClick={(event) => event.preventDefault()}>
          Powered by QuestionPro
        </a>
        <span className={footerStyles.footerLinks}>
          <a href="#" className={footerStyles.footerLink} onClick={(event) => event.preventDefault()}>
            Privacy &amp; Data Security
          </a>
          <span className={footerStyles.footerDivider}>|</span>
          <a href="#" className={footerStyles.footerLink} onClick={(event) => event.preventDefault()}>
            Respondent Anonymity Assurance
          </a>
        </span>
      </footer>
    </div>
  );
}
