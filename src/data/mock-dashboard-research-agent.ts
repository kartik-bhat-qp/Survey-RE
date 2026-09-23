/**
 * Dashboard Research Agent — high-level summary + conversational follow-ups.
 * Prototype mock data only; no real AI backend.
 */

export interface DashboardResearchAgentMessage {
  id: string;
  role: 'agent' | 'user';
  text: string;
  /** Structured summary blocks shown on the opening agent message. */
  summary?: DashboardResearchAgentSummary;
  createdAt: string;
}

export interface DashboardResearchAgentSummary {
  headline: string;
  bullets: string[];
  callouts: Array<{ label: string; value: string; tone?: 'positive' | 'neutral' | 'watch' }>;
}

export const DASHBOARD_RESEARCH_AGENT_TITLE = 'Research agent';

export const DASHBOARD_RESEARCH_AGENT_ABOUT =
  'Research agent summarizes this dashboard and answers follow-up questions about the trends, drivers, and open-text themes you see here.';

export const DASHBOARD_RESEARCH_AGENT_PLACEHOLDER =
  'Ask about NPS, segments, drivers, or comments…';

export const DASHBOARD_RESEARCH_AGENT_EXAMPLE_PROMPTS = [
  {
    id: 'why-nps',
    text: 'Why is NPS soft this period, and what should we fix first?',
  },
  {
    id: 'segment-gap',
    text: 'Which segment is pulling results down, and by how much?',
  },
  {
    id: 'comment-themes',
    text: 'What are the top themes in Suggestions / Comments?',
  },
  {
    id: 'next-actions',
    text: 'Give me three recommended actions for the CX team this week.',
  },
] as const;

export function createDashboardResearchAgentMessageId(): string {
  return `dra-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getDashboardResearchAgentOpening(
  dashboardName: string
): DashboardResearchAgentMessage {
  return {
    id: createDashboardResearchAgentMessageId(),
    role: 'agent',
    text: `Here’s a high-level read of **${dashboardName}** from the widgets on this canvas.`,
    summary: {
      headline:
        'CX is mixed: NPS sits below benchmark while younger respondents and on-time / service drivers explain most of the downside.',
      bullets: [
        'NPS is trailing the category benchmark — the gap is concentrated among younger age bands and one softer segment.',
        'Driver analysis points to operational moments (boarding, seat, on-time) as the highest-impact “Improve now” opportunities.',
        'Open comments cluster around suggestions and response quality — useful for qualitative color, not yet a volume spike.',
        'Segment Trend shows Segment 1 outperforming Seg 2 across most of the window; the late dip on Seg 2 is worth a closer look.',
      ],
      callouts: [
        { label: 'Responses', value: '2,634', tone: 'neutral' },
        { label: 'NPS vs benchmark', value: 'Below', tone: 'watch' },
        { label: 'Top driver risk', value: 'On-time / boarding', tone: 'watch' },
        { label: 'Comment theme', value: 'Suggestions', tone: 'positive' },
      ],
    },
    createdAt: new Date().toISOString(),
  };
}

function normalizePrompt(prompt: string): string {
  return prompt.trim().toLowerCase();
}

/** Heuristic mock replies keyed off common dashboard follow-ups. */
export function replyToDashboardResearchPrompt(
  prompt: string,
  dashboardName: string
): string {
  const q = normalizePrompt(prompt);

  if (q.includes('nps') || q.includes('soft') || q.includes('benchmark')) {
    return [
      `On **${dashboardName}**, NPS is soft mainly because performance on high-impact drivers (on-time and boarding) sits left of the benchmark line while still carrying outsized relative weight.`,
      '',
      'Younger age bands and Seg 2 amplify that gap. Protecting cabin-crew strength while lifting the “Improve now” drivers by ~0.5 points is the fastest modelled path back toward benchmark.',
    ].join('\n');
  }

  if (q.includes('segment') || q.includes('pulling') || q.includes('gap')) {
    return [
      '**Seg 2** is the drag. Across the Segment Trend window it sits below Segment 1 on most dates, with a sharper late drop.',
      '',
      'That pattern lines up with softer scores on operational drivers. I’d slice driver analysis by Seg 2 next, then check whether comment volume for “suggestion” spikes in the same dates.',
    ].join('\n');
  }

  if (q.includes('comment') || q.includes('theme') || q.includes('word') || q.includes('suggestion')) {
    return [
      'In **Suggestions / Comments**, the dominant themes are *suggestion*, *auto-generated*, and *response* — with supporting mentions of *feedback*, *customer*, and *verification*.',
      '',
      'That’s consistent with qualitative requests for clearer follow-up and process polish rather than a single product defect. Pair the word cloud with NPS detractors for the next deep dive.',
    ].join('\n');
  }

  if (q.includes('action') || q.includes('recommend') || q.includes('next') || q.includes('week')) {
    return [
      'Three actions for the CX team this week:',
      '',
      '1. **Ops focus** — Run a half-point improvement plan on on-time / boarding (highest Shapley weight in Improve now).',
      '2. **Segment recovery** — Interview or survey Seg 2 respondents from the late dip dates; compare driver scores to Segment 1.',
      '3. **Close the loop** — Tag “suggestion” comments into an action queue and report back on the top three themes in the next stand-up.',
    ].join('\n');
  }

  if (q.includes('driver') || q.includes('improve') || q.includes('quadrant')) {
    return [
      'Driver analysis puts the biggest NPS opportunity in the **Improve now** quadrant — high impact, below-benchmark performance.',
      '',
      'Maintain strength where crew / service scores are already high. Secondary drivers (IFE, food, loyalty) can wait; they move NPS less per point of effort.',
    ].join('\n');
  }

  if (q.includes('age') || q.includes('young') || q.includes('demographic')) {
    return [
      'The Age chart shows younger bands contributing disproportionately to the soft NPS read.',
      '',
      'Cross-filter NPS and driver analysis by those age groups — expect boarding and app / booking experience to surface as sharper pain points than for older respondents.',
    ].join('\n');
  }

  return [
    `I looked across **${dashboardName}** for that.`,
    '',
    'The strongest story remains: soft NPS vs benchmark, Seg 2 lagging Segment 1, and operational drivers in Improve now. Ask me to go deeper on NPS, segments, drivers, comments, or recommended actions.',
  ].join('\n');
}

export async function generateDashboardResearchAgentReply(
  prompt: string,
  dashboardName: string
): Promise<DashboardResearchAgentMessage> {
  await new Promise((resolve) => setTimeout(resolve, 700));
  return {
    id: createDashboardResearchAgentMessageId(),
    role: 'agent',
    text: replyToDashboardResearchPrompt(prompt, dashboardName),
    createdAt: new Date().toISOString(),
  };
}
