'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { NavLink } from '@/components/surveys/NavLink';
import {
  useSurveyEditorPhase,
  type SurveyEditorPhase,
} from '@/components/surveys/SurveyEditorPhaseContext';
import { getSurveyEditorPhasePath } from '@/components/surveys/survey-editor-navigation';
import {
  isSurveyReviewModeQuery,
  SURVEY_REVIEW_MODE_QUERY,
  surveyHasApprovalTab,
} from '@/data/mock-survey-approval';
import { SurveyApprovalsModal } from '@/components/surveys/SurveyApprovalsModal';
import { SurveyReviewModal } from '@/components/surveys/SurveyReviewModal';
import { AiLensModal } from '@/components/surveys/AiLensModal';
import { isAiLensSurvey } from '@/data/mock-ai-lens';
import styles from './SurveyEditorPhaseTabs.module.css';

const WuPrimaryNavbar = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuPrimaryNavbar })),
  { ssr: false }
);

const PHASE_TABS: { id: SurveyEditorPhase; label: string }[] = [
  { id: 'edit', label: 'Edit' },
  { id: 'distribute', label: 'Distribute' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'analytics-2', label: 'Analytics 2.0' },
  { id: 'integration', label: 'Integration' },
];

function deferOpenChange(setter: (open: boolean) => void, open: boolean): void {
  queueMicrotask(() => setter(open));
}

export function SurveyEditorPhaseTabs() {
  const params = useParams();
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const searchParams = useSearchParams();
  const surveyId = Number(params.id);
  const { showToast } = useWuShowToast();
  const showApprovals = surveyHasApprovalTab(surveyId);
  const showAiLens = isAiLensSurvey(surveyId);
  const { activePhase, setActivePhase } = useSurveyEditorPhase();
  const [approvalsModalOpen, setApprovalsModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [aiLensOpen, setAiLensOpen] = useState(false);
  const reviewModeRequested = isSurveyReviewModeQuery(
    searchParams.get(SURVEY_REVIEW_MODE_QUERY)
  );

  useEffect(() => {
    if (!showApprovals || !reviewModeRequested) return;
    setApprovalsModalOpen(false);
    setReviewModalOpen(true);
  }, [reviewModeRequested, showApprovals]);

  const clearReviewModeQuery = useCallback(() => {
    if (!reviewModeRequested) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete(SURVEY_REVIEW_MODE_QUERY);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [pathname, reviewModeRequested, router, searchParams]);

  const handleReviewModalOpenChange = useCallback(
    (open: boolean) => {
      setReviewModalOpen(open);
      if (!open) clearReviewModeQuery();
    },
    [clearReviewModeQuery]
  );

  const handleAiLensOpenChange = useCallback((open: boolean) => {
    deferOpenChange(setAiLensOpen, open);
  }, []);

  useEffect(() => {
    if (!showAiLens) return;
    const onOpenRequest = () => setAiLensOpen(true);
    window.addEventListener('questionpro-ai-lens-open', onOpenRequest);
    return () => window.removeEventListener('questionpro-ai-lens-open', onOpenRequest);
  }, [showAiLens]);

  const links = useMemo(
    () =>
      PHASE_TABS.map((tab) => (
        <NavLink
          key={tab.id}
          href={
            tab.id === 'integration'
              ? '#'
              : getSurveyEditorPhasePath(surveyId, tab.id as SurveyEditorPhase)
          }
          active={activePhase === tab.id}
          onClick={(event) => {
            event.preventDefault();
            if (
              tab.id === 'edit' ||
              tab.id === 'analytics' ||
              tab.id === 'analytics-2' ||
              tab.id === 'distribute'
            ) {
              setActivePhase(tab.id);
              return;
            }
            showToast({
              message: `${tab.label} is not available in this prototype`,
              variant: 'info',
            });
          }}
        >
          {tab.label}
        </NavLink>
      )),
    [activePhase, setActivePhase, showToast, surveyId]
  );

  return (
    <>
      <WuPrimaryNavbar Links={links}>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.userCountBtn}
            onClick={() => showToast({ message: 'Collaborators', variant: 'success' })}
          >
            <span className="wm-group" />
            1.8K
          </button>
        </div>
      </WuPrimaryNavbar>
      {approvalsModalOpen ? (
        <SurveyApprovalsModal
          open
          onOpenChange={setApprovalsModalOpen}
          surveyId={surveyId}
        />
      ) : null}
      {reviewModalOpen ? (
        <SurveyReviewModal
          open
          onOpenChange={handleReviewModalOpenChange}
          surveyId={surveyId}
        />
      ) : null}
      {aiLensOpen && showAiLens ? (
        <AiLensModal open onOpenChange={handleAiLensOpenChange} />
      ) : null}
    </>
  );
}
