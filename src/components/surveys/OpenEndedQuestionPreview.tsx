'use client';

import { useState } from 'react';
import { AudioInputButton } from '@/components/ui/AudioInputButton';
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

function MicField({
  value,
  onTranscript,
  children,
}: {
  value: string;
  onTranscript: (text: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.micFieldWrap}>
      {children}
      <div className={styles.micHint}>
        <AudioInputButton
          size="sm"
          onTranscript={onTranscript}
          className={styles.micBtn}
        />
        <span className={styles.micLabel}>or use mic</span>
      </div>
    </div>
  );
}

export function OpenEndedQuestionPreview({ session, onClose }: OpenEndedQuestionPreviewProps) {
  const { surveyTitle, questionCode, questionText, required, questionType, contactFields } =
    session;

  const [textValue, setTextValue] = useState('');
  const [contactValues, setContactValues] = useState<Record<string, string>>({});

  function handleContactTranscript(fieldId: string, text: string): void {
    setContactValues((prev) => ({ ...prev, [fieldId]: text }));
  }

  const fields = contactFields ?? [
    { id: 'field-firstname', label: 'First Name' },
    { id: 'field-lastname', label: 'Last Name' },
    { id: 'field-phone', label: 'Phone Number' },
    { id: 'field-email', label: 'Email Address' },
  ];

  /** Returns a realistic placeholder example for a contact field. */
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
          <MicField
            value={textValue}
            onTranscript={(text) => setTextValue((prev) => (prev ? `${prev} ${text}` : text))}
          >
            <textarea
              className={styles.textarea}
              value={textValue}
              onChange={(event) => setTextValue(event.target.value)}
              placeholder="Type your answer here…"
              rows={6}
              aria-label="Your answer"
            />
          </MicField>
        )}

        {questionType === 'single-row' && (
          <MicField
            value={textValue}
            onTranscript={(text) => setTextValue(text)}
          >
            <input
              type="text"
              className={styles.textInput}
              value={textValue}
              onChange={(event) => setTextValue(event.target.value)}
              placeholder="Your answer…"
              aria-label="Your answer"
            />
          </MicField>
        )}

        {questionType === 'email' && (
          <MicField
            value={textValue}
            onTranscript={(text) => setTextValue(text)}
          >
            <input
              type="email"
              className={styles.textInput}
              value={textValue}
              onChange={(event) => setTextValue(event.target.value)}
              placeholder="your@email.com"
              aria-label="Email address"
            />
          </MicField>
        )}

        {questionType === 'contact' && (
          <ul className={styles.contactList}>
            {fields.map((field) => (
              <li key={field.id} className={styles.contactItem}>
                <label className={styles.contactLabel} htmlFor={field.id}>
                  {field.label}
                </label>
                <div className={styles.contactInputRow}>
                  <input
                    id={field.id}
                    type="text"
                    className={styles.textInput}
                    value={contactValues[field.id] ?? ''}
                    onChange={(event) =>
                      setContactValues((prev) => ({
                        ...prev,
                        [field.id]: event.target.value,
                      }))
                    }
                    placeholder={contactPlaceholder(field.label)}
                    aria-label={field.label}
                  />
                  <AudioInputButton
                    size="sm"
                    onTranscript={(text) => handleContactTranscript(field.id, text)}
                    className={styles.micBtn}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.footer}>
        <button type="button" className={styles.nextBtn} onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
