# Heat Map Chart production baseline

Updated September 25, 2026. This is a local prototype based on observed production behavior, not a production release. Custom CSAT enhancements remain deferred.

## Preview and approved prototype scope

Server: `http://127.0.0.1:3000/dashboards/1` (`npm run dev -- --hostname 127.0.0.1 --port 3000`). The existing server remains running.

Every regular, BI-lite and BI-package dashboard tab includes exactly one fixed Heat Map Chart. All nine default widgets occupy equal-width columns in a two-column desktop grid; mobile uses one column. The former standalone URL redirects to the normal dashboard. Advanced → Heat map → Next explains that the fixed widget is already included. No widget is added, stored or created.

Fixed-widget configuration persists separately by dashboard/tab/widget. Saved dashboard design persists independently by dashboard ID. The removed dynamic widget collection is never hydrated. Its retired keys are narrowly cleaned up without deleting unrelated settings. Shared dashboards retain their access rules and show heat-map data unavailable because their filtered response fixture is different.

Duplicate, Copy to and Delete remain intentionally noncreating/nondeleting in this fixed-widget prototype. This is the user-approved scope, not an unresolved production defect.

## Evidence

- Current production: https://bi.questionpro.com/workspaces/2658/dashboards/27410, widgets403684 and403682.
- Older matrix reference: https://bi.questionpro.com/workspaces/348/dashboards/25868, widget393498.
- Work-root `heat-map-audit-2026-09-22.md` and `heat-map-compatibility-survey-2026-09-25/widget-update.md`.
- `heat-map-compatibility-survey-2026-09-25/fourteen-question-production-scores.json`: independent production values for fourteen questions, Overall plus five cohorts, Default and0–10, including bases and normalization exceptions.
- [Independent review](INDEPENDENT-REVIEW.md): root-agent verification of routes, layout, isolation and all168 external score values.

Browser evidence used the Chrome extension profile `questionpro.com`, extensionInstanceId `ab453961-a7c8-4c85-ae9d-5670c67e4a5b`, and visibly verified `prabal.gupta@questionpro.com`. Production source selections and settings were temporarily tested with user approval and restored; root independently confirmed restoration. No production insight was posted and no external export was downloaded.

## Verified score and display behavior

Default local question: ordinal Q5. Column order intentionally remains1 Very poor,3 Neutral,2 Poor,4 Good,5 Excellent. Counts22/16/23/18/21, means1/3/2/4/5, precision0. Overall, Overall average, Response count and Widget stats are off. The response-count header remains visible despite its toggle being off.

- Five custom colors exactly match production DOM: `#f85271`, `#f69a79`, `#f1da7e`, `#94d08b`, `#42bd84`. Title `#1b3380`, Fira Sans18px/500; Medium cell text14px; header`#e8e8e8`, count-label`#f5f5f5`.
- Q5 Overall2.93;0–10 gives5.86; reversal then0–10 gives6.14 and cohort values10/6/8/4/2. For this fixture reversal occurs before scaling.
- Mixed matrix parent2.9567; Ease2.9300, Speed2.9100, Reliability3.0300. Other means: ordinal2.9300, nominal2.5000, multi3.0200, dropdown2.5000. Overall average2.8314 averages the seven leaf rows in this equal-response-base fixture.
- In0–5, nominal/dropdown become3.1250 (native max4); Overall average3.0100. Reversing the matrix affects only its first child: Ease3.0700, other children unchanged, parent3.0033, Overall average3.0300. This observed quirk is retained.
- Response count ON adds `n = …` below leaf/individual cells, not matrix parents or Overall average. Q21 and Q26 display0.0000 withn=0. Q26 renders asLast Name. Q40 has no n annotation.
- Fourteen direct questions reproduce every recorded Overall/cohort Default and0–10 value. Q9 behaves as1–11 codes, and Maps uses an inferred max51. Recorded normalized values are used directly to preserve production rounding, especially Q40.
- The mixed inherited two-band snapshot has redcount`#ff7681` and yellow observed scores`#ffcb47`. Arbitrary inherited color behavior beyond the measured snapshots is not independently established.
- The historical three-matrix fixture retains its rounded values, ten child rows, two-band mismatch and observed9/20 selection counter.

## Configuration and interaction coverage

General includes name visibility/text, highlighted-insight flag, Filter options and Dashboard/Widget/Combined/None scopes. Widget/Combined expose Create filter. Insights opens the observed empty drawer with an editable local draft; posting is not implemented.

Analytics includes production precision labels `0 (0)` through `4 (0.1234)`, Overall/count/average switches, ranges, searchable reversal selection,2–5 bands, one colored multi-thumb threshold track, Widget stats/count label, and weighting scope. Widget weighting opens a searchable empty selector with “No results found.”

