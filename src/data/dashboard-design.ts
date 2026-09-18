export type DesignSelectOption = {
  value: string;
  label: string;
};

export type DesignTypographyOptions = {
  fontSize: DesignSelectOption;
  fontStyle: DesignSelectOption;
  fontFamily: DesignSelectOption;
};

export const DESIGN_THEME_OPTIONS: DesignSelectOption[] = [
  { value: 'default', label: 'Default' },
  { value: 'modern', label: 'Modern' },
  { value: 'classic', label: 'Classic' },
];

export const DESIGN_PALETTE_OPTIONS: DesignSelectOption[] = [
  { value: 'categorical', label: 'Categorical' },
  { value: 'sequential', label: 'Sequential' },
  { value: 'diverging', label: 'Diverging' },
];

export const DESIGN_SENTIMENT_OPTIONS: DesignSelectOption[] = [
  { value: 'default', label: 'Default' },
  { value: 'soft', label: 'Soft' },
  { value: 'high-contrast', label: 'High contrast' },
];

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
  { value: '"Fira Sans Dashboard", Arial, sans-serif', label: 'Fira Sans' },
  { value: 'Inter, "Segoe UI", Roboto, Arial, sans-serif', label: 'Inter' },
  { value: 'Roboto, Arial, sans-serif', label: 'Roboto' },
  { value: '"Segoe UI", Arial, sans-serif', label: 'Segoe UI' },
  { value: '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif', label: 'IBM Plex Sans' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Georgia, serif', label: 'Georgia' },
];

export const DEFAULT_DESIGN_TYPOGRAPHY: DesignTypographyOptions = {
  fontSize: DESIGN_FONT_SIZE_OPTIONS[1],
  fontStyle: DESIGN_FONT_STYLE_OPTIONS[0],
  fontFamily: DESIGN_FONT_FAMILY_OPTIONS[0],
};


export interface DashboardDesign {
  theme: string;
  palette: string;
  sentiment: string;
  typography: DesignTypographyOptions;
}

export const DEFAULT_DASHBOARD_DESIGN: DashboardDesign = {
  theme: 'default', palette: 'categorical', sentiment: 'default',
  typography: DEFAULT_DESIGN_TYPOGRAPHY,
};

const PALETTES: Record<string, string[]> = {
  categorical: ['#4f63a2', '#6680b5', '#3ea2b5', '#3fb6a3', '#8ed09a', '#bbc65a', '#e6963d', '#d7654f', '#9d3c31', '#9d637f'],
  sequential: ['#08306b', '#103e7a', '#184c88', '#205a96', '#2868a4', '#3075ad', '#3881b5', '#408dbb', '#4896bf', '#509fc3'],
  diverging: ['#8e0152', '#c51b7d', '#de77ae', '#f1b6da', '#fde0ef', '#e6f5d0', '#b8e186', '#7fbc41', '#4d9221', '#276419'],
};
// Semantic order stays fixed: very negative, negative, mixed, neutral, positive, very positive.
const SENTIMENTS: Record<string, string[]> = {
  default: ['#ff5470', '#ff967e', '#f2d46f', '#ecece1', '#99d493', '#3dc481'],
  soft: ['#df8b9b', '#edb29d', '#efdda1', '#e4e4df', '#bbd8b6', '#89c9ac'],
  'high-contrast': ['#a50026', '#d73027', '#fdae61', '#bdbdbd', '#66bd63', '#006837'],
};
const THEMES: Record<string, { accent: string; canvas: string; radius: string; shadow: string }> = {
  default: { accent: '#1b3380', canvas: '#f5f5f5', radius: '4px', shadow: 'none' },
  modern: { accent: '#0f766e', canvas: '#eef6f5', radius: '12px', shadow: '0 3px 12px rgb(15 118 110 / 8%)' },
  classic: { accent: '#6b3e26', canvas: '#f5f1e9', radius: '0px', shadow: 'none' },
};

export function getDashboardDesignColors(design: Pick<DashboardDesign, 'theme' | 'palette' | 'sentiment'>) {
  return { ...(THEMES[design.theme] ?? THEMES.default), palette: PALETTES[design.palette] ?? PALETTES.categorical, sentiment: SENTIMENTS[design.sentiment] ?? SENTIMENTS.default };
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
  return {
    theme: choice(record.theme, DESIGN_THEME_OPTIONS),
    palette: choice(record.palette, DESIGN_PALETTE_OPTIONS),
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
  colors.palette.forEach((color, index) => { vars[`--dashboard-series-${index}`] = color; });
  ['veryNegative', 'negative', 'mixed', 'neutral', 'positive', 'veryPositive'].forEach((key, index) => {
    vars[`--dashboard-sentiment-${key}`] = colors.sentiment[index];
    vars[`--dashboard-sentiment-${key}-text`] = getReadableDesignColor(colors.sentiment[index]);
  });
  return vars;
}
