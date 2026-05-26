import type { SurveyListItem } from '@/data/mock-survey-folders';
import { getSurveysByFolder } from '@/data/mock-survey-folders';

/** Sample surveys shown in the TextAI create-dashboard modal (My Surveys folder). */
export const TEXT_AI_CREATE_SURVEYS: SurveyListItem[] = [
  {
    id: 88001,
    folderId: 'my-surveys',
    name: 'smiley',
    creationDate: '2026-05-14T10:00:00Z',
    completedResponses: 0,
  },
  {
    id: 88002,
    folderId: 'my-surveys',
    name: 'Bengal Elections - Political Opinion Survey',
    creationDate: '2026-05-14T10:00:00Z',
    completedResponses: 1,
  },
  {
    id: 88003,
    folderId: 'my-surveys',
    name: 'Rec survey for Karishma',
    creationDate: '2026-05-14T10:00:00Z',
    completedResponses: 0,
  },
  {
    id: 88004,
    folderId: 'my-surveys',
    name: 'Customer journey verbatims — wave 3',
    creationDate: '2026-05-13T10:00:00Z',
    completedResponses: 42,
  },
  {
    id: 88005,
    folderId: 'my-surveys',
    name: 'Post-purchase open ends Q2',
    creationDate: '2026-05-12T10:00:00Z',
    completedResponses: 128,
  },
  {
    id: 88006,
    folderId: 'my-surveys',
    name: 'Employee engagement comments 2026',
    creationDate: '2026-05-11T10:00:00Z',
    completedResponses: 0,
  },
  {
    id: 88007,
    folderId: 'my-surveys',
    name: 'Brand tracker — unstructured feedback',
    creationDate: '2026-05-10T10:00:00Z',
    completedResponses: 7,
  },
  {
    id: 88008,
    folderId: 'my-surveys',
    name: 'Website UX diary study',
    creationDate: '2026-05-09T10:00:00Z',
    completedResponses: 15,
  },
  {
    id: 88009,
    folderId: 'my-surveys',
    name: 'Clinical intake narrative responses',
    creationDate: '2026-05-08T10:00:00Z',
    completedResponses: 3,
  },
  {
    id: 88010,
    folderId: 'my-surveys',
    name: 'Event feedback — keynote session',
    creationDate: '2026-05-07T10:00:00Z',
    completedResponses: 0,
  },
  {
    id: 88011,
    folderId: 'my-surveys',
    name: 'This is an exceptionally long survey title used to validate table layout and text wrapping in the create dashboard picker',
    creationDate: '2026-05-06T10:00:00Z',
    completedResponses: 0,
  },
  {
    id: 88012,
    folderId: 'my-surveys',
    name: 'Partner channel pulse — EMEA',
    creationDate: '2026-05-05T10:00:00Z',
    completedResponses: 56,
  },
];

export function getTextAiCreateSurveys(folderId: string): SurveyListItem[] {
  if (folderId === 'my-surveys') {
    return TEXT_AI_CREATE_SURVEYS;
  }
  return getSurveysByFolder(folderId);
}
