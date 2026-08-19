import type { SurveyQuestion, SurveySection } from '@/data/mock-survey-detail';
import { DEEPDIVE_V2_SURVEY_ID } from '@/data/mock-deepdive-question-settings';
import {
  cloneListenAiStudy,
  getDefaultListenAiStudy,
  getListenAiStudyById,
  LISTENAI_ADD_QUESTION_TYPE_ID,
  LISTENAI_MAX_FOLLOW_UP_LIMIT,
  normalizeListenAiTone,
  type ListenAiStudy,
} from '@/data/mock-listenai-studies';
import { findListenAiStudyInCatalog } from '@/data/listenai-study-catalog';

export { LISTENAI_ADD_QUESTION_TYPE_ID };

export function isListenAiEnabledSurvey(surveyId: number): boolean {
  return surveyId === DEEPDIVE_V2_SURVEY_ID;
}

export const DEFAULT_LISTENAI_QUESTION_TEXT = 'ListenAI';

export const LISTENAI_PLACE_NOT_FIRST_TOAST =
  'ListenAI cannot be the first question on a page';
export const LISTENAI_PLACE_NOT_LAST_TOAST =
  'ListenAI cannot be the last question in the survey';

export interface ListenAiQuestionConfig {
  studyId: string;
  study: ListenAiStudy;
}

export function isListenAiQuestion(question: SurveyQuestion): boolean {
  return (
    question.kind === 'listenai' ||
    question.addQuestionTypeId === LISTENAI_ADD_QUESTION_TYPE_ID ||
    question.listenAiConfig != null ||
    question.id.startsWith('q-listenai-')
  );
}

export function normalizeListenAiMaxFollowUps(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) return 3;
  return Math.min(LISTENAI_MAX_FOLLOW_UP_LIMIT, Math.max(1, parsed));
}

export function isListenAiStudySelected(config: ListenAiQuestionConfig): boolean {
  return Boolean(config.studyId.trim());
}

export interface ListenAiPreviewPayload {
  studyId: string;
  study: ListenAiStudy;
}

export function toListenAiPreviewPayload(question: SurveyQuestion): ListenAiPreviewPayload | null {
  if (!isListenAiQuestion(question)) return null;
  const config = readListenAiConfig(question);
  if (!isListenAiStudySelected(config)) return null;
  return {
    studyId: config.studyId,
    study: cloneListenAiStudy(config.study),
  };
}

