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
  collectedOn?: string;
  analysisStatus?: 'completed' | 'pending' | 'failed';
}

export interface TextAiKpiSentimentDistribution {
  positive: number;
  neutral: number;
  negative: number;
}

export interface TextAiKpiThemeResult {
  id: string;
  label: string;
  parentTheme?: string;
  responseCount: number;
  score: number | null;
  impact: number | null;
  excludingScore: number | null;
  comparisonCount: number;
  responseShare: number;
  unavailableReason: 'No matching responses' | 'No comparison group' | null;
  tone: TextAiKpiDeltaTone;
  lowSample: boolean;
  sentiment: TextAiKpiSentimentDistribution;
  responses: TextAiKpiResponse[];
  subthemes?: TextAiKpiThemeResult[];
}

export interface TextAiKpiAnalysis {
  definition: TextAiKpiDefinition;
  pairedResponseCount: number;
  overallScore: number | null;
  sourceResponseCount: number;
  scoredResponseCount: number;
  coverage: number | null;
  sentiment: TextAiKpiSentimentDistribution;
  rows: TextAiKpiThemeResult[];
}

export interface TextAiKpiWidgetInstance {
  id: string;
  question: string;
  kpiId?: TextAiKpiId;
  name?: string;
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
      collectedOn: `2026-09-${String(1 + (responseIndex % 28)).padStart(2, '0')}`,
      analysisStatus: 'completed',
    };
  });
}

export const TEXT_AI_KPI_RESPONSES: readonly TextAiKpiResponse[] = createResponses();

function uniqueResponses(responses: readonly TextAiKpiResponse[]): TextAiKpiResponse[] {
  return [...new Map(responses.map((response) => [response.id, response])).values()];
}

/** Only complete, nonblank analyzed text with a finite in-range KPI enters the base. */
function hasValidAnswer(definition: TextAiKpiDefinition, response: TextAiKpiResponse): boolean {
  const value = response.answers[definition.id];
  return typeof value === 'number' && Number.isFinite(value) &&
    value >= definition.scaleMin && value <= definition.scaleMax &&
    (definition.kind !== 'nps' || Number.isInteger(value));
}

