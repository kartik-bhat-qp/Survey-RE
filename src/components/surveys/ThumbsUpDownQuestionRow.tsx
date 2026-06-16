'use client';

import type { SyntheticEvent } from 'react';
import type { SurveyQuestion, SurveyQuestionThumbsUpDown } from '@/data/mock-survey-detail';
import { QuestionRichTextField } from '@/components/surveys/QuestionRichTextField';
import { QuestionWorkspaceActions } from '@/components/surveys/QuestionWorkspaceActions';
import { QuestionWorkspaceFooter } from '@/components/surveys/QuestionWorkspaceFooter';
import { ThumbsUpDownScalePreview } from '@/components/surveys/ThumbsUpDownScalePreview';
import type { QuestionMenuAction } from '@/components/surveys/QuestionOptionsMenu';
import styles from './ThumbsUpDownQuestionRow.module.css';

function stopQuestionEvent(event: SyntheticEvent): void {
  event.stopPropagation();
}

export interface ThumbsUpDownQuestionRowProps {
  question: SurveyQuestion;
  thumbsUpDown: SurveyQuestionThumbsUpDown;
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
  onThumbsChoiceLabelChange: (
    sectionId: string,
    questionId: string,
    choiceId: string,
    label: string
  ) => void;
}

export function ThumbsUpDownQuestionRow({
  question,
  thumbsUpDown,
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
  onThumbsChoiceLabelChange,
}: ThumbsUpDownQuestionRowProps) {
  return (
    <article className={styles.root}>
      <div className="thumbsUpDownCard">
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
            <ThumbsUpDownScalePreview
              choices={thumbsUpDown.choices}
              onChoiceLabelChange={(choiceId, label) =>
                onThumbsChoiceLabelChange(sectionId, question.id, choiceId, label)
              }
            />
          </div>
        </div>
        <QuestionWorkspaceFooter
          showHideOptionsApplied={showHideOptionsApplied}
          dynamicTextCommentsApplied={dynamicTextCommentsApplied}
          extractionApplied={extractionApplied}
          quotaControlApplied={quotaControlApplied}
          className={styles.footer}
        />
      </div>
    </article>
  );
}
