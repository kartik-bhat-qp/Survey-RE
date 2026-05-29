import type { TextAiGenderKey } from '@/data/mock-text-ai-topic-segment-widget';

export type TextAiSegmentKey = 'overall' | TextAiGenderKey;

export type TextAiSentimentLabel =
  | 'Very Positive'
  | 'Positive'
  | 'Neutral'
  | 'Negative'
  | 'Very Negative';

export type TextAiVerbatimSubtopicTone = 'positive' | 'neutral';

export interface TextAiSentimentVerbatim {
  id: string;
  text: string;
  topic: string;
  subtopics: { label: string; tone: TextAiVerbatimSubtopicTone }[];
  sentiment: TextAiSentimentLabel;
  rowId: string;
  segment: TextAiSegmentKey;
}

export const TEXT_AI_SENTIMENT_ORDER: TextAiSentimentLabel[] = [
  'Very Positive',
  'Positive',
  'Neutral',
  'Negative',
  'Very Negative',
];

export const TEXT_AI_SEGMENT_LABELS: Record<TextAiSegmentKey, string> = {
  overall: 'Overall',
  male: 'Male',
  female: 'Female',
  otherGender: 'Other gender',
};

export interface TextAiVerbatimModalContext {
  rowId: string;
  topicLabel: string;
  parentTopicLabel: string | null;
  segment: TextAiSegmentKey;
  segmentLabel: string;
  count: number;
}

const FIGHT_TICKET_VERBATIMS: Omit<TextAiSentimentVerbatim, 'rowId' | 'segment'>[] = [
  {
    id: 'v-1',
    text: 'It is fun and exciting',
    topic: 'Fight Night Ticket Demand',
    subtopics: [{ label: 'Fight Night Entertainment Drivers', tone: 'positive' }],
    sentiment: 'Very Positive',
  },
  {
    id: 'v-2',
    text: 'I love it . Action',
    topic: 'Fight Night Ticket Demand',
    subtopics: [{ label: 'Fight Card Fanbase Profiling', tone: 'positive' }],
    sentiment: 'Very Positive',
  },
  {
    id: 'v-3',
    text: "It's perfect. I love watching it",
    topic: 'Fight Night Ticket Demand',
    subtopics: [
      { label: 'Fight Card Fanbase Analytics', tone: 'positive' },
      { label: 'Fight Night Entertainment Drivers', tone: 'positive' },
    ],
    sentiment: 'Very Positive',
  },
  {
    id: 'v-4',
    text: 'Would buy ringside seats again without hesitation',
    topic: 'Fight Night Ticket Demand',
    subtopics: [{ label: 'Premium Ringside Demand', tone: 'positive' }],
    sentiment: 'Very Positive',
  },
  {
    id: 'v-5',
    text: 'Great atmosphere every time I attend live',
    topic: 'Fight Night Ticket Demand',
    subtopics: [{ label: 'Fight Night Entertainment Drivers', tone: 'positive' }],
    sentiment: 'Positive',
  },
  {
    id: 'v-6',
    text: 'Prices are steep but the card was worth it',
    topic: 'Fight Night Ticket Demand',
    subtopics: [{ label: 'Premium Ringside Demand', tone: 'neutral' }],
    sentiment: 'Neutral',
  },
  {
    id: 'v-7',
    text: 'Too violent for my family to attend',
    topic: 'Fight Night Ticket Demand',
    subtopics: [{ label: 'Group Package Purchases', tone: 'neutral' }],
    sentiment: 'Negative',
  },
];

const GENERIC_POSITIVE_TEXTS = [
  'Really enjoyed the main card lineup',
  'The energy in the arena was incredible',
  'Best live event I have been to this year',
  'Fighters delivered an unforgettable night',
  'Already planning to get tickets for the rematch',
  'Production quality keeps improving every event',
  'My friends and I had an amazing time',
  'Worth every dollar for the undercard alone',
];

const GENERIC_NEUTRAL_TEXTS = [
  'It was fine — not sure I would go again soon',
  'Some bouts were slow but the headliner saved it',
  'Ticket process was confusing on the website',
  'Mixed feelings about the judging calls',
];

const GENERIC_NEGATIVE_TEXTS = [
  'Felt uncomfortable with how brutal some knockouts were',
  'Too expensive compared to streaming at home',
  'Seating view was blocked for half the fight',
];

function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) % 10000;
  }
  return hash;
}

