'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import {
  MOCK_EMAIL_LISTS,
  isValidEmailAddress,
  normalizeEmailAddress,
  type EmailListOption,
} from '@/data/mock-survey-distribute';
import styles from './ComposeRecipientsField.module.css';

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

interface ComposeRecipientsFieldProps {
  selectedList: EmailListOption | null;
  onSelectedListChange: (list: EmailListOption | null) => void;
  recipientEmails: string[];
  onRecipientEmailsChange: (emails: string[]) => void;
}

export function ComposeRecipientsField({
  selectedList,
  onSelectedListChange,
  recipientEmails,
  onRecipientEmailsChange,
}: ComposeRecipientsFieldProps) {
  const { showToast } = useWuShowToast();
  const [emailDraft, setEmailDraft] = useState('');

  function addEmailFromDraft(): void {
    const normalized = normalizeEmailAddress(emailDraft);
    if (!normalized) return;

    if (!isValidEmailAddress(normalized)) {
      showToast({ message: 'Enter a valid email address', variant: 'error' });
      return;
    }

    if (recipientEmails.includes(normalized)) {
      showToast({ message: 'Email address already added', variant: 'info' });
      setEmailDraft('');
      return;
    }

    onRecipientEmailsChange([...recipientEmails, normalized]);
    setEmailDraft('');
  }

  function removeEmail(email: string): void {
    onRecipientEmailsChange(recipientEmails.filter((entry) => entry !== email));
  }

  function handleEmailDraftKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addEmailFromDraft();
    }

    if (event.key === 'Backspace' && !emailDraft && recipientEmails.length > 0) {
      onRecipientEmailsChange(recipientEmails.slice(0, -1));
    }
  }

  function handleListSelect(item: unknown): void {
    if (!item) {
      onSelectedListChange(null);
      return;
    }

    onSelectedListChange(item as EmailListOption);
  }

  const hasRecipients = Boolean(selectedList) || recipientEmails.length > 0;

  return (
    <div className={styles.recipientsField}>
      <div className={styles.recipientsMain}>
        {selectedList ? (
          <span className={`${styles.recipientChip} ${styles.listChip}`}>
            <span className="wm-group" aria-hidden />
            <span className={styles.chipLabel}>{selectedList.label}</span>
            <button
              type="button"
              className={styles.chipRemoveBtn}
              aria-label={`Remove ${selectedList.label}`}
              onClick={() => onSelectedListChange(null)}
            >
              <span className="wm-close" aria-hidden />
            </button>
          </span>
        ) : null}

        {recipientEmails.map((email) => (
          <span key={email} className={styles.recipientChip}>
            <span className="wm-mail" aria-hidden />
            <span className={styles.chipLabel}>{email}</span>
            <button
              type="button"
              className={styles.chipRemoveBtn}
              aria-label={`Remove ${email}`}
              onClick={() => removeEmail(email)}
            >
              <span className="wm-close" aria-hidden />
            </button>
          </span>
        ))}

        <input
          type="email"
          className={styles.recipientsInput}
          value={emailDraft}
          onChange={(event) => setEmailDraft(event.target.value)}
          onKeyDown={handleEmailDraftKeyDown}
          onBlur={addEmailFromDraft}
          placeholder={
            hasRecipients ? 'Add another email' : 'Enter email addresses or select a list'
          }
          aria-label="Add recipient email address"
        />
      </div>

      <div className={styles.recipientsListPicker}>
        <WuSelect
          data={MOCK_EMAIL_LISTS}
          accessorKey={{ value: 'value', label: 'label' }}
          value={selectedList}
          onSelect={handleListSelect}
          placeholder="Select List"
          variant="outlined"
        />
      </div>
    </div>
  );
}
