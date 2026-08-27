repo: kartik-bhat-qp/Survey-RE
branch: main
path: src (survey analytics)

## Last sync
date: 2026-08-27T02:46:11Z

### Updated in this project
- Recreated the analytics shell (dark WuAppHeader, phase tabs, analytics sidebar, global footer) from repo source
- Copied Fira Sans fonts + QuestionPro logo from the Analytics-UX-redesign public assets
- New TURF Price Modeling redesign (TURF Price Modeling.dc.html) — restyled model inputs, per-answer cost list, run summary panel
- General "no report" empty page reused across analyses that require a question type the survey lacks

## Screen map
| Screen | Repo files |
|---|---|
| App shell / header / phase tabs / sidebar / footer | src/app/(research-suite)/Analytics-UX-redesign/Survey Analytics Redesign.dc.html, src/components/DashboardShell.tsx, src/components/GlobalFooter.tsx(.module.css) |
| Type + color tokens | src/app/globals.css, public/fonts/fira-sans/* |
| Empty state pattern | src/components/ui/EmptyState.tsx |
| Page header pattern | src/components/ui/PageHeader.tsx |
