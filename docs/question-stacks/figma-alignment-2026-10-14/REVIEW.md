# Question Stack prototype — Figma alignment

Reviewed 14 October 2026. This is engineering evidence for the prototype, not production release evidence or a requirements-document update.

## Reference and access

Reference: https://www.figma.com/design/a8xR6LQP61nwvZczXYWthf/BI-Widget-Creation-via-Question-Stacks?node-id=0-1&p=f

QuestionPro Chrome connection ID 1, family chrome, type extension, profile QuestionPro; extension instance 8efe46aa-7d0e-4b03-a42e-629caad67975. The user directly approved Figma sign-in in this chat after automatic review initially rejected account selection. Google chooser and destination Figma account menu verified prabal.gupta@questionpro.com. No access settings were changed.

Reviewed creation-type chooser, empty Question Stack, survey picker, initial and selected-question states, required metric-group name, one-question tooltip, maximum-selection states, management hover state, edit-mode states, and populated stack list.

## Changes

- Stack name is entered before choosing the type. The shared modal offers Survey Stack and Question Stack with the reference descriptions.
- Empty Question Stack shows Add your questions and a plus action. Shared survey picker advances on selecting one survey, then opens the shared question picker.
- Metric group naming lives in the selection dialog. Required naming, unique names, 2–20 compatible questions, selected-question chips, Back and Save follow the reference flow.
- Adding a metric group opens the dialog directly; cancelling does not leave an empty row. Management shows Data type, Metric group and Questions, with each question on its own line and the edit pencil exposed on hover or focus.
- The existing answer-mapping enhancement remains in an expandable section. Unmatched mappings automatically expand and prevent stack save. Existing draft/save and source-replacement guards remain.
- Reused AiDataSourceSelection, WidgetQuestionSelection, WickUI modal, inputs, buttons, table, checkbox and select. New shared picker options preserve defaults for its other callers.
- Fixed UUID creation for the existing HTTP tailnet preview using getRandomValues. Question Stack, Survey Stack and stack widget IDs use this helper.

## Remote preview

Existing Tailscale Serve configuration was reused without modification:

http://prabals-mac-mini.tail5e17c3.ts.net:3001 → http://127.0.0.1:3000

Preview: http://prabals-mac-mini.tail5e17c3.ts.net:3001/survey-stacks

Seeded example: http://prabals-mac-mini.tail5e17c3.ts.net:3001/question-stacks/question-demo

This is tailnet-only and requires Tailscale on the viewing MacBook. The hostname returns HTTP 200. The numeric Tailscale IP is not a usable Serve URL because this existing proxy configuration matches the hostname. Storage stays in each browser's local storage; the MacBook has its own saved prototype stacks.

## Validation

- Targeted ESLint and full TypeScript check pass.
- Eleven tests pass: question-stack rules, survey-stack mapping regression, and HTTP-preview UUID creation without randomUUID.
- Browser verified name → type → empty editor → survey → question picker → group → save → list; reopening and editing persist after reload.
- One-question save disabled; two-question named group enabled; incompatible answer counts hidden; same-survey Back preserves name and selection.
- Twenty selections retained after rejecting a 21st with the exact warning. Removal at the limit works. Duplicate group names block save.
- Reversed answer order maps by label correctly. Group management shows every selected question. Answer mapping remains accessible.
- Fresh final preview has no browser console errors. Screenshots: question-picker.jpg and editor.jpg.
- A requested viewport override did not change the actual Chrome viewport (2560×1267); it was reset. No smaller-viewport visual verification is claimed.
- Full production build is blocked by a pre-existing modified AdvancedHeatmap.module.css global-only selector at line 97; that unrelated file was not changed by this task. Details are in .runtime/question-stacks/build.log.
- GitHub CLI authentication failed the escalated check. No fetch, push or external repository write was attempted.

## Follow-up: source placement and fixed question baseline

User-requested revision, 14 October 2026:

- Source details moved directly beneath the header; the bottom source row and its rule were removed. Replace survey and Remove survey actions were removed.
- Mapping expand/collapse and group deletion now sit beside the question text in the Questions column.
- Expanded mappings contain exactly one equal-width column per selected question. Separate Common answer and Score columns were removed. The first question's controls are disabled and establish the baseline; remaining columns are editable.
- If the first question is removed from a group, retained mappings and scores are rebased to the next selected question. Existing unresolved answer mappings remain unresolved; differently worded options still require explicit mapping.
- Browser verified two and three selected-question columns, disabled first-column controls, editable subsequent controls, mapping conflict/save blocking, conflict repair, and promotion of the next baseline after removal. Test edits were discarded.
- Targeted lint, TypeScript and 13 tests pass, including the new baseline/scoring regression checks. The live Tailscale preview continues running.

## Publication validation — 15 October 2026

The user requested all pending Survey-RE changes be pushed to remote main, including the existing Advanced Heatmap changes. The verified GitHub identity is prabalgupta-afk; the destination is kartik-bhat-qp/Survey-RE.

Moved the three heatmap portal-menu rules from the CSS module into the application global stylesheet, retaining their exact menu-ID scoping. This resolves the production-build blocker recorded above. All 196 repository tests, targeted lint, and the complete production build with TypeScript pass.

The data-source text remains 16px with a medium-weight survey name. The last spacing experiment was rolled back as requested: the table retains its previous desktop and responsive top spacing.
