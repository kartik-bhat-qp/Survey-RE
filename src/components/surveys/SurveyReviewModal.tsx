'use client';

import { useCallback } from 'react';
import { SurveyReviewerView } from '@/components/surveys/SurveyReviewerView';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { useSurveyById } from '@/hooks/useSurveyById';
import styles from './SurveyReviewModal.module.css';

interface SurveyReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyId: number;
}

export function SurveyReviewModal({ open, onOpenChange, surveyId }: SurveyReviewModalProps) {
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
      <WuModalHeader className={styles.header}>Review</WuModalHeader>
      <WuModalContent className={styles.content}>
        <SurveyReviewerView survey={survey} compact onClose={() => onOpenChange(false)} />
      </WuModalContent>
    </WuModal>
  );
}
