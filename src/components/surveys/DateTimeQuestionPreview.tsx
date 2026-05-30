'use client';

import type { DateTimePreviewData } from '@/data/mock-add-question-previews';
import styles from './DateTimeQuestionPreview.module.css';

interface DateTimeQuestionPreviewProps {
  data: DateTimePreviewData;
}

export function DateTimeQuestionPreview({ data }: DateTimeQuestionPreviewProps) {
  return (
    <div className={styles.fields} aria-hidden>
      {data.fields.map((field) => (
        <div key={field.label} className={styles.field}>
          <span className={styles.fieldLabel}>{field.label}</span>
          <div className={styles.selectBlock}>
            <div className={styles.select}>
              <span className={styles.selectText} />
              <span className={`wm-arrow-drop-down ${styles.selectArrow}`} aria-hidden />
            </div>
            <div className={styles.selectUnderline} />
          </div>
        </div>
      ))}
    </div>
  );
}
