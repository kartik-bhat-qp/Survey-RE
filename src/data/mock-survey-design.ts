export type SurveyLayoutId = 'classic' | 'focus' | 'visual' | 'accessible';
export type SurveyDesignPanelTabId = 'themes' | 'customize' | 'settings';
export type SurveyDesignPreviewDevice = 'desktop' | 'tablet' | 'mobile';
export type SurveyDesignThemeHero =
  | 'none'
  | 'sky'
  | 'forest'
  | 'sunset'
  | 'ocean'
  | 'abstract'
  | 'city'
  | 'warm';

export interface SurveyLayoutOption {
  id: SurveyLayoutId;
  label: string;
  description: string;
  retiring?: boolean;
}

export interface SurveyDesignTheme {
  id: string;
  label: string;
  backgroundColor: string;
  accentColor: string;
  headerColor: string;
  topBarColor: string;
  buttonColor: string;
  optionAccentColor: string;
  textColor: string;
  mutedColor: string;
  surfaceColor: string;
  hero: SurveyDesignThemeHero;
}

export interface SurveyDesignCustomizeSettings {
  backgroundStyle: 'solid' | 'gradient' | 'pattern';
  fontFamily: 'fira-sans' | 'inter' | 'roboto' | 'georgia';
  showProgressBar: boolean;
}

export interface SurveyDesignBehaviorSettings {
  showQuestionNumbers: boolean;
  showRequiredIndicator: boolean;
  allowBackNavigation: boolean;
}

export interface SurveyDesignSettings {
  layout: SurveyLayoutId;
  panelTab: SurveyDesignPanelTabId;
  selectedThemeId: string;
  customize: SurveyDesignCustomizeSettings;
  behavior: SurveyDesignBehaviorSettings;
}

export const SURVEY_DESIGN_PREVIEW = {
  surveyTitle: 'Satisfaction Survey',
  questionText: 'Do you like ice cream?',
  options: ['Yes', 'No'] as const,
};

export const SURVEY_LAYOUT_OPTIONS: SurveyLayoutOption[] = [
  {
    id: 'classic',
    label: 'Classic',
    description: 'All questions on one scrollable page',
  },
  {
    id: 'focus',
    label: 'Focus',
    description: 'One question per page',
    retiring: true,
  },
  {
    id: 'visual',
    label: 'Visual',
    description: 'Image-forward layout with large visuals',
    retiring: true,
  },
  {
    id: 'accessible',
    label: 'Accessible',
    description: 'High-contrast layout optimized for accessibility',
  },
];

export const SURVEY_LAYOUT_RETIRING_NOTICE = {
  title: 'Depricating after 12/31/2026',
  body: 'This mode will not be available after 12/31/2026. Existing surveys will not be impacted with this change.',
};

export const SURVEY_DESIGN_PANEL_TABS: { id: SurveyDesignPanelTabId; label: string }[] = [
  { id: 'themes', label: 'Themes' },
  { id: 'customize', label: 'Customize' },
  { id: 'settings', label: 'Settings' },
];

