'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CaptchaFeedbackStyle } from '@/data/mock-captcha-settings';
import { CaptchaQuestionPreview } from '@/components/surveys/CaptchaQuestionPreview';
import shellStyles from './MultiPointCardsCarouselPreview.module.css';
import styles from './CaptchaInvisibleRespondentPreview.module.css';

const BANNER_VERIFY_MS = 1800;
const BANNER_SUCCESS_ADVANCE_MS = 600;

function RecaptchaVerifyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      focusable="false"
    >
      <path
        d="M32 8 A24 24 0 0 1 56 32"
        stroke="currentColor"
        strokeWidth="9"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M56 32 A24 24 0 0 1 32 56"
        stroke="currentColor"
        strokeWidth="9"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M32 56 A24 24 0 0 1 8 32"
        stroke="currentColor"
        strokeWidth="9"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M8 32 A24 24 0 0 1 32 8"
        stroke="currentColor"
        strokeWidth="9"
        fill="none"
        strokeLinecap="round"
      />
      <polygon points="32,3 41,17 23,17" fill="currentColor" />
    </svg>
  );
}

function RecaptchaSuccessIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      focusable="false"
    >
      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="none" />
      <path
        d="M20 33 L29 42 L46 23"
        stroke="currentColor"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function VerificationInProgressBanner() {
  return (
    <div className={styles.verifyBanner} role="status" aria-live="polite">
      <RecaptchaVerifyIcon className={styles.bannerIcon} />
      <div className={styles.bannerText}>
        <p className={styles.bannerTitle}>Verification in progress</p>
        <p className={styles.bannerBody}>
          Checking you&apos;re human. This takes just a moment.
        </p>
      </div>
      <div className={styles.bannerProgressTrack} aria-hidden>
        <div className={styles.bannerProgressFill} />
      </div>
    </div>
  );
}

function VerificationCompleteBanner() {
  return (
    <div className={`${styles.verifyBanner} ${styles.verifyBannerSuccess}`} role="status">
      <RecaptchaSuccessIcon className={styles.bannerIcon} />
      <div className={styles.bannerText}>
        <p className={styles.bannerTitle}>Verification complete</p>
        <p className={styles.bannerBody}>You&apos;re cleared to continue.</p>
      </div>
      <div className={styles.bannerProgressTrack} aria-hidden>
        <div className={styles.bannerProgressComplete} />
      </div>
    </div>
  );
}

type VerificationPhase = 'idle' | 'verifying' | 'succeeded' | 'failed' | 'v2-fallback';

function mockVerifyCaptcha(options?: { alwaysSucceed?: boolean }): Promise<boolean> {
  return new Promise((resolve) => {
    window.setTimeout(
      () => resolve(options?.alwaysSucceed ?? Math.random() > 0.35),
      BANNER_VERIFY_MS
    );
  });
}

export interface CaptchaInvisibleVerificationProps {
  feedbackStyle: CaptchaFeedbackStyle;
  showV2OnVerificationFailed: boolean;
  footerLabel?: string;
  embedded?: boolean;
  /** Full-page preview: auto-run verification on mount (banner or button feedback). */
  autoPlayPreview?: boolean;
  onAdvance?: () => void;
}

export function CaptchaInvisibleVerification({
  feedbackStyle,
  showV2OnVerificationFailed,
  footerLabel = 'Next',
  embedded = false,
  autoPlayPreview = false,
  onAdvance,
}: CaptchaInvisibleVerificationProps) {
  const [phase, setPhase] = useState<VerificationPhase>('idle');
  const verifyRunRef = useRef(0);

  const runVerification = useCallback(
    (alwaysSucceed: boolean) => {
      const runId = verifyRunRef.current + 1;
      verifyRunRef.current = runId;
      setPhase('verifying');

      void mockVerifyCaptcha({ alwaysSucceed }).then((passed) => {
        if (verifyRunRef.current !== runId) return;
        if (passed) {
          setPhase('succeeded');
          return;
        }
        if (showV2OnVerificationFailed) {
          setPhase('v2-fallback');
        } else {
          setPhase('failed');
        }
      });
    },
    [showV2OnVerificationFailed]
  );

  useEffect(() => {
    verifyRunRef.current += 1;

    if (autoPlayPreview) {
      runVerification(true);
      return;
    }

    setPhase('idle');
  }, [autoPlayPreview, feedbackStyle, showV2OnVerificationFailed, runVerification]);

  useEffect(() => {
    if (phase !== 'succeeded' || !onAdvance) return;

    const delay = feedbackStyle === 'banner' ? BANNER_SUCCESS_ADVANCE_MS : 0;
    const timer = window.setTimeout(() => {
      setPhase('idle');
      onAdvance();
    }, delay);

    return () => window.clearTimeout(timer);
  }, [feedbackStyle, onAdvance, phase]);

  const isVerifying = phase === 'verifying';
  const isSucceeded = phase === 'succeeded';
  const showError = phase === 'failed';
  const showV2Fallback = phase === 'v2-fallback';

  const handleNextClick = useCallback(async () => {
    if (isVerifying) return;

    if (isSucceeded || showV2Fallback) {
      setPhase('idle');
      onAdvance?.();
      return;
    }

    if (showError) {
      setPhase('idle');
      return;
    }

    if (feedbackStyle === 'banner' || feedbackStyle === 'button') {
      runVerification(embedded);
      return;
    }
  }, [
    embedded,
    feedbackStyle,
    isSucceeded,
    isVerifying,
    onAdvance,
    runVerification,
    showError,
    showV2Fallback,
  ]);

  const buttonLabel = (() => {
    if (showV2Fallback || isSucceeded) return footerLabel;
    if (isVerifying) {
      return feedbackStyle === 'banner' ? 'Please wait' : 'Verifying…';
    }
    return footerLabel;
  })();

  return (
    <div className={embedded ? styles.root : styles.rootRespondent}>
      {embedded ? (
        <p className={styles.previewHint}>
          {feedbackStyle === 'button'
            ? 'No CAPTCHA information is displayed in the preview. Verification runs automatically as soon as the question loads'
            : 'No CAPTCHA is displayed in the preview. A verification banner appears above the Next button while verification is in progress.'}
        </p>
      ) : null}

      {showV2Fallback ? (
        <div className={styles.v2FallbackBlock}>
          <p className={styles.v2FallbackNote}>
            If invisible verification fails, the &ldquo;I&apos;m not a robot&rdquo; checkbox appears automatically.
          </p>
          <CaptchaQuestionPreview variant="v2" />
        </div>
      ) : null}

      {feedbackStyle === 'banner' && isVerifying ? <VerificationInProgressBanner /> : null}

      {feedbackStyle === 'banner' && isSucceeded ? <VerificationCompleteBanner /> : null}

      <div className={shellStyles.previewFooter}>
        <button
          type="button"
          className={`${shellStyles.doneBtn} ${isVerifying ? styles.doneBtnBusy : ''}`}
          disabled={isVerifying}
          onClick={() => void handleNextClick()}
        >
          {isVerifying && feedbackStyle === 'button' ? (
            <span className={styles.btnContent}>
              <span className={`wm-refresh ${styles.btnSpinner}`} aria-hidden />
              {buttonLabel}
            </span>
          ) : (
            buttonLabel
          )}
        </button>
      </div>

      {showError ? (
        <p className={styles.inlineError} role="alert">
          We could not verify you&apos;re human. Please try again.
        </p>
      ) : null}
    </div>
  );
}

/** @deprecated Use CaptchaInvisibleVerification */
export const CaptchaInvisibleRespondentPreview = CaptchaInvisibleVerification;
