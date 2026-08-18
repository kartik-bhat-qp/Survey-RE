# Crosstab percentages in totals

Status: Proposed source of truth
Applies to: BI Reports → Crosstab → Settings → Analytics
Official prototype: `https://survey-re.vercel.app/reports`

## Product intent

Let report creators show marginal row and column percentages independently from the corresponding counts. The feature must answer two questions:

- **Total row percentage (R%)**: What percentage of the valid base selected this row answer?
- **Total column percentage (C%)**: What percentage of the valid base selected this column answer?

These are marginal percentages. They are not calculated by adding the visible interior cells, because respondents can appear in more than one cell for multi-select questions.

## UX flow

1. Open a crosstab report.
2. Select the **Report settings** gear.
3. Select the **Analytics** tab.
4. Under **Display data**, enable either or both:
   - **Total row percentage**
   - **Total column percentage**
5. Select **Apply**.
6. The report returns to the table and shows percentages in the applicable marginal cells. Each count is shown there only when its separate total-count option is enabled.

The two percentage options are independent from each other and from **Row total** and **Column total**. They are off by default for existing and newly created reports unless product requirements specify a different default.

## Calculation contract

For each row-question × column-question pair, the reporting service must provide a **valid base (N)** after applying:

- report and dashboard filters;
- date and respondent filters;
- weighting;
- missing-answer and excluded-answer rules;
- the selected percentage-calculation mode.

Formulas:

- `Total row R% = marginal row-answer count ÷ valid base N × 100`
- `Total column C% = marginal column-answer count ÷ valid base N × 100`
- `Grand-total percentage = valid base N ÷ valid base N × 100 = 100%`

Counts and bases may be weighted decimals. The UI and exports use the report's configured decimal precision and rounding rules.

## Acceptance criteria

### AC-01 — Discoverability and placement

Given a user can edit a crosstab report, when they open **Report settings → Analytics**, then independent switches named **Total row percentage** and **Total column percentage** appear within **Display data**.

The complete Display data order is: Count, Row percentage, Column percentage, Row overall, Column overall, Row total, Column total, Total row percentage, Total column percentage, Heatmap rows, and Heatmap columns. The percentage controls use the same typography, spacing, switch styling, and interaction pattern as the surrounding options, without a separate heading, badges, descriptive helper text, or an inline preview.

### AC-02 — Total row percentage

Given **Total row percentage** is enabled, when the user applies settings, then a right-side Total column is visible and every answer row's Total-column cell shows `R% <value>` in the established row-percentage color.

If **Row total** is also enabled, the marginal count appears above R%. If **Row total** is disabled, R% remains visible without the count.

The denominator is the valid base for that row-question × column-question pair, not the sum of visible cells.

### AC-03 — Total column percentage

Given **Total column percentage** is enabled, when the user applies settings, then a bottom Total row is visible and every answer column's Total-row cell shows `C% <value>` in the established column-percentage color.

If **Column total** is also enabled, the marginal count appears above C%. If **Column total** is disabled, C% remains visible without the count.

The denominator is the valid base for that row-question × column-question pair, not the sum of visible cells.

### AC-04 — Independent controls

Given only one total-percentage option is enabled, when settings are applied, then only its corresponding marginal plane shows percentages. Enabling or disabling either percentage option must not change the other percentage option or either total-count option.

### AC-05 — Independent count visibility

**Row total** controls only the marginal counts in the right-side Total column. Disabling it must not disable **Total row percentage** or remove R% values.

**Column total** controls only the marginal counts in the bottom Total row. Disabling it must not disable **Total column percentage** or remove C% values.

### AC-06 — Grand-total intersection

Given either total-percentage option is enabled and both marginal planes are visible, then their intersection shows a single neutral `Base 100.0%` label. The valid-base count appears there only when both **Row total** and **Column total** are enabled. It must not show duplicate R% and C% values.

### AC-07 — Multi-select behavior

Given a row or column question allows multiple selections, then marginal percentages are calculated from distinct/weighted respondent counts over the valid base. The sum of displayed marginal percentages may exceed 100%; the system must not normalize them to force a 100% sum.

