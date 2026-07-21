'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { SurveySettingsRichText } from '@/components/surveys/SurveySettingsRichText';
import { MOCK_EMAIL_SENDERS } from '@/data/mock-survey-distribute';
import {
  SAVE_AND_CONTINUE_EMAIL_HELP,
  type SaveAndContinueEmailSettings,
} from '@/data/mock-survey-settings';
import styles from './SaveAndContinueEmailModal.module.css';

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

interface SaveAndContinueEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: SaveAndContinueEmailSettings;
  onSave: (next: SaveAndContinueEmailSettings) => void;
}

export function SaveAndContinueEmailModal({
  open,
  onOpenChange,
  value,
  onSave,
}: SaveAndContinueEmailModalProps) {
  const wick = useWickUILib();
  const [draft, setDraft] = useState<SaveAndContinueEmailSettings>(value);
  const [editorKey, setEditorKey] = useState(0);

  useEffect(() => {
    if (!open) return;
    setDraft(value);
    setEditorKey((key) => key + 1);
  }, [open, value]);

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuButton } = wick;
  const selectedSender =
    MOCK_EMAIL_SENDERS.find((sender) => sender.value === draft.fromSenderId) ??
    MOCK_EMAIL_SENDERS[0];

  function handleSave(): void {
    onSave(draft);
    onOpenChange(false);
  }

  return (
    <WuModal open onOpenChange={onOpenChange} variant="action" className={styles.modal}>
      <WuModalHeader className={styles.header}>
        <span className={styles.headerTitleRow}>
          <span className={styles.headerTitle}>Save &amp; Continue Email</span>
          <WuTooltip content={SAVE_AND_CONTINUE_EMAIL_HELP} position="bottom">
            <span className={styles.helpIcon} aria-label={SAVE_AND_CONTINUE_EMAIL_HELP}>
              <span className="wm-help" aria-hidden />
            </span>
          </WuTooltip>
        </span>
      </WuModalHeader>
      <WuModalContent className={styles.content}>
        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>From:</span>
          <div className={styles.selectWrap}>
            <WuSelect
              data={MOCK_EMAIL_SENDERS}
              accessorKey={{ value: 'value', label: 'label' }}
              value={selectedSender}
              onSelect={(item) => {
                const selected = item as { value: string } | null;
                if (!selected) return;
                setDraft((prev) => ({ ...prev, fromSenderId: selected.value }));
              }}
              variant="outlined"
              aria-label="From"
            />
          </div>
        </div>

        <div className={styles.fieldRow}>
          <span className={styles.fieldLabel}>Subject:</span>
          <WuInput
            value={draft.subject}
            onChange={(event) =>
              setDraft((prev) => ({ ...prev, subject: event.target.value }))
            }
            aria-label="Subject"
          />
        </div>

        <div className={styles.bodyField}>
          <SurveySettingsRichText
            key={editorKey}
            value={draft.body}
            onChange={(body) => setDraft((prev) => ({ ...prev, body }))}
            ariaLabel="Save and Continue email body"
            toolbarPosition="bottom"
          />
        </div>
      </WuModalContent>
      <WuModalFooter>
        <div className={styles.footerActions}>
          <WuButton onClick={handleSave}>Save</WuButton>
        </div>
      </WuModalFooter>
    </WuModal>
  );
}
