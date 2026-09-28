# PRD: Text AI Widget Settings

## Introduction
- Add configurable settings to all nine production Text AI widgets.
- Reuse BI controls when meaning matches; adapt analytical controls to Text AI.

## Problem and solution
- Text AI lacks widget settings, limiting how users present and explore their analysis.
- Add ⋮ → Settings with a right-side drawer, live preview and immediate save.
- Preserve existing sentiment calculations, coding, hierarchy and drill-down.

## Scope
- Gauge, Theme stacked bar, Sub-theme stacked bar, Trend line, Comparative chart, Sub-theme comparative chart, Text Viewer, Bubble chart and Text Summary.
- Shared name, filter scope, relevant analytical/display settings and design inheritance.
- Exclude new scoring models, weighting, statistical engines, AI processing and summary regeneration. Prototype-only KPI by Theme and Sub-theme trend remain unchanged.

## Prototype walkthrough
1. Open https://survey-re.vercel.app/ → TextAI → open a dashboard. Reference route: /text-ai/1.
2. Select the question; open any widget's ⋮ → Settings.
3. General: rename/show name; choose Dashboard, Widget, Combined or None filter scope.
4. Analytics, Labels or Columns: adjust the controls relevant to that widget and inspect the enlarged live preview.
5. Design: inherit Dashboard styling or choose Widget overrides for typography and colors.
6. Close the drawer; verify the card, reopen and reload to confirm persistence. Use Reset widget settings to restore defaults.
7. Add widget → choose the source question → select a chart → add it; configure the new card independently.
8. Repeat the widget-specific checks below. Use Text Viewer to test response text/date filters; aggregate sample-data limitations are explicit.

## Widget settings and walkthrough checks
- Gauge → Gauge / Sentiment Donut: precision, count/percentage/both, base and legend. Verify six sentiments keep their colors and proportions.
- Theme stacked bar → Topic Stackbar: orientation, order, All/Top 3/5/10/15/20/Selected, labels, zero-volume visibility and legend. Verify hiding a theme does not change the denominator.
- Sub-theme stacked bar → Topic Stackbar + hierarchy: same controls plus parent/sub-theme selection, per-parent limit and default expansion. Verify grouping and drill-down.
- Trend line → Scoring Trend / Segment Trend: weekly/monthly/quarterly/yearly interval, precision, axes/range, labels and tooltips. Metric remains average sentiment by collected date; missing periods are gaps.
- Comparative chart → Tabular: precision, counts/percentages/both, ordering, theme selection, Overall, existing slicers, sub-theme expansion and eligible stat testing.
- Sub-theme comparative → Tabular: comparison controls plus parent context and flat/grouped display. Verify existing test eligibility and drill-down are retained.
- Text Viewer → Response Viewer / Text Response: keep Responses required; show/reorder Themes, Sub-themes, Insights, Tags and Collected on; date order, 10/25/50/100 rows, wrap/truncate, highlighting and search.
- Bubble chart → new controls: theme/sub-theme level, selection, Top N, minimum mentions, names/values, legend and categorical colors. Verify area reflects mentions and drill-down/back navigation works.
- Text Summary → new controls: save Thematic / Thematic + Sentiment, section visibility and compact display. Caveats and source context remain; no AI regeneration.

## Business rules
- Reuse BI labels, defaults and interactions only where semantics match. There is no verified entire-settings one-to-one match.
- Opening settings changes nothing. Show only controls supported by the widget. Source selection stays in the existing flow.
- Apply filters to analyzed responses. Combined means dashboard AND widget filters; None bypasses both.
- Filter and sort before Top N/manual display selection. Category visibility never changes coding or silently renormalizes percentages.
- Disclose response/mention/assignment bases; overlapping themes are not unique respondents.
- Inherit dashboard design by default. Widget overrides remain local; sentiment colors retain the same six category identities.
- Save valid edits immediately and independently by dashboard/widget. Invalid dates, blank names and axis min ≥ max are rejected; save failures retain last saved values.
- Reset restores widget defaults and dashboard design inheritance. Supported copy/duplicate flows retain independent settings.
- Keep existing access rules: editors configure; viewers cannot edit. Supported exports/shared rendering reflect saved settings.
- Empty data has a clear no-data state. Settings never trigger recoding, weighting, AI processing or credit consumption.

## Acceptance criteria
- Every scoped widget exposes Settings with only relevant working tabs and controls.
- Valid changes appear immediately in the preview and card; another widget remains unchanged.
- Reopen/reload retains saved settings; newly added cards retain settings independently; reset restores defaults.
- Filter scope and selection order match the business rules; hidden categories preserve denominators and sentiment identities.
- Hierarchy, existing statistical eligibility, search and drill-down remain usable; required Responses and summary caveats cannot be hidden.
- Invalid values and storage failures show clear feedback without losing saved values; empty results are explicit.
- Existing baseline presentation remains unchanged on opening Settings; dashboard design inheritance and widget overrides work.
- Product integration must verify persisted permissions, applicable exports and shared rendering before production release.

## Prototype boundaries
- Browser-local persistence and synthetic fixtures demonstrate the interaction, not production data processing.
- Text Viewer applies text/date filters. Aggregate widgets show unavailable results while response filters are active; None restores baseline.
- Gauge counts are synthetic assignments. Trend averages are illustrative. Neither certifies production calculation.
- Server persistence, aggregate response recalculation, permissions and export/shared-view parity require product integration.
- The live URL is the intended review destination; feature deployment should be verified separately.
