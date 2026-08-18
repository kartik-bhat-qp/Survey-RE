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
import {
  DEFAULT_TEXT_AI_WIDGET_TOP_N,
  limitTextAiWidgetItems,
  type TextAiWidgetTopN,
} from '@/data/mock-text-ai-widget-settings';
import type { TextAiThemePreferences } from '@/data/text-ai-theme-preferences';
import styles from './TextAiSubthemeStackbarWidget.module.css';

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

interface TextAiSubthemeStackbarWidgetProps {
  question: string;
  themeStatus: TextAiThemeStatusFilter;
  onDelete?: () => void;
  themePreferences: TextAiThemePreferences;
}

function SentimentStackbar({
  distribution,
  label,
  activeBuckets,
  compact = false,
}: {
  distribution: TextAiSentimentDistribution;
  label: string;
  activeBuckets: Set<TextAiSentimentBucket>;
  compact?: boolean;
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
        className={`${styles.stackbar} ${styles.emptyStackbar} ${
          compact ? styles.stackbarCompact : ''
        }`}
        role="img"
        aria-label={`${label} sentiment: no selected sentiment data`}
      >
        No selected sentiment
      </div>
    );
  }

  return (
    <div
      className={`${styles.stackbar} ${compact ? styles.stackbarCompact : ''}`}
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
            {value >= 6 ? `${value}%` : null}
          </span>
        );
      })}
    </div>
  );
}

export function TextAiSubthemeStackbarWidget({
  question,
  themeStatus,
  onDelete,
  themePreferences,
}: TextAiSubthemeStackbarWidgetProps) {
  const wick = useWickUILib();
  const [topN, setTopN] = useState<TextAiWidgetTopN>(DEFAULT_TEXT_AI_WIDGET_TOP_N);
  const [expandedThemeIds, setExpandedThemeIds] = useState<Set<string>>(
    () => new Set()
  );
  const [activeSentimentBuckets, setActiveSentimentBuckets] = useState<
    Set<TextAiSentimentBucket>
  >(() => new Set(SENTIMENT_BUCKETS.map((bucket) => bucket.key)));
  const visibleThemes = useMemo(() => {
    const filtered = TEXT_AI_SUBTHEME_STACKBAR_ROWS.flatMap((theme) => {
      const themeEmerging = Boolean(theme.emerging);
      const themeApproved =
        !themeEmerging ||
        themePreferences.autoApproveEmergingThemes ||
        themePreferences.approvedEmergingNames.includes(theme.label);
      const approvedSubthemes = theme.subthemes.filter(
        (subtheme) =>
          !(themeEmerging || subtheme.emerging) ||
          themePreferences.autoApproveEmergingThemes ||
          themePreferences.approvedEmergingNames.includes(subtheme.label)
      );

      if (themeStatus === 'all') {
        if (!themeApproved) return [];
        return [{ ...theme, subthemes: approvedSubthemes }];
      }

      if (themeStatus === 'emerging') {
        const subthemes = approvedSubthemes.filter(
          (subtheme) =>
            (themeEmerging || subtheme.emerging) &&
            (themeApproved ||
              themePreferences.approvedEmergingNames.includes(subtheme.label))
        );
        if ((!themeEmerging || !themeApproved) && subthemes.length === 0) return [];
        return [{ ...theme, subthemes }];
      }

      if (themeEmerging) return [];
      return [
        {
          ...theme,
          subthemes: theme.subthemes.filter((subtheme) => !subtheme.emerging),
        },
      ];
    });

    return limitTextAiWidgetItems(filtered, topN);
  }, [themePreferences, themeStatus, topN]);

  function toggleTheme(themeId: string): void {
    setExpandedThemeIds((current) => {
      const next = new Set(current);
      if (next.has(themeId)) next.delete(themeId);
      else next.add(themeId);
      return next;
    });
  }

  function toggleAllThemes(): void {
    setExpandedThemeIds((current) => {
      const next = new Set(current);
      const allVisibleExpanded = visibleThemes.every((theme) => next.has(theme.id));

      visibleThemes.forEach((theme) => {
        if (allVisibleExpanded) next.delete(theme.id);
        else next.add(theme.id);
      });
      return next;
    });
  }

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

  const { WuButton } = wick;
  const allThemesExpanded =
    visibleThemes.length > 0 &&
    visibleThemes.every((theme) => expandedThemeIds.has(theme.id));

  return (
    <article className={styles.card}>
      <header className={`${styles.cardHeader} text-ai-widget-drag-handle`}>
        <h2 className={styles.cardTitle}>{question}</h2>
        <div className={styles.headerActions}>
          <WuButton
            variant="secondary"
            size="sm"
            aria-label={allThemesExpanded ? 'Collapse all themes' : 'Expand all themes'}
            onClick={toggleAllThemes}
          >
            {allThemesExpanded ? 'Collapse all' : 'Expand all'}
          </WuButton>
          <TextAiWidgetMenu
            widgetTitle={question}
            topN={topN}
            onTopNChange={setTopN}
            onDelete={onDelete}
          />
        </div>
      </header>

      <div className={styles.tableHeader} aria-hidden>
        <span>Theme</span>
        <span>Sentiment</span>
      </div>

      <div className={styles.rows}>
        {visibleThemes.map((theme) => {
          const expanded = expandedThemeIds.has(theme.id);
          const subthemeRegionId = `subtheme-stackbar-${theme.id}`;

          return (
            <section className={styles.themeGroup} key={theme.id}>
              <div className={styles.themeRow}>
                <button
                  type="button"
                  className={styles.themeToggle}
                  aria-expanded={expanded}
                  aria-controls={subthemeRegionId}
                  onClick={() => toggleTheme(theme.id)}
                >
                  <span
                    className={expanded ? 'wm-keyboard-arrow-up' : 'wm-keyboard-arrow-down'}
                    aria-hidden
                  />
                  <span>{theme.label}</span>
                  {theme.emerging ? <TextAiEmergingBadge /> : null}
                </button>
                <SentimentStackbar
                  distribution={theme.sentiment}
                  label={theme.label}
                  activeBuckets={activeSentimentBuckets}
                />
              </div>

              {expanded ? (
                <div
                  id={subthemeRegionId}
                  className={styles.subthemeRows}
                  aria-label={`${theme.label} sub-themes`}
                >
                  {theme.subthemes.map((subtheme) => (
                    <div className={styles.subthemeRow} key={subtheme.id}>
                      <span className={styles.subthemeLabel}>
                        <span>{subtheme.label}</span>
                        {theme.emerging || subtheme.emerging ? (
                          <TextAiEmergingBadge />
                        ) : null}
                      </span>
                      <SentimentStackbar
                        distribution={subtheme.sentiment}
                        label={subtheme.label}
                        activeBuckets={activeSentimentBuckets}
                        compact
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>

      <footer className={styles.legend} aria-label="Sentiment legend">
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
