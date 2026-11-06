'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableScrollWrap } from '@/components/ui/TableScrollWrap';
import { contactHubPath } from '@/components/contacts/contactHubPaths';
import { usePersistedState } from '@/hooks/usePersistedState';
import {
  CONTACT_HUB_STORAGE_KEY,
  EMPTY_CONTACT_HUB,
  SUPPRESSION_REASON_LABEL,
  contactDisplayName,
  formatContactDate,
  type ContactRecord,
  type SuppressionReason,
} from '@/data/mock-contact-hub';
import styles from './ContactHub.module.css';

const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })),
  { ssr: false },
);
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false },
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false },
);

type ReasonFilter = 'all' | SuppressionReason;

export function ContactSuppressionPage() {
  const params = useParams();
  const surveyId = Number(params.id);
  const { showToast } = useWuShowToast();
  const [hub, setHub] = usePersistedState(CONTACT_HUB_STORAGE_KEY, EMPTY_CONTACT_HUB);
  const [reasonFilter, setReasonFilter] = useState<ReasonFilter>('all');
  const [search, setSearch] = useState('');

  const suppressed = useMemo(
    () => hub.contacts.filter((contact) => Boolean(contact.suppression)),
    [hub.contacts],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return suppressed.filter((contact) => {
      if (reasonFilter !== 'all' && contact.suppression?.reason !== reasonFilter) return false;
      if (!query) return true;
      return (
        contactDisplayName(contact).toLowerCase().includes(query) ||
        (contact.email ?? '').toLowerCase().includes(query)
      );
    });
  }, [suppressed, reasonFilter, search]);

  function liftSuppression(contact: ContactRecord) {
    setHub((current) => ({
      ...current,
      contacts: current.contacts.map((item) => {
        if (item.id !== contact.id) return item;
        return {
          ...item,
          suppression: undefined,
          status: item.status === 'suppressed' || item.status === 'unsubscribed' ? 'active' : item.status,
          consent: {
            ...item.consent,
            emailSubscribed: true,
            unsubscribedAt: undefined,
          },
          audit: [
            {
              id: `au-${Date.now()}`,
              label: 'Suppression lifted',
              at: new Date().toISOString(),
              actor: 'Admin',
            },
            ...item.audit,
          ],
        };
      }),
    }));
    showToast({
      message: `Suppression lifted for ${contactDisplayName(contact)}.`,
      variant: 'success',
    });
  }

  const columns: IWuTableColumnDef<ContactRecord>[] = [
    {
      accessorKey: 'firstName',
      header: 'Contact',
      cell: ({ row }) => (
        <Link
          href={contactHubPath(surveyId, 'contact', row.original.id)}
          className={styles.linkBtn}
        >
          {contactDisplayName(row.original)}
        </Link>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => row.original.email ?? '—',
    },
    {
      accessorKey: 'status',
      header: 'Reason',
      cell: ({ row }) =>
        row.original.suppression
          ? SUPPRESSION_REASON_LABEL[row.original.suppression.reason]
          : '—',
    },
    {
      accessorKey: 'lastUpdated',
      header: 'Suppressed on',
      cell: ({ row }) =>
        row.original.suppression ? formatContactDate(row.original.suppression.at) : '—',
    },
    {
      accessorKey: 'id',
      header: 'Detail',
      cell: ({ row }) => row.original.suppression?.note ?? '—',
    },
    {
      accessorKey: 'organization',
      header: '',
      cell: ({ row }) => (
        <WuButton
          type="button"
          variant="secondary"
          onClick={() => liftSuppression(row.original)}
        >
          Lift suppression
        </WuButton>
      ),
    },
  ];

  const reasonPills: { id: ReasonFilter; label: string }[] = [
    { id: 'all', label: `All ${suppressed.length}` },
    { id: 'unsubscribed', label: 'Unsubscribed' },
    { id: 'hard-bounce', label: 'Hard bounce' },
    { id: 'manual', label: 'Manual' },
    { id: 'invalid-email', label: 'Invalid email' },
    { id: 'organization-block', label: 'Org block' },
  ];

  return (
    <>
      <p className={styles.meta}>
        Suppression is enforced across all eligible distributions. Group or list selection cannot
        override a global suppression.
      </p>
      <div className={styles.toolbar}>
        <div className={styles.filters}>
          {reasonPills.map((pill) => (
            <button
              key={pill.id}
              type="button"
              className={reasonFilter === pill.id ? styles.pillOn : styles.pill}
              onClick={() => setReasonFilter(pill.id)}
            >
              {pill.label}
            </button>
          ))}
        </div>
        <div className={styles.searchWrap}>
          <WuInput
            type="search"
            variant="outlined"
            placeholder="Search suppressed contacts"
            aria-label="Search suppressed contacts"
            Icon={<span className="wm-search" aria-hidden />}
            iconPosition="left"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>
      <TableScrollWrap className={styles.tableWrap}>
        <WuTable
          data={filtered as unknown[]}
          columns={columns as unknown as IWuTableColumnDef<unknown>[]}
          variant="unstyled"
          sort={{ enabled: true }}
          NoDataContent={
            <EmptyState
              icon="wm-block"
              title="No suppressed contacts"
              description="Unsubscribes, bounces, and manual blocks appear here."
            />
          }
        />
      </TableScrollWrap>
    </>
  );
}
