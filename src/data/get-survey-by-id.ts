import {
  MOCK_SURVEY_FOLDERS,
  MOCK_SURVEYS,
  type Survey,
  type SurveyFolder,
} from '@/data/mock-surveys';

export function getSurveyById(id: number): Survey | undefined {
  return MOCK_SURVEYS.find((survey) => survey.id === id);
}

export function getSurveyFolderById(folderId: string): SurveyFolder | undefined {
  return MOCK_SURVEY_FOLDERS.find((folder) => folder.id === folderId);
}

export function getSurveyEditorTitle(survey: Survey): string {
  if (survey.folderId === 'demo-2026') {
    return 'Demo Survey 2026';
  }
  return survey.name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
