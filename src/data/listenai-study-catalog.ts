import {
  cloneListenAiStudy,
  MOCK_LISTENAI_STUDIES,
  normalizeListenAiTone,
  type ListenAiStudy,
} from '@/data/mock-listenai-studies';
import {
  defaultListenAiIntroduction,
  defaultListenAiThankYouNote,
} from '@/data/mock-listenai-interview';
import { LISTENAI_RESPONSE_FIELD_TOKEN } from '@/data/mock-listenai-question';

const CATALOG_STORAGE_KEY = 'listenai-studies-catalog-v3';
const CATALOG_UPDATED_EVENT = 'listenai-studies-catalog-updated';

type CatalogListener = (studies: ListenAiStudy[]) => void;

const listeners = new Set<CatalogListener>();

function seedStudies(): ListenAiStudy[] {
  return MOCK_LISTENAI_STUDIES.map((study) => cloneListenAiStudy(study));
}

function notifyCatalogUpdated(studies: ListenAiStudy[]): void {
  for (const listener of listeners) {
    listener(studies);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CATALOG_UPDATED_EVENT));
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function normalizeStoredStudy(raw: unknown): ListenAiStudy | null {
  const record = asRecord(raw);
  if (!record) return null;
  if (typeof record.id !== 'string' || !record.id.trim()) return null;
  if (typeof record.title !== 'string' || !record.title.trim()) return null;

  const title =
    record.id === 'study-12' &&
    (record.title === 'Fast-Food Brand Preference Deep Interview' ||
      record.title === 'Fast-Food Brand Preference')
      ? 'Fast-Food Chain Preference and Return-Visit Drivers Interview Guide'
      : record.title;

  const discussionGuide = Array.isArray(record.discussionGuide)
    ? record.discussionGuide
        .map((item, index) => {
          const question = asRecord(item);
          if (!question || typeof question.text !== 'string') return null;
          return {
            id:
              typeof question.id === 'string' && question.id.trim()
                ? question.id
                : `${record.id}-q-${index + 1}`,
            text: question.text,
            followUpInstructions:
              typeof question.followUpInstructions === 'string'
                ? question.followUpInstructions
                : '',
            required: question.required !== false,
            aiFollowUps: question.aiFollowUps !== false,
            maxFollowUps:
              typeof question.maxFollowUps === 'number' && Number.isFinite(question.maxFollowUps)
                ? Math.min(5, Math.max(1, question.maxFollowUps))
                : 3,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item != null)
    : [];

  return {
    id: record.id,
    title,
    description: typeof record.description === 'string' ? record.description : '',
    interviewType: record.interviewType === 'video' ? 'video' : 'conversation',
    maxFollowUps:
      typeof record.maxFollowUps === 'number' && Number.isFinite(record.maxFollowUps)
        ? Math.min(5, Math.max(1, record.maxFollowUps))
        : typeof discussionGuide[0]?.maxFollowUps === 'number'
          ? discussionGuide[0].maxFollowUps
          : 3,
    tone: normalizeListenAiTone(record.tone),
    primaryLanguage:
      typeof record.primaryLanguage === 'string' && record.primaryLanguage
        ? record.primaryLanguage
        : 'en',
    additionalLanguages: Array.isArray(record.additionalLanguages)
      ? record.additionalLanguages.filter((item): item is string => typeof item === 'string')
      : [],
    objectives: Array.isArray(record.objectives)
      ? record.objectives.filter((item): item is string => typeof item === 'string')
      : [],
    audienceNotes: typeof record.audienceNotes === 'string' ? record.audienceNotes : '',
    introduction: typeof record.introduction === 'string' ? record.introduction : '',
    discussionGuide,
    thankYouNote: typeof record.thankYouNote === 'string' ? record.thankYouNote : '',
    moderatorInstructions: Array.isArray(record.moderatorInstructions)
      ? record.moderatorInstructions.filter((item): item is string => typeof item === 'string')
      : [],
    sourceQuestionId:
      typeof record.sourceQuestionId === 'string' && record.sourceQuestionId.trim()
        ? record.sourceQuestionId
        : undefined,
    sourceQuestionCode:
      typeof record.sourceQuestionCode === 'string' && record.sourceQuestionCode.trim()
        ? record.sourceQuestionCode
        : undefined,
    sourceQuestionText:
      typeof record.sourceQuestionText === 'string' && record.sourceQuestionText.trim()
        ? record.sourceQuestionText
        : undefined,
  };
}

function readStoredCatalog(): ListenAiStudy[] | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(CATALOG_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed
      .map((item) => normalizeStoredStudy(item))
      .filter((item): item is ListenAiStudy => item != null);
  } catch {
    return null;
  }
}

function writeStoredCatalog(studies: ListenAiStudy[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(studies));
  notifyCatalogUpdated(studies);
}

/** Seed studies only — safe for SSR / first client paint. Does not read localStorage. */
export function getSeedListenAiStudies(): ListenAiStudy[] {
  return seedStudies();
}

export function getListenAiStudiesCatalog(): ListenAiStudy[] {
  const stored = readStoredCatalog();
  if (stored && stored.length > 0) return stored;
  const seeded = seedStudies();
  writeStoredCatalog(seeded);
  return seeded;
}

export function subscribeListenAiStudiesCatalog(listener: CatalogListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function refreshListenAiStudiesCatalog(): Promise<ListenAiStudy[]> {
  const studies = getListenAiStudiesCatalog();
  notifyCatalogUpdated(studies);
  return studies;
}

export function findListenAiStudyInCatalog(studyId: string): ListenAiStudy | undefined {
  return getListenAiStudiesCatalog().find((study) => study.id === studyId);
}

export interface CreateListenAiStudyInput {
  title: string;
  goal: string;
  guideQuestions?: string[];
  sourceQuestionId?: string;
  sourceQuestionCode?: string;
  sourceQuestionText?: string;
}

export function createListenAiStudyDraft(input: CreateListenAiStudyInput): ListenAiStudy {
  const title = input.title.trim();
  const goal = input.goal.trim();
  const studyId = `study-local-${Date.now()}`;
  const sourceText = input.sourceQuestionText?.trim() || '';
  const guideQuestions = (input.guideQuestions ?? [])
    .map((text) => text.trim())
    .filter(Boolean);
  const discussionGuide = (guideQuestions.length > 0 ? guideQuestions : sourceText ? [sourceText] : []).map(
    (text, index) => ({
      id: `${studyId}-q-${index + 1}`,
      text,
      followUpInstructions:
        'Ask what specifically led them to that answer, then probe on a recent example.',
      required: true,
      aiFollowUps: true,
      maxFollowUps: 3,
    })
  );

  return {
    id: studyId,
    title,
    description: goal,
    interviewType: 'conversation',
    maxFollowUps: 3,
    tone: 'curious',
    primaryLanguage: 'en',
    additionalLanguages: [],
    objectives: goal ? [goal] : [],
    audienceNotes: '',
    introduction: defaultListenAiIntroduction(goal, sourceText),
    discussionGuide,
    thankYouNote: defaultListenAiThankYouNote(),
    moderatorInstructions: [],
    sourceQuestionId: input.sourceQuestionId,
    sourceQuestionCode: input.sourceQuestionCode,
    sourceQuestionText: sourceText || undefined,
  };
}

export function upsertListenAiStudyInCatalog(study: ListenAiStudy): ListenAiStudy[] {
  const current = getListenAiStudiesCatalog();
  const without = current.filter((item) => item.id !== study.id);
  const next = [cloneListenAiStudy(study), ...without];
  writeStoredCatalog(next);
  return next;
}
