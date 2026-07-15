export interface TextAiSummarySection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  trailingParagraphs?: string[];
}

export type TextAiSummaryType = 'thematic' | 'thematic-sentiment';

export interface TextAiSummaryVariant {
  id: TextAiSummaryType;
  label: 'Thematic' | 'Thematic & Sentiment';
  isDefault?: boolean;
  sections: TextAiSummarySection[];
}

export interface TextAiSummaryWidget {
  id: string;
  question: string;
  summaryTypes: [TextAiSummaryVariant, ...TextAiSummaryVariant[]];
}

const THEMATIC_SUMMARY_SECTIONS: TextAiSummarySection[] = [
  {
    heading: 'Overall Snapshot',
    paragraphs: [
      'This report identifies the recurring themes across customer feedback for the single segment labeled “Overall.” The dataset contains 3,044 mentions across 27 parent topics spanning customer experience, staff service, food quality, speed, drive‑thru operations, cleanliness, order accuracy, and related subtopics. The strongest recurring themes are inconsistent service execution, order reliability, wait times, food consistency, and restaurant cleanliness and safety.',
    ],
  },
  {
    heading: 'Dominant Themes',
    paragraphs: ['The feedback is organized around five connected operational themes:'],
    bullets: [
      'Customer experience and staff interaction: Customers frequently describe friendly, helpful frontline interactions, but also report inconsistent staff attitude across locations and shifts.',
      'Order reliability: Missing, incorrect, or incomplete orders form a highly visible theme and often overshadow otherwise positive service encounters.',
      'Drive‑thru speed and flow: Delays, queue management, and slow fulfillment appear repeatedly as friction points in the end-to-end experience.',
      'Food freshness and temperature: Fries, holding times, and inconsistent serving temperature recur across food-quality comments.',
      'Cleanliness and safety: Dining-area cleanliness, hygiene, and food-safety concerns represent an operationally important theme requiring consistent standards.',
    ],
  },
  {
    heading: 'Relationships Between Themes',
    paragraphs: [
      'The themes are closely connected rather than isolated. Friendly staff interactions can improve an individual visit, but they do not fully offset incorrect orders, long waits, or food-quality issues. Likewise, positive dining and ambiance experiences depend on reliable cleanliness and safety practices. The feedback suggests that operational consistency is the common factor linking the most important customer themes.',
    ],
  },
  {
    heading: 'Key Takeaways',
    paragraphs: [],
    bullets: [
      'Improve order-checking and fulfillment workflows to reduce incorrect and incomplete orders.',
      'Standardize drive‑thru queue, preparation, and handoff practices to address recurring delay themes.',
      'Use praised frontline interactions as examples while coaching locations and shifts where staff-attitude concerns cluster.',
      'Review preparation and holding procedures for fries and other temperature-sensitive items.',
      'Reinforce cleanliness and food-safety routines through consistent audits and clear ownership.',
    ],
  },
  {
    heading: 'Important Caveat',
    paragraphs: [
      'This thematic summary is based on the aggregated “Overall” segment. Topic and subtopic counts should be treated as directional signals for prioritizing investigation and operational improvement.',
    ],
  },
];

