export interface SharedUrlLink {
  id: number;
  name: string;
  url: string;
  createdAt: string;
  status: boolean;
  settings: SharedLinkCreateDraft;
}

export type SharedLinkTitleAlignment = 'left' | 'center' | 'right';

export interface SharedLinkSettings {
  shareTitle: string;
  showTitle: boolean;
  titleAlignment: SharedLinkTitleAlignment;
  showInsights: boolean;
  allowComments: boolean;
  enablePassword: boolean;
  password: string;
  baseFilter: boolean;
  baseFilterId: string | null;
  savedFiltersEnabled: boolean;
  selectedSavedFilterIds: string[];
  allowInteractivity: boolean;
  dateFilter: boolean;
  responseStatus: boolean;
  language: string;
}

export interface SharedLinkCreateDraft extends SharedLinkSettings {
  name: string;
}

/** Synthetic saved filters for the local prototype; no production data is copied. */
export const DASHBOARD_SAVED_FILTER_OPTIONS = [
  { value: 'gender', label: 'Gender' },
  { value: 'country', label: 'Country' },
  { value: 'fy-2025-2026', label: 'FY 2025–2026' },
] as const;

export const SHARED_LINK_LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' },
  { value: 'ar', label: 'العربية' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
  { value: 'ja', label: '日本語' },
  { value: 'fr', label: 'Français' },
  { value: 'ru', label: 'Русский' },
] as const;

export const DEFAULT_SHARED_LINK_SETTINGS: SharedLinkSettings = {
  shareTitle: '',
  showTitle: true,
  titleAlignment: 'left',
  showInsights: false,
  allowComments: false,
  enablePassword: false,
  password: '',
  baseFilter: false,
  baseFilterId: null,
  savedFiltersEnabled: false,
  selectedSavedFilterIds: [],
  allowInteractivity: false,
  dateFilter: false,
  responseStatus: false,
  language: 'en',
};

export const DEFAULT_SHARED_LINK_CREATE_DRAFT: SharedLinkCreateDraft = {
  name: '',
  ...DEFAULT_SHARED_LINK_SETTINGS,
};

/** Maximum shared links allowed on the current license. */
export const SHARED_URL_LICENSE_LIMIT = 5;

export const SHARED_URL_UPSELL = {
  title: 'Unlock more shared links with BI',
  subtitle:
    'Your current plan includes up to 5 shared URLs. A BI license lets you share live dashboards with anyone—no seat limits.',
  benefits: [
    'Unlimited shared URLs for clients, leadership, and partners',
    'Live dashboard views that update as new survey responses arrive',
    'Secure, read-only access without giving away your QuestionPro account',
  ],
  primaryCta: 'Explore BI licenses',
  secondaryCta: 'Maybe later',
  exploreToast: 'A QuestionPro specialist will reach out about BI licensing.',
} as const;

/** Additional profiles start empty, as in the production Shared Links tab. */
export const MOCK_SHARED_URLS: SharedUrlLink[] = [];

export interface DashboardSharingState {
  enabled: boolean;
  settings: SharedLinkSettings;
  links: SharedUrlLink[];
}

export const DEFAULT_DASHBOARD_SHARING: DashboardSharingState = {
  enabled: true,
  settings: DEFAULT_SHARED_LINK_SETTINGS,
  links: MOCK_SHARED_URLS,
};

export const dashboardSharingStorageKey = (dashboardId: number) => `dashboard-sharing-v2-${dashboardId}`;

export function sharedDashboardPath(dashboardId: number, profile: string | number = 'default'): string {
  return `/dashboards/${dashboardId}/shared?profile=${encodeURIComponent(profile)}`;
}

export function shareSettingsError(settings: SharedLinkSettings): string | null {
  if (settings.enablePassword && !settings.password.trim()) return 'Enter a password or turn off password protection.';
  if (settings.baseFilter && !settings.baseFilterId) return 'Select a base filter.';
  if (settings.savedFiltersEnabled && !settings.selectedSavedFilterIds.some((id) =>
    DASHBOARD_SAVED_FILTER_OPTIONS.some((option) => option.value === id) &&
    (!settings.baseFilter || id !== settings.baseFilterId)
  )) return 'Select at least one saved filter.';
  return null;
}

export interface SharedFilterDefinition {
  id: string;
  label: string;
  field: 'gender' | 'country' | 'fiscalYear';
  values: string[];
  presetValues: string[];
}

/** Sample saved definitions and responses used only to exercise viewer filtering. */
export const SHARED_FILTER_DEFINITIONS: SharedFilterDefinition[] = [
  { id: 'gender', label: 'Gender', field: 'gender', values: ['Female', 'Male', 'Other'], presetValues: ['Female'] },
  { id: 'country', label: 'Country', field: 'country', values: ['India', 'United States', 'United Kingdom', 'Germany'], presetValues: ['India'] },
  { id: 'fy-2025-2026', label: 'FY 2025–2026', field: 'fiscalYear', values: ['2025–2026', '2026–2027'], presetValues: ['2025–2026'] },
];

