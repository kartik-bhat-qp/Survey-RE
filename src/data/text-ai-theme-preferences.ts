export type TextAiEmergingValidityDays = 7 | 14 | 30;

export interface TextAiEmergingValidityOption {
  label: string;
  value: TextAiEmergingValidityDays;
}

export const TEXT_AI_EMERGING_VALIDITY_OPTIONS: TextAiEmergingValidityOption[] = [
  { label: 'One week', value: 7 },
  { label: 'Two weeks', value: 14 },
  { label: 'One month', value: 30 },
];

export interface TextAiThemePreferences {
  approvedEmergingNames: string[];
  emergingApprovedAtByName: Record<string, string>;
  emergingThemeValidityDays: TextAiEmergingValidityDays;
  showThemesWithNoResponses: boolean;
}

const STORAGE_KEY_PREFIX = 'bi-stats-text-ai-theme-preferences';
export const TEXT_AI_THEME_PREFERENCES_EVENT = 'text-ai-theme-preferences-changed';

const DEFAULT_PREFERENCES: TextAiThemePreferences = {
  approvedEmergingNames: [],
  emergingApprovedAtByName: {},
  emergingThemeValidityDays: 30,
  showThemesWithNoResponses: true,
};

function getStorageKey(dashboardId: number): string {
  return `${STORAGE_KEY_PREFIX}-${dashboardId}`;
}

export function getTextAiThemePreferences(
  dashboardId: number
): TextAiThemePreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;

  try {
    const stored = localStorage.getItem(getStorageKey(dashboardId));
    if (!stored) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(stored) as Omit<
      Partial<TextAiThemePreferences>,
      'emergingThemeValidityDays'
    > & {
      autoApproveEmergingThemes?: boolean;
      emergingThemeValidityDays?: number;
    };
    const storedValidity =
      parsed.emergingThemeValidityDays === 28
        ? 30
        : parsed.emergingThemeValidityDays;
    const emergingThemeValidityDays =
      storedValidity === 7 || storedValidity === 14 || storedValidity === 30
        ? storedValidity
        : DEFAULT_PREFERENCES.emergingThemeValidityDays;
    const approvedEmergingNames = Array.isArray(parsed.approvedEmergingNames)
      ? parsed.approvedEmergingNames.filter(
          (name): name is string => typeof name === 'string'
        )
      : DEFAULT_PREFERENCES.approvedEmergingNames;
    const emergingApprovedAtByName =
      parsed.emergingApprovedAtByName &&
      typeof parsed.emergingApprovedAtByName === 'object'
        ? Object.fromEntries(
            Object.entries(parsed.emergingApprovedAtByName).filter(
              (entry): entry is [string, string] =>
                typeof entry[1] === 'string' &&
                Number.isFinite(new Date(entry[1]).getTime())
            )
          )
        : DEFAULT_PREFERENCES.emergingApprovedAtByName;

    return {
      approvedEmergingNames,
      emergingApprovedAtByName,
      emergingThemeValidityDays,
      showThemesWithNoResponses:
        typeof parsed.showThemesWithNoResponses === 'boolean'
          ? parsed.showThemesWithNoResponses
          : DEFAULT_PREFERENCES.showThemesWithNoResponses,
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function saveTextAiThemePreferences(
  dashboardId: number,
  preferences: TextAiThemePreferences
): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(getStorageKey(dashboardId), JSON.stringify(preferences));
  window.dispatchEvent(
    new CustomEvent(TEXT_AI_THEME_PREFERENCES_EVENT, {
      detail: { dashboardId, preferences },
    })
  );
}
