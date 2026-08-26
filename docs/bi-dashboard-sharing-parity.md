# BI dashboard sharing prototype

Production comparison: 26 August 2026. Project: Survey-RE only.

## Production baseline checked

Inspected the Share dashboard popup and Dashboard settings → Shared Links at:

- https://bi.questionpro.com/workspaces/348/dashboards/25373
- https://bi.questionpro.com/workspaces/348/dashboards/17718

The initial admin comparison was read-only. After the user's separate confirmation, one production profile named **BI filter UX review** was created on **Test | All BI dashboard widgets**. Its saved-only and interactive modes were inspected using the actual shared URL. The existing default sharing profile was not edited. The test profile remains available in the account; no external content was deleted.

| Surface | Production baseline restored |
| --- | --- |
| Default Share | 600px single column; 56px header; scrollable body; fixed Done footer; sharing switch and URL/copy row |
| Title | Visibility eye hides the title and disables title/alignment editing; Reset restores dashboard name and visibility |
| Fields | Correct ordering for insights, comments, base filter, language and password; native-language labels for all eight production language options |
| Shared Links | 1250 × 685px shell at desktop size; 32px inset; compact tabs; Create/help/search toolbar; Name, Link, Created on, Status, Actions table |
| Empty list | Plain “No data to display” row, without an extra empty-state CTA |
| Create/Edit | Two equal columns with a 32px gap, back action, and a fixed Cancel/Create or Cancel/Save footer |
| Shared viewer | Plain 49px title bar; collapsible filter strip; full-width read-only widget canvas; bottom tabs; Powered by QuestionPro footer |
| Viewer filters | Saved-preset menu starts unselected; interactive values use searchable multi-selects and update immediately; status offers Completed, Started But Not Completed, and Terminates |
| Viewer dates | Preset dropdown, two adjacent months, editable dates, validation, Reset and Apply; closing without Apply discards the draft |
| Insights | Widget-level insight count opens a 440px right drawer with the selected widget enlarged alongside it; comments and insight composer respect permissions |

## Approved enhancement

The former Dynamic filters radio modes and single interactive-filter selector are replaced in both sharing surfaces by:

1. A Saved filters switch and multi-select of available saved filters.
2. One Allow interactivity checkbox for all selected filters.
3. Separate Date filter and Response status permissions.

Without interactivity, viewers can switch only among the chosen saved presets. With interactivity, every chosen filter exposes multiple values: OR within a filter, AND between filters. The base filter always remains fixed and is excluded from editable filters. Empty selections are validated. The helper text is identical in both checkbox states: “Viewers can change values in every selected filter and apply them together.”

One production inconsistency was observed: the saved-only test link exposed editable value choices. The prototype deliberately follows the user's explicit permission model instead: saved values are fixed unless Allow interactivity is checked. Like production, the saved-only viewer starts with no preset applied; any configured base filter still applies. Reset restores that initial state. In interactive mode, Reset restores all selected filters' saved values.

### Saved-only UI cleanup

After the user's redundancy review, saved-only mode shows a single preset dropdown in the title bar. The duplicate locked-value card and empty “Choose a saved filter” panel are removed. Reset appears beside the dropdown after a selection. The Filter toggle and panel appear only when there are editable controls: interactive values, a permitted date filter, or permitted response statuses. Selecting a preset no longer opens an unrelated panel. The production reference link was re-opened read-only during this review; no production settings were changed.

The saved-filter menu matches its trigger field's width, including after selecting a preset. This override is scoped to the shared-view selector and does not alter other dropdown menus.

## Local behavior

- Default settings and additional profiles persist per dashboard in browser local storage.
- Create, edit, cancel, search, activation, deletion confirmation, and copy are implemented.
- Links open `/dashboards/[id]/shared?profile=…` in this local app, not fabricated production URLs.
- The viewer reuses the prototype's existing seven widget renderers and grid, with dragging, resizing, author menus, and the AI assistant removed in read-only mode. Both existing prototype canvas tabs remain available.
- All shared-view charts, response metrics, and insight summaries derive from the same 120 synthetic response records. No production response data was copied. Optional map coordinates keep the sample countries in the correct positions without changing author-mode data.
- Password protection is a prototype gate, not secure server authorization. Comments are session-local. Language preferences are retained; the sample viewer UI remains English.
- The production test profile is the only remote sharing configuration changed, with explicit approval. Prototype changes remain local and are not deployed to production.

## Verification

- `npm run test:sharing`: 12 focused tests cover filter combinations, saved-only permissions, base constraints, empty results, disabled permissions, date bounds, multi-status selection, invalid settings, and consistent chart aggregates.
- `npx tsc --noEmit` and `npm run build` pass.
- Targeted ESLint on changed source files passes. The full repository lint has existing unrelated errors.
- Browser checked: production geometry, create/edit/reload/cancel, title hide/reset, base-filter exclusion, empty/search states, saved-only switching, multi-value Gender + Country filtering, date/status combination, reset, password gate, inactive profiles, and deletion.
- WickUI 1.39 multi-select callbacks are deferred out of its internal state updater to avoid React cross-component render warnings.
- Fresh shared-view browser checks: simultaneous Gender/Country values, empty selections, fixed presets (120 → 40 → 30 responses), filter collapse without clearing values, tab switching, reset, date draft/apply/reset, invalid dates, Last year preset, status multi-select, insights, and session-local comments. The constant helper was checked in both sharing surfaces with the checkbox checked and unchecked.
- The date picker composes WickUI calendar/popover/select controls because the installed bundled range picker has the older layout. A scoped override avoids the app's global 18rem menu cap clipping the calendar/footer; other popovers are unchanged.
- Redundancy regression checked in Chrome: no empty panel or duplicate card in saved-only mode; Gender/Country switching and Reset still produce 40/30/120 responses; optional date/status controls remain available without value cards; interactive values still update together. Temporary local QA permissions were restored to the user's settings. The 12 tests, TypeScript, and targeted lint pass after this cleanup.
- Dropdown alignment checked in Chrome: both the field and opened menu measure 124px before and after selecting FY 2025–2026. The final production build, all 12 sharing tests, and targeted ESLint pass before the main-branch handoff.

For every further module in this task, inspect the current production equivalent again before extending the prototype; this record is not a substitute for a fresh production comparison.
