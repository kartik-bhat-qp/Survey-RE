'use client';

import { useId, useState } from 'react';
import dynamic from 'next/dynamic';
import { DashboardShareSettingsFields } from './DashboardShareSettingsFields';
import { DEFAULT_SHARED_LINK_CREATE_DRAFT, shareSettingsError, type SharedLinkCreateDraft } from '@/data/mock-shared-urls';
import styles from './CreateSharedLinkForm.module.css';

const WuButton = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })), { ssr: false });
const WuInput = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })), { ssr: false });

interface Props {
  dashboardName: string;
  initialDraft?: SharedLinkCreateDraft;
  onCancel: () => void;
  onCreate: (draft: SharedLinkCreateDraft) => void;
}

export function CreateSharedLinkForm({ dashboardName, initialDraft, onCancel, onCreate }: Props) {
  const id = useId();
  const [draft, setDraft] = useState<SharedLinkCreateDraft>(() => ({ ...(initialDraft ?? DEFAULT_SHARED_LINK_CREATE_DRAFT) }));
  const error = shareSettingsError(draft);
  const valid = draft.name.trim().length > 0 && !error;
  const editing = !!initialDraft;

  return (
    <div className={styles.form}>
      <div className={styles.scrollBody}>
        <button type="button" className={styles.backBtn} onClick={onCancel}>
          <span className="wm-chevron-left" aria-hidden /><span>{editing ? 'Edit link' : 'Create link'}</span>
        </button>
        <DashboardShareSettingsFields dashboardName={dashboardName} settings={draft}
          onChange={(settings) => setDraft((previous) => ({ ...previous, ...settings }))}
          nameField={(
            <div className={styles.field}>
              <label className={styles.label} htmlFor={`${id}-name`}>Name <span className={styles.required}>*</span></label>
              <WuInput id={`${id}-name`} variant="flat" placeholder="e.g. Client Review Dashboard" value={draft.name}
                onInput={(event) => { const name = event.currentTarget.value; setDraft((previous) => ({ ...previous, name })); }} aria-required />
            </div>
          )} />
      </div>
      <div className={styles.footer}>
        {error && <p className={styles.formError} role="status">{error}</p>}
        <WuButton variant="link" onClick={onCancel}>Cancel</WuButton>
        <WuButton disabled={!valid} onClick={() => onCreate({ ...draft, name: draft.name.trim(), shareTitle: draft.shareTitle.trim() })}>
          {editing ? 'Save' : 'Create'}
        </WuButton>
      </div>
    </div>
  );
}
