export interface TextAiTopicSegmentCell {
  count: number;
  percentage: number;
}

export type TextAiGenderKey = 'male' | 'female' | 'otherGender';

export const TEXT_AI_GENDER_KEYS: TextAiGenderKey[] = ['male', 'female', 'otherGender'];

/** Chi-square test result comparing male, female, and other gender for one topic row. */
export type GenderPairwiseComparison = {
  groupA: TextAiGenderKey;
  groupB: TextAiGenderKey;
  significant: boolean;
  higherGroup: TextAiGenderKey;
};

export type TopicGenderChiSquare = {
  chiSquare: number;
  pValue: number;
  df: number;
  pairwiseComparisons: GenderPairwiseComparison[];
};

export const GENDER_COMPARISON_LETTERS: Record<TextAiGenderKey, string> = {
  male: 'a',
  female: 'b',
  otherGender: 'c',
};

export const GENDER_COLUMN_LABELS: Record<TextAiGenderKey, string> = {
  male: 'Male',
  female: 'Female',
  otherGender: 'Other gender',
};

/** Minimum segment count required before pairwise significance letters are shown. */
export const TEXT_AI_SIGNIFICANCE_MIN_COUNT = 30;

export interface TextAiTopicSegmentRow {
  id: string;
  topic: string;
  overall: TextAiTopicSegmentCell;
  male: TextAiTopicSegmentCell;
  female: TextAiTopicSegmentCell;
  otherGender: TextAiTopicSegmentCell;
  genderChiSquare: TopicGenderChiSquare;
  subtopics?: TextAiTopicSegmentRow[];
}

type TextAiTopicSegmentRowInput = Omit<
  TextAiTopicSegmentRow,
  'otherGender' | 'genderChiSquare' | 'subtopics'
> & {
  otherGender?: TextAiTopicSegmentCell;
  genderChiSquare?: TopicGenderChiSquare;
  subtopics?: TextAiTopicSegmentRowInput[];
};

const GENDER_PAIR_KEYS: [TextAiGenderKey, TextAiGenderKey][] = [
  ['male', 'female'],
  ['male', 'otherGender'],
  ['female', 'otherGender'],
];

function seededPValue(rowId: string, suffix: string): number {
  let hash = 0;
  const seed = `${rowId}:${suffix}`;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 1000;
  }
  return (hash % 360 + 8) / 1000;
}

export function getGenderSignificanceMarkers(
  genderKey: TextAiGenderKey,
  row: Pick<TextAiTopicSegmentRow, TextAiGenderKey>,
  comparisons: GenderPairwiseComparison[]
): { higherThan: string; lowerThan: string } {
  if (row[genderKey].count < TEXT_AI_SIGNIFICANCE_MIN_COUNT) {
    return { higherThan: '', lowerThan: '' };
  }

  const higher = new Set<string>();
  const lower = new Set<string>();

  for (const pair of comparisons) {
    if (!pair.significant) continue;

    if (
      row[pair.groupA].count < TEXT_AI_SIGNIFICANCE_MIN_COUNT ||
      row[pair.groupB].count < TEXT_AI_SIGNIFICANCE_MIN_COUNT
    ) {
      continue;
    }

    const isInPair = pair.groupA === genderKey || pair.groupB === genderKey;
    if (!isInPair) continue;

    const otherKey = pair.groupA === genderKey ? pair.groupB : pair.groupA;
    const otherLetter = GENDER_COMPARISON_LETTERS[otherKey];

    if (pair.higherGroup === genderKey) {
      higher.add(otherLetter);
    } else {
      lower.add(otherLetter);
    }
  }

  const sortLetters = (a: string, b: string) => a.localeCompare(b);
  return {
    higherThan: [...higher].sort(sortLetters).join(','),
    lowerThan: [...lower].sort(sortLetters).join(','),
  };
}

