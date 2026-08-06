import type { SurveyDetail, SurveyQuestion } from '@/data/mock-survey-detail';

export type DeepDiveAnalysisQuestionKind = 'single-select' | 'multi-select';
export type DeepDiveThemeSentiment = 'positive' | 'mixed' | 'negative';
export type DeepDiveSignificanceDirection = 'up' | 'down';

export interface DeepDiveSummarySection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface DeepDiveParentAnswerRow {
  label: string;
  percent: number;
  count: number;
}

export interface DeepDiveMetric {
  label: string;
  value: string;
}

export interface DeepDiveThemeSegment {
  label: string;
  percent: number;
  significance?: DeepDiveSignificanceDirection;
}

export interface DeepDiveSubtheme {
  label: string;
  mentionCount: number;
}

export interface DeepDiveQuote {
  id: string;
  respondent: string;
  optionLabel: string;
  sentiment: DeepDiveThemeSentiment;
  text: string;
}

export interface DeepDiveTheme {
  id: string;
  label: string;
  insight: string;
  mentionCount: number;
  share: number;
  sentiment: DeepDiveThemeSentiment;
  emerging?: boolean;
  segments: DeepDiveThemeSegment[];
  subthemes: DeepDiveSubtheme[];
  quotes: DeepDiveQuote[];
}

export interface DeepDiveSentimentBreakdown {
  positive: number;
  mixed: number;
  negative: number;
}

export interface DeepDiveLengthBucket {
  label: string;
  percent: number;
  count: number;
}

export interface DeepDiveProbePath {
  label: string;
  share: number;
  description: string;
}

export interface DeepDiveAnalysisQuestion {
  id: string;
  code: string;
  title: string;
  kind: DeepDiveAnalysisQuestionKind;
  sampleSize: number;
  completionRate: number;
  averageWords: number;
  averageFollowUps: number;
  sampleTooSmall: boolean;
  hasFlatParentDistribution: boolean;
  parentDistributionLabel: string;
  parentAnswerMix: DeepDiveParentAnswerRow[];
  dominantAnswerLabel?: string;
  topLineSummary: string;
  metrics: DeepDiveMetric[];
  summarySections: DeepDiveSummarySection[];
  themes: DeepDiveTheme[];
  sentiment: DeepDiveSentimentBreakdown;
  responseLength: DeepDiveLengthBucket[];
  probePaths: DeepDiveProbePath[];
  otherResponsePercent: number;
  shouldShowOtherCallout: boolean;
}

export interface DeepDiveAnalysisData {
  questions: DeepDiveAnalysisQuestion[];
}

const SEGMENT_LABELS = ['Overall', 'Gen Z', 'Millennials', 'Gen X'] as const;

function hashText(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 2147483647;
  }
  return Math.abs(hash);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundPercent(value: number): number {
  return Math.round(value * 10) / 10;
}

function normalizePercentages(values: number[]): number[] {
  const total = values.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return values.map(() => 0);

  const raw = values.map((value) => (value / total) * 100);
  const rounded = raw.map((value) => Math.floor(value * 10) / 10);
  let tenths = Math.round((100 - rounded.reduce((sum, value) => sum + value, 0)) * 10);
  const ranked = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value * 10) / 10 }))
    .sort((left, right) => right.fraction - left.fraction);

  for (let index = 0; index < ranked.length && tenths > 0; index += 1, tenths -= 1) {
    rounded[ranked[index].index] = roundPercent(rounded[ranked[index].index] + 0.1);
  }

  return rounded;
}

function isEligibleQuestion(question: SurveyQuestion): boolean {
  return (
    !question.editorHidden &&
    (question.kind === undefined || question.kind === 'standard') &&
    (question.inputKind === 'radio' || question.inputKind === 'checkbox') &&
    question.options.length > 1
  );
}

function toQuestionKind(question: SurveyQuestion): DeepDiveAnalysisQuestionKind {
  return question.inputKind === 'checkbox' ? 'multi-select' : 'single-select';
}

