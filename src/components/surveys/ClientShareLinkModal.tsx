'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import type { AdvanceQuota } from '@/data/mock-advance-quotas';
import {
  buildAdvanceQuotaClientShareUrl,
  resolveClientShareVisibleIds,
  toClientShareVisibleStorage,
  type ClientShareVisibleQuotaIds,
} from '@/data/mock-advance-quota-share';
import styles from './ClientShareLinkModal.module.css';

const WuCheckbox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCheckbox })),
  { ssr: false }
);

export interface ClientShareLinkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyId: number;
  quotas: ReadonlyArray<AdvanceQuota>;
  visibleIds: ClientShareVisibleQuotaIds;
  onSaveVisibleIds: (visibleIds: ClientShareVisibleQuotaIds) => void;
}

export function ClientShareLinkModal({
  open,
  onOpenChange,
  surveyId,
  quotas,
  visibleIds,
  onSaveVisibleIds,
}: ClientShareLinkModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [draftIds, setDraftIds] = useState<Set<string>>(() => new Set());

  const shareUrl = useMemo(
    () => buildAdvanceQuotaClientShareUrl(surveyId),
    [surveyId]
  );

  useEffect(() => {
    if (!open) return;
    setDraftIds(new Set(resolveClientShareVisibleIds(quotas, visibleIds)));
  }, [open, quotas, visibleIds]);

  const selectedCount = draftIds.size;
  const allSelected = quotas.length > 0 && selectedCount === quotas.length;

  function toggleQuota(quotaId: string, checked: boolean): void {
    setDraftIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(quotaId);
      else next.delete(quotaId);
      return next;
    });
  }

  function selectAll(): void {
    setDraftIds(new Set(quotas.map((quota) => quota.id)));
  }

  function deselectAll(): void {
    setDraftIds(new Set());
  }

  function handleSave(): void {
    if (draftIds.size === 0) {
      showToast({
        message: 'Select at least one quota for the client dashboard',
        variant: 'error',
      });
      return;
    }
    const next = toClientShareVisibleStorage(quotas, [...draftIds]);
    onSaveVisibleIds(next);
    showToast({ message: 'Client link settings saved', variant: 'success' });
    onOpenChange(false);
  }

  async function handleCopyLink(): Promise<void> {
    if (draftIds.size === 0) {
      showToast({
        message: 'Select at least one quota before copying the link',
        variant: 'error',
      });
      return;
    }
    const next = toClientShareVisibleStorage(quotas, [...draftIds]);
    onSaveVisibleIds(next);
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast({ message: 'Client share link copied to clipboard', variant: 'success' });
    } catch {
      showToast({ message: 'Could not copy link', variant: 'error' });
    }
  }

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuModalClose, WuButton } =
    wick;

  return (
    <WuModal open onOpenChange={onOpenChange} size="md">
      <WuModalHeader>
        <span className={styles.modalTitleRow}>
          <span>Client link</span>
          <span className={styles.comingSoonBadge}>Coming soon</span>
        </span>
      </WuModalHeader>
      <WuModalContent>
        <p className={styles.intro}>
          Choose which quotas appear on the shared client dashboard. Clients cannot add or
          edit quotas from this link.
        </p>
        <div className={styles.toolbar}>
          <span className={styles.selectionSummary}>
            {selectedCount} of {quotas.length} selected
          </span>
          <div className={styles.toolbarActions}>
            <button type="button" className={styles.linkBtn} onClick={selectAll}>
              Select all
            </button>
            <button type="button" className={styles.linkBtn} onClick={deselectAll}>
              Deselect all
            </button>
          </div>
        </div>
        {quotas.length === 0 ? (
          <p className={styles.emptyList}>No quotas on this dashboard yet.</p>
        ) : (
          <ul className={styles.list}>
            {quotas.map((quota) => {
              const checked = draftIds.has(quota.id);
              return (
                <li key={quota.id} className={styles.listItem}>
                  <label className={styles.row}>
                    <WuCheckbox
                      checked={checked}
                      onChange={(value) => toggleQuota(quota.id, value)}
                      aria-label={`Show ${quota.name} on client link`}
                    />
                    <span className={styles.rowLabel}>
                      <span className={styles.quotaName}>{quota.name}</span>
                      <span className={styles.quotaMeta}>
                        {quota.quotaType}
                        {quota.quotaGroup !== 'NA' ? ` · ${quota.quotaGroup}` : ''}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
        <div className={styles.shareUrlBlock}>
          <span className={styles.shareUrlLabel}>Share URL</span>
          <div className={styles.shareUrlRow}>
            <input
              type="text"
              className={styles.shareUrlInput}
              value={shareUrl}
              readOnly
              aria-label="Client share URL"
            />
            <WuButton
              size="sm"
              variant="secondary"
              onClick={() => void handleCopyLink()}
              disabled={quotas.length === 0}
            >
              Copy link
            </WuButton>
          </div>
        </div>
        {allSelected && quotas.length > 0 ? (
          <p className={styles.intro} style={{ marginBottom: 0, marginTop: '0.75rem' }}>
            All quotas are selected — the client dashboard will match this view.
          </p>
        ) : null}
      </WuModalContent>
      <WuModalFooter>
        <WuModalClose variant="secondary">Cancel</WuModalClose>
        <WuButton variant="secondary" onClick={handleSave} disabled={quotas.length === 0}>
          Save
        </WuButton>
      </WuModalFooter>
    </WuModal>
  );
}
