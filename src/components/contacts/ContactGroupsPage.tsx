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
import { useContactHubSession } from '@/hooks/useContactHubSession';
import {
  CONTACT_HUB_TEAMS,
  GROUP_SHARE_MODE_LABEL,
  userById,
  type GroupShareMode,
} from '@/data/mock-contact-hub-access';
import {
  formatContactDate,
  groupOwnership,
  groupSharing,
  type ContactGroup,
  type ContactGroupType,
  type GroupRuleOperator,
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
const WuTextarea = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTextarea })),
  { ssr: false },
);

type TypeFilter = 'all' | ContactGroupType;

const TYPE_OPTIONS = [
  { value: 'static', label: 'Static Group' },
  { value: 'dynamic', label: 'Dynamic Group' },
];

export function ContactGroupsPage() {
  const params = useParams();
  const surveyId = Number(params.id);
  const { showToast } = useWuShowToast();
  const { hub, setHub, visibleGroups, currentUser, can } = useContactHubSession();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<(typeof TYPE_OPTIONS)[number]>(TYPE_OPTIONS[0]);
  const [ruleCountry, setRuleCountry] = useState('');
  const [ruleOperator, setRuleOperator] = useState<GroupRuleOperator>('and');
  const shareOptions = (Object.keys(GROUP_SHARE_MODE_LABEL) as GroupShareMode[]).map((value) => ({
    value,
    label: GROUP_SHARE_MODE_LABEL[value],
  }));
  const [shareMode, setShareMode] = useState<(typeof shareOptions)[number]>(
    shareOptions.find((item) => item.value === hub.accessPolicy.defaultGroupShareMode) ??
      shareOptions[2],
  );
  const [shareTeamId, setShareTeamId] = useState(
    currentUser.teamIds[0]
      ? {
          value: currentUser.teamIds[0],
          label: CONTACT_HUB_TEAMS.find((team) => team.id === currentUser.teamIds[0])?.name ?? '',
        }
      : null,
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return visibleGroups.filter((group) => {
      if (typeFilter !== 'all' && group.type !== typeFilter) return false;
      if (!query) return true;
      return (
        group.name.toLowerCase().includes(query) ||
        (group.description ?? '').toLowerCase().includes(query)
      );
    });
  }, [visibleGroups, search, typeFilter]);

  function createGroup() {
    if (!can('groups.create')) {
      showToast({ message: 'Your role cannot create groups.', variant: 'error' });
      return;
    }
    const label = name.trim();
    if (!label) {
      showToast({ message: 'Enter a group name.', variant: 'error' });
      return;
    }
    if (hub.groups.some((group) => group.name.toLowerCase() === label.toLowerCase())) {
      showToast({ message: 'A group with that name already exists.', variant: 'error' });
      return;
    }
    const now = new Date().toISOString();
    const mode = shareMode.value;
    const created: ContactGroup = {
      id: `group-${Date.now()}`,
      name: label,
      description: description.trim() || undefined,
      type: type.value as ContactGroupType,
      contactCount: 0,
      createdAt: now,
      updatedAt: now,
      ownership: {
        createdBy: currentUser.id,
        createdAt: now,
        lastModifiedBy: currentUser.id,
        lastModifiedAt: now,
        owningTeamId: currentUser.teamIds[0],
        accessScope:
          mode === 'organization' ? 'organization' : mode === 'private' ? 'private' : 'team',
      },
      sharing: {
        mode,
        userIds: mode === 'users' ? [currentUser.id] : [],
        teamIds:
          mode === 'teams' && shareTeamId
            ? [shareTeamId.value]
            : mode === 'teams'
              ? currentUser.teamIds.slice(0, 1)
              : [],
        permissions:
          mode === 'private'
            ? ['view', 'use-distribute', 'edit-membership', 'edit-rules', 'delete']
            : ['view', 'use-distribute', 'edit-membership'],
      },
      ...(type.value === 'dynamic'
        ? {
            ruleOperator,
            rules: ruleCountry.trim()
              ? [
                  {
                    id: `rule-${Date.now()}`,
                    field: 'country' as const,
                    comparator: 'is' as const,
                    value: ruleCountry.trim(),
                  },
                ]
              : [],
          }
        : {}),
    };
    setHub((current) => ({ ...current, groups: [created, ...current.groups] }));
    setCreating(false);
    setName('');
    setDescription('');
    setRuleCountry('');
    showToast({ message: `Created “${label}”.`, variant: 'success' });
  }

  const columns: IWuTableColumnDef<ContactGroup>[] = [
    {
      accessorKey: 'name',
      header: 'Group',
      enableSorting: true,
      cell: ({ row }) => (
        <div>
          <Link
            href={contactHubPath(surveyId, 'group', row.original.id)}
            className={styles.linkBtn}
          >
            {row.original.name}
          </Link>
          {row.original.description ? (
            <p className={styles.meta}>{row.original.description}</p>
          ) : null}
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Type',
      enableSorting: true,
      cell: ({ row }) => (
        <span className={styles.typeBadge}>
          {row.original.type === 'dynamic' ? 'Dynamic' : 'Static'}
        </span>
      ),
    },
    {
      accessorKey: 'contactCount',
      header: 'Contacts',
      enableSorting: true,
      cell: ({ row }) => row.original.contactCount.toLocaleString('en-US'),
    },
    {
      accessorKey: 'updatedAt',
      header: 'Last updated',
      enableSorting: true,
      cell: ({ row }) => formatContactDate(row.original.updatedAt),
    },
    {
      accessorKey: 'ownership',
      header: 'Owner',
      cell: ({ row }) => {
        const meta = groupOwnership(row.original);
        return userById(meta.createdBy)?.name ?? meta.createdBy;
      },
    },
    {
      accessorKey: 'sharing',
      header: 'Sharing',
      cell: ({ row }) => GROUP_SHARE_MODE_LABEL[groupSharing(row.original).mode],
    },
  ];

  return (
    <>
      <div className={styles.toolbar}>
        {can('groups.create') ? (
          <WuButton
            type="button"
            Icon={<span className="wm-add" aria-hidden />}
            onClick={() => setCreating(true)}
          >
            New group
          </WuButton>
        ) : (
          <p className={styles.meta}>Your role can view permitted groups only.</p>
        )}
        <div className={styles.toolbarRight}>
          <div className={styles.filters}>
            {(
              [
                ['all', 'All'],
                ['static', 'Static'],
                ['dynamic', 'Dynamic'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={typeFilter === id ? styles.pillOn : styles.pill}
                onClick={() => setTypeFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className={styles.searchWrap}>
            <WuInput
              type="search"
              variant="outlined"
              placeholder="Search groups"
              aria-label="Search groups"
              Icon={<span className="wm-search" aria-hidden />}
              iconPosition="left"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>
      </div>

      {creating ? (
        <form
          className={`${styles.card} ${styles.formStack}`}
          onSubmit={(event) => {
            event.preventDefault();
            createGroup();
          }}
        >
          <h2 className={styles.cardTitle}>Create group</h2>
          <WuInput
            variant="outlined"
            placeholder="Group name"
            aria-label="Group name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <WuTextarea
            variant="outlined"
            placeholder="Description (optional)"
            aria-label="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <WuSelect
            data={TYPE_OPTIONS}
            accessorKey={{ value: 'value', label: 'label' }}
            value={type}
            onSelect={(item) =>
              setType((item as (typeof TYPE_OPTIONS)[number] | null) ?? TYPE_OPTIONS[0])
            }
            placeholder="Group type"
            variant="outlined"
          />
          {type.value === 'dynamic' ? (
            <>
              <p className={styles.meta}>
                Membership updates automatically when contacts meet these conditions (
                {ruleOperator.toUpperCase()}).
              </p>
              <div className={styles.ruleRow}>
                <button
                  type="button"
                  className={ruleOperator === 'and' ? styles.pillOn : styles.pill}
                  onClick={() => setRuleOperator('and')}
                >
                  AND
                </button>
                <button
                  type="button"
                  className={ruleOperator === 'or' ? styles.pillOn : styles.pill}
                  onClick={() => setRuleOperator('or')}
                >
                  OR
                </button>
                <span>Country is</span>
                <WuInput
                  variant="outlined"
                  placeholder="e.g. India"
                  aria-label="Country rule value"
                  value={ruleCountry}
                  onChange={(event) => setRuleCountry(event.target.value)}
                />
              </div>
            </>
          ) : (
            <p className={styles.meta}>
              Contacts are added manually or by import. Membership stays until you change it.
            </p>
          )}
          <WuSelect
            data={shareOptions}
            accessorKey={{ value: 'value', label: 'label' }}
            value={shareMode}
            onSelect={(item) =>
              setShareMode((item as (typeof shareOptions)[number] | null) ?? shareOptions[0])
            }
            placeholder="Sharing"
            variant="outlined"
          />
          {shareMode.value === 'teams' ? (
            <WuSelect
              data={CONTACT_HUB_TEAMS.map((team) => ({ value: team.id, label: team.name }))}
              accessorKey={{ value: 'value', label: 'label' }}
              value={shareTeamId}
              onSelect={(item) =>
                setShareTeamId((item as { value: string; label: string } | null) ?? null)
              }
              placeholder="Share with team"
              variant="outlined"
            />
          ) : null}
          <p className={styles.meta}>
            Shared groups never duplicate contacts. Recipients still respect organization
            suppression.
          </p>
          <div className={styles.toolbarRight}>
            <WuButton type="button" onClick={createGroup}>
              Create group
            </WuButton>
            <WuButton
              type="button"
              variant="secondary"
              onClick={() => {
                setCreating(false);
                setName('');
                setDescription('');
              }}
            >
              Cancel
            </WuButton>
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
              icon="wm-group"
              title={visibleGroups.length === 0 ? 'No groups in your scope' : 'No groups found'}
              description={
                visibleGroups.length === 0
                  ? 'No private, team, or organization groups are visible for your role.'
                  : 'Try a different search or filter.'
              }
            />
          }
        />
      </TableScrollWrap>
    </>
  );
}
