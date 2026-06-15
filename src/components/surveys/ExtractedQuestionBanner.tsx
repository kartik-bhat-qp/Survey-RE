'use client';

import type { SurveyQuestionExtractionSource } from '@/data/mock-survey-detail';
import styles from './ExtractedQuestionBanner.module.css';

interface ExtractedQuestionBannerProps {
  extractionSource: SurveyQuestionExtractionSource;
  onModifyExtraction: () => void;
  onSourceClick: () => void;
}

export function ExtractedQuestionBanner({
  extractionSource,
  onModifyExtraction,
  onSourceClick,
}: ExtractedQuestionBannerProps) {
  return (
    <div className={styles.banner}>
      <span className={`wm-call-split ${styles.icon}`} aria-hidden />
      <span className={styles.label}>Extracted From:</span>
      <button
        type="button"
        className={styles.sourceLink}
        onClick={(event) => {
          event.stopPropagation();
          onSourceClick();
        }}
      >
        {extractionSource.sourceQuestionCode}
      </button>
      <button
        type="button"
        className={styles.modifyLink}
        onClick={(event) => {
          event.stopPropagation();
          onModifyExtraction();
        }}
      >
        Modify Extraction
      </button>
    </div>
  );
}
