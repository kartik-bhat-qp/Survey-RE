# Advanced Heatmap prototype

Implemented locally, 28 September 2026. This is a new widget, separate from the production-baseline Heat Map Chart. No production configuration changed.

## Current scope — 28 September 2026 revision

Merge labels and the Percentage / count base selector are removed. Distribution retains Percentages/Counts with a fixed valid-respondent base. Older notes below describe prior iterations, not the current scope.

Segment Comparison now includes Overall, response counts, overall average, 0–4 decimals, mean scaling, independent reversal, threshold bands, statistics and custom segment management. See [regular Heat Map comparison and remaining limitations](SEGMENT-PARITY.md). Do not infer full production parity from the presence of controls.

## Try it

On a regular BI or BI Lite dashboard, choose **Add widget → Advanced widgets → Advanced Heatmap → Next**. Select a survey using the standard data-source picker, select questions (one checkbox selects every matrix statement), then choose **Next**, choose an analysis type, then **Create widget**. The new card appears in the two-column dashboard layout. Open Settings from the standard three-dot widget menu; tabs are **General, Analytics, Labels, Design**.

Created widgets and their changes are page-session state only. Changing tabs preserves them; reloading or leaving the dashboard discards them. No widget database, shared collection or persistent creation storage was introduced.

## Implemented

- Matrix and choice questions, including single select, multiple select, NPS rating choices and the prototype's categorical Flex Matrix. Ranking and text stay visible but unavailable, as requested. Numeric and other unmodeled types are not introduced in this first version.
- One-click matrix selection in a compact checkbox-and-question table, search, select-all and disabled empty selection. Individual statements can be excluded in Labels. Changing survey clears question selection.
- Segment comparison: one selected question/statement supplies option-defined respondent groups. Every row uses those groups' paired answers. Optional Overall, valid bases and conditional custom means.
- Answer distribution: one continuous table aligns original answer positions, capped at the largest selected option set; an inapplicable question/option intersection is a neutral dash. Percentages or counts; respondent or cumulative-answer bases. Multi-select percentages can exceed 100% with respondent bases. Merged counts deduplicate people for respondent bases.
- Analytics mode switch retains questions, exclusions, labels, weights and mode-specific configuration.
- Custom metric label and answer weights. Weighted mean matches the single-answer Matrix Heatmap method. Multi-select uses each respondent's mean selected weight, then averages respondents; this extension is a proposed explicit rule, not a newly verified production behavior.
- Whole-question reversal applies to every statement. Optional matrix summary pools valid statement answers, including unequal response bases; it is not an average of row means.
- Labels contains the shared question picker, editable/reorderable question and answer labels, exclusion switches, and a Create group dialog for question rows or shared answer columns. Grouping retains original score weights.
- Blue, green and sentiment palettes, precision and cell-base visibility. Empty cells remain neutral; incomplete scoring is labeled Set weights with the actual answer base, not zero respondents. Nominal codes are never used as default scores.
- Cancel discards drafts. Apply updates the existing widget. Widget ownership stays on the tab where it was created. External report tabs cannot accept widget creation.

## Calculation examples verified

The shared fixture has 120 deterministic synthetic respondents, including unanswered items. These are illustrative records, not live survey responses.

For Q11 Brand A: Poor 30, Average 33, Good 25, Excellent 24; valid base 112. Weights 0,0,100,100 produce 49/112 × 100 = 43.75 (display 43.8). Excluding Poor changes the base to 82 and score to 59.7561 (59.8). Merging Good and Excellent combines their distribution without changing the weighted score. With all categories included, matrix custom summary is 149/333 × 100 = 44.7447 (44.7).

## Boundaries of this pass

This is a working interaction/calculation prototype, not a backend integration or a claim of complete production feature parity. Dashboard filters with criteria deliberately show an unavailable message because this fixture is not mapped to their source data. Compound/custom saved segments, respondent-weighting schemes, exports, source-stack integration, column-average statistics and cross-question scale mapping are not implemented. Label merging covers answer options within a question; it does not combine separate statement rows or questions. Different scales use the union of their labeled options; wide tables scroll horizontally.

## QA

Automated checks cover matrix selection, valid response bases, custom scoring/reversal, nominal mappings, exclusion, zero-base handling, six-versus-four option combinations, multi-select denominators, merge deduplication, unequal-base matrix summaries and repeatable paired records. Existing baseline and dashboard layout regression tests also run. TypeScript and targeted ESLint checks run without errors.

Browser checks on Work Chrome: creation with two matrices and a single-select; all settings tabs; edited weights/custom label and matrix summary; label rename/merge/exclusion; switching analysis; same-question segments giving 1/2/3/4/5 scores; cancel rollback; tab isolation and preserved settings. Responsive and final preview checks are recorded separately in QA.md.

## Production-aligned creation and presentation update

Read-only production reference checked 28 September 2026 on dashboard 25868, approved account. Loaded Advanced Widgets popup measured 1200 × 681 CSS pixels, with header/content/footer heights 56/560/65. Local popup now matches those dimensions (content height caps on shorter screens). The survey picker reuses the question-based widget component. Header typography, divider and menu reuse DashboardWidgetCard. Rendered chart includes only its header and table; calculation details remain in settings/tooltips.

