# Advanced Heatmap QA — 28 September 2026

- PASS: 34 tests across advanced-heatmap.test.mjs (11), dashboard-widget-layout.test.mjs, and heat-map-baseline.test.mjs; no failures.
- PASS: `npx tsc --noEmit`.
- PASS: targeted ESLint on all new Advanced Heatmap modules and changed integration files.
- PASS: Work Chrome browser creation flow: widget type → matrix/choice selection → analysis selection → created card on regular dashboard. Two matrices and one choice produced six selected rows from three checkbox clicks.
- PASS: text/ranking disabled with explicit unavailable labels; empty selection cannot continue.
- PASS: custom Q11 weights 0/0/100/100 produced Brand A 43.8, Brand B 46.4, Brand C 44.1, pooled matrix 44.7 with base 333.
- PASS: rename Brand A, merge Good into Excellent, exclude Poor: Brand A distribution and metric both 59.8, base 82. QA aliases, merge and exclusion then restored.
- PASS: segment analysis gives the segment-defining rating row 1/2/3/4/5 and other rows' conditional custom scores; original weights/aliases survive mode switch.
- PASS: Cancel discards changed name/mode. Switching dashboard tabs preserves applied state and does not show the created widget on Tab 2.
- PASS: initial native settings dialog was centered; superseded by the production-style right drawer below. Latest captured browser error log empty.
- NOT RUN: explicit mobile viewport testing; responsive CSS is present but not browser-verified at narrow widths.
- NOT RUN: BI Lite-specific browser walkthrough (shared component integration is type-checked).

Initial QA example used Q6 satisfaction and Q11 matrix with custom weights; the latest live example below restores the default, metric-free view. Session-only examples disappear on page reload.

Scope limitations are in README.md. No production edits or exports were performed in this implementation pass.

## Creation and table presentation revision — 28 September 2026

- Production account verified in the approved Work connection. Read-only popup inspection measured exactly 1200 × 681 pixels after animation, with 56/560/65px header/content/footer; local settled dimensions match exactly at the same viewport.
- Verified Advanced Heatmap → Next → survey/folder picker → checkbox/question list → Next → analysis → Create. Reused the question-based survey picker.
- Verified changing surveys clears previous question selection and disables Next until a new selection is made.
- Verified whole matrix checkbox selection, unavailable text/rank types, and a single output table for a matrix plus a single-select with different answer labels.
- Verified no standalone Settings button; three-dot menu → Settings opens Advanced Heatmap controls.
- Computed title font, color and header divider exactly match the neighboring shared DashboardWidgetCard (same CSS variables and component).
- Added tests for semantic answer-column alignment and pooled matrix distribution totals; 36 targeted/regression tests passed. TypeScript and targeted lint passed.
- Production modal was closed without saving a widget or changing production settings.

## Shared picker and production drawer revision — 28 September 2026

- Renamed the widget to **Advanced Heatmap** in the selector and default configuration.
- Replaced the separate picker with `WidgetQuestionSelection`: Code / Questions / Type, whole-question checkboxes, unavailable types disabled, and a selected/available counter at the far right of search.
- Browser-verified: one matrix counts as one question; searching leaves the selected count unchanged; selecting all filtered matches preserves previously selected questions.
- Footer uses the shared question-based breadcrumb with Widget → Survey → Question → Analysis; completed steps are navigable.
- Analysis step now fits content (measured 1200 × 439px at 1920 × 873 viewport); other steps retain the production-sized shell.
- Output uses one Question column, keeping matrix statement identity in that cell. Neither Statement nor Mean nor Custom metric appears as a separate column by default.
- Production account verified and read-only settings inspection measured a 440px full-height right drawer. Reused WickUI's WuDrawer locally: measured the same 440 × 873px placement, matching header/tab spacing and Fira Sans styling.
- Custom metrics is opt-in. All nine weight fields for Q6/Q11 were blank. Apply was disabled until all included weights were supplied. Explicit top-two 0/100 weights yielded Q6 41.7, Q11 Brand A 43.8, B 46.4, C 44.1. Test weights cleared and metric removed afterward.
- PASS: 37 tests, TypeScript, targeted ESLint. New regression prevents ordinal default scores silently becoming custom weights.
- Live example: Q6 and Q11 answer distribution, no metric, empty weights, no summary; one fixed label column. Settings accessible through standard three-dot menu.
- Evidence: question-picker.png, settings-drawer.png, table-preview.png. No production settings were changed.

- Additional browser checks: Select all chose exactly 14 eligible questions and left rank/text unavailable; Cancel restored the original Q6/Q11 selection. No browser errors were captured.

## Custom metric result filter — 28 September 2026

