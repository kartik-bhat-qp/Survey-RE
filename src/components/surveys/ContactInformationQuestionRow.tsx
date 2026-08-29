'use client';

import { useState, type SyntheticEvent } from 'react';
import type { SurveyQuestion } from '@/data/mock-survey-detail';
import { createDefaultContactInformationOptions } from '@/data/mock-survey-detail';
import { ContactInformationQuestionPreview } from '@/components/surveys/ContactInformationQuestionPreview';
import { QuestionRichTextField, plainTextFromRichValue } from '@/components/surveys/QuestionRichTextField';
import { QuestionWorkspaceActions } from '@/components/surveys/QuestionWorkspaceActions';
import { QuestionWorkspaceFooter } from '@/components/surveys/QuestionWorkspaceFooter';
import type { QuestionMenuAction } from '@/components/surveys/QuestionOptionsMenu';
import { VoiceAnswerField } from '@/components/ui/VoiceAnswerField';
import { emptyVoiceAnswer, type VoiceAnswerValue } from '@/data/mock-voice-answer';
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
  /** Live speech-to-text into the answer field (Audio Input survey). */
  enableLiveDictation?: boolean;
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
  enableLiveDictation = false,
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

  const [contactAnswers, setContactAnswers] = useState<Record<string, VoiceAnswerValue>>({});

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
          <div className={styles.answerWrap} onPointerDown={stopQuestionEvent}>
            {enableLiveDictation ? (
              <ul className={styles.dictationFieldList}>
                {fields.map((field) => (
                  <li key={field.id} className={styles.dictationFieldItem}>
                    <label className={styles.dictationFieldLabel}>
                      {plainTextFromRichValue(field.label)}
                    </label>
                    <VoiceAnswerField
                      mode="dictation"
                      value={contactAnswers[field.id] ?? emptyVoiceAnswer()}
                      onChange={(next) =>
                        setContactAnswers((prev) => ({ ...prev, [field.id]: next }))
                      }
                      placeholder={`Enter ${plainTextFromRichValue(field.label)}`}
                      compact
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <ContactInformationQuestionPreview fields={fields} />
            )}
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
