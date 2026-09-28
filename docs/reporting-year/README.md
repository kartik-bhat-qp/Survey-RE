# Reporting year prototype

Implemented 28 September 2026 in the existing Survey-RE dashboard filter flow.

Open `/dashboards/1` → Filter → Filter by date → Create reporting year.

- Choose a start date; end date is automatic, one calendar year later minus one day.
- A name is required; FY plus the start/end years is shown only as a placeholder. A leap-day start ends on 28 February the following year.
- Create or edit a year in a compact calendar pop-up with brief guidance, a single-month start-date picker with previous/next navigation and an automatic end date. Arbitrary start days are supported; month-end quarter boundaries clamp without cumulative drift.
- Saved reporting years are dashboard-scoped and persist in localStorage; applying one is explicit. The currently applied selection is session state, not an automatic default after reload.
- A compact menu offers Date range and saved Reporting years with edit buttons, followed by Create reporting year at the bottom of that section. The applied option alone is highlighted. An FY badge and tooltip explain the reporting cycle; no persistent FY panel or banner is shown. Applying Date range returns to calendar grouping.
- The time-series examples demonstrate Daily (Response Timeline), Weekly, Monthly, Quarterly and Yearly regrouping on deterministic synthetic daily counts. Weekly/monthly boundaries remain calendar based. Quarter/year boundaries follow the applied reporting year. Dates are available in chart tooltips; intervals are configured in Settings → Analytics.
- Ordinary custom dates and existing quick ranges remain available through the existing date picker.

This is a prototype, not a production analytics integration. Segment Trend, Scoring Trend and Response Timeline are wired to reporting-year aggregation; the other existing mock widgets, static insights, exports and widget-filter override controls are not converted to a shared data engine by this change. Reporting years can be created, reapplied, edited and deleted in place. Editing the active year updates its filter and aggregation; editing an inactive year preserves the current selection. Shared/server persistence remains outside this iteration. Existing unrelated working-tree edits were preserved.

Validation: TypeScript check, targeted ESLint, six calendar/aggregation tests, and Chrome UI checks for creation, Feb-start quarterly/yearly grouping, calendar fallback, ordinary Feb–Apr partial quarters, frequency preservation on reapply and saved-year persistence after reload.

Automated cases cover April starts, mid-month starts, January 31, February 29, contiguous quarters, partial calendar quarters, invariant response totals across intervals, and invalid saved-year rejection.

Refinement validation: manual selection and calendar highlighting, inactive-year edits preserving manual dates, active-year edits updating quarter grouping, create/cancel, saved edits after reload, TypeScript and targeted ESLint.

Validation of the final refinement: blank and whitespace-only names disable saving, a valid name enables saving, and previous/next navigation keeps a single month visible.

Current screenshots: [single-month creation](screenshots/create-reporting-year.png), [compact menu](screenshots/compact-date-menu.png), [manual calendar](screenshots/manual-date-range.png), [edit calendar](screenshots/edit-reporting-year.png). The saved-year preview screenshot represents the superseded first iteration.


## Production-aligned time-series refinement

Helper text is one short sentence. Hover/focus the FY badge for the reporting-year tooltip; the separate info icon is removed. Segment Trend, Scoring Trend and Response Timeline now expose their time-frequency controls in right-hand Settings panels with chart previews. See [production comparison and remaining fidelity limits](production-parity.md). The original Segment Trend toolbar/table has been removed.

Deletion: Each saved reporting year has a Delete action with confirmation. Cancel preserves the saved year and selection. Deleting an inactive year preserves the current selection. Deleting the active year retains its exact dates as a manual range and restores calendar quarter/year grouping. The deletion persists after reload.
