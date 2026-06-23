'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useBiProductBasePath, withBiProductBasePath } from '@/hooks/useBiProductBasePath';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageContainer } from '@/components/ui/PageContainer';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { CreateDashboardModal } from '@/components/dashboards/CreateDashboardModal';
import { saveRuntimeDashboard } from '@/data/dashboard-runtime';
import {
  DASHBOARDS_PER_PAGE,
  MOCK_DASHBOARDS,
  type Dashboard,
} from '@/data/mock-dashboards';
import { formatSmartDate } from '@/data/mock-utils';
import styles from './DashboardsTable.module.css';

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
const WuDisplay = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuDisplay })),
  { ssr: false }
);
const WuHeading = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuHeading })),
  { ssr: false }
);
const WuSubtext = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSubtext })),
  { ssr: false }
);
const WuPagination = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuPagination })),
  { ssr: false }
);

function DashboardRowActions({
  dashboard,
  onRename,
  onCopy,
  onDelete,
  onActivityLogs,
}: {
  dashboard: Dashboard;
  onRename: (d: Dashboard) => void;
  onCopy: (d: Dashboard) => void;
  onDelete: (d: Dashboard) => void;
  onActivityLogs: (d: Dashboard) => void;
}) {
  return (
    <div className={styles.rowActions}>
      <WuButton
        size="sm"
        variant="secondary"
        Icon={<span className="wm-history" />}
        onClick={() => onActivityLogs(dashboard)}
        aria-label="Activity logs"
      />
      <WuButton
        size="sm"
        variant="secondary"
        Icon={<span className="wm-edit" />}
        onClick={() => onRename(dashboard)}
        aria-label="Rename"
      />
      <WuButton
        size="sm"
        variant="secondary"
        Icon={<span className="wm-content-copy" />}
        onClick={() => onCopy(dashboard)}
        aria-label="Copy"
      />
      <WuButton
        size="sm"
        variant="secondary"
        Icon={<span className="wm-delete" />}
        onClick={() => onDelete(dashboard)}
        aria-label="Delete"
      />
    </div>
  );
}

function FirstTimeExperience({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center sm:py-20">
      <span className="wm-dashboard text-6xl text-gray-300" />
      <WuDisplay size="lg">Welcome to QuestionPro BI!</WuDisplay>
      <WuHeading size="lg">Import, visualize and analyze your data, your way.</WuHeading>
      <WuSubtext size="lg">Create a new dashboard to get started:</WuSubtext>
      <WuButton onClick={onCreateClick} Icon={<span className="wm-add-2" />}>
        Create dashboard
      </WuButton>
    </div>
  );
}

