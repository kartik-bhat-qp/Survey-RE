'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  useSurveyWorkspaceSections,
  type SurveyQuestionTarget,
} from '@/components/surveys/SurveyWorkspaceSectionsContext';
import type { SurveySection } from '@/data/mock-survey-detail';
import {
  REMOVE_LOGIC_OPTIONS,
  createDefaultRemoveLogicSelections,
  type RemoveLogicOptionId,
  type RemoveLogicSelections,
} from '@/data/mock-remove-logic-options';
import styles from './RemoveAllLogicModal.module.css';

const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false }
);

interface RemoveAllLogicModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClearCustomJs?: () => void;
}

function getAllQuestionTargets(sections: SurveySection[]): SurveyQuestionTarget[] {
  return sections.flatMap((section) =>
    section.questions.map((question) => ({
      sectionId: section.id,
      questionId: question.id,
    }))
  );
}

export function RemoveAllLogicModal({
  open,
  onOpenChange,
  onClearCustomJs,
}: RemoveAllLogicModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const { sections, clearShowHideLogic } = useSurveyWorkspaceSections();
  const [selections, setSelections] = useState<RemoveLogicSelections>(
    createDefaultRemoveLogicSelections
  );

  useEffect(() => {
    if (!open) return;
    setSelections(createDefaultRemoveLogicSelections());
  }, [open]);

  const handleModalOpenChange = useCallback(
    (nextOpen: boolean) => {
      queueMicrotask(() => onOpenChange(nextOpen));
    },
    [onOpenChange]
  );

  const selectedOptions = useMemo(
    () => REMOVE_LOGIC_OPTIONS.filter((option) => selections[option.id]),
    [selections]
  );
  const canRemove = selectedOptions.length > 0;

  function setOptionSelected(optionId: RemoveLogicOptionId, checked: boolean): void {
    setSelections((prev) => ({ ...prev, [optionId]: checked }));
  }

  function handleRemoveLogic(): void {
    if (!canRemove) return;

    const removesShowHide = selectedOptions.some(
      (option) =>
        option.id === 'show-hide-question' || option.id === 'show-hide-options'
    );

    if (removesShowHide) {
      clearShowHideLogic(getAllQuestionTargets(sections));
    }

    if (selections.javascript) {
      onClearCustomJs?.();
    }

    showToast({
      message: `Removed ${selectedOptions.length} logic type${
        selectedOptions.length === 1 ? '' : 's'
      } from this survey`,
      variant: 'success',
    });
    handleModalOpenChange(false);
  }

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuModalClose, WuButton } =
    wick;

  return (
    <WuModal
      open
      onOpenChange={handleModalOpenChange}
      className={styles.modal}
      variant="action"
      size="md"
    >
      <WuModalHeader className={styles.header}>
        <span className={styles.headerTitle}>Remove All Logic</span>
      </WuModalHeader>
      <WuModalContent className={styles.content}>
        <p className={styles.intro}>
          Are you sure you want to remove logic from this survey ?
        </p>

        <div className={styles.toggleList}>
          {REMOVE_LOGIC_OPTIONS.map((option) => (
            <div key={option.id} className={styles.toggleRow}>
              <span className={styles.toggleLabel}>{option.label}</span>
              <WuToggle
                checked={selections[option.id]}
                onChange={(checked) => setOptionSelected(option.id, checked)}
                aria-label={option.label}
              />
            </div>
          ))}
        </div>

        <p className={styles.helperText}>
          All logic options selected above will be removed and reset.
        </p>

        <div className={styles.warningBanner} role="alert">
          <span className={styles.warningIcon} aria-hidden>
            !
          </span>
          <p className={styles.warningText}>
            This action <strong>CANNOT</strong> be undone.
          </p>
        </div>
      </WuModalContent>
      <WuModalFooter>
        <WuModalClose variant="secondary">Cancel</WuModalClose>
        <WuButton onClick={handleRemoveLogic} disabled={!canRemove}>
          Remove Logic
        </WuButton>
      </WuModalFooter>
    </WuModal>
  );
}
