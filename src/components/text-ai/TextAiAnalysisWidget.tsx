"use client";

import { useMemo, useState } from "react";
import {
  defaultTextAiWidgetSettings,
  matchesTextAiFilters,
  type TextAiWidgetSettingsProps,
} from "@/data/text-ai-widget-settings";
import type { IWuTableColumnDef } from "@npm-questionpro/wick-ui-lib";
import { StandardLoader } from "@/components/ui/StandardLoader";
import { TextAiEmergingBadge } from "@/components/text-ai/TextAiEmergingBadge";
import { TextAiWidgetMenu } from "@/components/text-ai/TextAiWidgetMenu";
import { useWickUILib } from "@/components/ui/useWickUILib";
import type {
  TextAiAnalysisRow,
  TextAiAnalysisWidget,
} from "@/data/mock-text-ai-widget-data";
import {
  DEFAULT_TEXT_AI_WIDGET_TOP_N,
  limitTextAiWidgetItems,
  type TextAiWidgetTopN,
} from "@/data/mock-text-ai-widget-settings";
import styles from "./TextAiAnalysisWidget.module.css";

const EMPTY_RESPONSE_FILTERS: NonNullable<
  TextAiWidgetSettingsProps["responseFilters"]
> = [];

const byColumn: Record<string, number> = {
  Responses: 0,
  Themes: 1,
  "Sub-themes": 2,
  Insights: 3,
  Tags: 4,
  "Collected on": 5,
};

const PAGE_SIZE_OPTIONS = [
  { value: "10", label: "10" },
  { value: "25", label: "25" },
  { value: "50", label: "50" },
  { value: "100", label: "100" },
];

interface TextAiAnalysisWidgetProps extends TextAiWidgetSettingsProps {
  widget: TextAiAnalysisWidget;
  onDelete?: () => void;
}

function SubtopicPill({
  label,
  tone,
}: {
  label: string;
  tone: TextAiAnalysisRow["subtopicTone"];
}) {
  const isPositive = tone === "positive";
  return (
    <span
      className={`${styles.subtopicPill} ${
        isPositive ? styles.subtopicPositive : styles.subtopicNeutral
      }`}
      title={label}
    >
      <span
        className={isPositive ? "wm-check" : "wm-sentiment-neutral"}
        aria-hidden
      />
      <span className={styles.subtopicLabel}>{label}</span>
    </span>
  );
}

