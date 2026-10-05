# Censored sub-themes — prototype review checkpoint

5 October 2026. Prototype only; this is an engineering checkpoint, not a PRD or a production release claim.

## Requirements document and Shipyard

The native [TextAI Censored sub-themes PRD](https://docs.google.com/presentation/d/1nrACGp28Lxj0jurEsoy2ffnpWDcP4njlSCzBSQrTKLg/edit) and the published Survey-RE prototype link are attached to [Shipyard project 310](https://admin2.questionpro.com/cs/ui/gad/project-shipyard/projects/310), “Censored theme for sensitive/abusive/out of context political responses”. The PRD records the agreed prototype behavior and remaining product decisions. Earlier sections below retain the review history.

Repository publication checks on 5 October: all 186 automated tests pass, the repository TypeScript check passes, and the complete Next.js production build succeeds after repairing the pre-existing Survey/WickUI compatibility errors. The current TextAI and stack changes pass targeted ESLint. Two existing React effect errors and one existing accessibility warning remain in Survey components outside these feature changes. Local verification logs and preview caches are excluded from Git.

## Review location

Local Survey RE route: http://127.0.0.1:3000/text-ai/23

Dashboard list name: **McDonald's feedback — Censored sub-themes**. Theme Configuration: `/text-ai/23/theme-configuration`.

The restaurant fixture contains twelve responses: eight ordinary comments and four examples of off-topic politics, abuse, unrelated promotion and a malicious instruction. Its classification is a deterministic fixture representing completed analysis; no production AI processing or credits are used. The new restaurant dashboard computes its displayed charts, overview and response table from the same response assignments used by the existing Theme Configuration editor. Existing dashboard examples now also include seven shared synthetic Outlier records per question: Outlier, Gibberish, N/A and four exclusively Censored responses. Their original aggregate chart fixtures remain separate, while their normal text viewers and the Outlier response section consume saved censorship assignments.

## Implemented rules for review

- Outlier / Censored is a protected system sub-theme. Automatic fixture classification assigns it alone. Relevant negative restaurant feedback remains ordinary feedback.
- Show censored sub-themes is a toggle, off by default. It is one dashboard preference, editable through dashboard settings and Theme Configuration settings.
- When off, a response carrying Censored is excluded in its entirety from dashboard counts, sub-theme comparison, sentiment assignments, overview and response table, and the regular Theme Configuration response panel. Other tags cannot make the response visible.
- The system sub-theme remains discoverable in the code frame when hidden, including when its count is zero or the preference to hide empty themes is enabled. Every Theme Configuration route includes the production-style Outlier Parent Topic with Outlier, Gibberish, N/A and Censored; Outlier appears as a normal group in the code frame; no extra header shortcut is shown.
- Clicking Censored while hidden opens the review modal, with search, individual selection, multi-selection, all-response selection, pagination and bulk removal. Select all includes every censored response across pages, including responses outside the current search; its label makes this scope explicit.
- Removing censorship preserves original text and other existing tags. An exclusively censored response becomes untagged and can be coded normally.
- Existing Save/Cancel semantics apply. Pending removals are previewed in the regular Theme Configuration panel, with explicit messaging. The dashboard reads committed assignments only. Discard restores the saved tags.
- When visibility is enabled, Censored appears in the dashboard comparison and response table. Clicking it in the code frame filters the regular panel. Responses support additional manual sub-theme tags through the existing tag picker.
- Turning visibility off again hides the entire still-censored response, including regular tags assigned while visibility was enabled.
- In the restaurant demo, code frame percentages use all twelve analyzed responses; the dashboard comparison uses the currently visible response base. Multi-tag overlap can make percentages total over 100%.

## Walkthrough

1. Begin with visibility off: eight visible responses, four hidden, twelve visible assignments.
2. Open Theme Configuration and click Censored under Outlier. Review the four examples; select one, several or all, then Remove censorship.
3. Close the modal. Released responses appear as pending changes in the regular panel. Add ordinary tags if desired. Save and confirm to update the dashboard, or Cancel and discard to restore the original state.
4. Enable Show censored sub-themes in either settings route. All twelve responses and the Censored bar appear. Tag a censored response with Food quality, Save, then disable visibility. That response and its Food quality assignment disappear from the dashboard base.

## Validation

- 24 automated tests pass across censorship behavior, staged tagging, code frame drafts, filtering, sorting and moves.
- Targeted ESLint passes for the changed feature, settings and toolbar files.
- Browser verification used only Chrome extension connection 2, profile QuestionPro, extensionInstanceId `8efe46aa-7d0e-4b03-a42e-629caad67975`. Initial restaurant-demo validation did not access Google or production content; the later read-only production inspection is recorded below.
- Observed bulk release + Save + reload: twelve visible responses, four untagged, no Censored assignments.
- Observed visible multi-tag case: four censored responses also assigned Food quality; disabling visibility returned the regular panel and dashboard to eight responses and twelve assignments, with no political or spam text exposed.
- Both settings routes synchronized the preference. Saved coding survived reload.
- Workspace TypeScript check still reports existing unrelated Survey UI/WickUI errors. The changed Text AI files report no type errors. Full workspace compilation is not claimed.
- Screenshots: `dashboard-hidden.jpg`, `dashboard-visible.jpg`, `review-modal.jpg`.

## Decisions to settle before writing the PRD

- How to classify a response mixing useful restaurant feedback with off-topic or abusive material: censor the whole response, or preserve useful excerpts? The prototype implements whole-response exclusion after a Censored assignment.
- Whether a saved manual removal of censorship should survive future full recoding; existing recode guidance says full recoding can overwrite manual tags. This prototype does not establish a new production recoding rule.
- The precise classification criteria and reason taxonomy, including how abusive but relevant feedback differs from ordinary negative feedback.
- Permissions for reviewing hidden content and removing censorship, and treatment in external exports or downstream BI imports. No new publication, sharing or export behavior is established here.

PRD creation remains deferred until the user reviews the prototype and these rules are settled.

## Follow-up implementation — 5 October 2026

The user requested toggles, shorter descriptions, production inspection and usable Outlier/Censored records in the existing prototype dashboards. Both settings controls now use WuToggle. The shortened description retains dashboard charts/counts/responses, the regular Theme Configuration panel, exclusion of every tag on a censored response, and the review/removal route.

Production account `prabal.gupta@questionpro.com` was verified through the QuestionPro Chrome extension after restoring the existing linked sign-in. Read-only checks inspected KB-T01 / 9493 in Knowledgebase 2665 and Restaurant feedback / 4065 in Default 2 / 348. The former exposed Outlier Parent Topic containing Outlier, Gibberish and N/A, each at zero count; the restaurant reference exposed its existing restaurant taxonomy with no Outlier entry in the inspected code frame. Censored is the proposed prototype addition, not an observed production release. No processing, recoding or production taxonomy changes were performed.

Every existing prototype Theme Configuration route appends the shared Outlier group to the current saved/draft code frame without replacing ordinary themes. Seven synthetic Outlier examples are added per question with stable IDs 100001–100007. Censorship assignments for those examples are scoped by question and independent of granularity, so changing granularity does not resurrect a manually removed Censored tag. Response coverage now calculates from the visible response assignments.

Browser checks verified Outlier/Censored on dashboards 1 and 2; dashboard 1's individual release + Save appeared untagged in its normal dashboard text viewer. Both preference routes expose the named switch. The four-response censorship pop-up supports the same selection, removal and Save/Cancel flow on these existing dashboards. Targeted lint and 19 tests pass; the workspace typecheck continues to report unrelated existing Survey UI errors, with no errors in the changed Text AI files.

Screenshots added: `existing-dashboard-outlier.jpg`, `existing-dashboard-review.jpg`, `theme-settings-toggle.jpg`, `dashboard-settings-toggle.jpg`. Local engineering evidence remains here, outside any future PRD.


## Production alignment — 5 October 2026

The owner requested removal of the Outlier header shortcut, broader alignment with production, a one-line hidden-content note with a review action, and no response-panel notice when censorship is shown. Those changes are implemented. Censored seed assignments retain Neutral sentiment. The Censored card no longer adds a “System” label to its name.

Read-only production comparison used the metadata-verified QuestionPro Chrome extension (connection 2, extensionInstanceId `8efe46aa-7d0e-4b03-a42e-629caad67975`) and the visibly verified account `prabal.gupta@questionpro.com`. The owner's explicit request authorized references across workspaces for this comparison. References:

- Knowledgebase / 2665: Advanced TextAI coding reference / 9493, including zero-count Outlier children, sub-theme and response selection, settings, separate Theme history, source-filter controls, and create/edit forms.
- Default 2 / 348: Restaurant feedback / 4065, with 81 sub-themes / 1,500 responses and a disabled Recode control; Emerging AI codebook / 9465, with populated Outlier and 140 responses; Emerging uploaded codebook / 9464, with 40 responses, Move and Edit dialogs, search and available Recode scope choices.
- Demo / 2657: separately generated question dashboard / 4614, with 42 sub-themes / 1,500 responses and an existing “Recode in progress…” state. No processing was initiated by this task.

Production was not modified. Dialogs were inspected and dismissed without submitting them; selection and search were transient. Production evidence is in `parity-production-*.txt` and `parity-production-kb.jpg`. These observations do not establish approval persistence, processing completion, or the outcomes of production edits.

The prototype now uses the compact production toolbar order (search, Filter, Theme history, settings, dashboard, Recode), with Save/Cancel shown for pending changes. Question selection is inside the optional filter panel, since existing combined prototype dashboards have multiple question contexts. The unobserved Granularity button, generated-sub-theme header label, per-parent sub-theme-count badge, and Outlier shortcut were removed. Full default code frames are displayed, preserving saved structures.

Sub-theme cards show their descriptions, percentages and hover/focus Rename/Move/Delete controls. Parent themes support inline renaming. Move and Add to theme transfer existing assignments while preserving response text and sentiment; duplicate destination names are rejected. Censored and its containing parent remain protected, and its hidden-mode click opens review instead of a regular filter.

Any selected ordinary sub-themes now filter the response panel by their union, retaining all tags on matching responses. The raw-data selector is All/Untagged/At least N, with a working page-range selector, Newest/Oldest ordering and expanded panel view. Zero-count coverage segments are omitted. Text search filters raw text and refreshes code-frame percentages and coverage over that search base; choosing sub-themes narrows supporting responses while retaining the source coverage base. The prototype filter panel supports question context, date range and sentiment; these controls operate on synthetic response records, with September 2026 collection dates and 5 October 2026 dates for added Outlier examples. This is a bounded prototype of the inspected review/edit workflow, not production source-query execution or Filter AI.

The hidden-content note reads “N censored responses hidden from this panel and dashboard. Review”, without a container or extra visible/analysis counts. With Show censored sub-themes enabled, neither the note nor a visible-content notice renders. Selection/filter messages remain separate. Review wording and staged removal/Save/Cancel rules are retained.

Theme history is now its own toolbar dialog with an All operations filter and entries grouped by date. Saving configuration records a history entry. The existing manual sentiment editor is retained in the response selection actions.

Validation: 24 tests pass; targeted ESLint passes without warnings; workspace TypeScript still has unrelated Survey/WickUI errors and no errors in these changed files. Browser checks covered hidden Review, visible Censored filtering/Neutral sentiment without a notice, ordinary-sub-theme filtering, tag-count filtering, response expansion, a Move draft involving 250 responses, and restoring it through Cancel/Discard. Browser screenshots of the aligned panel are retained as `parity-prototype-panel.jpg` and `parity-prototype-final.jpg`. PRD writing remains deferred.


## Hover alignment — 5 October 2026

The owner requested another production comparison specifically for themes, sub-themes, responses and other Theme Configuration controls. Browser connection metadata again matched Chrome extension 2 / QuestionPro / extensionInstanceId `8efe46aa-7d0e-4b03-a42e-629caad67975`; visible account UI confirmed `prabal.gupta@questionpro.com`. Read-only references were Knowledgebase / 9493 and Default 2 / 9464. Transient selections and dialogs were dismissed without committing production changes.

Live DOM stylesheet rules were inspected for both production dashboards, with matching header, sub-theme, response and tag hover rules. Computed `:hover` states were also observed after transient clicks on rendered header/card content. The browser API does not expose a pointer-move-only method; individual button hover colours were taken from their live mounted stylesheet rules, while prototype keyboard focus and action routing were checked directly.

Matched details:

- A theme header darkens with `brightness(.97)` and reveals Rename/Delete in reserved space. Its percentage remains visible. Header padding and percentage are clickable collapse targets as in production; edit controls do not trigger collapse. Inline rename hides the other actions until dismissed.
- Sub-theme hover reveals centred, 32px Rename/Move/Delete buttons over a transparent-to-card-colour gradient. It does not add the old blue hover fill/border. Selected cards retain the production green fill, green border and subtle 2px ring after the pointer leaves. Selected action overlays use the same green colour.
- Rename/Move hover uses neutral grey; Delete hover uses red text on a pale red background. Hidden actions cannot intercept pointer clicks, and keyboard focus reveals their controls. Touch input also keeps these controls available.
- Response hover uses #fafafa. Selection uses the production pale blue background and blue border, with the production hover background taking precedence while the selected card is hovered. Individual Add sub-theme links were removed; select one or more responses and use Add sub-theme in the selection toolbar. Tag remove buttons remain visible at .7 opacity and reach full opacity on hover/focus. Tags use compact production spacing; accepted sentiment icons and Neutral Censored assignments are retained.
- Toolbar and pagination actions use the muted secondary hover surface. Code-frame header buttons use a translucent white hover surface. Response and review checkboxes match the blue/grey hover and checked states, preserve keyboard focus and indeterminate selection, and fall back to native controls in forced-colour mode. Coverage segment tooltips include response counts.

Prototype browser checks covered header collapse and reveal without percentage overlap, selected sub-theme action placement, action disappearance with preserved selection colour, keyboard Tab access to Rename, opening and cancelling Edit, response checkbox selection and bulk Add sub-theme, and the four-response Censored review pop-up with selection. No prototype taxonomy/tag edits were saved during this hover review. The existing censorship notice remains a compact Review line, and shown censorship still adds no notice.

Validation: 24 existing behaviour tests pass; targeted ESLint is clean. Workspace TypeScript continues to report unrelated Survey/WickUI errors and none in the changed TextAI page. Evidence: `hover-production-rules.json`, `hover-production-*.jpg`, `hover-prototype-*.jpg`; logs are in `.runtime/theme-hover-*.log`. PRD writing remains deferred.
