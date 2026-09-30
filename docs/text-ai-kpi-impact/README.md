# Impact on KPI prototype

Implemented on 2026-09-29; table refinement browser-checked on 2026-09-30. This is a local product prototype, not verified QuestionPro production behavior.

## Open and use

Open `http://localhost:3000/text-ai/1`. Choose **Add widget → text question → Impact on KPI → Next → KPI question → Add widget**. KPI selection is required. Added KPI widgets and their settings live only in React page memory and reset on reload or a new page session; no database or browser-storage entries are created for them. Legacy saved KPI collection entries are ignored and omitted by the existing collection writer.

- Open the widget menu → Settings to choose the KPI question (NPS, CSAT, visit rating, or likelihood to return). Apply saves the KPI choice; Cancel discards the draft.
- Expand a theme to compare subthemes on the same impact scale, or use the outlined Expand all / Collapse all button.
- Click any column heading to sort ascending/descending. Initial sorting is signed impact ascending (most negative first). Theme name, impact, KPI, response count and share are sortable; unavailable values stay last. The Overall row always comes first, and subthemes stay under their parent.
- Click a bar, theme, or response count to inspect its calculation and supporting responses.
- Dashboard response-text and date filters recalculate the analysis base, theme groups, and comparison groups together. Searching inside the response dialog only filters its list.

The demonstration uses 1,500 deterministic synthetic restaurant responses dated September 1–28, 2026, including overlapping tags and missing KPI answers. This fixture is shared across question selections; it is not connected to the selected survey's real responses. The widget explicitly labels the synthetic data. Theme-selection controls elsewhere in the existing dashboard do not subset this fixture. Expand/collapse, sorting, and the Analytics settings display limit are session state.

## Calculation contract

Let B be the unique response IDs remaining after dashboard filters, with nonblank analyzed text and a valid answer to the selected KPI. Let T be the responses in B tagged with the theme or subtheme. Let R = B excluding T.

| Number | Formula |
| --- | --- |
| Overall KPI | KPI(B) |
| Theme KPI | KPI(T) |
| Observed impact | KPI(B) − KPI(R) |
| Responses | Count of unique IDs in T |
| Share of base | 100 × count(T) / count(B) |
| Text coverage | 100 × count(B) / count(valid KPI responses after filters) |

NPS = 100 × (promoters − detractors) / valid responses. Promoters score 9–10, detractors 0–6, and passives 7–8 remain in the denominator. CSAT = 100 × responses scoring 4 or 5 / valid responses on the 1–5 scale. Mean rating = sum of valid scores / valid responses. Impact units are NPS points, percentage points, and rating-scale points respectively.

Calculations retain full precision; only displayed values are rounded. Parent membership is a deduplicated union. Children use the same B as parents. Impacts are not additive when themes overlap, and they do not estimate the causal effect of improving an issue. Empty groups and empty complements produce unavailable impact rather than zero. Groups or complements below 30 responses carry a sample-size caution, not a significance claim.

The reference example is tested: overall NPS +40, theme NPS −20 for 200 of 1,000 responses, remaining-group NPS +55, observed impact −15 points.

## Verification

- `npm run test:text-ai-kpi`: eight tests cover the reference example, overlapping tags and deduplication, invalid/missing answers, unanalyzed text, empty/complement edge cases, CSAT and means, shared filters, the impact identity across fixture rows, and column sorting with unavailable values.
- Targeted ESLint and `git diff --check` pass.
- Browser checks cover adding a widget, session reset on reload, KPI switching, sorting, expansion, response drilldown/search, filtered groups, and empty states.
- Full project TypeScript checking is blocked by existing unrelated WickUI errors in `EssentialsAccountUnderReviewBanner.tsx`, `SurveyDesignDashboard.tsx`, and `SurveyEditorWorkspaceToolbar.tsx`. No errors were reported in the changed widget files. A production build is not claimed.

Before production, replace the synthetic fixture with response-ID joins to the selected question and KPI, map the actual analysis status and filter semantics, and establish the survey's weighting and KPI-direction rules. The prototype currently uses unweighted responses and treats higher KPI values as better.

## Table layout and KPI selection (September 30 refinement)

The widget is a header plus one table. The redundant text-question subtitle, sort dropdown, KPI toolbar, summary cards, context strip and formula footer have been removed. The title remains Impact on KPI; the score column and impact unit identify the selected metric. The bottom Overall row contains the baseline KPI, eligible response count and 100% share. Its impact cell is unavailable, not an invented zero or a sum. Coverage, excluded-response counts, source questions and methodology are available from the Overall label. Coverage matters for explaining why this baseline may differ from an all-survey KPI, but does not need a permanent column repeated on every theme.