- PASS: 40 targeted/regression tests; TypeScript and targeted ESLint.
- Arithmetic tests cover strict/inclusive boundary 80, unrounded 79.999, inclusive ranges, negative custom scales, null/nonfinite values, invalid ranges, inactive modes, and unchanged source distributions/pooled summary bases.
- Browser: Q11 with weights 0/0/100/100, labeled CSAT. Below 45 displayed Brand A 43.8 and Brand C 44.1 (2/3), excluding Brand B 46.4; the percentages stayed unchanged.
- Browser: Above 80 displayed the explicit no-matches state (0/3). Clear filter restored all three rows.
- Browser: range 90–80 disabled Apply; switching to Segment comparison hid/suspended the filter and allowed Apply. Returning to distribution retained its draft; valid range 43–45 displayed the expected two rows.
- Live demo retains Q11, CSAT weights 0/0/100/100 and range 43–45 to show filtering; metric-filter-result.png and metric-filter-settings.png capture the example. No production actions performed.

## Fixed columns, Labels and default widget — 28 September 2026

- Production account verified. Inspected Matrix Heatmap Labels → Merge labels → Create group: Question/Answer modes, search, drag-to-create, group name, Save/Cancel and discard warning. All unsaved changes discarded; no production widget configuration saved.
- Replaced all Advanced Heatmap native HTML selects with the existing WickUI HeatMapSelect.
- Moved whole-question selection to Labels; removed the verbose label instructions and per-option merge dropdowns.
- Default widget verified on dashboard 1 after reload, Tab 1 and Tab 2, dashboard 2, and BI Lite dashboard 1. Exactly one built-in instance on each, no manual creation needed.
- Default fixture Q6/Q11/Q13 has 5/4/2 options: exactly five answer columns, with no value in absent positions. Mixed scales use generic editable headers; original answer labels remain in cell tooltips.
- Browser: drag Brand A into a new group, add Brand B, name Brands A + B, Save/Apply. Pooled distribution 26.6 / 28.4 / 26.1 / 18.9, with fifth position absent.
- Browser: merge Option 3/4 into Combined options, rename Option 1 to First choice. Four answer columns remain; Q6 combined value 42.6, Brands A+B 45.0, Brand C 44.1.
- Browser: exclude First choice; remaining columns retain position and merged identity. Q6 becomes 15.7 / 55.4 / 28.9; two-option Q13 rows become 100% in the remaining position. Reload restores default ungrouped/unexcluded state.
- Fixed a lazy-header accessibility warning by loading the complete native modal shell together; prevented nested group interactions from dismissing the settings drawer.
- PASS: 44 arithmetic/layout/regression tests, TypeScript, targeted ESLint. Added fixed-width six/four-option, rename/exclusion, answer-group, row-group/pooled-base, and deterministic default-widget tests.
- Evidence: production-merge-reference.png, native-dropdown.png, labels-panel.png, default-advanced-heatmap.png. Production unequal-base merge arithmetic remains unverified; this pass did not mutate production to test it.


## Matrix disclosure and Labels dropdown verification — 28 September 2026

- 47 targeted tests passed (advanced heatmap, dashboard layout, baseline heatmap); TypeScript and targeted ESLint passed.
- Added engine cases for pooled parent bases, excluded statements, matching children with a failing parent, parent-only matches, and same-/cross-question label groups without duplicate answers.
- Browser verified collapsed defaults, keyboard expansion, indented statements, unchanged totals, and Segment comparison hierarchy.
- Labels dropdown verified whole-matrix deselect/reselect, hidden-selection preservation while searching, no-result feedback, disabled unsupported types, Escape dismissal, and Apply removing all selected matrix statements together.
- Fixed WickUI multi-select callback's parent-during-render warning with a deferred parent update; no new console errors after reload and repeated selection.
- Restored default survey/selection/analysis after QA; one matrix left expanded for inspection. No production settings changed.
- Evidence: matrix-expanded.png and labels-question-dropdown.png.


## Answer-only labels / live preview / General filters

- 50 targeted tests pass; TypeScript and targeted ESLint pass. Added respondent-filter tests for valid bases, multiple answers, AND/OR, missing answers, invalid conditions, scope isolation, and unavailable dashboard criteria.
- Browser: preview appears alongside settings with inherited typography; Labels has only answer controls and compact question dropdown; Merge labels opens only answer choices.
- Renamed Option 1 and merged it with Option 2: preview showed 35.2% for Q6, 55.3% for Q11, 100% for Q13. Excluding that group removed its column; Cancel restored all five original columns in the saved widget.
- General Widget scope: saved Q6 Is Satisfied filter produced Q6 0/0/0/100/0%; matrix rows recalculated from that respondent subset. Apply matched the preview. No console warnings/errors.
- Restored original demo defaults after testing; final Labels settings left open with one matrix expanded in the preview. Evidence: answer-labels-live-preview.png and general-filters-preview.png.
