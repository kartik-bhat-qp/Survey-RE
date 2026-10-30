'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageContainer } from '@/components/ui/PageContainer';
import { PageHeader } from '@/components/ui/PageHeader';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  BLACKLIST_KEY,
  BLACKLIST_KINDS,
  MOCK_BLACKLIST,
  blacklistKindLabel,
  type BlacklistEntry,
  type BlacklistKind,
} from '@/data/mock-blacklist';
import { formatDate } from '@/data/mock-utils';
import { usePersistedState } from '@/hooks/usePersistedState';
import styles from './IntegrityBlacklist.module.css';

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

type KindOption = { value: BlacklistKind | 'all'; label: string };

const FILTER_OPTIONS: KindOption[] = [
  { value: 'all', label: 'All types' },
  ...BLACKLIST_KINDS.map((item) => ({ value: item.id, label: item.label })),
];

const KIND_OPTIONS = BLACKLIST_KINDS.map((item) => ({ value: item.id, label: item.label }));

const PLACEHOLDER: Record<BlacklistKind, string> = {
  fingerprint: 'Paste a device fingerprint',
  'ip-range': '203.0.113.0/24',
  email: 'name@example.com',
};

function valueError(kind: BlacklistKind, value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Enter a value to block.';
  if (kind === 'email') {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? null : 'Enter an email address.';
  }
  if (kind === 'ip-range') {
    const cidr = /^[0-9a-fA-F:.]+\/\d{1,3}$/.test(trimmed);
    const span = trimmed.includes('-') && /[0-9a-fA-F:.]/.test(trimmed);
    return cidr || span ? null : 'Enter an IP range, such as 203.0.113.0/24.';
  }
  return trimmed.length >= 8 ? null : 'Enter the device fingerprint.';
}

export function IntegrityBlacklist() {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [entries, setEntries] = usePersistedState<BlacklistEntry[]>(
    BLACKLIST_KEY,
    MOCK_BLACKLIST,
  );
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<KindOption>(FILTER_OPTIONS[0]);
  const [adding, setAdding] = useState(false);
  const [kind, setKind] = useState<BlacklistKind>('fingerprint');
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const [removeId, setRemoveId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return entries.filter((entry) => {
      if (kindFilter.value !== 'all' && entry.kind !== kindFilter.value) return false;
      if (!query) return true;
      const haystack = `${entry.value} ${entry.note ?? ''} ${blacklistKindLabel(entry.kind)}`;
      return haystack.toLowerCase().includes(query);
    });
  }, [entries, kindFilter, search]);

  const removing = entries.find((entry) => entry.id === removeId) ?? null;

  function resetForm(): void {
    setKind('fingerprint');
    setValue('');
    setNote('');
  }

  function add(): void {
    const error = valueError(kind, value);
    if (error) {
      showToast({ message: error, variant: 'error' });
      return;
    }
    const nextValue = value.trim();
    const duplicate = entries.some(
      (entry) => entry.kind === kind && entry.value.toLowerCase() === nextValue.toLowerCase(),
    );
    if (duplicate) {
      showToast({ message: 'That value is already on the blocklist.', variant: 'error' });
      return;
    }
    const entry: BlacklistEntry = {
      id: `bl-${Date.now()}`,
      kind,
      value: nextValue,
      note: note.trim() || undefined,
      addedAt: new Date().toISOString(),
    };
    setEntries((current) => [entry, ...current]);
    setAdding(false);
    resetForm();
    showToast({
      message: `${blacklistKindLabel(kind)} blocked across surveys and communities.`,
      variant: 'success',
    });
  }

  function remove(): void {
    if (!removing) return;
    setEntries((current) => current.filter((entry) => entry.id !== removing.id));
    showToast({ message: 'Removed from the blocklist.', variant: 'success' });
  }

  return (
    <PageContainer>
      <PageHeader
        title="Blocklist"
        description={
          'Block a device fingerprint, an IP range, or an email from every survey and community.'
        }
        action={
          <WuButton type="button" onClick={() => setAdding(true)}>
            Add to blocklist
          </WuButton>
        }
      />
      <div className={styles.toolbar}>
        <div className={styles.search}>
          <WuInput
            variant="outlined"
            placeholder="Search blocklist"
            Icon={<span className="wm-search" />}
            iconPosition="left"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search blocklist"
          />
        </div>
        <div className={styles.filter}>
          <WuSelect
            data={FILTER_OPTIONS}
            accessorKey={{ value: 'value', label: 'label' }}
            value={kindFilter}
            onSelect={(item) => setKindFilter(item as KindOption)}
            variant="outlined"
            aria-label="Type"
          />
        </div>
      </div>
      {visible.length === 0 ? (
        <EmptyState
          icon="wm-block"
          title={entries.length === 0 ? 'Nothing on the blocklist' : 'No matches'}
          description={
            entries.length === 0
              ? 'Add a device fingerprint, IP range, or email to block it everywhere.'
              : 'Try a different search or type.'
          }
          action={
            entries.length === 0 ? (
              <WuButton type="button" onClick={() => setAdding(true)}>
                Add to blocklist
              </WuButton>
            ) : null
          }
        />
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Blocked value</th>
              <th scope="col">Type</th>
              <th scope="col">Added</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((entry) => (
              <tr key={entry.id}>
                <td>
                  <div className={styles.value}>{entry.value}</div>
                  {entry.note ? <p className={styles.meta}>{entry.note}</p> : null}
                </td>
                <td>{blacklistKindLabel(entry.kind)}</td>
                <td>{formatDate(entry.addedAt)}</td>
                <td>
                  <button
                    type="button"
                    className={styles.link}
                    onClick={() => setRemoveId(entry.id)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {adding && wick ? (
        <wick.WuModal
          open
          onOpenChange={(open) => {
            setAdding(open);
            if (!open) resetForm();
          }}
          size="md"
        >
          <wick.WuModalHeader>Add to blocklist</wick.WuModalHeader>
          <wick.WuModalContent>
            <div className={styles.field}>
              <WuSelect
                Label="Type"
                data={KIND_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={KIND_OPTIONS.find((item) => item.value === kind) ?? KIND_OPTIONS[0]}
                onSelect={(item) => setKind((item as { value: BlacklistKind }).value)}
                variant="outlined"
                aria-label="Type"
              />
              <WuInput
                Label="Value"
                variant="outlined"
                placeholder={PLACEHOLDER[kind]}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                aria-label="Value"
              />
              <WuInput
                Label="Note"
                variant="outlined"
                placeholder="Why this is blocked (optional)"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                aria-label="Note"
              />
            </div>
          </wick.WuModalContent>
          <wick.WuModalFooter>
            <wick.WuModalClose variant="secondary">Cancel</wick.WuModalClose>
            <WuButton type="button" onClick={add}>
              Add to blocklist
            </WuButton>
          </wick.WuModalFooter>
        </wick.WuModal>
      ) : null}
      <ConfirmModal
        open={removing !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveId(null);
        }}
        title="Remove from blocklist?"
        description={
          removing
            ? `${removing.value} will be allowed in surveys and communities again.`
            : ''
        }
        confirmLabel="Remove"
        variant="critical"
        onConfirm={remove}
      />
    </PageContainer>
  );
}
