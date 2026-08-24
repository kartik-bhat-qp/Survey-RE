'use client';

import { useEffect } from 'react';
import { StandardLoader } from '@/components/ui/StandardLoader';
import styles from './ListenAIHandoffScreen.module.css';

const CONNECTING_DELAY_MS = 4000;

interface ListenAIHandoffScreenProps {
  connected?: boolean;
  onContinue: () => void;
}

export function ListenAIHandoffScreen({
  connected = true,
  onContinue,
}: ListenAIHandoffScreenProps) {
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      onContinue();
    }, CONNECTING_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [onContinue]);

  return (
    <div className={styles.root} role="status" aria-live="polite" aria-busy="true">
      <StandardLoader
        className={styles.loader}
        message={connected ? 'Connecting to Conversation' : 'Continuing…'}
      />
    </div>
  );
}
