'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  getSentimentVerbatimsForCell,
  type TextAiSentimentVerbatim,
  type TextAiVerbatimModalContext,
  type TextAiVerbatimSubtopicTone,
} from '@/data/mock-text-ai-sentiment-verbatims';
import styles from './TextAiSentimentResponsesModal.module.css';

const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);

const PAGE_SIZE = 100;

interface TextAiSentimentResponsesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: TextAiVerbatimModalContext | null;
}

function SubtopicTag({
  label,
  tone,
}: {
  label: string;
  tone: TextAiVerbatimSubtopicTone;
}) {
  const isPositive = tone === 'positive';
  return (
    <span
      className={`${styles.subtopicPill} ${
        isPositive ? styles.subtopicPositive : styles.subtopicNeutral
      }`}
    >
      <span className={isPositive ? 'wm-sentiment-satisfied' : 'wm-sentiment-neutral'} aria-hidden />
      {label}
    </span>
  );
}

function VerbatimEntry({ item }: { item: TextAiSentimentVerbatim }) {
  return (
    <article className={styles.entry}>
      <p className={styles.verbatimText}>{item.text}</p>
      <div className={styles.metaRow}>
        <span>
          <span className={styles.metaLabel}>Topic :</span>{' '}
          <span className={styles.topicValue}>{item.topic}</span>
        </span>
        <div className={styles.subtopicList}>
          <span className={styles.metaLabel}>Sub topic :</span>
          {item.subtopics.map((subtopic) => (
            <SubtopicTag key={subtopic.label} label={subtopic.label} tone={subtopic.tone} />
          ))}
        </div>
      </div>
    </article>
  );
}

export function TextAiSentimentResponsesModal({
  open,
  onOpenChange,
  context,
}: TextAiSentimentResponsesModalProps) {
  const wick = useWickUILib();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const allVerbatims = useMemo(() => {
    if (!context) return [];
    return getSentimentVerbatimsForCell(context);
  }, [context]);

  const filteredVerbatims = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return allVerbatims;
    return allVerbatims.filter(
      (item) =>
        item.text.toLowerCase().includes(term) ||
        item.topic.toLowerCase().includes(term) ||
        item.subtopics.some((subtopic) => subtopic.label.toLowerCase().includes(term))
    );
  }, [allVerbatims, search]);

  const themeHeading = context?.topicLabel ?? '';

  const pageCount = Math.max(1, Math.ceil(filteredVerbatims.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = useMemo(() => {
    const start = safePage * PAGE_SIZE;
    return filteredVerbatims.slice(start, start + PAGE_SIZE);
  }, [filteredVerbatims, safePage]);

  const rangeStart = filteredVerbatims.length === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const rangeEnd = Math.min((safePage + 1) * PAGE_SIZE, filteredVerbatims.length);

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setSearch('');
      setPage(0);
    }
    onOpenChange(nextOpen);
  }

  if (!open || !wick || !context) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuButton } = wick;

  return (
    <WuModal
      open
      onOpenChange={handleOpenChange}
      size="md"
      className={styles.modal}
    >
      <WuModalHeader className={styles.modalTitle}>Responses</WuModalHeader>
      <WuModalContent className={styles.content}>
        <div className={styles.toolbar}>
          <WuInput
            variant="outlined"
            placeholder="Search"
            Icon={<span className="wm-search" />}
            iconPosition="left"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
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
              onClick={() => setPage((value) => Math.max(0, value - 1))}
              Icon={<span className="wm-chevron-left" />}
            />
            <span className={styles.pageRange}>
              {filteredVerbatims.length === 0
                ? '0 - 0'
                : `${rangeStart} - ${rangeEnd}`}
            </span>
            <WuButton
              variant="iconOnly"
              size="sm"
              aria-label="Next page"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}
              Icon={<span className="wm-chevron-right" />}
            />
          </div>
        </div>

        {filteredVerbatims.length === 0 ? (
          <p className={styles.emptyState}>No responses match your search.</p>
        ) : (
          <section className={styles.themeGroup} aria-labelledby="sentiment-theme-heading">
            <h3 id="sentiment-theme-heading" className={styles.themeHeading}>
              {themeHeading}
            </h3>
            <div className={styles.list}>
              {pageRows.map((item) => (
                <VerbatimEntry key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}
      </WuModalContent>
    </WuModal>
  );
}
