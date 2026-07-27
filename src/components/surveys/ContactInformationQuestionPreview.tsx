'use client';

import { plainTextFromRichValue } from '@/components/surveys/QuestionRichTextField';
import styles from './ContactInformationQuestionPreview.module.css';

interface ContactInformationQuestionPreviewProps {
  fields: { id: string; label: string }[];
}

export function ContactInformationQuestionPreview({
  fields,
}: ContactInformationQuestionPreviewProps) {
  return (
    <ul className={styles.fieldList} aria-hidden>
      {fields.map((field) => (
        <li key={field.id} className={styles.fieldItem}>
          <div className={styles.fieldLabelWrap}>
            <span className={styles.required}>*</span>
            <span className={styles.fieldLabel}>{plainTextFromRichValue(field.label)}</span>
          </div>
          <div className={styles.fieldInputRow}>
            <div className={styles.fieldLine} />
            <span className={styles.staticMic} aria-hidden>
              <span className="wm-mic" />
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
