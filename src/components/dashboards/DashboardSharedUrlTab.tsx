'use client';

import { useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { EmptyState } from '@/components/ui/EmptyState';
import { SharedUrlLicenseUpsellModal } from '@/components/dashboards/SharedUrlLicenseUpsellModal';
import {
  MOCK_SHARED_URLS,
  SHARED_URL_LICENSE_LIMIT,
  SHARED_URL_UPSELL,
  type SharedUrlLink,
} from '@/data/mock-shared-urls';
import { formatShortDate, truncate } from '@/data/mock-utils';
import styles from './DashboardSharedUrlTab.module.css';

const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })),
  { ssr: false }
);
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false }
);

const URL_DISPLAY_MAX = 36;

export function DashboardSharedUrlTab() {
  const { showToast } = useWuShowToast();
  const [links, setLinks] = useState<SharedUrlLink[]>(MOCK_SHARED_URLS);
  const [search, setSearch] = useState('');
  const [upsellOpen, setUpsellOpen] = useState(false);

  const atLinkLimit = links.length >= SHARED_URL_LICENSE_LIMIT;

  const filteredLinks = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return links;
    return links.filter((link) => link.name.toLowerCase().includes(term));
  }, [links, search]);

  const visibleLinks = useMemo(
    () => filteredLinks.slice(0, SHARED_URL_LICENSE_LIMIT),
    [filteredLinks]
  );

  const handleCreate = useCallback(() => {
    if (atLinkLimit) {
      setUpsellOpen(true);
      return;
    }

    const nextId = links.reduce((max, link) => Math.max(max, link.id), 0) + 1;
    const newLink: SharedUrlLink = {
      id: nextId,
      name: `Shared link ${nextId}`,
      url: `https://bi.questionpro.com/sd/${crypto.randomUUID()}`,
      createdAt: new Date().toISOString().slice(0, 10),
      status: true,
    };

    setLinks((prev) => [...prev, newLink]);
    showToast({ message: 'Shared link created', variant: 'success' });
  }, [atLinkLimit, links, showToast]);

  const handleExploreBi = useCallback(() => {
    setUpsellOpen(false);
    showToast({ message: SHARED_URL_UPSELL.exploreToast, variant: 'success' });
  }, [showToast]);

  const handleCopyUrl = useCallback(
    async (url: string) => {
      try {
        await navigator.clipboard.writeText(url);
        showToast({ message: 'Link copied to clipboard', variant: 'success' });
      } catch {
        showToast({ message: 'Could not copy link', variant: 'error' });
      }
    },
    [showToast]
  );

  const columns: IWuTableColumnDef<SharedUrlLink>[] = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <span className={styles.linkName}>{row.original.name}</span>
        ),
      },
      {
        id: 'shareUrl',
        accessorKey: 'url',
        header: 'Share URL',
        cell: ({ row }) => {
          const { url } = row.original;
          const displayUrl = truncate(url, URL_DISPLAY_MAX);
          return (
            <div className={styles.shareUrlCell}>
              <span className={`wm-link ${styles.linkIcon}`} aria-hidden />
              <span className={styles.urlText} title={url}>
                {displayUrl}
              </span>
              <button
                type="button"
                className={styles.copyBtn}
                aria-label="Copy link"
                onClick={() => void handleCopyUrl(url)}
              >
                <span className="wm-content-copy" aria-hidden />
              </button>
            </div>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Created on',
        enableSorting: true,
        cell: ({ row }) => formatShortDate(row.original.createdAt),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        headerAlign: 'center',
        cellAlign: 'center',
        cell: ({ row }) => (
          <div className={styles.statusCell}>
            <WuToggle
              checked={row.original.status}
              onChange={(checked) => {
                setLinks((prev) =>
                  prev.map((link) =>
                    link.id === row.original.id ? { ...link, status: checked } : link
                  )
                );
                showToast({
                  message: checked
                    ? `'${row.original.name}' is now active`
                    : `'${row.original.name}' is now inactive`,
                  variant: 'success',
                });
              }}
              aria-label={`Toggle status for ${row.original.name}`}
            />
          </div>
        ),
      },
      {
        id: 'actions',
        accessorKey: 'id',
        header: 'Actions',
        headerAlign: 'center',
        cellAlign: 'center',
        cell: ({ row }) => (
          <div className={styles.rowActions}>
            <WuButton
              variant="iconOnly"
              size="sm"
              aria-label={`Edit ${row.original.name}`}
              Icon={<span className="wm-edit" />}
              onClick={() =>
                showToast({
                  message: `Edit '${row.original.name}'`,
                  variant: 'success',
                })
              }
            />
            <WuButton
              variant="iconOnly"
              size="sm"
              aria-label={`Delete ${row.original.name}`}
              Icon={<span className="wm-delete" />}
              onClick={() =>
                showToast({
                  message: `Delete '${row.original.name}'`,
                  variant: 'success',
                })
              }
            />
          </div>
        ),
      },
    ],
    [handleCopyUrl, showToast]
  );

  return (
    <div className={`${styles.panel} dashboard-settings-shared-url-panel`}>
      <div className={styles.toolbarRow}>
        <WuButton Icon={<span className="wm-add" />} onClick={handleCreate}>
          Create
        </WuButton>
        <div className={styles.searchWrap}>
          <WuInput
            variant="outlined"
            placeholder="Search by link name..."
            Icon={<span className="wm-search" />}
            iconPosition="left"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {atLinkLimit ? (
        <div className={styles.upsellBanner}>
          <div className={styles.upsellCopy}>
            <span className={`wm-diamond ${styles.upsellIcon}`} aria-hidden />
            <div>
              <p className={styles.upsellTitle}>{SHARED_URL_UPSELL.title}</p>
              <p className={styles.upsellText}>
                You&apos;re using all {SHARED_URL_LICENSE_LIMIT} shared links on your current plan.
                Upgrade to BI for unlimited external sharing.
              </p>
            </div>
          </div>
          <WuButton variant="secondary" size="sm" onClick={() => setUpsellOpen(true)}>
            {SHARED_URL_UPSELL.primaryCta}
          </WuButton>
        </div>
      ) : null}

      <div className={styles.tableWrap}>
        <WuTable
          data={visibleLinks as unknown[]}
          columns={columns as unknown as IWuTableColumnDef<unknown>[]}
          variant="striped"
          sort={{ enabled: true }}
          filterText=""
          NoDataContent={
            <EmptyState
              icon="wm-search-off"
              title="No shared links found"
              description={
                search.trim()
                  ? 'Try adjusting your search'
                  : 'Create a link to share this dashboard externally'
              }
              action={
                !search.trim() ? (
                  <WuButton Icon={<span className="wm-add" />} onClick={handleCreate}>
                    Create
                  </WuButton>
                ) : undefined
              }
            />
          }
        />
      </div>

      <SharedUrlLicenseUpsellModal
        open={upsellOpen}
        onOpenChange={setUpsellOpen}
        onExplore={handleExploreBi}
      />
    </div>
  );
}
