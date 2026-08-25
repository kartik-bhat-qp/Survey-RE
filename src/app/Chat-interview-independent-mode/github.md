repo: kartik-bhat-qp/Survey-RE
branch: main
path: src/components/surveys

## Last sync

date: 2026-08-25T05:22:14Z

### Updated in this project

- Recreated the survey editor screen around the Conversation (ListenAI) question, Q17 → Q18.
- Added an independent Conversation mode with a Follow-up | Independent segmented control in the question card.
- Independent mode drops the source-question picker and response piping; opener + objectives drive the AI follow-ups.

## Screen map

| Screen | Repo files |
|---|---|
| Conversation Independent Mode.dc.html | src/components/surveys/ListenAIQuestionRow.tsx, ListenAIQuestionRow.module.css, ListenAIQuestionSettingsPanel.tsx, ListenAIQuestionSettingsPanel.module.css, QuestionSettingsPanel.module.css, QuestionWorkspaceActions.tsx/.module.css, QuestionWorkspaceFooter.tsx/.module.css, SurveyEditorCanvas.module.css, SurveyEditorPhaseTabs.module.css, SurveyEditorWorkspaceToolbar.tsx/.module.css, SurveysHeaderBar.module.css, src/app/(research-suite)/surveys/[id]/layout.tsx + SurveyEditorPage.module.css, src/data/mock-listenai-question.ts, src/data/mock-listenai-studies.ts, src/components/surveys/survey-workspace-tools.ts |
