export const DEEPDIVE_V2_SURVEY_ID = 16;
export const DEEPDIVE_FOLLOW_UP_QUESTION_NUMBER = 17;
export const DEEPDIVE_MAX_FOLLOW_UP_LIMIT = 5;

export type DeepDiveTone =
  | 'neutral'
  | 'friendly'
  | 'professional'
  | 'empathetic'
  | 'curious';

export type DeepDiveProbeWhen = 'any-answer' | 'specific-option';

export interface DeepDiveFollowUpSettings {
  enabled: boolean;
  maxFollowUp: number;
  tone: DeepDiveTone;
  probeWhen: DeepDiveProbeWhen;
  probeWhenOptionId?: string;
  guardrails: string;
}

export interface DeepDiveFollowUpQuestionConfig extends DeepDiveFollowUpSettings {
  targetSectionId: string;
  targetQuestionId: string;
  probeWhen: DeepDiveProbeWhen;
  probeWhenOptionId?: string;
  guardrails: string;
}

export const DEFAULT_DEEPDIVE_PROBE_WHEN: DeepDiveProbeWhen = 'any-answer';

export const DEFAULT_DEEPDIVE_FOLLOW_UP_SETTINGS: DeepDiveFollowUpSettings = {
  enabled: false,
  maxFollowUp: 3,
  tone: 'neutral',
  probeWhen: DEFAULT_DEEPDIVE_PROBE_WHEN,
  guardrails: '',
};

export const DEEPDIVE_TONE_OPTIONS: { value: DeepDiveTone; label: string }[] = [
  { value: 'neutral', label: 'Neutral' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'professional', label: 'Professional' },
  { value: 'empathetic', label: 'Empathetic' },
  { value: 'curious', label: 'Curious' },
];

export function buildDeepDiveMaxFollowUpOptions(): { value: number; label: string }[] {
  return Array.from({ length: DEEPDIVE_MAX_FOLLOW_UP_LIMIT }, (_, index) => {
    const value = index + 1;
    return { value, label: String(value) };
  });
}

export function normalizeDeepDiveMaxFollowUp(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) return DEFAULT_DEEPDIVE_FOLLOW_UP_SETTINGS.maxFollowUp;
  return Math.min(DEEPDIVE_MAX_FOLLOW_UP_LIMIT, Math.max(1, parsed));
}

export function resolveDeepDiveFollowUpSettings(
  stored?: Partial<DeepDiveFollowUpSettings>
): DeepDiveFollowUpSettings {
  const merged: DeepDiveFollowUpSettings = {
    ...DEFAULT_DEEPDIVE_FOLLOW_UP_SETTINGS,
    ...stored,
  };

  merged.maxFollowUp = normalizeDeepDiveMaxFollowUp(merged.maxFollowUp);
  merged.probeWhen = merged.probeWhen ?? DEFAULT_DEEPDIVE_PROBE_WHEN;
  merged.guardrails = merged.guardrails ?? '';
  return merged;
}

export function getDeepDiveFollowUpWorkspaceStorageKey(surveyId: number): string {
  return `deep-dive-follow-up-settings-${surveyId}`;
}

export function toPreviewDeepDiveSettings(
  settings: DeepDiveFollowUpSettings
): DeepDiveFollowUpSettings | null {
  const resolved = resolveDeepDiveFollowUpSettings(settings);
  return resolved.enabled ? resolved : null;
}