Measured desktop Analytics positions match production: precision label116/control140; switch tracks196/236/276; range label308/control332; reverse label380/control404; band count452; trackcenter511; statslabel596; weightingheading660; scheme row705. Controls use12px labels and32px inputs,32×8 switch tracks with16px thumbs. Opening Settings centers the widget beside the440px drawer.

Rows & Columns includes search, individual/select-all segment choices, selector sorting (which does not reorder chart columns), and local segment creation/edit/deletion. The filter/segment editor has response status, the existing date-range picker, searchable question selection, Is/Is not, multi-answer choices, AND criteria, OR blocks and removal. Execution is restricted to known Q5 cohorts and the documented100-completed-response fixture. Cross-question predicates and unobserved system/dataset/geographic fields return an explicit unavailable message. Combining rounded cohort means is a local calculation; it is not evidence of production behavior for arbitrary filters.

Design includes dashboard/widget scope, theme color, Default/Custom sentiment, swatches, font size and font family. Theme/sentiment colors use the shared hex/saturation/hue picker; single-value settings use the same WuSelect primitive observed in production.

Edit begins with the observed1200px-wide widget-type/sample step, drafted name and samplecount124/Gender1/Colorsyou like2. The sample is not live response data. Survey rows advance directly to questions. The current picker has26 entries:15 direct checkbox rows (fourteen named plus Untitled) and11 disclosure-only rows. Question search/sort, Save/Back/Cancel and the stepper are implemented. The eleven parent disclosures reproduce the observed non-expanding behavior; saved matrix rows still expand in the chart. Fresh fourteen named selections work. The exact observed all-fifteen selection reproduces the null-question error; the individual cause is not claimed.

Info uses the observed owner/source/count metadata structure and dated snapshot timestamps. Image/PDF menu actions now use a local raster renderer. PDF binary offsets are unit-tested. Download execution and production export-format fidelity have **not** been browser-verified: the browser download tool does not guarantee a destination under Work, and default Downloads would violate the workspace boundary.

## Final QA

- 36 targeted tests passed: heat-map calculations, parser/serialization, source inventory, Q5 AND/OR filtering, PDF structure, dashboard layout and sharing.
- Full TypeScript and scoped ESLint passed; whitespace check passed.
- Browser verified all fourteen Default and0–10 rows, all response annotations, exact mixed aggregation/reversal values, source inventory15checkboxes/11disclosures, and precision labels.
- Browser verified temporary Q5 multi-answer segment: answers1+2, count45, mean1.5111. Temporary segment was removed.
- Settings geometry was measured against production coordinates.
- Reload confirmed the final local Q5 default: counts22/16/23/18/21, scores1/3/2/4/5, original five segments, precision0, Default, no Overall/count annotations.
- At390px, body width equals scroll width390; drawer width390; editor width350 and height681. Table scroll remains local. Desktop viewport restored.
- Existing route/layout/isolation/shared-view tests remain valid; no collection feature was reintroduced.

Commands:

```
node --test tests/heat-map-baseline.test.mjs tests/heat-map-export.test.mjs tests/dashboard-widget-layout.test.mjs tests/dashboard-sharing.test.mjs
node_modules/.bin/tsc --noEmit --incremental false
node_modules/.bin/eslint src/data/heat-map-baseline.ts src/components/dashboards/heat-map/HeatMapBaseline.tsx src/components/dashboards/heat-map/HeatMapEditIntro.tsx src/components/dashboards/heat-map/HeatMapFilterEditor.tsx src/components/dashboards/heat-map/exportHeatMap.ts
```

## Remaining material limits

1. No production source code or full response-level dataset is available. Untested scale/reversal rules, missing/unequal row bases, arbitrary matrix/cohort intersections and weighting cannot be certified from the observed snapshots.
2. Production's source disclosure failure prevents new matrix-variant selection through this Edit path. The picker can represent M02/M03/M04 and other parents, but their new selected output has not been verified. The20-question limit cannot be exercised through the currently reachable15-checkbox path.
3. CX/EX/stack source flows, all non-Q5 filter criteria, unmapped dashboard-filter criteria, and shared-filter dataset mapping remain incomplete. They do not fabricate scores.
4. Image/PDF QA and production export formatting are excluded from this parity pass by the user; the existing local renderer remains unchanged. Insight posting is not implemented. Production backend autosave races and transient NaN timing are not reproduced by local storage.
5. The app shell, fixed widget collection and two-column layout are approved prototype choices. They must not be described as failures to clone the surrounding production product.

No full-production-parity signoff is claimed beyond the specific verified behaviors above. No custom metric/CSAT enhancement has been introduced.


