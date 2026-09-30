"use client";

import { useId, useState } from "react";
import { TextAiWidgetMenu } from "./TextAiWidgetMenu";
import {
  TEXT_AI_SUBTHEME_STACKBAR_ROWS,
  type TextAiSentimentBucket,
} from "@/data/mock-text-ai-subtheme-stackbar";
import type { TextAiThemePreferences } from "@/data/text-ai-theme-preferences";
import {
  defaultTextAiWidgetSettings,
  selectTextAiItems,
  textAiMetricLabel,
  textAiTrendPoints,
  type TextAiWidgetSettingsProps,
} from "@/data/text-ai-widget-settings";
import styles from "./TextAiOverviewWidget.module.css";

export type TextAiOverviewKind =
  "gauge" | "bubble-chart" | "trend-line" | "theme-stacked-bar";
const BUCKETS: { key: TextAiSentimentBucket; label: string }[] = [
  { key: "veryNegative", label: "Very negative" },
  { key: "negative", label: "Negative" },
  { key: "mixed", label: "Mixed" },
  { key: "neutral", label: "Neutral" },
  { key: "positive", label: "Positive" },
  { key: "veryPositive", label: "Very positive" },
];
const TITLES = {
  gauge: "Gauge",
  "bubble-chart": "Bubble chart",
  "trend-line": "Trend line",
  "theme-stacked-bar": "Theme stacked bar",
};
const color = (key: string) => `var(--dashboard-sentiment-${key})`;

