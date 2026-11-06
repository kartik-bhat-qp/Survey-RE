'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { EmptyState } from '@/components/ui/EmptyState';
import { TableScrollWrap } from '@/components/ui/TableScrollWrap';
import { usePersistedState } from '@/hooks/usePersistedState';
import {
  ATTRIBUTE_TYPE_LABEL,
  CONTACT_HUB_STORAGE_KEY,
  EMPTY_CONTACT_HUB,
  type ContactAttributeDefinition,
  type ContactAttributeType,
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

const TYPE_OPTIONS = (Object.keys(ATTRIBUTE_TYPE_LABEL) as ContactAttributeType[]).map(
  (value) => ({ value, label: ATTRIBUTE_TYPE_LABEL[value] }),
);

export function ContactAttributesPage() {
  const { showToast } = useWuShowToast();
  const [hub, setHub] = usePersistedState(CONTACT_HUB_STORAGE_KEY, EMPTY_CONTACT_HUB);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<(typeof TYPE_OPTIONS)[number]>(TYPE_OPTIONS[0]);
  const [optionsText, setOptionsText] = useState('');

  function createAttribute() {
    const label = name.trim();
    if (!label) {
      showToast({ message: 'Enter an attribute name.', variant: 'error' });
      return;
    }
    if (hub.attributes.some((item) => item.name.toLowerCase() === label.toLowerCase())) {
      showToast({ message: 'An attribute with that name already exists.', variant: 'error' });
      return;
    }
    const needsOptions = type.value === 'dropdown' || type.value === 'multi-select';
    const options = optionsText
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    if (needsOptions && options.length === 0) {
      showToast({ message: 'Add at least one option.', variant: 'error' });
      return;
    }
    const created: ContactAttributeDefinition = {
      id: `attr-${Date.now()}`,
      name: label,
      type: type.value,
      ...(needsOptions ? { options } : {}),
    };
    setHub((current) => ({
      ...current,
      attributes: [...current.attributes, created],
    }));
    setCreating(false);
    setName('');
    setOptionsText('');
    showToast({ message: `Created “${label}”.`, variant: 'success' });
  }

  const columns: IWuTableColumnDef<ContactAttributeDefinition>[] = [
    {
      accessorKey: 'name',
      header: 'Attribute',
      enableSorting: true,
    },
    {
      accessorKey: 'type',
      header: 'Type',
      enableSorting: true,
      cell: ({ row }) => ATTRIBUTE_TYPE_LABEL[row.original.type],
    },
    {
      accessorKey: 'options',
      header: 'Options',
      cell: ({ row }) => row.original.options?.join(', ') ?? '—',
    },
    {
      accessorKey: 'id',
      header: '',
      cell: ({ row }) => (
        <button
          type="button"
          className={styles.linkBtn}
          onClick={() => {
            setHub((current) => ({
              ...current,
              attributes: current.attributes.filter((item) => item.id !== row.original.id),
            }));
            showToast({
              message: `Deleted “${row.original.name}”.`,
              variant: 'success',
            });
          }}
        >
          Delete
        </button>
      ),
    },
  ];

  return (
    <>
      <div className={styles.toolbar}>
        <WuButton
          type="button"
          Icon={<span className="wm-add" aria-hidden />}
          onClick={() => setCreating(true)}
        >
          New attribute
        </WuButton>
        <p className={styles.meta}>
          Organization-level fields for filtering, dynamic groups, and imports.
        </p>
      </div>

      {creating ? (
        <form
          className={`${styles.card} ${styles.formStack}`}
          onSubmit={(event) => {
            event.preventDefault();
            createAttribute();
          }}
        >
          <h2 className={styles.cardTitle}>Create custom attribute</h2>
          <WuInput
            variant="outlined"
            placeholder="Attribute name"
            aria-label="Attribute name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <WuSelect
            data={TYPE_OPTIONS}
            accessorKey={{ value: 'value', label: 'label' }}
            value={type}
            onSelect={(item) =>
              setType((item as (typeof TYPE_OPTIONS)[number] | null) ?? TYPE_OPTIONS[0])
            }
            placeholder="Type"
            variant="outlined"
          />
          {type.value === 'dropdown' || type.value === 'multi-select' ? (
            <WuInput
              variant="outlined"
              placeholder="Options, comma-separated"
              aria-label="Attribute options"
              value={optionsText}
              onChange={(event) => setOptionsText(event.target.value)}
            />
          ) : null}
          <div className={styles.toolbarRight}>
            <WuButton type="button" onClick={createAttribute}>
              Create attribute
            </WuButton>
            <WuButton
              type="button"
              variant="secondary"
              onClick={() => {
                setCreating(false);
                setName('');
                setOptionsText('');
              }}
            >
              Cancel
            </WuButton>
          </div>
        </form>
      ) : null}

      <TableScrollWrap className={styles.tableWrap}>
        <WuTable
          data={hub.attributes as unknown[]}
          columns={columns as unknown as IWuTableColumnDef<unknown>[]}
          variant="unstyled"
          sort={{ enabled: true }}
          NoDataContent={
            <EmptyState
              icon="wm-label"
              title="No custom attributes"
              description="Create attributes such as Customer Type, Industry, or Region."
            />
          }
        />
      </TableScrollWrap>
    </>
  );
}
