'use client';

import type { SyntheticEvent } from 'react';
import type { SurveyQuestion, SurveyQuestionSmileyRating } from '@/data/mock-survey-detail';
import { QuestionRichTextField } from '@/components/surveys/QuestionRichTextField';
import { QuestionWorkspaceActions } from '@/components/surveys/QuestionWorkspaceActions';
import { QuestionWorkspaceFooter } from '@/components/surveys/QuestionWorkspaceFooter';
import { SmileyRatingScalePreview } from '@/components/surveys/SmileyRatingScalePreview';
import type { QuestionMenuAction } from '@/components/surveys/QuestionOptionsMenu';
import styles from './SmileyRatingQuestionRow.module.css';

function stopQuestionEvent(event: SyntheticEvent): void {
  event.stopPropagation();
}

export interface SmileyRatingQuestionRowProps {
  question: SurveyQuestion;
  smileyRating: SurveyQuestionSmileyRating;
  sectionId: string;
  showHideOptionsApplied?: boolean;
  dynamicTextCommentsApplied?: boolean;
  extractionApplied?: boolean;
  quotaControlApplied?: boolean;
  onAction: (label: string) => void;
  onMenuAction: (action: QuestionMenuAction) => void;
  onOpenLogic: () => void;
  onOpenSettings: () => void;
  onOpenValidation: () => void;
  onQuestionTextChange: (sectionId: string, questionId: string, text: string) => void;
  onSmileyOptionLabelChange: (
    sectionId: string,
    questionId: string,
    optionId: string,
    label: string
  ) => void;
}

export function SmileyRatingQuestionRow({
  question,
  smileyRating,
  sectionId,
  showHideOptionsApplied = false,
  dynamicTextCommentsApplied = false,
  extractionApplied = false,
  quotaControlApplied = false,
  onAction,
  onMenuAction,
  onOpenLogic,
  onOpenSettings,
  onOpenValidation,
  onQuestionTextChange,
  onSmileyOptionLabelChange,
}: SmileyRatingQuestionRowProps) {
  return (
    <article className={styles.root}>
      <div className="smileyRatingCard">
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
          <div className={styles.scaleWrap}>
            <SmileyRatingScalePreview
              options={smileyRating.options}
              onOptionLabelChange={(optionId, label) =>
                onSmileyOptionLabelChange(sectionId, question.id, optionId, label)
              }
            />
          </div>
        </div>
        <div className={styles.footerRow}>
          <QuestionWorkspaceFooter
            showHideOptionsApplied={showHideOptionsApplied}
            dynamicTextCommentsApplied={dynamicTextCommentsApplied}
            extractionApplied={extractionApplied}
            quotaControlApplied={quotaControlApplied}
            className={styles.footer}
          />
          <div
            className={styles.footerActions}
            onClick={stopQuestionEvent}
            onKeyDown={stopQuestionEvent}
          >
            <button
              type="button"
              className={styles.footerLink}
              onClick={() => onAction('Change Colors')}
            >
              Change Colors
            </button>
            <button
              type="button"
              className={styles.footerLink}
              onClick={() => onAction('Change Smileys')}
            >
              Change Smileys
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
