import type { IWuSelectOption } from '@npm-questionpro/wick-ui-lib';

export type TextAiSubtopicTone = 'neutral' | 'positive';

export interface TextAiAnalysisRow {
  id: number;
  value: string;
  topic: string;
  subtopic: string;
  subtopicTone: TextAiSubtopicTone;
  insight: string;
  tags: string[];
}

export interface TextAiAnalysisWidget {
  id: string;
  question: string;
  rows: TextAiAnalysisRow[];
}

export const TEXT_AI_PENDING_NEW_COMMENTS = 240;

export interface TextAiFilterOption {
  value: string;
  label: string;
}

export type TextAiFilterSelectOption = IWuSelectOption<TextAiFilterOption>;

export const TEXT_AI_THEME_FILTER_OPTIONS: TextAiFilterSelectOption[] = [
  { value: 'top-3-themes', label: 'Top 3 themes' },
  { value: 'top-5-themes', label: 'Top 5 themes' },
  { value: 'top-10-themes', label: 'Top 10 themes' },
  { type: 'divider' },
  { value: 'leadership', label: 'Health System Leadership Communication' },
  { value: 'outlier', label: 'Outlier Parent Topic' },
  { value: 'collaboration', label: 'Cross-Department Collaboration' },
  { value: 'culture', label: 'Workplace Culture & Values' },
  { value: 'growth', label: 'Career Growth & Development' },
];

export const TEXT_AI_SUBTHEME_FILTER_OPTIONS: TextAiFilterSelectOption[] = [
  { value: 'top-3-sub-themes', label: 'Top 3 sub-themes' },
  { value: 'top-5-sub-themes', label: 'Top 5 sub-themes' },
  { value: 'top-10-sub-themes', label: 'Top 10 sub-themes' },
  { type: 'divider' },
  { value: 'transparency', label: 'Health System Leadership Transparency' },
  { value: 'coordination', label: 'Clinical Department Coordination' },
  { value: 'na', label: 'N/A' },
  { value: 'recognition', label: 'Employee Recognition Programs' },
  { value: 'flexibility', label: 'Flexible Work Arrangements' },
];

const SARTORIS_IMPROVEMENT_ROWS: TextAiAnalysisRow[] = [
  {
    id: 1,
    value: '.',
    topic: 'Outlier Parent Topic',
    subtopic: 'N/A',
    subtopicTone: 'neutral',
    insight:
      'Introduce clear communication channels and timelines for strategic updates to improve departmental transparency.',
    tags: ['transparency', 'on', 'transparent', 'in', 'organizational', 'communication'],
  },
  {
    id: 2,
    value: '...',
    topic: 'Health System Leadership Communication',
    subtopic: 'Health System Leadership Transparency',
    subtopicTone: 'positive',
    insight:
      'Leaders should share quarterly roadmaps and tie team objectives to organizational priorities in all-hands meetings.',
    tags: ['leadership', 'transparency', 'alignment'],
  },
  {
    id: 3,
    value: '.',
    topic: 'Health System Leadership Communication',
    subtopic: 'Clinical Department Coordination',
    subtopicTone: 'positive',
    insight:
      'Standardize handoff protocols and create cross-functional working groups for high-priority clinical workflows.',
    tags: ['coordination', 'clinical', 'process'],
  },
  {
    id: 4,
    value:
      'bessere Kommunikation in der Abteilung, mehr Transparenz bei strategischen Entscheidungen und schnellere Rückmeldungen von Führungskräften',
    topic: 'Outlier Parent Topic',
    subtopic: 'N/A',
    subtopicTone: 'neutral',
    insight:
      'Introduce clear communication channels and timelines for strategic updates to improve departmental transparency.',
    tags: ['transparency', 'strategic', 'hr', 'collaboration'],
  },
  {
    id: 5,
    value:
      'More transparency from leadership on company direction and how individual roles contribute to broader goals',
    topic: 'Health System Leadership Communication',
    subtopic: 'Health System Leadership Transparency',
    subtopicTone: 'positive',
    insight:
      'Leaders should share quarterly roadmaps and tie team objectives to organizational priorities in all-hands meetings.',
    tags: ['leadership', 'transparency', 'alignment'],
  },
  {
    id: 6,
    value:
      'Better coordination between clinical teams during handoffs; too many silos slow down patient-facing decisions',
    topic: 'Health System Leadership Communication',
    subtopic: 'Clinical Department Coordination',
    subtopicTone: 'positive',
    insight:
      'Standardize handoff protocols and create cross-functional working groups for high-priority clinical workflows.',
    tags: ['coordination', 'clinical', 'process'],
  },
  {
    id: 7,
    value: 'Clearer career paths and more frequent performance conversations with managers',
    topic: 'Career Growth & Development',
    subtopic: 'N/A',
    subtopicTone: 'neutral',
    insight:
      'Publish role progression frameworks and train managers on structured development check-ins twice per year.',
    tags: ['career', 'management', 'development'],
  },
  {
    id: 8,
    value:
      'Reduce meeting overload and protect focus time so teams can deliver on commitments without burnout',
    topic: 'Cross-Department Collaboration',
    subtopic: 'Flexible Work Arrangements',
    subtopicTone: 'positive',
    insight:
      'Audit recurring meetings and adopt no-meeting blocks to improve productivity and employee wellbeing.',
    tags: ['meetings', 'wellbeing', 'productivity'],
  },
  {
    id: 9,
    value:
      'Invest in internal tools that reduce manual reporting — we spend too much time on admin instead of analysis',
    topic: 'Workplace Culture & Values',
    subtopic: 'N/A',
    subtopicTone: 'neutral',
    insight:
      'Prioritize automation for recurring reports and consolidate overlapping systems to reduce administrative load.',
    tags: ['tools', 'efficiency', 'reporting'],
  },
  {
    id: 10,
    value:
      'Stronger recognition for teams that collaborate across regions; successes often go unnoticed outside local units',
    topic: 'Workplace Culture & Values',
    subtopic: 'Employee Recognition Programs',
    subtopicTone: 'positive',
    insight:
      'Launch a cross-regional spotlight program highlighting teams that model collaborative behaviors.',
    tags: ['recognition', 'culture', 'global'],
  },
  {
    id: 11,
    value:
      'This is an exceptionally long verbatim response used to validate wrapping behavior in the Value column when respondents provide detailed multi-sentence feedback about workplace improvements',
    topic: 'Outlier Parent Topic',
    subtopic: 'N/A',
    subtopicTone: 'neutral',
    insight: 'Review outlier responses individually; long-form feedback may contain multiple distinct themes.',
    tags: ['outlier', 'verbatim'],
  },
];