export function TextAiAnalysisWidgetCard({
  widget,
  onDelete,
  settings,
  onOpenSettings,
  responseFilters = EMPTY_RESPONSE_FILTERS,
  preview,
}: TextAiAnalysisWidgetProps) {
  const s =
    settings ?? defaultTextAiWidgetSettings("text-viewer", widget.question);
  const wick = useWickUILib();
  const [topN, setTopN] = useState<TextAiWidgetTopN>(
    DEFAULT_TEXT_AI_WIDGET_TOP_N,
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const localPageSize = PAGE_SIZE_OPTIONS[3];
  const pageSize = settings
    ? (PAGE_SIZE_OPTIONS.find(
        (option) => Number(option.value) === s.pageSize,
      ) ?? PAGE_SIZE_OPTIONS[3])
    : localPageSize;

  const pageSizeNum = Number(pageSize.value);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const sourceRows = limitTextAiWidgetItems(widget.rows, topN)
      .filter((row) => matchesTextAiFilters(row, responseFilters))
      .sort((a, b) =>
        s.dateOrder === "Newest first"
          ? (b.collectedOn ?? "").localeCompare(a.collectedOn ?? "")
          : (a.collectedOn ?? "").localeCompare(b.collectedOn ?? ""),
      );
    if (!term) return sourceRows;
    return sourceRows.filter(
      (row) =>
        row.value.toLowerCase().includes(term) ||
        row.topic.toLowerCase().includes(term) ||
        row.subtopic.toLowerCase().includes(term) ||
        row.insight.toLowerCase().includes(term) ||
        row.tags.some((tag) => tag.toLowerCase().includes(term)),
    );
  }, [search, topN, widget.rows, responseFilters, s.dateOrder]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSizeNum));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = useMemo(() => {
    const start = safePage * pageSizeNum;
    return filteredRows.slice(start, start + pageSizeNum);
  }, [filteredRows, safePage, pageSizeNum]);

  const rangeStart = filteredRows.length === 0 ? 0 : safePage * pageSizeNum + 1;
  const rangeEnd = Math.min((safePage + 1) * pageSizeNum, filteredRows.length);

  const columns = useMemo<IWuTableColumnDef<TextAiAnalysisRow>[]>(
    () => [
      {
        accessorKey: "value",
        header: "Responses",
        enableSorting: true,
        cell: ({ row }) => (
          <span className={styles.valueCell}>{row.original.value}</span>
        ),
      },
      {
        accessorKey: "topic",
        header: "Themes",
        enableSorting: false,
        cell: ({ row }) => (
          <span className={styles.topicCell}>
            <span>{row.original.topic}</span>
            {row.original.topicEmerging ? <TextAiEmergingBadge /> : null}
          </span>
        ),
      },
      {
        accessorKey: "subtopic",
        header: "Sub-themes",
        enableSorting: false,
        cell: ({ row }) => (
          <div className={styles.subtopicCell}>
            {s.highlightSentiment ? (
              <SubtopicPill
                label={row.original.subtopic}
                tone={row.original.subtopicTone}
              />
            ) : (
              <span>{row.original.subtopic}</span>
            )}
            {row.original.subtopicEmerging ? <TextAiEmergingBadge /> : null}
          </div>
        ),
      },
      {
        accessorKey: "insight",
        header: "Insights",
        cell: ({ row }) => (
          <span className={styles.insightCell}>{row.original.insight}</span>
        ),
      },
      {
        accessorKey: "tags",
        header: "Tags",
        cell: ({ row }) => (
          <span className={styles.tagsCell}>
            {row.original.tags.join(", ")}
          </span>
        ),
      },
      {
        accessorKey: "collectedOn",
        header: "Collected on",
        enableSorting: true,
        cell: ({ row }) => <span>{row.original.collectedOn ?? "—"}</span>,
      },
    ],
    [s.highlightSentiment],
  );
  const visibleColumns = useMemo(
    () => s.columns.map((label) => columns[byColumn[label]]).filter(Boolean),
    [s.columns, columns],
  );

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
        <h2 className={styles.cardTitle}>{s.showName ? s.name : ""}</h2>
        <TextAiWidgetMenu
          widgetTitle={widget.question}
          onOpenSettings={onOpenSettings}
          preview={preview}
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
            Icon={<span className="wm-arrow-back-ios-new" />}
          />
          <WuSelect
            data={Array.from({ length: pageCount }, (_, index) => ({
              value: String(index),
              label: `${filteredRows.length ? index * pageSizeNum + 1 : 0} - ${Math.min((index + 1) * pageSizeNum, filteredRows.length)}`,
            }))}
            accessorKey={{ value: "value", label: "label" }}
            value={{ value: String(safePage), label: `${rangeStart} - ${rangeEnd}` }}
            onSelect={(option) => { if (option) setPage(Number((option as { value: string }).value)); }}
            variant="flat"
            aria-label="Response page"
            className={styles.pageRange}
          />
          <WuButton
            variant="iconOnly"
            size="sm"
            aria-label="Next page"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            Icon={<span className="wm-arrow-forward-ios" />}
          />

        </div>
      </div>

      <div className={`${styles.tableWrap} ${s.wrap ? "" : styles.truncated}`}>
        <WuTable
          data={pageRows as unknown[]}
          columns={visibleColumns as unknown as IWuTableColumnDef<unknown>[]}
          sort={{ enabled: true }}
          filterText=""
        />
      </div>
      {s.showBase && (
        <p className={styles.baseNote}>
          Matching analyzed responses: {filteredRows.length} of{" "}
          {widget.rows.length}
        </p>
      )}
    </article>
  );
}
