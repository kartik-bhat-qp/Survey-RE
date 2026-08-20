export type TextAiKpiId = 'visit-rating' | 'nps' | 'csat' | 'return-likelihood';

export type TextAiKpiKind = 'mean' | 'nps' | 'top-box';
export type TextAiKpiSentiment = 'positive' | 'neutral' | 'negative';
export type TextAiKpiDeltaTone = 'positive' | 'neutral' | 'negative';

export interface TextAiKpiDefinition {
  id: TextAiKpiId;
  code: string;
  label: string;
  question: string;
  kind: TextAiKpiKind;
  scaleMin: number;
  scaleMax: number;
}

export interface TextAiKpiThemeTag {
  theme: string;
  subtheme: string;
}

export interface TextAiKpiResponse {
  id: string;
  text: string;
  sentiment: TextAiKpiSentiment;
  tags: TextAiKpiThemeTag[];
  answers: Partial<Record<TextAiKpiId, number>>;
}

export interface TextAiKpiSentimentDistribution {
  positive: number;
  neutral: number;
  negative: number;
}

export interface TextAiKpiThemeResult {
  id: string;
  label: string;
  responseCount: number;
  score: number;
  delta: number;
  tone: TextAiKpiDeltaTone;
  lowSample: boolean;
  sentiment: TextAiKpiSentimentDistribution;
  responses: TextAiKpiResponse[];
  subthemes?: TextAiKpiThemeResult[];
}

export interface TextAiKpiAnalysis {
  definition: TextAiKpiDefinition;
  pairedResponseCount: number;
  overallScore: number;
  sentiment: TextAiKpiSentimentDistribution;
  rows: TextAiKpiThemeResult[];
}

export interface TextAiKpiWidgetInstance {
  id: string;
  question: string;
}

interface ThemeDefinition {
  name: string;
  subthemes: readonly string[];
}

const LOW_SAMPLE_THRESHOLD = 30;

const THEME_DEFINITIONS: readonly ThemeDefinition[] = [
  {
    name: 'Overall Experience',
    subthemes: ['Satisfaction with visit', 'Value for money', 'Likelihood to return'],
  },
  {
    name: 'Customer Experience Feedback Analysis',
    subthemes: ['Friendly atmosphere', 'Family experience', 'Consistent experience'],
  },
  {
    name: 'Staff Service Interaction Analysis',
    subthemes: ['Friendly staff', 'Helpful service', 'Order taking'],
  },
  {
    name: 'Food Freshness and Temperature Concerns',
    subthemes: ['Freshly prepared food', 'Food temperature', 'Ingredient quality'],
  },
  {
    name: 'Service Speed and Efficiency Analysis',
    subthemes: ['Quick service', 'Wait time', 'Peak-hour efficiency'],
  },
  {
    name: 'Order Fulfillment Accuracy Challenges',
    subthemes: ['Missing items', 'Incorrect order', 'Customization accuracy'],
  },
  {
    name: 'Drive-Thru Customer Experience Challenges',
    subthemes: ['Drive-thru wait', 'Speaker communication', 'Pickup accuracy'],
  },
  {
    name: 'Restaurant Cleanliness and Safety Concerns',
    subthemes: ['Dining area cleanliness', 'Restroom cleanliness', 'Food safety'],
  },
] as const;

export const TEXT_AI_KPI_DEFINITIONS: readonly TextAiKpiDefinition[] = [
  {
    id: 'visit-rating',
    code: 'Q4',
    label: 'Visit rating',
    question: 'How would you rate your overall visit?',
    kind: 'mean',
    scaleMin: 1,
    scaleMax: 5,
  },
  {
    id: 'nps',
    code: 'Q7',
    label: 'Net Promoter Score',
    question: 'How likely are you to recommend us to a friend or colleague?',
    kind: 'nps',
    scaleMin: 0,
    scaleMax: 10,
  },
  {
    id: 'csat',
    code: 'Q8',
    label: 'Customer satisfaction',
    question: 'How satisfied were you with your experience?',
    kind: 'top-box',
    scaleMin: 1,
    scaleMax: 5,
  },
  {
    id: 'return-likelihood',
    code: 'Q9',
    label: 'Likelihood to return',
    question: 'How likely are you to visit us again?',
    kind: 'mean',
    scaleMin: 1,
    scaleMax: 5,
  },
] as const;

const RATING_COUNTS = [359, 140, 206, 253, 542] as const;

function createRatingValues(): number[] {
  return RATING_COUNTS.flatMap((count, index) =>
    Array.from({ length: count }, () => index + 1)
  );
}

function resolveThemeIndex(rating: number, indexWithinRating: number): number {
  const choicesByRating: Record<number, readonly number[]> = {
    1: [5, 6, 7, 4, 5, 6],
    2: [4, 5, 6, 7, 4],
    3: [0, 1, 2, 3, 4],
    4: [0, 1, 2, 3, 4, 0],
    5: [0, 1, 2, 3, 0, 2],
  };
  const choices = choicesByRating[rating] ?? [0];
  return choices[indexWithinRating % choices.length];
}

