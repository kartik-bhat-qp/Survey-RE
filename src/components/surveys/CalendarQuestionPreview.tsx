'use client';

import type { CalendarPreviewData } from '@/data/mock-add-question-previews';
import styles from './CalendarQuestionPreview.module.css';

interface CalendarQuestionPreviewProps {
  data: CalendarPreviewData;
}

export function CalendarQuestionPreview({ data }: CalendarQuestionPreviewProps) {
  return (
    <div className={styles.inputRow} aria-hidden>
      <div className={styles.underline} />
      <span className={`${data.inputIcon} ${styles.calendarIcon}`} aria-hidden />
    </div>
  );
}
