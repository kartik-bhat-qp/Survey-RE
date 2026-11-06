'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableScrollWrap } from '@/components/ui/TableScrollWrap';
import { contactHubPath } from '@/components/contacts/contactHubPaths';
import { useContactHubSession } from '@/hooks/useContactHubSession';
import {
  CONTACT_ACCESS_SCOPE_LABEL,
  userById,
} from '@/data/mock-contact-hub-access';
import {
  CONTACT_STATUS_LABEL,
  contactDisplayName,
  contactOwnership,
  formatContactDate,
  formatContactRelative,
  groupNameMap,
  type ContactRecord,
  type ContactStatus,
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
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false },
);

type StatusFilter = 'all' | ContactStatus;

const STATUS_CLASS: Record<ContactStatus, string> = {
  active: styles.statusActive,
  unsubscribed: styles.statusUnsubscribed,
  bounced: styles.statusBounced,
  suppressed: styles.statusSuppressed,
  invalid: styles.statusInvalid,
};

export function ContactDirectory() {
  const params = useParams();
  const router = useRouter();
  const surveyId = Number(params.id);
  const { showToast } = useWuShowToast();
  const { hub, setHub, visibleContacts, visibleGroups, can } = useContactHubSession();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [countryFilter, setCountryFilter] = useState<{ value: string; label: string } | null>(
    null,
  );
  const [groupFilter, setGroupFilter] = useState<{ value: string; label: string } | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const names = groupNameMap(visibleGroups);

  const countries = useMemo(
    () =>
      [...new Set(visibleContacts.map((contact) => contact.country))]
        .sort()
        .map((country) => ({ value: country, label: country })),
    [visibleContacts],
  );

  const groupOptions = useMemo(
    () => visibleGroups.map((group) => ({ value: group.id, label: group.name })),
    [visibleGroups],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return visibleContacts.filter((contact) => {
      if (statusFilter !== 'all' && contact.status !== statusFilter) return false;
      if (countryFilter && contact.country !== countryFilter.value) return false;
      if (groupFilter && !contact.groupIds.includes(groupFilter.value)) return false;
      if (!query) return true;
      const haystack = [
        contactDisplayName(contact),
        contact.email ?? '',
        contact.phone ?? '',
        contact.organization ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [visibleContacts, search, statusFilter, countryFilter, groupFilter]);

  const selectedIds = Object.entries(selected)
    .filter(([, on]) => on)
    .map(([id]) => id);

  function toggleAll(checked: boolean) {
    if (!checked) {
      setSelected({});
      return;
    }
    setSelected(Object.fromEntries(filtered.map((contact) => [contact.id, true])));
  }

  function removeSelected() {
    if (!can('contacts.delete')) {
      showToast({ message: 'Your role cannot delete contacts.', variant: 'error' });
      return;
    }
    setHub((current) => ({
      ...current,
      contacts: current.contacts.filter((contact) => !selectedIds.includes(contact.id)),
    }));
    setSelected({});
    setConfirmDelete(false);
    showToast({
      message: `Deleted ${selectedIds.length} contact${selectedIds.length === 1 ? '' : 's'}.`,
      variant: 'success',
    });
  }

  function addSelectedToGroup() {
    if (!can('contacts.edit') && !can('groups.edit')) {
      showToast({ message: 'Your role cannot change group membership.', variant: 'error' });
      return;
    }
    if (!groupFilter) {
      showToast({ message: 'Choose a group filter first, then add selection to that group.', variant: 'info' });
      return;
    }
    setHub((current) => ({
      ...current,
      contacts: current.contacts.map((contact) => {
        if (!selectedIds.includes(contact.id) || contact.groupIds.includes(groupFilter.value)) {
          return contact;
        }
        return {
          ...contact,
          groupIds: [...contact.groupIds, groupFilter.value],
          memberships: [
            ...contact.memberships,
            {
              groupId: groupFilter.value,
              source: 'manual' as const,
              addedAt: new Date().toISOString(),
            },
          ],
        };
      }),
    }));
    showToast({
      message: `Added ${selectedIds.length} contact${selectedIds.length === 1 ? '' : 's'} to ${groupFilter.label}.`,
      variant: 'success',
    });
  }

  function removeSelectedFromGroup() {
    if (!groupFilter) {
      showToast({ message: 'Choose a group filter first.', variant: 'info' });
      return;
    }
    setHub((current) => ({
      ...current,
      contacts: current.contacts.map((contact) => {
        if (!selectedIds.includes(contact.id)) return contact;
        return {
          ...contact,
          groupIds: contact.groupIds.filter((id) => id !== groupFilter.value),
          memberships: contact.memberships.filter((item) => item.groupId !== groupFilter.value),
        };
      }),
    }));
    showToast({
      message: `Removed ${selectedIds.length} contact${selectedIds.length === 1 ? '' : 's'} from ${groupFilter.label}.`,
      variant: 'success',
    });
  }

  const columns: IWuTableColumnDef<ContactRecord>[] = [
    {
      accessorKey: 'id',
      header: '',
      cell: ({ row }) => (
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={Boolean(selected[row.original.id])}
          aria-label={`Select ${contactDisplayName(row.original)}`}
          onChange={(event) =>
            setSelected((current) => ({
              ...current,
              [row.original.id]: event.target.checked,
            }))
          }
        />
      ),
    },
    {
      accessorKey: 'firstName',
      header: 'Name',
      enableSorting: true,
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
      enableSorting: true,
      cell: ({ row }) => row.original.email ?? '—',
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => row.original.phone ?? '—',
    },
    {
      accessorKey: 'organization',
      header: 'Organization',
      enableSorting: true,
      cell: ({ row }) => row.original.organization ?? '—',
    },
    {
      accessorKey: 'country',
      header: 'Country',
      enableSorting: true,
    },
    {
      accessorKey: 'groupIds',
      header: 'Contact Groups',
      cell: ({ row }) =>
        row.original.groupIds.map((id) => names[id] ?? id).join(', ') || '—',
    },
    {
      accessorKey: 'status',
      header: 'Contact Status',
      enableSorting: true,
      cell: ({ row }) => (
        <span className={`${styles.status} ${STATUS_CLASS[row.original.status]}`}>
          {CONTACT_STATUS_LABEL[row.original.status]}
        </span>
      ),
    },
    {
      accessorKey: 'dateAdded',
      header: 'Date Added',
      enableSorting: true,
      cell: ({ row }) => formatContactDate(row.original.dateAdded),
    },
    {
      accessorKey: 'lastActivity',
      header: 'Last Activity',
      enableSorting: true,
      cell: ({ row }) => formatContactRelative(row.original.lastActivity),
    },
    {
      accessorKey: 'ownership',
      header: 'Created By',
      cell: ({ row }) => {
        const meta = contactOwnership(row.original);
        return userById(meta.createdBy)?.name ?? meta.createdBy;
      },
    },
    {
      accessorKey: 'organizationIdentity',
      header: 'Access Scope',
      cell: ({ row }) => {
        const meta = contactOwnership(row.original);
        return CONTACT_ACCESS_SCOPE_LABEL[meta.accessScope];
      },
    },
  ];

  const statusPills: { id: StatusFilter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: visibleContacts.length },
    {
      id: 'active',
      label: 'Active',
      count: visibleContacts.filter((c) => c.status === 'active').length,
    },
    {
      id: 'unsubscribed',
      label: 'Unsubscribed',
      count: visibleContacts.filter((c) => c.status === 'unsubscribed').length,
    },
    {
      id: 'bounced',
      label: 'Bounced',
      count: visibleContacts.filter((c) => c.status === 'bounced').length,
    },
    {
      id: 'suppressed',
      label: 'Suppressed',
      count: visibleContacts.filter((c) => c.status === 'suppressed').length,
    },
  ];

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          {can('contacts.import') ? (
            <WuButton
              type="button"
              Icon={<span className="wm-upload" aria-hidden />}
              onClick={() => router.push(contactHubPath(surveyId, 'import'))}
            >
              Import contacts
            </WuButton>
          ) : null}
          {can('contacts.export') ? (
            <WuButton
              type="button"
              variant="secondary"
              onClick={() =>
                showToast({
                  message:
                    selectedIds.length > 0
                      ? `Export started for ${selectedIds.length} contact${selectedIds.length === 1 ? '' : 's'}.`
                      : 'Export started for all filtered contacts.',
                  variant: 'success',
                })
              }
            >
              Export
            </WuButton>
          ) : null}
        </div>
        <div className={styles.toolbarRight}>
          <div className={styles.searchWrap}>
            <WuInput
              type="search"
              variant="outlined"
              placeholder="Search name, email, phone, org"
              aria-label="Search contacts"
              Icon={<span className="wm-search" aria-hidden />}
              iconPosition="left"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          {statusPills.map((pill) => (
            <button
              key={pill.id}
              type="button"
              className={statusFilter === pill.id ? styles.pillOn : styles.pill}
              onClick={() => setStatusFilter(pill.id)}
            >
              {pill.label} {pill.count}
            </button>
          ))}
        </div>
        <div className={styles.toolbarRight}>
          <WuSelect
            data={countries}
            accessorKey={{ value: 'value', label: 'label' }}
            value={countryFilter}
            onSelect={(item) =>
              setCountryFilter((item as { value: string; label: string } | null) ?? null)
            }
            placeholder="Country"
            variant="outlined"
          />
          <WuSelect
            data={groupOptions}
            accessorKey={{ value: 'value', label: 'label' }}
            value={groupFilter}
            onSelect={(item) =>
              setGroupFilter((item as { value: string; label: string } | null) ?? null)
            }
            placeholder="Group"
            variant="outlined"
          />
        </div>
      </div>

      {selectedIds.length > 0 ? (
        <div className={styles.bulkBar}>
          <span>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={filtered.length > 0 && selectedIds.length === filtered.length}
              onChange={(event) => toggleAll(event.target.checked)}
              aria-label="Select all filtered contacts"
            />{' '}
            {selectedIds.length} selected
          </span>
          <div className={styles.toolbarRight}>
            <WuButton type="button" variant="secondary" onClick={addSelectedToGroup}>
              Add to group
            </WuButton>
            <WuButton type="button" variant="secondary" onClick={removeSelectedFromGroup}>
              Remove from group
            </WuButton>
            {can('contacts.edit') ? (
              <WuButton
                type="button"
                variant="secondary"
                onClick={() =>
                  showToast({
                    message: 'Bulk edit opened for selected contacts.',
                    variant: 'info',
                  })
                }
              >
                Bulk edit
              </WuButton>
            ) : null}
            {can('contacts.delete') ? (
              <WuButton type="button" variant="secondary" onClick={() => setConfirmDelete(true)}>
                Delete
              </WuButton>
            ) : null}
          </div>
        </div>
      ) : null}

      <TableScrollWrap className={styles.tableWrap}>
        <WuTable
          data={filtered as unknown[]}
          columns={columns as unknown as IWuTableColumnDef<unknown>[]}
          variant="unstyled"
          sort={{ enabled: true }}
          NoDataContent={
            <EmptyState
              icon="wm-contact-mail"
              title={visibleContacts.length === 0 ? 'No contacts in your scope' : 'No contacts found'}
              description={
                visibleContacts.length === 0
                  ? 'No organization contacts are visible for your role and team membership.'
                  : 'Try a different search or filter.'
              }
            />
          }
        />
      </TableScrollWrap>

      <ConfirmModal
        open={confirmDelete}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(false);
        }}
        title="Delete contacts?"
        description="Selected contacts will be removed from the organization directory."
        confirmLabel="Delete"
        variant="critical"
        onConfirm={removeSelected}
      />
    </>
  );
}
