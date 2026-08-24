'use client';

import type { ConversationPreviewData } from '@/data/mock-add-question-previews';
import styles from './ConversationQuestionPreview.module.css';

interface ConversationQuestionPreviewProps {
  data: ConversationPreviewData;
}

export function ConversationQuestionPreview({ data }: ConversationQuestionPreviewProps) {
  return (
    <div className={styles.root} aria-hidden>
      <div className={styles.contextCard}>
        <span className={styles.contextLabel}>Previous answer</span>
        <p className={styles.contextText}>
          <span className={styles.contextCode}>{data.sourceCode}</span>
          {data.sourceAnswer}
        </p>
      </div>

      <div className={styles.thread}>
        <div className={styles.aiRow}>
          <span className={styles.avatar} aria-hidden>
            ?
          </span>
          <p className={styles.bubble}>{data.aiQuestion}</p>
        </div>
      </div>

      <div className={styles.composer}>
        <span className={styles.composerPlaceholder}>{data.responsePlaceholder}</span>
        <span className={styles.sendBtn} aria-hidden>
          <span className="wm-send" />
        </span>
      </div>

      <p className={styles.footerNote}>{data.footerNote}</p>
    </div>
  );
}
