# Advanced Heatmap vs regular Heat Map — 28 September 2026

Reference: the regular Heat Map Chart's audited local baseline (`HeatMapBaseline.tsx`), not Matrix Heatmap. This pass does not claim a new production audit.

## Current implementation

| Regular Heat Map functionality | Advanced Heatmap Segment Comparison |
| --- | --- |
| Respondent-segment means | Paired records from the same synthetic response set; unequal option counts supported |
| Overall column | Available; all filtered respondents, not a sum of overlapping segments |
| Response count | Segment counts and per-cell valid bases; count cells remain uncolored |
| Overall average | Available; mean of selected question means; matrix question contributes its pooled statement mean once |
| Decimal precision | 0–4 decimals |
| Show mean values in range | Default, 0–5, 0–10; native mean / native maximum × target maximum; custom metrics retain their own scale |
| Reverse weightage | Independent question control, available without custom metrics; affects all matrix statements |
| Thresholds | 2–5 bands with ordered editable cutoffs; color changes never alter calculated scores |
| Widget stats | Optional response count and editable label; counts unique filtered records |
| Segment management | Source question/statement, searchable visibility checkboxes, select all, renaming; custom named AND/OR answer-condition segments with edit/remove |
| Question selection | Searchable Labels dropdown; whole-matrix selection; collapsible matrix rows |
| Filter scope | Dashboard / Widget / Combined / None; question-answer Is/Is not, AND/OR |
| Design | Regular Heat Map sentiment inheritance, Default/Custom sentiment colors and font controls; distribution retains its palette selector |
| Live preview and settings | Preview draft; Apply commits, Cancel/close discards |

## Intentional scope changes

- Merge labels and its dialog are removed. Legacy answer/question groups are ignored by calculations.
- The Percentage / count base selector is removed. Counts/percentages still exist, with a fixed valid-respondent denominator. Matrix parent distributions pool statement-answer bases.
- Nominal categories require explicit custom weights instead of silently treating their numeric option positions as meaningful scores.
- Color/count defects recorded in the old production audit are not recreated.

## Remaining limitations — do not claim full production parity

- Respondent-weighting scheme execution is unavailable: the prototype has no usable scheme data. Scope controls retain Dashboard / Widget / None; the regular-style scheme picker shows No results found.
- Unmapped dashboard filters and production date/status/system-variable criteria are not implemented for this synthetic dataset.
- Saved/shared segments, real source integration, persistence, export and widget-menu actions are not complete production integrations.
- Exact legacy arithmetic for all matrix variants and source-specific quirks has not been reverified in production.
- The standalone source-edit flow is not reproduced. The shared theme menu, name visibility, segment-list sorting and widget theme-color controls are available.

## Visual alignment — 28 September 2026

- Segment comparison shares the regular Heat Map controls and CSS: switches, precision/range menus, reverse picker, multithumb threshold track, statistics and weighting scope.
- General, Labels, Design, preview typography, table headers/borders, matrix disclosures and statistics footer follow the audited regular baseline.
- Advanced-only analysis selection, whole-matrix selection, custom metrics and Apply/Cancel remain available. Existing calculation rules are unchanged.
- Custom segment/filter dialogs retain supported question/answer conditions with the regular modal dimensions and neutral styling; unsupported production date/status controls remain out of scope.
- PRD unchanged: this pass changes presentation, not the agreed business rules.

## Validation

48 Advanced Heatmap / regular baseline / dashboard-layout tests pass. Targeted ESLint passes. Full TypeScript check reports only existing WuAlert export/type errors in `EssentialsAccountUnderReviewBanner.tsx`; no heatmap errors.

Browser checks: regular baseline Analytics regression, mode switching with settings preserved, reverse weighting, threshold keyboard adjustment, Overall/count/average/stats toggles, segment visibility, custom segment creation, Design scope, and Cancel rollback. Applying changes works within the mounted dashboard; reloading resets the prototype's Advanced Heatmap state (existing persistence limitation).

Screenshots: `regular-analytics-reference.png`, `segment-comparison-aligned.png`.
