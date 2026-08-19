import type { SurveyQuestion, SurveySection } from '@/data/mock-survey-detail';
import {
  DEFAULT_DEEPDIVE_FOLLOW_UP_SETTINGS,
  DEFAULT_DEEPDIVE_PROBE_WHEN,
  DEEPDIVE_TONE_OPTIONS,
  resolveDeepDiveFollowUpSettings,
  toPreviewDeepDiveSettings,
  type DeepDiveFollowUpQuestionConfig,
  type DeepDiveFollowUpSettings,
  type DeepDiveProbeWhen,
  type DeepDiveTone,
} from '@/data/mock-deepdive-question-settings';

export const DEEPDIVE_ADD_QUESTION_TYPE_ID = 'deepdive';
export const DEFAULT_DEEPDIVE_CONFIG_QUESTION_TEXT = 'DeepDive';
const DEEPDIVE_V2_TARGET_QUESTION_ID = 'q-deepdive-17';
const DEEPDIVE_V2_TARGET_QUESTION_CODE = 'Q17';

export interface DeepDiveTargetQuestionOption {
  value: string;
  label: string;
  sectionId: string;
  questionId: string;
}

export function encodeDeepDiveTargetKey(sectionId: string, questionId: string): string {
  return `${sectionId}:${questionId}`;
}

export function isDeepDiveFollowUpConfigQuestion(question: SurveyQuestion): boolean {
  return (
    question.kind === 'deep-dive-follow-ups' ||
    question.addQuestionTypeId === DEEPDIVE_ADD_QUESTION_TYPE_ID
  );
}

/**
 * DeepDive can only attach to Single Select questions (not Multi Select / other types).
 */
export function isDeepDiveEligibleTargetQuestion(question: SurveyQuestion): boolean {
  if (isDeepDiveFollowUpConfigQuestion(question)) return false;
  if (question.editorHidden) return false;
  if (question.options.length === 0) return false;

  if (question.addQuestionTypeId === 'select-one') return true;

  if (question.inputKind !== 'radio') return false;
  if (question.kind && question.kind !== 'standard') return false;
  if (question.addQuestionTypeId && question.addQuestionTypeId !== 'select-one') {
    return false;
  }

  return true;
}

export interface DeepDiveProbeWhenOption {
  value: string;
  label: string;
  probeWhen: DeepDiveProbeWhen;
  optionId?: string;
}

function stripRichText(value: string): string {
  return value.replace(/<[^>]+>/g, '').trim();
}

export const DEEPDIVE_TARGET_QUESTION_PLACEHOLDER = 'Select Question';
export const DEEPDIVE_TARGET_QUESTION_UNSET_VALUE = '__deepdive-target-unset__';
export const DEEPDIVE_TARGET_MUST_BE_ABOVE_HELPER =
  'Only Single Select questions above this DeepDive block can be selected.';
export const DEEPDIVE_PLACE_BELOW_TARGET_TOAST =
  'Place DeepDive below a Single Select question';

export const DEEPDIVE_TARGET_QUESTION_DEFAULT_OPTION: DeepDiveTargetQuestionOption = {
  value: DEEPDIVE_TARGET_QUESTION_UNSET_VALUE,
  label: DEEPDIVE_TARGET_QUESTION_PLACEHOLDER,
  sectionId: '',
  questionId: '',
};

export interface SurveyQuestionRef {
  sectionId: string;
  question: SurveyQuestion;
}

/** Flatten survey questions in display order (section order, then question order). */
export function flattenSurveyQuestionRefs(sections: SurveySection[]): SurveyQuestionRef[] {
  const refs: SurveyQuestionRef[] = [];
  for (const section of sections) {
    for (const question of section.questions) {
      refs.push({ sectionId: section.id, question });
    }
  }
  return refs;
}

export function findSurveyQuestionGlobalIndex(
  sections: SurveySection[],
  sectionId: string,
  questionId: string
): number {
  return flattenSurveyQuestionRefs(sections).findIndex(
    (item) => item.sectionId === sectionId && item.question.id === questionId
  );
}

