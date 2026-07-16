'use client';

import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  isHtmlContent,
  toEditorHtml,
} from '@/components/surveys/rich-text-utils';
import type { RaaPopupCopy } from '@/data/mock-compliance';
import styles from './RespondentAnonymityAssurancePopup.module.css';

interface RespondentAnonymityAssurancePopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  copy: RaaPopupCopy;
  enabledFieldLabels: string[];
}

export function RespondentAnonymityAssurancePopup({
  open,
  onOpenChange,
  copy,
  enabledFieldLabels,
}: RespondentAnonymityAssurancePopupProps) {
  const wick = useWickUILib();

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuModalClose } = wick;
  const additional = copy.additionalContent.trim();

  return (
    <WuModal open onOpenChange={onOpenChange} variant="action" className={styles.modal}>
      <WuModalHeader className={styles.header}>Respondent Anonymity Assurance</WuModalHeader>
      <WuModalContent className={styles.content}>
        <h2 className={styles.bodyTitle}>{copy.bodyTitle}</h2>
        <p className={styles.paragraph}>{copy.intro}</p>
        {enabledFieldLabels.length > 0 ? (
          <ul className={styles.fieldList}>
            {enabledFieldLabels.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        ) : (
          <p className={styles.paragraphMuted}>No anonymized fields are configured.</p>
        )}
        <p className={styles.paragraph}>{copy.outro}</p>
        {additional ? (
          <>
            <hr className={styles.separator} />
            {isHtmlContent(additional) ? (
              <div
                className={styles.richText}
                dangerouslySetInnerHTML={{ __html: toEditorHtml(additional) }}
              />
            ) : (
              <p className={styles.paragraph}>{additional}</p>
            )}
          </>
        ) : null}
      </WuModalContent>
      <WuModalFooter>
        <WuModalClose variant="secondary">Close</WuModalClose>
      </WuModalFooter>
    </WuModal>
  );
}
