'use client';

import type { TextAiAnalysisRow } from '@/data/mock-text-ai-widget-data';
import type { TextAiThemeSentimentRow } from '@/data/mock-text-ai-subtheme-stackbar';
import type { TextAiShareFilters } from '@/data/text-ai-sharing';
import styles from './TextAiSharing.module.css';

export const TEXT_AI_SHARE_SENTIMENTS = {
  veryNegative: 'Very negative',
  negative: 'Negative',
  mixed: 'Mixed',
  neutral: 'Neutral',
  positive: 'Positive',
  veryPositive: 'Very positive',
} as const;

export function matchesSharedTextAiResponse(row: TextAiAnalysisRow, filters: TextAiShareFilters): boolean {
  return (!filters.theme || row.topic.split(', ').includes(filters.theme)) &&
    (!filters.subtheme || row.subtopic.split(', ').includes(filters.subtheme)) &&
    (!filters.sentiment || (row.sentiment ?? row.subtopicTone) === filters.sentiment);
}

export function TextAiSharedFilters({ filters, onChange, themes, responses }: {
  filters: TextAiShareFilters;
  onChange: (filters: TextAiShareFilters) => void;
  themes: TextAiThemeSentimentRow[];
  responses: TextAiAnalysisRow[];
}) {
  const themeOptions = [...new Set([
    ...themes.map((row) => row.label),
    ...responses.flatMap((row) => row.topic.split(', ')),
  ])].sort();
  const subthemeOptions = [...new Set([
    ...themes.filter((row) => !filters.theme || row.label === filters.theme).flatMap((row) => row.subthemes.map((child) => child.label)),
    ...responses.filter((row) => !filters.theme || row.topic.split(', ').includes(filters.theme)).flatMap((row) => row.subtopic.split(', ')),
  ])].sort();

  return <section className={styles.filters} aria-label="Dashboard filters">
    <label>Theme
      <select aria-label="Theme" value={filters.theme} onChange={(event) => onChange({ ...filters, theme: event.target.value, subtheme: '' })}>
        <option value="">Select theme</option>
        {themeOptions.map((theme) => <option key={theme}>{theme}</option>)}
      </select>
    </label>
    <label>Sub-theme
      <select aria-label="Sub-theme" value={filters.subtheme} onChange={(event) => onChange({ ...filters, subtheme: event.target.value })}>
        <option value="">Select sub-theme</option>
        {subthemeOptions.map((subtheme) => <option key={subtheme}>{subtheme}</option>)}
      </select>
    </label>
    <label>Sentiment
      <select aria-label="Sentiment" value={filters.sentiment} onChange={(event) => onChange({ ...filters, sentiment: event.target.value })}>
        <option value="">Select sentiment</option>
        {Object.entries(TEXT_AI_SHARE_SENTIMENTS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
    </label>
  </section>;
}