### AC-08 — Single-select behavior

Given all answer options are mutually exclusive and exhaustive, then the unrounded marginal percentages sum to 100%. The displayed values may differ from exactly 100% only because of configured rounding.

### AC-09 — Filters, weighting, and recalculation

When a filter, weighting scheme, base rule, or percentage-calculation mode changes, then counts, valid bases, total percentages, and the grand-total value are recalculated together from the same filtered population.

No percentage may be calculated from a stale or differently filtered base.

### AC-10 — Zero or unavailable base

Given the valid base is zero or unavailable, then the percentage displays an em dash (`—`). A count remains visible only when its corresponding total-count option is enabled. The UI must not display `0%`, `NaN`, or an infinite value for an unavailable denominator.

### AC-11 — Precision and formatting

Percentages follow the report's decimal-precision setting. With precision `1 (0.1)`, values appear as `14.4%` and 100 appears as `100.0%`.

Counts retain the existing count-formatting behavior. Weighted counts and percentages follow the product's locale and rounding standards.

### AC-12 — Draft, Apply, and close behavior

Changing either switch updates only the draft settings until the user selects **Apply**. Closing settings with unapplied changes follows the existing unsaved-changes confirmation behavior.

After Apply, the table reflects the saved settings and reopening Analytics shows the saved switch states.

### AC-13 — Persistence and backward compatibility

The two settings are persisted with the report and restored on reload, duplicate, and share-view rendering. Reports saved before this feature treat both settings as `false` when the fields are absent.

### AC-14 — Export parity

Excel and other tabular exports include the same marginal counts, R%/C% labels, precision, filtered/weighted bases, and grand-total semantics as the on-screen report.

Exports must not recalculate percentages from already rounded cell values.

### AC-15 — Accessibility

Both controls expose their visible labels as accessible names, support keyboard focus and Space activation, and communicate checked state through the switch role.

Counts and percentages remain readable without relying on color alone because each percentage includes the textual `R%`, `C%`, or `Base` prefix.

### AC-16 — Performance and consistency

Enabling the display options must not trigger a separate data query when the required marginal counts and valid bases are already available. On-screen rendering and export generation must use the same calculation result or shared calculation contract.

### AC-17 — Freeze-pane and scrolling behavior

Given the crosstab is taller than its report canvas, when the user scrolls vertically inside the table, then the complete column header group remains fixed to the top of the table viewport. This includes the column-question row, answer-option row, and any enabled Column overall row.

Given the crosstab is wider than its report canvas, when the user scrolls horizontally, then the full table—including row-question and row-answer cells—moves horizontally. Row-label columns are not frozen independently. This deliberately matches the current BI crosstab behavior.

When both axes are scrolled, body rows pass beneath the opaque frozen header without obscuring its labels or fills. The horizontal and vertical scrollbars remain within the report canvas; scrolling must not move the report toolbar or settings controls.

The same freeze behavior applies whether total-percentage controls are on or off. Adding R%, C%, or Base lines may increase cell height but must not alter the frozen-header boundary or create a second page-level scrollbar.

## Reference example for QA

Use a valid base of 4 respondents:

|              | Android | iPhone | Total |
|--------------|---------|--------|-------|
| Male         | 2       | 1      | 2     |
| Female       | 1       | 2      | 2     |
| Total        | 3       | 3      | 4     |

Expected marginal display:

- Male Total: `2`, `R% 50.0%`
- Female Total: `2`, `R% 50.0%`
- Android Total: `3`, `C% 75.0%`
- iPhone Total: `3`, `C% 75.0%`
- Grand total: `4`, `Base 100.0%`

Android and iPhone sum to 150% because respondents may select both. This is correct and must not be normalized.

## Out of scope

- Changing the meaning of existing interior-cell Row percentage or Column percentage controls.
- Replacing Row overall or Column overall counts.
- Automatically enabling the feature for previously saved reports.
- Normalizing multi-select marginal percentages to 100%.