const SARTORIS_APPRECIATE_ROWS: TextAiAnalysisRow[] = [
  {
    id: 101,
    value: '.',
    topic: 'Workplace Culture & Values',
    subtopic: 'Employee Recognition Programs',
    subtopicTone: 'positive',
    insight:
      'Highlight mission-driven stories in internal communications to reinforce cultural strengths employees already value.',
    tags: ['culture', 'mission', 'teamwork'],
  },
  {
    id: 102,
    value: '...',
    topic: 'Cross-Department Collaboration',
    subtopic: 'Flexible Work Arrangements',
    subtopicTone: 'positive',
    insight:
      'Continue flexible policies and document best practices from high-trust teams as a model for others.',
    tags: ['flexibility', 'trust', 'hybrid'],
  },
  {
    id: 103,
    value: 'Collaborative colleagues and a mission-driven culture that keeps teams motivated',
    topic: 'Workplace Culture & Values',
    subtopic: 'Employee Recognition Programs',
    subtopicTone: 'positive',
    insight:
      'Highlight mission-driven stories in internal communications to reinforce cultural strengths employees already value.',
    tags: ['culture', 'mission', 'teamwork'],
  },
  {
    id: 104,
    value: 'Flexible hybrid schedule and trust from managers to manage my own time',
    topic: 'Cross-Department Collaboration',
    subtopic: 'Flexible Work Arrangements',
    subtopicTone: 'positive',
    insight:
      'Continue flexible policies and document best practices from high-trust teams as a model for others.',
    tags: ['flexibility', 'trust', 'hybrid'],
  },
  {
    id: 105,
    value: 'Access to learning resources and opportunities to work on challenging projects',
    topic: 'Career Growth & Development',
    subtopic: 'N/A',
    subtopicTone: 'neutral',
    insight:
      'Expand project rotation programs so high-potential employees can build skills across functions.',
    tags: ['learning', 'projects', 'growth'],
  },
  {
    id: 106,
    value: 'Supportive onboarding experience and helpful mentors during my first year',
    topic: 'Health System Leadership Communication',
    subtopic: 'Clinical Department Coordination',
    subtopicTone: 'positive',
    insight:
      'Scale mentor matching and formalize onboarding milestones to sustain positive early-career experiences.',
    tags: ['onboarding', 'mentorship'],
  },
  {
    id: 107,
    value: 'Inclusive environment where diverse perspectives are welcomed in team discussions',
    topic: 'Workplace Culture & Values',
    subtopic: 'N/A',
    subtopicTone: 'neutral',
    insight:
      'Train facilitators on inclusive meeting practices to maintain openness in cross-functional forums.',
    tags: ['inclusion', 'diversity', 'culture'],
  },
];

const DEFAULT_WIDGETS: TextAiAnalysisWidget[] = [
  {
    id: 'w-improve',
    question: 'What can we do to improve your opinion about Sartorius as a workplace?',
    rows: SARTORIS_IMPROVEMENT_ROWS,
  },
  {
    id: 'w-appreciate',
    question: 'What do you appreciate most about working for Sartorius?',
    rows: SARTORIS_APPRECIATE_ROWS,
  },
];

/** Widgets shown on a TextAI dashboard detail view. */
export function getTextAiDashboardWidgets(_dashboardId: number): TextAiAnalysisWidget[] {
  return DEFAULT_WIDGETS;
}