export const SURVEY_DESIGN_THEMES: SurveyDesignTheme[] = [
  {
    id: 'theme-01',
    label: 'Ocean Blue',
    backgroundColor: '#ffffff',
    accentColor: '#1b87e6',
    headerColor: '#ffffff',
    topBarColor: '#8ecaf0',
    buttonColor: '#1b87e6',
    optionAccentColor: '#1b87e6',
    textColor: '#1e293b',
    mutedColor: '#64748b',
    surfaceColor: '#ffffff',
    hero: 'none',
  },
  {
    id: 'theme-02',
    label: 'Midnight',
    backgroundColor: '#0f172a',
    accentColor: '#38bdf8',
    headerColor: '#020617',
    topBarColor: '#38bdf8',
    buttonColor: '#0284c7',
    optionAccentColor: '#38bdf8',
    textColor: '#e2e8f0',
    mutedColor: '#94a3b8',
    surfaceColor: '#1e293b',
    hero: 'none',
  },
  {
    id: 'theme-03',
    label: 'Forest',
    backgroundColor: '#f8fafc',
    accentColor: '#059669',
    headerColor: '#047857',
    topBarColor: '#34d399',
    buttonColor: '#059669',
    optionAccentColor: '#10b981',
    textColor: '#14532d',
    mutedColor: '#4b5563',
    surfaceColor: '#ffffff',
    hero: 'forest',
  },
  {
    id: 'theme-04',
    label: 'Sunset',
    backgroundColor: '#fff7ed',
    accentColor: '#ea580c',
    headerColor: '#c2410c',
    topBarColor: '#fdba74',
    buttonColor: '#ea580c',
    optionAccentColor: '#f97316',
    textColor: '#7c2d12',
    mutedColor: '#9a3412',
    surfaceColor: '#fffbf7',
    hero: 'sunset',
  },
  {
    id: 'theme-05',
    label: 'Lavender',
    backgroundColor: '#faf5ff',
    accentColor: '#7c3aed',
    headerColor: '#6d28d9',
    topBarColor: '#c4b5fd',
    buttonColor: '#7c3aed',
    optionAccentColor: '#8b5cf6',
    textColor: '#3b0764',
    mutedColor: '#6b7280',
    surfaceColor: '#ffffff',
    hero: 'abstract',
  },
  {
    id: 'theme-06',
    label: 'Slate',
    backgroundColor: '#f1f5f9',
    accentColor: '#475569',
    headerColor: '#334155',
    topBarColor: '#94a3b8',
    buttonColor: '#475569',
    optionAccentColor: '#64748b',
    textColor: '#0f172a',
    mutedColor: '#64748b',
    surfaceColor: '#ffffff',
    hero: 'none',
  },
  {
    id: 'theme-07',
    label: 'Rose',
    backgroundColor: '#fff1f2',
    accentColor: '#e11d48',
    headerColor: '#be123c',
    topBarColor: '#fb7185',
    buttonColor: '#e11d48',
    optionAccentColor: '#f43f5e',
    textColor: '#881337',
    mutedColor: '#9f1239',
    surfaceColor: '#fff7f8',
    hero: 'warm',
  },
  {
    id: 'theme-08',
    label: 'Teal',
    backgroundColor: '#f0fdfa',
    accentColor: '#0d9488',
    headerColor: '#0f766e',
    topBarColor: '#5eead4',
    buttonColor: '#0d9488',
    optionAccentColor: '#14b8a6',
    textColor: '#134e4a',
    mutedColor: '#0f766e',
    surfaceColor: '#ffffff',
    hero: 'ocean',
  },
  {
    id: 'theme-09',
    label: 'Amber',
    backgroundColor: '#fffbeb',
    accentColor: '#d97706',
    headerColor: '#b45309',
    topBarColor: '#fbbf24',
    buttonColor: '#d97706',
    optionAccentColor: '#f59e0b',
    textColor: '#78350f',
    mutedColor: '#92400e',
    surfaceColor: '#fffdf6',
    hero: 'sunset',
  },
  {
    id: 'theme-10',
    label: 'Indigo',
    backgroundColor: '#eef2ff',
    accentColor: '#4f46e5',
    headerColor: '#4338ca',
    topBarColor: '#a5b4fc',
    buttonColor: '#4f46e5',
    optionAccentColor: '#6366f1',
    textColor: '#312e81',
    mutedColor: '#4338ca',
    surfaceColor: '#ffffff',
    hero: 'sky',
  },
  {
    id: 'theme-11',
    label: 'Charcoal',
    backgroundColor: '#111827',
    accentColor: '#fbbf24',
    headerColor: '#030712',
    topBarColor: '#fbbf24',
    buttonColor: '#f59e0b',
    optionAccentColor: '#fbbf24',
    textColor: '#f8fafc',
    mutedColor: '#cbd5e1',
    surfaceColor: '#1f2937',
    hero: 'none',
  },
  {
    id: 'theme-12',
    label: 'Sky',
    backgroundColor: '#f0f9ff',
    accentColor: '#0284c7',
    headerColor: '#0369a1',
    topBarColor: '#7dd3fc',
    buttonColor: '#0284c7',
    optionAccentColor: '#0ea5e9',
    textColor: '#0c4a6e',
    mutedColor: '#0369a1',
    surfaceColor: '#ffffff',
    hero: 'sky',
  },
  {
    id: 'theme-13',
    label: 'Mint',
    backgroundColor: '#ecfdf5',
    accentColor: '#16a34a',
    headerColor: '#15803d',
    topBarColor: '#86efac',
    buttonColor: '#16a34a',
    optionAccentColor: '#22c55e',
    textColor: '#14532d',
    mutedColor: '#166534',
    surfaceColor: '#ffffff',
    hero: 'forest',
  },
  {
    id: 'theme-14',
    label: 'Coral',
    backgroundColor: '#fff5f5',
    accentColor: '#f97316',
    headerColor: '#ea580c',
    topBarColor: '#fdba74',
    buttonColor: '#f97316',
    optionAccentColor: '#fb923c',
    textColor: '#7c2d12',
    mutedColor: '#c2410c',
    surfaceColor: '#fffaf5',
    hero: 'city',
  },
  {
    id: 'theme-15',
    label: 'Plum',
    backgroundColor: '#fdf4ff',
    accentColor: '#a21caf',
    headerColor: '#86198f',
    topBarColor: '#e879f9',
    buttonColor: '#a21caf',
    optionAccentColor: '#c026d3',
    textColor: '#701a75',
    mutedColor: '#86198f',
    surfaceColor: '#ffffff',
    hero: 'abstract',
  },
  {
    id: 'theme-16',
    label: 'Neutral',
    backgroundColor: '#ffffff',
    accentColor: '#374151',
    headerColor: '#111827',
    topBarColor: '#9ca3af',
    buttonColor: '#374151',
    optionAccentColor: '#4b5563',
    textColor: '#111827',
    mutedColor: '#6b7280',
    surfaceColor: '#ffffff',
    hero: 'none',
  },
];