function resolveSubthemeIndex(themeIndex: number, responseIndex: number): number {
  if (themeIndex === 7) {
    return responseIndex % 19 === 0 ? 2 : responseIndex % 2;
  }
  return (responseIndex * 7 + themeIndex) % 3;
}

function resolveSentiment(rating: number, responseIndex: number): TextAiKpiSentiment {
  const expected: TextAiKpiSentiment =
    rating >= 4 ? 'positive' : rating === 3 ? 'neutral' : 'negative';
  if (responseIndex % 11 !== 0) return expected;
  if (expected === 'positive') return 'neutral';
  if (expected === 'negative') return 'neutral';
  return responseIndex % 22 === 0 ? 'positive' : 'negative';
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function createAnswerSet(
  rating: number,
  responseIndex: number
): Partial<Record<TextAiKpiId, number>> {
  const answers: Partial<Record<TextAiKpiId, number>> = {
    'visit-rating': rating,
  };

  if (responseIndex % 5 !== 0) {
    const npsBaseByRating = [0, 1, 4, 6, 8, 10];
    answers.nps = clamp(
      npsBaseByRating[rating] + ((responseIndex % 3) - 1),
      0,
      10
    );
  }
  if (responseIndex % 4 !== 0) {
    answers.csat = clamp(rating + (responseIndex % 9 === 0 ? -1 : 0), 1, 5);
  }
  if (responseIndex % 3 !== 0) {
    answers['return-likelihood'] = clamp(
      rating + (responseIndex % 8 === 0 ? -1 : responseIndex % 13 === 0 ? 1 : 0),
      1,
      5
    );
  }
  return answers;
}

const RESPONSE_PHRASES: Record<TextAiKpiSentiment, readonly string[]> = {
  positive: [
    'The visit went smoothly and the team made the experience enjoyable.',
    'Everything felt well organized, friendly, and worth coming back for.',
    'The service was welcoming and the overall experience exceeded expectations.',
  ],
  neutral: [
    'The experience was acceptable, though a few details could be more consistent.',
    'Most of the visit was fine, with some room to improve the overall experience.',
    'Nothing stood out strongly, but the experience generally met expectations.',
  ],
  negative: [
    'The experience fell short and the issue made the visit frustrating.',
    'This part of the visit needs attention before I would feel comfortable returning.',
    'The problem affected the whole experience and should be addressed quickly.',
  ],
};

function createResponses(): TextAiKpiResponse[] {
  const ratingValues = createRatingValues();
  const seenWithinRating = new Map<number, number>();

  return ratingValues.map((rating, responseIndex) => {
    const indexWithinRating = seenWithinRating.get(rating) ?? 0;
    seenWithinRating.set(rating, indexWithinRating + 1);
    const primaryThemeIndex = resolveThemeIndex(rating, indexWithinRating);
    const primaryTheme = THEME_DEFINITIONS[primaryThemeIndex];
    const primarySubtheme =
      primaryTheme.subthemes[resolveSubthemeIndex(primaryThemeIndex, responseIndex)];
    const tags: TextAiKpiThemeTag[] = [
      { theme: primaryTheme.name, subtheme: primarySubtheme },
    ];

    if (responseIndex % 7 === 0) {
      const secondaryThemeIndex = (primaryThemeIndex + 3 + (responseIndex % 2)) % 8;
      const secondaryTheme = THEME_DEFINITIONS[secondaryThemeIndex];
      tags.push({
        theme: secondaryTheme.name,
        subtheme:
          secondaryTheme.subthemes[
            resolveSubthemeIndex(secondaryThemeIndex, responseIndex + 1)
          ],
      });
    }

    const sentiment = resolveSentiment(rating, responseIndex);
    const phrase = RESPONSE_PHRASES[sentiment][responseIndex % 3];
    return {
      id: `R-${String(640001 + responseIndex)}`,
      text: `${phrase} ${primarySubtheme} was the main reason for my rating.`,
      sentiment,
      tags,
      answers: createAnswerSet(rating, responseIndex),
    };
  });
}

export const TEXT_AI_KPI_RESPONSES: readonly TextAiKpiResponse[] = createResponses();

function uniqueResponses(responses: readonly TextAiKpiResponse[]): TextAiKpiResponse[] {
  return [...new Map(responses.map((response) => [response.id, response])).values()];
}

function calculateScore(
  definition: TextAiKpiDefinition,
  responses: readonly TextAiKpiResponse[]
): number {
  const values = responses.flatMap((response) => {
    const value = response.answers[definition.id];
    return value === undefined ? [] : [value];
  });
  if (values.length === 0) return 0;

  if (definition.kind === 'nps') {
    const promoters = values.filter((value) => value >= 9).length;
    const detractors = values.filter((value) => value <= 6).length;
    return ((promoters - detractors) / values.length) * 100;
  }
  if (definition.kind === 'top-box') {
    const satisfied = values.filter((value) => value >= 4).length;
    return (satisfied / values.length) * 100;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateSentiment(
  responses: readonly TextAiKpiResponse[]
): TextAiKpiSentimentDistribution {
  if (responses.length === 0) return { positive: 0, neutral: 0, negative: 0 };
  const count = (sentiment: TextAiKpiSentiment) =>
    responses.filter((response) => response.sentiment === sentiment).length;
  return {
    positive: (count('positive') / responses.length) * 100,
    neutral: (count('neutral') / responses.length) * 100,
    negative: (count('negative') / responses.length) * 100,
  };
}

function resolveDeltaTone(
  definition: TextAiKpiDefinition,
  delta: number,
  responseCount: number
): TextAiKpiDeltaTone {
  if (responseCount < LOW_SAMPLE_THRESHOLD) return 'neutral';
  const threshold = definition.kind === 'mean' ? 0.05 : definition.kind === 'nps' ? 2 : 1;
  if (delta > threshold) return 'positive';
  if (delta < -threshold) return 'negative';
  return 'neutral';
}

function createResult(
  id: string,
  label: string,
  definition: TextAiKpiDefinition,
  overallScore: number,
  responses: readonly TextAiKpiResponse[],
  subthemes?: TextAiKpiThemeResult[]
): TextAiKpiThemeResult {
  const deduplicated = uniqueResponses(responses);
  const score = calculateScore(definition, deduplicated);
  const delta = score - overallScore;
  return {
    id,
    label,
    responseCount: deduplicated.length,
    score,
    delta,
    tone: resolveDeltaTone(definition, delta, deduplicated.length),
    lowSample: deduplicated.length < LOW_SAMPLE_THRESHOLD,
    sentiment: calculateSentiment(deduplicated),
    responses: deduplicated,
    subthemes,
  };
}

export function getTextAiKpiAnalysis(kpiId: TextAiKpiId): TextAiKpiAnalysis {
  const definition =
    TEXT_AI_KPI_DEFINITIONS.find((candidate) => candidate.id === kpiId) ??
    TEXT_AI_KPI_DEFINITIONS[0];
  const pairedResponses = TEXT_AI_KPI_RESPONSES.filter(
    (response) => response.answers[definition.id] !== undefined
  );
  const overallScore = calculateScore(definition, pairedResponses);

  const rows = THEME_DEFINITIONS.map((theme, themeIndex) => {
    const themeResponses = pairedResponses.filter((response) =>
      response.tags.some((tag) => tag.theme === theme.name)
    );
    const subthemes = theme.subthemes.map((subtheme, subthemeIndex) => {
      const responses = themeResponses.filter((response) =>
        response.tags.some(
          (tag) => tag.theme === theme.name && tag.subtheme === subtheme
        )
      );
      return createResult(
        `theme-${themeIndex}-subtheme-${subthemeIndex}`,
        subtheme,
        definition,
        overallScore,
        responses
      );
    });
    return createResult(
      `theme-${themeIndex}`,
      theme.name,
      definition,
      overallScore,
      themeResponses,
      subthemes
    );
  });

  return {
    definition,
    pairedResponseCount: pairedResponses.length,
    overallScore,
    sentiment: calculateSentiment(pairedResponses),
    rows,
  };
}

export function getDefaultTextAiKpiId(): TextAiKpiId {
  return TEXT_AI_KPI_DEFINITIONS.reduce(
    (best, definition) => {
      const pairedCount = TEXT_AI_KPI_RESPONSES.filter(
        (response) => response.answers[definition.id] !== undefined
      ).length;
      return pairedCount > best.pairedCount
        ? { id: definition.id, pairedCount }
        : best;
    },
    { id: TEXT_AI_KPI_DEFINITIONS[0].id, pairedCount: -1 }
  ).id;
}

export function formatTextAiKpiScore(
  definition: TextAiKpiDefinition,
  score: number
): string {
  if (definition.kind === 'nps') return String(Math.round(score));
  if (definition.kind === 'top-box') return `${score.toFixed(1)}%`;
  return `${score.toFixed(2)} / ${definition.scaleMax}`;
}

export function formatTextAiKpiDelta(
  definition: TextAiKpiDefinition,
  delta: number
): string {
  const prefix = delta > 0 ? '+' : '';
  if (definition.kind === 'nps') return `${prefix}${Math.round(delta)}`;
  if (definition.kind === 'top-box') return `${prefix}${delta.toFixed(1)} pts`;
  return `${prefix}${delta.toFixed(2)}`;
}

export function formatTextAiKpiAnswer(
  definition: TextAiKpiDefinition,
  value: number
): string {
  if (definition.kind === 'nps') return `${value} / 10`;
  return `${value} / ${definition.scaleMax}`;
}
