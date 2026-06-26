import type { SentimentValue } from '@/data/mock-video-ai-detail';

/** Chart / bar segment colors — saturated green, amber, red per QuestionPro BI. */
export const SENTIMENT_CHART_COLORS: Record<SentimentValue, string> = {
  Positive: '#16a34a',
  Neutral: '#d97706',
  Negative: '#dc2626',
};

/** Badge / pill tints — aligned with Text AI analysis widgets. */
export const SENTIMENT_BADGE_COLORS: Record<
  SentimentValue,
  { bg: string; text: string }
> = {
  Positive: { bg: '#edf7ed', text: '#2e7d32' },
  Neutral: { bg: '#fff4e5', text: '#b26a00' },
  Negative: { bg: '#ffebee', text: '#c62828' },
};
