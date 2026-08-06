'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  DASHBOARD_REPORT_TAB_CATEGORIES,
  getDashboardReportsByCategory,
  type DashboardReportPickItem,
  type DashboardReportTabCategory,
} from '@/data/mock-dashboard-report-tabs';
import { formatSmartDate } from '@/data/mock-utils';
import styles from './NewReportTabModal.module.css';

const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })),
  { ssr: false }
);

interface NewReportTabModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (report: DashboardReportPickItem) => void;
}

export function NewReportTabModal({
  open,
  onOpenChange,
  onSave,
}: NewReportTabModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [category, setCategory] = useState<DashboardReportTabCategory>('crosstab');
  const [search, setSearch] = useState('');
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;
    setCategory('crosstab');
    setSearch('');
    setSelectedReportId(null);
  }, [open]);

  const categoryReports = useMemo(
    () => getDashboardReportsByCategory(category),
    [category]
  );

  const filteredReports = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return categoryReports;
    return categoryReports.filter((report) =>
      report.name.toLowerCase().includes(term)
    );
  }, [categoryReports, search]);

  const selectedReport =
    filteredReports.find((report) => report.id === selectedReportId) ??
    categoryReports.find((report) => report.id === selectedReportId) ??
    null;

  const rangeLabel =
    filteredReports.length === 0 ? '0 - 0' : `1 - ${filteredReports.length}`;

  const nameColumnHeader = category === 'text-ai' ? 'Dashboards' : 'Reports';

  const columns: IWuTableColumnDef<DashboardReportPickItem>[] = [
    {
      accessorKey: 'name',
      header: nameColumnHeader,
      enableSorting: true,
      cell: ({ row }) => {
        const report = row.original;
        const isSelected = selectedReportId === report.id;
        return (
          <button
            type="button"
            className={`${styles.reportNameBtn} ${
              isSelected ? styles.reportNameBtnSelected : ''
            }`}
            onClick={() => setSelectedReportId(report.id)}
          >
            {report.name}
          </button>
        );
      },
    },
    {
      accessorKey: 'creationDate',
      header: 'Created on',
      enableSorting: true,
      cell: ({ row }) => (
        <span className={styles.createdOn}>
          {formatSmartDate(row.original.creationDate)}
        </span>
      ),
    },
  ];

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuButton } = wick;
  const activeCategory = DASHBOARD_REPORT_TAB_CATEGORIES.find(
    (item) => item.id === category
  );
  const isComingSoon = Boolean(activeCategory?.comingSoon);

  function handleSave(): void {
    if (!selectedReport) {
      showToast({
        message:
          category === 'text-ai'
            ? 'Select a TextAI dashboard to continue'
            : 'Select a report to continue',
        variant: 'error',
      });
      return;
    }
    onSave?.(selectedReport);
    onOpenChange(false);
    showToast({
      message:
        selectedReport.category === 'text-ai'
          ? `TextAI dashboard "${selectedReport.name}" added as a tab`
          : `Report tab "${selectedReport.name}" added`,
      variant: 'success',
    });
  }

  return (
    <WuModal open onOpenChange={onOpenChange} size="lg" maxHeight="90vh">
      <WuModalHeader>New report tab</WuModalHeader>
      <WuModalContent className={styles.modalContent}>
        <div className={styles.layout}>
          <aside className={styles.sidebar} aria-label="Report types">
            {DASHBOARD_REPORT_TAB_CATEGORIES.map((item) => {
              const isActive = item.id === category;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`${styles.sidebarItem} ${
                    isActive ? styles.sidebarItemActive : ''
                  }`}
                  onClick={() => {
                    setCategory(item.id);
                    setSearch('');
                    setSelectedReportId(null);
                  }}
                >
                  <span>{item.label}</span>
                  {item.comingSoon ? (
                    <span className={styles.comingSoonBadge}>Coming soon</span>
                  ) : null}
                </button>
              );
            })}
          </aside>

          <div className={styles.main}>
            {isComingSoon ? (
              <div className={styles.comingSoonPanel}>
                <p className={styles.comingSoonTitle}>Conjoint reports</p>
                <p className={styles.comingSoonCopy}>
                  Conjoint report tabs are coming soon. Choose Crosstab or Text AI
                  to add a report tab now.
                </p>
              </div>
            ) : (
              <>
                <div className={styles.toolbar}>
                  <WuInput
                    variant="outlined"
                    placeholder="Search"
                    Icon={<span className="wm-search" />}
                    iconPosition="left"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className={styles.searchInput}
                  />
                  <div className={styles.rangeControl} aria-live="polite">
                    <button
                      type="button"
                      className={styles.rangeArrow}
                      aria-label="Previous page"
                      disabled
                    >
                      <span className="wm-chevron-left" aria-hidden />
                    </button>
                    <span className={styles.rangeLabel}>{rangeLabel}</span>
                    <button
                      type="button"
                      className={styles.rangeArrow}
                      aria-label="Next page"
                      disabled
                    >
                      <span className="wm-chevron-right" aria-hidden />
                    </button>
                  </div>
                </div>

                {filteredReports.length === 0 ? (
                  <p className={styles.emptyState}>
                    {category === 'text-ai'
                      ? 'No TextAI dashboards match your search.'
                      : 'No reports match your search.'}
                  </p>
                ) : (
                  <div className={styles.tableWrap}>
                    <WuTable
                      data={filteredReports as unknown[]}
                      columns={
                        columns as unknown as IWuTableColumnDef<unknown>[]
                      }
                      sort={{ enabled: true }}
                      filterText=""
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </WuModalContent>
      <WuModalFooter>
        <WuButton
          onClick={handleSave}
          disabled={isComingSoon || selectedReport == null}
        >
          Save
        </WuButton>
      </WuModalFooter>
    </WuModal>
  );
}
