import type { SurveySection } from '@/data/mock-survey-detail';
import {
  DEEPDIVE_MAX_FOLLOW_UP_LIMIT,
  normalizeDeepDiveMaxFollowUp,
  type DeepDiveFollowUpQuestionConfig,
  type DeepDiveTone,
} from '@/data/mock-deepdive-question-settings';
import { findSurveyQuestionById } from '@/data/mock-deepdive-follow-up-question';

export interface DeepDiveFollowUpReply {
  question: string;
  answer: string;
}

const TONE_PREFIX: Record<DeepDiveTone, string> = {
  neutral: '',
  friendly: 'Just curious — ',
  professional: 'To help us understand better, ',
  empathetic: 'We appreciate you sharing — ',
  curious: 'Tell us more: ',
};

const FOLLOW_UP_TEMPLATES = [
  (label: string) => `What specifically appeals to you about ${label}?`,
  (label: string) => `How often do you choose ${label} compared to other options?`,
  (label: string) => `What would make your experience with ${label} even better?`,
  (label: string) => `Can you describe a recent time you picked ${label}?`,
  (label: string) => `What is the main reason you prefer ${label}?`,
];

function applyTone(question: string, tone: DeepDiveTone): string {
  const prefix = TONE_PREFIX[tone];
  if (!prefix) return question;
  const lower = question.charAt(0).toLowerCase() + question.slice(1);
  return `${prefix}${lower}`;
}

function hashLabel(label: string): number {
  let hash = 0;
  for (let index = 0; index < label.length; index += 1) {
    hash = (hash * 31 + label.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

/** Mock AI follow-up generation — returns exactly maxCount questions (workspace setting). */
export function generateDeepDiveFollowUps(
  selectedLabel: string,
  tone: DeepDiveTone,
  maxCount: number
): string[] {
  const count = normalizeDeepDiveMaxFollowUp(maxCount);
  const shuffled = [...FOLLOW_UP_TEMPLATES]
    .map((template, index) => ({ template, index }))
    .sort(
      (left, right) =>
        hashLabel(`${selectedLabel}:${left.index}`) - hashLabel(`${selectedLabel}:${right.index}`)
    )
    .map(({ template }) => template);

  return Array.from({ length: count }, (_, index) => {
    const template = shuffled[index % shuffled.length];
    return applyTone(template(selectedLabel), tone);
  });
}

export function deepDiveFollowUpSettingsSignature(
  settings: { enabled: boolean; maxFollowUp: number; tone: DeepDiveTone } | null | undefined
): string {
  if (!settings?.enabled) return 'disabled';
  return `${settings.maxFollowUp}:${settings.tone}`;
}

export function isValidDeepDiveMaxFollowUp(value: number): boolean {
  return Number.isFinite(value) && value >= 1 && value <= DEEPDIVE_MAX_FOLLOW_UP_LIMIT;
}

export function formatDeepDiveReplyCount(count: number): string {
  return count === 1 ? '1 reply' : `${count} replies`;
}

export function formatDeepDiveProgressStep(current: number, total: number): string {
  return `${current}/${total}`;
}

export interface DeepDiveSettingsPreview {
  triggerContext: string;
  targetQuestionText: string;
  sampleFollowUps: string[];
}

function stripRichText(value: string): string {
  return value.replace(/<[^>]+>/g, '').trim();
}

/** Mock live-preview samples for the DeepDive settings panel. */
export function buildDeepDiveSettingsPreview(
  sections: SurveySection[],
  config: DeepDiveFollowUpQuestionConfig,
  regenerateSeed = 0
): DeepDiveSettingsPreview {
  const target = findSurveyQuestionById(
    sections,
    config.targetSectionId,
    config.targetQuestionId
  );
  const targetQuestionText = target
    ? stripRichText(target.text) || 'Untitled question'
    : 'Select a target question';

  let triggerContext = 'For any answer';
  let sampleLabel = 'this option';

  if (
    config.probeWhen === 'specific-option' &&
    config.probeWhenOptionId &&
    target
  ) {
    const option = target.options.find((item) => item.id === config.probeWhenOptionId);
    const optionLabel = option ? stripRichText(option.label) : 'Other';
    triggerContext = `If respondent selects '${optionLabel}'`;
    sampleLabel = optionLabel;
  } else if (target?.options[0]) {
    sampleLabel = stripRichText(target.options[0].label) || 'this option';
  }

  const generated = generateDeepDiveFollowUps(
    `${sampleLabel}:${regenerateSeed}`,
    config.tone,
    Math.max(2, config.maxFollowUp)
  );

  return {
    triggerContext,
    targetQuestionText,
    sampleFollowUps: generated.slice(0, 2),
  };
}
