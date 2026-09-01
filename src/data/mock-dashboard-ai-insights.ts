export type AiInsightRefreshFrequency = '24-hours' | '48-hours' | '1-week';

export interface AiInsightRefreshOption {
  value: AiInsightRefreshFrequency;
  label: string;
  intervalHours: number;
}

export interface DashboardInsightComment {
  id: string;
  author: string;
  initials: string;
  text: string;
  createdAtLabel: string;
}

export type DashboardInsightRefreshTrigger = 'automatic' | 'widget' | 'dashboard';

export interface DashboardInsightItem {
  id: string;
  kind: 'ai' | 'user';
  text: string;
  author?: string;
  initials?: string;
  createdAtLabel: string;
  generatedAt?: string;
  refreshTrigger?: DashboardInsightRefreshTrigger;
  likes: number;
  likedByViewer?: boolean;
  comments: DashboardInsightComment[];
}

export interface DashboardWidgetInsightThread {
  widgetId: string;
  generation: number;
  lastRefreshedAt: string;
  lastRefreshAttemptAt?: string;
  lastRefreshError?: string;
  items: DashboardInsightItem[];
  pastAiRuns: DashboardInsightItem[];
}

export interface DashboardInsightRegenerationResult {
  attemptedCount: number;
  refreshedCount: number;
  failedWidgetIds: string[];
  failedWidgetTitles: string[];
  completedAt: string;
}

export const AI_INSIGHT_REFRESH_OPTIONS: AiInsightRefreshOption[] = [
  { value: '24-hours', label: 'Every 24 hours', intervalHours: 24 },
  { value: '48-hours', label: 'Every 48 hours', intervalHours: 48 },
  { value: '1-week', label: 'Every week', intervalHours: 168 },
];

export const DEFAULT_AI_INSIGHT_REFRESH_FREQUENCY: AiInsightRefreshFrequency = '24-hours';

export function isAiInsightRefreshFrequency(
  value: string | null
): value is AiInsightRefreshFrequency {
  return AI_INSIGHT_REFRESH_OPTIONS.some((option) => option.value === value);
}

const AI_INSIGHT_COPY: Record<string, string[]> = {
  'w-map': [
    'North America and Western Europe account for the largest response concentrations, while coverage remains lighter across Africa and Central Asia.',
    'The latest response mix remains concentrated in North America and Europe, with new activity increasing across India and Australia.',
  ],
  'w-response': [
    'Most respondents completed the survey, and the average completion time remains within the expected range for this questionnaire.',
    'Completion remains stable after the latest responses, with no material increase in response time or partial submissions.',
  ],
  'w-bar': [
    'Respondents aged 25–44 make up the largest share of this audience, with participation tapering across older age groups.',
    'The 25–44 audience continues to lead participation, while the latest responses modestly increase representation among respondents aged 45–54.',
  ],
  'w-nps-benchmark': [
    'The current NPS is ahead of the internal benchmark, supported by a larger promoter share and stable detractor volume.',
    'NPS remains above the benchmark after the latest responses, although promoter growth has slowed compared with the previous period.',
  ],
  'w-mean': [
    'The mean score remains positive and is consistent with the broader satisfaction pattern across the dashboard.',
    'The latest responses keep the mean score stable, with no statistically meaningful shift from the previous insight.',
  ],
  'w-comparative-bar': [
    'The strongest segment outperforms the lowest segment across most measures, with the widest gap appearing in overall satisfaction.',
    'Segment differences remain concentrated in satisfaction and ease of use, while the remaining measures are broadly aligned.',
  ],
  'w-segment-trend': [
    'The leading segment has improved over the most recent periods, while the other segments remain comparatively stable.',
    'Recent responses continue the upward trend for the leading segment without creating a material change in the remaining segments.',
  ],
};

export function getAiInsightRefreshOption(
  frequency: AiInsightRefreshFrequency
): AiInsightRefreshOption {
  return (
    AI_INSIGHT_REFRESH_OPTIONS.find((option) => option.value === frequency) ??
    AI_INSIGHT_REFRESH_OPTIONS[0]
  );
}

