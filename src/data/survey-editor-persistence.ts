/** localStorage key for persisted survey editor sections (used with `survey-re:` prefix). */
export function getSurveyEditorSectionsStorageKey(surveyId: number): string {
  return `survey-editor-sections:${surveyId}`;
}
