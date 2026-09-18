export type DesignSelectOption = {
  value: string;
  label: string;
};

export type DesignTypographyOptions = {
  fontSize: DesignSelectOption;
  fontStyle: DesignSelectOption;
  fontFamily: DesignSelectOption;
};

export const DESIGN_THEME_OPTIONS: DesignSelectOption[] = [{ value: 'default', label: 'Default' }];
export const DESIGN_PALETTE_OPTIONS: DesignSelectOption[] = ['Categorical', 'Divergent', 'Blue', 'Green', 'Red', 'Orange', 'Custom'].map(label => ({ value: label.toLowerCase(), label }));
export const DESIGN_SENTIMENT_OPTIONS: DesignSelectOption[] = ['Default', 'Custom'].map(label => ({ value: label.toLowerCase(), label }));

export const DESIGN_FONT_SIZE_OPTIONS: DesignSelectOption[] = [
  { value: 'extra-small', label: 'Extra small' },
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'extra-large', label: 'Extra large' },
];

export const DESIGN_FONT_STYLE_OPTIONS: DesignSelectOption[] = [
  { value: 'regular', label: 'Regular' },
  { value: 'bold', label: 'Bold' },
  { value: 'italic', label: 'Italic' },
];

export const DESIGN_FONT_FAMILY_OPTIONS: DesignSelectOption[] = [
  { value: '"Fira Sans", Arial, sans-serif', label: 'Fira Sans' },
  { value: 'Inter, "Segoe UI", Roboto, Arial, sans-serif', label: 'Inter' },
  { value: 'Roboto, Arial, sans-serif', label: 'Roboto' },
  { value: '"Segoe UI", Arial, sans-serif', label: 'Segoe UI' },
  { value: '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif', label: 'IBM Plex Sans' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Georgia, serif', label: 'Georgia' },
];

export const DEFAULT_DESIGN_TYPOGRAPHY: DesignTypographyOptions = {
  fontSize: DESIGN_FONT_SIZE_OPTIONS[2],
  fontStyle: DESIGN_FONT_STYLE_OPTIONS[0],
  fontFamily: DESIGN_FONT_FAMILY_OPTIONS[0],
};


export const DESIGN_PALETTES: Record<string, string[]> = {
  categorical: ['#4c5b94', '#5b7aae', '#409eb5', '#40b59e', '#60c790', '#9ad69a', '#b3bd56', '#dd8f40', '#ce6550', '#ae4c3d', '#8f3328', '#985d75', '#b181a8', '#c5a0c2', '#dac2e0', '#e3d9e8'],
  divergent: ['#661200', '#a11c00', '#d2300f', '#df4828', '#eb6a4a', '#f4896c', '#fca78f', '#ffc4b3', '#ffe2d9', '#f5f5f5', '#dbd9e9', '#b7b5d4', '#9392bf', '#7070aa', '#4a5195', '#1b3380', '#182d72', '#122254'],
  blue: ['#ebf8ff', '#d7efff', '#c2deff', '#aad0ff', '#94c1f3', '#7db2e7', '#67a3db', '#5194cf', '#3b85c3', '#2576b7', '#256cac', '#1a60a6', '#184994', '#1c337f', '#0d2163', '#00083d'],
  green: ['#e0f9ed', '#c4f3dc', '#a8eccc', '#8de5bd', '#78ddb1', '#62d3a3', '#4cc996', '#3abf8a', '#35af7f', '#329d75', '#308a6a', '#2d7a60', '#286a55', '#255c4b', '#1f4b3e', '#1b3d34'],
  red: ['#fee9ec', '#ffd2d8', '#ffbbc4', '#ffa6b3', '#fb97a5', '#f78998', '#f37c8c', '#ee6f80', '#e76172', '#e15466', '#da465b', '#d33b50', '#bc3548', '#a73343', '#91313e', '#7d2d38'],
  orange: ['#fdede5', '#fcdfcf', '#fbcfba', '#fac5ab', '#f7b694', '#f6ab85', '#f79d70', '#f6915f', '#ef8450', '#e37944', '#db713c', '#d06530', '#c95e29', '#bd521c', '#b24610', '#aa3f08'],
};
export const DESIGN_SENTIMENT_COLORS = ['#f85271', '#f69a79', '#f1da7e', '#94d08b', '#42bd84'];
export interface DashboardDesign {
  theme: string;
  palette: string;
  sentiment: string;
  themeColor: string;
  customPalette: string[];
  customSentiment: string[];
  typography: DesignTypographyOptions;
}
export type DesignColorSettings = Pick<DashboardDesign, 'themeColor' | 'customPalette' | 'customSentiment'>;
export const DEFAULT_DASHBOARD_DESIGN: DashboardDesign = {
  theme: 'default', palette: 'categorical', sentiment: 'default', themeColor: '#1b3380',
  customPalette: DESIGN_PALETTES.categorical, customSentiment: DESIGN_SENTIMENT_COLORS,
  typography: DEFAULT_DESIGN_TYPOGRAPHY,
};
export function isDesignColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
}
export function getDashboardDesignColors(design: Pick<DashboardDesign, 'theme' | 'palette' | 'sentiment'> & Partial<DesignColorSettings>) {
  const palette = design.palette === 'custom' ? design.customPalette ?? DESIGN_PALETTES.categorical : DESIGN_PALETTES[design.palette] ?? DESIGN_PALETTES.categorical;
  return {
    accent: design.themeColor ?? DEFAULT_DASHBOARD_DESIGN.themeColor,
    canvas: '#f5f5f5', radius: '4px', shadow: 'none', palette,
    sentiment: design.sentiment === 'custom' ? design.customSentiment ?? DESIGN_SENTIMENT_COLORS : DESIGN_SENTIMENT_COLORS,
  };
}

