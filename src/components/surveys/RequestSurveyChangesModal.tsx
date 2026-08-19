'use client';

import { useEffect, useState } from 'react';
import { useWickUILib } from '@/components/ui/useWickUILib';
import styles from './SurveyApprovalDashboard.module.css';

interface RequestSurveyChangesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (feedback: string) => void;
}

export function RequestSurveyChangesModal({
  open,
  onOpenChange,
  onSubmit,
}: RequestSurveyChangesModalProps) {
  const wick = useWickUILib();
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!open) return;
    setFeedback('');
  }, [open]);

  if (!open || !wick) return null;

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuModalClose, WuButton } = wick;

  return (
    <WuModal open onOpenChange={onOpenChange} variant="action" size="sm">
      <WuModalHeader>Request changes</WuModalHeader>
      <WuModalContent>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Comments for the survey owner</span>
          <textarea
            className={styles.textarea}
            rows={4}
            placeholder="Describe what needs to change before this survey can be published."
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
          />
        </label>
      </WuModalContent>
      <WuModalFooter>
        <WuModalClose variant="secondary">Cancel</WuModalClose>
        <WuButton
          disabled={!feedback.trim()}
          onClick={() => {
            onSubmit(feedback.trim());
            onOpenChange(false);
          }}
        >
          Request changes
        </WuButton>
      </WuModalFooter>
    </WuModal>
  );
}