/** Global index where a new question would land at `insertIndex` within `sectionId`. */
export function getSurveyInsertGlobalIndex(
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

function toDeepDiveTargetOption(
  sectionId: string,
  question: SurveyQuestion
): DeepDiveTargetQuestionOption {
  return {
    value: encodeDeepDiveTargetKey(sectionId, question.id),
    label: `${question.code} — ${stripRichText(question.text)}`,
    sectionId,
    questionId: question.id,
  };
}

/**
 * Eligible Single Select targets that appear strictly before a survey position.
 * DeepDive must always sit below its target question.
 */
export function listDeepDiveTargetQuestionOptionsBeforeIndex(
  sections: SurveySection[],
  beforeGlobalIndex: number
): DeepDiveTargetQuestionOption[] {
  const options: DeepDiveTargetQuestionOption[] = [];
  const refs = flattenSurveyQuestionRefs(sections);

  for (let i = 0; i < refs.length; i++) {
    if (i >= beforeGlobalIndex) break;
    const { sectionId, question } = refs[i];
    if (!isDeepDiveEligibleTargetQuestion(question)) continue;
    options.push(toDeepDiveTargetOption(sectionId, question));
  }

  return options;
}

/**
 * Target options for an existing DeepDive block: only questions above it.
 * If DeepDive position is unknown, falls back to all eligible Single Select questions.
 */
export function listDeepDiveTargetQuestionOptions(
  sections: SurveySection[],
  deepDiveSectionId?: string,
  deepDiveQuestionId?: string
): DeepDiveTargetQuestionOption[] {
  if (deepDiveSectionId && deepDiveQuestionId) {
    const deepDiveIndex = findSurveyQuestionGlobalIndex(
      sections,
      deepDiveSectionId,
      deepDiveQuestionId
    );
    if (deepDiveIndex >= 0) {
      return listDeepDiveTargetQuestionOptionsBeforeIndex(sections, deepDiveIndex);
    }
  }

  return listDeepDiveTargetQuestionOptionsBeforeIndex(
    sections,
    flattenSurveyQuestionRefs(sections).length
  );
}

/** True when the survey has at least one Single Select question DeepDive can target. */
export function surveyHasDeepDiveEligibleTarget(sections: SurveySection[]): boolean {
  return listDeepDiveTargetQuestionOptions(sections).length > 0;
}

/** True when DeepDive can be inserted at this slot (at least one eligible target above it). */
export function canAddDeepDiveAt(
  sections: SurveySection[],
  sectionId: string,
  insertIndex: number
): boolean {
  if (findDeepDiveFollowUpConfigQuestion(sections)) return false;
  const insertGlobalIndex = getSurveyInsertGlobalIndex(sections, sectionId, insertIndex);
  return listDeepDiveTargetQuestionOptionsBeforeIndex(sections, insertGlobalIndex).length > 0;
}

/**
 * Moves the DeepDive block to sit immediately after the selected target question.
 * Keeps DeepDive below its target in survey order.
 */
export function placeDeepDiveImmediatelyAfterTarget(
  sections: SurveySection[],
  targetSectionId: string,
  targetQuestionId: string
): SurveySection[] {
  const configEntry = findDeepDiveFollowUpConfigQuestion(sections);
  if (!configEntry) return sections;

  const targetSection = sections.find((section) => section.id === targetSectionId);
  const targetIndex = targetSection?.questions.findIndex((q) => q.id === targetQuestionId) ?? -1;
  if (!targetSection || targetIndex < 0) return sections;

  const deepDiveQuestion = configEntry.question;
  const deepDiveSectionId = configEntry.sectionId;

  const alreadyImmediateAfter =
    deepDiveSectionId === targetSectionId &&
    targetSection.questions[targetIndex + 1]?.id === deepDiveQuestion.id;
  if (alreadyImmediateAfter) return sections;

  const withoutDeepDive = sections.map((section) => {
    if (section.id !== deepDiveSectionId) return section;
    return {
      ...section,
      questions: section.questions.filter((question) => question.id !== deepDiveQuestion.id),
    };
  });

  return withoutDeepDive.map((section) => {
    if (section.id !== targetSectionId) return section;
    const insertAt =
      section.questions.findIndex((question) => question.id === targetQuestionId) + 1;
    if (insertAt <= 0) return section;
    const nextQuestions = [...section.questions];
    nextQuestions.splice(insertAt, 0, deepDiveQuestion);
    return { ...section, questions: nextQuestions };
  });
}

export function findDeepDiveFollowUpConfigQuestion(
  sections: SurveySection[]
): { sectionId: string; question: SurveyQuestion } | null {
  for (const section of sections) {
    for (const question of section.questions) {
      if (isDeepDiveFollowUpConfigQuestion(question)) {
        return { sectionId: section.id, question };
      }
    }
  }
  return null;
}

export function readDeepDiveFollowUpQuestionConfig(
  question: SurveyQuestion
): DeepDiveFollowUpQuestionConfig | null {
  if (!question.deepDiveFollowUpConfig) return null;
  const { targetSectionId, targetQuestionId, ...settings } = question.deepDiveFollowUpConfig;
  const resolved = resolveDeepDiveFollowUpSettings(settings);
  return {
    targetSectionId,
    targetQuestionId,
    ...resolved,
  };
}

export function getDeepDiveTargetQuestionLabel(
  sections: SurveySection[],
  config: DeepDiveFollowUpQuestionConfig
): string {
  const target = findSurveyQuestionById(
    sections,
    config.targetSectionId,
    config.targetQuestionId
  );
  if (!target) return 'Select a question';
  return `${target.code} — ${stripRichText(target.text)}`;
}

export function getDeepDiveTargetQuestionCode(
  sections: SurveySection[],
  config: DeepDiveFollowUpQuestionConfig
): string {
  const target = findSurveyQuestionById(
    sections,
    config.targetSectionId,
    config.targetQuestionId
  );
  return target?.code ?? 'Q?';
}

export function getDeepDiveTargetQuestionPlainText(
  sections: SurveySection[],
  config: DeepDiveFollowUpQuestionConfig
): string {
  const target = findSurveyQuestionById(
    sections,
    config.targetSectionId,
    config.targetQuestionId
  );
  if (!target) return 'this question';
  return stripRichText(target.text) || target.code;
}

export function buildDeepDiveProbeWhenOptions(
  sections: SurveySection[],
  targetSectionId: string,
  targetQuestionId: string
): DeepDiveProbeWhenOption[] {
  const target = findSurveyQuestionById(sections, targetSectionId, targetQuestionId);
  if (!target) return [];

  return target.options.map((option) => {
    const label = stripRichText(option.label) || 'Option';
    return {
      value: option.id,
      label: `Respondent selects "${label}"`,
      probeWhen: 'specific-option' as const,
      optionId: option.id,
    };
  });
}

export function resolveDeepDiveProbeWhenSelection(
  config: DeepDiveFollowUpQuestionConfig
): DeepDiveProbeWhenOption[] {
  const optionIds = config.probeWhenOptionIds ?? [];
  if (config.probeWhen !== 'specific-option' || optionIds.length === 0) {
    return [];
  }

  return optionIds.map((optionId) => ({
    value: optionId,
    label: '',
    probeWhen: 'specific-option' as const,
    optionId,
  }));
}

export function isDeepDiveTargetSelected(
  config: Pick<DeepDiveFollowUpQuestionConfig, 'targetSectionId' | 'targetQuestionId'>
): boolean {
  return Boolean(config.targetSectionId && config.targetQuestionId);
}

export function hasDeepDiveAttachedToQuestion(
  sections: SurveySection[],
  sectionId: string,
  questionId: string
): boolean {
  const configEntry = findDeepDiveFollowUpConfigQuestion(sections);
  if (!configEntry) return false;

  const config = readDeepDiveFollowUpQuestionConfig(configEntry.question);
  if (!config?.enabled || !isDeepDiveTargetSelected(config)) return false;

  return (
    config.targetSectionId === sectionId && config.targetQuestionId === questionId
  );
}

export function getDeepDiveToneLabel(tone: DeepDiveTone): string {
  return DEEPDIVE_TONE_OPTIONS.find((option) => option.value === tone)?.label ?? tone;
}

export function createDeepDiveFollowUpConfigQuestion(
  questionId: string,
  targetSectionId: string,
  targetQuestionId: string,
  questionNumber: number,
  partial?: Partial<DeepDiveFollowUpQuestionConfig>
): SurveyQuestion {
  const resolved = resolveDeepDiveFollowUpSettings({
    ...DEFAULT_DEEPDIVE_FOLLOW_UP_SETTINGS,
    enabled: true,
    ...partial,
  });

  return {
    id: questionId,
    code: `Q${questionNumber}`,
    number: questionNumber,
    text: DEFAULT_DEEPDIVE_CONFIG_QUESTION_TEXT,
    required: false,
    kind: 'deep-dive-follow-ups',
    addQuestionTypeId: DEEPDIVE_ADD_QUESTION_TYPE_ID,
    editorHidden: true,
    options: [],
    deepDiveFollowUpConfig: {
      targetSectionId,
      targetQuestionId,
      enabled: resolved.enabled,
      maxFollowUp: resolved.maxFollowUp,
      tone: resolved.tone,
      probeWhen: partial?.probeWhen ?? resolved.probeWhen ?? DEFAULT_DEEPDIVE_PROBE_WHEN,
      probeWhenOptionIds: partial?.probeWhenOptionIds ?? resolved.probeWhenOptionIds ?? [],
      guardrails: partial?.guardrails ?? resolved.guardrails ?? '',
      intent: partial?.intent ?? resolved.intent ?? '',
    },
  };
}

export function pickDefaultDeepDiveTarget(
  sections: SurveySection[],
  sectionId: string,
  insertIndex: number
): { sectionId: string; questionId: string } | null {
  const insertGlobalIndex = getSurveyInsertGlobalIndex(sections, sectionId, insertIndex);
  const before = listDeepDiveTargetQuestionOptionsBeforeIndex(sections, insertGlobalIndex);
  const preferred = before[before.length - 1];
  if (!preferred) return null;
  return { sectionId: preferred.sectionId, questionId: preferred.questionId };
}

export function getDeepDiveFollowUpSettingsForTarget(
  sections: SurveySection[],
  targetSectionId: string,
  targetQuestionId: string
): DeepDiveFollowUpSettings | null {
  const configEntry = findDeepDiveFollowUpConfigQuestion(sections);
  if (!configEntry) return null;

  const config = readDeepDiveFollowUpQuestionConfig(configEntry.question);
  if (!config || !isDeepDiveTargetSelected(config)) return null;
  if (
    config.targetSectionId !== targetSectionId ||
    config.targetQuestionId !== targetQuestionId
  ) {
    return null;
  }

  return toPreviewDeepDiveSettings(config);
}

export function findSurveyQuestionById(
  sections: SurveySection[],
  sectionId: string,
  questionId: string
): SurveyQuestion | null {
  const section = sections.find((item) => item.id === sectionId);
  return section?.questions.find((question) => question.id === questionId) ?? null;
}

export function updateDeepDiveFollowUpConfigQuestion(
  sections: SurveySection[],
  nextConfig: DeepDiveFollowUpQuestionConfig
): SurveySection[] {
  const normalized: DeepDiveFollowUpQuestionConfig = {
    ...resolveDeepDiveFollowUpSettings(nextConfig),
    targetSectionId: nextConfig.targetSectionId,
    targetQuestionId: nextConfig.targetQuestionId,
    probeWhen: nextConfig.probeWhen ?? DEFAULT_DEEPDIVE_PROBE_WHEN,
    probeWhenOptionIds: nextConfig.probeWhenOptionIds ?? [],
    guardrails: nextConfig.guardrails ?? '',
    intent: nextConfig.intent ?? '',
  };

  return sections.map((section) => ({
    ...section,
    questions: section.questions.map((question) =>
      isDeepDiveFollowUpConfigQuestion(question)
        ? {
            ...question,
            deepDiveFollowUpConfig: normalized,
          }
        : question
    ),
  }));
}

export function nextVisibleQuestionNumber(sections: SurveySection[]): number {
  let max = 0;
  for (const section of sections) {
    for (const question of section.questions) {
      if (isDeepDiveFollowUpConfigQuestion(question)) continue;
      max = Math.max(max, question.number);
    }
  }
  return max + 1;
}

function normalizeDeepDiveConfigQuestion(question: SurveyQuestion): SurveyQuestion {
  if (!isDeepDiveFollowUpConfigQuestion(question) || !question.deepDiveFollowUpConfig) {
    return question;
  }

  const legacyTitle = stripRichText(question.text);
  const nextText =
    legacyTitle === 'DeepDive Follow Ups' ? DEFAULT_DEEPDIVE_CONFIG_QUESTION_TEXT : question.text;
  const config = readDeepDiveFollowUpQuestionConfig(question);
  if (!config) return question;

  const nextConfig: DeepDiveFollowUpQuestionConfig = {
    ...config,
    probeWhen: config.probeWhen ?? DEFAULT_DEEPDIVE_PROBE_WHEN,
    probeWhenOptionIds: config.probeWhenOptionIds ?? [],
    guardrails: config.guardrails ?? '',
    intent: config.intent ?? '',
  };

  const textChanged = nextText !== question.text;
  const configChanged =
    nextConfig.probeWhen !== question.deepDiveFollowUpConfig.probeWhen ||
    JSON.stringify(question.deepDiveFollowUpConfig.probeWhenOptionIds ?? []) !==
      JSON.stringify(nextConfig.probeWhenOptionIds) ||
    (question.deepDiveFollowUpConfig.guardrails ?? '') !== nextConfig.guardrails ||
    (question.deepDiveFollowUpConfig.intent ?? '') !== nextConfig.intent;

  if (!textChanged && !configChanged) return question;

  return {
    ...question,
    text: nextText,
    deepDiveFollowUpConfig: nextConfig,
  };
}

function normalizeDeepDiveV2TargetQuestion(question: SurveyQuestion): SurveyQuestion {
  const isDeepDiveV2Target =
    question.id === DEEPDIVE_V2_TARGET_QUESTION_ID ||
    question.code.trim().toUpperCase() === DEEPDIVE_V2_TARGET_QUESTION_CODE;
  if (!isDeepDiveV2Target) return question;

  const nextQuestion: SurveyQuestion = {
    ...question,
    inputKind: 'radio',
    addQuestionTypeId: 'select-one',
  };

  if (
    nextQuestion.inputKind === question.inputKind &&
    nextQuestion.addQuestionTypeId === question.addQuestionTypeId
  ) {
    return question;
  }

  return nextQuestion;
}

/** Applies DeepDive copy and config defaults to persisted workspace sections. */
export function normalizeSurveyEditorSections(sections: SurveySection[]): SurveySection[] {
  let changed = false;
  let nextSections = sections.map((section) => {
    const nextQuestions = section.questions.map((question) => {
      let nextQuestion = normalizeDeepDiveConfigQuestion(question);
      nextQuestion = normalizeDeepDiveV2TargetQuestion(nextQuestion);
      if (nextQuestion !== question) changed = true;
      return nextQuestion;
    });

    if (nextQuestions.some((question, index) => question !== section.questions[index])) {
      changed = true;
      return { ...section, questions: nextQuestions };
    }

    return section;
  });

  const configEntry = findDeepDiveFollowUpConfigQuestion(nextSections);
  if (configEntry) {
    const config = readDeepDiveFollowUpQuestionConfig(configEntry.question);
    if (config && isDeepDiveTargetSelected(config)) {
      const reordered = placeDeepDiveImmediatelyAfterTarget(
        nextSections,
        config.targetSectionId,
        config.targetQuestionId
      );
      if (reordered !== nextSections) {
        changed = true;
        nextSections = reordered;
      }
    }
  }

  return changed ? nextSections : sections;
}

/** One-time migration for editor saves created before DeepDive UX updates. */
export function migrateLegacyDeepDiveSurveySections(sections: SurveySection[]): SurveySection[] {
  return normalizeSurveyEditorSections(
    sections.map((section) => ({
      ...section,
      questions: section.questions.map((question) => {
        if (!isDeepDiveFollowUpConfigQuestion(question) || !question.deepDiveFollowUpConfig) {
          return question;
        }

        return normalizeDeepDiveConfigQuestion({
          ...question,
          text: DEFAULT_DEEPDIVE_CONFIG_QUESTION_TEXT,
          deepDiveFollowUpConfig: {
            ...question.deepDiveFollowUpConfig,
            targetSectionId: '',
            targetQuestionId: '',
            probeWhen:
              question.deepDiveFollowUpConfig.probeWhen ?? DEFAULT_DEEPDIVE_PROBE_WHEN,
            probeWhenOptionIds: question.deepDiveFollowUpConfig.probeWhenOptionIds ?? [],
            guardrails: question.deepDiveFollowUpConfig.guardrails ?? '',
            intent: question.deepDiveFollowUpConfig.intent ?? '',
          },
        });
      }),
    }))
  );
}