function stripRichText(value: string): string {
  return value.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

export const LISTENAI_SOURCE_QUESTION_UNSET_VALUE = '';
export const LISTENAI_SOURCE_QUESTION_PLACEHOLDER = 'Select a question';

export interface ListenAiSourceQuestionOption {
  value: string;
  label: string;
  sectionId: string;
  questionId: string;
  code: string;
  text: string;
}

/** Survey questions that can be selected as the ListenAI DeepDive source. */
export function listListenAiSourceQuestions(
  sections: SurveySection[],
  listenAiQuestionId?: string
): ListenAiSourceQuestionOption[] {
  const options: ListenAiSourceQuestionOption[] = [];
  for (const section of sections) {
    for (const question of section.questions) {
      if (listenAiQuestionId && question.id === listenAiQuestionId) continue;
      if (isListenAiQuestion(question)) continue;
      const text = stripRichText(question.text);
      if (!text) continue;
      options.push({
        value: `${section.id}:${question.id}`,
        label: `${question.code} — ${text}`,
        sectionId: section.id,
        questionId: question.id,
        code: question.code,
        text,
      });
    }
  }
  return options;
}

export const LISTENAI_RESPONSE_FIELD_TOKEN = '{Q18}';

export function getListenAiResponseFieldToken(sourceQuestionCode?: string): string {
  return sourceQuestionCode?.trim() ? `{${sourceQuestionCode.trim()}}` : LISTENAI_RESPONSE_FIELD_TOKEN;
}

export function getListenAiFirstQuestion(study: ListenAiStudy): string {
  return study.discussionGuide[0]?.text ?? '';
}

export function updateListenAiSourceQuestion(
  study: ListenAiStudy,
  option?: ListenAiSourceQuestionOption | null
): ListenAiStudy {
  if (!option) {
    return {
      ...study,
      sourceQuestionId: undefined,
      sourceQuestionCode: undefined,
      sourceQuestionText: undefined,
    };
  }

  return {
    ...study,
    sourceQuestionId: option.questionId,
    sourceQuestionCode: option.code,
    sourceQuestionText: option.text,
  };
}

export function updateListenAiFirstQuestion(
  study: ListenAiStudy,
  text: string
): ListenAiStudy {
  const trimmed = text;
  const first = study.discussionGuide[0];
  const nextFirst = first
    ? { ...first, text: trimmed }
    : {
        id: `${study.id}-q-1`,
        text: trimmed,
        followUpInstructions: '',
        required: true,
        aiFollowUps: true,
        maxFollowUps: 3,
      };

  return {
    ...study,
    discussionGuide: [nextFirst, ...study.discussionGuide.slice(1)],
  };
}

export function appendListenAiResponseField(text: string): string {
  if (text.includes(LISTENAI_RESPONSE_FIELD_TOKEN)) return text;
  const suffix = text.trim().length > 0 ? ' ' : '';
  return `${text}${suffix}${LISTENAI_RESPONSE_FIELD_TOKEN}`;
}

export function resolveListenAiConfig(
  stored?: Partial<ListenAiQuestionConfig> | null
): ListenAiQuestionConfig {
  const studyId = stored?.studyId?.trim() || '';
  const fallback = getDefaultListenAiStudy();
  if (!studyId) {
    return {
      studyId: '',
      study: stored?.study ? cloneListenAiStudy(stored.study) : fallback,
    };
  }

  const fromLiveCatalog = findListenAiStudyInCatalog(studyId);
  const fromSeed = getListenAiStudyById(studyId);
  const fromCatalog = fromLiveCatalog ?? fromSeed;
  const base = stored?.study
    ? cloneListenAiStudy(stored.study)
    : fromCatalog
      ? cloneListenAiStudy(fromCatalog)
      : fallback;

  return {
    studyId,
    study: {
      ...base,
      maxFollowUps: normalizeListenAiMaxFollowUps(base.maxFollowUps),
      tone: normalizeListenAiTone(base.tone),
      discussionGuide: base.discussionGuide.map((question) => ({
        ...question,
        maxFollowUps: normalizeListenAiMaxFollowUps(question.maxFollowUps ?? base.maxFollowUps),
      })),
    },
  };
}

export function readListenAiConfig(question: SurveyQuestion): ListenAiQuestionConfig {
  return resolveListenAiConfig(question.listenAiConfig);
}

export function createListenAiQuestion(
  questionId: string,
  questionNumber: number,
  partial?: Partial<ListenAiQuestionConfig>
): SurveyQuestion {
  const config = resolveListenAiConfig(partial);
  return {
    id: questionId,
    code: `Q${questionNumber}`,
    number: questionNumber,
    text: DEFAULT_LISTENAI_QUESTION_TEXT,
    required: true,
    kind: 'listenai',
    addQuestionTypeId: LISTENAI_ADD_QUESTION_TYPE_ID,
    options: [],
    listenAiConfig: config,
  };
}

export function updateListenAiConfig(
  sections: SurveySection[],
  questionId: string,
  nextConfig: ListenAiQuestionConfig
): SurveySection[] {
  const normalized = resolveListenAiConfig(nextConfig);
  return sections.map((section) => ({
    ...section,
    questions: section.questions.map((question) =>
      question.id === questionId
        ? {
            ...question,
            kind: 'listenai',
            addQuestionTypeId: LISTENAI_ADD_QUESTION_TYPE_ID,
            listenAiConfig: normalized,
          }
        : question
    ),
  }));
}

export function findListenAiQuestion(
  sections: SurveySection[]
): { sectionId: string; question: SurveyQuestion } | null {
  for (const section of sections) {
    for (const question of section.questions) {
      if (isListenAiQuestion(question)) {
        return { sectionId: section.id, question };
      }
    }
  }
  return null;
}

export function findSurveyQuestionAcrossSections(
  sections: SurveySection[],
  questionId: string
): { sectionId: string; question: SurveyQuestion } | null {
  for (const section of sections) {
    const question = section.questions.find((item) => item.id === questionId);
    if (question) return { sectionId: section.id, question };
  }
  return null;
}

function countSurveyQuestions(sections: SurveySection[]): number {
  return sections.reduce((total, section) => total + section.questions.length, 0);
}

function getInsertGlobalIndex(
  sections: SurveySection[],
  sectionId: string,
  insertIndex: number
): number {
  let index = 0;
  for (const section of sections) {
    if (section.id === sectionId) {
      return index + Math.max(0, Math.min(insertIndex, section.questions.length));
    }
    index += section.questions.length;
  }
  return index;
}

export function canAddListenAiAt(
  sections: SurveySection[],
  sectionId: string,
  insertIndex: number
): boolean {
  return getListenAiInsertError(sections, sectionId, insertIndex) == null;
}

export function getListenAiInsertError(
  sections: SurveySection[],
  sectionId: string,
  insertIndex: number
): string | null {
  if (findListenAiQuestion(sections)) {
    return 'ListenAI is already configured for this survey';
  }

  const insertGlobalIndex = getInsertGlobalIndex(sections, sectionId, insertIndex);
  if (insertGlobalIndex === 0) {
    return LISTENAI_PLACE_NOT_FIRST_TOAST;
  }
  if (insertGlobalIndex >= countSurveyQuestions(sections)) {
    return LISTENAI_PLACE_NOT_LAST_TOAST;
  }

  return null;
}

export function migrateDeepDiveQuestionToListenAi(question: SurveyQuestion): SurveyQuestion {
  const isLegacyDeepDive =
    question.kind === 'deep-dive-follow-ups' || question.addQuestionTypeId === 'deepdive';
  const plainText = stripRichText(question.text);
  const looksLikeListenAiTitle =
    plainText === 'ListenAI' ||
    plainText === 'ListenAI interview' ||
    plainText === 'ListenAI Interview';

  if (!isLegacyDeepDive && !isListenAiQuestion(question) && !looksLikeListenAiTitle) {
    return question;
  }

  const config = resolveListenAiConfig(question.listenAiConfig);
  const nextText =
    plainText === 'DeepDive' ||
    plainText === 'DeepDive Follow Ups' ||
    plainText === 'ListenAI interview' ||
    plainText === 'ListenAI Interview'
      ? DEFAULT_LISTENAI_QUESTION_TEXT
      : question.text || DEFAULT_LISTENAI_QUESTION_TEXT;

  return {
    ...question,
    text: nextText,
    kind: 'listenai',
    addQuestionTypeId: LISTENAI_ADD_QUESTION_TYPE_ID,
    editorHidden: false,
    deepDiveFollowUpConfig: undefined,
    listenAiConfig: config,
    options: question.options ?? [],
  };
}

const DEFAULT_LISTENAI_QUESTION_ID = 'q-listenai-18';

/** Guarantees survey 16 has a renderable ListenAI question after persisted editor state loads. */
export function ensureListenAiQuestionInSections(sections: SurveySection[]): SurveySection[] {
  let changed = false;
  const migrated = sections.map((section) => {
    const questions = section.questions.map((question) => {
      const next = migrateDeepDiveQuestionToListenAi(question);
      if (next !== question) changed = true;
      return next;
    });
    return questions === section.questions ? section : { ...section, questions };
  });

  if (findListenAiQuestion(migrated)) {
    return changed ? migrated : sections;
  }

  let converted = false;
  const forced = migrated.map((section) => ({
    ...section,
    questions: section.questions.map((question) => {
      const shouldConvert =
        question.id === DEFAULT_LISTENAI_QUESTION_ID ||
        question.id.startsWith('q-listenai-') ||
        question.id.includes('deepdive-config');
      if (!shouldConvert) return question;
      converted = true;
      return {
        ...createListenAiQuestion(question.id, question.number, question.listenAiConfig),
        code: question.code || `Q${question.number}`,
        text: DEFAULT_LISTENAI_QUESTION_TEXT,
      };
    }),
  }));

  if (converted) return forced;

  return migrated.map((section, sectionIndex) => {
    if (sectionIndex > 0) return section;
    const targetIndex = section.questions.findIndex((question) => question.id === 'q-deepdive-17');
    const insertAt =
      targetIndex >= 0 ? targetIndex + 1 : Math.max(1, section.questions.length - 1);
    const questionNumber = section.questions[insertAt - 1]?.number
      ? section.questions[insertAt - 1].number + 1
      : 18;
    const nextQuestions = [...section.questions];
    nextQuestions.splice(
      insertAt,
      0,
      createListenAiQuestion(DEFAULT_LISTENAI_QUESTION_ID, questionNumber)
    );
    return { ...section, questions: nextQuestions };
  });
}
