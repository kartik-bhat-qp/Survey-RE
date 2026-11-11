'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { usePersistedState } from '@/hooks/usePersistedState';
import {
  CONTACT_HUB_STORAGE_KEY,
  EMPTY_CONTACT_HUB,
  estimateRecipients,
} from '@/data/mock-contact-hub';
import {
  CONTACT_LISTS_STORAGE_KEY,
  INITIAL_CONTACT_LISTS,
  isContactListAvailableForSurvey,
  isValidEmailAddress,
  normalizeContactList,
  normalizeEmailAddress,
  type ContactList,
  type EmailListOption,
} from '@/data/mock-survey-distribute';
import styles from './ComposeRecipientsField.module.css';

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false },
);

interface ComposeRecipientsFieldProps {
  surveyId: number;
  selectedList: EmailListOption | null;
  onSelectedListChange: (list: EmailListOption | null) => void;
  recipientEmails: string[];
  onRecipientEmailsChange: (emails: string[]) => void;
}

type RecipientSourceOption = EmailListOption & {
  kind: 'all' | 'static' | 'dynamic' | 'list' | 'file';
  sendable?: number;
  suppressed?: number;
};

export function ComposeRecipientsField({
  surveyId,
  selectedList,
  onSelectedListChange,
  recipientEmails,
  onRecipientEmailsChange,
}: ComposeRecipientsFieldProps) {
  const { showToast } = useWuShowToast();
  const [emailDraft, setEmailDraft] = useState('');
  const [hub] = usePersistedState(CONTACT_HUB_STORAGE_KEY, EMPTY_CONTACT_HUB);
  const [lists] = usePersistedState<ContactList[]>(
    CONTACT_LISTS_STORAGE_KEY,
    INITIAL_CONTACT_LISTS,
  );

  const sourceOptions = useMemo<RecipientSourceOption[]>(() => {
    const allEstimate = estimateRecipients(hub.contacts, { type: 'all' });
    const groupOptions = hub.groups.map((group) => {
      const estimate = estimateRecipients(hub.contacts, {
        type: 'group',
        groupId: group.id,
      });
      return {
        value: group.id,
        label: `${group.name} · ${group.type === 'dynamic' ? 'Dynamic' : 'Static'} · ${estimate.sendable.toLocaleString('en-US')} sendable`,
        kind: group.type,
        sendable: estimate.sendable,
        suppressed: estimate.suppressed,
      };
    });
    const availableLists = lists
      .map(normalizeContactList)
      .filter((list) => isContactListAvailableForSurvey(list, surveyId));
    const legacyLists = availableLists.map((list) => ({
      value: list.value,
      label: `${list.label} · ${list.scope === 'survey-specific' ? 'Survey specific' : 'Global'} · ${list.contacts.toLocaleString('en-US')}`,
      kind: 'list' as const,
      sendable: list.contacts,
      suppressed: 0,
    }));
    return [
      {
        value: 'all-contacts',
        label: `All Contacts · ${allEstimate.sendable.toLocaleString('en-US')} sendable`,
        kind: 'all',
        sendable: allEstimate.sendable,
        suppressed: allEstimate.suppressed,
      },
      ...groupOptions,
      ...legacyLists,
      {
        value: 'upload-file',
        label: 'Upload recipient file',
        kind: 'file',
      },
    ];
  }, [hub.contacts, hub.groups, lists, surveyId]);

  const selectedSource =
    sourceOptions.find((option) => option.value === selectedList?.value) ?? null;

  function addEmailFromDraft(): void {
    const normalized = normalizeEmailAddress(emailDraft);
    if (!normalized) return;

    if (!isValidEmailAddress(normalized)) {
      showToast({ message: 'Enter a valid email address', variant: 'error' });
      return;
    }

    const blocked = hub.contacts.find(
      (contact) =>
        contact.email?.toLowerCase() === normalized &&
        (contact.suppression || !contact.consent.emailSubscribed),
    );
    if (blocked) {
      showToast({
        message: 'That contact is suppressed and cannot be added to this distribution.',
        variant: 'error',
      });
      setEmailDraft('');
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
    const option = item as RecipientSourceOption;
    if (option.kind === 'file') {
      showToast({
        message: 'Recipient file selected. Estimated recipients will appear after mapping.',
        variant: 'info',
      });
    } else if (typeof option.sendable === 'number') {
      showToast({
        message: `${option.sendable.toLocaleString('en-US')} sendable recipients. ${option.suppressed?.toLocaleString('en-US') ?? 0} suppressed contacts are excluded.`,
        variant: 'info',
      });
    }
    onSelectedListChange({ value: option.value, label: option.label });
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
            hasRecipients
              ? 'Add another email'
              : 'Enter email addresses or select contacts / groups'
          }
          aria-label="Add recipient email address"
        />
      </div>

      <div className={styles.recipientsListPicker}>
        <WuSelect
          data={sourceOptions}
          accessorKey={{ value: 'value', label: 'label' }}
          value={selectedSource}
          onSelect={handleListSelect}
          placeholder="Select recipients"
          variant="outlined"
        />
      </div>
    </div>
  );
}
