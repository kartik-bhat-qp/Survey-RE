'use client';

import type { SyntheticEvent } from 'react';
import type { SurveyQuestion } from '@/data/mock-survey-detail';
import { createDefaultContactInformationOptions } from '@/data/mock-survey-detail';
import { ContactInformationQuestionPreview } from '@/components/surveys/ContactInformationQuestionPreview';
import { QuestionRichTextField } from '@/components/surveys/QuestionRichTextField';
import { QuestionWorkspaceActions } from '@/components/surveys/QuestionWorkspaceActions';
import { QuestionWorkspaceFooter } from '@/components/surveys/QuestionWorkspaceFooter';
import type { QuestionMenuAction } from '@/components/surveys/QuestionOptionsMenu';
import styles from './ContactInformationQuestionRow.module.css';

function stopQuestionEvent(event: SyntheticEvent): void {
  event.stopPropagation();
}

export interface ContactInformationQuestionRowProps {
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
  onAddField: () => void;
  onQuestionTextChange: (sectionId: string, questionId: string, text: string) => void;
}

export function ContactInformationQuestionRow({
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
  onAddField,
  onQuestionTextChange,
}: ContactInformationQuestionRowProps) {
  const fields =
    question.options.length > 0
      ? question.options.map((option) => ({ id: option.id, label: option.label }))
      : createDefaultContactInformationOptions().map((option) => ({
          id: option.id,
          label: option.label,
        }));

  return (
    <article className={styles.root}>
      <div className="contactInformationCard">
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
            <ContactInformationQuestionPreview fields={fields} />
            <button
              type="button"
              className={styles.addFieldBtn}
              aria-label="Add contact field"
              onClick={(event) => {
                event.stopPropagation();
                onAddField();
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
