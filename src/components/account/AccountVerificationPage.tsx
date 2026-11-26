'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { PhishingChatSupportModal } from '@/components/surveys/PhishingChatSupportModal';
import { usePhishingHoldState } from '@/hooks/usePhishingPublishHold';
import {
  PHISHING_VERIFICATION_TURNAROUND,
  bookVerificationCall,
  getAccountVerificationCallSlot,
  type HeldSurveyCase,
  type VerificationTrackerStep,
} from '@/data/mock-phishing-publish-hold';
import styles from './AccountVerificationPage.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

const STEPS: Array<{ id: VerificationTrackerStep; label: string }> = [
  { id: 'flagged', label: 'Flagged' },
  { id: 'call-booked', label: 'Call booked' },
  { id: 'agent-review', label: 'Agent review' },
  { id: 'live', label: 'Live' },
];

function stepIndex(step: VerificationTrackerStep): number {
  return STEPS.findIndex((s) => s.id === step);
}

function Tracker({ current }: { current: VerificationTrackerStep }) {
  const active = stepIndex(current);
  return (
    <ol className={styles.tracker} aria-label="Verification progress">
      {STEPS.map((step, index) => {
        const done = index < active;
        const now = index === active;
        return (
          <li
            key={step.id}
            className={`${styles.trackerStep} ${done ? styles.trackerDone : ''} ${
              now ? styles.trackerNow : ''
            }`}
          >
            <span className={styles.trackerDot} aria-hidden />
            <span className={styles.trackerLabel}>
              {step.label}
              {done ? ' · Done' : now ? ' · Now' : ' · Next'}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function SurveySummaryCard({
  item,
  onKeepEditing,
}: {
  item: HeldSurveyCase;
  onKeepEditing: () => void;
}) {
  return (
    <article className={styles.card}>
      <header className={styles.cardHeader}>
        <div>
          <h2 className={styles.cardTitle}>{item.surveyName}</h2>
          <p className={styles.cardMeta}>
            Case {item.caseId} · {item.riskTier === 'high' ? 'High' : 'Medium'} risk
          </p>
        </div>
      </header>
      <p className={styles.flagCopy}>{item.flaggedQuestionLabel}</p>
      <Tracker current={item.trackerStep} />
      <div className={styles.cardActions}>
        <WuButton variant="secondary" onClick={onKeepEditing}>
          Keep editing
        </WuButton>
      </div>
    </article>
  );
}

export function AccountVerificationPage() {
  const router = useRouter();
  const { showToast } = useWuShowToast();
  const state = usePhishingHoldState();
  const [chatOpen, setChatOpen] = useState(false);

  const activeCases = useMemo(
    () =>
      state.cases.filter((c) => c.holdStatus === 'held' || c.holdStatus === 'verifying'),
    [state.cases]
  );

  const callSlot = getAccountVerificationCallSlot();
  const progressStep: VerificationTrackerStep = callSlot
    ? activeCases[0]?.trackerStep ?? 'agent-review'
    : 'flagged';

  function handleBook(): void {
    bookVerificationCall();
    showToast({ message: 'Verification call booked', variant: 'success' });
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Account › Verification"
        description="Track held surveys, book a verification call, or chat with support. No ticket required."
        action={
          <WuButton variant="secondary" onClick={() => router.push('/surveys')}>
            Back to surveys
          </WuButton>
        }
      />

      {activeCases.length === 0 ? (
        <EmptyState
          icon="wm-verified"
          title="No surveys need verification"
          description="When a survey is held at publish, its status tracker appears here."
          action={
            <WuButton color="primary" onClick={() => router.push('/surveys')}>
              Go to surveys
            </WuButton>
          }
        />
      ) : (
        <div className={styles.list}>
          <section className={styles.card} aria-label="Verification call">
            <header className={styles.cardHeader}>
              <div>
                <h2 className={styles.cardTitle}>Verification call</h2>
                <p className={styles.cardMeta}>
                  One call covers your account — including every survey currently on hold.
                </p>
              </div>
            </header>
            <Tracker current={progressStep} />
            <div className={styles.slot}>
              <span className={`wm-calendar ${styles.slotIcon}`} aria-hidden />
              <div>
                <p className={styles.slotLabel}>
                  {callSlot ?? 'Book a 10-minute verification call'}
                </p>
                <p className={styles.slotHint}>{PHISHING_VERIFICATION_TURNAROUND}</p>
              </div>
              {callSlot ? (
                <WuButton variant="secondary" onClick={handleBook}>
                  Reschedule
                </WuButton>
              ) : (
                <WuButton color="primary" onClick={handleBook}>
                  Book call
                </WuButton>
              )}
            </div>
            <div className={styles.cardActions}>
              <WuButton variant="secondary" onClick={() => setChatOpen(true)}>
                Chat now
              </WuButton>
            </div>
          </section>

          {activeCases.map((item) => (
            <SurveySummaryCard
              key={item.caseId}
              item={item}
              onKeepEditing={() => router.push(`/surveys/${item.surveyId}`)}
            />
          ))}
        </div>
      )}

      <PhishingChatSupportModal open={chatOpen} onOpenChange={setChatOpen} />
    </div>
  );
}