export function getReadableDesignColor(hex: string): string {
  const channels = [1, 3, 5].map((start) => {
    const v = parseInt(hex.slice(start, start + 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722 > 0.179 ? '#111111' : '#ffffff';
}

export function normalizeDashboardDesign(value: unknown): DashboardDesign {
  const record = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const typography = record.typography && typeof record.typography === 'object' ? record.typography as Record<string, unknown> : {};
  const option = (value: unknown, options: DesignSelectOption[], fallback: DesignSelectOption) => {
    const id = value && typeof value === 'object' ? (value as Record<string, unknown>).value : undefined;
    return options.find((entry) => entry.value === id) ?? fallback;
  };
  const choice = (value: unknown, options: DesignSelectOption[]) => options.find((entry) => entry.value === value)?.value ?? options[0].value;
  const colorArray = (value: unknown, fallback: string[], exactLength?: number) =>
    Array.isArray(value) && value.length >= 5 && value.length <= 64 && (!exactLength || value.length === exactLength) && value.every(isDesignColor) ? value.map(color => color.toLowerCase()) : [...fallback];
  return {
    themeColor: isDesignColor(record.themeColor) ? record.themeColor.toLowerCase() : DEFAULT_DASHBOARD_DESIGN.themeColor,
    customPalette: colorArray(record.customPalette, DESIGN_PALETTES.categorical),
    customSentiment: colorArray(record.customSentiment, DESIGN_SENTIMENT_COLORS, 5),
    theme: typeof record.theme === 'string' && /^custom-[a-z0-9-]+$/i.test(record.theme) ? record.theme : choice(record.theme, DESIGN_THEME_OPTIONS),
    palette: choice(record.palette === 'sequential' ? 'blue' : record.palette === 'diverging' ? 'divergent' : record.palette, DESIGN_PALETTE_OPTIONS),
    sentiment: choice(record.sentiment, DESIGN_SENTIMENT_OPTIONS),
    typography: {
      fontSize: option(typography.fontSize, DESIGN_FONT_SIZE_OPTIONS, DEFAULT_DESIGN_TYPOGRAPHY.fontSize),
      fontStyle: option(typography.fontStyle, DESIGN_FONT_STYLE_OPTIONS, DEFAULT_DESIGN_TYPOGRAPHY.fontStyle),
      fontFamily: option(typography.fontFamily, DESIGN_FONT_FAMILY_OPTIONS, DEFAULT_DESIGN_TYPOGRAPHY.fontFamily),
    },
  };
}

export function getTextAiDashboardDesign(id: number): DashboardDesign {
  try { return normalizeDashboardDesign(JSON.parse(window.localStorage.getItem(`text-ai-dashboard-design:${id}`) ?? 'null')); }
  catch { return normalizeDashboardDesign(null); }
}

export function saveTextAiDashboardDesign(id: number, design: DashboardDesign): boolean {
  try { window.localStorage.setItem(`text-ai-dashboard-design:${id}`, JSON.stringify(normalizeDashboardDesign(design))); return true; }
  catch { return false; }
}

export function getDashboardDesignColorVars(design: DashboardDesign): Record<string, string> {
  const colors = getDashboardDesignColors(design);
  const vars: Record<string, string> = {
    '--dashboard-accent': colors.accent, '--dashboard-canvas': colors.canvas,
    '--dashboard-card-radius': colors.radius, '--dashboard-card-shadow': colors.shadow,
  };
  Array.from({ length: Math.max(16, colors.palette.length) }, (_, index) => { vars[`--dashboard-series-${index}`] = colors.palette[index % colors.palette.length]; vars[`--dashboard-series-${index}-text`] = getReadableDesignColor(colors.palette[index % colors.palette.length]); });
  ['veryNegative', 'negative', 'mixed', 'neutral', 'positive', 'veryPositive'].forEach((key, index) => {
    vars[`--dashboard-sentiment-${key}`] = colors.sentiment[[0, 1, 2, 2, 3, 4][index]];
    vars[`--dashboard-sentiment-${key}-text`] = getReadableDesignColor(colors.sentiment[[0, 1, 2, 2, 3, 4][index]]);
  });
  return vars;
}

export interface SavedDashboardTheme {
  id: string;
  name: string;
  design: DashboardDesign;
}
const TEXT_AI_THEMES_KEY = 'text-ai-saved-design-themes';

export function getTextAiSavedThemes(): SavedDashboardTheme[] {
  try {
    const data: unknown = JSON.parse(window.localStorage.getItem(TEXT_AI_THEMES_KEY) ?? '[]');
    if (!Array.isArray(data)) return [];
    const seen = new Set<string>();
    return data.flatMap(value => {
      if (!value || typeof value !== 'object' || typeof value.id !== 'string' || !/^custom-[a-z0-9-]+$/i.test(value.id) || typeof value.name !== 'string' || !value.name.trim() || value.name.length > 100 || seen.has(value.id)) return [];
      seen.add(value.id);
      return [{ id: value.id, name: value.name.trim(), design: normalizeDashboardDesign({ ...value.design, theme: value.id }) }];
    });
  } catch { return []; }
}

export function saveTextAiTheme(name: string, design: DashboardDesign): { theme: SavedDashboardTheme; themes: SavedDashboardTheme[] } | { error: string } {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 100) return { error: 'Enter a theme name between 1 and 100 characters.' };
  const themes = getTextAiSavedThemes();
  if (trimmed.toLowerCase() === 'default' || themes.some(theme => theme.name.toLowerCase() === trimmed.toLowerCase())) return { error: 'A theme with this name already exists. Choose another name.' };
  const id = `custom-${crypto.randomUUID()}`;
  const theme = { id, name: trimmed, design: normalizeDashboardDesign({ ...design, theme: id }) };
  try {
    window.localStorage.setItem(TEXT_AI_THEMES_KEY, JSON.stringify([...themes, theme]));
    return { theme, themes: [...themes, theme] };
  } catch { return { error: 'Theme could not be saved. Check browser storage and try again.' }; }
}
