repo: kartik-bhat-qp/Survey-RE
branch: main

## Last sync

date: 2026-08-27T07:52:45Z

### Updated in this project

- Recreated the Research Agent sidebar, survey editor chrome, and question canvas from source.
- Added a new agent reply UX: one-line headline, expandable diff-style change list, collapsed steps, 3 inline next-step actions.
- Covered working, completed-run, large-run (34 questions), and chat-history states.

## Screen map

| Project screen | Repo files |
|---|---|
| Research Agent Reply.dc.html — agent sidebar | src/components/surveys/SurveyAgentSidebar.tsx, SurveyAgentSidebar.module.css, ResearchAgentContextUsage.tsx/.module.css, SurveyAgentThinkingOverlay.module.css, src/data/mock-survey-ai-agent.ts |
| Research Agent Reply.dc.html — editor chrome | src/app/(research-suite)/surveys/[id]/layout.tsx, SurveyEditorPage.module.css, src/components/surveys/SurveyEditorPhaseTabs.tsx/.module.css, SurveyEditorWorkspaceToolbar.tsx/.module.css, survey-workspace-tools.ts |
| Research Agent Reply.dc.html — question canvas | src/components/surveys/SurveyEditorCanvas.module.css |
| Research Agent Reply.dc.html — app shell | src/components/DashboardShell.tsx/.module.css, src/data/mock-header-categories.ts, src/app/globals.css |
