'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { isValidEmailAddress, normalizeEmailAddress } from '@/data/mock-survey-distribute';
import {
  SURVEY_REVIEWERS,
  findSurveyReviewerByEmail,
  getCurrentSurveyReviewer,
  getSurveyReviewerSelectOptions,
  resolveSurveyReviewer,
  type SurveyReviewer,
} from '@/data/mock-survey-approval';
import styles from './SurveyApprovalDashboard.module.css';

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);

interface SendSurveyForReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reviewer: SurveyReviewer, notes: string) => void;
}

export function SendSurveyForReviewModal({
  open,
  onOpenChange,
  onSubmit,
}: SendSurveyForReviewModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const reviewerOptions = useMemo(() => getSurveyReviewerSelectOptions(), []);
  const matchedReviewer = findSurveyReviewerByEmail(email);
  const selectedOption =
    reviewerOptions.find((option) => option.id === matchedReviewer?.id) ?? null;

  useEffect(() => {
    if (!open) return;
    setEmail(getCurrentSurveyReviewer().email);
    setNotes('');
  }, [open]);

  if (!open || !wick) return null;

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuModalClose, WuButton } = wick;

  function handleSelectReviewer(item: { id: string } | null): void {
    if (!item) return;
    const reviewer = SURVEY_REVIEWERS.find((entry) => entry.id === item.id);
    if (reviewer) setEmail(reviewer.email);
  }

  function handleSubmit(): void {
    const normalized = normalizeEmailAddress(email);
    if (!isValidEmailAddress(normalized)) {
      showToast({ message: 'Enter a valid email address', variant: 'error' });
      return;
    }
    onSubmit(resolveSurveyReviewer(normalized), notes.trim());
    onOpenChange(false);
  }

  return (
    <WuModal open onOpenChange={onOpenChange} variant="action" size="sm">
      <WuModalHeader>Send for review</WuModalHeader>
      <WuModalContent>
        <div className={styles.modalFields}>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Email address</span>
            <WuInput
              variant="outlined"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Or select from existing reviewers</span>
            <WuSelect
              data={reviewerOptions}
              accessorKey={{ value: 'id', label: 'label' }}
              value={selectedOption}
              onSelect={(item) => handleSelectReviewer(item as { id: string } | null)}
              variant="outlined"
            />
          </label>
          <label className={styles.field}>
            <span className={styles.fieldLabel}>Notes (optional)</span>
            <textarea
              className={styles.textarea}
              rows={4}
              placeholder="Add context for the reviewer, such as what changed or what to look at first."
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
        </div>
      </WuModalContent>
      <WuModalFooter>
        <WuModalClose variant="secondary">Cancel</WuModalClose>
        <WuButton disabled={!email.trim()} onClick={handleSubmit}>
          Send for review
        </WuButton>
      </WuModalFooter>
    </WuModal>
  );
}
