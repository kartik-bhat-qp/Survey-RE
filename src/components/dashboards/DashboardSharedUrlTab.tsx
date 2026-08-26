'use client';

import { useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { CreateSharedLinkForm } from './CreateSharedLinkForm';
import { SharedUrlLicenseUpsellModal } from './SharedUrlLicenseUpsellModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { SHARED_URL_LICENSE_LIMIT, SHARED_URL_UPSELL, sharedDashboardPath, type SharedLinkCreateDraft, type SharedUrlLink } from '@/data/mock-shared-urls';
import { formatShortDate } from '@/data/mock-utils';
import { useBiLicenseRestrictions } from '@/hooks/useBiLicenseRestrictions';
import styles from './DashboardSharedUrlTab.module.css';

const WuTable = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })), { ssr: false });
const WuButton = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })), { ssr: false });
const WuInput = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })), { ssr: false });
const WuToggle = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })), { ssr: false });
const WuPopover = dynamic(() => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuPopover })), { ssr: false });

interface Props {
  dashboardId: number;
  dashboardName: string;
  links: SharedUrlLink[];
  onLinksChange: (links: SharedUrlLink[]) => void;
}

export function DashboardSharedUrlTab({ dashboardId, dashboardName, links, onLinksChange }: Props) {
  const { showToast } = useWuShowToast();
  const restricted = useBiLicenseRestrictions();
  const [search, setSearch] = useState('');
  const [upsellOpen, setUpsellOpen] = useState(false);
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [editingLink, setEditingLink] = useState<SharedUrlLink | null>(null);
  const [deletingLink, setDeletingLink] = useState<SharedUrlLink | null>(null);
  const atLinkLimit = restricted && links.length >= SHARED_URL_LICENSE_LIMIT;
  const filteredLinks = links.filter((link) => link.name.toLowerCase().includes(search.trim().toLowerCase()));

  function cancelForm() { setEditingLink(null); setView('list'); }

  function saveLink(draft: SharedLinkCreateDraft) {
    if (editingLink) {
      onLinksChange(links.map((link) => link.id === editingLink.id ? { ...link, name: draft.name, settings: draft } : link));
    } else {
      if (atLinkLimit) { setUpsellOpen(true); return; }
      const id = Date.now();
      onLinksChange([...links, {
        id, name: draft.name,
        url: new URL(sharedDashboardPath(dashboardId, id), window.location.origin).href,
        createdAt: new Date().toISOString(), status: true, settings: draft,
      }]);
    }
    showToast({ message: `Shared link '${draft.name}' ${editingLink ? 'updated' : 'created'}`, variant: 'success' });
    setSearch('');
    cancelForm();
  }

  const copyUrl = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      showToast({ message: 'Link copied to clipboard', variant: 'success' });
    } catch { showToast({ message: 'Could not copy link', variant: 'error' }); }
  }, [showToast]);

  const columns: IWuTableColumnDef<SharedUrlLink>[] = useMemo(() => [
    { accessorKey: 'name', header: 'Name', cell: ({ row }) => <span className={styles.linkName}>{row.original.name}</span> },
    { accessorKey: 'url', header: 'Link', cell: ({ row }) => <div className={styles.shareUrlCell}>
      <span className={`wm-link ${styles.linkIcon}`} aria-hidden />
      <a href={row.original.url} target="_blank" rel="noreferrer" title={row.original.url} className={styles.urlText}>{row.original.url}</a>
      <button type="button" className={styles.copyBtn} aria-label={`Copy ${row.original.name} link`} onClick={() => void copyUrl(row.original.url)}>
        <span className="wm-content-copy" aria-hidden />
      </button>
    </div> },
    { accessorKey: 'createdAt', header: 'Created on', enableSorting: true, cell: ({ row }) => formatShortDate(row.original.createdAt) },
    { accessorKey: 'status', header: 'Status', headerAlign: 'center', cellAlign: 'center', cell: ({ row }) => <div className={styles.statusCell}>
      <WuToggle checked={row.original.status} aria-label={`Toggle status for ${row.original.name}`}
        onChange={(checked) => onLinksChange(links.map((link) => link.id === row.original.id ? { ...link, status: checked } : link))} />
    </div> },
    { id: 'linkActions', accessorKey: 'id', header: 'Actions', headerAlign: 'center', cellAlign: 'center', cell: ({ row }) => <div className={styles.rowActions}>
      <WuButton variant="iconOnly" size="sm" aria-label={`Edit ${row.original.name}`} Icon={<span className="wm-edit" />}
        onClick={() => { setEditingLink(row.original); setView('edit'); }} />
      <WuButton variant="iconOnly" size="sm" aria-label={`Delete ${row.original.name}`} Icon={<span className="wm-delete" />}
        onClick={() => setDeletingLink(row.original)} />
    </div> },
  ], [copyUrl, links, onLinksChange]);

  return <div className={`${styles.panel} dashboard-settings-shared-url-panel`}>
    {view !== 'list' ? <CreateSharedLinkForm key={editingLink?.id ?? 'new'} dashboardName={dashboardName} initialDraft={editingLink?.settings}
      onCancel={cancelForm} onCreate={saveLink} /> : <>
      <div className={styles.toolbarRow}>
        <div className={styles.createActions}>
          <WuButton Icon={<span className="wm-add" />} onClick={() => atLinkLimit ? setUpsellOpen(true) : setView('create')}>Create</WuButton>
          <WuPopover side="bottom" align="start" Trigger={<WuButton variant="iconOnly" aria-label="About shared links" className={styles.helpButton} Icon={<span className="wm-help" />} />}>
            <p className={styles.helpText}>Create additional sharing profiles with their own titles, saved filters, and viewer permissions.</p>
          </WuPopover>
        </div>
        <div className={styles.searchWrap}>
          <WuInput aria-label="Search by link name" variant="flat" placeholder="Search by link name..." Icon={<span className="wm-search" />} iconPosition="left"
            value={search} onInput={(event) => setSearch(event.currentTarget.value)} />
        </div>
      </div>
      {atLinkLimit && <div className={styles.upsellBanner}>
        <p>You&apos;re using all {SHARED_URL_LICENSE_LIMIT} shared links on your current plan.</p>
        <WuButton variant="secondary" size="sm" onClick={() => setUpsellOpen(true)}>{SHARED_URL_UPSELL.primaryCta}</WuButton>
      </div>}
      <div className={styles.tableWrap}>
        <WuTable data={filteredLinks as unknown[]} columns={columns as unknown as IWuTableColumnDef<unknown>[]} variant="unstyled"
          sort={{ enabled: true }} NoDataContent={<div className={styles.noData}>No data to display</div>} />
      </div>
    </>}
    <ConfirmModal open={!!deletingLink} onOpenChange={(open) => { if (!open) setDeletingLink(null); }} title="Delete shared link"
      description={`Delete '${deletingLink?.name ?? ''}'? Its shared dashboard will no longer be available.`} confirmLabel="Delete" variant="critical"
      onConfirm={() => onLinksChange(links.filter((link) => link.id !== deletingLink?.id))} />
    <SharedUrlLicenseUpsellModal open={upsellOpen} onOpenChange={setUpsellOpen}
      onExplore={() => { setUpsellOpen(false); showToast({ message: SHARED_URL_UPSELL.exploreToast, variant: 'success' }); }} />
  </div>;
}
