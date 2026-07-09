const STORAGE_PREFIX = 'survey-re:';

export function readPersistedSurveyEditorValue<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (raw === null || raw.trim() === '') return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writePersistedSurveyEditorFlag(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(true));
  } catch {
    /* localStorage may be unavailable; ignore. */
  }
}

/** localStorage key for persisted survey editor sections (used with `survey-re:` prefix). */
export const SURVEY_EDITOR_SECTIONS_STORAGE_VERSION = 3;

export function getSurveyEditorSectionsStorageKey(surveyId: number): string {
  return `survey-editor-sections-v${SURVEY_EDITOR_SECTIONS_STORAGE_VERSION}:${surveyId}`;
}

export function getLegacySurveyEditorSectionsStorageKey(surveyId: number): string {
  return `survey-editor-sections:${surveyId}`;
}

export function getSurveyEditorSectionsMigrationFlag(surveyId: number): string {
  return `survey-editor-sections-migrated-v${SURVEY_EDITOR_SECTIONS_STORAGE_VERSION}:${surveyId}`;
}