const DEFAULT_SUMMARY_WIDGET: TextAiSummaryWidget = {
  id: 'w-overall-summary',
  question: "Please tell us about your experience at McDonald's",
  summaryTypes: [
    {
      id: 'thematic',
      label: 'Thematic',
      isDefault: true,
      sections: THEMATIC_SUMMARY_SECTIONS,
    },
    {
      id: 'thematic-sentiment',
      label: 'Thematic & Sentiment',
      sections: [
    {
      heading: 'Overall Snapshot',
      paragraphs: [
        'This report summarizes sentiment across customer feedback topics for a single segment labeled “Overall.” The dataset includes 3,044 total mentions across 27 parent topics (summed by eye from provided counts) covering experience, staff service, food quality, speed, drive‑thru, cleanliness, order accuracy, and related subtopics. The general picture is mixed: there is meaningful positive feedback in several areas, but substantial negative feedback concentrated in service attitude, order accuracy, drive‑thru delays, and cleanliness/safety.',
      ],
    },
    {
      heading: 'Segment-by-Segment Analysis',
      paragraphs: [
        'Overall (single segment) - Dominant mood: Positive sentiment is the largest single bucket overall (1,281 of 3,044 ≈ 42.1%), followed by neutral and negative. However, negative and very negative responses are concentrated in specific operational topics, creating polarized experiences.',
        'Standout topics:',
      ],
      bullets: [
        'Customer Experience Feedback Analysis (181 mentions) is skewed positive — 61 positive and 74 very positive (≈74.6% positive/very positive of that topic), indicating strong praise in that area.',
        'Staff Service Interaction Analysis (261 mentions) shows a split: Staff Friendliness is overwhelmingly positive (115 positive + 14 very positive out of 140 → 92.9% favorable), but other staff topics are heavily negative, especially Staff Service Attitude Analysis (45 mentions: 17 very negative + 27 negative → 97.8% critical). This suggests inconsistency in staff behavior across locations or shifts.',
        'Food Freshness and Temperature Concerns (228 mentions) is mixed: 103 positive but 88 negative/very negative (≈38.6% critical), with fries and temperature issues frequently cited as negatives.',
        'Order Fulfillment Accuracy Challenges (121 mentions) is strongly negative (101 negative + 13 very negative → 92.6% critical), making incorrect orders a major pain point.',
        'Drive‑Thru Customer Experience Challenges (146 mentions) leans negative overall (101 negative/very negative → 69.2%), with pronounced delay issues.',
        'Restaurant Cleanliness and Safety Concerns (103 mentions) contains acute negatives on food safety and cleanliness (15 mentions with 10 very negative in food safety; cleanliness 88 mentions with 52 negative/very negative), flagging serious operational risk.',
      ],
      trailingParagraphs: [
        'Emotional intensity: There are pockets of strong praise (many very positive counts in core experience and some dining/ambiance topics) but also concentrated intense criticism (high very negative counts in staff attitude, order errors, food safety, and drive‑thru delays). This indicates polarized customer experiences rather than uniform middling sentiment.',
      ],
    },
    {
      heading: 'Cross-Segment Comparison',
      paragraphs: [
        'Only one segment (Overall) is present, so direct comparisons between segments are not applicable. Instead, internal contrasts are evident: areas of high satisfaction (customer-facing friendliness, certain experience aspects, and parts of the dining ambiance) sit alongside high-impact operational failures (order accuracy, staff attitude in specific contexts, drive‑thru delays, and cleanliness/food safety). These internal divergences are meaningful — positive frontline interactions are undermined by operational reliability and safety issues, which generate concentrated negative sentiment despite overall favorable impressions elsewhere.',
      ],
    },
    {
      heading: 'Key Takeaways',
      paragraphs: [],
      bullets: [
        'Operational reliability (order accuracy and drive‑thru delays) is the clearest driver of strong negative sentiment and should be prioritized for improvement.',
        'Staff performance is inconsistent: while friendliness and professionalism get high praise, a subset of interactions reflect severe attitude problems — focus training and coaching where attitude complaints cluster.',
        'Cleanliness and food safety show concentrated very negative feedback; these are high-risk areas that warrant immediate attention and standardization.',
        'Food freshness and temperature (notably fries) are recurring mixed-to-negative concerns; evaluate preparation and holding procedures to improve consistency.',
        'Positive strengths (customer experience highlights and certain ambiance elements) should be reinforced and used as models for other locations/teams.',
      ],
    },
    {
      heading: 'Important Caveat',
      paragraphs: [
        'The findings are based on the aggregated “Overall” segment with substantial counts across many topics; results reflect clear patterns in the sample and are directional for operational action. Treat subtopic counts as actionable signals for targeted interventions rather than claims of statistically precise effect sizes.',
      ],
    },
      ],
    },
  ],
};

/** Generated narrative summary shown on a TextAI dashboard detail view. */
export function getTextAiSummaryWidgets(_dashboardId: number): TextAiSummaryWidget[] {
  void _dashboardId;
  return [DEFAULT_SUMMARY_WIDGET];
}
