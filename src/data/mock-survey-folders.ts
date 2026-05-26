export interface SurveyFolder {
  id: string;
  name: string;
}

export interface SurveyListItem {
  id: number;
  folderId: string;
  name: string;
  creationDate: string;
  completedResponses: number;
}

export const MOCK_SURVEY_FOLDERS: SurveyFolder[] = [
  { id: 'my-surveys', name: 'My Surveys' },
  { id: 'text-ai', name: 'Text AI' },
  { id: 'participant-id', name: 'Participant ID' },
  { id: 'rmb', name: 'RMB' },
  { id: 'nba-templates', name: 'NBA templates' },
  { id: 'offline-2024', name: 'Offline 2024' },
  { id: 'gfk-templates', name: 'Templates for GFK' },
  { id: 'no-edit', name: 'Template - No edit access' },
  { id: 'miya', name: 'Miya' },
  { id: 'demo-2026', name: 'Demo 2026' },
  { id: 'research-bootcamp', name: 'Research Bootcamp' },
  { id: 'templates', name: 'templates' },
  { id: 'glob-library', name: 'Glob Library' },
];

export const SHARED_SURVEY_FOLDER_ID = 'shared';

const SURVEY_TITLE_SUFFIXES = [
  'New survey',
  'Platform connect',
  'Customer pulse',
  'Post-event feedback',
  'Employee engagement',
  'Brand tracker',
  'NPS follow-up',
  'Onboarding experience',
  'Product usability study',
  'Market segmentation',
  'Ad concept test',
  'Pricing sensitivity',
  'Churn exit interview',
];

function buildSurveysForFolder(
  folder: SurveyFolder,
  startId: number,
  count: number
): SurveyListItem[] {
  return Array.from({ length: count }, (_, index) => {
    const suffix = SURVEY_TITLE_SUFFIXES[index % SURVEY_TITLE_SUFFIXES.length];
    const month = ((index % 12) + 1).toString().padStart(2, '0');
    const day = ((index % 28) + 1).toString().padStart(2, '0');

    return {
      id: startId + index,
      folderId: folder.id,
      name:
        index === 3 && folder.id === 'demo-2026'
          ? 'Demo survey 2026'
          : index === 0 && folder.id === 'demo-2026'
            ? 'New survey'
            : index === 1 && folder.id === 'demo-2026'
              ? 'Platform connect'
              : index === 2 && folder.id === 'demo-2026'
                ? 'TextAI beta access'
                : `${folder.name} — ${suffix}`,
      creationDate: `2026-${month}-${day}T10:00:00Z`,
      completedResponses: (index * 137 + folder.name.length * 11) % 2500,
    };
  });
}

let nextSurveyId = 1000;

function takeNextIdBlock(size: number): number {
  const start = nextSurveyId;
  nextSurveyId += size;
  return start;
}

const SURVEYS_PER_FOLDER = 12;

export const MOCK_SURVEYS: SurveyListItem[] = [
  ...MOCK_SURVEY_FOLDERS.flatMap((folder) => {
    const startId = takeNextIdBlock(SURVEYS_PER_FOLDER);
    return buildSurveysForFolder(folder, startId, SURVEYS_PER_FOLDER);
  }),
  ...buildSurveysForFolder(
    { id: SHARED_SURVEY_FOLDER_ID, name: 'Shared surveys' },
    takeNextIdBlock(SURVEYS_PER_FOLDER),
    SURVEYS_PER_FOLDER
  ),
];

export function getSurveysByFolder(folderId: string): SurveyListItem[] {
  return MOCK_SURVEYS.filter((s) => s.folderId === folderId);
}

export function getSurveyById(id: number): SurveyListItem | undefined {
  return MOCK_SURVEYS.find((s) => s.id === id);
}

export function getSurveyByName(name: string): SurveyListItem | undefined {
  return MOCK_SURVEYS.find((s) => s.name === name);
}

/** Survey tied to a dashboard when continuing with the current survey in add-widget. */
export const DEFAULT_DASHBOARD_SURVEY: SurveyListItem = {
  id: 999001,
  folderId: 'my-surveys',
  name: 'QuestionPro - RE',
  creationDate: '2026-01-15T10:00:00Z',
  completedResponses: 1842,
};

export function resolveDashboardSurvey(
  surveyId?: number,
  surveyName?: string
): SurveyListItem {
  if (surveyId !== undefined) {
    const byId = getSurveyById(surveyId);
    if (byId) return byId;
  }
  if (surveyName) {
    const byName = getSurveyByName(surveyName);
    if (byName) return byName;
    if (surveyName === DEFAULT_DASHBOARD_SURVEY.name) {
      return DEFAULT_DASHBOARD_SURVEY;
    }
  }
  return DEFAULT_DASHBOARD_SURVEY;
}
