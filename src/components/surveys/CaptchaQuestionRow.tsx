'use client';

import type { SyntheticEvent } from 'react';
import type { SurveyQuestion } from '@/data/mock-survey-detail';
import type { CaptchaFeedbackStyle, CaptchaRecaptchaType } from '@/data/mock-captcha-settings';
import { CaptchaQuestionPreview } from '@/components/surveys/CaptchaQuestionPreview';
import { CaptchaInvisibleVerification } from '@/components/surveys/CaptchaInvisibleRespondentPreview';
import { QuestionRichTextField } from '@/components/surveys/QuestionRichTextField';
import { QuestionWorkspaceActions } from '@/components/surveys/QuestionWorkspaceActions';
import { QuestionWorkspaceFooter } from '@/components/surveys/QuestionWorkspaceFooter';
import type { QuestionMenuAction } from '@/components/surveys/QuestionOptionsMenu';
import styles from './CaptchaQuestionRow.module.css';

function stopQuestionEvent(event: SyntheticEvent): void {
  event.stopPropagation();
}

export interface CaptchaQuestionRowProps {
  question: SurveyQuestion;
  sectionId: string;
  recaptchaType?: CaptchaRecaptchaType;
  captchaFeedbackStyle?: CaptchaFeedbackStyle;
  showV2OnV3VerificationFailed?: boolean;
  showHideOptionsApplied?: boolean;
  onAction: (label: string) => void;
  onMenuAction: (action: QuestionMenuAction) => void;
  onOpenLogic: () => void;
  onOpenSettings: () => void;
  onOpenValidation: () => void;
  onQuestionTextChange: (sectionId: string, questionId: string, text: string) => void;
}

export function CaptchaQuestionRow({
  question,
  sectionId,
  recaptchaType = 'v2',
  captchaFeedbackStyle = 'button',
  showV2OnV3VerificationFailed = true,
  showHideOptionsApplied = false,
  onAction,
  onMenuAction,
  onOpenLogic,
  onOpenSettings,
  onOpenValidation,
  onQuestionTextChange,
}: CaptchaQuestionRowProps) {
  return (
    <article className={styles.root}>
      <div className="captchaCard">
        <div className={styles.cardInner}>
          <div className={styles.topBar}>
            <span className={styles.topSpacer} aria-hidden />
            <QuestionWorkspaceActions
              question={question}
              onAction={onAction}
              onOpenLogic={onOpenLogic}
              onOpenSettings={onOpenSettings}
              onOpenValidation={onOpenValidation}
              onMenuAction={onMenuAction}
              menuBtnClassName={styles.menuBtn}
            />
          </div>
          {recaptchaType === 'v2' ? (
            <div className={styles.questionTextWrap}>
              {question.required ? <span className={styles.required}>*</span> : null}
              <QuestionRichTextField
                value={question.text}
                onChange={(text) => onQuestionTextChange(sectionId, question.id, text)}
                ariaLabel="Question text"
                placeholder="Enter question text"
                onPointerDown={stopQuestionEvent}
              />
            </div>
          ) : null}
          <div
            className={
              recaptchaType === 'invisible' ? styles.answerWrapInvisible : styles.answerWrap
            }
          >
            <CaptchaQuestionPreview variant={recaptchaType} />
            {recaptchaType === 'invisible' ? (
              <CaptchaInvisibleVerification
                embedded
                feedbackStyle={captchaFeedbackStyle}
                showV2OnVerificationFailed={showV2OnV3VerificationFailed}
              />
            ) : null}
          </div>
        </div>
        <QuestionWorkspaceFooter
          showHideOptionsApplied={showHideOptionsApplied}
          className={styles.footer}
        />
      </div>
    </article>
  );
}
