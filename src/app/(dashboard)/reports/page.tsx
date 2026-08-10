'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { CreateReportModal } from '@/components/reports/CreateReportModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageContainer } from '@/components/ui/PageContainer';
import { getDefaultCreateReportName } from '@/data/mock-create-report';
import { MOCK_CONJOINT_REPORT } from '@/data/mock-conjoint-report';
import { MOCK_REPORTS, REPORTS_PER_PAGE, type Report } from '@/data/mock-reports';
import { formatSmartDate } from '@/data/mock-utils';
import { getSectionBasePath, withSectionBasePath } from '@/lib/section-base-path';
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
  const router = useRouter();
  const basePath = getSectionBasePath(pathname);
  const reportsPath = withSectionBasePath(basePath, '/reports');
  const { showToast } = useWuShowToast();
  const [reports, setReports] = useState<Report[]>(MOCK_REPORTS);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredReports = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return reports;
    return reports.filter((report) => report.name.toLowerCase().includes(term));
  }, [reports, search]);

  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * REPORTS_PER_PAGE;
    return filteredReports.slice(start, start + REPORTS_PER_PAGE);
  }, [filteredReports, currentPage]);

  const defaultReportName = getDefaultCreateReportName(reports.length);

  function openReport(report: Report): void {
    if (report.typeId === 'conjoint') {
      router.push(`${reportsPath}/${report.id}`);
      return;
    }
    showToast({
      message: `Opening report "${report.name}"`,
      variant: 'info',
    });
  }

  const columns: IWuTableColumnDef<Report>[] = [
    {
      accessorKey: 'name',
      header: 'Reports',
      filterable: true,
      enableSorting: true,
      cell: ({ row }) => (
        <button
          type="button"
          className={styles.reportNameButton}
          onClick={() => openReport(row.original)}
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
            onClick={() => setIsCreateOpen(true)}
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

      <CreateReportModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        defaultName={defaultReportName}
        onCreate={({ name, typeId, survey }) => {
          const nextId = Math.max(0, ...reports.map((report) => report.id)) + 1;
          const nextReport: Report = {
            id: nextId,
            name,
            creationDate: new Date().toISOString().slice(0, 10),
            typeId,
            surveyName: survey.name,
            questionLabel:
              typeId === 'conjoint'
                ? MOCK_CONJOINT_REPORT.questionLabel
                : undefined,
          };
          setReports((prev) => [nextReport, ...prev]);
          MOCK_REPORTS.unshift(nextReport);
          setCurrentPage(1);
          showToast({
            message: `"${name}" created from "${survey.name}"`,
            variant: 'success',
          });
          if (typeId === 'conjoint') {
            router.push(`${reportsPath}/${nextId}`);
          }
        }}
      />
    </PageContainer>
  );
}