/** Chi-square goodness-of-fit across the three gender segments (df = 2). */
export function deriveGenderChiSquare(
  row: Pick<TextAiTopicSegmentRow, 'id' | 'male' | 'female' | 'otherGender'>
): TopicGenderChiSquare {
  const observed = [row.male.count, row.female.count, row.otherGender.count];
  const total = observed.reduce((sum, value) => sum + value, 0);
  const expected = total / 3;
  const chiSquare =
    expected > 0
      ? observed.reduce((sum, value) => sum + (value - expected) ** 2 / expected, 0)
      : 0;

  const pctSpread = Math.max(
    row.male.percentage,
    row.female.percentage,
    row.otherGender.percentage
  ) - Math.min(row.male.percentage, row.female.percentage, row.otherGender.percentage);

  let pValue = seededPValue(row.id, 'chi-square');
  if (chiSquare < 1.2 || pctSpread < 0.8) pValue = Math.max(pValue, 0.09);
  if (chiSquare > 6 || pctSpread > 3) pValue = Math.min(pValue, 0.008);

  const pairwiseComparisons: GenderPairwiseComparison[] = GENDER_PAIR_KEYS.map(
    ([groupA, groupB]) => {
      const diff = Math.abs(row[groupA].percentage - row[groupB].percentage);
      const higherGroup =
        row[groupA].percentage >= row[groupB].percentage ? groupA : groupB;
      let pairP = seededPValue(row.id, `${groupA}-${groupB}`);
      if (diff < 0.75) pairP = Math.max(pairP, 0.11);
      const meetsMinCount =
        row[groupA].count >= TEXT_AI_SIGNIFICANCE_MIN_COUNT &&
        row[groupB].count >= TEXT_AI_SIGNIFICANCE_MIN_COUNT;
      return {
        groupA,
        groupB,
        significant: meetsMinCount && pairP < 0.05,
        higherGroup,
      };
    }
  );

  return {
    chiSquare: Math.round(chiSquare * 10) / 10,
    pValue,
    df: 2,
    pairwiseComparisons,
  };
}

export function formatSignificanceStars(pValue: number): string {
  if (pValue < 0.001) return '***';
  if (pValue < 0.01) return '**';
  if (pValue < 0.05) return '*';
  return '';
}

export function formatChiSquarePValue(pValue: number): string {
  if (pValue < 0.001) return 'p < 0.001';
  return `p = ${pValue.toFixed(3)}`;
}

/** Smaller segment counts than male/female — used when other gender is not set explicitly. */
export function deriveOtherGenderCell(female: TextAiTopicSegmentCell): TextAiTopicSegmentCell {
  const count = Math.max(2, Math.round(female.count * 0.28));
  const percentage = Math.max(0.4, Math.round(female.percentage * 0.26 * 10) / 10);
  return { count, percentage };
}

function enrichTopicSegmentRow(row: TextAiTopicSegmentRowInput): TextAiTopicSegmentRow {
  const otherGender = row.otherGender ?? deriveOtherGenderCell(row.female);
  return {
    ...row,
    otherGender,
    genderChiSquare:
      row.genderChiSquare ?? deriveGenderChiSquare({ ...row, otherGender }),
    subtopics: row.subtopics?.map(enrichTopicSegmentRow),
  };
}

function enrichTopicSegmentRows(rows: TextAiTopicSegmentRowInput[]): TextAiTopicSegmentRow[] {
  return rows.map(enrichTopicSegmentRow);
}

export interface TextAiTopicSegmentWidget {
  id: string;
  question: string;
  rows: TextAiTopicSegmentRow[];
}

export const COMBAT_SPORTS_TOPIC_SEGMENT_QUESTION =
  'What do you feel about professional combat-sports (Boxing, MMA, etc)? Example: We think it is too violent and should be regulated more!';

