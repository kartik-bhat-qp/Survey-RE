repo: kartik-bhat-qp/Survey-RE
branch: main

## Last sync
date: 2026-08-07T06:23:11Z

### Updated in this project
- Recreated the Reports home and Create report flow in Wick UI's visual language (Fira Sans, #1b87e6 / #1b3380).
- Reimagined the Reports home for 10+ report types: pinned strip, type filter chips, Table / Grouped / Cards views.
- Rebuilt the Create report type picker as a searchable category list with a detail preview panel.
- Copied the six create-report icons and authored eight more in the same idiom (TURF, Regression, NPS, Key Driver, Segmentation, Text Analytics, Ranking, Weighted Tabulation).

## Screen map
| Screen | Repo files |
| --- | --- |
| Reports home | src/app/(dashboard)/reports/page.tsx, src/app/(dashboard)/reports/ReportsTable.module.css, src/data/mock-reports.ts |
| App shell (header, sidebar) | src/components/DashboardShell.tsx, src/components/DashboardShell.module.css, src/components/SideNav.tsx |
| Create report modal | src/components/reports/CreateReportModal.tsx, src/components/reports/CreateReportModal.module.css, src/components/reports/CreateReportStepBreadcrumb.tsx, src/data/mock-create-report.ts |
| Type icons | public/images/create-report/*.svg |
| Type / font tokens | src/app/globals.css |