### Current presentation

Creation follows Widget → Survey → Question → Analysis, using the existing survey and question pickers. Whole matrices count as one selection; unsupported types remain disabled. Settings use the production-width 440px WickUI right drawer. The table has one question/statement label column and no metric column by default. Under Analytics → Custom metrics, users may add a named metric and explicitly configure every included answer weight; ordinal scores are never prefilled as custom weights.

### Custom metric result filtering (prototype)

In Answer distribution, Analytics → Custom metrics → Filter rows by [metric name] supports Below, At or below, Above, At or above, and Between (inclusive). Thresholds accept finite decimals on the user's custom scale, including negative scores. Empty thresholds and reversed ranges cannot be applied.

The filter compares the unrounded aggregate score of each selected question/statement and optional matrix summary. It hides entire result rows, not respondents; percentages, counts and response bases are unchanged. Matrix summaries are calculated from all selected, included statements before filtering and tested independently, so hiding a statement does not change the matrix total. Missing/unscorable values do not match an active filter. The widget displays the applied condition and matching row count, with Clear filter and a no-matches state.

Filter settings survive switching modes or disabling the metric, but take effect only with an enabled custom metric in Answer distribution. Changes to weights/exclusions recalculate scores before evaluating the filter. Cancel discards draft changes; creation and configuration remain session-only.

### Fixed columns, native controls and default widget — 28 September 2026

Every regular prototype dashboard canvas, including BI Lite and its tabs, contains one built-in Advanced Heatmap. It starts with Q6, Q11 and Q13, has five answer columns and no custom metric. It uses the existing two-column layout. Its edits remain in React state and reset on reload; it creates no persistent widget collection or external records.

Settings dropdowns reuse HeatMapSelect/WickUI. Question selection moved from General to Labels. The verbose rename/include/merge introduction is removed. Answers align by original option position, with no automatic normalization or recoding. Different answer scales use generic Option 1…N labels until renamed. Shorter questions show dashes for absent positions; cell tooltips retain original answer labels. Excluding a position hides it and excludes its answers from the base without shifting later positions.

Merge labels opens Create group, with Question/Answer modes, search, draggable labels, named groups, removal, and Save/Cancel. Click/select-and-add is also available for keyboard operation. Unsaved mode switches require confirmation. Question groups pool selected source statement answers; answer groups combine shared answer positions and deduplicate respondents for multi-select respondent bases. Matrix totals and metric filters keep their existing pooled-base rules. Groups can be removed to restore their members. Changes are applied from the settings drawer.

Production reference inspected: workspace 348, dashboard 25868, Matrix Heatmap widget 393238. Question/Answer grouping and the unsaved-change guard were observed. The test group was discarded, not saved. Prototype aggregation is covered by fixtures; production server aggregation for unequal bases and mixed questions was not tested in this pass.


## Matrix disclosure and compact question selector — 28 September 2026

Matrix questions now start collapsed in both analysis modes. Their parent row pools included statement answers; expanding reveals indented statements. Parent rows replace the separate optional Total row, so the redundant Show matrix summary control is removed. Expand/collapse only changes presentation. Question groups within a matrix remain children; groups spanning questions remain standalone and are not duplicated in matrix totals.

Custom-metric filters evaluate parent totals and statement rows independently. If only statements pass, the matrix heading remains expandable with a dash instead of an out-of-filter parent score. Parent calculations use the original included answers, not the filtered children.

Labels uses a native WickUI checkbox dropdown with search inside the popup, whole-matrix selection, selected-question count, and disabled unavailable question types. Searching preserves selections outside the search results. The Questions field no longer has the extra section divider/top padding. Creation-flow question selection remains unchanged.


## Answer-only labels, settings preview, and General filters — 28 September 2026

Labels now retains the question-selection dropdown but removes the permanent question/statement label list. Rename, reorder, exclude, and Merge labels operate on answer columns only; the group modal has no Question tab. Previously saved question groups are removed from the settings draft when opened and are only committed on Apply.

Settings displays a live enlarged widget to the left of the 440px panel, using the audited Heat Map baseline layout and the dashboard typography. The same table/calculation component renders saved results and draft preview. Changes to labels, grouping, exclusions, mode, precision, weights, and filters preview immediately. Apply commits; Cancel/close discards the draft. On narrow screens the preview stacks above the settings body.

General includes Dashboard (default), Widget, Combined, and None filter scopes. Widget/Combined can create, edit, or remove a named question-answer respondent filter with Is/Is not, multiple selected answers, and AND/OR conditions. Filters operate before segment grouping and metrics; unanswered question rows do not satisfy either operator. General respondent filters are independent of Analytics custom-metric result-row filtering.

Prototype limitation retained: active dashboard criteria have no verified mapping to this widget's synthetic response set. Dashboard/Combined therefore show an explicit unavailable message in that case. Widget/None ignore dashboard criteria as selected. The local widget filter editor supports question-answer conditions, not production response-status/date/system-variable criteria. No new production audit is claimed for this pass; the previously audited local baseline supplied the layout and scope reference.
