'use client';

import dynamic from 'next/dynamic';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  VIDEO_AI_QUESTIONS,
  VIDEO_AI_SURVEY_OPTIONS,
  VIDEO_AI_STATUS_OPTIONS,
  VIDEO_AI_SENTIMENT_OPTIONS,
  type VideoAiQuestion,
  type FilterOption,
} from '@/data/mock-video-ai';
import styles from './VideoAiAnalysis.module.css';

const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

const PAGE_SIZE = 6;

const TOTAL_METRICS = {
  questions: VIDEO_AI_QUESTIONS.length,
  surveys: new Set(VIDEO_AI_QUESTIONS.map((q) => q.survey)).size,
  responses: VIDEO_AI_QUESTIONS.reduce((sum, q) => sum + q.responses, 0),
  minutesLeft: 348,
};

function StatusChip({ status }: { status: VideoAiQuestion['status'] }) {
  const config: Record<
    VideoAiQuestion['status'],
    { label: string; icon: string; className: string }
  > = {
    complete: {
      label: 'Active',
      icon: 'wm-radio-button-on',
      className: styles.statusActive,
    },
    'in-progress': {
      label: 'Closed',
      icon: 'wm-lock',
      className: styles.statusClosed,
    },
    pending: {
      label: 'Pending',
      icon: 'wm-schedule',
      className: styles.statusPending,
    },
  };
  const { label, icon, className } = config[status];
  return (
    <span className={`${styles.chip} ${className}`}>
      <span className={`${icon} ${styles.chipIcon}`} aria-hidden />
      {label}
    </span>
  );
}

function SentimentBar({
  sentiment,
  analyzed,
}: {
  sentiment: VideoAiQuestion['sentiment'];
  analyzed: number;
}) {
  if (analyzed === 0) {
    return <span className={styles.awaitingAnalysis}>Awaiting analysis</span>;
  }
  const { positive, neutral, negative } = sentiment;
  return (
    <div className={styles.sentimentBarWrap}>
      <div
        className={styles.sentimentBar}
        role="img"
        aria-label={`${positive}% positive, ${neutral}% neutral, ${negative}% negative`}
      >
        {positive > 0 && <div className={styles.sentimentPos} style={{ width: `${positive}%` }} />}
        {neutral > 0 && <div className={styles.sentimentNeu} style={{ width: `${neutral}%` }} />}
        {negative > 0 && <div className={styles.sentimentNeg} style={{ width: `${negative}%` }} />}
      </div>
      <div className={styles.sentimentTooltip} role="tooltip" aria-hidden>
        <span className={styles.posText}>{positive}% Positive</span>
        <span className={styles.sepDot}>·</span>
        <span className={styles.neuText}>{neutral}% Neutral</span>
        <span className={styles.sepDot}>·</span>
        <span className={styles.negText}>{negative}% Negative</span>
        <div className={styles.tooltipArrow} />
      </div>
    </div>
  );
}

