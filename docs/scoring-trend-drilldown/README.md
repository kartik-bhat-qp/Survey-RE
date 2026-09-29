# Scoring Trend drilldown prototype

Implemented in Survey-RE, 28 September 2026. Open `http://localhost:3000/dashboards/1` and scroll to **Scoring Trend**.

## Agreed behavior

- Always available on Scoring Trend; no enable/disable setting.
- Select a trend point → the same question's answer distribution in a bar widget → select a non-empty bar to see matching item responses.
- Inline WickUI drilldown navigation, with breadcrumbs and explicit Back controls.
- Drill context contains the selected period and slice. Slice tabs return at the trend level; the detail level retains only the selected slice.
- Moving-average points drill into the clicked period only. The detail explains that the point used a moving average.
- Existing Dashboard/Widget/Combined/None date scope is preserved. Applicable dashboard criteria and response status intersect with the slice. Changes to settings or filters reset the navigation so stale drill context is not retained.
- Published production limits: 100 saved slicers, 10 applied; Overall is not a slice. The existing five-slicer BI package/Lite licensing demo remains separate.

## Production references

Visible account checked as `prabal.gupta@questionpro.com` in the approved `questionpro.com` Chrome extension connection.

- [Production scoring trend and bar gallery](https://bi.questionpro.com/workspaces/2656/dashboards/24762): “Happy - Sad Scoring Trend (Survey-backed)” and “Top Concerns (Survey-backed)”. Inspected chart markers, muted colors, axes/grid, inside percentage labels and widget header/frame.
- [Live TextAI response-detail reference](https://bi.questionpro.com/workspaces/2665/text-ai/dashboards/9493): subtheme counts open contextual matching responses, search, sort and pagination. This existing modal behavior is evidence for the detail controls; the new inline Scoring Trend flow is a prototype.
- [WickUI Drilldown documentation](https://wick-ui-lib.pages.dev/?path=/docs/components-effects-%F0%9F%9A%A7-drilldown--docs): verified `items`, `initial`, `baseTitle`, `variant`, `headerClasses`, `offsetHeight`, `goNext`, `goBack`. Uses installed `WuDrilldown`, dynamically imported with SSR disabled.
- [Published BI limits](https://www.questionpro.com/help/bi/bi-dashboard-limits.html).

## Implementation

`TimeSeriesDashboardCard` is still the existing dashboard integration point. `ScoringTrendDrilldown` renders all three levels using the existing amCharts renderer and WickUI navigation. Other trend types keep their previous behavior. Dashboard slicer selection is lifted through the settings, tab bar and canvas into the scoring card.

`time-series.ts` exposes one deterministic respondent fixture used by the trend mean/base, seven answer-distribution bars and response records. Slice definitions are explicit criteria in `mock-data-slicers.ts`; a slice without criteria cannot silently expand to Overall. Search and 10-row pagination operate within the already-filtered item responses.

This is a local synthetic-data prototype, not a production release or a backend integration. It retains the existing seven-point scoring fixture and its existing scoring-model semantics. No production data, dashboard configuration or sharing state was changed. Dashboard slicer selections remain session state; widget analytics settings use the existing local storage behavior.

## Verification

- 18 data/reporting-year tests pass, including period/base reconciliation; all five slice predicates; dashboard/widget date intersections; status/criteria inheritance; moving-average clicked-period scope; empty/excluded cases; and ten applied slices.
- ESLint passes for all changed TypeScript/TSX files.
- Browser: Overall January base644; “1 - Sad”85 records; next page11–20; empty search state; Back to same distribution; Northeast/age25–34 January base36 and five “1 - Sad” records; point/bar activation with Enter. Moving-average March drilldown retained only 1–31 March and35 records, with the scope note. Applying/removing a slicer in Dashboard settings updates the trend tabs. Pointer activation was also verified on the rendered August point. No runtime errors captured.
- Project-wide TypeScript check is blocked by the pre-existing `WuAlert` import/type errors in `EssentialsAccountUnderReviewBanner.tsx`. No errors were reported in the changed files.
- Evidence and screenshots: `evidence/`.
