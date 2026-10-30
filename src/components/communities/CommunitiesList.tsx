'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { PageContainer } from '@/components/ui/PageContainer';
import { PageHeader } from '@/components/ui/PageHeader';
import { TableScrollWrap } from '@/components/ui/TableScrollWrap';
import { EmptyState } from '@/components/ui/EmptyState';
import { MOCK_COMMUNITIES, type CommunityListItem } from '@/data/mock-communities';
import { formatDate } from '@/data/mock-utils';
import styles from './CommunitiesList.module.css';

const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })),
  { ssr: false },
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false },
);

export function CommunitiesList() {
  const [search, setSearch] = useState('');
  const communities = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return MOCK_COMMUNITIES;
    return MOCK_COMMUNITIES.filter((community) => community.name.toLowerCase().includes(query));
  }, [search]);

  const columns: IWuTableColumnDef<CommunityListItem>[] = [
    {
      accessorKey: 'name',
      header: 'Community',
      size: 320,
      cell: ({ row }) => (
        <Link href={`/communities/${row.original.id}`} className={styles.name}>
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 110,
      cell: ({ row }) => row.original.status,
    },
    {
      accessorKey: 'members',
      header: 'Members',
      size: 110,
      cell: ({ row }) => row.original.members.toLocaleString(),
    },
    {
      accessorKey: 'modifiedAt',
      header: 'Modified',
      size: 140,
      cell: ({ row }) => (row.original.modifiedAt ? formatDate(row.original.modifiedAt) : '—'),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Communities"
        description="Open a community to manage it. Integrity is set inside that community."
      />
      <div className={styles.toolbar}>
        <WuInput
          variant="outlined"
          value={search}
          placeholder="Search communities"
          aria-label="Search communities"
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      {communities.length === 0 ? (
        <EmptyState
          icon="wm-groups"
          title="No communities match"
          description="Try a different name."
        />
      ) : (
        <TableScrollWrap>
          <WuTable
            data={communities as unknown[]}
            columns={columns as unknown as IWuTableColumnDef<unknown>[]}
          />
        </TableScrollWrap>
      )}
    </PageContainer>
  );
}