## Continued parity audit: dashboard inheritance and filter connection

Completed 2026-09-25 after the initial baseline checks:

- Regular, BI-package (regular re-export), and BI-lite dashboard design Save now passes the entire design contract to the fixed heat map; dashboard colors are no longer discarded when saving typography. It stores only dashboard configuration, never a widget collection.
- Dashboard inheritance resolves font family, theme/title color, sentiment palette and font size at render time. Widget overrides remain independent. Production dashboard preview measured body/title sizes: Extra small11/14, Small12/16, Medium14/18, Large16/20, Extra large18/22. Default dashboard theme is `#0d2163`. The measured mixed default two-band red/yellow quirk is preserved; an explicitly custom dashboard sentiment palette replaces the defaults.
- Dashboard filter state now reaches the fixed heat map. Q5 Is/Is not, Completed/Partial/Terminated, and exact ISO date/date-range inputs are supported against the known100-completed-response2026-09-25 fixture. Widget ignores dashboard filters; Dashboard ignores widget filters; Combined intersects both; None ignores both. Unsupported dimensions, incomplete criteria, ambiguous date text and historical fixture predicates show an explicit unavailable state rather than unfiltered or invented scores. Existing unrelated dashboard charts retain their previous fixture behavior.
- Theme and custom sentiment colors now use the existing hex/saturation/hue picker instead of native color inputs. Heat-map picker measured222×265, inner200×176 saturation and24px hue. Font size/family share a row.

Browser QA on dashboard1: dashboard Large saved; Widget scope remained14/18; Dashboard scope became16/20 with `#0d2163` title; full reload retained16/20. Custom dashboard first sentiment `#123456` reached the first score cell; switching to Widget restored its own `#f85271`. Color picker hex edit changed title to `#123456`; restored. Dashboard Medium/default sentiment and widget Widget/Medium/custom original palette restored. Q5 Is Poor produced counts0/0/23/0/0 and score0/0/2/0/0; Country produced unavailable; Reset restored all100responses. No browser console errors. Parent independently exercised dashboard2 Q5 Good, Partial, unsupported Gender, and Reset.

Remaining exactness caveats in this area: live production403684 color picker shows `#0d2163` while its existing rendered title remains `#1b3380`; the local widget keeps one consistent stored color and does not invent an undocumented split-state algorithm. Custom palette propagation is locally verified but arbitrary production palette/threshold behavior still needs evidence. The surrounding dashboard filter panel accepts ISO text rather than reproducing the production date UI; non-Q5 response-level data is absent. Saved-filter summaries in the existing dashboard shell do not constitute executable response predicates. BI-lite has no pre-existing dashboard filter panel to connect.

## User scope update

The user explicitly skipped the download portion after the integration pass. Image/PDF download execution and production export fidelity are excluded from this pass; no browser download-folder change is required. Other evidence gaps remain as documented above.


## Final non-download dropdown pass

- Replaced native settings dropdowns for precision, range, threshold count, theme, sentiment, font size and family with dynamically imported WickUI `WuSelect`, matching the production component. Source category uses the same selector. No data formulas or download code changed.
- Fixed the shared menu's local width fallback: the precision popup now measures x1497/y171/413×162 with five32px rows,12px Fira Sans and1px `#1b87e6` border, matching production. Control geometry remains precisiony140, rangey332, reversaly404, bandsy452/96×32. The parent independently confirmed popup geometry.
- Keyboard ArrowDown/Enter changed precision0→1, reflected in score text; restored0. Escape dismisses the popup, keeps the settings drawer open and restores focus to the trigger. Range0–10 produced2/6/4/8/10 then restoredDefault. Bands4 labels/25% boundaries verified then restored5/20–40–60–80. Theme, sentiment and all font choices exposed; Large rendered16px, Georgia rendered Georgia, then restoredMedium/Fira Sans/custom original palette.
- Editor preview remains1200×681 with sample124/Gender1/Colorsyou like2. Source category lists all five recorded groups; the survey picker still has26rows/15checkboxes/onlyQ5selected. Draft canceled; no source change saved. Baseline counts/scores restored.

Outstanding data/evidence blocks are distinct from UI work: matrix-variant source output cannot be verified because production parent disclosures do not expand; the reachable15-checkbox inventory cannot exercise the20-question cap; arbitrary cross-question/matrix response-level predicates and weighting require absent response data/configurations. CX/EX/stack category output and non-Question field pickers remain explicit local unavailable stubs because no verified source/field fixture exists. The app's fixed-widget requirement intentionally excludes real duplicate/copy/delete flows. Insight posting and download QA are outside this pass. The precision/range/design native-dropdown mismatch is resolved.
