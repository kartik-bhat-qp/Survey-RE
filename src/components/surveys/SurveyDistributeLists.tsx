'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableScrollWrap } from '@/components/ui/TableScrollWrap';
import { usePersistedState } from '@/hooks/usePersistedState';
import {
  CONTACT_LISTS_STORAGE_KEY,
  INITIAL_CONTACT_LISTS,
  type ContactList,
} from '@/data/mock-survey-distribute';
import styles from './SurveyDistributeLists.module.css';

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

export function SurveyDistributeLists() {
  const { showToast } = useWuShowToast();
  const [lists, setLists] = usePersistedState<ContactList[]>(
    CONTACT_LISTS_STORAGE_KEY,
    INITIAL_CONTACT_LISTS
  );
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return lists;
    return lists.filter((list) => list.label.toLowerCase().includes(query));
  }, [lists, search]);

  function createList(): void {
    const label = name.trim();
    if (!label) {
      showToast({ message: 'Enter a list name', variant: 'error' });
      return;
    }
    if (lists.some((list) => list.label.toLowerCase() === label.toLowerCase())) {
      showToast({ message: 'A list with that name already exists', variant: 'error' });
      return;
    }
    const created: ContactList = {
      value: `list-${Date.now()}`,
      label,
      contacts: 0,
      updated: 'Just now',
    };
    setLists((current) => [created, ...current]);
    setName('');
    setCreating(false);
    showToast({ message: `Created “${label}”`, variant: 'success' });
  }

  const columns: IWuTableColumnDef<ContactList>[] = [
    {
      accessorKey: 'label',
      header: 'List name',
      enableSorting: true,
    },
    {
      accessorKey: 'contacts',
      header: 'Contacts',
      enableSorting: true,
      cell: ({ row }) => row.original.contacts.toLocaleString('en-US'),
    },
    {
      accessorKey: 'updated',
      header: 'Updated',
      enableSorting: true,
    },
    {
      accessorKey: 'value',
      header: '',
      cell: ({ row }) => (
        <button
          type="button"
          className={styles.deleteBtn}
          onClick={() => {
            setLists((current) => current.filter((list) => list.value !== row.original.value));
            showToast({ message: `Deleted “${row.original.label}”`, variant: 'success' });
          }}
        >
          Delete
        </button>
      ),
    },
  ];

  return (
    <div className={styles.panel}>
      <div className={styles.intro}>
        <h1 className={styles.title}>Lists</h1>
        <p className={styles.lede}>
          Contact lists are shared across surveys. Choose one when you compose an email.
        </p>
      </div>
      <div className={styles.toolbar}>
        <WuButton
          Icon={<span className="wm-add" aria-hidden />}
          onClick={() => setCreating(true)}
        >
          New list
        </WuButton>
        <div className={styles.searchWrap}>
          <WuInput
            type="search"
            variant="outlined"
            placeholder="Search lists"
            aria-label="Search lists"
            Icon={<span className="wm-search" aria-hidden />}
            iconPosition="left"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>
      {creating ? (
        <form
          className={styles.createRow}
          onSubmit={(event) => {
            event.preventDefault();
            createList();
          }}
        >
          <WuInput
            variant="outlined"
            placeholder="List name"
            aria-label="List name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <WuButton type="button" onClick={createList}>
            Create list
          </WuButton>
          <WuButton
            type="button"
            variant="secondary"
            onClick={() => {
              setCreating(false);
              setName('');
            }}
          >
            Cancel
          </WuButton>
        </form>
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
              title={lists.length === 0 ? 'No lists yet' : 'No lists found'}
              description={
                lists.length === 0
                  ? 'Create a list, then select it when you compose an email.'
                  : 'Try a different search.'
              }
            />
          }
        />
      </TableScrollWrap>
    </div>
  );
}