export const SURVEY_DESIGN_BACKGROUND_STYLE_OPTIONS = [
  { value: 'solid', label: 'Solid' },
  { value: 'gradient', label: 'Gradient' },
  { value: 'pattern', label: 'Pattern' },
] as const;

export const SURVEY_DESIGN_FONT_FAMILY_OPTIONS = [
  { value: 'fira-sans', label: 'Fira Sans' },
  { value: 'inter', label: 'Inter' },
  { value: 'roboto', label: 'Roboto' },
  { value: 'georgia', label: 'Georgia' },
] as const;

export const DEFAULT_SURVEY_DESIGN_CUSTOMIZE: SurveyDesignCustomizeSettings = {
  backgroundStyle: 'solid',
  fontFamily: 'fira-sans',
  showProgressBar: false,
};

export const DEFAULT_SURVEY_DESIGN_BEHAVIOR: SurveyDesignBehaviorSettings = {
  showQuestionNumbers: false,
  showRequiredIndicator: true,
  allowBackNavigation: true,
};

export const DEFAULT_SURVEY_DESIGN_SETTINGS: SurveyDesignSettings = {
  layout: 'classic',
  panelTab: 'themes',
  selectedThemeId: SURVEY_DESIGN_THEMES[0].id,
  customize: DEFAULT_SURVEY_DESIGN_CUSTOMIZE,
  behavior: DEFAULT_SURVEY_DESIGN_BEHAVIOR,
};

export function surveyDesignSettingsStorageKey(surveyId: number): string {
  return `survey-design-settings-v1-${surveyId}`;
}

export function getSurveyDesignTheme(themeId: string): SurveyDesignTheme {
  return (
    SURVEY_DESIGN_THEMES.find((theme) => theme.id === themeId) ?? SURVEY_DESIGN_THEMES[0]
  );
}

export function getSurveyDesignThemeHero(hero: SurveyDesignThemeHero): string | undefined {
  switch (hero) {
    case 'sky':
      return 'linear-gradient(180deg, #bfdbfe 0%, #60a5fa 28%, #2563eb 58%, #1e3a8a 100%)';
    case 'forest':
      return 'linear-gradient(180deg, #bae6fd 0%, #7dd3fc 32%, #4ade80 33%, #166534 68%, #14532d 100%)';
    case 'sunset':
      return 'linear-gradient(180deg, #fed7aa 0%, #fb923c 28%, #f43f5e 55%, #7c2d12 100%)';
    case 'ocean':
      return 'linear-gradient(180deg, #a5f3fc 0%, #22d3ee 30%, #0891b2 62%, #134e4a 100%)';
    case 'abstract':
      return 'linear-gradient(135deg, #e9d5ff 0%, #c4b5fd 35%, #818cf8 70%, #4f46e5 100%)';
    case 'city':
      return 'linear-gradient(180deg, #e2e8f0 0%, #94a3b8 38%, #475569 70%, #0f172a 100%)';
    case 'warm':
      return 'linear-gradient(180deg, #fecdd3 0%, #fb7185 42%, #e11d48 72%, #9f1239 100%)';
    case 'none':
    default:
      return undefined;
  }
}

export function normalizeSurveyDesignSettings(
  partial: Partial<SurveyDesignSettings> | null | undefined
): SurveyDesignSettings {
  const merged = {
    ...DEFAULT_SURVEY_DESIGN_SETTINGS,
    ...partial,
    customize: {
      ...DEFAULT_SURVEY_DESIGN_CUSTOMIZE,
      ...partial?.customize,
    },
    behavior: {
      ...DEFAULT_SURVEY_DESIGN_BEHAVIOR,
      ...partial?.behavior,
    },
  };

  if (!SURVEY_DESIGN_THEMES.some((theme) => theme.id === merged.selectedThemeId)) {
    merged.selectedThemeId = SURVEY_DESIGN_THEMES[0].id;
  }

  if (!SURVEY_LAYOUT_OPTIONS.some((layout) => layout.id === merged.layout)) {
    merged.layout = 'classic';
  }

  return merged;
}

export function getSurveyDesignFontFamily(value: SurveyDesignCustomizeSettings['fontFamily']): string {
  switch (value) {
    case 'inter':
      return 'Inter, "Segoe UI", Roboto, Arial, sans-serif';
    case 'roboto':
      return 'Roboto, Arial, sans-serif';
    case 'georgia':
      return 'Georgia, "Times New Roman", serif';
    case 'fira-sans':
    default:
      return '"Fira Sans", Arial, sans-serif';
  }
}
