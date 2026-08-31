'use client';

import { useMemo, useState } from 'react';
import { StandardLoader } from '@/components/ui/StandardLoader';
import { TextAiEmergingBadge } from '@/components/text-ai/TextAiEmergingBadge';
import { TextAiWidgetMenu } from '@/components/text-ai/TextAiWidgetMenu';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  TEXT_AI_THEME_IMPACT_AXIS_MAX,
  TEXT_AI_THEME_IMPACT_FOOTNOTE,
  TEXT_AI_THEME_IMPACT_ROWS,
  formatThemeImpactCoefficient,
  formatThemeNetImpact,
  type TextAiThemeImpactRow,
} from '@/data/mock-text-ai-theme-impact';
import { isTextAiItemEmerging } from '@/data/text-ai-emerging-status';
import {
  DEFAULT_TEXT_AI_WIDGET_TOP_N,
  limitTextAiWidgetItems,
  type TextAiWidgetTopN,
} from '@/data/mock-text-ai-widget-settings';
import type { TextAiThemePreferences } from '@/data/text-ai-theme-preferences';
import styles from './TextAiThemeStackbarWidget.module.css';

interface TextAiThemeStackbarWidgetProps {
  question: string;
  onDelete?: () => void;
  themePreferences: TextAiThemePreferences;
}

const AXIS_TICKS = [-0.8, -0.4, 0, 0.4, 0.8] as const;

function barWidthPercent(value: number): number {
  return Math.min(100, (Math.abs(value) / TEXT_AI_THEME_IMPACT_AXIS_MAX) * 100);
}

function ImpactPerMention({ row }: { row: TextAiThemeImpactRow }) {
  return (
    <div
      className={styles.impactTrack}
      role="img"
      aria-label={`${row.label} impact per mention: ${formatThemeImpactCoefficient(row.negativeImpact)} negative, ${formatThemeImpactCoefficient(row.positiveImpact)} positive`}
    >
      <div className={styles.impactNegative}>
        <span className={styles.coeffLabel}>
          {formatThemeImpactCoefficient(row.negativeImpact)}
        </span>
        <span
          className={styles.negativeBar}
          style={{ width: `${barWidthPercent(row.negativeImpact)}%` }}
        />
      </div>
      <span className={styles.impactAxis} aria-hidden />
      <div className={styles.impactPositive}>
        <span
          className={styles.positiveBar}
          style={{ width: `${barWidthPercent(row.positiveImpact)}%` }}
        />
        <span className={styles.coeffLabel}>
          {formatThemeImpactCoefficient(row.positiveImpact)}
        </span>
      </div>
    </div>
  );
}

export function TextAiThemeStackbarWidget({
  question,
  onDelete,
  themePreferences,
}: TextAiThemeStackbarWidgetProps) {
  const wick = useWickUILib();
  const [topN, setTopN] = useState<TextAiWidgetTopN>(DEFAULT_TEXT_AI_WIDGET_TOP_N);
  const visibleThemes = useMemo(() => {
    const filtered = TEXT_AI_THEME_IMPACT_ROWS.flatMap((theme) => {
      const candidate = Boolean(theme.emerging);
      const approved =
        !candidate ||
        themePreferences.approvedEmergingNames.includes(theme.label);
      const emerging =
        approved &&
        isTextAiItemEmerging(
          theme.label,
          candidate,
          themePreferences.emergingThemeValidityDays,
          themePreferences.emergingApprovedAtByName[theme.label]
        );

      return approved ? [{ ...theme, emerging }] : [];
    });

    return limitTextAiWidgetItems(filtered, topN);
  }, [themePreferences, topN]);

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
        <div className={styles.titleBlock}>
          <h2 className={styles.cardTitle}>{question}</h2>
          <span className={styles.widgetLabel}>Theme</span>
        </div>
        <TextAiWidgetMenu
          widgetTitle={question}
          topN={topN}
          onTopNChange={setTopN}
          onDelete={onDelete}
        />
      </header>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.themeHeading}>Theme</th>
              <th className={styles.impactHeading}>Impact per mention</th>
              <th className={styles.netHeading}>Net impact</th>
              <th className={styles.countHeading}>n</th>
            </tr>
          </thead>
          <tbody>
            {visibleThemes.map((theme) => (
              <tr key={theme.id}>
                <td className={styles.themeCell}>
                  <span className={styles.themeLabel}>
                    <span>{theme.label}</span>
                    {theme.emerging ? <TextAiEmergingBadge /> : null}
                  </span>
                </td>
                <td className={styles.impactCell}>
                  <ImpactPerMention row={theme} />
                </td>
                <td
                  className={`${styles.netCell} ${
                    theme.netImpact > 0
                      ? styles.netPositive
                      : theme.netImpact < 0
                        ? styles.netNegative
                        : ''
                  }`}
                >
                  {formatThemeNetImpact(theme.netImpact)}
                </td>
                <td className={styles.countCell}>
                  {theme.mentionCount.toLocaleString('en-US')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className={styles.axisRow} aria-hidden>
          <span className={styles.axisSpacer} />
          <div className={styles.axisScale}>
            {AXIS_TICKS.map((tick) => (
              <span key={tick}>{tick === 0 ? '0' : tick.toFixed(1)}</span>
            ))}
          </div>
          <span className={styles.axisEndSpacer} />
        </div>
      </div>

      <footer className={styles.footnote}>{TEXT_AI_THEME_IMPACT_FOOTNOTE}</footer>
    </article>
  );
}
