export interface TextAiThemePreferences {
  approvedEmergingNames: string[];
  autoApproveEmergingThemes: boolean;
  showThemesWithNoResponses: boolean;
}

const STORAGE_KEY_PREFIX = 'bi-stats-text-ai-theme-preferences';
export const TEXT_AI_THEME_PREFERENCES_EVENT = 'text-ai-theme-preferences-changed';

const DEFAULT_PREFERENCES: TextAiThemePreferences = {
  approvedEmergingNames: [],
  autoApproveEmergingThemes: true,
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
    return { ...DEFAULT_PREFERENCES, ...(JSON.parse(stored) as TextAiThemePreferences) };
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
