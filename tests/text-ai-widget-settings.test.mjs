import test from "node:test";
import assert from "node:assert/strict";
import {
  defaultTextAiWidgetSettings as defaults,
  normalizeTextAiWidgetSettings as normalize,
  textAiWidgetSettingsKey as key,
  saveTextAiWidgetSettings as save,
  activeTextAiFilters,
  matchesTextAiFilters,
  selectTextAiItems,
  textAiMetricLabel,
  textAiTrendPoints,
  TEXT_AI_SENTIMENT_OBSERVATIONS,
  EMPTY_TEXT_AI_FILTER,
} from "../src/data/text-ai-widget-settings.ts";

test("malformed persisted configuration cannot remove the response column or create invalid ranges", () => {
  const s = normalize(
    {
      precision: 99,
      columns: ["Tags", "Bogus", "Tags"],
      minimum: 10,
      maximum: -1,
      customAxis: true,
      showOverall: false,
      segments: [],
      fontFamily: "bogus",
      sentimentColors: ["red"],
    },
    "text-viewer",
    "Name",
  );
  assert.equal(s.precision, 5);
  assert.deepEqual(s.columns, ["Responses", "Tags"]);
  assert.equal(s.customAxis, false);
  assert.ok(s.minimum < s.maximum);
  assert.equal(s.showOverall, true);
  assert.equal(s.fontFamily, defaults("text-viewer", "Name").fontFamily);
  assert.equal(s.sentimentColors.length, 6);
  for (const v of [null, [], 1, "x"])
    assert.deepEqual(normalize(v, "gauge", "Name"), defaults("gauge", "Name"));
});
test("settings persist independently by dashboard and widget; failed save leaves original untouched", () => {
  const data = new Map();
  const storage = {
    setItem(k, v) {
      data.set(k, v);
    },
  };
  const original = defaults("gauge", "First");
  save(storage, key(1, "first"), original);
  const second = { ...original, name: "Second", precision: 3 };
  save(storage, key(1, "second"), second);
  assert.equal(
    normalize(JSON.parse(data.get(key(1, "first"))), "gauge", "Name").name,
    "First",
  );
  assert.equal(
    normalize(JSON.parse(data.get(key(1, "second"))), "gauge", "Name")
      .precision,
    3,
  );
  assert.notEqual(key(1, "first"), key(2, "first"));
  assert.equal(
    save(
      {
        setItem() {
          throw Error("quota");
        },
      },
      key(1, "first"),
      second,
    ),
    false,
  );
  assert.deepEqual(JSON.parse(data.get(key(1, "first"))), original);
});
test("Dashboard, Widget, Combined and None evaluate the intended analyzed-response predicates", () => {
  const d = { query: "guide", start: "2026-04-01", end: "2026-04-30" };
  const w = { query: "clear", start: "", end: "" };
  const s = { ...defaults("text-viewer", "Name"), responseFilter: w };
  const rows = [
    { value: "A clear guide", collectedOn: "2026-04-01" },
    { value: "No guide", collectedOn: "2026-04-30" },
    { value: "Clear answer", collectedOn: "2026-05-01" },
    { value: "Guide", collectedOn: undefined },
  ];
  for (const [filter, count] of [
    ["Dashboard", 2],
    ["Widget", 2],
    ["Combined", 1],
    ["None", 4],
  ])
    assert.equal(
      rows.filter((r) =>
        matchesTextAiFilters(r, activeTextAiFilters({ ...s, filter }, d)),
      ).length,
      count,
    );
  assert.deepEqual(
    activeTextAiFilters(defaults("gauge", "Name"), EMPTY_TEXT_AI_FILTER),
    [],
  );
});
test("Top N and manual display select categories without changing percentages or mutating source rows", () => {
  const rows = [
    { id: "a", label: "Alpha", count: 3, percent: 30 },
    { id: "b", label: "Beta", count: 8, percent: 80 },
    { id: "c", label: "Gamma", count: 0, percent: 0 },
    { id: "d", label: "Delta", count: 4, percent: 40 },
  ];
  const s = { ...defaults("comparative-chart", "Name"), display: "Top 3" };
  assert.deepEqual(
    selectTextAiItems(
      rows,
      s,
      (r) => r.label,
      (r) => r.count,
    ).map((r) => r.id),
    ["b", "d", "a"],
  );
  const selected = selectTextAiItems(
    rows,
    { ...s, display: "Selected", selectedIds: ["b"], precision: 2 },
    (r) => r.label,
    (r) => r.count,
  );
  assert.equal(selected[0].percent, 80);
  assert.deepEqual(
    rows.map((r) => r.id),
    ["a", "b", "c", "d"],
  );
  assert.deepEqual(
    selectTextAiItems(
      rows,
      { ...s, display: "Selected", selectedIds: [] },
      (r) => r.label,
      (r) => r.count,
    ),
    [],
  );
  assert.equal(
    textAiMetricLabel(8, 80, { metric: "Both", precision: 2 }),
    "8 (80.00%)",
  );
});
test("trend interval grouping preserves weighted totals rather than averaging rounded means", () => {
  const expectedBase = TEXT_AI_SENTIMENT_OBSERVATIONS.reduce(
    (n, r) => n + r.base,
    0,
  );
  const expectedMean =
    TEXT_AI_SENTIMENT_OBSERVATIONS.reduce((n, r) => n + r.score * r.base, 0) /
    expectedBase;
  for (const interval of ["Weekly", "Monthly", "Quarterly", "Yearly"]) {
    const points = textAiTrendPoints(interval);
    assert.equal(
      points.reduce((n, r) => n + r.base, 0),
      expectedBase,
    );
    assert.ok(
      Math.abs(
        points.reduce((n, r) => n + r.value * r.base, 0) / expectedBase -
          expectedMean,
      ) < 1e-10,
    );
  }
  assert.equal(textAiTrendPoints("Monthly").length, 6);
  assert.equal(textAiTrendPoints("Quarterly").length, 2);
  assert.equal(textAiTrendPoints("Yearly").length, 1);
});
test("reset defaults maintain widget-specific presentation and sentiment identities", () => {
  assert.equal(defaults("gauge", "Name").metric, "Percentage");
  assert.equal(defaults("comparative-chart", "Name").metric, "Both");
  assert.deepEqual(defaults("subtheme-comparative-chart", "Name").segments, []);
  const s = normalize(
    {
      sentimentColors: [
        "#111111",
        "#222222",
        "#333333",
        "#444444",
        "#555555",
        "#666666",
      ],
    },
    "gauge",
    "Name",
  );
  assert.deepEqual(s.sentimentColors, [
    "#111111",
    "#222222",
    "#333333",
    "#444444",
    "#555555",
    "#666666",
  ]);
});
