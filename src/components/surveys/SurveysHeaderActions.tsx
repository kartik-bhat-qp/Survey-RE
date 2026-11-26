'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { getSurveyEditorPhaseFromPathname } from '@/components/surveys/survey-editor-navigation';
import {
  getPhishingScanDelayMs,
  resetPhishingHoldState,
  simulateAiPhishingCheck,
} from '@/data/mock-phishing-publish-hold';
import { usePhishingScanReviewing, usePublishSendPaused } from '@/hooks/usePhishingPublishHold';
import { setSurveyFooterBrand } from '@/lib/survey-suite-footer-brand';
import styles from './SurveysHeaderBar.module.css';

const WuAppHeaderSearch = dynamic(
  () =>
    import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuAppHeaderSearch })),
  { ssr: false }
);
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenu })),
  { ssr: false }
);
const WuMenuItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuItem })),
  { ssr: false }
);

interface SurveysHeaderActionsProps {
  compact?: boolean;
  /** When set, Admin can trigger Simulate AI Check for this survey only. */
  surveyId?: number;
  surveyName?: string;
}

export function SurveysHeaderActions({
  compact,
  surveyId,
  surveyName,
}: SurveysHeaderActionsProps) {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const { showToast } = useWuShowToast();
  const reviewing = usePhishingScanReviewing();
  const paused = usePublishSendPaused();
  const [simulating, setSimulating] = useState(false);
  const onEditSection =
    typeof surveyId === 'number' &&
    getSurveyEditorPhaseFromPathname(pathname, surveyId) === 'edit';
  /** Prototype scan is Edit-section only (not Distribute / Analytics). */
  const canSimulateAiCheck = onEditSection;

  function handleSimulateAiCheck(): void {
    if (!canSimulateAiCheck || simulating || reviewing) return;
    setSimulating(true);
    showToast({ message: 'Running AI risk check…', variant: 'info' });
    simulateAiPhishingCheck({ surveyId, surveyName });
    window.setTimeout(() => {
      setSimulating(false);
      showToast({
        message: 'Publish and send paused — open See Why on the banner, or go to Verification.',
        variant: 'success',
      });
    }, getPhishingScanDelayMs() + 50);
  }

  function handleClearSimulation(): void {
    resetPhishingHoldState();
    showToast({ message: 'AI check simulation cleared', variant: 'info' });
  }

  return (
    <div className={compact ? `${styles.bar} ${styles.barCompact}` : styles.bar}>
      <WuAppHeaderSearch
        placeholder="Global search for users, surveys, tickets"
        defaultCollapsed={false}
        onSearch={() =>
          showToast({ message: 'Global search is not available in this prototype', variant: 'info' })
        }
        className={styles.search}
      />
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.flaskBtn}
          aria-label="Question type usage"
          title="Question type usage"
          onClick={() => router.push('/question-type-usage')}
        >
          <span className="wm-science" aria-hidden />
        </button>
        <WuMenu
          Trigger={
            <button type="button" className={styles.adminTrigger}>
              Admin
              <span className="wm-arrow-drop-down" />
            </button>
          }
          align="end"
        >
          <WuMenuItem
            onSelect={() => showToast({ message: 'User management', variant: 'success' })}
          >
            User management
          </WuMenuItem>
          <WuMenuItem
            onSelect={() => showToast({ message: 'Account settings', variant: 'success' })}
          >
            Account settings
          </WuMenuItem>
          <WuMenuItem
            onSelect={() =>
              window.open('https://bi-lite.vercel.app/dashboards', '_blank', 'noopener,noreferrer')
            }
          >
            BI Lite
          </WuMenuItem>
          <WuMenuItem onSelect={() => router.push('/surveys/create')}>
            New survey creation flow
          </WuMenuItem>
          <WuMenuItem
            onSelect={() => {
              setSurveyFooterBrand('essentials');
              showToast({
                message: 'Footer brand set to Essentials (phishing publish scan on)',
                variant: 'success',
              });
            }}
          >
            Demo: Essentials brand
          </WuMenuItem>
          {canSimulateAiCheck ? (
            <WuMenuItem
              disabled={simulating || reviewing}
              onSelect={handleSimulateAiCheck}
            >
              {simulating || reviewing ? 'Simulating…' : 'Simulate AI Check'}
            </WuMenuItem>
          ) : null}
          {canSimulateAiCheck && paused ? (
            <WuMenuItem onSelect={handleClearSimulation}>Clear AI Check simulation</WuMenuItem>
          ) : null}
          <WuMenuItem onSelect={() => router.push('/account/verification')}>
            Verification
          </WuMenuItem>
          <WuMenuItem onSelect={() => router.push('/cxperts/users/demo')}>
            CX review (admin)
          </WuMenuItem>
          <WuMenuItem onSelect={() => router.push('/signup')}>
            Sign up free
          </WuMenuItem>
        </WuMenu>
        <WuButton
          variant="rounded"
          color="upgrade"
          onClick={() => showToast({ message: 'Upgrade options opened', variant: 'success' })}
        >
          Upgrade Now
        </WuButton>
      </div>
    </div>
  );
}
