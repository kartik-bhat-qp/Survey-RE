# Production Survey Stack interaction audit

Observed 30 September 2026, BI production v202, Knowledgebase workspace2665, account verified in the visible menu as `prabal.gupta@questionpro.com`, Chrome extension profile `questionpro.com`.

Reference: [KB-UX Survey Stack flow reference /3353](https://bi.questionpro.com/workspaces/2665/survey-stacks/3353). Created from synthetic surveys13795609 and13810910 to inspect the full creation, mapping, save and reopen sequence. Retained for review. No changes to source surveys or responses.

## Observed flow

1. New survey stack reveals an inline name field and Create survey stack action in the list/empty state.
2. The named editor starts empty with Cancel and centered Add your surveys / Add survey.
3. Add survey opens a folder/search/table dialog with checkboxes and selected-survey chips. One selection did not advance; two did. The footer confirms the selection rather than immediately adding a clicked row.
4. The first survey generates all field labels. Each source survey appears as a column. Fields expose compatible question selections; unavailable matches display disabled No question to select. The initial fixture includes categorical, multi-select, matrix and text fields.
5. Hover actions expand answer mapping inline and delete a field after a confirmation dialog. Expanded mappings have common answer labels and editable dropdowns in every survey column, including the first.
6. A plus control beside survey columns opens Add survey. Column menus expose Replace and Delete. Replace uses the survey picker with a single row selection and Update footer.
7. Add field appends an untitled row. The first source question establishes its type; later source controls are disabled before this selection.
8. Save returns to the list. The saved reference totals120 completed responses, including fields without a compatible second-source question. Reopening shows Update and persisted mappings.

## Prototype changes

Both types now use type choice → inline name → named empty editor → Add survey dialog → table editor → Save/Update. Survey Stack supports additional survey columns, replacement, generated first-survey fields, inline mappings and confirmed removal. Question Stack uses one survey, metric-group rows, the same source picker and inline mapping expansion. A group-selection dialog collects its name and2–20 compatible questions; answer mapping is reviewed in the editor. Incomplete mappings block the final stack save.

Question Stack validation and the V1/V2/V3 roadmap are retained. Its single-survey and metric-group rules remain intentional differences from Survey Stack. The prototype continues using local storage and synthetic responses.

Screenshots: `production-stack-empty.png`, `production-stack-create.png`, `production-add-survey.png`, `production-stack-mapping.png`, `production-stack-saved.png`.