export const FIGHT_NIGHT_AUDIENCE_SUBTOPICS: TextAiTopicSegmentRowInput[] = [
  {
    id: 'bout-feedback',
    topic: 'Bout Audience Feedback Analysis',
    overall: { count: 98, percentage: 2.9 },
    male: { count: 71, percentage: 3.2 },
    female: { count: 27, percentage: 2.2 },
    otherGender: { count: 8, percentage: 0.6 },
    genderChiSquare: {
      chiSquare: 8.6,
      pValue: 0.014,
      df: 2,
      pairwiseComparisons: [
        { groupA: 'male', groupB: 'female', significant: true, higherGroup: 'male' },
        { groupA: 'male', groupB: 'otherGender', significant: true, higherGroup: 'male' },
        { groupA: 'female', groupB: 'otherGender', significant: true, higherGroup: 'female' },
      ],
    },
  },
  {
    id: 'attendance-preferences',
    topic: 'Fight Night Attendance Preferences',
    overall: { count: 84, percentage: 2.5 },
    male: { count: 58, percentage: 2.6 },
    female: { count: 26, percentage: 2.1 },
  },
  {
    id: 'audience-measurement',
    topic: 'Fight Night Audience Measurement',
    overall: { count: 76, percentage: 2.2 },
    male: { count: 52, percentage: 2.4 },
    female: { count: 24, percentage: 1.9 },
  },
  {
    id: 'spectator-classification',
    topic: 'Fight Night Spectator Classification',
    overall: { count: 72, percentage: 2.1 },
    male: { count: 49, percentage: 2.2 },
    female: { count: 23, percentage: 1.9 },
  },
  {
    id: 'viewership-segmentation',
    topic: 'Fight Night Viewership Segmentation',
    overall: { count: 65, percentage: 1.9 },
    male: { count: 44, percentage: 2.0 },
    female: { count: 21, percentage: 1.7 },
  },
  {
    id: 'professional-perception',
    topic: 'Professional Fight Audience Perception',
    overall: { count: 58, percentage: 1.7 },
    male: { count: 39, percentage: 1.8 },
    female: { count: 19, percentage: 1.5 },
  },
  {
    id: 'mma-viewing-patterns',
    topic: 'MMA Spectator Viewing Patterns',
    overall: { count: 52, percentage: 1.5 },
    male: { count: 36, percentage: 1.6 },
    female: { count: 16, percentage: 1.3 },
  },
];

export const FIGHT_NIGHT_TICKET_DEMAND_SUBTOPICS: TextAiTopicSegmentRowInput[] = [
  {
    id: 'early-bird-demand',
    topic: 'Early Bird Ticket Interest',
    overall: { count: 112, percentage: 3.3 },
    male: { count: 78, percentage: 3.5 },
    female: { count: 34, percentage: 2.8 },
  },
  {
    id: 'premium-ringside',
    topic: 'Premium Ringside Demand',
    overall: { count: 96, percentage: 2.8 },
    male: { count: 68, percentage: 3.1 },
    female: { count: 28, percentage: 2.3 },
  },
  {
    id: 'group-packages',
    topic: 'Group Package Purchases',
    overall: { count: 88, percentage: 2.6 },
    male: { count: 61, percentage: 2.8 },
    female: { count: 27, percentage: 2.2 },
  },
  {
    id: 'walk-up-sales',
    topic: 'Last-Minute Walk-Up Sales',
    overall: { count: 74, percentage: 2.2 },
    male: { count: 52, percentage: 2.4 },
    female: { count: 22, percentage: 1.8 },
  },
  {
    id: 'secondary-market',
    topic: 'Secondary Market Activity',
    overall: { count: 68, percentage: 2.0 },
    male: { count: 47, percentage: 2.1 },
    female: { count: 21, percentage: 1.7 },
  },
  {
    id: 'ppv-bundle',
    topic: 'Pay-Per-View Bundle Uptake',
    overall: { count: 58, percentage: 1.7 },
    male: { count: 41, percentage: 1.9 },
    female: { count: 17, percentage: 1.4 },
  },
];

export const SPECTATOR_VIOLENCE_SUBTOPICS: TextAiTopicSegmentRowInput[] = [
  {
    id: 'excessive-violence',
    topic: 'Excessive Violence Concerns',
    overall: { count: 104, percentage: 3.1 },
    male: { count: 68, percentage: 3.1 },
    female: { count: 36, percentage: 2.9 },
  },
  {
    id: 'regulation-support',
    topic: 'Regulation Support Sentiment',
    overall: { count: 92, percentage: 2.7 },
    male: { count: 58, percentage: 2.6 },
    female: { count: 34, percentage: 2.8 },
  },
  {
    id: 'age-limits',
    topic: 'Age-Appropriate Viewing Limits',
    overall: { count: 81, percentage: 2.4 },
    male: { count: 52, percentage: 2.4 },
    female: { count: 29, percentage: 2.4 },
  },
  {
    id: 'content-warnings',
    topic: 'Broadcast Content Warnings',
    overall: { count: 72, percentage: 2.1 },
    male: { count: 46, percentage: 2.1 },
    female: { count: 26, percentage: 2.1 },
  },
  {
    id: 'youth-exposure',
    topic: 'Youth Exposure Risk',
    overall: { count: 63, percentage: 1.9 },
    male: { count: 39, percentage: 1.8 },
    female: { count: 24, percentage: 2.0 },
  },
];

