'use client';

import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import styles from './GlobalFooter.module.css';

const FOOTER_COPY = 'Essentials ©2025 QuestionPro';

export function GlobalFooter() {
  const { showToast } = useWuShowToast();

  return (
    <footer className={styles.footer} aria-label="Application footer">
      <span className={styles.copy}>{FOOTER_COPY}</span>
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.iconBtn}
          aria-label="AI assistant"
          onClick={() => showToast({ message: 'AI assistant', variant: 'info' })}
        >
          <span className="wm-auto-awesome" aria-hidden />
        </button>
        <button
          type="button"
          className={styles.iconBtn}
          aria-label="Chat support"
          onClick={() => showToast({ message: 'Chat support', variant: 'info' })}
        >
          <span className="wm-chat" aria-hidden />
        </button>
      </div>
    </footer>
  );
}
