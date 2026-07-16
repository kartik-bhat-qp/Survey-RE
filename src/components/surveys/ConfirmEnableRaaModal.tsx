'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWickUILib } from '@/components/ui/useWickUILib';
import styles from './ConfirmEnableRaaModal.module.css';

const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);
const WuCheckbox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCheckbox })),
  { ssr: false }
);

const HELP_TOOLTIP =
  'RAA permanently anonymizes the selected fields for this survey and cannot be turned off later.';

interface ConfirmEnableRaaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBack: () => void;
  onConfirm: () => void;
}

export function ConfirmEnableRaaModal({
  open,
  onOpenChange,
  onBack,
  onConfirm,
}: ConfirmEnableRaaModalProps) {
  const wick = useWickUILib();
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAcknowledged(false);
  }, [open]);

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuButton } = wick;

  function handleBack(): void {
    onBack();
  }

  function handleEnable(): void {
    if (!acknowledged) return;
    onConfirm();
  }

  return (
    <WuModal
      open
      onOpenChange={onOpenChange}
      variant="action"
      className={styles.modal}
    >
      <WuModalHeader className={styles.header}>
        <span className={styles.headerTitleRow}>
          <span className={styles.headerTitle}>Confirm Survey RAA Settings</span>
          <WuTooltip content={HELP_TOOLTIP} position="bottom">
            <span className={styles.helpIcon} aria-label={HELP_TOOLTIP}>
              <span className="wm-help" aria-hidden />
            </span>
          </WuTooltip>
        </span>
      </WuModalHeader>
      <WuModalContent className={styles.content}>
        <p className={styles.question}>
          Are you sure you want to enable RAA for this survey with the selected fields?
        </p>
        <div className={styles.copyBlock}>
          <p className={styles.copy}>
            Enabling RAA will mask the selected respondent fields for all responses.
          </p>
          <p className={styles.copy}>
            Once RAA is enabled, it will remain perpetual and cannot be disabled.
          </p>
        </div>
        <div className={styles.warningBanner} role="alert">
          <span className={styles.warningIcon} aria-hidden>
            !
          </span>
          <span className={styles.warningText}>This action cannot be undone</span>
        </div>
        <label className={styles.ackBox}>
          <WuCheckbox
            checked={acknowledged}
            onChange={setAcknowledged}
            aria-label="I understand that once enabled, RAA cannot be disabled for this survey."
          />
          <span className={styles.ackText}>
            I understand that once enabled, RAA cannot be disabled for this survey.
          </span>
        </label>
      </WuModalContent>
      <WuModalFooter>
        <div className={styles.footerActions}>
          <button type="button" className={styles.backLink} onClick={handleBack}>
            Back
          </button>
          <WuButton onClick={handleEnable} disabled={!acknowledged}>
            Enable RAA
          </WuButton>
        </div>
      </WuModalFooter>
    </WuModal>
  );
}
