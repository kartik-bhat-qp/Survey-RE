import {
  MOCK_SURVEY_FOLDERS,
  MOCK_SURVEYS,
  type Survey,
  type SurveyFolder,
} from '@/data/mock-surveys';
import { NEW_AI_SURVEY_ID, readAiSurveyDraft } from '@/data/ai-survey-draft';
import {
  NEW_BLANK_SURVEY_ID,
  readBlankSurveyDraft,
} from '@/data/mock-survey-creation-flow';

export function getSurveyById(id: number): Survey | undefined {
  if (id === NEW_AI_SURVEY_ID) {
    const draft = readAiSurveyDraft();
    if (!draft) return undefined;
    return {
      id: NEW_AI_SURVEY_ID,
      name: draft.name,
      folderId: 'all',
      createdAt: draft.createdAt,
      modifiedAt: draft.createdAt,
      status: 'Active - Draft',
      responses: 0,
    };
  }

  if (id === NEW_BLANK_SURVEY_ID) {
    const draft = readBlankSurveyDraft();
    if (!draft) return undefined;
    return {
      id: NEW_BLANK_SURVEY_ID,
      name: draft.name,
      folderId: 'all',
      createdAt: draft.createdAt,
      modifiedAt: draft.createdAt,
      status: 'Active - Draft',
      responses: 0,
    };
  }
  return MOCK_SURVEYS.find((survey) => survey.id === id);
}

export function getSurveyFolderById(folderId: string): SurveyFolder | undefined {
  return MOCK_SURVEY_FOLDERS.find((folder) => folder.id === folderId);
}

export function getSurveyEditorTitle(survey: Survey): string {
  if (survey.folderId === 'demo-2026') {
    return 'Demo Survey 2025';
  }
  return survey.name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
