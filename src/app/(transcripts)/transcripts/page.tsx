'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { TranscriptsConverter } from '@/components/transcripts/TranscriptsConverter';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageContainer } from '@/components/ui/PageContainer';
import { PageHeader } from '@/components/ui/PageHeader';
import { TableScrollWrap } from '@/components/ui/TableScrollWrap';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  MOCK_TRANSCRIPTS,
  type Transcript,
  type TranscriptSource,
  type TranscriptStatus,
} from '@/data/mock-transcripts';
import { formatDate } from '@/data/mock-utils';

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
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);
const WuMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenu })),
  { ssr: false }
);
const WuMenuItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuItem })),
  { ssr: false }
);
const WuMenuSeparatorItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuSeparatorItem })),
  { ssr: false }
);

type SourceOption = { value: string; label: string };

const SOURCE_FILTER_OPTIONS: SourceOption[] = [
  { value: 'all', label: 'All sources' },
  { value: 'Interview', label: 'Interview' },
  { value: 'Focus group', label: 'Focus group' },
  { value: 'Call recording', label: 'Call recording' },
  { value: 'Survey video', label: 'Survey video' },
];

const STATUS_CLASS: Record<TranscriptStatus, string> = {
  ready: 'bg-green-100 text-green-700',
  processing: 'bg-blue-100 text-blue-700',
  failed: 'bg-red-100 text-red-700',
};

function StatusBadge({ status }: { status: TranscriptStatus }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_CLASS[status]}`}>
      {status}
    </span>
  );
}

function RowActions({
  transcript,
  onDelete,
}: {
  transcript: Transcript;
  onDelete: (item: Transcript) => void;
}) {
  const router = useRouter();
  const { showToast } = useWuShowToast();

  return (
    <WuMenu
      Trigger={
        <button type="button" className="rounded-md p-1 hover:bg-gray-100" aria-label="More actions">
          <span className="wm-more-vert text-gray-500" />
        </button>
      }
      align="end"
    >
      <WuMenuItem onSelect={() => router.push(`/transcripts/${transcript.id}`)}>
        View transcript
      </WuMenuItem>
      <WuMenuItem
        onSelect={() => showToast({ message: `Downloading ${transcript.name}`, variant: 'success' })}
      >
        Download
      </WuMenuItem>
      <WuMenuSeparatorItem />
      <WuMenuItem onSelect={() => onDelete(transcript)}>Delete</WuMenuItem>
    </WuMenu>
  );
}

export default function TranscriptsPage() {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [items, setItems] = useState<Transcript[]>(MOCK_TRANSCRIPTS);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourceOption | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSource, setNewSource] = useState<SourceOption>(SOURCE_FILTER_OPTIONS[1]);
  const [deleteTarget, setDeleteTarget] = useState<Transcript | null>(null);

  const filtered = useMemo(() => {
    const source = sourceFilter?.value;
    if (!source || source === 'all') return items;
    return items.filter((item) => item.source === source);
  }, [items, sourceFilter]);

  const columns: IWuTableColumnDef<Transcript>[] = [
    {
      accessorKey: 'name',
      header: 'Transcript',
      filterable: true,
      cell: ({ row }) => (
        <Link
          href={`/transcripts/${row.original.id}`}
          className="font-medium text-blue-600 hover:underline"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: 'source',
      header: 'Source',
      filterable: true,
      cell: ({ row }) => row.original.source,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'duration',
      header: 'Duration',
      cell: ({ row }) => row.original.duration ?? '—',
    },
    {
      accessorKey: 'owner',
      header: 'Owner',
      cell: ({ row }) => row.original.owner,
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      accessorKey: 'id',
      header: '',
      cellAlign: 'right',
      cell: ({ row }) => (
        <RowActions transcript={row.original} onDelete={setDeleteTarget} />
      ),
    },
  ];

  function handleCreate(): void {
    const name = newName.trim();
    if (!name) return;
    const created: Transcript = {
      id: `tr-${Date.now()}`,
      name,
      source: (newSource.value === 'all' ? 'Interview' : newSource.value) as TranscriptSource,
      status: 'processing',
      language: 'English',
      speakers: 1,
      owner: 'Kartik Bhat',
      createdAt: new Date().toISOString().slice(0, 10),
      excerpt: 'Transcription has started. You will be notified when it is ready.',
    };
    setItems((prev) => [created, ...prev]);
    setIsCreateOpen(false);
    setNewName('');
    showToast({ message: `"${name}" added`, variant: 'success' });
  }

  return (
    <PageContainer>
      <PageHeader
        title="Transcripts"
        description="Upload transcript CSVs and download an Excel workbook grouped by common questions"
        action={
          <WuButton onClick={() => setIsCreateOpen(true)}>
            <span className="wm-add" /> New transcript
          </WuButton>
        }
      />

      <TranscriptsConverter />

      <h2 className="mb-4 text-base font-semibold text-gray-900">Library</h2>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <WuInput
          variant="outlined"
          placeholder="Search transcripts..."
          Icon={<span className="wm-search" />}
          iconPosition="left"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full sm:w-64"
        />
        <WuSelect
          data={SOURCE_FILTER_OPTIONS}
          accessorKey={{ value: 'value', label: 'label' }}
          value={sourceFilter}
          onSelect={(value) => {
            const item = value as SourceOption | null;
            if (!item || item.value === 'all') {
              setSourceFilter(null);
              return;
            }
            setSourceFilter(item);
          }}
          variant="outlined"
          placeholder="All sources"
          aria-label="Filter by source"
        />
      </div>

      <TableScrollWrap>
        <WuTable
          data={filtered as unknown[]}
          columns={columns as unknown as IWuTableColumnDef<unknown>[]}
          variant="unstyled"
          sort={{ enabled: true }}
          filterText={search}
          NoDataContent={
            <EmptyState
              icon="wm-search-off"
              title="No transcripts found"
              description="Try adjusting your search or source filter"
            />
          }
        />
      </TableScrollWrap>

      {isCreateOpen && wick ? (
        <wick.WuModal open onOpenChange={setIsCreateOpen} size="md">
          <wick.WuModalHeader>New transcript</wick.WuModalHeader>
          <wick.WuModalContent>
            <div className="flex flex-col gap-4">
              <WuInput
                Label="Name"
                variant="outlined"
                placeholder="e.g. NPS follow-up interviews — Week 13"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
              />
              <WuSelect
                data={SOURCE_FILTER_OPTIONS.filter((option) => option.value !== 'all')}
                accessorKey={{ value: 'value', label: 'label' }}
                value={newSource}
                onSelect={(value) => {
                  const item = value as SourceOption | null;
                  if (item) setNewSource(item);
                }}
                Label="Source"
                variant="outlined"
              />
            </div>
          </wick.WuModalContent>
          <wick.WuModalFooter>
            <wick.WuModalClose variant="secondary">Cancel</wick.WuModalClose>
            <WuButton onClick={handleCreate} disabled={!newName.trim()}>
              Create transcript
            </WuButton>
          </wick.WuModalFooter>
        </wick.WuModal>
      ) : null}

      <ConfirmModal
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete transcript?"
        description={`"${deleteTarget?.name}" will be removed from this workspace.`}
        confirmLabel="Delete"
        variant="critical"
        onConfirm={() => {
          if (!deleteTarget) return;
          setItems((prev) => prev.filter((item) => item.id !== deleteTarget.id));
          showToast({ message: `"${deleteTarget.name}" deleted`, variant: 'success' });
          setDeleteTarget(null);
        }}
      />
    </PageContainer>
  );
}
