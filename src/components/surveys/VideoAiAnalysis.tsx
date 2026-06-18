'use client';

import dynamic from 'next/dynamic';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  VIDEO_AI_QUESTIONS,
  getVideoAiSummaryMetrics,
  VIDEO_AI_SURVEY_OPTIONS,
  VIDEO_AI_SENTIMENT_OPTIONS,
  type VideoAiQuestion,
  type FilterOption,
} from '@/data/mock-video-ai';
import {
  saveVideoAiReturnState,
  videoAiDetailHref,
} from '@/components/video-ai/videoAiNavigation';
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

const SUMMARY_METRIC_ICONS = {
  questions: 'wm-help-outline',
  responses: 'wm-group',
  duration: 'wm-schedule',
  minutes: 'wm-timer',
} as const;

function SummaryMetricCard({
  value,
  label,
  icon,
  valueAriaLabel,
}: {
  value: string | number;
  label: string;
  icon: string;
  valueAriaLabel?: string;
}) {
  return (
    <div className={styles.metricCard}>
      <div className={styles.metricCardValue} aria-label={valueAriaLabel}>
        {value}
      </div>
      <div className={styles.metricCardRule} aria-hidden />
      <div className={styles.metricCardLabel}>
        <span className={`${icon} ${styles.metricCardIcon}`} aria-hidden />
        <span>{label}</span>
      </div>
    </div>
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
        <div className={styles.questionIconWrap} aria-hidden>
          <span className={`wm-videocam ${styles.questionIcon}`} />
        </div>

        <div className={styles.cardContent}>
          <p className={styles.questionText}>{question.question}</p>
          {question.status === 'pending' && (
            <div className={styles.metaRow}>
              <span className={`${styles.chip} ${styles.statusPending}`}>
                <span className={`wm-schedule ${styles.chipIcon}`} aria-hidden />
                Pending
              </span>
            </div>
          )}
        </div>

        <div className={styles.cardRight}>
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

export function VideoAiAnalysis({ surveyId }: { surveyId: number }) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [questionFilter, setQuestionFilter] = useState<FilterOption>(VIDEO_AI_SURVEY_OPTIONS[0]);
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
    if (questionFilter.value !== 'all') {
      result = result.filter((item) => item.survey === questionFilter.value);
    }
    if (sentimentFilter.value !== 'all') {
      result = result.filter((item) => item.dominantSentiment === sentimentFilter.value);
    }
    return result;
  }, [search, questionFilter, sentimentFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function applyFilter<T>(setter: (v: T) => void, value: T) {
    setter(value);
    setPage(1);
  }

  const startItem = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endItem = Math.min(page * PAGE_SIZE, filtered.length);
  const summaryMetrics = getVideoAiSummaryMetrics();

  return (
    <div className={styles.page}>
      {/* ── Tab-style page header ───────────────────────────────────── */}
      <div className={styles.tabBar}>
        <div className={styles.tabBarInner}>
          <div className={styles.activeTab}>
            <span className={`wm-videocam ${styles.activeTabIcon}`} aria-hidden />
            <span className={styles.activeTabLabel}>VideoAI Analysis</span>
            <a
              href="https://www.questionpro.com/help/livecast.html"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.helpBtn}
              aria-label="VideoAI Analysis help documentation"
              title="View VideoAI Analysis help documentation"
            >
              ?
            </a>
          </div>
        </div>
      </div>

      {/* ── Summary metric cards ────────────────────────────────────── */}
      <div className={styles.metricsPanel} role="region" aria-label="Summary metrics">
        <SummaryMetricCard
          value={summaryMetrics.questionCount}
          label="Questions"
          icon={SUMMARY_METRIC_ICONS.questions}
        />
        <SummaryMetricCard
          value={summaryMetrics.totalResponses}
          label="Total Responses"
          icon={SUMMARY_METRIC_ICONS.responses}
        />
        <SummaryMetricCard
          value={summaryMetrics.avgResponseDuration}
          label="Average Duration"
          icon={SUMMARY_METRIC_ICONS.duration}
        />
        <SummaryMetricCard
          value={`${summaryMetrics.minutesConsumed} / ${summaryMetrics.minutesLeft}`}
          label="Minutes Used/Left"
          icon={SUMMARY_METRIC_ICONS.minutes}
          valueAriaLabel={`${summaryMetrics.minutesConsumed} minutes used, ${summaryMetrics.minutesLeft} minutes left`}
        />
      </div>

      {/* ── Search & filters ───────────────────────────────────────── */}
      <div className={styles.filterBar} role="search" aria-label="Search and filter questions">
        <div className={styles.searchInput}>
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
          value={questionFilter}
          onSelect={(opt) => {
            if (opt) applyFilter(setQuestionFilter, opt as FilterOption);
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
              onClick={() => {
                saveVideoAiReturnState(surveyId);
                router.push(videoAiDetailHref(q.id, surveyId));
              }}
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
