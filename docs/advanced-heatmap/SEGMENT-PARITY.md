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
| Design | Dashboard sentiment inheritance; widget palette, custom sentiment colors and font controls |
| Live preview and settings | Preview draft; Apply commits, Cancel/close discards |

## Intentional scope changes

- Merge labels and its dialog are removed. Legacy answer/question groups are ignored by calculations.
- The Percentage / count base selector is removed. Counts/percentages still exist, with a fixed valid-respondent denominator. Matrix parent distributions pool statement-answer bases.
- Nominal categories require explicit custom weights instead of silently treating their numeric option positions as meaningful scores.
- Color/count defects recorded in the old production audit are not recreated.

## Remaining limitations — do not claim full production parity

- Respondent-weighting scheme execution is unavailable: the prototype has no usable scheme data. Scope controls retain Dashboard / Widget / None and explicitly disclose this limitation.
- Unmapped dashboard filters and production date/status/system-variable criteria are not implemented for this synthetic dataset.
- Saved/shared segments, real source integration, persistence, export and widget-menu actions are not complete production integrations.
- Exact legacy arithmetic for all matrix variants and source-specific quirks has not been reverified in production.
- The standalone source-edit flow and exact production theme menu are not reproduced; name visibility, segment-list sorting and widget theme-color controls are available.

## Validation

48 Advanced Heatmap / regular baseline / dashboard-layout tests passed after the update. TypeScript and targeted lint passed before a concurrent repository merge introduced conflicts in shared dashboard files.

Browser checks verified live Overall, Overall average, response counts and statistics before the unrelated merge interrupted further UI verification. Final UI sign-off must follow resolution of that shared merge. No unrelated conflict was resolved or overwritten by this task.
