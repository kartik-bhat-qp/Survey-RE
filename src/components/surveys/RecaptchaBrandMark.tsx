'use client';

import styles from './RecaptchaBrandMark.module.css';

export interface RecaptchaBrandMarkProps {
  /** Icon-only for compact badges; full includes the wordmark below the icon. */
  variant?: 'icon' | 'full';
  className?: string;
}

/**
 * reCAPTCHA brand mark — circular three-arrow icon with optional wordmark.
 * Matches Google's reCAPTCHA logo styling (blue / gray arrows + reCAPTCHA text).
 */
export function RecaptchaBrandMark({ variant = 'full', className }: RecaptchaBrandMarkProps) {
  return (
    <span
      className={`${styles.root} ${variant === 'icon' ? styles.rootIconOnly : ''} ${className ?? ''}`}
      aria-hidden
    >
      <svg className={styles.icon} viewBox="0 0 48 48" focusable="false">
        <path
          fill="#4285F4"
          d="M24 4a20 20 0 0 1 19.3 14.8l-7.2-2.9A12.8 12.8 0 0 0 24 11.7V4Z"
        />
        <path
          fill="#1A73E8"
          d="M43.3 19.8A20 20 0 0 1 24 44V36.3a12.8 12.8 0 0 0 12.2-8.5l7.1 2.9Z"
        />
        <path
          fill="#9AA0A6"
          d="M24 44A20 20 0 0 1 4.7 19.8l7.2 2.9A12.8 12.8 0 0 0 24 36.3V44Z"
        />
        <path
          fill="#BDC1C6"
          d="M4.7 19.8A20 20 0 0 1 24 4v7.7a12.8 12.8 0 0 0-12.2 8.6l-7.1-2.9Z"
        />
      </svg>
      {variant === 'full' ? (
        <span className={styles.wordmark}>
          <span className={styles.wordRe}>re</span>
          <span className={styles.wordCaptcha}>CAPTCHA</span>
        </span>
      ) : null}
    </span>
  );
}
