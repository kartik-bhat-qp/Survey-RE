'use client';

import styles from './CommentBoxQuestionPreview.module.css';

interface CommentBoxQuestionPreviewProps {
  placeholder?: string;
}

export function CommentBoxQuestionPreview({
  placeholder = 'Multiple Row Answer Text',
}: CommentBoxQuestionPreviewProps) {
  return (
    <div className={styles.root} aria-hidden>
      <div className={styles.textarea}>
        <p className={styles.placeholder}>{placeholder}</p>
        <div className={styles.ruledLine} />
        <div className={styles.ruledLine} />
        <div className={styles.ruledLine} />
      </div>
      <div className={styles.footer}>
        <span className={styles.staticMic} aria-hidden>
          <span className="wm-mic" />
        </span>
      </div>
    </div>
  );
}