function buildParentAnswerMix(question: SurveyQuestion, sampleSize: number): DeepDiveParentAnswerRow[] {
  const seed = hashText(`${question.id}:mix`);
  const optionCount = question.options.length;
  const shouldBeFlat = seed % 4 === 0;
  const hasOther = question.options.some((option) => /other/i.test(option.label));

  const weights = question.options.map((option, index) => {
    if (shouldBeFlat) return 100;
    if (hasOther && /other/i.test(option.label)) {
      return seed % 3 === 0 ? 42 : 18;
    }
    return 65 + ((seed + index * 17) % 70) + (index === seed % optionCount ? 22 : 0);
  });

  const percents = normalizePercentages(weights);
  let remaining = sampleSize;

  return question.options.map((option, index) => {
    const count =
      index === question.options.length - 1
        ? remaining
        : Math.round((sampleSize * (percents[index] ?? 0)) / 100);
    remaining -= count;
    return {
      label: option.label,
      percent: roundPercent((count / sampleSize) * 100),
      count,
    };
  });
}

function buildSummarySections(
  question: SurveyQuestion,
  dominantAnswerLabel: string | undefined,
  hasFlatParentDistribution: boolean,
  otherResponsePercent: number,
  averageFollowUps: number
): DeepDiveSummarySection[] {
  const topSummary = hasFlatParentDistribution
    ? 'Response patterns are distributed fairly evenly, so the stronger signal comes from why respondents explain their choices rather than from a single winning option.'
    : `The parent question has a visible lean toward ${dominantAnswerLabel}, but the follow-up text explains what makes that answer resonate in practice.`;

  return [
    {
      heading: 'Key takeaway',
      paragraphs: [topSummary],
      bullets: [
        `Respondents average ${averageFollowUps.toFixed(1)} follow-up prompts before the thread settles into a clear reason.`,
        'Themes are more diagnostic than top-line counts because respondents often compare multiple trade-offs in a single answer.',
      ],
    },
    {
      heading: 'What the text adds',
      paragraphs: [
        `DeepDive on ${question.code} surfaces the motivations, trade-offs, and unmet needs that sit underneath the parent answer choice.`,
      ],
      bullets: [
        'Theme clustering highlights repeated reasons across responses.',
        'Representative quotes make the signal easy to validate.',
        otherResponsePercent >= 15
          ? 'The volume of Other-type language suggests the original answer list may be missing a common answer.'
          : 'Other-type language is present, but not dominant enough to outweigh the main coded themes.',
      ],
    },
  ];
}

function pickSentiment(seed: number, index: number): DeepDiveThemeSentiment {
  const value = (seed + index * 7) % 3;
  if (value === 0) return 'positive';
  if (value === 1) return 'mixed';
  return 'negative';
}

function buildThemeQuotes(
  question: SurveyQuestion,
  themeLabel: string,
  optionLabel: string,
  sentiment: DeepDiveThemeSentiment
): DeepDiveQuote[] {
  return [
    {
      id: `${question.id}-${themeLabel}-quote-1`,
      respondent: 'R014',
      optionLabel,
      sentiment,
      text: `I keep coming back to ${optionLabel.toLowerCase()} because ${themeLabel.toLowerCase()} matters more to me than just trying the cheapest option.`,
    },
    {
      id: `${question.id}-${themeLabel}-quote-2`,
      respondent: 'R029',
      optionLabel,
      sentiment,
      text: `The follow-up made it clear that ${themeLabel.toLowerCase()} is what shapes my final choice, especially when alternatives feel inconsistent.`,
    },
    {
      id: `${question.id}-${themeLabel}-quote-3`,
      respondent: 'R041',
      optionLabel,
      sentiment,
      text: `I might switch occasionally, but when I explain the decision in my own words it usually comes back to ${themeLabel.toLowerCase()}.`,
    },
  ];
}

