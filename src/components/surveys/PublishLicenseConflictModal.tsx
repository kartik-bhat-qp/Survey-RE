'use client';

import dynamic from 'next/dynamic';
import { useWickUILib } from '@/components/ui/useWickUILib';
import type { SurveyLicenseConflict } from '@/data/mock-add-question-types';
import styles from './PublishLicenseConflictModal.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

export type PublishLicenseModalView = 'conflicts' | 'publish-confirm';

export interface PublishLicenseConflictModalProps {
  open: boolean;
  view: PublishLicenseModalView;
  onOpenChange: (open: boolean) => void;
  conflicts: SurveyLicenseConflict[];
  onDeleteQuestion: (conflict: SurveyLicenseConflict) => void;
  onUpgradeLicense: () => void;
  onConfirmPublish: () => void;
}

export function PublishLicenseConflictModal({
  open,
  view,
  onOpenChange,
  conflicts,
  onDeleteQuestion,
  onUpgradeLicense,
  onConfirmPublish,
}: PublishLicenseConflictModalProps) {
  const wick = useWickUILib();

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuModalClose } = wick;

  if (view === 'publish-confirm') {
    return (
      <WuModal open onOpenChange={onOpenChange} variant="action" size="sm">
        <WuModalHeader>Publish survey</WuModalHeader>
        <WuModalContent>
          <p className={styles.confirmMessage}>Would you like to publish your survey?</p>
        </WuModalContent>
        <WuModalFooter>
          <WuModalClose variant="secondary">Cancel</WuModalClose>
          <WuButton onClick={onConfirmPublish}>Publish</WuButton>
        </WuModalFooter>
      </WuModal>
    );
  }

  return (
    <WuModal open onOpenChange={onOpenChange} variant="action" size="md">
      <WuModalHeader>Upgrade required</WuModalHeader>
      <WuModalContent>
        <p className={styles.intro}>
          Your survey contains questions or features that are not included in your current license. To publish the survey,
          you can either remove these items or upgrade your license to gain access to them.
        </p>
        <ul className={styles.list}>
          {conflicts.map((conflict) => (
            <li
              key={`${conflict.sectionId}-${conflict.questionId}`}
              className={styles.item}
            >
              <div className={styles.itemBody}>
                <span className={styles.itemMain}>
                  <span className={styles.questionCode}>{conflict.questionCode}</span>
                  <span className={styles.typeLabel}>{conflict.typeLabel}</span>
                </span>
                <span className={styles.requirement}>
                  Requires {conflict.requiredLicenseLabel}
                </span>
              </div>
              <WuButton
                size="sm"
                variant="iconOnly"
                className={styles.deleteBtn}
                aria-label={`Delete ${conflict.typeLabel} question`}
                Icon={<span className="wm-delete" />}
                onClick={() => onDeleteQuestion(conflict)}
              />
            </li>
          ))}
        </ul>
      </WuModalContent>
      <WuModalFooter>
        <WuModalClose variant="secondary">Close</WuModalClose>
        <WuButton color="upgrade" onClick={onUpgradeLicense}>
          Upgrade your license
        </WuButton>
      </WuModalFooter>
    </WuModal>
  );
}
