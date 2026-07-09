import type { SurveyQuestion, SurveySection } from '@/data/mock-survey-detail';
import {
  DEEPDIVE_FOLLOW_UP_QUESTION_NUMBER,
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

const DEEPDIVE_V2_SECTION_ID = 'section-deepdive-v2';
const DEEPDIVE_V2_TARGET_QUESTION_ID = 'q-deepdive-17';

export const DEEPDIVE_ADD_QUESTION_TYPE_ID = 'deepdive';
export const DEFAULT_DEEPDIVE_CONFIG_QUESTION_TEXT = 'DeepDive';

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

export function isDeepDiveEligibleTargetQuestion(question: SurveyQuestion): boolean {
  if (isDeepDiveFollowUpConfigQuestion(question)) return false;
  if (question.editorHidden) return false;
  if (question.options.length === 0) return false;

  return (
    question.inputKind === 'radio' ||
    question.inputKind === 'checkbox' ||
    question.addQuestionTypeId === 'select-one' ||
    question.addQuestionTypeId === 'select-many'
  );
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

export const DEEPDIVE_TARGET_QUESTION_DEFAULT_OPTION: DeepDiveTargetQuestionOption = {
  value: DEEPDIVE_TARGET_QUESTION_UNSET_VALUE,
  label: DEEPDIVE_TARGET_QUESTION_PLACEHOLDER,
  sectionId: '',
  questionId: '',
};

export function listDeepDiveTargetQuestionOptions(
  sections: SurveySection[]
): DeepDiveTargetQuestionOption[] {
  const options: DeepDiveTargetQuestionOption[] = [];

  for (const section of sections) {
    for (const question of section.questions) {
      if (!isDeepDiveEligibleTargetQuestion(question)) continue;
      options.push({
        value: encodeDeepDiveTargetKey(section.id, question.id),
        label: `${question.code} — ${stripRichText(question.text)}`,
        sectionId: section.id,
        questionId: question.id,
      });
    }
  }

  return options;
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
  const match = listDeepDiveTargetQuestionOptions(sections).find(
    (option) =>
      option.sectionId === config.targetSectionId &&
      option.questionId === config.targetQuestionId
  );
  return match?.label ?? 'Select a question';
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
  const options: DeepDiveProbeWhenOption[] = [
    { value: 'any-answer', label: 'Any answer', probeWhen: 'any-answer' },
  ];

  if (!target) return options;

  for (const option of target.options) {
    const label = stripRichText(option.label) || 'Option';
    options.push({
      value: `option:${option.id}`,
      label: `Respondent selects "${label}"`,
      probeWhen: 'specific-option',
      optionId: option.id,
    });
  }

  return options;
}

export function resolveDeepDiveProbeWhenSelection(
  config: DeepDiveFollowUpQuestionConfig
): DeepDiveProbeWhenOption | null {
  if (config.probeWhen === 'specific-option' && config.probeWhenOptionId) {
    return {
      value: `option:${config.probeWhenOptionId}`,
      label: '',
      probeWhen: 'specific-option',
      optionId: config.probeWhenOptionId,
    };
  }
  return { value: 'any-answer', label: 'Any answer', probeWhen: 'any-answer' };
}

export function isDeepDiveTargetSelected(
  config: Pick<DeepDiveFollowUpQuestionConfig, 'targetSectionId' | 'targetQuestionId'>
): boolean {
  return Boolean(config.targetSectionId && config.targetQuestionId);
}

export function hasDeepDiveAttachedToQuestion(
  sections: SurveySection[],
  sectionId: string,
  questionId: string,
  perQuestionSettingsByKey: Record<string, Partial<DeepDiveFollowUpSettings>> = {}
): boolean {
  const questionKey = encodeDeepDiveTargetKey(sectionId, questionId);

  if (perQuestionSettingsByKey[questionKey] !== undefined) {
    return resolveDeepDiveFollowUpSettings(perQuestionSettingsByKey[questionKey]).enabled;
  }

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
      probeWhenOptionId: partial?.probeWhenOptionId,
      guardrails: partial?.guardrails ?? resolved.guardrails ?? '',
    },
  };
}

