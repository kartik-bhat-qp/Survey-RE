import { DEEPDIVE_V2_SURVEY_ID } from '@/data/mock-deepdive-question-settings';

export type SurveyLayoutId = 'classic' | 'focus' | 'visual' | 'accessible';
export type SurveyDesignPanelTabId = 'themes' | 'customize' | 'settings';
export type SurveyDesignPreviewDevice = 'desktop' | 'tablet' | 'mobile';

export interface SurveyLayoutOption {
  id: SurveyLayoutId;
  label: string;
  description: string;
  icon: string;
}

export interface SurveyDesignTheme {
  id: string;
  label: string;
  backgroundColor: string;
  accentColor: string;
  headerColor: string;
  buttonColor: string;
  optionAccentColor: string;
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
    icon: 'wm-view-list',
  },
  {
    id: 'focus',
    label: 'Focus',
    description: 'One question per page',
    icon: 'wm-filter-center-focus',
  },
  {
    id: 'visual',
    label: 'Visual',
    description: 'Image-forward layout with large visuals',
    icon: 'wm-palette',
  },
  {
    id: 'accessible',
    label: 'Accessible',
    description: 'High-contrast layout optimized for accessibility',
    icon: 'wm-accessibility-new',
  },
];

export const SURVEY_DESIGN_THEMES: SurveyDesignTheme[] = [
  { id: 'theme-01', label: 'Ocean Blue', backgroundColor: '#ffffff', accentColor: '#1b87e6', headerColor: '#1b87e6', buttonColor: '#1b87e6', optionAccentColor: '#1b87e6' },
  { id: 'theme-02', label: 'Midnight', backgroundColor: '#0f172a', accentColor: '#38bdf8', headerColor: '#0f172a', buttonColor: '#0284c7', optionAccentColor: '#38bdf8' },
  { id: 'theme-03', label: 'Forest', backgroundColor: '#f8fafc', accentColor: '#059669', headerColor: '#047857', buttonColor: '#059669', optionAccentColor: '#10b981' },
  { id: 'theme-04', label: 'Sunset', backgroundColor: '#fff7ed', accentColor: '#ea580c', headerColor: '#c2410c', buttonColor: '#ea580c', optionAccentColor: '#f97316' },
  { id: 'theme-05', label: 'Lavender', backgroundColor: '#faf5ff', accentColor: '#7c3aed', headerColor: '#6d28d9', buttonColor: '#7c3aed', optionAccentColor: '#8b5cf6' },
  { id: 'theme-06', label: 'Slate', backgroundColor: '#f1f5f9', accentColor: '#475569', headerColor: '#334155', buttonColor: '#475569', optionAccentColor: '#64748b' },
  { id: 'theme-07', label: 'Rose', backgroundColor: '#fff1f2', accentColor: '#e11d48', headerColor: '#be123c', buttonColor: '#e11d48', optionAccentColor: '#f43f5e' },
  { id: 'theme-08', label: 'Teal', backgroundColor: '#f0fdfa', accentColor: '#0d9488', headerColor: '#0f766e', buttonColor: '#0d9488', optionAccentColor: '#14b8a6' },
  { id: 'theme-09', label: 'Amber', backgroundColor: '#fffbeb', accentColor: '#d97706', headerColor: '#b45309', buttonColor: '#d97706', optionAccentColor: '#f59e0b' },
  { id: 'theme-10', label: 'Indigo', backgroundColor: '#eef2ff', accentColor: '#4f46e5', headerColor: '#4338ca', buttonColor: '#4f46e5', optionAccentColor: '#6366f1' },
  { id: 'theme-11', label: 'Charcoal', backgroundColor: '#111827', accentColor: '#fbbf24', headerColor: '#111827', buttonColor: '#f59e0b', optionAccentColor: '#fbbf24' },
  { id: 'theme-12', label: 'Sky', backgroundColor: '#f0f9ff', accentColor: '#0284c7', headerColor: '#0369a1', buttonColor: '#0284c7', optionAccentColor: '#0ea5e9' },
  { id: 'theme-13', label: 'Mint', backgroundColor: '#ecfdf5', accentColor: '#16a34a', headerColor: '#15803d', buttonColor: '#16a34a', optionAccentColor: '#22c55e' },
  { id: 'theme-14', label: 'Coral', backgroundColor: '#fff5f5', accentColor: '#f97316', headerColor: '#ea580c', buttonColor: '#f97316', optionAccentColor: '#fb923c' },
  { id: 'theme-15', label: 'Plum', backgroundColor: '#fdf4ff', accentColor: '#a21caf', headerColor: '#86198f', buttonColor: '#a21caf', optionAccentColor: '#c026d3' },
  { id: 'theme-16', label: 'Neutral', backgroundColor: '#ffffff', accentColor: '#374151', headerColor: '#111827', buttonColor: '#374151', optionAccentColor: '#4b5563' },
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
  layout: 'focus',
  panelTab: 'themes',
  selectedThemeId: SURVEY_DESIGN_THEMES[0].id,
  customize: DEFAULT_SURVEY_DESIGN_CUSTOMIZE,
  behavior: DEFAULT_SURVEY_DESIGN_BEHAVIOR,
};

export function surveyHasDesignTab(surveyId: number): boolean {
  return surveyId === DEEPDIVE_V2_SURVEY_ID;
}

export function surveyDesignSettingsStorageKey(surveyId: number): string {
  return `survey-design-settings-v1-${surveyId}`;
}

export function getSurveyDesignTheme(themeId: string): SurveyDesignTheme {
  return (
    SURVEY_DESIGN_THEMES.find((theme) => theme.id === themeId) ?? SURVEY_DESIGN_THEMES[0]
  );
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
    merged.layout = 'focus';
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