export default function DashboardsPage() {
  const wick = useWickUILib();
  const router = useRouter();
  const basePath = useBiProductBasePath();
  const dashboardsPath = withBiProductBasePath(basePath, '/dashboards');
  const { showToast } = useWuShowToast();
  const [dashboards, setDashboards] = useState<Dashboard[]>(MOCK_DASHBOARDS);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Dashboard | null>(null);
  const [renameTarget, setRenameTarget] = useState<Dashboard | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [copyTarget, setCopyTarget] = useState<Dashboard | null>(null);
  const [copyName, setCopyName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const defaultName = `Dashboard ${dashboards.length + 1}`;

  const filteredDashboards = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return dashboards;
    return dashboards.filter((d) => d.name.toLowerCase().includes(term));
  }, [dashboards, search]);

  const paginatedDashboards = useMemo(() => {
    const start = (currentPage - 1) * DASHBOARDS_PER_PAGE;
    return filteredDashboards.slice(start, start + DASHBOARDS_PER_PAGE);
  }, [filteredDashboards, currentPage]);
  const isFirstTimeUser = dashboards.length === 0;

  const columns: IWuTableColumnDef<Dashboard>[] = [
    {
      accessorKey: 'name',
      header: 'Dashboards',
      filterable: true,
      enableSorting: true,
      cell: ({ row }) => (
        <Link
          href={`${dashboardsPath}/${row.original.id}`}
          className="font-medium text-[#1B87E6] hover:underline"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: 'creationDate',
      header: 'Created on',
      enableSorting: true,
      cell: ({ row }) => formatSmartDate(row.original.creationDate),
    },
    {
      accessorKey: 'id',
      header: '',
      cellAlign: 'right',
      cell: ({ row }) => (
        <DashboardRowActions
          dashboard={row.original}
          onRename={(d) => {
            setRenameTarget(d);
            setRenameValue(d.name);
          }}
          onCopy={(d) => {
            const truncated =
              d.name.length > 91 ? `${d.name.slice(0, 88)}...` : d.name;
            setCopyTarget(d);
            setCopyName(`${truncated} - COPIED`);
          }}
          onDelete={setDeleteTarget}
          onActivityLogs={() =>
            showToast({ message: 'Activity logs', variant: 'success' })
          }
        />
      ),
    },
  ];

  function handleCreate(
    name: string,
    type: 'blank' | 'ai',
    survey?: { id: number; name: string }
  ) {
    const newDashboard: Dashboard = {
      id: Date.now(),
      name,
      creationDate: new Date().toISOString(),
      type,
      ...(survey ? { surveyId: survey.id, surveyName: survey.name } : {}),
    };
    saveRuntimeDashboard(newDashboard);
    setDashboards((prev) => [newDashboard, ...prev]);
    showToast({
      message: `Dashboard '${name}' created successfully`,
      variant: 'success',
    });
    if (type === 'ai' && survey) {
      showToast({
        message: `AI dashboard generation started for "${survey.name}"`,
        variant: 'success',
      });
    }
    router.push(`${dashboardsPath}/${newDashboard.id}`);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    setDashboards((prev) => prev.filter((d) => d.id !== deleteTarget.id));
    showToast({
      message: `Dashboard '${deleteTarget.name}' deleted successfully`,
      variant: 'success',
    });
    setDeleteTarget(null);
  }

  function handleRename() {
    if (!renameTarget || !renameValue.trim()) return;
    setDashboards((prev) =>
      prev.map((d) =>
        d.id === renameTarget.id ? { ...d, name: renameValue.trim() } : d
      )
    );
    showToast({
      message: `Dashboard renamed to '${renameValue.trim()}'`,
      variant: 'success',
    });
    setRenameTarget(null);
  }

  function handleCopy() {
    if (!copyTarget || !copyName.trim()) return;
    const copy: Dashboard = {
      id: Date.now(),
      name: copyName.trim(),
      creationDate: new Date().toISOString(),
    };
    setDashboards((prev) => [copy, ...prev]);
    showToast({
      message: `'${copyTarget.name}' copied successfully to '${copy.name}'`,
      variant: 'success',
    });
    setCopyTarget(null);
  }

  const createButton = (
    <WuButton
      onClick={() => setCreateOpen(true)}
      Icon={<span className="wm-add-2" />}
      className="w-full sm:w-auto"
    >
      Create dashboard
    </WuButton>
  );

  if (isFirstTimeUser) {
    return (
      <PageContainer>
        <FirstTimeExperience onCreateClick={() => setCreateOpen(true)} />
        <CreateDashboardModal
          open={createOpen}
          onOpenChange={setCreateOpen}
          defaultName={defaultName}
          onCreate={handleCreate}
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <section className="mb-6">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Dashboards</h1>
          {createButton}
        </div>
        <div className="flex min-h-8 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <WuInput
            variant="outlined"
            placeholder="Search"
            Icon={<span className="wm-search" />}
            iconPosition="left"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:max-w-xs"
          />
          {filteredDashboards.length > DASHBOARDS_PER_PAGE && (
            <WuPagination
              key={`${currentPage}-${filteredDashboards.length}`}
              totalRows={filteredDashboards.length}
              initialPage={currentPage - 1}
              initialPageSize={DASHBOARDS_PER_PAGE}
              onPageChange={(page) => setCurrentPage(page + 1)}
            />
          )}
        </div>
      </section>

      <div className={styles.tableWrap}>
        <WuTable
          data={paginatedDashboards as unknown[]}
          columns={columns as unknown as IWuTableColumnDef<unknown>[]}
          variant="striped"
          sort={{ enabled: true }}
          filterText=""
          NoDataContent={
            <EmptyState
              icon="wm-search-off"
              title="No dashboards found"
              description="Try adjusting your search"
            />
          }
        />
      </div>

      <CreateDashboardModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        defaultName={defaultName}
        onCreate={handleCreate}
      />

      <ConfirmModal
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        title="Delete dashboard"
        description={`Are you sure you want to delete this dashboard '${deleteTarget?.name}'?`}
        confirmLabel="Delete"
        variant="critical"
        onConfirm={handleDelete}
      />

      {renameTarget !== null && wick ? (
        <wick.WuModal
          open
          onOpenChange={(open) => {
            if (!open) setRenameTarget(null);
          }}
          size="sm"
        >
          <wick.WuModalHeader>Rename Dashboard</wick.WuModalHeader>
          <wick.WuModalContent>
            <WuInput
              Label="Name"
              variant="outlined"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
            />
          </wick.WuModalContent>
          <wick.WuModalFooter>
            <wick.WuModalClose variant="secondary">Cancel</wick.WuModalClose>
            <WuButton onClick={handleRename} disabled={!renameValue.trim()}>
              Save
            </WuButton>
          </wick.WuModalFooter>
        </wick.WuModal>
      ) : null}

      {copyTarget !== null && wick ? (
        <wick.WuModal
          open
          onOpenChange={(open) => {
            if (!open) setCopyTarget(null);
          }}
          size="sm"
        >
          <wick.WuModalHeader>Copy dashboard</wick.WuModalHeader>
          <wick.WuModalContent>
            <WuInput
              Label="Copied dashboard name"
              variant="outlined"
              value={copyName}
              onChange={(e) => setCopyName(e.target.value)}
            />
          </wick.WuModalContent>
          <wick.WuModalFooter>
            <wick.WuModalClose variant="secondary">Cancel</wick.WuModalClose>
            <WuButton onClick={handleCopy} disabled={!copyName.trim()}>
              Copy
            </WuButton>
          </wick.WuModalFooter>
        </wick.WuModal>
      ) : null}
    </PageContainer>
  );
}
