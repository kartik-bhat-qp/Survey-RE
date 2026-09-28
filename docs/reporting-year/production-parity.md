# Production comparison — 28 September 2026

Verified QuestionPro production v202 through the questionpro.com Chrome extension (browser3 / ab453961-a7c8-4c85-ae9d-5670c67e4a5b) and visible account prabal.gupta@questionpro.com.

Reference dashboard: https://bi.questionpro.com/workspaces/2656/dashboards/24762

## Inspected controls and rendering

| Widget | Production observation | Prototype change |
|---|---|---|
| Segment Trend 374475, Tab 2 | Line series, circle markers, data labels, bottom legend. Settings in right440px panel with enlarged chart preview. General / Analytics / Segment / Design. | Removed in-chart interval toolbar, reporting-calendar caption and debug response table. Added matching settings/preview layout. |
| Segment Trend | Analytics: Weekly, Monthly, Quarterly, Yearly; Count/Percent; simple moving average; exclusion/minimum responses; Default/Custom/None tooltips (Custom exposes Show title/count/percentage); Dashboard/Widget/None weighting. | Same visible analytics groups and interval options; local functional regrouping, percentages, smoothing, exclusion, tooltip and persisted settings. No fixture weighting schemes available. |
| Segment Trend | Segment: custom percentage calculation, custom for each segment, denominator Add, searchable segment list with edit/delete. Editor contains name, source, response status, date range and criteria. | Segment and denominator dates are independently clipped to each bucket. The prototype source and criteria are limited to its synthetic response groups. Full production source/question/AND/OR editor is not reproduced. |
| Scoring Trend 374497, Tab 1 | General / Analytics / Design. Analytics: four intervals, smoothing (1–12 intervals, default2), precision, exclusion/minimum responses, stats, Mean/NPS/CES/CSAT, custom mean answer weights, weighting schemes. | Added Scoring Trend example with these analytics controls and response-weighted synthetic mean; saved frequency and dates are independent. Full production scoring-threshold configuration and alternative question-chart switching are not reproduced. |
| Response Timeline 404570, Tab 1 | Created `Timeline preview` using existing synthetic survey13687140 /650 responses. Filled step chart, no segment legend. Daily (default), Weekly, Monthly, Quarterly, Yearly. Smoothing, widget stats, tooltip style, weighting; no exclusion or scoring model observed. | Added Response Timeline with these controls and a filled step chart. Daily counts and all other intervals preserve the same synthetic response base. |
| Common General | Name, highlighted insight, Dashboard/Widget/Combined/None filter scope, axis titles, highlight highest, data labels, custom axis. Timeline label choices None/Outside/Inside Top/Inside Base/Center; Segment None/Above/Below. | Scope/date controls and axis/data-label controls added. Combined uses intersection in the prototype; exact backend semantics were not established by this inspection. |
| Design | Dashboard/Widget inheritance; widget override exposes Theme, theme color, Categorical palette, font size, font family. | Same groups with local color/font overrides. Only the fixture's Default theme/Categorical palette are provided. |

## Production side effects

- Scoring Trend smoothing and exclusion were briefly enabled individually to inspect their dependent fields, then restored to **off/off**. Mean/custom weights and Monthly interval retained.
- Segment Trend custom percentage, custom tooltip and Widget design override were inspected and restored to **off / Default / Dashboard**. Existing segment editor cancelled.
- New synthetic Response Timeline **404570**, named **Timeline preview**, remains on Tab 1 at **Monthly**. No existing widgets, filters, shares or access settings were deleted or changed permanently.
- Production screenshots: production-segment-settings.png, production-scoring-settings.png, production-timeline-settings.png in screenshots/.

## Scope of fidelity

This iteration matches the inspected time-series presentation and main date/frequency settings. It is **not an assertion of exhaustive pixel-exact or backend parity**. The data is a deterministic local fixture; weighting schemes, full source/question builders, alternative scoring-model configuration, chart-type conversion, exports, and other existing mock widgets are not equivalent to the production analytics engine. CES/CSAT/NPS are illustrative fixture calculations rather than certified production formulas.

Reporting years are a proposed feature; their shifted quarterly/yearly grouping is prototype behavior, not a production release. Production calendar-frequency behavior remains as recorded in ../../date-range-audit-2026-09-28/analysis.md.

Validation: TypeScript, targeted ESLint, calendar and aggregation tests; browser inspection of settings layout and fiscal quarters. Weekly boundaries use Sunday, matching the earlier production Feb9–15 observation. Tests cover daily/quarterly/yearly total invariance, weighted means, combined-date clipping, empty intersections, percent bases and segment/denominator date boundaries.
