'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { CreateReportModal } from '@/components/reports/CreateReportModal';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageContainer } from '@/components/ui/PageContainer';
import { MOCK_CONJOINT_REPORT } from '@/data/mock-conjoint-report';
import {
  CREATE_REPORT_TYPE_OPTIONS,
  getCreateReportTypeOption,
  getDefaultCreateReportName,
} from '@/data/mock-create-report';
import { MOCK_REPORTS, type Report } from '@/data/mock-reports';
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
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
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
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const filteredReports = useMemo(() => {
    const term = search.trim().toLowerCase();
    return reports.filter((report) => {
      if (typeFilter !== 'all' && report.typeId !== typeFilter) return false;
      if (!term) return true;
      return (
        report.name.toLowerCase().includes(term) ||
        (report.surveyName ?? '').toLowerCase().includes(term)
      );
    });
  }, [reports, search, typeFilter]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const report of reports) {
      if (!report.typeId) continue;
      counts[report.typeId] = (counts[report.typeId] ?? 0) + 1;
    }
    return counts;
  }, [reports]);

  const chips = useMemo(
    () => [
      { id: 'all', label: 'All reports', count: reports.length, iconSrc: null as string | null },
      ...CREATE_REPORT_TYPE_OPTIONS.filter((option) => typeCounts[option.id]).map(
        (option) => ({
          id: option.id,
          label: option.title,
          count: typeCounts[option.id],
          iconSrc: option.iconSrc as string | null,
        })
      ),
    ],
    [reports.length, typeCounts]
  );

  const typeCount = new Set(reports.map((report) => report.typeId)).size;
  const subhead = `${reports.length} reports across ${typeCount} report types`;
  const defaultReportName = getDefaultCreateReportName(reports.length);

  function openReport(report: Report): void {
    router.push(`${reportsPath}/${report.id}`);
  }

  const columns: IWuTableColumnDef<Report>[] = [
    {
      accessorKey: 'name',
      header: 'Report',
      filterable: true,
      enableSorting: true,
      cell: ({ row }) => {
        const option = getCreateReportTypeOption(row.original.typeId);
        return (
          <button
            type="button"
            className={styles.reportNameButton}
            onClick={() => openReport(row.original)}
          >
            <WuTooltip content={option.title} position="top">
              <span className={styles.typeIconWrap}>
                <Image
                  src={option.iconSrc}
                  alt=""
                  width={20}
                  height={20}
                  className={styles.typeIcon}
                />
              </span>
            </WuTooltip>
            <span className={styles.reportName}>{row.original.name}</span>
          </button>
        );
      },
    },
    {
      accessorKey: 'surveyName',
      header: 'Survey',
      enableSorting: false,
      cell: ({ row }) => (
        <span className={styles.mutedCell}>{row.original.surveyName ?? '—'}</span>
      ),
    },
    {
      accessorKey: 'creationDate',
      header: 'Created on',
      enableSorting: true,
      cell: ({ row }) => (
        <span className={styles.mutedCell}>
          {formatSmartDate(row.original.creationDate)}
        </span>
      ),
    },
  ];

  return (
    <PageContainer className={styles.page}>
      <section className="mb-5">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className={styles.title}>Reports</h1>
            <p className={styles.subhead}>{subhead}</p>
          </div>
          <WuButton
            onClick={() => setIsCreateOpen(true)}
            Icon={<span className="wm-add-2" />}
            className="w-full sm:w-auto"
          >
            Create report
          </WuButton>
        </div>

        <div className="mb-3.5">
          <WuInput
            variant="outlined"
            placeholder="Search reports"
            Icon={<span className="wm-search" />}
            iconPosition="left"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full sm:max-w-[280px]"
          />
        </div>

        <div className={styles.chipRow} role="group" aria-label="Filter by report type">
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              aria-pressed={typeFilter === chip.id}
              className={`${styles.chip} ${
                typeFilter === chip.id ? styles.chipActive : ''
              }`}
              onClick={() => setTypeFilter(chip.id)}
            >
              {chip.iconSrc ? (
                <Image
                  src={chip.iconSrc}
                  alt=""
                  width={16}
                  height={16}
                  className={styles.chipIcon}
                />
              ) : null}
              {chip.label}
              <span className={styles.chipCount}>{chip.count}</span>
            </button>
          ))}
        </div>
      </section>

      {filteredReports.length === 0 ? (
        <EmptyState
          icon="wm-search-off"
          title="No reports found"
          description="Try a different search or clear the type filter."
          action={
            typeFilter !== 'all' || search.trim() ? (
              <WuButton
                variant="secondary"
                onClick={() => {
                  setSearch('');
                  setTypeFilter('all');
                }}
              >
                Clear filters
              </WuButton>
            ) : undefined
          }
        />
      ) : (
        <div className={styles.tableWrap}>
          <WuTable
            data={filteredReports as unknown[]}
            columns={columns as unknown as IWuTableColumnDef<unknown>[]}
            variant="unstyled"
            sort={{ enabled: true }}
            filterText=""
          />
        </div>
      )}

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
              typeId === 'conjoint' ? MOCK_CONJOINT_REPORT.questionLabel : undefined,
          };
          setReports((prev) => [nextReport, ...prev]);
          MOCK_REPORTS.unshift(nextReport);
          setTypeFilter('all');
          showToast({
            message: `"${name}" created from "${survey.name}"`,
            variant: 'success',
          });
          router.push(`${reportsPath}/${nextId}`);
        }}
      />
    </PageContainer>
  );
}
