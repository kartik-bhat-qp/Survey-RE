'use client';

import type { CaptchaRecaptchaType } from '@/data/mock-captcha-settings';
import { RecaptchaBrandMark } from '@/components/surveys/RecaptchaBrandMark';
import styles from './CaptchaQuestionPreview.module.css';

export interface CaptchaQuestionPreviewProps {
  variant?: CaptchaRecaptchaType;
}

export function CaptchaQuestionPreview({ variant = 'v2' }: CaptchaQuestionPreviewProps) {
  if (variant === 'invisible') {
    return (
      <div className={styles.invisibleRoot} aria-hidden>
        <div className={styles.invisibleBadge}>
          <RecaptchaBrandMark variant="icon" />
          <div className={styles.invisibleBadgeText}>
            <span className={styles.invisibleProtected}>
              protected by <strong>reCAPTCHA</strong>
            </span>
            <span className={styles.invisibleLinks}>Privacy - Terms</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root} aria-hidden>
      <div className={styles.widget}>
        <div className={styles.checkboxArea}>
          <span className={styles.checkbox} />
          <span className={styles.checkboxLabel}>I&apos;m not a robot</span>
        </div>
        <div className={styles.branding}>
          <RecaptchaBrandMark variant="full" />
          <span className={styles.brandLinks}>Privacy - Terms</span>
        </div>
      </div>
    </div>
  );
}
