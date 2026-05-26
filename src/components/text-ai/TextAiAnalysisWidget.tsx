'use client';

import { useMemo, useState } from 'react';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { StandardLoader } from '@/components/ui/StandardLoader';
import { useWickUILib } from '@/components/ui/useWickUILib';
import type { TextAiAnalysisRow, TextAiAnalysisWidget } from '@/data/mock-text-ai-widget-data';
import styles from './TextAiAnalysisWidget.module.css';

const PAGE_SIZE_OPTIONS = [
  { value: '50', label: '50' },
  { value: '100', label: '100' },
  { value: '200', label: '200' },
];

interface TextAiAnalysisWidgetProps {
  widget: TextAiAnalysisWidget;
}

function SubtopicPill({
  label,
  tone,
}: {
  label: string;
  tone: TextAiAnalysisRow['subtopicTone'];
}) {
  const isPositive = tone === 'positive';
  return (
    <span
      className={`${styles.subtopicPill} ${
        isPositive ? styles.subtopicPositive : styles.subtopicNeutral
      }`}
      title={label}
    >
      <span
        className={isPositive ? 'wm-check' : 'wm-sentiment-neutral'}
        aria-hidden
      />
      <span className={styles.subtopicLabel}>{label}</span>
    </span>
  );
}

export function TextAiAnalysisWidgetCard({ widget }: TextAiAnalysisWidgetProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[1]);

  const pageSizeNum = Number(pageSize.value);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return widget.rows;
    return widget.rows.filter(
      (row) =>
        row.value.toLowerCase().includes(term) ||
        row.topic.toLowerCase().includes(term) ||
        row.subtopic.toLowerCase().includes(term) ||
        row.insight.toLowerCase().includes(term) ||
        row.tags.some((tag) => tag.toLowerCase().includes(term))
    );
  }, [search, widget.rows]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSizeNum));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = useMemo(() => {
    const start = safePage * pageSizeNum;
    return filteredRows.slice(start, start + pageSizeNum);
  }, [filteredRows, safePage, pageSizeNum]);

  const rangeStart = filteredRows.length === 0 ? 0 : safePage * pageSizeNum + 1;
  const rangeEnd = Math.min((safePage + 1) * pageSizeNum, filteredRows.length);

  const columns: IWuTableColumnDef<TextAiAnalysisRow>[] = [
    {
      accessorKey: 'value',
      header: 'Value',
      enableSorting: true,
      cell: ({ row }) => <span className={styles.valueCell}>{row.original.value}</span>,
    },
    {
      accessorKey: 'topic',
      header: 'Topics',
      enableSorting: true,
      cell: ({ row }) => <span className={styles.topicCell}>{row.original.topic}</span>,
    },
    {
      accessorKey: 'subtopic',
      header: 'Subtopics',
      enableSorting: true,
      cell: ({ row }) => (
        <div className={styles.subtopicCell}>
          <SubtopicPill label={row.original.subtopic} tone={row.original.subtopicTone} />
        </div>
      ),
    },
    {
      accessorKey: 'insight',
      header: 'Insights',
      cell: ({ row }) => <span className={styles.insightCell}>{row.original.insight}</span>,
    },
    {
      accessorKey: 'tags',
      header: 'Tags',
      cell: ({ row }) => (
        <span className={styles.tagsCell}>{row.original.tags.join(', ')}</span>
      ),
    },
  ];

  if (!wick) {
    return (
      <article className={styles.card}>
        <StandardLoader message="Loading widget…" />
      </article>
    );
  }

  const { WuButton, WuInput, WuSelect, WuTable } = wick;

  return (
    <article className={styles.card}>
      <header className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>{widget.question}</h2>
        <WuButton
          variant="iconOnly"
          size="sm"
          aria-label="Widget menu"
          onClick={() => showToast({ message: 'Widget menu', variant: 'success' })}
          Icon={<span className="wm-more-vert" />}
        />
      </header>

      <div className={styles.toolbar}>
        <WuInput
          variant="outlined"
          placeholder="Search"
          Icon={<span className="wm-search" />}
          iconPosition="left"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className={styles.searchInput}
        />
        <div className={styles.paginationBar}>
          <WuButton
            variant="iconOnly"
            size="sm"
            aria-label="Previous page"
            disabled={safePage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            Icon={<span className="wm-chevron-left" />}
          />
          <span className={styles.pageRange}>
            {rangeStart} - {rangeEnd || pageSizeNum}
          </span>
          <WuButton
            variant="iconOnly"
            size="sm"
            aria-label="Next page"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            Icon={<span className="wm-chevron-right" />}
          />
          <WuSelect
            data={PAGE_SIZE_OPTIONS}
            accessorKey={{ value: 'value', label: 'label' }}
            value={pageSize}
            onSelect={(option) => {
              if (!option) return;
              setPageSize(option as (typeof PAGE_SIZE_OPTIONS)[number]);
              setPage(0);
            }}
            variant="outlined"
            className={styles.pageSizeSelect}
          />
        </div>
      </div>

      <div className={styles.tableWrap}>
        <WuTable
          data={pageRows as unknown[]}
          columns={columns as unknown as IWuTableColumnDef<unknown>[]}
          sort={{ enabled: true }}
          filterText=""
        />
      </div>
    </article>
  );
}
