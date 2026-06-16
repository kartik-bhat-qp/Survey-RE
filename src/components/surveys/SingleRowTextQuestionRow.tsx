'use client';

import type { SyntheticEvent } from 'react';
import type { SurveyQuestion } from '@/data/mock-survey-detail';
import { DEFAULT_SINGLE_ROW_ANSWER_PLACEHOLDER } from '@/data/mock-survey-detail';
import { SingleRowTextQuestionPreview } from '@/components/surveys/SingleRowTextQuestionPreview';
import { QuestionRichTextField } from '@/components/surveys/QuestionRichTextField';
import { QuestionWorkspaceActions } from '@/components/surveys/QuestionWorkspaceActions';
import { QuestionWorkspaceFooter } from '@/components/surveys/QuestionWorkspaceFooter';
import type { QuestionMenuAction } from '@/components/surveys/QuestionOptionsMenu';
import styles from './SingleRowTextQuestionRow.module.css';

function stopQuestionEvent(event: SyntheticEvent): void {
  event.stopPropagation();
}

export interface SingleRowTextQuestionRowProps {
  question: SurveyQuestion;
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
  onAddAnswerRow: () => void;
  onQuestionTextChange: (sectionId: string, questionId: string, text: string) => void;
}

export function SingleRowTextQuestionRow({
  question,
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
  onAddAnswerRow,
  onQuestionTextChange,
}: SingleRowTextQuestionRowProps) {
  return (
    <article className={styles.root}>
      <div className="singleRowTextCard">
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
          <div className={styles.answerWrap}>
            <SingleRowTextQuestionPreview placeholder={DEFAULT_SINGLE_ROW_ANSWER_PLACEHOLDER} />
            <button
              type="button"
              className={styles.addRowBtn}
              aria-label="Add answer row"
              onClick={(event) => {
                event.stopPropagation();
                onAddAnswerRow();
              }}
            >
              <span className="wm-add" aria-hidden />
            </button>
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
