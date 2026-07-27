export type TextAiSentimentBucket =
  | 'veryNegative'
  | 'negative'
  | 'mixed'
  | 'neutral'
  | 'positive'
  | 'veryPositive';

export type TextAiSentimentDistribution = Record<TextAiSentimentBucket, number>;

export interface TextAiSubthemeSentimentRow {
  emerging?: boolean;
  id: string;
  label: string;
  sentiment: TextAiSentimentDistribution;
}

export interface TextAiThemeSentimentRow extends TextAiSubthemeSentimentRow {
  subthemes: TextAiSubthemeSentimentRow[];
}

export const TEXT_AI_SUBTHEME_STACKBAR_ROWS: TextAiThemeSentimentRow[] = [
  {
    id: 'customer-experience-feedback',
    label: 'Customer Experience Feedback Analysis',
    sentiment: {
      veryNegative: 5,
      negative: 6,
      mixed: 1,
      neutral: 14,
      positive: 44,
      veryPositive: 30,
    },
    subthemes: [
      {
        id: 'customer-experience-improvement',
        label: 'Customer Experience Improvement',
        sentiment: {
          veryNegative: 0,
          negative: 2,
          mixed: 2,
          neutral: 5,
          positive: 78,
          veryPositive: 13,
        },
      },
      {
        id: 'customer-experience-differentiation',
        emerging: true,
        label: 'Customer Experience Differentiation',
        sentiment: {
          veryNegative: 0,
          negative: 4,
          mixed: 0,
          neutral: 20,
          positive: 68,
          veryPositive: 8,
        },
      },
      {
        id: 'customer-service-experience',
        label: 'Customer Service Experience Analysis',
        sentiment: {
          veryNegative: 0,
          negative: 18,
          mixed: 9,
          neutral: 27,
          positive: 46,
          veryPositive: 0,
        },
      },
      {
        id: 'customer-feedback-analysis',
        label: 'Customer Experience Feedback Analysis',
        sentiment: {
          veryNegative: 8,
          negative: 4,
          mixed: 0,
          neutral: 13,
          positive: 34,
          veryPositive: 41,
        },
      },
      {
        id: 'customer-feedback-gaps',
        emerging: true,
        label: 'Customer Experience Feedback Gaps',
        sentiment: {
          veryNegative: 0,
          negative: 50,
          mixed: 0,
          neutral: 50,
          positive: 0,
          veryPositive: 0,
        },
      },
    ],
  },
  {
    emerging: true,
    id: 'staff-service-interaction',
    label: 'Staff Service Interaction Analysis',
    sentiment: {
      veryNegative: 10,
      negative: 27,
      mixed: 2,
      neutral: 0,
      positive: 56,
      veryPositive: 5,
    },
    subthemes: [
      {
        id: 'staff-friendliness',
        label: 'Staff Friendliness and Professionalism',
        sentiment: {
          veryNegative: 2,
          negative: 4,
          mixed: 0,
          neutral: 2,
          positive: 82,
          veryPositive: 10,
        },
      },
      {
        id: 'staff-courtesy',
        label: 'Staff Interaction and Courtesy',
        sentiment: {
          veryNegative: 4,
          negative: 12,
          mixed: 5,
          neutral: 10,
          positive: 61,
          veryPositive: 8,
        },
      },
      {
        id: 'staff-service-attitude',
        label: 'Staff Service Attitude Analysis',
        sentiment: {
          veryNegative: 38,
          negative: 58,
          mixed: 2,
          neutral: 2,
          positive: 0,
          veryPositive: 0,
        },
      },
      {
        id: 'staff-response-time',
        label: 'Staff Response Time and Availability',
        sentiment: {
          veryNegative: 8,
          negative: 24,
          mixed: 6,
          neutral: 12,
          positive: 46,
          veryPositive: 4,
        },
      },
    ],
  },
  {
    id: 'food-freshness',
    label: 'Food Freshness and Temperature Concerns',
    sentiment: {
      veryNegative: 7,
      negative: 32,
      mixed: 6,
      neutral: 5,
      positive: 45,
      veryPositive: 5,
    },
    subthemes: [
      {
        id: 'food-temperature',
        label: 'Food Temperature and Freshness',
        sentiment: {
          veryNegative: 12,
          negative: 42,
          mixed: 8,
          neutral: 6,
          positive: 30,
          veryPositive: 2,
        },
      },
      {
        id: 'fries-quality',
        label: 'Fries Quality and Consistency',
        sentiment: {
          veryNegative: 9,
          negative: 38,
          mixed: 7,
          neutral: 10,
          positive: 32,
          veryPositive: 4,
        },
      },
      {
        id: 'food-quality',
        label: 'Overall Food Quality',
        sentiment: {
          veryNegative: 3,
          negative: 17,
          mixed: 5,
          neutral: 8,
          positive: 58,
          veryPositive: 9,
        },
      },
    ],
  },
  {
    id: 'overall-experience',
    label: 'Overall Experience',
    sentiment: {
      veryNegative: 3,
      negative: 42,
      mixed: 5,
      neutral: 14,
      positive: 33,
      veryPositive: 3,
    },
    subthemes: [
      {
        id: 'brand-expectations',
        label: 'Brand Expectation Alignment',
        sentiment: {
          veryNegative: 5,
          negative: 24,
          mixed: 7,
          neutral: 16,
          positive: 42,
          veryPositive: 6,
        },
      },
      {
        id: 'menu-accessibility',
        label: 'Menu Clarity and Accessibility',
        sentiment: {
          veryNegative: 3,
          negative: 19,
          mixed: 8,
          neutral: 21,
          positive: 44,
          veryPositive: 5,
        },
      },
      {
        id: 'service-flow',
        emerging: true,
        label: 'Service Flow Consistency',
        sentiment: {
          veryNegative: 8,
          negative: 35,
          mixed: 6,
          neutral: 15,
          positive: 33,
          veryPositive: 3,
        },
      },
    ],
  },
  {
    id: 'service-speed',
    label: 'Service Speed and Efficiency Analysis',
    sentiment: {
      veryNegative: 5,
      negative: 33,
      mixed: 2,
      neutral: 1,
      positive: 56,
      veryPositive: 3,
    },
    subthemes: [
      {
        id: 'fast-service',
        label: 'Fast Service Expectations and Delivery',
        sentiment: {
          veryNegative: 2,
          negative: 18,
          mixed: 3,
          neutral: 5,
          positive: 65,
          veryPositive: 7,
        },
      },
      {
        id: 'wait-times',
        label: 'Wait Time and Queue Management',
        sentiment: {
          veryNegative: 13,
          negative: 51,
          mixed: 4,
          neutral: 7,
          positive: 23,
          veryPositive: 2,
        },
      },
      {
        id: 'order-handoff',
        label: 'Order Preparation and Handoff',
        sentiment: {
          veryNegative: 5,
          negative: 31,
          mixed: 6,
          neutral: 11,
          positive: 43,
          veryPositive: 4,
        },
      },
    ],
  },
  {
    id: 'drive-thru',
    label: 'Drive-Thru Customer Experience Challenges',
    sentiment: {
      veryNegative: 10,
      negative: 59,
      mixed: 1,
      neutral: 6,
      positive: 24,
      veryPositive: 0,
    },
    subthemes: [
      {
        id: 'drive-thru-delays',
        label: 'Drive-Thru Delays',
        sentiment: {
          veryNegative: 16,
          negative: 64,
          mixed: 2,
          neutral: 5,
          positive: 13,
          veryPositive: 0,
        },
      },
      {
        id: 'drive-thru-accuracy',
        label: 'Drive-Thru Order Accuracy',
        sentiment: {
          veryNegative: 12,
          negative: 49,
          mixed: 4,
          neutral: 9,
          positive: 24,
          veryPositive: 2,
        },
      },
      {
        id: 'drive-thru-convenience',
        label: 'Drive-Thru Convenience',
        sentiment: {
          veryNegative: 3,
          negative: 18,
          mixed: 5,
          neutral: 8,
          positive: 57,
          veryPositive: 9,
        },
      },
    ],
  },
];
