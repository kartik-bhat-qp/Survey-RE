'use client';

import { useState } from 'react';
import { TextAiWidgetMenu } from './TextAiWidgetMenu';
import { TEXT_AI_SUBTHEME_STACKBAR_ROWS, type TextAiSentimentBucket } from '@/data/mock-text-ai-subtheme-stackbar';
import type { TextAiThemePreferences } from '@/data/text-ai-theme-preferences';
import styles from './TextAiOverviewWidget.module.css';

export type TextAiOverviewKind = 'gauge' | 'bubble-chart' | 'trend-line' | 'theme-stacked-bar';
const BUCKETS: { key: TextAiSentimentBucket; label: string }[] = [
  { key: 'veryNegative', label: 'Very negative' }, { key: 'negative', label: 'Negative' },
  { key: 'mixed', label: 'Mixed' }, { key: 'neutral', label: 'Neutral' },
  { key: 'positive', label: 'Positive' }, { key: 'veryPositive', label: 'Very positive' },
];
const TITLES = { gauge: 'Gauge', 'bubble-chart': 'Bubble chart', 'trend-line': 'Trend line', 'theme-stacked-bar': 'Theme stacked bar' };
const PERIODS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
// Synthetic monthly distribution; each period sums to 100. These are prototype fixtures.
const TREND = [[5, 27, 8, 15, 30, 15], [4, 25, 8, 14, 32, 17], [4, 23, 7, 14, 34, 18], [3, 20, 7, 13, 36, 21], [3, 18, 6, 12, 38, 23], [2, 16, 6, 11, 40, 25]];
const color = (key: string) => `var(--dashboard-sentiment-${key})`;