export const GRASSROOTS_FAN_OPINION_SUBTOPICS: TextAiTopicSegmentRowInput[] = [
  {
    id: 'fan-club-sentiment',
    topic: 'Local Fan Club Sentiment',
    overall: { count: 95, percentage: 2.8 },
    male: { count: 64, percentage: 2.9 },
    female: { count: 31, percentage: 2.5 },
  },
  {
    id: 'social-buzz',
    topic: 'Social Media Buzz Themes',
    overall: { count: 86, percentage: 2.5 },
    male: { count: 58, percentage: 2.6 },
    female: { count: 28, percentage: 2.3 },
  },
  {
    id: 'merchandise-drivers',
    topic: 'Merchandise Purchase Drivers',
    overall: { count: 78, percentage: 2.3 },
    male: { count: 52, percentage: 2.4 },
    female: { count: 26, percentage: 2.1 },
  },
  {
    id: 'fighter-loyalty',
    topic: 'Fighter Loyalty Affinity',
    overall: { count: 71, percentage: 2.1 },
    male: { count: 49, percentage: 2.2 },
    female: { count: 22, percentage: 1.8 },
  },
  {
    id: 'word-of-mouth',
    topic: 'Event Word-of-Mouth',
    overall: { count: 64, percentage: 1.9 },
    male: { count: 42, percentage: 1.9 },
    female: { count: 22, percentage: 1.8 },
  },
];

export const FIGHTER_MEDICAL_SURVEILLANCE_SUBTOPICS: TextAiTopicSegmentRowInput[] = [
  {
    id: 'concussion-protocol',
    topic: 'Concussion Protocol Awareness',
    overall: { count: 89, percentage: 2.6 },
    male: { count: 58, percentage: 2.6 },
    female: { count: 31, percentage: 2.5 },
  },
  {
    id: 'prefight-screening',
    topic: 'Pre-Fight Health Screening Trust',
    overall: { count: 82, percentage: 2.4 },
    male: { count: 54, percentage: 2.5 },
    female: { count: 28, percentage: 2.3 },
  },
  {
    id: 'injury-disclosure',
    topic: 'Injury Disclosure Transparency',
    overall: { count: 74, percentage: 2.2 },
    male: { count: 48, percentage: 2.2 },
    female: { count: 26, percentage: 2.1 },
  },
  {
    id: 'ringside-medical',
    topic: 'Ringside Medical Response Confidence',
    overall: { count: 68, percentage: 2.0 },
    male: { count: 44, percentage: 2.0 },
    female: { count: 24, percentage: 2.0 },
  },
  {
    id: 'long-term-monitoring',
    topic: 'Long-Term Health Monitoring',
    overall: { count: 61, percentage: 1.8 },
    male: { count: 39, percentage: 1.8 },
    female: { count: 22, percentage: 1.8 },
  },
];

export const ATTENDANCE_LEGITIMACY_SUBTOPICS: TextAiTopicSegmentRowInput[] = [
  {
    id: 'resale-fraud',
    topic: 'Ticket Resale Fraud Detection',
    overall: { count: 82, percentage: 2.4 },
    male: { count: 55, percentage: 2.5 },
    female: { count: 27, percentage: 2.2 },
  },
  {
    id: 'verified-checkins',
    topic: 'Verified Attendance Check-Ins',
    overall: { count: 76, percentage: 2.2 },
    male: { count: 50, percentage: 2.3 },
    female: { count: 26, percentage: 2.1 },
  },
  {
    id: 'no-show-patterns',
    topic: 'No-Show Rate Patterns',
    overall: { count: 69, percentage: 2.0 },
    male: { count: 45, percentage: 2.0 },
    female: { count: 24, percentage: 2.0 },
  },
  {
    id: 'corporate-hospitality',
    topic: 'Corporate Hospitality Allocation',
    overall: { count: 62, percentage: 1.8 },
    male: { count: 41, percentage: 1.9 },
    female: { count: 21, percentage: 1.7 },
  },
  {
    id: 'season-pass',
    topic: 'Season Pass Utilization',
    overall: { count: 55, percentage: 1.6 },
    male: { count: 36, percentage: 1.6 },
    female: { count: 19, percentage: 1.5 },
  },
];