function QuestionCard({
  question,
  onClick,
}: {
  question: VideoAiQuestion;
  onClick: () => void;
}) {
  return (
    <article
      className={styles.card}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`View analysis for: ${question.question}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className={styles.cardTop}>
        <div className={styles.thumbnail} aria-hidden>
          <svg className={styles.thumbnailSvg} viewBox="0 0 90 65" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="90" height="65" fill="#e8ecf1"/>
            {/* person silhouette */}
            <circle cx="45" cy="23" r="10" fill="#b8c0cc"/>
            <path d="M27 58 Q27 41 45 41 Q63 41 63 58Z" fill="#b8c0cc"/>
            {/* record indicator */}
            <circle cx="75" cy="53" r="7" fill="#e53935" opacity="0.15"/>
            <circle cx="75" cy="53" r="4.5" fill="#e53935"/>
          </svg>
        </div>

        <div className={styles.cardContent}>
          <p className={styles.questionText}>{question.question}</p>
          <div className={styles.metaRow}>
            <StatusChip status={question.status} />
          </div>
        </div>

        <div className={styles.cardRight}>
          <span className={styles.dateText}>{question.date}</span>
          <span className={`wm-chevron-right ${styles.chevron}`} aria-hidden />
        </div>
      </div>

      <div className={styles.cardBottom}>
        <div className={styles.metricItem}>
          <span className={`wm-group ${styles.metricIcon}`} aria-hidden />
          <span className={styles.metricLabel}>Responses</span>
          <span className={styles.metricValue}>{question.responses}</span>
        </div>

        <div className={styles.metricDivider} aria-hidden />

        <div className={styles.metricItem}>
          <span className={`wc-ai ${styles.metricIcon}`} aria-hidden />
          <span className={styles.metricLabel}>Analyzed</span>
          <span className={styles.metricValue}>
            {question.analyzed} / {question.responses}
          </span>
        </div>

        <div className={styles.metricDivider} aria-hidden />

        <div className={`${styles.metricItem} ${styles.metricItemSentiment}`}>
          <span className={styles.metricLabel}>Sentiment</span>
          <SentimentBar sentiment={question.sentiment} analyzed={question.analyzed} />
        </div>
      </div>
    </article>
  );
}

export function VideoAiAnalysis() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [surveyFilter, setSurveyFilter] = useState<FilterOption>(VIDEO_AI_SURVEY_OPTIONS[0]);
  const [statusFilter, setStatusFilter] = useState<FilterOption>(VIDEO_AI_STATUS_OPTIONS[0]);
  const [sentimentFilter, setSentimentFilter] = useState<FilterOption>(
    VIDEO_AI_SENTIMENT_OPTIONS[0]
  );
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = VIDEO_AI_QUESTIONS;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (item) =>
          item.question.toLowerCase().includes(q) || item.survey.toLowerCase().includes(q)
      );
    }
    if (surveyFilter.value !== 'all') {
      result = result.filter((item) => item.survey === surveyFilter.value);
    }
    if (statusFilter.value !== 'all') {
      result = result.filter((item) => item.status === statusFilter.value);
    }
    if (sentimentFilter.value !== 'all') {
      result = result.filter((item) => item.dominantSentiment === sentimentFilter.value);
    }
    return result;
  }, [search, surveyFilter, statusFilter, sentimentFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function applyFilter<T>(setter: (v: T) => void, value: T) {
    setter(value);
    setPage(1);
  }

  const startItem = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, filtered.length);

  return (
    <div className={styles.page}>
      {/* ── Tab-style page header ───────────────────────────────────── */}
      <div className={styles.tabBar}>
        <div className={styles.tabBarInner}>
          <div className={styles.activeTab}>
            <span className={`wm-videocam ${styles.activeTabIcon}`} aria-hidden />
            <span className={styles.activeTabLabel}>VideoAI Analysis</span>
          </div>
          <button
            type="button"
            className={styles.helpBtn}
            title="VideoAI Analysis helps you understand open-ended video responses using AI sentiment analysis."
            aria-label="Help"
          >
            ?
          </button>
        </div>
      </div>

      {/* ── Summary metric cards ────────────────────────────────────── */}
      <div className={styles.metricsRow} role="region" aria-label="Summary metrics">
        <div className={styles.metricCard}>
          <span className={styles.metricCardValue}>{TOTAL_METRICS.questions}</span>
          <span className={styles.metricCardLabel}>Questions</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricCardValue}>{TOTAL_METRICS.surveys}</span>
          <span className={styles.metricCardLabel}>Surveys</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricCardValue}>{TOTAL_METRICS.responses}</span>
          <span className={styles.metricCardLabel}>Total Responses</span>
        </div>
        <div className={styles.metricCard}>
          <span className={styles.metricCardValue}>{TOTAL_METRICS.minutesLeft}</span>
          <span className={styles.metricCardLabel}>Minutes Left</span>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────────── */}
      <div className={styles.filterBar} role="search" aria-label="Filter questions">
        <div className={styles.searchWrap}>
          <WuInput
            variant="outlined"
            placeholder="Search by question or survey name…"
            Icon={<span className="wm-search" />}
            iconPosition="left"
            value={search}
            onChange={(e) => applyFilter(setSearch, e.target.value)}
          />
        </div>

        <WuSelect
          data={VIDEO_AI_SURVEY_OPTIONS}
          accessorKey={{ value: 'value', label: 'label' }}
          value={surveyFilter}
          onSelect={(opt) => {
            if (opt) applyFilter(setSurveyFilter, opt as FilterOption);
          }}
          variant="outlined"
          className={styles.filterSelect}
        />

        <WuSelect
          data={VIDEO_AI_STATUS_OPTIONS}
          accessorKey={{ value: 'value', label: 'label' }}
          value={statusFilter}
          onSelect={(opt) => {
            if (opt) applyFilter(setStatusFilter, opt as FilterOption);
          }}
          variant="outlined"
          className={styles.filterSelect}
        />

        <WuSelect
          data={VIDEO_AI_SENTIMENT_OPTIONS}
          accessorKey={{ value: 'value', label: 'label' }}
          value={sentimentFilter}
          onSelect={(opt) => {
            if (opt) applyFilter(setSentimentFilter, opt as FilterOption);
          }}
          variant="outlined"
          className={styles.filterSelect}
        />
      </div>

      {/* ── Card list ──────────────────────────────────────────────── */}
      <div className={styles.cardList}>
        {paginated.length === 0 ? (
          <div className={styles.emptyWrap}>
            <EmptyState
              icon="wm-videocam"
              title="No questions found"
              description="Try adjusting your search or filters to find VideoAI questions."
            />
          </div>
        ) : (
          paginated.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              onClick={() => router.push(`/video-ai/${q.id}`)}
            />
          ))
        )}
      </div>

      {/* ── Pagination ─────────────────────────────────────────────── */}
      {filtered.length > 0 && (
        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>
            Showing {startItem}–{endItem} of {filtered.length}{' '}
            {filtered.length === 1 ? 'question' : 'questions'}
          </span>
          <div className={styles.paginationControls}>
            <WuButton
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </WuButton>
            <WuButton
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </WuButton>
          </div>
        </div>
      )}
    </div>
  );
}