export function TextAiOverviewWidget({ kind, question, onDelete, themePreferences }: { kind: TextAiOverviewKind; question: string; onDelete: () => void; themePreferences: TextAiThemePreferences }) {
  const [hidden, setHidden] = useState<string[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const rows = TEXT_AI_SUBTHEME_STACKBAR_ROWS.filter(row => !row.emerging || themePreferences.approvedEmergingNames.includes(row.label));
  const buckets = BUCKETS.filter(bucket => !hidden.includes(bucket.key));
  const values = BUCKETS.map(bucket => rows.length ? rows.reduce((sum, row) => sum + row.sentiment[bucket.key], 0) / rows.length : 0);
  const visibleTotal = buckets.reduce((sum, bucket) => sum + values[BUCKETS.indexOf(bucket)], 0);
  const toggle = (key: string) => setHidden(current => current.includes(key) ? current.filter(id => id !== key) : [...current, key]);
  const bubbleRows = selectedTheme ? rows.find(row => row.id === selectedTheme)?.subthemes.filter(row => !row.emerging || themePreferences.approvedEmergingNames.includes(row.label)) ?? [] : rows;
  return <article className={styles.card} aria-label={`${TITLES[kind]} widget`}>
    <header className={`${styles.header} text-ai-widget-drag-handle`}><div><h2>{question}</h2><span>{TITLES[kind]}</span></div><TextAiWidgetMenu widgetTitle={question} onDelete={onDelete} /></header>
    <div className={styles.body}>
      {kind === 'gauge' && <>
        <svg viewBox="0 0 500 265" className={styles.gauge} role="img" aria-label={`Sentiment gauge: ${BUCKETS.map((b, i) => `${b.label} ${values[i].toFixed(1)}%`).join(', ')}`}>
          <path d="M 60 225 A 190 190 0 0 1 440 225" fill="none" stroke="#f1f3f5" strokeWidth="58" />
          {buckets.map((bucket, bucketIndex) => { const value = values[BUCKETS.indexOf(bucket)]; const start = visibleTotal ? buckets.slice(0, bucketIndex).reduce((sum, entry) => sum + values[BUCKETS.indexOf(entry)], 0) / visibleTotal * 100 : 0; return <path key={bucket.key} d="M 60 225 A 190 190 0 0 1 440 225" pathLength="100" fill="none" stroke={color(bucket.key)} strokeWidth="58" strokeDasharray={`${visibleTotal ? value / visibleTotal * 100 : 0} 100`} strokeDashoffset={-start}><title>{`${bucket.label}: ${value.toFixed(1)}%`}</title></path>; })}
          <text x="250" y="195" textAnchor="middle" className={styles.metric}>{visibleTotal ? `${(values[4] + values[5]).toFixed(1)}%` : '—'}</text><text x="250" y="222" textAnchor="middle">Positive sentiment</text>
        </svg>
      </>}
      {kind === 'theme-stacked-bar' && <div className={styles.stacks}>{rows.map(row => <div className={styles.stackRow} key={row.id}><span>{row.label}</span><div className={styles.stack} role="img" aria-label={`${row.label}: ${BUCKETS.map(b => `${b.label} ${row.sentiment[b.key]}%`).join(', ')}`}>{buckets.map(bucket => <span key={bucket.key} title={`${bucket.label}: ${row.sentiment[bucket.key]}%`} style={{ flex: row.sentiment[bucket.key], background: color(bucket.key), color: `var(--dashboard-sentiment-${bucket.key}-text)` }}>{row.sentiment[bucket.key] >= 10 ? `${row.sentiment[bucket.key]}%` : ''}</span>)}</div></div>)}</div>}
      {kind === 'bubble-chart' && <>
        {selectedTheme && <button className={styles.back} type="button" onClick={() => setSelectedTheme(null)}>← All themes</button>}
        <div className={styles.bubbles}>{bubbleRows.map((row, index) => {
          const parentIndex = Math.max(0, rows.findIndex(row => row.id === selectedTheme));
          const count = selectedTheme ? Math.round((420 - parentIndex * 48) / Math.max(1, bubbleRows.length)) : 420 - index * 48;
          const size = Math.max(80, Math.sqrt(count) * 7.5);
          return <button type="button" key={row.id} className={styles.bubble} style={{ width: size, height: size, background: `var(--dashboard-series-${index})`, color: `var(--dashboard-series-${index}-text)` }} onClick={() => { if (!selectedTheme) setSelectedTheme(row.id); }} aria-label={`${row.label}${!selectedTheme ? ', show sub-themes' : ''}`}><span>{row.label}</span><small>{count} mentions</small></button>;
        })}</div>
      </>}
      {kind === 'trend-line' && <svg className={styles.trend} viewBox="0 0 600 300" role="img" aria-label="Sentiment trend from April through September, percentage of mentions">
        {[0, 25, 50, 75, 100].map(v => <g key={v}><line x1="45" x2="580" y1={260 - v * 2.3} y2={260 - v * 2.3} stroke="#e5e7eb" /><text x="37" y={264 - v * 2.3} textAnchor="end">{v}%</text></g>)}
        {PERIODS.map((period, index) => <text key={period} x={50 + index * 105} y="285" textAnchor="middle">{period}</text>)}
        {buckets.map(bucket => { const index = BUCKETS.indexOf(bucket); return <g key={bucket.key}><polyline points={TREND.map((period, i) => `${50 + i * 105},${260 - period[index] * 2.3}`).join(' ')} fill="none" stroke={color(bucket.key)} strokeWidth="3" />{TREND.map((period, i) => <circle key={i} cx={50 + i * 105} cy={260 - period[index] * 2.3} r="4" fill={color(bucket.key)}><title>{`${PERIODS[i]} · ${bucket.label}: ${period[index]}%`}</title></circle>)}</g>; })}
      </svg>}
    </div>
    {kind !== 'bubble-chart' && <footer className={styles.legend}>{BUCKETS.map((bucket, index) => <button type="button" key={bucket.key} aria-pressed={!hidden.includes(bucket.key)} onClick={() => toggle(bucket.key)} style={{ opacity: hidden.includes(bucket.key) ? 0.4 : 1 }}><i style={{ background: color(bucket.key) }} />{bucket.label}{kind === 'gauge' ? ` ${values[index].toFixed(1)}%` : ''}</button>)}</footer>}
  </article>;
}