function buildThemes(
  question: SurveyQuestion,
  sampleSize: number,
  dominantAnswerLabel: string | undefined,
  sampleTooSmall: boolean
): DeepDiveTheme[] {
  const seed = hashText(`${question.id}:themes`);
  const bank = [
    {
      label: 'Convenience',
      insight: 'Respondents repeatedly connect choice to how easy the option is to access and fit into their routine.',
      subthemes: ['Near home', 'Quick decision', 'Reliable availability'],
    },
    {
      label: 'Value for money',
      insight: 'Price is mentioned less as absolute cheapness and more as whether the experience feels worth it.',
      subthemes: ['Deals', 'Worth the spend', 'Price consistency'],
    },
    {
      label: 'Taste and satisfaction',
      insight: 'Responses often frame the decision as emotional payoff, craving fulfillment, and overall enjoyment.',
      subthemes: ['Cravings', 'Flavor quality', 'Repeat purchase'],
    },
    {
      label: 'Variety and customization',
      insight: 'People appreciate options that let them tailor the experience or avoid getting bored.',
      subthemes: ['Menu breadth', 'Customization', 'Newness'],
    },
    {
      label: 'Service speed',
      insight: 'Fast and predictable service shows up as a major reason for repeat behavior.',
      subthemes: ['Low wait time', 'Smooth pickup', 'Order accuracy'],
    },
  ];

  const weights = bank.map((_, index) => 35 + ((seed + index * 19) % 55));
  const shares = normalizePercentages(weights);

  return bank.slice(0, 4).map((entry, index) => {
    const share = shares[index] ?? 0;
    const sentiment = pickSentiment(seed, index);
    const mentionCount = Math.max(6, Math.round((sampleSize * share) / 100));
    const focusOption = question.options[index % question.options.length]?.label ?? dominantAnswerLabel ?? 'the option';

    return {
      id: `${question.id}-theme-${index + 1}`,
      label: entry.label,
      insight: entry.insight,
      mentionCount,
      share,
      sentiment,
      emerging: (seed + index) % 5 === 0,
      segments: SEGMENT_LABELS.map((segmentLabel, segmentIndex) => {
        const delta = segmentLabel === 'Overall' ? 0 : ((seed + index * 11 + segmentIndex * 13) % 15) - 7;
        const percent = roundPercent(clamp(share + delta, 4, 92));
        let significance: DeepDiveSignificanceDirection | undefined;
        if (!sampleTooSmall && segmentLabel !== 'Overall' && Math.abs(delta) >= 6) {
          significance = delta > 0 ? 'up' : 'down';
        }
        return { label: segmentLabel, percent, significance };
      }),
      subthemes: entry.subthemes.map((label, subIndex) => ({
        label,
        mentionCount: Math.max(3, Math.round(mentionCount * (0.45 - subIndex * 0.09))),
      })),
      quotes: buildThemeQuotes(question, entry.label, focusOption, sentiment),
    };
  });
}

function buildSentiment(themes: DeepDiveTheme[]): DeepDiveSentimentBreakdown {
  const weights = themes.reduce(
    (acc, theme) => {
      acc[theme.sentiment] += theme.mentionCount;
      return acc;
    },
    { positive: 0, mixed: 0, negative: 0 } as DeepDiveSentimentBreakdown
  );
  const total = Math.max(1, weights.positive + weights.mixed + weights.negative);
  return {
    positive: roundPercent((weights.positive / total) * 100),
    mixed: roundPercent((weights.mixed / total) * 100),
    negative: roundPercent((weights.negative / total) * 100),
  };
}

function buildResponseLength(sampleSize: number, seed: number): DeepDiveLengthBucket[] {
  const weights = [28 + (seed % 10), 34 + ((seed + 7) % 11), 38 + ((seed + 13) % 12)];
  const percents = normalizePercentages(weights);
  let remaining = sampleSize;
  return ['Short', 'Medium', 'Detailed'].map((label, index) => {
    const count =
      index === 2 ? remaining : Math.round((sampleSize * (percents[index] ?? 0)) / 100);
    remaining -= count;
    return {
      label,
      percent: roundPercent((count / sampleSize) * 100),
      count,
    };
  });
}

