# Stacks UI QA — 1 October 2026

Verified in the local Survey RE prototype through the authorized Work Chrome browser. This is prototype QA, not new production verification.

## Corrections

- New Stack cards align each icon with its title, with descriptive copy below.
- Create Survey Stack, Create Question Stack, Add metric group and dialog actions size to their labels.
- Both stack editors use the actual dashboard `AiDataSourceSelection` component. Optional confirmed single/multiple selection retains its folder list, search and sortable table. Stack pickers start in My Surveys. Existing dashboard callers keep click-to-advance behavior.
- Selected sources survive folder/search changes; Add survey includes existing checked sources, and replacement excludes other source columns. Empty searches show explicit feedback.
- Field inputs no longer exceed their cells. Column groups define the table layout; source names truncate with full title text; answer grids scroll locally without widening the page. Scroll regions are keyboard focusable.
- Wrapped stack names have a full block click target, fixing clicks that previously landed in the gap between text lines.

## Browser verification

| Scenario | Result |
| --- | --- |
| New Stack cards, both inline naming flows, creation buttons | Pass; measured button content widths equal their visible widths |
| Survey Stack: one selected source | Add remains disabled until two sources are selected |
| Survey Stack: two sources, generated fields, expand answers | Pass |
| Survey Stack: duplicate answer assignment | Save blocked until the displaced assignment is restored |
| Survey Stack: add/delete draft field; save and reopen | Pass; edited mappings retained |
| Add third source, change folders, search, sort | Selection retained; existing sources included and checked |
| Replace third source; Update and full reload | Replacement retained |
| Question Stack: one survey, minimum two questions | Correct single-source and minimum-group guards |
| Three-question group with differently worded third scale | Incomplete mappings block Save; manual five-answer mapping enables Save |
| Question Stack save/reopen | All mappings retained, including Excellent for Very satisfied |
| Rename metric group; cancel source replacement | Group and mappings retained |
| BI dashboard question-based widget source | Survey click still advances directly to question selection |
| 1920px desktop, 1440px laptop, 1024px narrow desktop | Cards/actions/dialogs/editor inspected; no input overlap or page-wide horizontal overflow |
| 1024px Survey Stack with three sources | Document width 1024px; region width 768px with local horizontal scrolling; zero inputs exceeding cells |
| Browser errors on final stack flow | None captured |

Synthetic local QA records are retained for review: “QA Survey Stack — October UI review” and “QA Question Stack — October UI review”.

## Automated checks

- Ten domain tests passed: `node --test tests/question-stacks.test.mjs tests/survey-stack-model.test.mjs`.
- Targeted ESLint and `git diff --check` passed.
- Full-project TypeScript check remains blocked by existing errors in `CriteriaEngineEditor`, `EssentialsAccountUnderReviewBanner`, `SurveyDesignDashboard`, `SurveyEditorWorkspaceToolbar`, and `SurveyFinishOptionsDashboard`. No errors reported in changed stack or data-source files. Diagnostic log: `.runtime/stacks-parity-typecheck.log`.

## Screenshots

- [Creation cards](qa-stack-chooser.png)
- [Shared dashboard source picker](qa-native-source-picker.png)
- [Survey Stack mapping](qa-survey-stack-mappings.png)
- [Question Stack, 1024px](qa-question-stack-1024.png)
- [Question Stack, 1440px](qa-question-stack-1440.png)
- [Final Question Stack editor](qa-question-stack-final.png)

## Production alignment follow-up

Rechecked current production v202 using synthetic reference stack 3353; see [production-parity.md](production-parity.md). The native picker, compact grid and fixed bottom actions replace the earlier layouts shown above.

| Fresh browser check | Result |
| --- | --- |
| Survey Stack: chooser → inline name → empty editor → select two sources → Save | Returned to Stacks; reopened persisted sources and fields |
| One source in initial picker | Add survey disabled until a second selection |
| Existing sources checked in Add survey; uncheck a third source | Column removed in draft; custom answer mappings in retained sources preserved |
| Survey Stack Update, then Cancel | Update stays in editor; Cancel returns directly after successful save |
| Add field | Inline untitled input focused and scrolled into view; later source selectors disabled until first question |
| First question selection | Field label, type and scale populated; compatible second source automatically mapped |
| Expand/delete new field | Inline mappings shown; confirmation removes draft field |
| Replace source via native link selection | Correct column replaced; Cancel/Yes discarded changes; reopen restored original saved source |
| Question Stack Add metric group | Inline untitled row; name edited in place; selector requires two compatible questions; mappings expand after Apply |
| Question Stack Update | Stayed in editor; clean Cancel returned to list; reopen retained new group and mappings |
| Question Stack chooser → name → select one survey → inline group → Save | Returned to Stacks; reopen retained canonical scale and reversed-label mappings |
| Click selected single-source link twice | Same source remains selected |
| Question Stack Delete survey | Confirmation clears draft groups and returns to empty editor; Cancel/Yes preserves saved source/groups |
| Narrow desktop, 1024×768 | Document width 1024; mapping region width 768 and scroll width 1030; fixed header and Add metric group visible; keyboard scrolling works |
| Final Question Stack browser errors | None captured |

Temporary viewport overrides were reset. Production inspection drafts were discarded without saving changes to the retained reference. Local synthetic records “QA production-aligned Survey Stack” and “QA production-aligned Question Stack” are retained for review; the prior Question Stack QA fixture also includes the new inline-group check.

Current screenshots:

- [Production reference editor](production-current-editor-2026-10-01.png)
- [Native multi-survey picker](qa-production-native-picker.png)
- [Survey Stack editor](qa-production-survey-editor.png)
- [Question Stack editor](qa-production-question-editor.png)
- [Question Stack at 1024px](qa-production-question-1024.png)
