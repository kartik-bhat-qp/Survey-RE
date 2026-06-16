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
          <div className={styles.fieldLine} />
        </li>
      ))}
    </ul>
  );
}
