'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableScrollWrap } from '@/components/ui/TableScrollWrap';
import { usePersistedState } from '@/hooks/usePersistedState';
import {
  CONTACT_LIST_SCOPE_LABELS,
  CONTACT_LISTS_STORAGE_KEY,
  INITIAL_CONTACT_LISTS,
  isContactListAvailableForSurvey,
  normalizeContactList,
  type ContactList,
  type ContactListScope,
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

interface SurveyDistributeListsProps {
  surveyId: number;
}

export function SurveyDistributeLists({ surveyId }: SurveyDistributeListsProps) {
  const { showToast } = useWuShowToast();
  const [lists, setLists] = usePersistedState<ContactList[]>(
    CONTACT_LISTS_STORAGE_KEY,
    INITIAL_CONTACT_LISTS
  );
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [scope, setScope] = useState<ContactListScope>('global');

  const visibleLists = useMemo(
    () =>
      lists
        .map(normalizeContactList)
        .filter((list) => isContactListAvailableForSurvey(list, surveyId)),
    [lists, surveyId]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return visibleLists;
    return visibleLists.filter((list) => list.label.toLowerCase().includes(query));
  }, [visibleLists, search]);

  function resetCreateForm(): void {
    setCreating(false);
    setName('');
    setScope('global');
  }

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
      scope,
      ...(scope === 'survey-specific' ? { surveyId } : {}),
    };
    setLists((current) => [created, ...current]);
    resetCreateForm();
    showToast({
      message:
        scope === 'survey-specific'
          ? `Created “${label}” (survey specific)`
          : `Created “${label}” (global)`,
      variant: 'success',
    });
  }

  const columns: IWuTableColumnDef<ContactList>[] = [
    {
      accessorKey: 'label',
      header: 'List name',
      enableSorting: true,
    },
    {
      accessorKey: 'scope',
      header: 'Scope',
      enableSorting: true,
      cell: ({ row }) =>
        CONTACT_LIST_SCOPE_LABELS[normalizeContactList(row.original).scope],
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
          Global lists work on any survey. Survey specific lists work only in this survey.
          Choose one when you compose an email.
        </p>
      </div>
      <div className={styles.toolbar}>
        <WuButton
          Icon={<span className="wm-add" aria-hidden />}
          onClick={() => {
            setCreating(true);
            setScope('global');
          }}
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
          className={styles.createForm}
          onSubmit={(event) => {
            event.preventDefault();
            createList();
          }}
        >
          <div className={styles.createRow}>
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
            <WuButton type="button" variant="secondary" onClick={resetCreateForm}>
              Cancel
            </WuButton>
          </div>
          <div
            className={styles.scopeGroup}
            role="radiogroup"
            aria-label="List scope"
          >
            <label className={styles.scopeOption}>
              <input
                type="radio"
                name="list-scope"
                checked={scope === 'global'}
                onChange={() => setScope('global')}
              />
              <span className={styles.scopeCopy}>
                <span className={styles.scopeLabel}>Global</span>
                <span className={styles.scopeHint}>Works on any survey</span>
              </span>
            </label>
            <label className={styles.scopeOption}>
              <input
                type="radio"
                name="list-scope"
                checked={scope === 'survey-specific'}
                onChange={() => setScope('survey-specific')}
              />
              <span className={styles.scopeCopy}>
                <span className={styles.scopeLabel}>Survey specific</span>
                <span className={styles.scopeHint}>Works only in this survey</span>
              </span>
            </label>
          </div>
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
              title={visibleLists.length === 0 ? 'No lists yet' : 'No lists found'}
              description={
                visibleLists.length === 0
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
