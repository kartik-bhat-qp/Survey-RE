'use client';

import { useCallback } from 'react';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { SurveyIntegrityEditor } from './SurveyIntegrityEditor';
import styles from './SurveyIntegrityModal.module.css';

export function SurveyIntegrityModal({
  open,
  onOpenChange,
  surveyId,
  surveyName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyId: number;
  surveyName: string;
}) {
  const wick = useWickUILib();
  const handleOpenChange = useCallback(
    (next: boolean) => {
      queueMicrotask(() => onOpenChange(next));
    },
    [onOpenChange],
  );

  if (!open || !wick) return null;

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuModalClose } = wick;

  return (
    <WuModal open onOpenChange={handleOpenChange} size="md" variant="action">
      <WuModalHeader>Respondent integrity</WuModalHeader>
      <WuModalContent className={styles.content}>
        <SurveyIntegrityEditor embedded surveyId={surveyId} surveyName={surveyName} />
      </WuModalContent>
      <WuModalFooter>
        <WuModalClose variant="secondary">Close</WuModalClose>
      </WuModalFooter>
    </WuModal>
  );
}
