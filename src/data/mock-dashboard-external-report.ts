export interface DashboardExternalReportThemeRow {
  id: string;
  theme: string;
  count: number;
  percentage: number;
}

/** Sample TextAI external report shown when an external TextAI report tab is active. */
export const SAMPLE_TEXT_AI_EXTERNAL_REPORT = {
  title: 'Why did you select ${NPS}?',
  themeFilterLabel: 'Select theme',
  subthemeFilterLabel: 'Select sub-theme',
  sentimentFilterLabel: 'Sentiment',
  rows: [
    {
      id: 'loan-product',
      theme: 'Loan and product access',
      count: 12124,
      percentage: 41.5,
    },
    {
      id: 'apps-digital',
      theme: 'Applications and digital access',
      count: 3841,
      percentage: 13.1,
    },
    {
      id: 'staff-assistance',
      theme: 'Staff assistance and support',
      count: 3012,
      percentage: 10.3,
    },
    {
      id: 'service-quality',
      theme: 'Service quality and reliability',
      count: 2688,
      percentage: 9.2,
    },
    {
      id: 'branch-experience',
      theme: 'Branch experience and convenience',
      count: 2140,
      percentage: 7.3,
    },
    {
      id: 'fees-pricing',
      theme: 'Fees, pricing, and value',
      count: 1895,
      percentage: 6.5,
    },
    {
      id: 'communication',
      theme: 'Communication and transparency',
      count: 1560,
      percentage: 5.3,
    },
    {
      id: 'other-feedback',
      theme: 'Other feedback',
      count: 1980,
      percentage: 6.8,
    },
  ] satisfies DashboardExternalReportThemeRow[],
} as const;

export const SAMPLE_TEXT_AI_EXTERNAL_REPORT_THEMES = [
  { value: 'all', label: 'Select theme' },
  ...SAMPLE_TEXT_AI_EXTERNAL_REPORT.rows.map((row) => ({
    value: row.id,
    label: row.theme,
  })),
];

export const SAMPLE_TEXT_AI_EXTERNAL_REPORT_SUBTHEMES = [
  { value: 'all', label: 'Select sub-theme' },
  { value: 'access', label: 'Access' },
  { value: 'support', label: 'Support' },
  { value: 'digital', label: 'Digital' },
];

export const SAMPLE_TEXT_AI_EXTERNAL_REPORT_SENTIMENTS = [
  { value: 'all', label: 'Sentiment' },
  { value: 'positive', label: 'Positive' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'negative', label: 'Negative' },
];
