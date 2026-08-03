'use client';

import { useState } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { VoiceAnswerField } from '@/components/ui/VoiceAnswerField';
import {
  emptyVoiceAnswer,
  isVoiceAnswerSubmittable,
  type VoiceAnswerValue,
} from '@/data/mock-voice-answer';
import type { OpenEndedQuestionPreviewSession } from '@/data/survey-question-preview-session';
import styles from './OpenEndedQuestionPreview.module.css';

interface OpenEndedQuestionPreviewProps {
  session: OpenEndedQuestionPreviewSession;
  onClose: () => void;
}

function QuestionHeader({
  surveyTitle,
  questionCode,
  required,
}: {
  surveyTitle: string;
  questionCode: string;
  required?: boolean;
}) {
  return (
    <div className={styles.header}>
      <p className={styles.surveyTitle}>{surveyTitle}</p>
      <div className={styles.questionMeta}>
        <span className={styles.questionCode}>{questionCode}</span>
        {required && (
          <span className={styles.requiredBadge} aria-label="Required">
            *
          </span>
        )}
      </div>
    </div>
  );
}

function voiceAnswerSummary(value: VoiceAnswerValue): string {
  if (value.inputType === 'audio_with_caption') {
    return value.captionText?.trim() || 'Voice response';
  }
  if (value.inputType === 'audio') return 'Voice response';
  return value.textResponse?.trim() || '';
}

export function OpenEndedQuestionPreview({ session, onClose }: OpenEndedQuestionPreviewProps) {
  const { showToast } = useWuShowToast();
  const { surveyTitle, questionCode, questionText, required, questionType, contactFields } =
    session;

  const [answer, setAnswer] = useState<VoiceAnswerValue>(emptyVoiceAnswer());
  const [contactAnswers, setContactAnswers] = useState<Record<string, VoiceAnswerValue>>({});
  const [navOpen, setNavOpen] = useState(false);

  const fields = contactFields ?? [
    { id: 'field-firstname', label: 'First Name' },
    { id: 'field-lastname', label: 'Last Name' },
    { id: 'field-phone', label: 'Phone Number' },
    { id: 'field-email', label: 'Email Address' },
  ];

  function contactPlaceholder(label: string): string {
    const lc = label.toLowerCase();
    if (lc.includes('first')) return 'e.g., Sarah';
    if (lc.includes('last')) return 'e.g., Johnson';
    if (lc.includes('phone') || lc.includes('mobile') || lc.includes('cell'))
      return 'e.g., +1 (415) 555-0192';
    if (lc.includes('email')) return 'e.g., sarah.johnson@gmail.com';
    if (lc.includes('company') || lc.includes('organization') || lc.includes('employer'))
      return 'e.g., Acme Corp';
    if (lc.includes('title') || lc.includes('role')) return 'e.g., Product Manager';
    if (lc.includes('address') || lc.includes('street')) return 'e.g., 742 Evergreen Terrace';
    if (lc.includes('city')) return 'e.g., San Francisco';
    if (lc.includes('state') || lc.includes('province')) return 'e.g., California';
    if (lc.includes('zip') || lc.includes('postal')) return 'e.g., 94102';
    if (lc.includes('country')) return 'e.g., United States';
    return `Enter ${label}`;
  }

  function handleNext(): void {
    if (questionType === 'contact') {
      const filled = fields.filter((f) => {
        const v = contactAnswers[f.id];
        return v && voiceAnswerSummary(v);
      });
      if (filled.length === 0) {
        showToast({ message: 'Add at least one contact field', variant: 'error' });
        return;
      }
      showToast({ message: 'Contact details saved', variant: 'success' });
      onClose();
      return;
    }

    if (!isVoiceAnswerSubmittable(answer) && !answer.audioUrl && !voiceAnswerSummary(answer)) {
      showToast({ message: 'Enter an answer or record a voice response', variant: 'error' });
      return;
    }

    showToast({
      message: answer.audioUrl ? 'Voice answer submitted' : 'Answer submitted',
      variant: 'success',
    });
    onClose();
  }

  return (
    <div className={styles.root}>
      <QuestionHeader
        surveyTitle={surveyTitle}
        questionCode={questionCode}
        required={required}
      />

      <div className={styles.body}>
        <p
          className={styles.questionText}
          /* eslint-disable-next-line react/no-danger */
          dangerouslySetInnerHTML={{ __html: questionText }}
        />

        {questionType === 'comment-box' && (
          <VoiceAnswerField
            value={answer}
            onChange={setAnswer}
            placeholder="Type your answer here…"
          />
        )}

        {questionType === 'single-row' && (
          <VoiceAnswerField
            value={answer}
            onChange={setAnswer}
            placeholder="Your answer…"
            compact
          />
        )}

        {questionType === 'email' && (
          <VoiceAnswerField
            value={answer}
            onChange={setAnswer}
            placeholder="your@email.com"
            compact
          />
        )}

        {questionType === 'contact' && (
          <ul className={styles.contactList}>
            {fields.map((field) => (
              <li key={field.id} className={styles.contactItem}>
                <label className={styles.contactLabel} htmlFor={field.id}>
                  {field.label}
                </label>
                <VoiceAnswerField
                  value={contactAnswers[field.id] ?? emptyVoiceAnswer()}
                  onChange={(next) =>
                    setContactAnswers((prev) => ({ ...prev, [field.id]: next }))
                  }
                  placeholder={contactPlaceholder(field.label)}
                  compact
                />
              </li>
            ))}
          </ul>
        )}

        <div className={styles.nextRow}>
          <button type="button" className={styles.nextBtn} onClick={handleNext}>
            Next
          </button>
          <div className={styles.nextMenuWrap}>
            <button
              type="button"
              className={styles.nextChevronBtn}
              aria-label="More navigation options"
              aria-expanded={navOpen}
              onClick={() => setNavOpen((open) => !open)}
            >
              <span className={`wm-chevron-down ${styles.nextChevronIcon}`} aria-hidden />
            </button>
            {navOpen ? (
              <div className={styles.nextMenu} role="menu">
                <button
                  type="button"
                  className={styles.nextMenuItem}
                  role="menuitem"
                  onClick={() => {
                    setNavOpen(false);
                    showToast({ message: 'Already on the first question', variant: 'info' });
                  }}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className={styles.nextMenuItem}
                  role="menuitem"
                  onClick={() => {
                    setNavOpen(false);
                    handleNext();
                  }}
                >
                  Next
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