export function getNextAiInsightRefreshAt(
  lastRefreshedAt: string,
  frequency: AiInsightRefreshFrequency
): string {
  const lastRefresh = new Date(lastRefreshedAt);
  const intervalHours = getAiInsightRefreshOption(frequency).intervalHours;
  return new Date(lastRefresh.getTime() + intervalHours * 60 * 60 * 1000).toISOString();
}

export function formatAiInsightDateTime(isoDate: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(isoDate));
}

function getGeneratedInsightText(widgetId: string, generation: number): string {
  const variants = AI_INSIGHT_COPY[widgetId] ?? [
    'The latest responses reinforce the primary pattern visible in this widget.',
    'The refreshed data remains consistent with the previous result and does not indicate a material shift.',
  ];
  return variants[generation % variants.length];
}

export function createDashboardWidgetInsightThread(
  widgetId: string,
  refreshedAt = '2026-09-01T06:30:00.000Z'
): DashboardWidgetInsightThread {
  return {
    widgetId,
    generation: 0,
    lastRefreshedAt: refreshedAt,
    pastAiRuns: [],
    items: [
      {
        id: `${widgetId}-ai`,
        kind: 'ai',
        text: getGeneratedInsightText(widgetId, 0),
        createdAtLabel: 'Last automatic refresh',
        generatedAt: refreshedAt,
        refreshTrigger: 'automatic',
        likes: 3,
        comments: [
          {
            id: `${widgetId}-ai-comment`,
            author: 'Swarup Das',
            initials: 'SD',
            text: 'Keep this context with the next refresh so the team can compare the change.',
            createdAtLabel: 'Yesterday',
          },
        ],
      },
      {
        id: `${widgetId}-user`,
        kind: 'user',
        author: 'Prabal Gupta',
        initials: 'PG',
        text: 'The regional mix should be reviewed alongside the campaign launch dates.',
        createdAtLabel: '2 days ago',
        likes: 1,
        comments: [
          {
            id: `${widgetId}-user-comment`,
            author: 'Kartik Bhat',
            initials: 'KB',
            text: 'Agreed. I will add the campaign dates to the next review.',
            createdAtLabel: 'Yesterday',
          },
        ],
      },
    ],
  };
}

export function refreshDashboardWidgetInsightThread(
  thread: DashboardWidgetInsightThread,
  refreshedAt: string,
  refreshTrigger: DashboardInsightRefreshTrigger = 'widget'
): DashboardWidgetInsightThread {
  const nextGeneration = thread.generation + 1;
  const currentAiInsight = thread.items.find((item) => item.kind === 'ai');
  const userInsights = thread.items.filter((item) => item.kind === 'user');
  return {
    ...thread,
    generation: nextGeneration,
    lastRefreshedAt: refreshedAt,
    lastRefreshAttemptAt: refreshedAt,
    lastRefreshError: undefined,
    pastAiRuns: currentAiInsight
      ? [currentAiInsight, ...thread.pastAiRuns]
      : thread.pastAiRuns,
    items: [
      {
        id: `${thread.widgetId}-ai-${nextGeneration}`,
        kind: 'ai',
        text: getGeneratedInsightText(thread.widgetId, nextGeneration),
        createdAtLabel: 'Refreshed just now',
        generatedAt: refreshedAt,
        refreshTrigger,
        likes: 0,
        likedByViewer: false,
        comments: [],
      },
      ...userInsights,
    ],
  };
}

export function failDashboardWidgetInsightRefresh(
  thread: DashboardWidgetInsightThread,
  attemptedAt: string,
  message = 'We could not refresh this insight. The previous AI insight is still available.'
): DashboardWidgetInsightThread {
  return {
    ...thread,
    lastRefreshAttemptAt: attemptedAt,
    lastRefreshError: message,
  };
}
