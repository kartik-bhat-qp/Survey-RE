export type TextAiSettingsKind =
  | "kpi-by-theme"
  | "gauge"
  | "theme-stacked-bar"
  | "subtheme-stacked-bar"
  | "trend-line"
  | "comparative-chart"
  | "subtheme-comparative-chart"
  | "text-viewer"
  | "bubble-chart"
  | "text-summary";
export interface TextAiResponseFilter {
  query: string;
  start: string;
  end: string;
}
export const EMPTY_TEXT_AI_FILTER: TextAiResponseFilter = {
  query: "",
  start: "",
  end: "",
};
export const TEXT_AI_VIEWER_COLUMNS = [
  "Responses",
  "Themes",
  "Sub-themes",
  "Insights",
  "Tags",
  "Collected on",
] as const;
export interface TextAiWidgetSettings {
  version: 1;
  name: string;
  showName: boolean;
  filter: "Dashboard" | "Widget" | "Combined" | "None";
  responseFilter: TextAiResponseFilter;
  precision: number;
  metric: "Count" | "Percentage" | "Both";
  showBase: boolean;
  legend: boolean;
  labels: boolean;
  showNames: boolean;
  order: "Default" | "Ascending" | "Descending" | "Alphabetical";
  display:
    "All" | "Top 3" | "Top 5" | "Top 10" | "Top 15" | "Top 20" | "Selected";
  selectedIds: string[];
  parentIds: string[];
  subthemeIds: string[];
  childLimit: number;
  hideEmpty: boolean;
  orientation: "Horizontal" | "Vertical";
  expanded: boolean;
  interval: "Weekly" | "Monthly" | "Quarterly" | "Yearly";
  axisTitles: boolean;
  xTitle: string;
  yTitle: string;
  customAxis: boolean;
  minimum: number;
  maximum: number;
  tooltip: "On hover" | "Always" | "None";
  showOverall: boolean;
  segments: string[];
  statTesting: boolean;
  showParent: boolean;
  grouped: boolean;
  columns: string[];
  pageSize: number;
  dateOrder: "Newest first" | "Oldest first";
  wrap: boolean;
  highlightSentiment: boolean;
  bubbleLevel: "Themes" | "Sub-themes";
  minimumMentions: number;
  summaryMode: "thematic" | "thematic-sentiment";
  hiddenSections: string[];
  compact: boolean;
  designScope: "Dashboard" | "Widget";
  accent: string;
  palette: string;
  fontSize: string;
  fontFamily: string;
  sentimentColors: string[];
}
export interface TextAiWidgetSettingsProps {
  settings?: TextAiWidgetSettings;
  onSettingsChange?: (patch: Partial<TextAiWidgetSettings>) => void;
  onOpenSettings?: () => void;
  responseFilters?: TextAiResponseFilter[];
  preview?: boolean;
}
export function defaultTextAiWidgetSettings(
  kind: TextAiSettingsKind,
  name: string,
): TextAiWidgetSettings {
  return {
    version: 1,
    name,
    showName: true,
    filter: "Dashboard",
    responseFilter: { ...EMPTY_TEXT_AI_FILTER },
    precision:
      kind === "theme-stacked-bar" || kind === "subtheme-stacked-bar" ? 0 : 1,
    metric: kind.includes("comparative") ? "Both" : "Percentage",
    showBase: false,
    legend: kind !== "bubble-chart",
    labels: true,
    showNames: true,
    order: "Default",
    display: "All",
    selectedIds: [],
    parentIds: [],
    subthemeIds: [],
    childLimit: 0,
    hideEmpty: false,
    orientation: "Horizontal",
    expanded: false,
    interval: "Monthly",
    axisTitles: false,
    xTitle: "Collected on",
    yTitle: "Average sentiment",
    customAxis: false,
    minimum: -2,
    maximum: 2,
    tooltip: "On hover",
    showOverall: true,
    segments:
      kind === "subtheme-comparative-chart"
        ? []
        : ["male", "female", "otherGender"],
    statTesting: false,
    showParent: false,
    grouped: false,
    columns: [...TEXT_AI_VIEWER_COLUMNS],
    pageSize: 100,
    dateOrder: "Newest first",
    wrap: true,
    highlightSentiment: true,
    bubbleLevel: "Themes",
    minimumMentions: 0,
    summaryMode: "thematic",
    hiddenSections: [],
    compact: false,
    designScope: "Dashboard",
    accent: "#1b3380",
    palette: "categorical",
    fontSize: "medium",
    fontFamily: '"Fira Sans", Arial, sans-serif',
    sentimentColors: [
      "#f85271",
      "#f69a79",
      "#f1da7e",
      "#f1da7e",
      "#94d08b",
      "#42bd84",
    ],
  };
}
export function normalizeTextAiWidgetSettings(
  value: unknown,
  kind: TextAiSettingsKind,
  name: string,
): TextAiWidgetSettings {
  const defaults = defaultTextAiWidgetSettings(kind, name);
  if (!value || typeof value !== "object" || Array.isArray(value))
    return defaults;
  const input = value as Record<string, unknown>;
  const result = { ...defaults };
  const enums: Record<string, readonly string[]> = {
    filter: ["Dashboard", "Widget", "Combined", "None"],
    metric: ["Count", "Percentage", "Both"],
    order: ["Default", "Ascending", "Descending", "Alphabetical"],
    display: [
      "All",
      "Top 3",
      "Top 5",
      "Top 10",
      "Top 15",
      "Top 20",
      "Selected",
    ],
    orientation: ["Horizontal", "Vertical"],
    interval: ["Weekly", "Monthly", "Quarterly", "Yearly"],
    tooltip: ["On hover", "Always", "None"],
    dateOrder: ["Newest first", "Oldest first"],
    bubbleLevel: ["Themes", "Sub-themes"],
    summaryMode: ["thematic", "thematic-sentiment"],
    designScope: ["Dashboard", "Widget"],
    palette: ["categorical", "divergent", "blue", "green", "red", "orange"],
    fontSize: ["extra-small", "small", "medium", "large", "extra-large"],
    fontFamily: [
      '"Fira Sans", Arial, sans-serif',
      "Arial, sans-serif",
      "Georgia, serif",
      'Inter, "Segoe UI", Roboto, Arial, sans-serif',
    ],
  };
  for (const key of Object.keys(defaults) as (keyof TextAiWidgetSettings)[]) {
    const v = input[key];
    if (typeof defaults[key] === "boolean" && typeof v === "boolean")
      Object.assign(result, { [key]: v });
    if (enums[key]?.includes(String(v))) Object.assign(result, { [key]: v });
  }
  for (const key of ["name", "xTitle", "yTitle"] as const)
    if (typeof input[key] === "string" && input[key].trim())
      result[key] = input[key].slice(0, 160);
  for (const key of [
    "precision",
    "pageSize",
    "childLimit",
    "minimumMentions",
    "minimum",
    "maximum",
  ] as const)
    if (typeof input[key] === "number" && Number.isFinite(input[key]))
      result[key] = input[key];
  result.precision = Math.min(5, Math.max(0, Math.round(result.precision)));
  result.pageSize = [10, 25, 50, 100].includes(result.pageSize)
    ? result.pageSize
    : 100;
  result.childLimit = [0, 3, 5, 10, 15, 20].includes(result.childLimit)
    ? result.childLimit
    : 0;
  result.minimumMentions = Math.max(0, Math.round(result.minimumMentions));
  if (result.maximum <= result.minimum) {
    result.minimum = defaults.minimum;
    result.maximum = defaults.maximum;
    result.customAxis = false;
  }
  for (const key of [
    "selectedIds",
    "parentIds",
    "subthemeIds",
    "hiddenSections",
  ] as const)
    if (Array.isArray(input[key]))
      result[key] = [
        ...new Set(
          input[key]
            .filter((v): v is string => typeof v === "string")
            .slice(0, 200),
        ),
      ];
  if (Array.isArray(input.columns))
    result.columns = [
      "Responses",
      ...input.columns.filter(
        (v): v is string =>
          typeof v === "string" &&
          v !== "Responses" &&
          (TEXT_AI_VIEWER_COLUMNS as readonly string[]).includes(v),
      ),
    ];
  result.columns = [...new Set(result.columns)];
  if (Array.isArray(input.segments))
    result.segments = [
      ...new Set(
        input.segments.filter((v): v is string =>
          ["male", "female", "otherGender"].includes(String(v)),
        ),
      ),
    ];
  if (!result.showOverall && !result.segments.length) result.showOverall = true;
  if (typeof input.accent === "string" && /^#[0-9a-f]{6}$/i.test(input.accent))
    result.accent = input.accent;
  if (
    Array.isArray(input.sentimentColors) &&
    input.sentimentColors.length === 6 &&
    input.sentimentColors.every(
      (v) => typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v),
    )
  )
    result.sentimentColors = [...input.sentimentColors];
  result.responseFilter = normalizeTextAiResponseFilter(input.responseFilter);
  return result;
}
export function normalizeTextAiResponseFilter(
  value: unknown,
): TextAiResponseFilter {
  const record =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const date = (v: unknown) =>
    typeof v === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(v) &&
    Number.isFinite(Date.parse(v))
      ? v
      : "";
  return {
    query: typeof record.query === "string" ? record.query.slice(0, 200) : "",
    start: date(record.start),
    end: date(record.end),
  };
}
export function textAiWidgetSettingsKey(dashboard: number, widget: string) {
  return `text-ai-widget-settings:v1:${dashboard}:${encodeURIComponent(widget)}`;
}
export function activeTextAiFilters(
  settings: TextAiWidgetSettings,
  dashboard: TextAiResponseFilter,
): TextAiResponseFilter[] {
  return (
    settings.filter === "None"
      ? []
      : settings.filter === "Dashboard"
        ? [dashboard]
        : settings.filter === "Widget"
          ? [settings.responseFilter]
          : [dashboard, settings.responseFilter]
  ).filter((f) => f.query.trim() || f.start || f.end);
}
export function matchesTextAiFilters(
  row: { value: string; collectedOn?: string },
  filters: TextAiResponseFilter[],
) {
  return filters.every(
    (f) =>
      (!f.query.trim() ||
        row.value.toLowerCase().includes(f.query.trim().toLowerCase())) &&
      (!f.start || (!!row.collectedOn && row.collectedOn >= f.start)) &&
      (!f.end || (!!row.collectedOn && row.collectedOn <= f.end)),
  );
}
export function selectTextAiItems<T extends { id: string }>(
  rows: readonly T[],
  settings: TextAiWidgetSettings,
  label: (row: T) => string,
  count: (row: T) => number,
): T[] {
  let result = rows.filter(
    (row) =>
      (settings.display !== "Selected" ||
        settings.selectedIds.includes(row.id)) &&
      (!settings.hideEmpty || count(row) > 0),
  );
  if (settings.order === "Ascending")
    result.sort((a, b) => count(a) - count(b));
  if (settings.order === "Descending" || settings.display.startsWith("Top "))
    result.sort((a, b) => count(b) - count(a));
  if (settings.order === "Alphabetical")
    result.sort((a, b) => label(a).localeCompare(label(b)));
  if (settings.display.startsWith("Top "))
    result = result.slice(0, Number(settings.display.slice(4)));
  return result;
}
export function textAiMetricLabel(
  count: number,
  percent: number,
  s: Pick<TextAiWidgetSettings, "metric" | "precision">,
) {
  return s.metric === "Count"
    ? count.toLocaleString("en-US")
    : s.metric === "Percentage"
      ? `${percent.toFixed(s.precision)}%`
      : `${count.toLocaleString("en-US")} (${percent.toFixed(s.precision)}%)`;
}
// Explicit synthetic date/score fixture for interval controls. No production scoring formula is inferred.
export const TEXT_AI_SENTIMENT_OBSERVATIONS = Array.from(
  { length: 180 },
  (_, i) => ({
    date: new Date(Date.UTC(2026, 3, 1 + i)).toISOString().slice(0, 10),
    score: Math.round((0.35 + i / 300 + Math.sin(i / 9) * 0.2) * 100) / 100,
    base: 20 + (i % 11),
  }),
);
export function textAiTrendPoints(interval: TextAiWidgetSettings["interval"]) {
  const groups = new Map<string, { score: number; base: number }>();
  for (const row of TEXT_AI_SENTIMENT_OBSERVATIONS) {
    const d = new Date(`${row.date}T00:00:00Z`);
    let key = row.date.slice(0, 7);
    if (interval === "Yearly") key = row.date.slice(0, 4);
    if (interval === "Quarterly")
      key = `${d.getUTCFullYear()} Q${Math.floor(d.getUTCMonth() / 3) + 1}`;
    if (interval === "Weekly") {
      d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
      key = d.toISOString().slice(0, 10);
    }
    const g = groups.get(key) ?? { score: 0, base: 0 };
    groups.set(key, {
      score: g.score + row.score * row.base,
      base: g.base + row.base,
    });
  }
  return [...groups].map(([period, g]) => ({
    period,
    value: g.score / g.base,
    base: g.base,
  }));
}
export function saveTextAiWidgetSettings(
  storage: Pick<Storage, "setItem">,
  key: string,
  value: TextAiWidgetSettings,
): boolean {
  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
