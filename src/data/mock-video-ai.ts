export interface FilterOption {
  value: string;
  label: string;
}

export interface VideoAiQuestion {
  id: string;
  question: string;
  survey: string;
  responses: number;
  analyzed: number;
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  status: 'complete' | 'in-progress' | 'pending';
  date: string;
  dominantSentiment: 'mostly-positive' | 'mostly-negative' | 'mixed';
}

export const VIDEO_AI_QUESTIONS: VideoAiQuestion[] = [
  {
    id: 'vai-001',
    question: 'How do you feel about this social media post?',
    survey: 'Video AI',
    responses: 23,
    analyzed: 22,
    sentiment: { positive: 68, neutral: 23, negative: 9 },
    status: 'complete',
    date: 'Jun 03, 2026',
    dominantSentiment: 'mostly-positive',
  },
  {
    id: 'vai-002',
    question: 'What comes to mind when you see this brand logo?',
    survey: 'Brand Perception Q2',
    responses: 45,
    analyzed: 45,
    sentiment: { positive: 52, neutral: 30, negative: 18 },
    status: 'complete',
    date: 'May 28, 2026',
    dominantSentiment: 'mixed',
  },
  {
    id: 'vai-003',
    question: 'Describe your unboxing experience',
    survey: 'Product Testing Alpha',
    responses: 31,
    analyzed: 28,
    sentiment: { positive: 74, neutral: 19, negative: 7 },
    status: 'in-progress',
    date: 'Jun 01, 2026',
    dominantSentiment: 'mostly-positive',
  },
  {
    id: 'vai-004',
    question: 'What would you change about this ad?',
    survey: 'Ad Recall Study',
    responses: 18,
    analyzed: 18,
    sentiment: { positive: 22, neutral: 33, negative: 45 },
    status: 'complete',
    date: 'May 20, 2026',
    dominantSentiment: 'mostly-negative',
  },
  {
    id: 'vai-005',
    question: 'How does this packaging compare to competitors?',
    survey: 'Product Testing Alpha',
    responses: 31,
    analyzed: 31,
    sentiment: { positive: 41, neutral: 38, negative: 21 },
    status: 'complete',
    date: 'Jun 01, 2026',
    dominantSentiment: 'mixed',
  },
  {
    id: 'vai-006',
    question: 'Tell us about your first impression of the product video',
    survey: 'Brand Perception Q2',
    responses: 39,
    analyzed: 12,
    sentiment: { positive: 58, neutral: 25, negative: 17 },
    status: 'in-progress',
    date: 'Jun 06, 2026',
    dominantSentiment: 'mostly-positive',
  },
  {
    id: 'vai-007',
    question: 'What emotions does this campaign evoke?',
    survey: 'Ad Recall Study',
    responses: 18,
    analyzed: 18,
    sentiment: { positive: 61, neutral: 22, negative: 17 },
    status: 'complete',
    date: 'May 20, 2026',
    dominantSentiment: 'mostly-positive',
  },
  {
    id: 'vai-008',
    question: 'React to this product placement scene',
    survey: 'Video AI',
    responses: 15,
    analyzed: 0,
    sentiment: { positive: 0, neutral: 0, negative: 0 },
    status: 'pending',
    date: 'Jun 10, 2026',
    dominantSentiment: 'mixed',
  },
  {
    id: 'vai-009',
    question: 'How trustworthy does the spokesperson feel?',
    survey: 'Brand Perception Q2',
    responses: 42,
    analyzed: 42,
    sentiment: { positive: 35, neutral: 40, negative: 25 },
    status: 'complete',
    date: 'May 28, 2026',
    dominantSentiment: 'mixed',
  },
  {
    id: 'vai-010',
    question: 'Walk us through what you liked and disliked',
    survey: 'Product Testing Alpha',
    responses: 31,
    analyzed: 31,
    sentiment: { positive: 44, neutral: 29, negative: 27 },
    status: 'complete',
    date: 'Jun 01, 2026',
    dominantSentiment: 'mixed',
  },
  {
    id: 'vai-011',
    question: 'Does this ad make you want to learn more?',
    survey: 'Ad Recall Study',
    responses: 18,
    analyzed: 15,
    sentiment: { positive: 47, neutral: 33, negative: 20 },
    status: 'in-progress',
    date: 'May 22, 2026',
    dominantSentiment: 'mixed',
  },
  {
    id: 'vai-012',
    question: 'Share your thoughts on the new flavor range',
    survey: 'Video AI',
    responses: 8,
    analyzed: 0,
    sentiment: { positive: 0, neutral: 0, negative: 0 },
    status: 'pending',
    date: 'Jun 09, 2026',
    dominantSentiment: 'mixed',
  },
];

export const VIDEO_AI_SURVEY_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'All surveys' },
  ...Array.from(new Set(VIDEO_AI_QUESTIONS.map((q) => q.survey))).map((s) => ({
    value: s,
    label: s,
  })),
];

export const VIDEO_AI_STATUS_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'complete', label: 'Active' },
  { value: 'in-progress', label: 'Closed' },
];

export const VIDEO_AI_SENTIMENT_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'All sentiments' },
  { value: 'mostly-positive', label: 'Mostly positive' },
  { value: 'mostly-negative', label: 'Mostly negative' },
  { value: 'mixed', label: 'Mixed' },
];
