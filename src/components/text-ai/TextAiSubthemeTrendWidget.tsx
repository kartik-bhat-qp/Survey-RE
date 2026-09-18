'use client';

import { useMemo, useState } from 'react';
import { TextAiWidgetMenu } from '@/components/text-ai/TextAiWidgetMenu';
import {
  TEXT_AI_SUBTHEME_TREND_PERIODS,
  TEXT_AI_SUBTHEME_TREND_SERIES,
  type TextAiSubthemeTrendSeries,
} from '@/data/mock-text-ai-subtheme-trend';
import {
  applyTextAiWidgetDisplay,
  createTextAiWidgetDisplayState,
  type TextAiWidgetDisplayState,
} from '@/data/mock-text-ai-widget-settings';
import styles from './TextAiSubthemeTrendWidget.module.css';

interface TextAiSubthemeTrendWidgetProps {
  question: string;
  onDelete?: () => void;
}

const CHART_WIDTH = 800;
const CHART_HEIGHT = 280;
const PAD_LEFT = 40;
const PAD_RIGHT = 16;
const PAD_TOP = 16;
const PAD_BOTTOM = 32;

function niceMax(value: number): number {
  if (value <= 10) return 10;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const nice =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return nice * magnitude;
}

function linePath(series: TextAiSubthemeTrendSeries, maxValue: number): string {
  const plotWidth = CHART_WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotHeight = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;
  const count = TEXT_AI_SUBTHEME_TREND_PERIODS.length;
  return series.values
    .map((value, index) => {
      const x = PAD_LEFT + (index / Math.max(1, count - 1)) * plotWidth;
      const y = PAD_TOP + plotHeight - (value / maxValue) * plotHeight;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}

function pointPosition(
  value: number,
  index: number,
  maxValue: number
): { x: number; y: number } {
  const plotWidth = CHART_WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotHeight = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;
  const count = TEXT_AI_SUBTHEME_TREND_PERIODS.length;
  return {
    x: PAD_LEFT + (index / Math.max(1, count - 1)) * plotWidth,
    y: PAD_TOP + plotHeight - (value / maxValue) * plotHeight,
  };
}

export function TextAiSubthemeTrendWidget({
  question,
  onDelete,
}: TextAiSubthemeTrendWidgetProps) {
  const [display, setDisplay] = useState<TextAiWidgetDisplayState>(() =>
    createTextAiWidgetDisplayState(
      10,
      TEXT_AI_SUBTHEME_TREND_SERIES.map((series) => series.id)
    )
  );
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const customItems = useMemo(
    () =>
      TEXT_AI_SUBTHEME_TREND_SERIES.map((series) => ({
        id: series.id,
        label: series.label,
        parentLabel: series.parentTheme,
        variancePercent: series.variancePercent,
      })),
    []
  );
  const visibleSeries = useMemo(
    () => applyTextAiWidgetDisplay(TEXT_AI_SUBTHEME_TREND_SERIES, display),
    [display]
  );
  const maxValue = useMemo(() => {
    const peak = visibleSeries.reduce(
      (highest, series) => Math.max(highest, ...series.values),
      0
    );
    return niceMax(Math.max(10, Math.ceil(peak * 1.1)));
  }, [visibleSeries]);
  const yTicks = [0, maxValue / 2, maxValue];
  const plotWidth = CHART_WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotHeight = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;

  return (
    <article className={styles.card}>
      <header className={`${styles.cardHeader} text-ai-widget-drag-handle`}>
        <div className={styles.titleBlock}>
          <h2 className={styles.cardTitle}>{question}</h2>
          <span className={styles.widgetLabel}>Sub-theme trend</span>
        </div>
        <TextAiWidgetMenu
          widgetTitle={`${question} Sub-theme trend`}
          topN={display.value === 'custom' ? 'all' : display.value}
          displayState={display}
          customItems={customItems}
          onDisplayChange={setDisplay}
          onDelete={onDelete}
        />
      </header>

      <div className={styles.body}>
        {visibleSeries.length === 0 ? (
          <p className={styles.emptyState}>No sub-themes to trend.</p>
        ) : (
          <>
            <div className={styles.chartWrap}>
              <svg
                className={styles.chart}
                viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                role="img"
                aria-label="Sub-theme mention trend by month"
              >
                {yTicks.map((tick) => {
                  const y =
                    PAD_TOP + plotHeight - (tick / maxValue) * plotHeight;
                  return (
                    <g key={tick}>
                      <line
                        className={tick === 0 ? styles.zeroLine : styles.gridLine}
                        x1={PAD_LEFT}
                        x2={CHART_WIDTH - PAD_RIGHT}
                        y1={y}
                        y2={y}
                      />
                      <text
                        className={styles.axisLabel}
                        x={PAD_LEFT - 8}
                        y={y + 3}
                        textAnchor="end"
                      >
                        {tick}
                      </text>
                    </g>
                  );
                })}
                {TEXT_AI_SUBTHEME_TREND_PERIODS.map((period, index) => {
                  const x =
                    PAD_LEFT +
                    (index / Math.max(1, TEXT_AI_SUBTHEME_TREND_PERIODS.length - 1)) *
                      plotWidth;
                  return (
                    <text
                      key={period}
                      className={styles.axisLabel}
                      x={x}
                      y={CHART_HEIGHT - 8}
                      textAnchor="middle"
                    >
                      {period.replace(' 2026', '')}
                    </text>
                  );
                })}
                {visibleSeries.map((series) => {
                  const muted = hoveredId !== null && hoveredId !== series.id;
                  return (
                    <g
                      key={series.id}
                      onMouseEnter={() => setHoveredId(series.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <path
                        className={`${styles.seriesLine} ${
                          muted ? styles.seriesLineMuted : ''
                        }`}
                        d={linePath(series, maxValue)}
                        stroke={`var(--dashboard-series-${TEXT_AI_SUBTHEME_TREND_SERIES.findIndex((item) => item.id === series.id) % 10}, ${series.color})`}
                      />
                      {series.values.map((value, index) => {
                        const point = pointPosition(value, index, maxValue);
                        return (
                          <circle
                            key={`${series.id}-${index}`}
                            className={styles.point}
                            cx={point.x}
                            cy={point.y}
                            r={hoveredId === series.id ? 3.5 : 2.5}
                            fill={`var(--dashboard-series-${TEXT_AI_SUBTHEME_TREND_SERIES.findIndex((item) => item.id === series.id) % 10}, ${series.color})`}
                            opacity={muted ? 0.18 : 1}
                          >
                            <title>
                              {series.label}: {value} mentions in{' '}
                              {TEXT_AI_SUBTHEME_TREND_PERIODS[index]}
                            </title>
                          </circle>
                        );
                      })}
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className={styles.legend}>
              {visibleSeries.map((series) => (
                <button
                  key={series.id}
                  type="button"
                  className={`${styles.legendItem} ${
                    hoveredId !== null && hoveredId !== series.id
                      ? styles.legendItemMuted
                      : ''
                  }`}
                  onMouseEnter={() => setHoveredId(series.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onFocus={() => setHoveredId(series.id)}
                  onBlur={() => setHoveredId(null)}
                  aria-label={`${series.label}, ${series.parentTheme}, ${series.total.toLocaleString('en-US')} mentions`}
                >
                  <span
                    className={styles.swatch}
                    style={{ background: `var(--dashboard-series-${TEXT_AI_SUBTHEME_TREND_SERIES.findIndex((item) => item.id === series.id) % 10}, ${series.color})` }}
                    aria-hidden
                  />
                  <span className={styles.legendCopy}>
                    <span className={styles.legendLabel}>{series.label}</span>
                    <span className={styles.legendParent}>{series.parentTheme}</span>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </article>
  );
}
