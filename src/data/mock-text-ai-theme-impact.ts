export interface TextAiThemeImpactRow {
  id: string;
  label: string;
  emerging?: boolean;
  /** Regression coefficient for a negative mention. Always <= 0. */
  negativeImpact: number;
  /** Regression coefficient for a positive mention. Always >= 0. */
  positiveImpact: number;
  /** Points this theme contributes to the overall score. */
  netImpact: number;
  mentionCount: number;
}

export const TEXT_AI_THEME_IMPACT_AXIS_MAX = 0.8;

export const TEXT_AI_THEME_IMPACT_FOOTNOTE =
  'Bars are regression coefficients: how far one mention of this theme pulls a single respondent’s rating, separately for negative and positive mentions. A long red bar with a short green one is a hygiene driver — customers expect it and react strongly only when it fails. Net impact weights those coefficients by how often the theme is actually mentioned, so it shows the points this theme contributes to the overall score.';

export const TEXT_AI_THEME_IMPACT_ROWS: readonly TextAiThemeImpactRow[] = [
  {
    id: 'overall-experience',
    label: 'Overall Experience',
    negativeImpact: -0.35,
    positiveImpact: 0.52,
    netImpact: 11.1,
    mentionCount: 349,
  },
  {
    id: 'staff-service-interaction',
    label: 'Staff Service Interaction',
    negativeImpact: -0.58,
    positiveImpact: 0.61,
    netImpact: 9.4,
    mentionCount: 293,
  },
  {
    id: 'food-freshness',
    label: 'Food Freshness & Temperature',
    negativeImpact: -0.72,
    positiveImpact: 0.18,
    netImpact: -5.6,
    mentionCount: 241,
  },
  {
    id: 'service-speed',
    label: 'Service Speed & Efficiency',
    negativeImpact: -0.41,
    positiveImpact: 0.44,
    netImpact: 6.2,
    mentionCount: 218,
  },
  {
    id: 'drive-thru',
    label: 'Drive-Thru Experience',
    negativeImpact: -0.68,
    positiveImpact: 0.22,
    netImpact: -8.4,
    mentionCount: 186,
  },
  {
    id: 'food-quality',
    label: 'Food Quality & Taste',
    negativeImpact: -0.29,
    positiveImpact: 0.48,
    netImpact: 7.8,
    mentionCount: 174,
  },
  {
    id: 'order-accuracy',
    label: 'Order Accuracy',
    negativeImpact: -0.63,
    positiveImpact: 0.27,
    netImpact: -3.1,
    mentionCount: 152,
  },
  {
    id: 'value-for-money',
    label: 'Value for Money',
    negativeImpact: -0.47,
    positiveImpact: 0.33,
    netImpact: 2.4,
    mentionCount: 138,
  },
  {
    id: 'cleanliness',
    label: 'Cleanliness',
    negativeImpact: -0.54,
    positiveImpact: 0.39,
    netImpact: 4.1,
    mentionCount: 121,
  },
  {
    id: 'menu-variety',
    label: 'Menu Variety and Seasonal Limited-Time Offer Availability Across Dayparts',
    negativeImpact: -0.21,
    positiveImpact: 0.36,
    netImpact: 5.3,
    mentionCount: 98,
  },
  {
    id: 'wait-experience',
    label: 'Wait Experience',
    negativeImpact: -0.16,
    positiveImpact: 0.12,
    netImpact: 0.8,
    mentionCount: 22,
  },
];

export function formatThemeImpactCoefficient(value: number): string {
  const formatted = Math.abs(value).toFixed(2);
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `−${formatted}`;
  return formatted;
}

export function formatThemeNetImpact(value: number): string {
  const formatted = Math.abs(value).toFixed(1);
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `−${formatted}`;
  return formatted;
}
