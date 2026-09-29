# Reporting year prototype

Updated 29 September 2026. Open `/dashboards/1` → Dashboard settings → General → Reporting year.

## Dashboard configuration

- Each dashboard has one reporting year, initially 1 January–31 December of the current year. There is no enabled/disabled state in the interface.
- Click the bordered date field to open a single-month calendar. Choose the start date with the calendar or Start date field; End date (automatic) is read-only and covers exactly twelve calendar months, inclusive.
- Apply saves the period and updates affected widgets. Dismissing the picker without Apply preserves the saved values.
- Reset inside the picker immediately restores January–December of the current year. No external Reset, name field, editor title, Custom Range dropdown, Edit/Delete icons, or toggle is shown.
- The configuration persists per dashboard in localStorage. An existing active custom period is preserved. Missing, invalid, or previously disabled configurations use the calendar-year default.
- Brief guidance appears below the label. Dashboard date filtering directs users to General because the reporting year supplies the dashboard's active date window.

## Widget behavior

Segment Trend, Scoring Trend and Response Timeline use the effective dashboard dates. Daily (Response Timeline), weekly and monthly intervals retain calendar boundaries; quarters and years align to the reporting year's start. Changing the reporting year preserves widget frequency and other settings. Existing widget filter-scope behavior is preserved.

The practical example is 1 April 2026–31 March 2027: Q1 April–June, Q2 July–September, Q3 October–December, Q4 January–March. Arbitrary start days are supported; month-end boundaries clamp without cumulative drift. A leap-day start ends on 28 February the following year.

The data remains a deterministic local fixture; other existing mock widgets, exports and server/shared persistence are outside this local implementation. See [production comparison](production-parity.md) for inspected widget controls and fidelity limits. Earlier screenshots and creation/enable/delete workflows represent superseded iterations.

## Validation

22 automated cases cover default/reset configuration, existing active-year preservation, inclusive annual periods, leap days, month-end clamping, contiguous quarters, response-total invariance, weighted means, combined-date clipping, empty intersections, and scoring-trend drilldown/segment response reconciliation.

Browser checks cover previous/next navigation, selecting a start date, automatic end dates, Apply, Reset, a single-month layout, and the bordered date field. The PRD uses the same default, edit, reset, and filter-interaction rules.
