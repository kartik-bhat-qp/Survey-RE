export const TEXT_AI_WIDGET_TOP_N_LIMITS = [3, 5, 10] as const;

export type TextAiWidgetTopN = 'all' | (typeof TEXT_AI_WIDGET_TOP_N_LIMITS)[number];

/** First option: show all themes/topics. */
export const DEFAULT_TEXT_AI_WIDGET_TOP_N: TextAiWidgetTopN = 'all';

export const TEXT_AI_WIDGET_TOP_N_SELECT_OPTIONS = [
  { value: 'all', label: 'Default' },
  ...TEXT_AI_WIDGET_TOP_N_LIMITS.map((value) => ({
    value: String(value),
    label: `Top ${value}`,
  })),
] as const;

export type TextAiWidgetTopNSelectOption =
  (typeof TEXT_AI_WIDGET_TOP_N_SELECT_OPTIONS)[number];

export function parseTextAiWidgetTopN(value: string): TextAiWidgetTopN {
  if (value === 'all') return 'all';
  const parsed = Number(value);
  if (parsed === 3 || parsed === 5 || parsed === 10) return parsed;
  return DEFAULT_TEXT_AI_WIDGET_TOP_N;
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

export function limitTextAiWidgetItems<T>(
  items: readonly T[],
  topN: TextAiWidgetTopN
): T[] {
  if (topN === 'all') return [...items];
  return items.slice(0, topN);
}

export function formatTextAiWidgetTopNToast(topN: TextAiWidgetTopN): string {
  return topN === 'all' ? 'Showing all items' : `Showing Top ${topN}`;
}