export interface SharedDashboardResponse {
  id: number;
  gender: string;
  country: string;
  fiscalYear: string;
  respondedAt: string;
  status: SharedResponseStatus;
  satisfaction: number;
  age: string;
  recommendation: number;
  durationSeconds: number;
}

export type SharedResponseStatus = 'Completed' | 'Partial' | 'Terminates';
export const SHARED_RESPONSE_STATUS_OPTIONS: { value: SharedResponseStatus; label: string }[] = [
  { value: 'Completed', label: 'Completed' },
  { value: 'Partial', label: 'Started But Not Completed' },
  { value: 'Terminates', label: 'Terminates' },
];

export const SHARED_DASHBOARD_RESPONSES: SharedDashboardResponse[] = SHARED_FILTER_DEFINITIONS[0].values.flatMap((gender, genderIndex) =>
  SHARED_FILTER_DEFINITIONS[1].values.flatMap((country, countryIndex) =>
    SHARED_FILTER_DEFINITIONS[2].values.flatMap((fiscalYear, yearIndex) =>
      Array.from({ length: 5 }, (_, index) => ({
        id: genderIndex * 40 + countryIndex * 10 + yearIndex * 5 + index + 1,
        gender, country, fiscalYear,
        respondedAt: `${2025 + yearIndex}-${String(index + 4).padStart(2, '0')}-15`,
        status: index === 0 ? (countryIndex === 3 ? 'Terminates' as const : 'Partial' as const) : 'Completed' as const,
        satisfaction: 1 + ((genderIndex + countryIndex + index) % 5),
        age: ['18-24', '25-34', '35-44', '45-54', '55-64', 'Above 64'][(genderIndex + countryIndex + index) % 6],
        recommendation: (genderIndex * 3 + countryIndex + index * 2) % 11,
        durationSeconds: 90 + (genderIndex + countryIndex + index) * 30,
      }))
    )
  )
);

export interface SharedViewerFilters {
  activeSavedFilterId: string | null;
  valuesByFilter: Record<string, string[]>;
  startDate: string;
  endDate: string;
  responseStatuses: SharedResponseStatus[];
}

export function availableSharedFilters(settings: SharedLinkSettings): SharedFilterDefinition[] {
  if (!settings.savedFiltersEnabled) return [];
  return SHARED_FILTER_DEFINITIONS.filter((filter) => settings.selectedSavedFilterIds.includes(filter.id) &&
    (!settings.baseFilter || settings.baseFilterId !== filter.id));
}

export function initialSharedViewerFilters(settings: SharedLinkSettings): SharedViewerFilters {
  const filters = availableSharedFilters(settings);
  return {
    // Production saved-only links start without a selected preset.
    activeSavedFilterId: null,
    valuesByFilter: Object.fromEntries(filters.map((filter) => [filter.id, [...filter.presetValues]])),
    startDate: '', endDate: '', responseStatuses: SHARED_RESPONSE_STATUS_OPTIONS.map((option) => option.value),
  };
}

export function filterSharedResponses(settings: SharedLinkSettings, viewer: SharedViewerFilters,
  responses: SharedDashboardResponse[] = SHARED_DASHBOARD_RESPONSES): SharedDashboardResponse[] {
  if (shareSettingsError(settings)) return [];
  const filters = availableSharedFilters(settings);
  const base = settings.baseFilter ? SHARED_FILTER_DEFINITIONS.find((filter) => filter.id === settings.baseFilterId) : undefined;
  // An unknown base filter must not silently broaden the shared data.
  if (settings.baseFilter && !base) return [];
  return responses.filter((response) => {
    if (base && !base.presetValues.includes(response[base.field])) return false;
    if (settings.savedFiltersEnabled) {
      if (settings.allowInteractivity) {
        if (!filters.every((filter) => (viewer.valuesByFilter[filter.id] ?? filter.presetValues).includes(response[filter.field]))) return false;
      } else {
        const active = filters.find((filter) => filter.id === viewer.activeSavedFilterId);
        if (viewer.activeSavedFilterId && !active) return false;
        if (active && !active.presetValues.includes(response[active.field])) return false;
      }
      if (settings.dateFilter && ((viewer.startDate && response.respondedAt < viewer.startDate) || (viewer.endDate && response.respondedAt > viewer.endDate))) return false;
      if (settings.responseStatus && !viewer.responseStatuses.includes(response.status)) return false;
    }
    return true;
  });
}
