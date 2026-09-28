# Staged theme configuration prototype

Implemented 28 September 2026 in Survey-RE.
Preview: http://127.0.0.1:3000/text-ai/1/theme-configuration

Compact Save and Cancel controls sit at the far right of the search row, above both independently scrolling panels. Save and Cancel enable only when the code frame or response-to-sub-theme assignments differ from the saved baseline. An inline count reports unsaved changes; confirmation dialogs show net additions, removals and affected responses across edited questions. Edited response cards have an unsaved indicator.

Tag individual or selected responses using the sub-theme picker; remove tags with the chip's close control. These operations only change the draft, with no processing loader. Save opens a batch confirmation that explicitly states saved changes cannot be undone. Cancel opens a discard confirmation. The X close icon and Escape preserve edits; the confirmation footer contains only Save or Discard. Confirmed discard restores the latest saved code frame and response assignments. Reversing a draft edit clears its pending change.

New theme creates a named parent. New sub-theme chooses a parent, name and optional description. Select two or more sub-themes and Merge to create one destination under the chosen parent; union their assignments and retain one tag per response. Matching source sentiments are retained; conflicts become Neutral for review. Theme trash controls and selected-sub-theme Delete controls stage deletions after an impact prompt. Deleting a theme removes its children and assignments, preserving raw responses. Names are required and unique (case-insensitive) among themes or within the chosen parent. Existing name/description edits also enter the draft.

All structural operations use the same Save/Discard transaction. Create then delete returns to a clean state when no other changes remain.

Saved code frames and assignments use a single browser localStorage snapshot, scoped by dashboard, question, granularity and response. This is a local prototype, not a production API integration. Existing aggregate coverage and dashboard widgets remain mock data. Recode and granularity controls are disabled while configuration changes are unsaved. In-app link navigation prompts before discarding, and reload/close uses the browser's unsaved-change warning. SPA browser-history navigation is not intercepted.

Validation:
- TypeScript no-emit and targeted ESLint passed.
- Thirteen focused transaction tests passed (seven structural and six assignment tests).
- Work Chrome browser verified tag/untag previews, net-zero reversal, both confirmation dialogs, closing without applying changes, discard after save, persistence after reload, drafts across question changes, and the in-app navigation warning.
- Browser additionally verified creation, tagging newly created items, save/reload, merge deduplication, sub-theme deletion, and parent deletion with discard restoring structure and tags.
- Screenshots: pending-changes.png, save-confirmation.png, discard-confirmation.png.

Production was not needed for this implementation; current production behavior was supplied by the owner. This feature remains prototype-only.
