# Reporting year prototype

Updated 30 September 2026. Open `/dashboards/1` → Dashboard settings → General → Reporting year.

## Dashboard configuration

- Each dashboard has one reporting year, initially January (1 January–31 December of the current year). There is no enabled/disabled state in the interface.
- Choose a start month from the January–December dropdown. Day selection is unavailable. The tooltip explains that the first day of the selected month is used and the cycle runs for twelve months.
- The start is always the first day of the selected month; the inclusive end is the last day of the preceding month after twelve months. The calculated date range appears beneath the dropdown.
- Changing the month replaces the saved period and refreshes affected widgets while preserving their frequencies and settings. Select January to restore the calendar-year cycle. No picker, separate Apply/Reset, name field, Edit/Delete icons, or toggle is shown.
- The configuration persists per dashboard in localStorage. Invalid or previously disabled configurations use the calendar-year default. Earlier valid day-based selections migrate to the first day of their saved month, preserving the year and dashboard identity.
- Dashboard date filtering directs users to General because the reporting year supplies the dashboard's active date window.

## Widget behavior

Segment Trend, Scoring Trend and Response Timeline use the effective dashboard dates. The month-only start keeps monthly intervals calendar-based. Quarterly and yearly intervals align to the reporting start month. Daily (Response Timeline) and weekly intervals retain their existing boundaries, including partial weeks at the edges. Only responses within the applicable date range are included. Existing widget filter-scope behavior is preserved.

Example: April → 1 April 2026–31 March 2027, twelve calendar months; Q1 April–June, Q2 July–September, Q3 October–December, Q4 January–March. January → 1 January–31 December 2026, with calendar quarters. A February start automatically includes leap-day responses when applicable. Combined date filters clip eligible responses without shifting interval boundaries.

The data remains a deterministic local fixture; other existing mock widgets, exports and server/shared persistence are outside this local implementation. See [production comparison](production-parity.md) for inspected widget controls and fidelity limits. Earlier screenshots and calendar/creation/enable/delete workflows represent superseded iterations.

## Validation

Automated cases cover all twelve start months, migration of earlier day-based periods, invalid-month rejection, calendar defaults, inclusive annual periods, leap-day coverage, contiguous reporting periods, response-total invariance, weighted means, combined-date clipping, empty intersections, and scoring-trend drilldown/segment reconciliation.

The PRD follows the same month-only selection, calendar grouping, and filter-interaction rules.
