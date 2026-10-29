# Censored editing and category lifecycle checkpoint

The current behavior supersedes older notes describing a review pop-up or a confirmation that automatically removes Censored when adding another tag.

- Clicking Censored filters the regular response panel in either dashboard visibility state. The separate review dialog has been removed.
- Add sub-theme is disabled for a single censored response and for any bulk or mixed selection containing Censored. A focusable wrapper exposes mouse and keyboard tooltip help. Users remove Censored using the same per-response tag controls as any other sub-theme. There is no separate Remove Censored tag action. Removing all selected Censored tags enables ordinary coding.

The configuration corpus now adds three stable example responses per existing sub-theme, across dashboards and questions. Baseline IDs stay fixed through filtering and saved assignments override their original tags. Deleting a category preserves the added response text, and saved untagging remains applied after reload. These extra examples are confined to Theme configuration and do not change dashboard widget collections.
- Update sentiment is also disabled for such selections in this prototype, with its own tooltip. This restriction is intentionally excluded from the PRD at the owner's request.
- Censored may be deleted through its row or selected-item action. Associated tags are removed as pending edits. Save persists deletion and manual-release markers; Discard restores saved assignments and taxonomy. The Outlier parent and Censored rename/move protections remain.
- Loading or recoding a saved code frame does not recreate a deleted Censored entry. Sync recreates it only when genuinely new synthetic inputs are classified as Censored. Repeated or non-qualifying sync and creation opt-out cannot recreate it. Recreated category assignments affect the new records only; old manual releases survive sync and full recoding.
- The Process now flow uses explicit synthetic classification results. It does not call production analysis or infer that a live AI pipeline has been released. Synced records appear through existing dashboard widgets and the configuration response panel.

## Verification

All 75 TextAI tests pass, including single/mixed selection policy, deliberate category deletion, qualifying/non-qualifying/idempotent sync, creation opt-out, and release protection for old and newly synced rows. TypeScript, targeted ESLint and the production build pass.

Browser checks used the metadata-verified QuestionPro Chrome extension and the private Tailscale preview. Checked direct Censored filtering with no review dialog; disabled single and mixed actions and keyboard tooltips; bulk untagging re-enabling Add sub-theme; Discard; deletion saved across navigation/reload; four newly synced Censored rows alongside four previously released rows; and full recoding preserving those releases. Evidence is under the Work task's `outputs/textai-model-setup-2026-10-29/lifecycle` folder.

## Requirements document

Updated the existing native [PRD](https://docs.google.com/presentation/d/1nrACGp28Lxj0jurEsoy2ffnpWDcP4njlSCzBSQrTKLg/edit), retaining its 13-slide template structure. Read back every slide, inspected rendered layouts and empty speaker notes, removed all sentiment requirements, and corrected the cover prototype link contrast. Verified TextAI → Documents location and existing QuestionPro Commenter access without changing sharing. Requirements cover classification, creation defaults and irreversible opt-out, shared dashboard-only visibility, direct review/removal, disabled Add sub-theme behavior, Save/Discard, deletion/recreation, recoding protection, acceptance criteria and the public prototype walkthrough.

## Concert dataset

Generated 500 unique synthetic text responses: 380 relevant concert comments, 100 Censored candidates and 20 other Outlier candidates. The import CSV and XLSX omit expected classification labels. A separate validation key retains review expectations. The 400 Initial and 100 Sync rows support incremental testing without duplicating source identifiers. These expected labels do not guarantee an exact production model result. Files are in `outputs/censored-concert-500` in this repository working directory.
