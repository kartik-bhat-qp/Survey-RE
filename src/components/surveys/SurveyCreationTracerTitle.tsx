'use client';

import { useEffect, useState } from 'react';
import styles from './SurveyCreationTracerTitle.module.css';

const CHAR_DELAY_MS = 52;

interface SurveyCreationTracerTitleProps {
  text: string;
  onComplete?: () => void;
}

export function SurveyCreationTracerTitle({ text, onComplete }: SurveyCreationTracerTitleProps) {
  const [visibleLength, setVisibleLength] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setVisibleLength(text.length);
      setIsComplete(true);
      onComplete?.();
      return;
    }

    setVisibleLength(0);
    setIsComplete(false);
    let index = 0;

    const timer = window.setInterval(() => {
      index += 1;
      setVisibleLength(index);
      if (index >= text.length) {
        window.clearInterval(timer);
        setIsComplete(true);
        onComplete?.();
      }
    }, CHAR_DELAY_MS);

    return () => window.clearInterval(timer);
  }, [text, onComplete]);

  const visibleText = text.slice(0, visibleLength);

  return (
    <span className={styles.tracerWrap}>
      <span className={styles.tracerText} aria-label={text}>
        {visibleText}
      </span>
      {!isComplete ? (
        <span className={styles.tracerCursor} aria-hidden />
      ) : (
        <span className={`${styles.tracerCursor} ${styles.tracerCursorDone}`} aria-hidden />
      )}
      <span className={styles.tracerGlow} aria-hidden />
    </span>
  );
}
