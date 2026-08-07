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
  /** @deprecated Prefer probeWhenOptionIds — kept for legacy persisted settings. */
  probeWhenOptionId?: string;
  probeWhenOptionIds?: string[];
  guardrails: string;
  intent: string;
}

export interface DeepDiveFollowUpQuestionConfig extends DeepDiveFollowUpSettings {
  targetSectionId: string;
  targetQuestionId: string;
  probeWhen: DeepDiveProbeWhen;
  probeWhenOptionId?: string;
  probeWhenOptionIds?: string[];
  guardrails: string;
  intent: string;
}

export const DEFAULT_DEEPDIVE_PROBE_WHEN: DeepDiveProbeWhen = 'any-answer';

export const DEFAULT_DEEPDIVE_FOLLOW_UP_SETTINGS: DeepDiveFollowUpSettings = {
  enabled: false,
  maxFollowUp: 3,
  tone: 'neutral',
  probeWhen: DEFAULT_DEEPDIVE_PROBE_WHEN,
  probeWhenOptionIds: [],
  guardrails: '',
  intent: '',
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

export function normalizeDeepDiveProbeWhenOptionIds(
  stored?: Partial<DeepDiveFollowUpSettings>
): string[] {
  if (Array.isArray(stored?.probeWhenOptionIds)) {
    return stored.probeWhenOptionIds.filter(
      (id): id is string => typeof id === 'string' && id.trim().length > 0
    );
  }
  if (typeof stored?.probeWhenOptionId === 'string' && stored.probeWhenOptionId.trim()) {
    return [stored.probeWhenOptionId];
  }
  return [];
}

export function resolveDeepDiveFollowUpSettings(
  stored?: Partial<DeepDiveFollowUpSettings>
): DeepDiveFollowUpSettings {
  const optionIds = normalizeDeepDiveProbeWhenOptionIds(stored);
  const merged: DeepDiveFollowUpSettings = {
    ...DEFAULT_DEEPDIVE_FOLLOW_UP_SETTINGS,
    ...stored,
    probeWhenOptionIds: optionIds,
  };

  merged.maxFollowUp = normalizeDeepDiveMaxFollowUp(merged.maxFollowUp);
  merged.probeWhen =
    optionIds.length > 0
      ? 'specific-option'
      : (merged.probeWhen ?? DEFAULT_DEEPDIVE_PROBE_WHEN);
  if (merged.probeWhen !== 'specific-option') {
    merged.probeWhenOptionIds = [];
  }
  merged.guardrails = merged.guardrails ?? '';
  merged.intent = merged.intent ?? '';
  delete merged.probeWhenOptionId;
  return merged;
}

export function getDeepDiveFollowUpWorkspaceStorageKey(surveyId: number): string {
  // v2 drops legacy Q17 per-question DeepDive toggle storage so old browser
  // keys cannot resurface the attached badge after deploy.
  return `deep-dive-follow-up-settings-v2-${surveyId}`;
}

export function toPreviewDeepDiveSettings(
  settings: DeepDiveFollowUpSettings
): DeepDiveFollowUpSettings | null {
  const resolved = resolveDeepDiveFollowUpSettings(settings);
  return resolved.enabled ? resolved : null;
}

/**
 * Whether DeepDive should fire for the respondent's selected option(s),
 * honoring "Only probe when" (empty selection = any answer).
 */
export function shouldTriggerDeepDiveForSelection(
  settings: DeepDiveFollowUpSettings | null | undefined,
  selectedOptionIds: string[]
): boolean {
  if (!settings?.enabled || selectedOptionIds.length === 0) return false;
  const resolved = resolveDeepDiveFollowUpSettings(settings);
  if (!resolved.enabled) return false;
  if (resolved.probeWhen !== 'specific-option') return true;
  const allowed = resolved.probeWhenOptionIds ?? [];
  if (allowed.length === 0) return true;
  const allowedSet = new Set(allowed);
  return selectedOptionIds.some((id) => allowedSet.has(id));
}
