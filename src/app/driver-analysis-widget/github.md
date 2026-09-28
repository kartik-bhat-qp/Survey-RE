repo: kartik-bhat-qp/Survey-RE
branch: main

## Last sync
date: 2026-09-17T06:40:00Z

### Updated in this project
- Recreated the BI Stats dashboard detail screen (header, side nav, toolbar, widget canvas, tab bar, footer) from source.
- Added a new **NPS driver analysis** advanced widget: impact × performance quadrant with per-driver relative weight, correlation and significance.
- Mock data uses an airline NPS study (10 service drivers); existing Age / NPS benchmark / Response info values lifted from repo mocks.
- Copied real widget icons (`public/images/advanced-widgets`, `add-widget`) and Fira Sans faces.

## Screen map
| Project screen | Repo files |
| --- | --- |
| Driver Analysis Dashboard.dc.html | src/app/(dashboard)/dashboards/[id]/page.tsx, src/components/DashboardShell.tsx(+module.css), src/components/SideNav.tsx, src/components/GlobalFooter.tsx, src/app/globals.css, src/components/dashboards/DashboardDetailToolbar.tsx(+module.css), src/components/dashboards/DashboardDetailTabBar.tsx(+module.css), src/components/dashboards/AiDashboardCanvas.tsx(+module.css), src/components/dashboards/widgets/DashboardWidgetCard.tsx(+module.css), src/components/dashboards/widgets/ResponseInfoWidget.tsx(+module.css), src/components/dashboards/widgets/MeanStatWidget.tsx(+module.css), src/components/dashboards/widgets/AiWidgetRenderer.tsx(+module.css), src/data/mock-ai-widgets.ts, src/data/dashboard-grid-config.ts, src/data/mock-age-bar.ts, src/data/mock-nps-benchmark.ts, src/data/mock-header-categories.ts, src/data/mock-header-user.ts |
| Driver analysis widget config (reference only, not rebuilt) | src/components/dashboards/AdvancedWidgetModal.tsx, AdvancedWidgetChartSelect.tsx, AdvancedWidgetStepBreadcrumb.tsx, AdvancedWidgetPreview.tsx, WidgetQuestionSelection.tsx, SelectWidgetModal.tsx, src/data/mock-advanced-widget-types.ts, src/data/mock-survey-questions.ts |
