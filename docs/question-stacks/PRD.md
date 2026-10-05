# Question Stacks

Updated 1 October 2026. Status: product requirements.

## Sources and decisions

- [Original 25-slide PRD, updated in place](https://docs.google.com/presentation/d/1oUT9_PKGDCDoUoqUG4PYubfOS0ojvfFVxKqdfLAo64Q/edit).
- [Figma reference](https://www.figma.com/design/a8xR6LQP61nwvZczXYWthf/BI-Widget-Creation-via-Question-Stacks?node-id=0-1).
- Figma `Only one question selected (Tooltip)`, node 2016-188, explicitly requires at least two questions. Slides 14 and 19 define the maximum of 20.
- Figma `Edit Question Stack (hover)`, node 2018-416, defines a metric-group list with grouped question names and edit controls.
- Figma contains standard single-group selection and advanced none/one/two-group selection states. Groups remain distinct metrics when an advanced widget selects multiple groups.
- User direction, 30 September 2026: rename the module to Stacks; choose Question Stack or Survey Stack during creation; preserve Survey Stack experience; add answer mapping to Question Stacks.
- Production Survey Stack v202, observed 30 September 2026, supplies the field/answer mapping interaction reference. Survey Stack generates first-survey fields, matches compatible questions and initializes answer selections in source order, with editable mappings in every source column. Question Stacks retain exact-label suggestions and explicit review for unmatched labels to avoid silently pooling different meanings.

### Review comments considered

The January 2026 PRD discussion asks to distinguish pooled answers from people and expose category counts plus average questions answered. Show all four: pooled N, unique respondents, category counts and answers per respondent (`N / respondents`). A separate open suggestion proposes using Survey Stacks as Question Stack sources. It is recorded as future scope: the original single-survey rule and current requested flow remain in force. Weighted combinations across unlike scales (CSAT/CES/NPS) and AI suggestions are also future scope; the historical resolved discussion does not make them current requirements.

## Purpose

Researchers and CX managers define reusable constructs such as Support Satisfaction by combining related questions from a single survey. A widget pools their mapped answers, accounting for unequal per-question answer counts rather than averaging question means.

## Navigation and stack types

1. Rename the sidebar and list heading from Survey stacks to Stacks. Retain existing `/survey-stacks` URLs and all existing Survey Stack links.
2. New stack opens a type chooser with Question Stack and Survey Stack.
3. Question Stack starts a single-survey workflow. Survey Stack uses the existing cross-survey field and answer mapper.
4. The shared list displays type, name, created date and completed source-survey responses. Completed responses are not the pooled answer count.
5. Support both BI Stats and `/bi-package` routes.

## Question Stack creation and editing

1. Choose Question Stack, supply a non-empty name inline on the Stacks list, and create the named empty editor. Use Add survey to open the same folder/search/selection dialog as Survey Stack; select exactly one survey and confirm with Add survey.
2. Add metric group appends an inline untitled row, matching Survey Stack’s Add field pattern. Rename it in the row, then use its question selector to choose 2–20 compatible questions. Group names must be unique within the stack (case-insensitive, trimmed).
3. Each group contains 2–20 distinct compatible questions. A question may be reused in another group because groups define separate constructs.
4. Initially show categorical single-select questions with known answer options. Multi-select, text, rank-order, whole matrices and questions lacking a usable answer scale are excluded. Admit NPS only when the source has all 11 individual answer options; pre-bucketed promoter/passive/detractor options are not an 11-point scale.
5. The first selected question establishes the answer count. Immediately hide incompatible counts. Equal counts are a structural guardrail; users still select questions measuring the same construct and explicitly reconcile their meaning through mapping.
6. At 20 questions, leave compatible questions visible. Reject a 21st selection without changing the selected set and show: “Only 20 questions can be stacked within a metric group.” Selected questions remain removable.
7. If all questions are removed, clear the working common scale and restore all eligible questions.
8. Preserve selected questions across search/filter changes. Display the selected count and removable question chips.
9. Adding or updating a group returns to the table editor and expands its answer mappings inline. Save / Update in the page header persists the full stack only after all mappings are complete. A successful Update keeps the editor open and resets its saved state; initial Save returns to Stacks. Cancel asks before discarding uncommitted changes. Closing the confirmation keeps the draft.
10. The source header exposes Replace and Delete. Delete confirms before returning the draft to the empty editor and clearing its groups. With existing groups, show a confirmation that choosing a different survey clears groups and mappings. Cancelling the picker or reselecting the same survey preserves them. Never carry stale mappings into a different survey.
11. Edit a group's name, membership and mappings. Removing a group remains an unsaved draft change until Update. A widget referring to a removed group shows an unavailable-source state rather than silently substituting another metric.

## Answer mapping

1. After question selection, expand an inline mapping grid beneath the metric-group row. Common answer labels and scores appear on the left; each question has a column of source-answer dropdowns, matching production Survey Stack’s column-based mapping interaction.
2. Initialize the common labels from the first selected question and default ordinal scores to 1…K. Labels and scores are editable.
3. Suggest exact matches ignoring case and surrounding spaces. Match reordered labels by meaning-preserving text equality, not by array position.
4. Leave differently worded labels unmapped until the user selects their equivalent common answer. Cross-scale harmonization (e.g. 5-point to 7-point) remains out of scope.
5. Require a complete one-to-one mapping for every question. Assigning an already-used common answer clears its previous source assignment and blocks saving until repaired.
6. Common labels must be non-empty and unique. Every common answer requires a finite numeric score. Custom scores permit reverse scoring without changing source responses.
7. Retain existing mappings when unrelated questions are added or removed. Newly added questions need their own complete mappings.
8. Store only question IDs, canonical labels/scores and mappings. Never modify survey question wording/options or manufacture a stored composite response variable.

## Release roadmap

| Release | Required coverage |
| --- | --- |
| V1 | All standard widgets and Heatmap |
| V2 | All widgets |
| V3 | Support for cross tabs and weighting |

These are the intended release targets, as clarified on 30 September 2026. Broader widget support belongs to V2; cross tabs and weighting belong to V3.

## Widget integration

- Standard setup: Add widget → Question based → Stacks → Question Stack → one metric group → compatible visualization → Add widget.
- Advanced setup: Add widget → Advanced widgets → Create from Question Stack → stack → one or more groups → visualization → Add widget. The Advanced Heatmap source chooser also exposes Stacks.
- Each group's results remain separate; selecting multiple groups does not pool them together a second time.
- V1 covers all standard widgets plus Heatmap; V2 covers all widgets. Each chart must use the mapped source contract and the selected responses.
- Save stack definitions through the platform’s persistence flow. Attach newly created widgets to the active dashboard tab.
- A widget resolves its saved stack/group IDs and recalculates from current definitions. Invalid or unavailable groups show a repair/unavailable message.

## Pooled calculations

For mapped, non-missing answers `x_i` across the selected questions:

- Pooled answer N = the number of valid item answers, not the number of people.
- Unique respondents = distinct respondent IDs with at least one valid answer in the group.
- Answers per respondent = pooled N / unique respondents; undefined if no respondents contribute.
- Mean = `Σx_i / N`, equivalently the mean of question means weighted by each question's valid answer count.
- Category count = number of mapped answers assigned to that common category. Distribution percentage = category count / N.
- Sample variance = `Σ(x_i − mean)² / (N − 1)`; sample SD = square root of variance.
- Standard error = `SD / sqrt(N)`; the displayed normal 95% interval = mean ± 1.96 × SE.
- Exclude missing answers independently per question; do not discard a person's other valid answers. A numeric score of zero is valid.
- With N=0, show no-data and no mean or inferential statistics. With N=1, variance, SD, SE and CI are undefined.
- **Statistical assumption:** SE/CI above treat pooled item answers as independent. Repeated answers from one respondent can be correlated. A respondent-clustered or construct-score inference method requires a separate production statistics decision; do not claim the simple pooled interval adjusts for within-person dependence.

Apply dashboard date and response-status filters before pooling, including missing-answer handling. Unknown dashboard criteria show an explicit unsupported-filter state rather than unfiltered data. Cross tabs and respondent weighting are explicitly planned for V3. Production row access, exports, license gating and specialized widget settings remain governed by their existing platform contracts and require production integration.

## Requirements traceability

| Source | Requirement | Product surface |
| --- | --- | --- |
| Slides 11, 17 | Shared Stacks module and type chooser | Sidebar, shared list, chooser |
| Slide 18 | One survey, multiple metric groups | Question Stack editor |
| Slides 14, 19; Figma minimum tooltip | 2–20 questions and dynamic eligibility | Group editor and domain validation |
| Slide 20 | Edit existing group | Edit name, membership, mapping; update stack |
| User enhancement | Answer-option mapping | Common scale, per-question mapping and validation |
| Slides 21–22; Figma advanced states | Standard / advanced stack sources | Reusable picker and group setup |
| Slides 2, 15, 23 | Pooled outputs | Calculated outputs, N and people separately |
| Slide 24 | AI suggestions and cross-scale harmonization | Future scope; not included |

## Regression requirements

The production Survey Stack flow observed on 30 September 2026 provides the interaction baseline: inline naming, named empty editor, multi-survey picker, first-survey-generated fields, additional survey columns, replace/delete source actions, inline answer mappings, confirmed field removal, and Save/Update. Question Stack shares that shell and interaction pattern while retaining its single-survey, 2–20-question group and complete-mapping requirements. The V1/V2/V3 release roadmap remains unchanged.

### Shared source selection

Both stack types reuse the BI dashboard’s source picker for folders, survey search, sorting and the survey table. Stack setup adds explicit single selection (Question Stack or replacement) or multiple selection (Survey Stack) and a confirmation footer. The dashboard's existing click-to-advance behavior remains unchanged. Selected sources persist across folder/search changes. Add survey starts with existing Survey Stack sources checked and allows modifying the complete source set (minimum two). Existing mappings remain unchanged for retained sources. Replacement uses single selection and excludes the other source columns. Both pickers start in My Surveys; single selection uses native survey-name links and multiple selection uses a checkbox column.

Stack creation cards keep their icon beside their title and supporting text below. Action buttons size to their label. Editor inputs and answer dropdowns stay within their columns; larger mapping grids scroll within the editor instead of expanding the page. Long source names and field labels remain available through their title text and editable controls.

## Editor interaction requirements

Both editors use the production-sized mapping columns, flat row controls, actions revealed on hover/keyboard focus, inline answer expansion, and a fixed bottom Add field / Add metric group bar. The body scrolls independently, so the header and bottom action stay available. Long labels truncate within their cells with full text on hover; mapping grids scroll horizontally within their containers.

First question selection fills an untitled Survey Stack field’s name, type and canonical scale. Source additions/removals preserve retained mappings. Both stack types protect unsaved drafts on Cancel and keep successful Updates in the editor. Question Stack differs only where its domain requires it: one survey, named groups of 2–20 questions, an explicit multi-question selector, editable common labels/scores, and complete one-to-one answer mapping. The New stack type chooser and V1/V2/V3 roadmap remain unchanged.
