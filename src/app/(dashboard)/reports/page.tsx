'use client';

import { useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageContainer } from '@/components/ui/PageContainer';
import { MOCK_REPORTS, REPORTS_PER_PAGE, type Report } from '@/data/mock-reports';
import { formatSmartDate } from '@/data/mock-utils';
import { getSectionBasePath } from '@/lib/section-base-path';
import styles from './ReportsTable.module.css';

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
const WuPagination = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuPagination })),
  { ssr: false }
);

export default function ReportsPage() {
  const pathname = usePathname();
  const basePath = getSectionBasePath(pathname);
  const { showToast } = useWuShowToast();
  const [reports] = useState<Report[]>(MOCK_REPORTS);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredReports = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return reports;
    return reports.filter((report) => report.name.toLowerCase().includes(term));
  }, [reports, search]);

  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * REPORTS_PER_PAGE;
    return filteredReports.slice(start, start + REPORTS_PER_PAGE);
  }, [filteredReports, currentPage]);

  const columns: IWuTableColumnDef<Report>[] = [
    {
      accessorKey: 'name',
      header: 'Reports',
      filterable: true,
      enableSorting: true,
      cell: ({ row }) => (
        <button
          type="button"
          className="text-left text-gray-900 hover:underline"
          onClick={() =>
            showToast({
              message: `Opening report "${row.original.name}"`,
              variant: 'info',
            })
          }
        >
          {row.original.name}
        </button>
      ),
    },
    {
      accessorKey: 'creationDate',
      header: 'Created on',
      enableSorting: true,
      cell: ({ row }) => formatSmartDate(row.original.creationDate),
    },
  ];

  return (
    <PageContainer>
      <section className="mb-6">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Reports</h1>
          <WuButton
            onClick={() =>
              showToast({ message: 'Create report', variant: 'success' })
            }
            Icon={<span className="wm-add-2" />}
            className="w-full sm:w-auto"
          >
            Create report
          </WuButton>
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
          {filteredReports.length > REPORTS_PER_PAGE && (
            <WuPagination
              key={`${currentPage}-${filteredReports.length}-${basePath}`}
              totalRows={filteredReports.length}
              initialPage={currentPage - 1}
              initialPageSize={REPORTS_PER_PAGE}
              onPageChange={(page) => setCurrentPage(page + 1)}
            />
          )}
        </div>
      </section>

      <div className={styles.tableWrap}>
        <WuTable
          data={paginatedReports as unknown[]}
          columns={columns as unknown as IWuTableColumnDef<unknown>[]}
          variant="striped"
          sort={{ enabled: true }}
          filterText=""
          NoDataContent={
            <EmptyState
              icon="wm-search-off"
              title="No reports found"
              description="Try adjusting your search"
            />
          }
        />
      </div>
    </PageContainer>
  );
}