function buildGeneratedVerbatims(
  context: TextAiVerbatimModalContext
): TextAiSentimentVerbatim[] {
  const topic =
    context.parentTopicLabel && context.topicLabel !== context.parentTopicLabel
      ? context.parentTopicLabel
      : context.topicLabel;
  const subtopicLabel =
    context.parentTopicLabel && context.topicLabel !== context.parentTopicLabel
      ? context.topicLabel
      : `${context.topicLabel} Themes`;

  const seed = hashSeed(`${context.rowId}:${context.segment}`);
  const targetCount = Math.min(Math.max(context.count, 6), 24);
  const items: TextAiSentimentVerbatim[] = [];

  for (let i = 0; i < targetCount; i += 1) {
    const bucket = (seed + i * 7) % 10;
    const sentiment: TextAiSentimentLabel =
      bucket < 4
        ? 'Very Positive'
        : bucket < 6
          ? 'Positive'
          : bucket < 8
            ? 'Neutral'
            : 'Negative';

    const textPool =
      sentiment === 'Neutral'
        ? GENERIC_NEUTRAL_TEXTS
        : sentiment === 'Negative'
          ? GENERIC_NEGATIVE_TEXTS
          : GENERIC_POSITIVE_TEXTS;

    const text = textPool[(seed + i) % textPool.length];
    const tone: TextAiVerbatimSubtopicTone =
      sentiment === 'Very Positive' || sentiment === 'Positive' ? 'positive' : 'neutral';

    items.push({
      id: `gen-${context.rowId}-${context.segment}-${i}`,
      text,
      topic,
      subtopics: [{ label: subtopicLabel, tone }],
      sentiment,
      rowId: context.rowId,
      segment: context.segment,
    });
  }

  return items;
}

export function getSentimentVerbatimsForCell(
  context: TextAiVerbatimModalContext
): TextAiSentimentVerbatim[] {
  const specific = MOCK_TEXT_AI_SENTIMENT_VERBATIMS.filter(
    (item) => item.rowId === context.rowId && item.segment === context.segment
  );

  if (specific.length > 0) {
    return specific;
  }

  if (context.rowId === 'ticket-demand' || context.rowId.startsWith('early-bird')) {
    const mapped = FIGHT_TICKET_VERBATIMS.map((item, index) => ({
      ...item,
      id: `${item.id}-${context.segment}-${index}`,
      rowId: context.rowId,
      segment: context.segment,
      topic:
        context.parentTopicLabel && context.topicLabel !== context.parentTopicLabel
          ? context.parentTopicLabel
          : item.topic,
      subtopics:
        context.parentTopicLabel && context.topicLabel !== context.parentTopicLabel
          ? [{ label: context.topicLabel, tone: item.subtopics[0]?.tone ?? 'positive' }]
          : item.subtopics,
    }));
    return mapped;
  }

  return buildGeneratedVerbatims(context);
}

/** Curated verbatims for demo cells (ticket demand + early bird). */
export const MOCK_TEXT_AI_SENTIMENT_VERBATIMS: TextAiSentimentVerbatim[] = [
  ...(['overall', 'male', 'female', 'otherGender'] as TextAiSegmentKey[]).flatMap(
    (segment) =>
      FIGHT_TICKET_VERBATIMS.map((item, index) => ({
        ...item,
        id: `${item.id}-${segment}-${index}`,
        rowId: 'ticket-demand',
        segment,
      }))
  ),
  ...(['overall', 'male', 'female'] as TextAiSegmentKey[]).flatMap((segment) =>
    FIGHT_TICKET_VERBATIMS.slice(0, 4).map((item, index) => ({
      ...item,
      id: `eb-${item.id}-${segment}-${index}`,
      rowId: 'early-bird-demand',
      segment,
      topic: 'Fight Night Ticket Demand',
      subtopics: [{ label: 'Early Bird Ticket Interest', tone: 'positive' as const }],
    }))
  ),
];

export function groupVerbatimsBySentiment(
  verbatims: TextAiSentimentVerbatim[]
): { sentiment: TextAiSentimentLabel; items: TextAiSentimentVerbatim[] }[] {
  return TEXT_AI_SENTIMENT_ORDER.map((sentiment) => ({
    sentiment,
    items: verbatims.filter((item) => item.sentiment === sentiment),
  })).filter((group) => group.items.length > 0);
}
