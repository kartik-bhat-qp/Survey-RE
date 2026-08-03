'use client';

import { useMemo, useState } from 'react';
import { StandardLoader } from '@/components/ui/StandardLoader';
import { TextAiEmergingBadge } from '@/components/text-ai/TextAiEmergingBadge';
import { TextAiWidgetMenu } from '@/components/text-ai/TextAiWidgetMenu';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  TEXT_AI_SUBTHEME_STACKBAR_ROWS,
  type TextAiSentimentBucket,
  type TextAiSentimentDistribution,
} from '@/data/mock-text-ai-subtheme-stackbar';
import type { TextAiThemeStatusFilter } from '@/data/mock-text-ai-widget-data';
import styles from './TextAiThemeStackbarWidget.module.css';

const SENTIMENT_BUCKETS: {
  key: TextAiSentimentBucket;
  label: string;
  color: string;
}[] = [
  { key: 'veryNegative', label: 'Very negative', color: '#f42638' },
  { key: 'negative', label: 'Negative', color: '#ff963f' },
  { key: 'mixed', label: 'Mixed', color: '#ffc94b' },
  { key: 'neutral', label: 'Neutral', color: '#ecece1' },
  { key: 'positive', label: 'Positive', color: '#a8d52a' },
  { key: 'veryPositive', label: 'Very positive', color: '#31964a' },
];

interface TextAiThemeStackbarWidgetProps {
  question: string;
  themeStatus: TextAiThemeStatusFilter;
  onDelete?: () => void;
}

function formatThemeLabel(label: string): string {
  return `${label.charAt(0)}${label.slice(1).toLowerCase()}`;
}

function SentimentStackbar({
  distribution,
  label,
  activeBuckets,
}: {
  distribution: TextAiSentimentDistribution;
  label: string;
  activeBuckets: Set<TextAiSentimentBucket>;
}) {
  const visibleBuckets = SENTIMENT_BUCKETS.filter((bucket) =>
    activeBuckets.has(bucket.key)
  );
  const visibleTotal = visibleBuckets.reduce(
    (total, bucket) => total + distribution[bucket.key],
    0
  );
  const ariaSummary = visibleBuckets.map(
    (bucket) => `${bucket.label} ${distribution[bucket.key]}%`
  ).join(', ');

  if (visibleTotal <= 0) {
    return (
      <div
        className={`${styles.stackbar} ${styles.emptyStackbar}`}
        role="img"
        aria-label={`${label} sentiment: no selected sentiment data`}
      >
        No selected sentiment
      </div>
    );
  }

  return (
    <div
      className={styles.stackbar}
      role="img"
      aria-label={`${label} sentiment: ${ariaSummary}`}
    >
      {visibleBuckets.map((bucket) => {
        const value = distribution[bucket.key];
        if (value <= 0) return null;

        return (
          <span
            key={bucket.key}
            className={`${styles.segment} ${
              bucket.key === 'neutral' ? styles.neutralSegment : ''
            }`}
            style={{
              backgroundColor: bucket.color,
              width: `${(value / visibleTotal) * 100}%`,
            }}
            title={`${bucket.label}: ${value}%`}
          >
            {value >= 5 ? `${value}%` : null}
          </span>
        );
      })}
    </div>
  );
}

export function TextAiThemeStackbarWidget({
  question,
  themeStatus,
  onDelete,
}: TextAiThemeStackbarWidgetProps) {
  const wick = useWickUILib();
  const [activeSentimentBuckets, setActiveSentimentBuckets] = useState<
    Set<TextAiSentimentBucket>
  >(() => new Set(SENTIMENT_BUCKETS.map((bucket) => bucket.key)));
  const visibleThemes = useMemo(() => {
    if (themeStatus === 'all') return TEXT_AI_SUBTHEME_STACKBAR_ROWS;
    return TEXT_AI_SUBTHEME_STACKBAR_ROWS.filter((theme) =>
      themeStatus === 'emerging' ? theme.emerging : !theme.emerging
    );
  }, [themeStatus]);

  function toggleSentiment(bucket: TextAiSentimentBucket): void {
    setActiveSentimentBuckets((current) => {
      const next = new Set(current);
      if (next.has(bucket)) next.delete(bucket);
      else next.add(bucket);
      return next;
    });
  }

  if (!wick) {
    return (
      <article className={styles.card}>
        <StandardLoader message="Loading widget…" />
      </article>
    );
  }

  return (
    <article className={styles.card}>
      <header className={`${styles.cardHeader} text-ai-widget-drag-handle`}>
        <h2 className={styles.cardTitle}>{question}</h2>
        <TextAiWidgetMenu widgetTitle={question} onDelete={onDelete} />
      </header>

      <div className={styles.rows}>
        {visibleThemes.map((theme) => (
          <div className={styles.themeRow} key={theme.id}>
            <span className={styles.themeLabel}>
              <span>{formatThemeLabel(theme.label)}</span>
              {theme.emerging ? <TextAiEmergingBadge /> : null}
            </span>
            <SentimentStackbar
              distribution={theme.sentiment}
              label={theme.label}
              activeBuckets={activeSentimentBuckets}
            />
          </div>
        ))}
      </div>

      <footer className={styles.legend} aria-label="Theme sentiment legend">
        {SENTIMENT_BUCKETS.map((bucket) => {
          const selected = activeSentimentBuckets.has(bucket.key);

          return (
            <button
              type="button"
              className={`${styles.legendItem} ${
                selected ? '' : styles.legendItemDeselected
              }`}
              key={bucket.key}
              aria-label={`${selected ? 'Hide' : 'Show'} ${bucket.label} sentiment`}
              aria-pressed={selected}
              onClick={() => toggleSentiment(bucket.key)}
            >
              <span
                className={styles.legendSwatch}
                style={{ backgroundColor: bucket.color }}
                aria-hidden
              />
              {bucket.label}
            </button>
          );
        })}
      </footer>
    </article>
  );
}