function buildProbePaths(question: SurveyQuestion): DeepDiveProbePath[] {
  return [
    {
      label: 'Reason for choice',
      share: 42,
      description: `Most DeepDive threads on ${question.code} begin by asking respondents to explain the main reason behind their selection.`,
    },
    {
      label: 'Trade-offs and comparisons',
      share: 33,
      description: 'A large share of follow-ups then branch into comparisons against alternatives or previous experiences.',
    },
    {
      label: 'Unmet need or improvement',
      share: 25,
      description: 'The final prompt often uncovers what would need to change for a respondent to switch or upgrade their choice.',
    },
  ];
}

function buildQuestionAnalysis(question: SurveyQuestion): DeepDiveAnalysisQuestion {
  const kind = toQuestionKind(question);
  const seed = hashText(question.id);
  const sampleSize = seed % 5 === 0 ? 24 : 42 + (seed % 95);
  const sampleTooSmall = sampleSize < 30;
  const completionRate = 78 + (seed % 18);
  const averageWords = kind === 'multi-select' ? 34 + (seed % 26) : 29 + (seed % 22);
  const averageFollowUps = roundPercent(1.8 + ((seed % 19) / 10));
  const parentAnswerMix = buildParentAnswerMix(question, sampleSize);
  const sortedMix = [...parentAnswerMix].sort((left, right) => right.percent - left.percent);
  const hasFlatParentDistribution =
    (sortedMix[0]?.percent ?? 0) - (sortedMix[sortedMix.length - 1]?.percent ?? 0) <= 8;
  const dominantAnswerLabel = hasFlatParentDistribution ? undefined : sortedMix[0]?.label;
  const otherResponsePercent =
    parentAnswerMix.find((row) => /other/i.test(row.label))?.percent ?? 0;
  const themes = buildThemes(question, sampleSize, dominantAnswerLabel, sampleTooSmall);
  const sentiment = buildSentiment(themes);

  return {
    id: question.id,
    code: question.code,
    title: question.text,
    kind,
    sampleSize,
    completionRate,
    averageWords,
    averageFollowUps,
    sampleTooSmall,
    hasFlatParentDistribution,
    parentDistributionLabel:
      kind === 'multi-select'
        ? '% of respondents selecting each parent answer option'
        : '% of respondents by parent answer option',
    parentAnswerMix,
    dominantAnswerLabel,
    topLineSummary: hasFlatParentDistribution
      ? 'No single answer dominates the parent question, so the deeper signal comes from repeated motivations across text responses.'
      : `${dominantAnswerLabel} leads the parent question, but follow-up text shows the decision is driven by a broader mix of motivations.`,
    metrics: [
      { label: 'Sample size', value: String(sampleSize) },
      { label: 'Completion rate', value: `${completionRate}%` },
      { label: 'Avg. words', value: String(averageWords) },
      { label: 'Avg. follow-ups', value: averageFollowUps.toFixed(1) },
    ],
    summarySections: buildSummarySections(
      question,
      dominantAnswerLabel,
      hasFlatParentDistribution,
      otherResponsePercent,
      averageFollowUps
    ),
    themes,
    sentiment,
    responseLength: buildResponseLength(sampleSize, seed),
    probePaths: buildProbePaths(question),
    otherResponsePercent,
    shouldShowOtherCallout: otherResponsePercent > 15,
  };
}

export function getDeepDiveAnalysisData(detail: SurveyDetail): DeepDiveAnalysisData {
  const questions = detail.sections
    .flatMap((section) => section.questions)
    .filter(isEligibleQuestion)
    .map(buildQuestionAnalysis);

  return { questions };
}