export const COMBAT_SPORTS_TOPIC_SEGMENT_ROWS: TextAiTopicSegmentRowInput[] = [
  {
    id: 'fight-audience',
    topic: 'Fight Night Audience Segmentation',
    overall: { count: 445, percentage: 13.1 },
    male: { count: 312, percentage: 14.2 },
    female: { count: 133, percentage: 10.8 },
    subtopics: FIGHT_NIGHT_AUDIENCE_SUBTOPICS,
  },
  {
    id: 'ticket-demand',
    topic: 'Fight Night Ticket Demand',
    overall: { count: 398, percentage: 11.7 },
    male: { count: 281, percentage: 12.8 },
    female: { count: 117, percentage: 9.5 },
    subtopics: FIGHT_NIGHT_TICKET_DEMAND_SUBTOPICS,
  },
  {
    id: 'spectator-violence',
    topic: 'Spectator Violence Characterization',
    overall: { count: 362, percentage: 10.6 },
    male: { count: 248, percentage: 11.3 },
    female: { count: 114, percentage: 9.3 },
    subtopics: SPECTATOR_VIOLENCE_SUBTOPICS,
  },
  {
    id: 'grassroots-opinion',
    topic: 'Grassroots Fan Opinion Capture',
    overall: { count: 331, percentage: 9.7 },
    male: { count: 219, percentage: 10.0 },
    female: { count: 112, percentage: 9.1 },
    subtopics: GRASSROOTS_FAN_OPINION_SUBTOPICS,
  },
  {
    id: 'medical-surveillance',
    topic: 'Fighter Medical Surveillance Protocols',
    overall: { count: 298, percentage: 8.8 },
    male: { count: 201, percentage: 9.2 },
    female: { count: 97, percentage: 7.9 },
    subtopics: FIGHTER_MEDICAL_SURVEILLANCE_SUBTOPICS,
  },
  {
    id: 'attendance-legitimacy',
    topic: 'Spectator Attendance Legitimacy Signals',
    overall: { count: 276, percentage: 8.1 },
    male: { count: 184, percentage: 8.4 },
    female: { count: 92, percentage: 7.5 },
    subtopics: ATTENDANCE_LEGITIMACY_SUBTOPICS,
  },
];

const DEFAULT_TOPIC_SEGMENT_WIDGET: TextAiTopicSegmentWidget = {
  id: 'w-topic-segment',
  question: COMBAT_SPORTS_TOPIC_SEGMENT_QUESTION,
  rows: enrichTopicSegmentRows(COMBAT_SPORTS_TOPIC_SEGMENT_ROWS),
};

/** Topic segmentation widgets shown on a TextAI dashboard detail view. */
export function getTextAiTopicSegmentWidgets(dashboardId: number): TextAiTopicSegmentWidget[] {
  void dashboardId;
  return [DEFAULT_TOPIC_SEGMENT_WIDGET];
}

function collectMaxPercentage(rows: TextAiTopicSegmentRow[]): number {
  let max = 0;
  for (const row of rows) {
    max = Math.max(
      max,
      row.overall.percentage,
      row.male.percentage,
      row.female.percentage,
      row.otherGender.percentage
    );
    if (row.subtopics?.length) {
      max = Math.max(max, collectMaxPercentage(row.subtopics));
    }
  }
  return max;
}

/** Max percentage across all segment cells — used to scale progress bars. */
export function getTopicSegmentMaxPercentage(rows: TextAiTopicSegmentRow[]): number {
  return collectMaxPercentage(rows) || 1;
}

export function formatTopicSegmentPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function topicRowHasSubtopics(row: TextAiTopicSegmentRow): boolean {
  return (row.subtopics?.length ?? 0) > 0;
}