function calculateScore(definition: TextAiKpiDefinition, responses: readonly TextAiKpiResponse[]): number | null {
  if (!responses.length) return null;
  const values = responses.map(response => response.answers[definition.id]!);
  if (definition.kind === 'nps') {
    return 100 * (values.filter(value => value >= 9).length - values.filter(value => value <= 6).length) / values.length;
  }
  if (definition.kind === 'top-box') return 100 * values.filter(value => value >= 4).length / values.length;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateSentiment(responses: readonly TextAiKpiResponse[]): TextAiKpiSentimentDistribution {
  const share = (sentiment: TextAiKpiSentiment) => responses.length
    ? 100 * responses.filter(response => response.sentiment === sentiment).length / responses.length : 0;
  return { positive: share('positive'), neutral: share('neutral'), negative: share('negative') };
}

function createResult(
  id: string, label: string, definition: TextAiKpiDefinition,
  base: readonly TextAiKpiResponse[], responses: readonly TextAiKpiResponse[],
  options?: { parentTheme?: string; subthemes?: TextAiKpiThemeResult[] }
): TextAiKpiThemeResult {
  const matched = uniqueResponses(responses);
  const ids = new Set(matched.map(response => response.id));
  const remaining = base.filter(response => !ids.has(response.id));
  const overallScore = calculateScore(definition, base);
  const excludingScore = calculateScore(definition, remaining);
  const unavailableReason = !matched.length ? 'No matching responses' : !remaining.length ? 'No comparison group' : null;
  const impact = unavailableReason || overallScore === null || excludingScore === null ? null : overallScore - excludingScore;
  return {
    id, label, parentTheme: options?.parentTheme,
    responseCount: matched.length, responseShare: base.length ? 100 * matched.length / base.length : 0,
    score: calculateScore(definition, matched), excludingScore, comparisonCount: remaining.length,
    impact, unavailableReason,
    tone: impact === null || Math.abs(impact) < 1e-10 ? 'neutral' : impact > 0 ? 'positive' : 'negative',
    lowSample: matched.length > 0 && (matched.length < LOW_SAMPLE_THRESHOLD || remaining.length < LOW_SAMPLE_THRESHOLD),
    sentiment: calculateSentiment(matched), responses: matched, subthemes: options?.subthemes,
  };
}

export interface TextAiKpiResponseFilter { query?: string; start?: string; end?: string }

export function analyzeTextAiKpiResponses(
  kpiId: TextAiKpiId,
  responses: readonly TextAiKpiResponse[],
  filter: TextAiKpiResponseFilter | readonly TextAiKpiResponseFilter[] = {}
): TextAiKpiAnalysis {
  const definition = TEXT_AI_KPI_DEFINITIONS.find(candidate => candidate.id === kpiId) ?? TEXT_AI_KPI_DEFINITIONS[1];
  const filters: readonly TextAiKpiResponseFilter[] = Array.isArray(filter) ? filter : [filter as TextAiKpiResponseFilter];
  const source = uniqueResponses(responses).filter(response => filters.every(condition => {
    const query = condition.query?.trim().toLowerCase() ?? '';
    return (!query || response.text.toLowerCase().includes(query)) &&
      (!condition.start || Boolean(response.collectedOn && response.collectedOn >= condition.start)) &&
      (!condition.end || Boolean(response.collectedOn && response.collectedOn <= condition.end));
  }));
  const scored = source.filter(response => hasValidAnswer(definition, response));
  const base = scored.filter(response => response.text.trim() && (!response.analysisStatus || response.analysisStatus === 'completed'));
  // Parent membership is a union by response ID. Multiple tags never inflate counts.
  const themes = new Map<string, Set<string>>();
  source.forEach(response => response.tags.forEach(tag => {
    if (!themes.has(tag.theme)) themes.set(tag.theme, new Set());
    if (tag.subtheme) themes.get(tag.theme)!.add(tag.subtheme);
  }));
  const rows = [...themes].map(([theme, children]) => {
    const matched = base.filter(response => response.tags.some(tag => tag.theme === theme));
    const subthemes = [...children].map(subtheme => createResult(
      JSON.stringify([theme, subtheme]), subtheme, definition, base,
      matched.filter(response => response.tags.some(tag => tag.theme === theme && tag.subtheme === subtheme)),
      { parentTheme: theme }
    ));
    return createResult(JSON.stringify([theme]), theme, definition, base, matched, { subthemes });
  });
  return {
    definition, pairedResponseCount: base.length, sourceResponseCount: source.length,
    scoredResponseCount: scored.length, coverage: scored.length ? 100 * base.length / scored.length : null,
    overallScore: calculateScore(definition, base), sentiment: calculateSentiment(base), rows,
  };
}

export function getTextAiKpiAnalysis(kpiId: TextAiKpiId, filter: TextAiKpiResponseFilter | readonly TextAiKpiResponseFilter[] = {}): TextAiKpiAnalysis {
  return analyzeTextAiKpiResponses(kpiId, TEXT_AI_KPI_RESPONSES, filter);
}

export function getDefaultTextAiKpiId(): TextAiKpiId { return 'nps'; }

export function formatTextAiKpiScore(definition: TextAiKpiDefinition, score: number | null): string {
  if (score === null) return '—';
  if (definition.kind === 'nps') return score.toFixed(1);
  if (definition.kind === 'top-box') return `${score.toFixed(1)}%`;
  return `${score.toFixed(2)} / ${definition.scaleMax}`;
}

export function getTextAiKpiImpactUnit(definition: TextAiKpiDefinition): string {
  return definition.kind === 'nps' ? 'NPS points' : definition.kind === 'top-box' ? 'percentage points' : 'scale points';
}

export function formatTextAiKpiDelta(definition: TextAiKpiDefinition, delta: number | null): string {
  if (delta === null) return '—';
  const rounded = Number(delta.toFixed(definition.kind === 'mean' ? 2 : 1));
  return `${rounded > 0 ? '+' : ''}${rounded.toFixed(definition.kind === 'mean' ? 2 : 1)}`;
}

export function formatTextAiKpiAnswer(definition: TextAiKpiDefinition, value: number): string {
  return `${value} / ${definition.scaleMax}`;
}

export type TextAiKpiSortColumn = 'theme' | 'impact' | 'score' | 'responses' | 'share';
export interface TextAiKpiSort { column: TextAiKpiSortColumn; direction: 'ascending' | 'descending' }

/** Sort each hierarchy level independently; unavailable numeric values stay last. */
export function sortTextAiKpiRows(rows: readonly TextAiKpiThemeResult[], sort: TextAiKpiSort): TextAiKpiThemeResult[] {
  const value = (row: TextAiKpiThemeResult): number | null => sort.column === 'impact' ? row.impact : sort.column === 'score' ? row.score : sort.column === 'responses' ? row.responseCount : row.responseShare;
  return [...rows].sort((a, b) => {
    const direction = sort.direction === 'ascending' ? 1 : -1;
    if (sort.column === 'theme') return a.label.localeCompare(b.label) * direction;
    const av = value(a), bv = value(b);
    if (av === null && bv !== null) return 1;
    if (bv === null && av !== null) return -1;
    return ((av ?? 0) - (bv ?? 0)) * direction || a.label.localeCompare(b.label);
  });
}
