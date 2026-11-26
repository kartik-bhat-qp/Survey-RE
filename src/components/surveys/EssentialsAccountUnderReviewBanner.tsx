'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { WarningNotice } from '@/components/ui/WarningNotice';
import { PhishingWhyModal } from '@/components/surveys/PhishingWhyModal';
import { PhishingChatSupportModal } from '@/components/surveys/PhishingChatSupportModal';
import { usePhishingHoldState, usePublishSendPaused } from '@/hooks/usePhishingPublishHold';
import {
  PHISHING_ACCOUNT_REVIEW_COPY,
  PHISHING_FOCUS_QUESTION_EVENT,
  PHISHING_SEE_WHY_LABEL,
  type PhishingFlagMatch,
} from '@/data/mock-phishing-publish-hold';
import styles from './EssentialsAccountUnderReviewBanner.module.css';

function focusQuestionInDom(questionId: string): boolean {
  const el = Array.from(document.querySelectorAll<HTMLElement>('[id^="survey-question-"]')).find(
    (node) => node.id.endsWith(`-${questionId}`)
  );
  if (!el) return false;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const focusable =
    el.querySelector<HTMLElement>(
      '[contenteditable="true"], textarea, input, button, [tabindex]:not([tabindex="-1"])'
    ) ?? el;
  focusable.focus?.({ preventScroll: true });
  return true;
}

export function EssentialsAccountUnderReviewBanner() {
  const underReview = usePublishSendPaused();
  const state = usePhishingHoldState();
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const [whyOpen, setWhyOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  if (!underReview) return null;

  const matches = state.account.flaggedMatches;
  const surveyId = state.account.flaggedSurveyId;

  function handleGoToQuestion(match: PhishingFlagMatch): void {
    if (!match.questionId || surveyId == null) return;
    setWhyOpen(false);
    const targetPath = `/surveys/${surveyId}`;
    window.dispatchEvent(
      new CustomEvent(PHISHING_FOCUS_QUESTION_EVENT, {
        detail: { questionId: match.questionId, optionIndex: match.optionIndex },
      })
    );

    if (
      !pathname.startsWith(targetPath) ||
      pathname.includes('/distribute') ||
      pathname.includes('/analytics')
    ) {
      router.push(targetPath);
      window.setTimeout(() => focusQuestionInDom(match.questionId!), 450);
      return;
    }
    focusQuestionInDom(match.questionId);
  }

  return (
    <>
      <div className={styles.bar} role="status" aria-live="polite">
        <WarningNotice
          className={styles.alert}
          Icon={<span className={`wm-warning ${styles.icon}`} aria-hidden />}
        >
          <span className={styles.title}>Account under review</span>
          <span className={styles.copy}>
            {PHISHING_ACCOUNT_REVIEW_COPY}{' '}
            <button
              type="button"
              className={`${styles.supportLink} ${styles.seeWhyLink}`}
              onClick={() => setWhyOpen(true)}
              aria-haspopup="dialog"
            >
              {PHISHING_SEE_WHY_LABEL}
            </button>
          </span>
        </WarningNotice>
      </div>

      <PhishingWhyModal
        open={whyOpen}
        onOpenChange={setWhyOpen}
        matches={matches}
        onChatWithSupport={() => setChatOpen(true)}
        onGoToQuestion={handleGoToQuestion}
      />

      <PhishingChatSupportModal open={chatOpen} onOpenChange={setChatOpen} />
    </>
  );
}
