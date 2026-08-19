'use client';

import { useCallback } from 'react';
import { SurveyApprovalDashboard } from '@/components/surveys/SurveyApprovalDashboard';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { getSurveyEditorTitle } from '@/data/get-survey-by-id';
import { useSurveyById } from '@/hooks/useSurveyById';

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

  const { WuModal, WuModalHeader, WuModalContent, WuModalClose } = wick;

  return (
    <WuModal
      open
      onOpenChange={handleModalOpenChange}
      variant="action"
      size="lg"
      style={{ maxWidth: '720px', maxHeight: '85vh' }}
    >
      <WuModalHeader style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 600, fontSize: '1.125rem' }}>Approvals</span>
        <WuModalClose variant="secondary" style={{ minWidth: 'auto', padding: '4px 8px' }}>
          ✕
        </WuModalClose>
      </WuModalHeader>
      <WuModalContent style={{ overflow: 'auto', maxHeight: 'calc(85vh - 60px)', padding: 0 }}>
        <SurveyApprovalDashboard
          surveyId={surveyId}
          surveyName={getSurveyEditorTitle(survey)}
        />
      </WuModalContent>
    </WuModal>
  );
}