export function TextAiOverviewWidget({
  kind,
  question,
  onDelete,
  themePreferences,
  settings,
  onOpenSettings,
  preview,
}: TextAiWidgetSettingsProps & {
  kind: TextAiOverviewKind;
  question: string;
  onDelete: () => void;
  themePreferences: TextAiThemePreferences;
}) {
  const clipId = useId();
  const s = settings ?? defaultTextAiWidgetSettings(kind, question);
  const [hidden, setHidden] = useState<string[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const sourceRows = TEXT_AI_SUBTHEME_STACKBAR_ROWS.map((row, index) => ({
    ...row,
    mentions: 420 - index * 48,
    colorIndex: index,
  })).filter(
    (row) =>
      !row.emerging ||
      themePreferences.approvedEmergingNames.includes(row.label),
  );
  const rows = selectTextAiItems(
    sourceRows,
    s,
    (row) => row.label,
    (row) => row.mentions,
  );
  const values = BUCKETS.map((bucket) =>
    sourceRows.length
      ? sourceRows.reduce((sum, row) => sum + row.sentiment[bucket.key], 0) /
        sourceRows.length
      : 0,
  );
  const base = sourceRows.length * 100;
  const toggle = (key: string) =>
    setHidden((current) =>
      current.includes(key)
        ? current.filter((id) => id !== key)
        : [...current, key],
    );
  const parents = sourceRows.filter(
    (row) => !s.parentIds.length || s.parentIds.includes(row.id),
  );
  const expandedBubble = selectedTheme
    ? parents.find((row) => row.id === selectedTheme)
    : null;
  const allSubthemes = parents.flatMap((parent) =>
    parent.subthemes
      .filter(
        (row) =>
          !row.emerging ||
          themePreferences.approvedEmergingNames.includes(row.label),
      )
      .map((row) => ({
        ...row,
        mentions: Math.round(parent.mentions / parent.subthemes.length),
        colorIndex: parent.colorIndex,
        parentId: parent.id,
      })),
  );
  const bubbleSource = expandedBubble
    ? allSubthemes.filter((row) => row.parentId === expandedBubble.id)
    : s.bubbleLevel === "Sub-themes"
      ? allSubthemes
      : parents;
  const bubbleRows = selectTextAiItems(
    bubbleSource.filter((row) => row.mentions >= s.minimumMentions),
    s,
    (row) => row.label,
    (row) => row.mentions,
  );
  const points = textAiTrendPoints(s.interval);
  const min = s.customAxis ? s.minimum : -2,
    max = s.customAxis ? s.maximum : 2;
  const px = (i: number) =>
    points.length === 1 ? 310 : 55 + (i * 510) / (points.length - 1);
  const py = (value: number) => 250 - ((value - min) / (max - min)) * 210;
  return (
    <article className={styles.card} aria-label={`${TITLES[kind]} widget`}>
      <header className={`${styles.header} text-ai-widget-drag-handle`}>
        <div>
          <h2>{s.showName ? s.name : ""}</h2>
        </div>
        <TextAiWidgetMenu
          widgetTitle={s.name}
          onDelete={onDelete}
          onOpenSettings={onOpenSettings}
          preview={preview}
        />
      </header>
      <div className={styles.body}>
        {kind === "gauge" && (
          <>
            <svg
              viewBox="0 0 500 265"
              className={styles.gauge}
              role="img"
              aria-label={`Sentiment gauge: ${BUCKETS.map((b, i) => `${b.label} ${values[i].toFixed(s.precision)}%`).join(", ")}`}
            >
              <path
                d="M 60 225 A 190 190 0 0 1 440 225"
                fill="none"
                stroke="#f1f3f5"
                strokeWidth="58"
              />
              {BUCKETS.map((bucket, i) => {
                const start = values.slice(0, i).reduce((a, b) => a + b, 0);
                return (
                  !hidden.includes(bucket.key) && (
                    <path
                      key={bucket.key}
                      d="M 60 225 A 190 190 0 0 1 440 225"
                      pathLength="100"
                      fill="none"
                      stroke={color(bucket.key)}
                      strokeWidth="58"
                      strokeDasharray={`${values[i]} 100`}
                      strokeDashoffset={-start}
                    >
                      <title>{`${bucket.label}: ${textAiMetricLabel(Math.round((values[i] * base) / 100), values[i], s)}`}</title>
                    </path>
                  )
                );
              })}
              {s.labels && (
                <>
                  <text
                    x="250"
                    y="195"
                    textAnchor="middle"
                    className={styles.metric}
                  >
                    {base
                      ? textAiMetricLabel(
                          Math.round(((values[4] + values[5]) * base) / 100),
                          values[4] + values[5],
                          s,
                        )
                      : "—"}
                  </text>
                  <text x="250" y="222" textAnchor="middle">
                    Positive sentiment
                  </text>
                </>
              )}
            </svg>
            {s.showBase && (
              <p className={styles.base}>
                Synthetic sentiment assignments: {base} · equal weight per theme
              </p>
            )}
          </>
        )}
        {kind === "theme-stacked-bar" && (
          <div
            className={`${styles.stacks} ${s.orientation === "Vertical" ? styles.verticalStacks : ""}`}
          >
            {rows.length ? (
              rows.map((row) => (
                <div className={styles.stackRow} key={row.id}>
                  <span>{row.label}</span>
                  <div
                    className={styles.stack}
                    role="img"
                    aria-label={`${row.label}: ${BUCKETS.map((b) => `${b.label} ${row.sentiment[b.key]}%`).join(", ")}`}
                  >
                    {BUCKETS.map((bucket) => (
                      <span
                        key={bucket.key}
                        title={`${bucket.label}: ${row.sentiment[bucket.key].toFixed(s.precision)}%`}
                        style={{
                          flex: `0 0 ${row.sentiment[bucket.key]}%`,
                          visibility: hidden.includes(bucket.key)
                            ? "hidden"
                            : undefined,
                          background: color(bucket.key),
                          color: `var(--dashboard-sentiment-${bucket.key}-text)`,
                        }}
                      >
                        {s.labels && row.sentiment[bucket.key] >= 10
                          ? `${row.sentiment[bucket.key].toFixed(s.precision)}%`
                          : ""}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p>No matching themes.</p>
            )}
          </div>
        )}
        {kind === "bubble-chart" && (
          <>
            {expandedBubble && (
              <button
                className={styles.back}
                type="button"
                onClick={() => setSelectedTheme(null)}
              >
                ← All themes
              </button>
            )}
            <div className={styles.bubbles}>
              {bubbleRows.length ? (
                bubbleRows.map((row) => {
                  const size = Math.sqrt(row.mentions) * 7.5;
                  return (
                    <button
                      type="button"
                      key={row.id}
                      className={styles.bubble}
                      style={{
                        width: size,
                        height: size,
                        background: `var(--dashboard-series-${row.colorIndex})`,
                        color: `var(--dashboard-series-${row.colorIndex}-text)`,
                      }}
                      onClick={() => {
                        if (!expandedBubble && s.bubbleLevel === "Themes")
                          setSelectedTheme(row.id);
                      }}
                      aria-label={`${row.label}: ${row.mentions} mentions${!expandedBubble && s.bubbleLevel === "Themes" ? ", show sub-themes" : ""}`}
                    >
                      {s.showNames && <span>{row.label}</span>}
                      {s.labels && <small>{row.mentions} mentions</small>}
                    </button>
                  );
                })
              ) : (
                <p>No categories meet these settings.</p>
              )}
            </div>
          </>
        )}
        {kind === "trend-line" && (
          <>
            <svg
              className={styles.trend}
              viewBox="0 0 640 315"
              role="img"
              aria-label={`Average sentiment by ${s.interval.toLowerCase()} collected date`}
            >
              {[0, 1, 2, 3, 4].map((i) => {
                const value = min + ((max - min) * i) / 4;
                return (
                  <g key={i}>
                    <line
                      x1="55"
                      x2="565"
                      y1={py(value)}
                      y2={py(value)}
                      stroke="#e5e7eb"
                    />
                    <text x="48" y={py(value) + 4} textAnchor="end">
                      {value.toFixed(s.precision)}
                    </text>
                  </g>
                );
              })}
              {points.map((point, i) => (
                <g key={point.period}>
                  {(i % Math.max(1, Math.ceil(points.length / 7)) === 0 ||
                    i === points.length - 1) && (
                    <text x={px(i)} y="275" textAnchor="middle">
                      {point.period}
                    </text>
                  )}
                  {point.value >= min && point.value <= max && (
                    <>
                      <circle
                        cx={px(i)}
                        cy={py(point.value)}
                        r="4"
                        fill="var(--dashboard-series-0)"
                      >
                        {s.tooltip !== "None" && (
                          <title>{`${point.period}: ${point.value.toFixed(s.precision)} · ${point.base} observations`}</title>
                        )}
                      </circle>
                      {(s.labels || s.tooltip === "Always") && (
                        <text
                          x={px(i)}
                          y={py(point.value) - 10}
                          textAnchor="middle"
                        >
                          {point.value.toFixed(s.precision)}
                        </text>
                      )}
                    </>
                  )}
                </g>
              ))}
              <defs>
                <clipPath id={clipId}>
                  <rect x="50" y="40" width="520" height="210" />
                </clipPath>
              </defs>
              <polyline
                clipPath={`url(#${clipId})`}
                points={points
                  .map((p, i) => `${px(i)},${py(p.value)}`)
                  .join(" ")}
                fill="none"
                stroke="var(--dashboard-series-0)"
                strokeWidth="2"
              />
              {s.axisTitles && (
                <>
                  <text x="310" y="308" textAnchor="middle">
                    {s.xTitle}
                  </text>
                  <text
                    x="12"
                    y="155"
                    transform="rotate(-90 12 155)"
                    textAnchor="middle"
                  >
                    {s.yTitle}
                  </text>
                </>
              )}
            </svg>
            {s.showBase && (
              <p className={styles.base}>
                Synthetic observations:{" "}
                {points.reduce((sum, p) => sum + p.base, 0).toLocaleString()}
              </p>
            )}
          </>
        )}
      </div>
      {s.legend && kind === "trend-line" && (
        <footer className={styles.legend}>
          <span>Average sentiment · illustrative scores</span>
        </footer>
      )}
      {s.legend && kind === "bubble-chart" && (
        <footer className={styles.legend}>
          {parents.map((row) => (
            <span key={row.id}>{row.label}</span>
          ))}
        </footer>
      )}
      {s.legend && kind !== "bubble-chart" && kind !== "trend-line" && (
        <footer className={styles.legend}>
          {BUCKETS.map((bucket, i) => (
            <button
              type="button"
              key={bucket.key}
              aria-pressed={!hidden.includes(bucket.key)}
              onClick={() => toggle(bucket.key)}
              style={{ opacity: hidden.includes(bucket.key) ? 0.4 : 1 }}
            >
              <i style={{ background: color(bucket.key) }} />
              {bucket.label}
              {kind === "gauge" && s.labels
                ? ` ${textAiMetricLabel(Math.round((values[i] * base) / 100), values[i], s)}`
                : ""}
            </button>
          ))}
        </footer>
      )}
    </article>
  );
}
