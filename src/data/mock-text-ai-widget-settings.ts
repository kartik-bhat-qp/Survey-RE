export const TEXT_AI_WIDGET_TOP_N_LIMITS = [3, 5, 10, 15, 20] as const;

export type TextAiWidgetTopN = 'all' | (typeof TEXT_AI_WIDGET_TOP_N_LIMITS)[number];

export type TextAiWidgetDisplayChoice = TextAiWidgetTopN | 'custom';
export type TextAiWidgetCustomMode = 'manual' | 'variance';

/** First option: show all themes/topics. */
export const DEFAULT_TEXT_AI_WIDGET_TOP_N: TextAiWidgetTopN = 'all';
/** Default for sub-theme trend widgets. */
export const DEFAULT_TEXT_AI_TREND_WIDGET_TOP_N: TextAiWidgetTopN = 10;
export const DEFAULT_TEXT_AI_WIDGET_VARIANCE_PERCENT = 10;
export const TEXT_AI_WIDGET_CUSTOM_SELECTION_MAX = 20;

export const TEXT_AI_WIDGET_TOP_N_SELECT_OPTIONS = [
  { value: 'all', label: 'Default' },
  ...TEXT_AI_WIDGET_TOP_N_LIMITS.map((value) => ({
    value: String(value),
    label: `Top ${value}`,
  })),
] as const;

export const TEXT_AI_WIDGET_CUSTOM_OPTION = {
  value: 'custom',
  label: 'Custom',
} as const;

export const TEXT_AI_WIDGET_CUSTOM_MODE_OPTIONS = [
  { value: 'manual', label: 'Manual' },
  { value: 'variance', label: 'Variance' },
] as const;

export type TextAiWidgetTopNSelectOption =
  (typeof TEXT_AI_WIDGET_TOP_N_SELECT_OPTIONS)[number];

export type TextAiWidgetDisplaySelectOption =
  | TextAiWidgetTopNSelectOption
  | typeof TEXT_AI_WIDGET_CUSTOM_OPTION;

export type TextAiWidgetCustomModeOption =
  (typeof TEXT_AI_WIDGET_CUSTOM_MODE_OPTIONS)[number];

export interface TextAiWidgetSelectionItem {
  id: string;
  label: string;
  parentLabel?: string;
  variancePercent: number;
}

export interface TextAiWidgetDisplayState {
  value: TextAiWidgetDisplayChoice;
  customMode: TextAiWidgetCustomMode;
  selectedIds: string[];
  variancePercent: number;
}

export function createTextAiWidgetDisplayState(
  topN: TextAiWidgetTopN = DEFAULT_TEXT_AI_WIDGET_TOP_N,
  itemIds: string[] = []
): TextAiWidgetDisplayState {
  return {
    value: topN,
    customMode: 'manual',
    selectedIds: itemIds.slice(0, TEXT_AI_WIDGET_CUSTOM_SELECTION_MAX),
    variancePercent: DEFAULT_TEXT_AI_WIDGET_VARIANCE_PERCENT,
  };
}

export function createTextAiTrendWidgetDisplayState(): TextAiWidgetDisplayState {
  return createTextAiWidgetDisplayState(DEFAULT_TEXT_AI_TREND_WIDGET_TOP_N);
}

export function parseTextAiWidgetDisplayChoice(value: string): TextAiWidgetDisplayChoice {
  if (value === 'custom') return 'custom';
  return parseTextAiWidgetTopN(value);
}

export function parseTextAiWidgetTopN(value: string): TextAiWidgetTopN {
  if (value === 'all') return 'all';
  const parsed = Number(value);
  if ((TEXT_AI_WIDGET_TOP_N_LIMITS as readonly number[]).includes(parsed)) {
    return parsed as TextAiWidgetTopN;
  }
  return DEFAULT_TEXT_AI_WIDGET_TOP_N;
}

export function getTextAiWidgetDisplaySelectOptions(
  includeCustom: boolean
): TextAiWidgetDisplaySelectOption[] {
  if (!includeCustom) return [...TEXT_AI_WIDGET_TOP_N_SELECT_OPTIONS];
  return [...TEXT_AI_WIDGET_TOP_N_SELECT_OPTIONS, TEXT_AI_WIDGET_CUSTOM_OPTION];
}

export function getTextAiWidgetDisplaySelectOption(
  value: TextAiWidgetDisplayChoice,
  includeCustom: boolean
): TextAiWidgetDisplaySelectOption {
  const options = getTextAiWidgetDisplaySelectOptions(includeCustom);
  const key = value === 'custom' ? 'custom' : value === 'all' ? 'all' : String(value);
  return options.find((option) => option.value === key) ?? options[0];
}

export function getTextAiWidgetTopNSelectOption(
  topN: TextAiWidgetTopN
): TextAiWidgetTopNSelectOption {
  const value = topN === 'all' ? 'all' : String(topN);
  return (
    TEXT_AI_WIDGET_TOP_N_SELECT_OPTIONS.find((option) => option.value === value) ??
    TEXT_AI_WIDGET_TOP_N_SELECT_OPTIONS[0]
  );
}

export function getTextAiWidgetCustomModeOption(
  mode: TextAiWidgetCustomMode
): TextAiWidgetCustomModeOption {
  return (
    TEXT_AI_WIDGET_CUSTOM_MODE_OPTIONS.find((option) => option.value === mode) ??
    TEXT_AI_WIDGET_CUSTOM_MODE_OPTIONS[0]
  );
}

export function limitTextAiWidgetItems<T>(
  items: readonly T[],
  topN: TextAiWidgetTopN
): T[] {
  if (topN === 'all') return [...items];
  return items.slice(0, topN);
}

export function applyTextAiWidgetDisplay<T extends { id: string; variancePercent?: number }>(
  items: readonly T[],
  display: TextAiWidgetDisplayState
): T[] {
  if (display.value !== 'custom') {
    return limitTextAiWidgetItems(items, display.value);
  }
  if (display.customMode === 'manual') {
    const selected = new Set(
      display.selectedIds.slice(0, TEXT_AI_WIDGET_CUSTOM_SELECTION_MAX)
    );
    return items.filter((item) => selected.has(item.id));
  }
  const threshold = Math.max(0, display.variancePercent);
  return items.filter((item) => Math.abs(item.variancePercent ?? 0) >= threshold);
}

export function formatTextAiWidgetTopNToast(topN: TextAiWidgetTopN): string {
  return topN === 'all' ? 'Showing all items' : `Showing Top ${topN}`;
}

export function formatTextAiWidgetDisplayToast(display: TextAiWidgetDisplayState): string {
  if (display.value !== 'custom') return formatTextAiWidgetTopNToast(display.value);
  if (display.customMode === 'manual') {
    const count = display.selectedIds.length;
    return count === 1
      ? 'Showing 1 selected sub-theme'
      : `Showing ${Math.min(count, TEXT_AI_WIDGET_CUSTOM_SELECTION_MAX)} selected sub-themes`;
  }
  return `Showing sub-themes with ${display.variancePercent}% or more variance`;
}
