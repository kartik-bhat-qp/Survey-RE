'use client';

import { useMemo, useState } from 'react';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { StandardLoader } from '@/components/ui/StandardLoader';
import { TextAiEmergingBadge } from '@/components/text-ai/TextAiEmergingBadge';
import { TextAiWidgetMenu } from '@/components/text-ai/TextAiWidgetMenu';
import { useWickUILib } from '@/components/ui/useWickUILib';
import type { TextAiAnalysisRow, TextAiAnalysisWidget } from '@/data/mock-text-ai-widget-data';
import {
  DEFAULT_TEXT_AI_WIDGET_TOP_N,
  limitTextAiWidgetItems,
  type TextAiWidgetTopN,
} from '@/data/mock-text-ai-widget-settings';
import styles from './TextAiAnalysisWidget.module.css';

const PAGE_SIZE_OPTIONS = [
  { value: '50', label: '50' },
  { value: '100', label: '100' },
  { value: '200', label: '200' },
];

interface TextAiAnalysisWidgetProps {
  widget: TextAiAnalysisWidget;
  onDelete?: () => void;
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

export function TextAiAnalysisWidgetCard({
  widget,
  onDelete,
}: TextAiAnalysisWidgetProps) {
  const wick = useWickUILib();
  const [topN, setTopN] = useState<TextAiWidgetTopN>(DEFAULT_TEXT_AI_WIDGET_TOP_N);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[1]);

  const pageSizeNum = Number(pageSize.value);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const sourceRows = limitTextAiWidgetItems(widget.rows, topN);
    if (!term) return sourceRows;
    return sourceRows.filter(
      (row) =>
        row.value.toLowerCase().includes(term) ||
        row.topic.toLowerCase().includes(term) ||
        row.subtopic.toLowerCase().includes(term) ||
        row.insight.toLowerCase().includes(term) ||
        row.tags.some((tag) => tag.toLowerCase().includes(term))
    );
  }, [search, topN, widget.rows]);

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
      cell: ({ row }) => (
        <span className={styles.topicCell}>
          <span>{row.original.topic}</span>
          {row.original.topicEmerging ? <TextAiEmergingBadge /> : null}
        </span>
      ),
    },
    {
      accessorKey: 'subtopic',
      header: 'Subtopics',
      enableSorting: true,
      cell: ({ row }) => (
        <div className={styles.subtopicCell}>
          <SubtopicPill label={row.original.subtopic} tone={row.original.subtopicTone} />
          {row.original.subtopicEmerging ? <TextAiEmergingBadge /> : null}
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
      <header className={`${styles.cardHeader} text-ai-widget-drag-handle`}>
        <h2 className={styles.cardTitle}>{widget.question}</h2>
        <TextAiWidgetMenu
          widgetTitle={widget.question}
          topN={topN}
          onTopNChange={(nextTopN) => {
            setTopN(nextTopN);
            setPage(0);
          }}
          onDelete={onDelete}
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
