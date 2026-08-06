'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  SAMPLE_TEXT_AI_EXTERNAL_REPORT,
  SAMPLE_TEXT_AI_EXTERNAL_REPORT_SENTIMENTS,
  SAMPLE_TEXT_AI_EXTERNAL_REPORT_SUBTHEMES,
  SAMPLE_TEXT_AI_EXTERNAL_REPORT_THEMES,
} from '@/data/mock-dashboard-external-report';
import styles from './DashboardExternalReportPanel.module.css';

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

interface DashboardExternalReportPanelProps {
  reportName: string;
  category: 'crosstab' | 'text-ai';
}

export function DashboardExternalReportPanel({
  reportName,
  category,
}: DashboardExternalReportPanelProps) {
  const [theme, setTheme] = useState(SAMPLE_TEXT_AI_EXTERNAL_REPORT_THEMES[0]);
  const [subtheme, setSubtheme] = useState(SAMPLE_TEXT_AI_EXTERNAL_REPORT_SUBTHEMES[0]);
  const [sentiment, setSentiment] = useState(SAMPLE_TEXT_AI_EXTERNAL_REPORT_SENTIMENTS[0]);

  const rows = useMemo(() => {
    if (theme.value === 'all') return SAMPLE_TEXT_AI_EXTERNAL_REPORT.rows;
    return SAMPLE_TEXT_AI_EXTERNAL_REPORT.rows.filter((row) => row.id === theme.value);
  }, [theme.value]);

  const maxPercentage = Math.max(...rows.map((row) => row.percentage), 1);

  if (category === 'crosstab') {
    return (
      <section className={styles.panel} aria-label={`External report ${reportName}`}>
        <header className={styles.header}>
          <h2 className={styles.title}>{reportName}</h2>
          <p className={styles.subtitle}>External crosstab report</p>
        </header>
        <div className={styles.placeholder}>
          <span className={`wm-insert-chart ${styles.placeholderIcon}`} aria-hidden />
          <p className={styles.placeholderCopy}>
            Crosstab report preview for <strong>{reportName}</strong>. Full crosstab
            embedding will appear here in a later iteration.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.panel} aria-label={`External TextAI report ${reportName}`}>
      <header className={styles.header}>
        <h2 className={styles.title}>{SAMPLE_TEXT_AI_EXTERNAL_REPORT.title}</h2>
        <p className={styles.subtitle}>External TextAI report · {reportName}</p>
      </header>

      <div className={styles.filters}>
        <div className={styles.filterField}>
          <WuSelect
            data={SAMPLE_TEXT_AI_EXTERNAL_REPORT_THEMES}
            accessorKey={{ value: 'value', label: 'label' }}
            value={theme}
            onSelect={(option) => {
              if (!option) return;
              setTheme(option as (typeof SAMPLE_TEXT_AI_EXTERNAL_REPORT_THEMES)[number]);
            }}
            variant="outlined"
          />
        </div>
        <div className={styles.filterField}>
          <WuSelect
            data={SAMPLE_TEXT_AI_EXTERNAL_REPORT_SUBTHEMES}
            accessorKey={{ value: 'value', label: 'label' }}
            value={subtheme}
            onSelect={(option) => {
              if (!option) return;
              setSubtheme(
                option as (typeof SAMPLE_TEXT_AI_EXTERNAL_REPORT_SUBTHEMES)[number]
              );
            }}
            variant="outlined"
          />
        </div>
        <div className={styles.filterField}>
          <WuSelect
            data={SAMPLE_TEXT_AI_EXTERNAL_REPORT_SENTIMENTS}
            accessorKey={{ value: 'value', label: 'label' }}
            value={sentiment}
            onSelect={(option) => {
              if (!option) return;
              setSentiment(
                option as (typeof SAMPLE_TEXT_AI_EXTERNAL_REPORT_SENTIMENTS)[number]
              );
            }}
            variant="outlined"
          />
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Theme</th>
              <th>Overall</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className={styles.themeCell}>{row.theme}</td>
                <td className={styles.overallCell}>
                  <div className={styles.metricRow}>
                    <span className={styles.count}>{row.count.toLocaleString()}</span>
                    <span className={styles.percentage}>{row.percentage.toFixed(1)}%</span>
                  </div>
                  <div className={styles.barTrack} aria-hidden>
                    <div
                      className={styles.barFill}
                      style={{
                        width: `${Math.max(4, (row.percentage / maxPercentage) * 100)}%`,
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
