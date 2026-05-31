'use client';

import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useMounted } from '@/hooks/useMounted';
import styles from './GlobalFooter.module.css';

const DEFAULT_FOOTER_COPY = 'Essentials ©2026 QuestionPro';

function GlobalFooterActions() {
  const { showToast } = useWuShowToast();

  return (
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
  );
}

export function GlobalFooter({ copy = DEFAULT_FOOTER_COPY }: { copy?: string }) {
  const mounted = useMounted();

  return (
    <footer className={styles.footer} aria-label="Application footer">
      <span className={styles.copy}>{copy}</span>
      {mounted ? <GlobalFooterActions /> : <div className={styles.actions} aria-hidden />}
    </footer>
  );
}
