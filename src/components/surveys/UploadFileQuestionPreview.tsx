'use client';

import type { UploadFilePreviewData } from '@/data/mock-add-question-previews';
import styles from './UploadFileQuestionPreview.module.css';

interface UploadFileQuestionPreviewProps {
  data: UploadFilePreviewData;
}

export function UploadFileQuestionPreview({ data }: UploadFileQuestionPreviewProps) {
  return (
    <div className={styles.root} aria-hidden>
      <div className={styles.dropzone}>
        <span className={styles.uploadIcon} aria-hidden>
          <svg viewBox="0 0 48 48" className={styles.uploadIconSvg} focusable="false">
            <path
              d="M24 8v20M16 20l8-8 8 8"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
            />
            <path
              d="M10 32h28"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2.5"
            />
            <path
              d="M12 32v6c0 1.1.9 2 2 2h20c1.1 0 2-.9 2-2v-6"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.5"
            />
          </svg>
        </span>
        <p className={styles.dragLabel}>{data.dragLabel}</p>
        <p className={styles.orLabel}>{data.orLabel}</p>
        <span className={styles.browseBtn}>{data.browseLabel}</span>
      </div>
    </div>
  );
}
