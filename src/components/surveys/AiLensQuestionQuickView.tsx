'use client';

import { useCallback } from 'react';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { getAiLensQuestionQuickView } from '@/data/mock-ai-lens';
import styles from './AiLensQuestionQuickView.module.css';

interface AiLensQuestionQuickViewProps {
  open: boolean;
  questionId: string;
  code: string;
  text: string;
  onOpenChange: (open: boolean) => void;
}

export function AiLensQuestionQuickView({
  open,
  questionId,
  code,
  text,
  onOpenChange,
}: AiLensQuestionQuickViewProps) {
  const wick = useWickUILib();
  const preview = getAiLensQuestionQuickView(questionId, { code, text });

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      queueMicrotask(() => onOpenChange(nextOpen));
    },
    [onOpenChange]
  );

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent } = wick;

  return (
    <WuModal
      open
      onOpenChange={handleOpenChange}
      variant="action"
      size="md"
      className={styles.modal}
    >
      <WuModalHeader className={styles.header}>
        <span className={styles.title}>Question Information</span>
      </WuModalHeader>
      <WuModalContent className={styles.content}>
        <div className={styles.body}>
          <div className={styles.metaCard}>
            <span className={styles.codeBadge}>{preview.code}</span>
            <div className={styles.typeBlock}>
              <span className={styles.sectionLabel}>Question type</span>
              <div className={styles.typePills}>
                <span className={styles.typePillSolid}>{preview.familyLabel}</span>
                <span className={styles.typePillDashed}>{preview.typeLabel}</span>
              </div>
            </div>
          </div>

          <div className={styles.contentCard}>
            <span className={styles.sectionLabel}>Question text</span>
            <p className={styles.questionText}>{preview.text}</p>
          </div>

          <div className={styles.contentCard}>
            <div className={styles.optionsHeader}>
              <span className={styles.sectionLabel}>Answer options</span>
              <span className={styles.optionsCount}>{preview.optionLabels.length}</span>
            </div>
            {preview.optionLabels.length > 0 ? (
              <ol className={styles.optionsList}>
                {preview.optionLabels.map((label, index) => (
                  <li key={`${preview.code}-opt-${index}`} className={styles.optionRow}>
                    <span className={styles.optionIndex}>{index + 1}</span>
                    <span className={styles.optionLabel}>{label}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className={styles.optionsEmpty}>No answer options for this question type.</p>
            )}
          </div>
        </div>
      </WuModalContent>
    </WuModal>
  );
}
