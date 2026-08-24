'use client';

import { useCallback } from 'react';
import { SurveyApprovalDashboard } from '@/components/surveys/SurveyApprovalDashboard';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { getSurveyEditorTitle } from '@/data/get-survey-by-id';
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

  const handleModalOpenChange = useCallback(
    (nextOpen: boolean) => {
      queueMicrotask(() => onOpenChange(nextOpen));
    },
    [onOpenChange]
  );

  if (!open || !wick || !survey) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent } = wick;

  return (
    <WuModal
      open
      onOpenChange={handleModalOpenChange}
      variant="action"
      size="lg"
      className={styles.modal}
    >
      <WuModalHeader className={styles.header}>Approvals</WuModalHeader>
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