Public production documentation reviewed September 30 confirms that TextAI starts from a Survey/CX/EX/Dataset source and selected open-ended questions ([setup guide](https://www.questionpro.com/help/bi/advanced-text-analytics-dashboard.html)). The local working reference documents the widget question/type/name flow. Neither establishes a production theme-impact KPI selector; this remains a proposed extension.

The prototype's former dropdown was a fixed list of four sample KPI questions. It changes the outcome question and calculation; it does not transform the text's sentiment into NPS or discover production fields. Settings now exposes the field code and metric with its question text and scoring rule.

Recommended production setup: bind one analyzed text question to one eligible outcome question from the same source using response IDs. Offer an explicit choice when multiple eligible fields exist; preselect and confirm when only one exists. With no eligible field, show that setup is unavailable rather than infer a KPI from sentiment. Native question metadata may establish NPS semantics; arbitrary numeric columns require explicit scoring configuration. Persist field identity and scoring configuration per widget. The same-source picker and these eligibility cases require production data integration; the local fixture intentionally does not pretend to implement source discovery.

## Production visual reconciliation — verified September 30, 2026

The earlier sign-in blocker is resolved. Browser connection metadata matched the approved `questionpro.com` Chrome extension, and the visible QuestionPro account menu confirmed `prabal.gupta@questionpro.com`. Measurements below come from rendered production v202 in [Knowledgebase / TextAI 9493](https://bi.questionpro.com/workspaces/2665/text-ai/dashboards/9493), not inferred from the local component package.

### Shared specifications applied

- Visible widget titles: **16px / 24px, weight 500**, Fira Sans, at Medium. Production has an outer 18px h3 wrapper, but its inner visible title is 16px. The previous provisional 18px setting is superseded.
- Card headers: **44px**; menu and expansion controls **32px** with **16px glyphs**. Cards: **8px radius**, white background, **1px rgba(0,0,0,.2)** border.
- Regular TextAI body scale: 13px, with type-specific sizing below. Other design sizes and font overrides remain available. BI presentation typography is unaffected.
- Expand/collapse: `wm-shadow-add` / `wm-shadow-minus`, confirmed by toggling production comparative rows. Applied to KPI, comparative, and subtheme stacked bars. KPI row disclosure uses `wm-chevron-right`, matching the comparative table.
- KPI sorting uses the same paired `wm-arrow-drop-down` / `wm-arrow-drop-up` markup and active-state placement as the existing response viewer's WuTable.
- Fixed title **Impact on KPI**; no sample badge, header information icon, question subtitle, or text Expand all button. Overall still exposes methodology and coverage. Synthetic-data disclosure stays in settings and drilldown.
- Removed redundant chart-type subtitles from overview, legacy theme, and prototype subtheme-trend headers.

### Widget coverage

| Widget | Production reference | Reconciliation |
| --- | --- | --- |
| Comparative | 27194 | 12px/24px semibold table header, 13px/24px cells, 10px/14px header padding and 9px/14px cell padding; gray header and grid borders; expand-all icon added |
| Subtheme comparative | 27214 | Same table and card treatment; no expand control when rows have no children |
| Text viewer | 27198 | 12px/16px text, regular-light body weight, gray compact header, 16px horizontal cell padding; only Responses and Collected on sortable; range picker between production back/forward icons; page size stays in settings |
| Text summary | 27193 | 13px/22.1px prose, bold 13px section headings, 16px content inset, common header |
| Gauge | 27199 | Common header/card/typography; compact chart labels and 12px legend |
| Theme stacked bar | 27213 | Common header/card; compact chart/legend labels |
| Subtheme stacked bar | 27504 | Production parent labels are approximately 16px, unlike the 13px comparative rows; retained this distinction, 12px table header, icon expansion and compact legends |
| Bubble chart | 27505 | Common header/card and compact labels; prototype keeps its illustrative bubble renderer |
| Trend line | 27506 | Common header/card and compact axis labels; prototype keeps its illustrative SVG renderer |
| Subtheme trend | No separate type in production chooser | Shared chrome/typography aligned; retained as a prototype extension |
| Impact on KPI | No corresponding production type | New functionality; shared controls and visual specifications aligned, without claiming production feature availability |

These changes reconcile general visual specifications. They do not replace synthetic data, reproduce every production chart-renderer behavior, or establish functional parity for prototype-only settings. Canvas-based production chart labels were visually compared; exact internal canvas font metrics are not claimed.

### New reusable production reference assets

Created from the already analyzed Service feedback question in dataset 2469 on TextAI9493; no reanalysis was requested:

- **27504** — KB-UI01 | Subtheme style reference
- **27505** — KB-UI02 | Bubble style reference
- **27506** — KB-UI03 | Trend style reference

All three names and IDs persisted after reload. They are also recorded in the knowledge-base asset registry. This is evidence of current appearance, not a newly released product capability.

### Validation

- Browser confirms all ten rendered prototype headers are 44px, titles 16px/500, cards 8px; comparative cells 13px/24px and text-viewer cells 12px/16px.
- Exercised KPI expand/collapse, column sorting, comparative expand/collapse, response-page dropdown, and summary control sizing.
- Eight KPI calculation/sorting tests pass. Targeted ESLint passes for the functional changes. A broader lint run additionally finds an existing set-state-in-effect warning in the prototype subtheme-trend component; this unrelated behavior was not changed.
- Full TypeScript checking reports the existing unrelated survey-component WickUI errors listed above; no changed TextAI errors remain after correcting the select variant.
- Evidence: `production-chart-references.png`, `production-matched-kpi.png`, and `production-matched-viewer.png`.

## KPI-only table refinement — September 30

- Corrected sorting glyph line height to 28px, matching the response viewer. The previous 16px inherited line box caused crossed/overlapping unsorted carets despite using the correct glyphs and offsets.
- Moved Overall to a semantic table footer, after every theme/subtheme and outside sorting. It retains the eligible-base KPI and response count, and opens methodology/coverage details. This is a comparison baseline, not a sum of theme rows.
- All five headers occupy one line. Removed the permanent bar-scale labels and second-line unit. Impact now reads **Impact (pts)** for NPS/mean ratings and **Impact (pp)** for CSAT, recalculated with the selected KPI. The full unit and symmetric scale remain in the header tooltip.
- Retained KPI question selection in Settings: it selects an outcome field from the same response source, rather than converting sentiment into a KPI. Multiple fields justify a picker; one eligible field can be preselected in production.
- Browser checked caret geometry against WuTable, column sorting, footer ordering, and metric-dependent headers. Eight KPI tests and targeted lint pass.

## Session-only creation and shared settings — September 30

The KPI widget now uses `TextAiConfiguredWidget`, the same live-preview/right-panel settings surface as existing widgets. General supports the existing name/filter controls. Analytics contains the KPI question dropdown, theme limits and the Overall baseline toggle. The default-expansion toggle and explanatory KPI paragraphs are omitted. Design uses the existing dashboard/widget typography and color controls. Only controls implemented for KPI are shown. Changes apply immediately in page memory. The prior separate Apply/Cancel KPI dialog is removed.

Creation has an additional KPI step for this chart type. The Add action is disabled until a KPI is selected, Back/breadcrumb navigation retains the draft, and cancel resets it. Other chart flows remain unchanged. Names entered during KPI creation are respected. One widget binds one text question to one KPI field; change the KPI in Analytics or add multiple widgets for different outcomes. Each KPI calculates its own eligible base because missing answers differ. The prototype catalogue and text tagging share synthetic response objects; a production implementation must discover eligible same-source fields and join analyzed text/tags to answers by response ID. This is observed association, not a regression/correlation coefficient or proof of causation.

KPI cards now size to content. A ResizeObserver reports their actual height to the existing dashboard grid, including changes from expansion, filters, wrapping and display limits. KPI vertical resizing is disabled so it cannot reintroduce empty space; dragging remains available. The only gap after the footer is the 1px card border.

Session boundaries: KPI collection entries, per-widget settings and deletion state use React state only. Reload verified zero KPI widgets remaining; existing non-KPI browser persistence is outside this change. No database/API writes were introduced.

Verification: nine formula/sorting/filter tests pass, including intersection of dashboard and widget conditions before denominator calculations. Targeted lint passes. TypeScript still reports only the pre-existing unrelated survey-component errors. Browser verification covers mandatory KPI selection, creation, settings preview/KPI switching, expansion/content sizing, and reload reset.

## Settings simplification — September 30

Removed automatic-save/session descriptions, saved-state footer messages and Reset widget settings from the shared TextAI settings panel. Actual errors remain visible. Impact on KPI uses the compact KPI question dropdown in Analytics; General matches the shared name/filter controls. Creation retains its separate required KPI-selection step.
