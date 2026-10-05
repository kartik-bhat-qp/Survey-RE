# Question Stacks implementation

See [PRD.md](PRD.md) for sources, requirements, decisions and prototype boundaries.

Run the existing Survey RE development server and open `/survey-stacks` (also available under `/bi-package/survey-stacks`). The seeded Support satisfaction stack demonstrates exact-label mapping for reversed answer orders. The Customer experience — Question Stack demo survey has 24 compatible CSAT questions, a differently worded response scale, and other types/counts for guardrail checks.

Validation:

- `node --test tests/question-stacks.test.mjs`: eligibility, 2–20 limits, question uniqueness, one-survey membership, complete mappings, duplicate mapping repair, unequal response bases, missing values and empty/single-answer statistics.
- Targeted ESLint passes for all new stack code. The full-project `tsc --noEmit` check reports unrelated errors in `EssentialsAccountUnderReviewBanner`, `SurveyDesignDashboard`, `SurveyEditorWorkspaceToolbar`, and `TextAiConfiguredWidget`; see `typecheck.log`. No Question Stack errors were reported.
- Browser checks: type chooser; one-survey selection; incompatible-scale hiding; minimum selection; reversed-label automatic mapping; manual mapping gate; saving/list persistence; standard widget source/group selection; pooled preview and statistical output; advanced Heatmap added successfully; 21st selection rejected with the specified warning and 20 selections retained; saved mappings verified after a full page navigation; existing Survey Stack field expansion and Update toast; new Survey Stack source selection, field mapping and creation.

Review screenshots: [answer mapping](answer-mapping.png) and [updated original PRD](prd-updated.png).

Storage keys: `survey-re:question-stacks:v1` and `survey-re:created-survey-stacks:v1`. Preserve saved data when parsing fails; surface load errors for Question Stacks. All fixture responses are synthetic and all data stays local to the prototype.


## Production flow alignment — 30 September 2026

[Production audit](production-parity.md) documents the observed Survey Stack flow and the shared pattern now applied to both stack types. Nine domain tests pass (`node --test tests/question-stacks.test.mjs tests/survey-stack-model.test.mjs`). Browser QA covers type choice, inline naming, minimum source/group selections, generated field rows, adding a third survey, replacement, save/reopen, inline mappings and duplicate-map save blocking. The earlier separate Survey Stack setup page and Question Stack mapping-step screenshots are historical; current views are `prototype-survey-stack-parity.png` and `prototype-question-stack-parity.png`.

## UI QA — 1 October 2026

The custom stack survey picker has been replaced by the dashboard's actual `AiDataSourceSelection` component. Creation cards, action widths, field inputs, source headings and inline answer grids have been corrected. Current verification details and screenshots are in [ui-qa.md](ui-qa.md); the earlier parity screenshots above are historical.

## Current production alignment — 1 October 2026

The [fresh audit](production-parity.md) supersedes the previous layout screenshots. Add survey now manages the complete selected source set, single selection uses native links, and both editors preserve drafts with a Cancel confirmation. Add metric group creates an inline row before question selection. Both use compact production-style columns and fixed bottom actions, with Save returning to the list and Update remaining in the editor. See the latest browser verification in [ui-qa.md](ui-qa.md).
