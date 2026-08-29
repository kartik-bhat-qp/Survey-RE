'use client';

import { useCallback, useEffect, useState } from 'react';
import { SurveyApprovalDashboard } from '@/components/surveys/SurveyApprovalDashboard';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { getSurveyEditorTitle } from '@/data/get-survey-by-id';
import {
  DEFAULT_SURVEY_APPROVAL_STATE,
  readSurveyApprovalState,
  subscribeSurveyApprovalState,
} from '@/data/mock-survey-approval';
import { openReviewerInbox } from '@/data/mock-survey-reviewer-inbox';
import { useSurveyById } from '@/hooks/useSurveyById';
import styles from './SurveyApprovalsModal.module.css';

interface SurveyApprovalsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyId: number;
}

export function SurveyApprovalsModal({ open, onOpenChange, surveyId }: SurveyApprovalsModalProps) {
  const wick = useWickUILib();
  const { survey } = useSurveyById(surveyId);
  const [approvalState, setApprovalState] = useState(DEFAULT_SURVEY_APPROVAL_STATE);

  const handleModalOpenChange = useCallback(
    (nextOpen: boolean) => {
      queueMicrotask(() => onOpenChange(nextOpen));
    },
    [onOpenChange]
  );

  useEffect(() => {
    setApprovalState(readSurveyApprovalState(surveyId));
    return subscribeSurveyApprovalState(surveyId, setApprovalState);
  }, [surveyId]);

  if (!open || !wick || !survey) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent } = wick;
  const showInboxLink = approvalState.status === 'pending' && Boolean(approvalState.currentRequest);

  return (
    <WuModal
      open
      onOpenChange={handleModalOpenChange}
      variant="action"
      size="lg"
      className={styles.modal}
    >
      <WuModalHeader className={styles.header}>
        Approvals
        {showInboxLink ? (
          <button
            type="button"
            className={styles.inboxLink}
            onClick={() => {
              const reviewerEmail =
                approvalState.currentRequest?.reviewerEmail ??
                approvalState.currentRequest?.reviewerName;
              if (!reviewerEmail) return;
              openReviewerInbox(reviewerEmail);
            }}
          >
            Open reviewer inbox
            <span className={`wm-open-in-new ${styles.inboxLinkIcon}`} aria-hidden />
          </button>
        ) : null}
      </WuModalHeader>
      <WuModalContent className={styles.content}>
        <SurveyApprovalDashboard
          surveyId={surveyId}
          surveyName={getSurveyEditorTitle(survey)}
          compact
        />
      </WuModalContent>
    </WuModal>
  );
}
