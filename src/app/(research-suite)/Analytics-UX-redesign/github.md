repo: kartik-bhat-qp/Survey-RE
branch: main
path: src (analytics UX)

## Last sync
date: 2026-08-14T08:27:19Z

### Updated in this project
- Recreated Surveys analytics chrome (WuAppHeader, phase tabs, footer) from repo components
- Copied Fira Sans fonts + QuestionPro logo from public/
- New WickUI analytics redesign prototype (Survey Analytics Redesign.dc.html) — full analytics suite: Overview, Responses, Cross-Tab, Trend, Comparison, Consolidate, Conjoint, MaxDiff, Correlation, GAP, Heatmap, HotSpot, TURF, TubePulse, Word Cloud, Search Text, VideoAI, Data Filters, Weighting, Data Quality, Export/Import, Merge 2.0, Scheduler, Download Center, Delete Responses, Device Audit

## Screen map
| Screen | Repo files |
|---|---|
| App shell / header / footer | src/components/surveys/ResearchSuiteShell.tsx(.module.css), src/components/GlobalFooter.*, src/data/mock-header-categories.ts, src/data/mock-header-user.ts |
| Phase tabs + analytics nav | src/components/surveys/SurveyEditorPhaseTabs.*, SurveyAnalyticsSubNav.*, src/data/mock-survey-analytics.ts |
| Analytics dashboard patterns | src/components/surveys/SurveyAnalyticsDashboard.tsx(.module.css) |
| DC style reference | src/app/(research-suite)/Media-library-UX-overhaul/Media Library.dc.html |
