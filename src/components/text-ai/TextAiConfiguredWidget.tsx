"use client";

import {
  cloneElement,
  useId,
  useState,
  type ReactElement,
  type CSSProperties,
} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import dynamic from "next/dynamic";
import { DesignColorPicker } from "@/components/dashboards/DesignColorPicker";
import {
  getDashboardDesignColorVars,
  getReadableDesignColor,
  type DashboardDesign,
} from "@/data/dashboard-design";
import { getTextAiTypographyCssVars } from "@/components/text-ai/text-ai-typography";
import {
  activeTextAiFilters,
  textAiWidgetSettingsKey,
  TEXT_AI_VIEWER_COLUMNS,
  type TextAiResponseFilter,
  type TextAiSettingsKind,
  type TextAiWidgetSettings,
  type TextAiWidgetSettingsProps,
} from "@/data/text-ai-widget-settings";
import { useTextAiWidgetSettings } from "./useTextAiWidgetSettings";
import { TextAiKpiSettingsFields } from "./TextAiKpiSetupFields";
import type { TextAiKpiConfig } from "@/data/mock-text-ai-kpi-by-theme";
import styles from "./TextAiConfiguredWidget.module.css";

const WuSelect = dynamic(
  () =>
    import("@npm-questionpro/wick-ui-lib").then((m) => ({
      default: m.WuSelect,
    })),
  { ssr: false },
);
export interface TextAiSettingsItem {
  id: string;
  label: string;
  parentId?: string;
}
export function TextAiResponseFilterFields({
  value,
  onChange,
}: {
  value: TextAiResponseFilter;
  onChange: (filter: TextAiResponseFilter) => void;
}) {
  return (
    <div className={styles.filterFields}>
      <label>
        Response contains
        <input
          value={value.query}
          maxLength={200}
          onChange={(e) => onChange({ ...value, query: e.target.value })}
        />
      </label>
      <div className={styles.columns}>
        <label>
          From
          <input
            type="date"
            value={value.start}
            max={value.end || undefined}
            onChange={(e) => onChange({ ...value, start: e.target.value })}
          />
        </label>
        <label>
          To
          <input
            type="date"
            value={value.end}
            min={value.start || undefined}
            onChange={(e) => onChange({ ...value, end: e.target.value })}
          />
        </label>
      </div>
      {value.start && value.end && value.start > value.end && (
        <p role="alert">From must be on or before To.</p>
      )}
    </div>
  );
}
export function TextAiConfiguredWidget({
  dashboardId,
  widgetId,
  kind,
  title,
  design,
  dashboardFilter,
  items = [],
  parents = [],
  subthemes = [],
  sections = [],
  children,
  readOnly = false,
  kpiBinding,
}: {
  dashboardId: number;
  widgetId: string;
  kind: TextAiSettingsKind;
  title: string;
  design: DashboardDesign;
  dashboardFilter: TextAiResponseFilter;
  items?: TextAiSettingsItem[];
  parents?: TextAiSettingsItem[];
  subthemes?: TextAiSettingsItem[];
  sections?: string[];
  children: ReactElement<TextAiWidgetSettingsProps>;
  readOnly?: boolean;
  kpiBinding?: { config: TextAiKpiConfig; onChange: (config: TextAiKpiConfig) => void };
}) {
  const key = textAiWidgetSettingsKey(dashboardId, widgetId);
  const { settings, error, setError, update } = useTextAiWidgetSettings(
    key,
    kind,
    title,
    readOnly,
    kind !== "kpi-by-theme",
  );
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("General");
  const id = useId();
  const s = settings;
  const effectiveDesign: DashboardDesign =
    s.designScope === "Widget"
      ? {
          ...design,
          themeColor: s.accent,
          palette: s.palette,
          typography: {
            ...design.typography,
            fontSize: { value: s.fontSize, label: s.fontSize },
            fontFamily: { value: s.fontFamily, label: s.fontFamily },
          },
        }
      : design;
  const style: CSSProperties = {
    ...getTextAiTypographyCssVars(effectiveDesign.typography),
    ...getDashboardDesignColorVars(effectiveDesign),
  };
  if (s.designScope === "Widget")
    [
      "veryNegative",
      "negative",
      "mixed",
      "neutral",
      "positive",
      "veryPositive",
    ].forEach((bucket, i) =>
      Object.assign(style, {
        [`--dashboard-sentiment-${bucket}`]: s.sentimentColors[i],
        [`--dashboard-sentiment-${bucket}-text`]: getReadableDesignColor(
          s.sentimentColors[i],
        ),
      }),
    );
  const filters = activeTextAiFilters(s, dashboardFilter);
  const unavailable = filters.length > 0 && kind !== "text-viewer" && kind !== "kpi-by-theme";
  const render = (preview: boolean) => (
    <div
      style={style}
      className={`${styles.surface} ${unavailable ? styles.unavailable : ""}`}
      data-widget-settings-kind={kind}
      data-widget-name={s.name}
    >
      {cloneElement(children, {
        settings: s,
        onSettingsChange: readOnly ? undefined : update,
        onOpenSettings:
          readOnly || preview
            ? undefined
            : () => {
                setTab("General");
                setOpen(true);
              },
        responseFilters: filters,
        preview: preview || readOnly,
      })}
      {unavailable && (
        <p className={styles.unavailableMessage}>
          Filtered results are unavailable for this widget’s sample data. Clear
          response filters or choose None in Filter type to view its baseline.
        </p>
      )}
    </div>
  );
  const isComparison = kind.includes("comparative");
  const isStack = kind.includes("stacked-bar");
  const selectable = isComparison || isStack || kind === "bubble-chart";
  const hasLabels = kind !== "text-summary" && kind !== "text-viewer" && kind !== "kpi-by-theme";
  const tabs = [
    "General",
    "Analytics",
    ...(kind === "text-viewer" ? ["Columns"] : hasLabels ? ["Labels"] : []),
    "Design",
  ];
  function select<K extends keyof TextAiWidgetSettings>(
    label: string,
    field: K,
    values: readonly (string | number)[],
  ) {
    const options = values.map((value) => ({
      value: String(value),
      label:
        (
          {
            thematic: "Thematic",
            "thematic-sentiment": "Thematic & Sentiment",
            "extra-small": "Extra small",
            "extra-large": "Extra large",
            medium: "Medium",
            small: "Small",
            large: "Large",
            categorical: "Categorical",
            divergent: "Divergent",
            blue: "Blue",
            green: "Green",
            red: "Red",
            orange: "Orange",
            '"Fira Sans", Arial, sans-serif': "Fira Sans",
            "Arial, sans-serif": "Arial",
            "Georgia, serif": "Georgia",
            'Inter, "Segoe UI", Roboto, Arial, sans-serif': "Inter",
          } as Record<string, string>
        )[String(value)] ?? String(value),
    }));
    return (
      <div className={styles.field}>
        <span id={`${id}-${field}`}>{label}</span>
        <WuSelect
          aria-labelledby={`${id}-${field}`}
          data={options}
          accessorKey={{ value: "value", label: "label" }}
          value={options.find((v) => v.value === String(s[field]))}
          variant="outlined"
          onSelect={(value) => {
            if (!Array.isArray(value))
              update({
                [field]:
                  typeof s[field] === "number"
                    ? Number((value as { value: string }).value)
                    : (value as { value: string }).value,
              });
          }}
        />
      </div>
    );
  }
  function toggle(label: string, field: keyof TextAiWidgetSettings) {
    return (
      <div className={styles.row}>
        <span>{label}</span>
        <button
          type="button"
          role="switch"
          aria-label={label}
          aria-checked={Boolean(s[field])}
          className={styles.toggle}
          onClick={() => update({ [field]: !s[field] })}
        >
          <span />
        </button>
      </div>
    );
  }
  function number(
    label: string,
    field: "minimumMentions" | "minimum" | "maximum",
    min?: number,
  ) {
    return (
      <label className={styles.field}>
        {label}
        <input
          key={`${field}-${s[field]}`}
          type="number"
          defaultValue={s[field]}
          min={min}
          onBlur={(e) => {
            if (
              e.target.value !== "" &&
              Number.isFinite(Number(e.target.value))
            )
              update({ [field]: Number(e.target.value) });
            else setError("Enter a valid number.");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
        />
      </label>
    );
  }
  function picker(
    label: string,
    field: "selectedIds" | "parentIds" | "subthemeIds",
    choices: TextAiSettingsItem[],
    emptyMeansAll = false,
  ) {
    return (
      <fieldset className={styles.picker}>
        <legend>{label}</legend>
        {emptyMeansAll && <p>Leave empty to include all.</p>}
        {choices.length ? (
          choices.map((item) => (
            <label key={item.id}>
              <input
                type="checkbox"
                checked={s[field].includes(item.id)}
                onChange={(e) =>
                  update({
                    [field]: e.target.checked
                      ? [...s[field], item.id]
                      : s[field].filter((v) => v !== item.id),
                  })
                }
              />
              {item.label}
            </label>
          ))
        ) : (
          <p>No categories available.</p>
        )}
      </fieldset>
    );
  }
  const renderAnalytics = () => (
    <>
      {kind === "kpi-by-theme" && <>
        {kpiBinding && <TextAiKpiSettingsFields value={kpiBinding.config} onChange={kpiBinding.onChange} />}
        {select("Show themes", "display", ["All", "Top 3", "Top 5", "Top 10", "Top 15", "Top 20"])}
        {toggle("Show Overall baseline", "showOverall")}
      </>}
      {hasLabels &&
        kind !== "bubble-chart" &&
        select("Decimal precision", "precision", [0, 1, 2, 3, 4, 5])}
      {isComparison &&
        select("Display values", "metric", ["Count", "Percentage", "Both"])}
      {kind === "gauge" && (
        <>
          {select("Display values", "metric", ["Count", "Percentage", "Both"])}
          {toggle("Show base", "showBase")}
          <p className={styles.note}>
            The gauge fixture represents an equal-weight distribution. Count
            labels use synthetic assignments, not unique respondents.
          </p>
        </>
      )}
      {selectable && (
        <>
          {select("Data ordering", "order", [
            "Default",
            "Ascending",
            "Descending",
            "Alphabetical",
          ])}
          {select("Display", "display", [
            "All",
            "Top 3",
            "Top 5",
            "Top 10",
            "Top 15",
            "Top 20",
            "Selected",
          ])}
          {s.display === "Selected" &&
            picker(
              "Selected categories",
              "selectedIds",
              kind === "bubble-chart" && s.bubbleLevel === "Sub-themes"
                ? subthemes
                : items,
            )}
          {toggle("Hide zero-volume categories", "hideEmpty")}
        </>
      )}
      {isStack &&
        select("Orientation", "orientation", ["Horizontal", "Vertical"])}
      {kind === "subtheme-stacked-bar" && (
        <>
          {picker("Parent themes", "parentIds", parents, true)}
          {picker("Sub-themes", "subthemeIds", subthemes, true)}
          {select(
            "Sub-themes per parent (0 = all)",
            "childLimit",
            [0, 3, 5, 10, 15, 20],
          )}
          {toggle("Expand themes by default", "expanded")}
        </>
      )}
      {kind === "trend-line" && (
        <>
          {select("Interval", "interval", [
            "Weekly",
            "Monthly",
            "Quarterly",
            "Yearly",
          ])}
          <p className={styles.note}>
            Average sentiment by collected date. Gaps have no observations. The
            preview uses illustrative scores.
          </p>
          {toggle("Show base", "showBase")}
          {select("Tooltip style", "tooltip", ["On hover", "Always", "None"])}
        </>
      )}
      {isComparison && (
        <>
          {toggle("Show Overall", "showOverall")}
          <fieldset className={styles.picker}>
            <legend>Comparison slicers</legend>
            {[
              { id: "male", label: "Male" },
              { id: "female", label: "Female" },
              { id: "otherGender", label: "Other gender" },
            ].map((item) => (
              <label key={item.id}>
                <input
                  type="checkbox"
                  checked={s.segments.includes(item.id)}
                  onChange={(e) =>
                    update({
                      segments: e.target.checked
                        ? [...s.segments, item.id]
                        : s.segments.filter((v) => v !== item.id),
                    })
                  }
                />
                {item.label}
              </label>
            ))}
          </fieldset>
          {s.segments.length >= 2 ? (
            toggle("Stat testing", "statTesting")
          ) : (
            <p className={styles.note}>
              Select at least two comparison slicers for stat testing.
            </p>
          )}
          {kind === "comparative-chart" ? (
            toggle("Expand sub-themes by default", "expanded")
          ) : (
            <>
              {toggle("Show parent-theme labels", "showParent")}
              {toggle("Group by parent theme", "grouped")}
            </>
          )}
          <p className={styles.note}>
            Counts and percentages retain their original response bases.
            Categories may overlap.
          </p>
        </>
      )}
      {kind === "text-viewer" && (
        <>
          {select("Rows per page", "pageSize", [10, 25, 50, 100])}
          {select("Date order", "dateOrder", ["Newest first", "Oldest first"])}
          {toggle("Wrap response text", "wrap")}
          {toggle("Highlight sentiment", "highlightSentiment")}
          {toggle("Show base", "showBase")}
        </>
      )}
      {kind === "bubble-chart" && (
        <>
          {select("Level", "bubbleLevel", ["Themes", "Sub-themes"])}
          {picker("Parent themes", "parentIds", parents, true)}
          {number("Minimum mentions", "minimumMentions", 0)}
          <p className={styles.note}>
            Bubble area represents mentions. Selecting categories does not
            change their original size or count.
          </p>
        </>
      )}
      {kind === "text-summary" && (
        <>
          {select("Summary mode", "summaryMode", [
            "thematic",
            "thematic-sentiment",
          ])}
          {toggle("Compact presentation", "compact")}
          <fieldset className={styles.picker}>
            <legend>Visible sections</legend>
            {sections
              .filter((h) => !/caveat|source/i.test(h))
              .map((heading) => (
                <label key={heading}>
                  <input
                    type="checkbox"
                    checked={!s.hiddenSections.includes(heading)}
                    onChange={(e) =>
                      update({
                        hiddenSections: e.target.checked
                          ? s.hiddenSections.filter((v) => v !== heading)
                          : [...s.hiddenSections, heading],
                      })
                    }
                  />
                  {heading}
                </label>
              ))}
          </fieldset>
          <p className={styles.note}>
            Uses existing generated content. Caveats remain visible. No
            regeneration or credit use.
          </p>
        </>
      )}
    </>
  );
  return (
    <>
      {render(false)}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles.overlay} />
          <Dialog.Content className={styles.dialog} aria-describedby={undefined}>
            <div className={styles.preview}>{render(true)}</div>
            <aside className={styles.panel}>
              <header className={styles.panelHeader}>
                <Dialog.Title>Settings</Dialog.Title>
                <Dialog.Close aria-label="Close widget settings">
                  ×
                </Dialog.Close>
              </header>
              <div
                role="tablist"
                aria-label="Widget settings"
                className={styles.tabs}
              >
                {tabs.map((t) => (
                  <button
                    type="button"
                    key={t}
                    role="tab"
                    id={`${id}-${t}`}
                    aria-selected={tab === t}
                    aria-controls={`${id}-panel`}
                    onClick={() => setTab(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div
                role="tabpanel"
                id={`${id}-panel`}
                aria-labelledby={`${id}-${tab}`}
                className={styles.panelBody}
              >
                {tab === "General" && (
                  <>
                    {toggle("Show name", "showName")}
                    <label className={styles.field}>
                      Widget name
                      <input
                        key={s.name}
                        defaultValue={s.name}
                        maxLength={160}
                        onBlur={(e) => update({ name: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.currentTarget.blur();
                        }}
                      />
                    </label>
                    <h4>Filter options</h4>
                    {select("Filter type", "filter", [
                      "Dashboard",
                      "Widget",
                      "Combined",
                      "None",
                    ])}
                    {(s.filter === "Widget" || s.filter === "Combined") && (
                      <TextAiResponseFilterFields
                        value={s.responseFilter}
                        onChange={(value) => update({ responseFilter: value })}
                      />
                    )}
                    <p className={styles.note}>
                      {s.filter === "Combined"
                        ? "Both dashboard and widget conditions must match."
                        : s.filter === "None"
                          ? "Display the analyzed baseline without response filters."
                          : `Use ${s.filter.toLowerCase()} response filters.`}
                    </p>
                    {kind === "trend-line" && (
                      <>
                        {toggle("Axis titles", "axisTitles")}
                        {s.axisTitles && (
                          <>
                            {(["xTitle", "yTitle"] as const).map((field, i) => (
                              <label className={styles.field} key={field}>
                                {i ? "Y axis title" : "X axis title"}
                                <input
                                  value={s[field]}
                                  onChange={(e) =>
                                    update({ [field]: e.target.value })
                                  }
                                />
                              </label>
                            ))}
                          </>
                        )}
                        {toggle("Custom axis range", "customAxis")}
                        {s.customAxis && (
                          <div className={styles.columns}>
                            {number("Minimum", "minimum")}
                            {number("Maximum", "maximum")}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
                {tab === "Analytics" && renderAnalytics()}
                {tab === "Labels" && (
                  <>
                    {kind === "bubble-chart" &&
                      toggle("Show category names", "showNames")}
                    {toggle("Show data labels", "labels")}
                    {!isComparison && toggle("Show legend", "legend")}
                  </>
                )}
                {tab === "Columns" && (
                  <fieldset className={styles.picker}>
                    <legend>Visible columns</legend>
                    <p>
                      Responses is always included. Use arrows to order optional
                      columns.
                    </p>
                    {TEXT_AI_VIEWER_COLUMNS.map((column) => (
                      <label key={column}>
                        <input
                          type="checkbox"
                          disabled={column === "Responses"}
                          checked={s.columns.includes(column)}
                          onChange={(e) =>
                            update({
                              columns: e.target.checked
                                ? [...s.columns, column]
                                : s.columns.filter((v) => v !== column),
                            })
                          }
                        />
                        {column}
                      </label>
                    ))}
                    <ol className={styles.columnOrder}>
                      {s.columns.map((column, i) => (
                        <li key={column}>
                          <span>{column}</span>
                          <button
                            type="button"
                            aria-label={`Move ${column} up`}
                            disabled={i <= 1}
                            onClick={() => {
                              const c = [...s.columns];
                              [c[i - 1], c[i]] = [c[i], c[i - 1]];
                              update({ columns: c });
                            }}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            aria-label={`Move ${column} down`}
                            disabled={i === 0 || i === s.columns.length - 1}
                            onClick={() => {
                              const c = [...s.columns];
                              [c[i + 1], c[i]] = [c[i], c[i + 1]];
                              update({ columns: c });
                            }}
                          >
                            ↓
                          </button>
                        </li>
                      ))}
                    </ol>
                  </fieldset>
                )}
                {tab === "Design" && (
                  <>
                    {select("Design type", "designScope", [
                      "Dashboard",
                      "Widget",
                    ])}
                    {s.designScope === "Widget" && (
                      <>
                        <div className={styles.row}>
                          <span>Theme color</span>
                          <DesignColorPicker
                            value={s.accent}
                            label="Widget theme color"
                            onChange={(accent) => update({ accent })}
                          />
                        </div>
                        {(kind === "bubble-chart" ||
                          kind === "trend-line" ||
                          isComparison) &&
                          select("Color palette", "palette", [
                            "categorical",
                            "divergent",
                            "blue",
                            "green",
                            "red",
                            "orange",
                          ])}
                        {select("Font size", "fontSize", [
                          "extra-small",
                          "small",
                          "medium",
                          "large",
                          "extra-large",
                        ])}
                        {select("Font family", "fontFamily", [
                          '"Fira Sans", Arial, sans-serif',
                          "Arial, sans-serif",
                          "Georgia, serif",
                          'Inter, "Segoe UI", Roboto, Arial, sans-serif',
                        ])}
                        {(isStack || kind === "gauge") && (
                          <fieldset className={styles.picker}>
                            <legend>Sentiment colors</legend>
                            {[
                              "Very negative",
                              "Negative",
                              "Mixed",
                              "Neutral",
                              "Positive",
                              "Very positive",
                            ].map((label, i) => (
                              <div className={styles.row} key={label}>
                                <span>{label}</span>
                                <DesignColorPicker
                                  value={s.sentimentColors[i]}
                                  label={`${label} color`}
                                  onChange={(color) =>
                                    update({
                                      sentimentColors: s.sentimentColors.map(
                                        (v, j) => (i === j ? color : v),
                                      ),
                                    })
                                  }
                                />
                              </div>
                            ))}
                          </fieldset>
                        )}
                      </>
                    )}
                    {s.designScope === "Dashboard" && (
                      <p className={styles.note}>
                        Follows the dashboard’s colors and typography, including
                        future changes.
                      </p>
                    )}
                  </>
                )}
              </div>
              {error && (
                <footer className={styles.footer}>
                  <p role="alert" className={styles.error}>{error}</p>
                </footer>
              )}
            </aside>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
