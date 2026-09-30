import type { CSSProperties } from 'react';
import type { DesignTypographyOptions } from '@/data/dashboard-design';

/** TextAI widget sizing is independent of the larger BI presentation scale. */
export function getTextAiTypographyCssVars(typography: DesignTypographyOptions): CSSProperties {
  const sizes = {
    'extra-small': { title: 12, body: 11, metric: 24 },
    small: { title: 14, body: 12, metric: 28 },
    medium: { title: 16, body: 13, metric: 32 },
    large: { title: 18, body: 14, metric: 36 },
    'extra-large': { title: 20, body: 16, metric: 40 },
  };
  const selected = sizes[typography.fontSize.value as keyof typeof sizes] ?? sizes.medium;
  return {
    '--text-ai-card-radius': '8px',
    '--dashboard-widget-title-weight': typography.fontStyle.value === 'bold' ? '600' : '500',
    '--dashboard-widget-title-size': `${selected.title}px`,
    '--dashboard-widget-body-size': `${selected.body}px`,
    '--dashboard-widget-metric-size': `${selected.metric}px`,
    '--dashboard-widget-font-family': typography.fontFamily.value,
    '--dashboard-widget-font-style': typography.fontStyle.value === 'italic' ? 'italic' : 'normal',
    '--dashboard-widget-font-weight': typography.fontStyle.value === 'bold' ? '600' : '400',
    fontFamily: typography.fontFamily.value,
    fontStyle: typography.fontStyle.value === 'italic' ? 'italic' : 'normal',
    fontWeight: typography.fontStyle.value === 'bold' ? 600 : 400,
  } as CSSProperties;
}
