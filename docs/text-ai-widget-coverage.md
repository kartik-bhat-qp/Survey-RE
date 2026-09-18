# Text AI widget coverage and layout

Production gallery observed 18 September 2026 in Knowledgebase workspace 2665, TextAI dashboard 9493, Add widget → Service feedback → Chart. No production widget was created or saved.

| Production gallery type | Prototype implementation |
| --- | --- |
| Gauge | Sentiment arc, percentages, interactive legend |
| Theme stacked bar | Theme sentiment distributions, interactive legend |
| Sub-theme stacked bar | Expandable themes and sub-themes, sentiment legend |
| Bubble chart | Theme bubbles and sub-theme drill-down, back navigation |
| Text viewer | Searchable, sortable, paginated response table |
| Trend line | Monthly sentiment series with point tooltips and legend toggles |
| Comparative chart | Full-width theme comparison, segment columns and stat testing |
| Sub-theme comparative chart | Separate flattened sub-theme comparison, Overall initially shown |
| Text Summary | Thematic and thematic/sentiment narrative variants |

All nine appear on the default dashboard and can be created from Add widget. Previously seven gallery choices performed no insertion, and the sub-theme comparative choice duplicated the parent-theme chart. Existing prototype-only KPI by Theme and Sub-theme trend remain available separately; they were not observed in this production gallery. The removed Impact on KPI card is not restored.

Desktop uses twelve grid columns: the main comparative chart spans twelve, all other cards six. Most default cards are eight grid rows (404px) instead of the text viewer's previous 25 (1288px). The main comparison remains nine rows. Cards reflow in pairs when added/deleted, preserve resized heights, and remain draggable and vertically resizable. Mobile retains its single-column stack. Dense tables scroll inside their cards. The sub-theme sentiment layout no longer requires a 54rem minimum width.

This verifies widget-type coverage and prototype interactions, not production analytical equivalence. Data is synthetic: gauge values are equal-weight averages of the existing theme sentiment fixtures; trend uses six illustrative monthly distributions; bubble areas scale with illustrative mention counts and drill down to fixture sub-themes. These charts are not connected to production data or server calculations. Added widgets retain the existing session-only state behavior; dashboard design settings remain persisted per dashboard. New chart colors and typography inherit dashboard design tokens, including contrasting text on palette colors.

Validation: TypeScript, targeted ESLint, and 20 existing design/filter tests. Browser verified all seven newly wired gallery creation paths plus Gauge, nine default cards after reload, two widths (full and half), no overlaps with sixteen cards, bubble drill-down/back, sentiment toggles, and absence of the Impact on KPI card. A new SVG tooltip hydration mismatch found during testing was fixed; reload confirmed no new hydration errors. Preview remains on port3012 in the isolated `text-ai-dashboard-design` branch/worktree.