export function pickDefaultDeepDiveTarget(
  sections: SurveySection[],
  sectionId: string,
  insertIndex: number
): { sectionId: string; questionId: string } | null {
  const section = sections.find((item) => item.id === sectionId);
  if (section) {
    const before = section.questions
      .slice(0, insertIndex)
      .filter(isDeepDiveEligibleTargetQuestion);
    const after = section.questions.slice(insertIndex).filter(isDeepDiveEligibleTargetQuestion);
    const preferred = before[before.length - 1] ?? after[0];
    if (preferred) {
      return { sectionId: section.id, questionId: preferred.id };
    }
  }

  const first = listDeepDiveTargetQuestionOptions(sections)[0];
  if (!first) return null;
  return { sectionId: first.sectionId, questionId: first.questionId };
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
    probeWhenOptionId: nextConfig.probeWhenOptionId,
    guardrails: nextConfig.guardrails ?? '',
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
    guardrails: config.guardrails ?? '',
  };

  const textChanged = nextText !== question.text;
  const configChanged =
    nextConfig.probeWhen !== question.deepDiveFollowUpConfig.probeWhen ||
    (question.deepDiveFollowUpConfig.guardrails ?? '') !== nextConfig.guardrails;

  if (!textChanged && !configChanged) return question;

  return {
    ...question,
    text: nextText,
    deepDiveFollowUpConfig: nextConfig,
  };
}

function isDeepDiveV2TargetQuestion(question: SurveyQuestion): boolean {
  return (
    question.id === DEEPDIVE_V2_TARGET_QUESTION_ID ||
    question.code.trim().toUpperCase() === `Q${DEEPDIVE_FOLLOW_UP_QUESTION_NUMBER}`
  );
}

/** Keeps Q18 (config) and Q17 (target) at the top of the DeepDive V2 workspace block. */
function reorderDeepDiveV2QuestionsAtTop(section: SurveySection): SurveySection {
  if (section.id !== DEEPDIVE_V2_SECTION_ID) return section;

  const configQuestion = section.questions.find(isDeepDiveFollowUpConfigQuestion);
  const targetQuestion = section.questions.find(isDeepDiveV2TargetQuestion);

  if (!configQuestion && !targetQuestion) return section;

  const rest = section.questions.filter(
    (question) => question !== configQuestion && question !== targetQuestion
  );
  const ordered: SurveyQuestion[] = [];
  if (configQuestion) ordered.push(configQuestion);
  if (targetQuestion) ordered.push(targetQuestion);

  const nextQuestions = [...ordered, ...rest];
  const sameOrder = nextQuestions.every(
    (question, index) => question === section.questions[index]
  );

  return sameOrder ? section : { ...section, questions: nextQuestions };
}

/** Applies DeepDive copy and config defaults to persisted workspace sections. */
export function normalizeSurveyEditorSections(sections: SurveySection[]): SurveySection[] {
  let changed = false;
  const nextSections = sections.map((section) => {
    const nextQuestions = section.questions.map((question) => {
      const nextQuestion = normalizeDeepDiveConfigQuestion(question);
      if (nextQuestion !== question) changed = true;
      return nextQuestion;
    });

    let nextSection = nextQuestions.some(
      (question, index) => question !== section.questions[index]
    )
      ? { ...section, questions: nextQuestions }
      : section;

    const reordered = reorderDeepDiveV2QuestionsAtTop(nextSection);
    if (reordered !== nextSection) {
      changed = true;
      nextSection = reordered;
    }

    return nextSection;
  });

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
            guardrails: question.deepDiveFollowUpConfig.guardrails ?? '',
          },
        });
      }),
    }))
  );
}
