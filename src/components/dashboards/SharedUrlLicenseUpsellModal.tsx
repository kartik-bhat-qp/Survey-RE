'use client';

import { useWickUILib } from '@/components/ui/useWickUILib';
import { SHARED_URL_UPSELL } from '@/data/mock-shared-urls';
import styles from './SharedUrlLicenseUpsellModal.module.css';

interface SharedUrlLicenseUpsellModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExplore: () => void;
}

export function SharedUrlLicenseUpsellModal({
  open,
  onOpenChange,
  onExplore,
}: SharedUrlLicenseUpsellModalProps) {
  const wick = useWickUILib();

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuModalClose, WuButton } =
    wick;

  return (
    <WuModal open onOpenChange={onOpenChange} variant="action" size="md">
      <WuModalHeader className={styles.header}>
        <span className={`wm-diamond ${styles.headerIcon}`} aria-hidden />
        {SHARED_URL_UPSELL.title}
      </WuModalHeader>

      <WuModalContent className={styles.content}>
        <p className={styles.subtitle}>{SHARED_URL_UPSELL.subtitle}</p>

        <div className={styles.highlight}>
          <p className={styles.highlightTitle}>What you get with BI</p>
          <ul className={styles.benefitList}>
            {SHARED_URL_UPSELL.benefits.map((benefit) => (
              <li key={benefit} className={styles.benefitItem}>
                <span className={`wm-check ${styles.checkIcon}`} aria-hidden />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className={styles.footnote}>
          BI Lite is part of QuestionPro&apos;s research suite—turn survey data into dashboards
          your stakeholders can explore on their own.
        </p>
      </WuModalContent>

      <WuModalFooter>
        <WuModalClose variant="secondary">{SHARED_URL_UPSELL.secondaryCta}</WuModalClose>
        <WuButton onClick={onExplore}>{SHARED_URL_UPSELL.primaryCta}</WuButton>
      </WuModalFooter>
    </WuModal>
  );
}
