'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Title as DialogTitle } from '@radix-ui/react-dialog';
import { SharedDashboardDateFilter } from '@/components/dashboards/SharedDashboardDateFilter';
import { filterThemeResponses } from '@/data/text-ai-theme-configuration-view';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageContainer } from '@/components/ui/PageContainer';
import { TextAiEmergingBadge } from '@/components/text-ai/TextAiEmergingBadge';
import { TextAiPendingApprovalBadge } from '@/components/text-ai/TextAiPendingApprovalBadge';
import { TextAiThemeLogs } from '@/components/text-ai/TextAiThemeLogs';
import {
  getSentimentIcon,
  getSentimentLabel,
  TextAiUpdateSentimentModal,
  type TextAiSentimentSubtheme,
  type TextAiAssignedSentiment,
  type TextAiSentimentDraft,
  type TextAiSentimentEditableResponse,
} from '@/components/text-ai/TextAiUpdateSentimentModal';
import { getTextAiDashboardById } from '@/data/get-text-ai-dashboard-by-id';
import type { TextAiDashboardQuestion } from '@/data/mock-text-ai-dashboards';
import { MOCK_TEXT_AI_ANALYSIS_QUESTIONS } from '@/data/mock-text-ai-questions';
import { appendTextAiRecodeLog } from '@/data/text-ai-activity-logs';
import { isTextAiItemEmerging } from '@/data/text-ai-emerging-status';
import {
  getTextAiThemePreferences,
  saveTextAiThemePreferences,
  TEXT_AI_EMERGING_VALIDITY_OPTIONS,
  TEXT_AI_THEME_PREFERENCES_EVENT,
  type TextAiEmergingValidityOption,
  type TextAiThemePreferences,
} from '@/data/text-ai-theme-preferences';
import {
  commitTagDrafts, parseTagAssignments, stageTagAssignment, summarizeTagDrafts,
  type TagAssignments, type TagDrafts,
} from '@/data/text-ai-tag-drafts';
import {
  mergeCodeFrameItems, moveCodeFrameItems, parseCodeFrames, remapResponseTags, removeCodeFrameItems,
  stageCodeFrame, summarizeCodeFrameDrafts, validateCodeFrameName,
  type CodeFrames, type CodeFrameDrafts, type SubTheme, type ThemeGroup, type ThemeTone,
} from '@/data/text-ai-code-frame-drafts';
import { CENSORED_DEMO_DASHBOARD_ID, CENSORED_TAG_ID, CENSORED_VISIBILITY_HELP, CENSORED_CONFIGURATION_EVENT, censoredResponseReason, ensureOutlierTheme, getSharedOutlierResponses, outlierResponseKey, RESTAURANT_THEME_GROUPS, RESTAURANT_RESPONSES, isCensoredResponse, visibleCensoredResponses, addCensoredAwareTags } from '@/data/text-ai-censored-subthemes';
import styles from './ThemeConfiguration.module.css';

const WuCombobox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCombobox })),
  { ssr: false }
);
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuModal = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModal })),
  { ssr: false }
);
const WuModalContent = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalContent })),
  { ssr: false }
);
const WuModalFooter = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalFooter })),
  { ssr: false }
);
const WuModalHeader = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuModalHeader })),
  { ssr: false }
);
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false }
);
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

type GranularityLevel = 'high' | 'medium' | 'low';
type RecodeScope = 'new-sub-themes' | 'all-sub-themes' | 'custom';

interface EditSubThemeTarget {
  editKey: string;
  previousDescription: string;
  previousName: string;
}

type ApproveTarget =
  | {
      kind: 'theme';
      name: string;
      themeId: string;
    }
  | {
      kind: 'sub-theme';
      name: string;
      subThemeId: string;
      themeId: string;
    };

function getApproveTargetKey(target: ApproveTarget): string {
  return target.kind === 'theme'
    ? `theme:${target.themeId}`
    : `sub-theme:${target.themeId}:${target.subThemeId}`;
}

interface RawResponse {
  id: number;
  text: string;
}

interface QuestionThemeVariant {
  coverageCounts: number[];
  groupPercentages: number[];
  responseCount: number;
  responseTexts: string[];
  subThemeFactor: number;
}

interface ResponseClassification {
  tag: string;
  tone: Exclude<ThemeTone, 'red'>;
  sentiment: TextAiAssignedSentiment;
}

const RECODE_RUN_LIMIT = 2;
const RAW_RESPONSE_PAGE_SIZE = 100;

const THEME_GROUPS: ThemeGroup[] = [
  {
    id: 'customer-experience',
    name: 'Customer Experience Feedback Analysis',
    percentage: '17.93%',
    tone: 'blue',
    subThemes: [
      {
        id: 'customer-feedback-gaps',
        emerging: true,
        name: 'Customer Experience Feedback Gaps',
        percentage: '0.53%',
      },
      {
        id: 'customer-service-analysis',
        name: 'Customer Service Experience Analysis',
        percentage: '0.73%',
      },
      {
        id: 'customer-feedback-analysis-low',
        name: 'Customer Experience Feedback Analysis',
        percentage: '0%',
      },
      {
        id: 'customer-experience-improvement',
        name: 'Customer Experience Improvement',
        percentage: '3%',
      },
      {
        id: 'customer-feedback-analysis',
        name: 'Customer Experience Feedback Analysis',
        percentage: '12.07%',
      },
      {
        id: 'customer-experience-differentiation',
        emerging: true,
        name: 'Customer Experience Differentiation',
        percentage: '1.67%',
      },
      {
        id: 'customer-feedback-resolution',
        name: 'Customer Feedback Resolution and Follow-up',
        percentage: '1.43%',
      },
      {
        id: 'customer-expectation-alignment',
        name: 'Customer Expectation Alignment',
        percentage: '1.27%',
      },
      {
        id: 'customer-loyalty-signals',
        emerging: true,
        name: 'Customer Loyalty and Advocacy Signals',
        percentage: '1.13%',
      },
      {
        id: 'customer-communication-quality',
        name: 'Customer Communication Quality',
        percentage: '0.93%',
      },
      {
        id: 'customer-journey-friction',
        name: 'Customer Journey Friction Points',
        percentage: '0.73%',
      },
      {
        id: 'customer-value-perception',
        name: 'Customer Value Perception',
        percentage: '0.6%',
      },
    ],
  },
  {
    emerging: true,
    id: 'staff-service',
    name: 'Staff Service Interaction Analysis',
    percentage: '17.13%',
    tone: 'green',
    subThemes: [
      {
        id: 'staff-friendliness',
        emerging: true,
        name: 'Staff Friendliness and Professionalism',
        percentage: '9.33%',
      },
      {
        id: 'staff-interaction',
        emerging: true,
        name: 'Staff Interaction and Courtesy',
        percentage: '5.07%',
      },
      {
        id: 'staff-service-attitude',
        emerging: true,
        name: 'Staff Service Attitude Analysis',
        percentage: '3%',
      },
      {
        id: 'staff-response-time',
        name: 'Staff Response Time and Availability',
        percentage: '2.73%',
      },
      {
        id: 'staff-knowledge',
        name: 'Staff Knowledge and Confidence',
        percentage: '2.27%',
      },
      {
        id: 'staff-problem-solving',
        name: 'Staff Problem-solving Effectiveness',
        percentage: '1.93%',
      },
      {
        id: 'staff-attentiveness',
        emerging: true,
        name: 'Staff Attentiveness to Customer Needs',
        percentage: '1.53%',
      },
      {
        id: 'staff-communication',
        name: 'Staff Communication Clarity',
        percentage: '1.2%',
      },
      {
        id: 'staff-ownership',
        name: 'Staff Ownership and Follow-through',
        percentage: '0.93%',
      },
      {
        id: 'staff-consistency',
        name: 'Staff Service Consistency',
        percentage: '0.67%',
      },
    ],
  },
  {
    id: 'overall-experience',
    name: 'Overall Experience',
    percentage: '14.53%',
    tone: 'red',
    subThemes: [
      {
        id: 'breakfast-menu-customization',
        name: 'Breakfast Menu Customization and Appeal',
        percentage: '0.93%',
      },
      {
        id: 'brand-expectation-misalignment',
        name: 'Brand Expectation Misalignment Issues',
        percentage: '0.8%',
      },
      {
        id: 'service-flow-consistency',
        emerging: true,
        name: 'Service Flow Consistency Issues',
        percentage: '0.53%',
      },
      {
        id: 'missing-food-items',
        name: 'Missing Food Items in Meal Orders',
        percentage: '0.8%',
      },
      {
        id: 'fast-service-expectations',
        name: 'Fast Service Expectations and Delivery',
        percentage: '1.73%',
      },
      {
        id: 'menu-clarity',
        name: 'Menu Clarity and Accessibility Issues',
        percentage: '0.47%',
      },
      {
        id: 'food-quality-safety',
        name: 'Food Quality and Safety Concerns',
        percentage: '0.13%',
      },
      {
        id: 'customer-app-engagement',
        emerging: true,
        name: 'Customer App Engagement and Feedback',
        percentage: '0.6%',
      },
      {
        id: 'customer-experience-issues',
        name: 'Customer Experience Issues',
        percentage: '0.87%',
      },
      {
        id: 'table-cleanliness',
        name: 'Table Cleanliness and Hygiene Issues',
        percentage: '0.2%',
      },
      {
        id: 'customer-wait-time',
        name: 'Customer Wait Time Experience',
        percentage: '2.07%',
      },
      {
        id: 'customer-service-interactions',
        name: 'Customer Service Interactions',
        percentage: '0.27%',
      },
      {
        id: 'order-accuracy',
        name: 'Order Accuracy and Completeness',
        percentage: '1.47%',
      },
      {
        id: 'visit-convenience',
        emerging: true,
        name: 'Visit Convenience and Accessibility',
        percentage: '1.13%',
      },
      {
        id: 'experience-value',
        name: 'Overall Experience Value',
        percentage: '0.93%',
      },
    ],
  },
];

const RAW_RESPONSES: RawResponse[] = [
  { id: 1, text: 'Some one there was smelly' },
  { id: 2, text: "It's good for an emergency." },
  { id: 3, text: '"Ran out of straws"? Suspect' },
  { id: 4, text: 'The place has character' },
  { id: 5, text: '1.09 soda any size!' },
  { id: 6, text: 'Very fast service' },
];

const RESPONSE_CLASSIFICATIONS: Record<
  GranularityLevel,
  Array<ResponseClassification | null>
> = {
  high: [
    { tag: 'Staff Hygiene and Presentation Concerns', tone: 'green', sentiment: 'negative' },
    { tag: 'Emergency Visit Convenience and Practical Value', tone: 'blue', sentiment: 'positive' },
    { tag: 'Condiment Stock Availability and Communication', tone: 'green', sentiment: 'negative' },
    { tag: 'Distinctive Location Atmosphere and Character', tone: 'blue', sentiment: 'positive' },
    { tag: 'Any-size Beverage Promotion Value', tone: 'green', sentiment: 'very-positive' },
    { tag: 'Rapid Order Fulfilment and Service Speed', tone: 'green', sentiment: 'very-positive' },
  ],
  medium: [
    null,
    { tag: 'Customer Experience Differentiation', tone: 'blue', sentiment: 'positive' },
    { tag: 'Customer Experience and Condiment Misrepresentation', tone: 'green', sentiment: 'negative' },
    { tag: 'Customer Experience Differentiation', tone: 'blue', sentiment: 'positive' },
    { tag: 'Pricing Concerns and Customer Feedback', tone: 'green', sentiment: 'very-positive' },
    { tag: 'Service Speed and Efficiency', tone: 'green', sentiment: 'very-positive' },
  ],
  low: [
    { tag: 'Staff Service', tone: 'green', sentiment: 'negative' },
    { tag: 'Overall Experience', tone: 'blue', sentiment: 'positive' },
    { tag: 'Overall Experience', tone: 'green', sentiment: 'negative' },
    { tag: 'Customer Experience', tone: 'blue', sentiment: 'positive' },
    { tag: 'Customer Experience', tone: 'green', sentiment: 'very-positive' },
    { tag: 'Staff Service', tone: 'green', sentiment: 'very-positive' },
  ],
};

const SECONDARY_RESPONSE_CLASSIFICATIONS: Partial<
  Record<number, ResponseClassification>
> = {
  1: {
    tag: 'Visit Convenience and Accessibility',
    tone: 'green',
    sentiment: 'neutral',
  },
  2: {
    tag: 'Customer Service Interactions',
    tone: 'blue',
    sentiment: 'positive',
  },
  4: {
    tag: 'Overall Experience Value',
    tone: 'blue',
    sentiment: 'positive',
  },
};

const COVERAGE_CATEGORIES = [
  { label: 'Untagged', color: '#ed5b5b' },
  { label: '1 sub-theme', color: '#f5a000' },
  { label: '2 sub-themes', color: '#2785d8' },
  { label: '3 sub-themes', color: '#4aa2e8' },
  { label: '4 sub-themes', color: '#8bc6ee' },
  { label: '5 sub-themes', color: '#49a94f' },
];

const QUESTION_VARIANTS: QuestionThemeVariant[] = [
  {
    responseCount: 1500,
    groupPercentages: [17.93, 17.13, 14.53],
    subThemeFactor: 1,
    coverageCounts: [100, 815, 460, 104, 15, 6],
    responseTexts: RAW_RESPONSES.map((response) => response.text),
  },
  {
    responseCount: 1420,
    groupPercentages: [19.14, 16.28, 15.01],
    subThemeFactor: 0.94,
    coverageCounts: [103, 748, 428, 105, 26, 10],
    responseTexts: [
      'More regular updates from leadership would help.',
      'The flexibility and support from my manager stand out.',
      'Clearer priorities would make day-to-day work easier.',
      'The team is friendly and willing to help.',
      'Cross-team decisions sometimes take too long.',
      'Recognition for good work could be more consistent.',
    ],
  },
  {
    responseCount: 1612,
    groupPercentages: [16.82, 18.04, 13.91],
    subThemeFactor: 1.08,
    coverageCounts: [112, 861, 493, 116, 23, 7],
    responseTexts: [
      'Workloads are uneven during the busiest periods.',
      'I appreciate how quickly colleagues step in to help.',
      'Some internal tools make simple tasks harder than necessary.',
      'The culture is collaborative but meetings can run long.',
      'More ownership at the team level would improve delivery.',
      'Career paths need to be communicated more clearly.',
    ],
  },
  {
    responseCount: 1376,
    groupPercentages: [18.45, 15.96, 14.12],
    subThemeFactor: 0.89,
    coverageCounts: [95, 732, 418, 102, 22, 7],
    responseTexts: [
      'People are open and respectful when sharing feedback.',
      'Our team celebrates wins and learns from mistakes.',
      'Remote colleagues could be included more intentionally.',
      'There is a strong sense of trust within my group.',
      'Fewer approval steps would help us move faster.',
      'New starters receive a lot of practical support.',
    ],
  },
  {
    responseCount: 1548,
    groupPercentages: [17.36, 17.88, 15.27],
    subThemeFactor: 1.03,
    coverageCounts: [106, 824, 472, 112, 27, 7],
    responseTexts: [
      'Shared planning sessions would improve coordination.',
      'Teams need one place to track decisions and dependencies.',
      'Earlier feedback from partner departments would save time.',
      'The people are responsive when priorities are clear.',
      'More consistent processes would reduce duplicated work.',
      'Quarterly cross-team reviews have been useful.',
    ],
  },
];

const FALLBACK_QUESTIONS: TextAiDashboardQuestion[] = MOCK_TEXT_AI_ANALYSIS_QUESTIONS.map(
  (question, index) => ({
    id: `theme-${question.code}`,
    text: question.text,
    creditsUsed: 880 + index * 73,
  })
);

function readSavedConfiguration(storageKey: string, legacyKey: string): { assignments: TagAssignments; codeFrames: CodeFrames } {
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return { assignments: parseTagAssignments(window.localStorage.getItem(legacyKey)), codeFrames: {} };
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== 'object' || !('assignments' in value) || !('codeFrames' in value)) {
    throw new Error('Invalid saved configuration');
  }
  return { assignments: parseTagAssignments(JSON.stringify(value.assignments)), codeFrames: parseCodeFrames(value.codeFrames) };
}

function formatPercentage(value: number): string {
  return `${Number(value.toFixed(2))}%`;
}

function hasResponses(percentage: string): boolean {
  return Number.parseFloat(percentage) > 0;
}

function getResponseTagSentimentClass(
  sentiment: TextAiAssignedSentiment
): string {
  if (sentiment === 'very-negative') return styles.responseTagVeryNegative;
  if (sentiment === 'negative') return styles.responseTagNegative;
  if (sentiment === 'positive') return styles.responseTagPositive;
  if (sentiment === 'very-positive') return styles.responseTagVeryPositive;
  return styles.responseTagNeutral;
}

function getSubThemeEditKey(
  questionId: string,
  themeId: string,
  subThemeId: string
): string {
  return `${questionId}:${themeId}:${subThemeId}`;
}

function getDefaultSubThemeDescription(name: string): string {
  return `Responses that relate to ${name.toLowerCase()} within this theme.`;
}

function ThemeGroupCard({ group, collapsed, onEditSubTheme, onDeleteTheme, onDeleteSubTheme,
  onMoveSubTheme, onRenameTheme, onSelectionToggle, onToggle, selectedKeys,
}: {
  group: ThemeGroup;
  collapsed: boolean;
  onEditSubTheme: (subTheme: SubTheme) => void;
  onDeleteTheme: () => void;
  onDeleteSubTheme: (subTheme: SubTheme) => void;
  onMoveSubTheme: (subTheme: SubTheme) => void;
  onRenameTheme: (name: string) => string | null;
  onSelectionToggle: (target: ApproveTarget) => void;
  onToggle: () => void;
  selectedKeys: ReadonlySet<string>;
}) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(group.name);
  const [renameError, setRenameError] = useState<string | null>(null);
  function saveName() {
    const error = onRenameTheme(name);
    setRenameError(error);
    if (!error) setRenaming(false);
  }
  return (
    <section className={`${styles.themeGroup} ${styles[`themeGroup${group.tone}`]}`}>
      <div className={`${styles.themeGroupHeader} ${styles[`themeGroupHeader${group.tone}`]}`}
        onClick={event => {
          if (!renaming && event.target instanceof Element && !event.target.closest('button, input')) onToggle();
        }}>
        <button type="button" className={styles.themeCollapseButton} onClick={onToggle}
          aria-expanded={!collapsed} aria-label={`${collapsed ? 'Expand' : 'Collapse'} theme ${group.name}`}>
          <span className={`wm-expand-more ${collapsed ? styles.chevronCollapsed : ''}`} aria-hidden />
        </button>
        {renaming ? <div className={styles.inlineThemeRename}>
          <input aria-label="Theme name" maxLength={100} autoFocus value={name}
            onChange={event => setName(event.target.value)} onKeyDown={event => {
              if (event.key === 'Enter') saveName();
              if (event.key === 'Escape') setRenaming(false);
            }} />
          <button type="button" aria-label="Apply theme name" onClick={saveName}><span className="wm-check" aria-hidden /></button>
          <button type="button" aria-label="Cancel theme rename" onClick={() => setRenaming(false)}><span className="wm-close" aria-hidden /></button>
          {renameError && <span role="alert">{renameError}</span>}
        </div> : <button type="button" className={styles.themeGroupToggle} onClick={onToggle} aria-expanded={!collapsed}>
          <span className={styles.themeGroupLabel}>
            <span className={styles.themeGroupName}>{group.name}</span>
            {group.pendingApproval ? <TextAiPendingApprovalBadge /> : group.emerging ? <TextAiEmergingBadge /> : null}
          </span>
        </button>}
        <span className={styles.themeGroupPercentage}>{group.percentage}</span>
        {!renaming && <div className={styles.themeEditActions}>
          <button type="button" className={styles.editSubThemeButton} disabled={group.id === 'outlier'}
            aria-label={`Rename theme ${group.name}`} title="Rename theme" onClick={() => { setName(group.name); setRenameError(null); setRenaming(true); }}>
            <span className="wm-edit" aria-hidden />
          </button>
          <button type="button" disabled={group.id === 'outlier'} className={`${styles.editSubThemeButton} ${styles.deleteActionButton}`}
            onClick={onDeleteTheme} aria-label={`Delete theme ${group.name}`} title="Delete theme">
            <span className="wm-delete" aria-hidden />
          </button>
        </div>}
      </div>
      {!collapsed && <div className={styles.subThemeGrid}>
        {group.subThemes.map(subTheme => {
          const target: ApproveTarget = { kind: 'sub-theme', name: subTheme.name, subThemeId: subTheme.id, themeId: group.id };
          const selected = selectedKeys.has(getApproveTargetKey(target));
          const protectedSubTheme = group.id === 'outlier' && subTheme.id === 'censored';
          return <div className={`${styles.subTheme} ${selected ? styles.subThemeSelected : ''}`} key={subTheme.id}
            onClick={event => {
              if (event.target instanceof Element && !event.target.closest('button')) onSelectionToggle(target);
            }}>
            <button type="button" className={styles.subThemeSelectButton} aria-pressed={selected}
              aria-label={`${selected ? 'Deselect' : 'Select'} sub-theme ${subTheme.name}`} onClick={() => onSelectionToggle(target)}>
              <span className={styles.subThemeContent}>
                <span className={styles.subThemeMain}>
                  <span>{subTheme.name}</span>
                  {subTheme.pendingApproval ? <TextAiPendingApprovalBadge /> : subTheme.emerging ? <TextAiEmergingBadge /> : null}
                </span>
                {subTheme.description && <span className={styles.subThemeDescription}>{subTheme.description}</span>}
              </span>
              <span className={styles.subThemePercentage}>{subTheme.percentage}</span>
            </button>
            <div className={styles.subThemeMeta}>
              <button type="button" className={styles.editSubThemeButton} disabled={protectedSubTheme}
                onClick={() => onEditSubTheme(subTheme)} aria-label={`Rename sub-theme ${subTheme.name}`} title="Rename">
                <span className="wm-edit" aria-hidden />
              </button>
              <button type="button" className={styles.editSubThemeButton} disabled={protectedSubTheme}
                onClick={() => onMoveSubTheme(subTheme)} aria-label={`Move sub-theme ${subTheme.name}`} title="Move">
                <span className="wm-drive-file-move" aria-hidden />
              </button>
              <button type="button" className={`${styles.editSubThemeButton} ${styles.deleteActionButton}`} disabled={protectedSubTheme}
                onClick={() => onDeleteSubTheme(subTheme)} aria-label={`Delete sub-theme ${subTheme.name}`} title="Delete">
                <span className="wm-delete" aria-hidden />
              </button>
            </div>
          </div>;
        })}
        {group.subThemes.length === 0 && <p className={styles.noSubThemes}>No sub-themes remain in this theme.</p>}
      </div>}
    </section>
  );
}

export default function TextAiThemeConfigurationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const numericDashboardId = Number(id);
  const dashboard = getTextAiDashboardById(numericDashboardId);
  const questions = dashboard?.questions?.length ? dashboard.questions : FALLBACK_QUESTIONS;
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(
    () => questions[0]?.id ?? ''
  );
  const [censoredReviewOpen, setCensoredReviewOpen] = useState(false);
  const [censoredSelection, setCensoredSelection] = useState<Set<number>>(new Set());
  const [censoredSearch, setCensoredSearch] = useState('');
  const [censoredPage, setCensoredPage] = useState(0);
  const [responseSubthemeFilters, setResponseSubthemeFilters] = useState<Set<string>>(() => new Set());
  const [responseTagCount, setResponseTagCount] = useState<number | 'all' | 'untagged'>('all');
  const [newestFirst, setNewestFirst] = useState(true);
  const [rawDataExpanded, setRawDataExpanded] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [responseDateRange, setResponseDateRange] = useState({ startDate: '', endDate: '' });
  const [sentimentFilter, setSentimentFilter] = useState('');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [moveTargets, setMoveTargets] = useState<ApproveTarget[]>([]);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [moveParentId, setMoveParentId] = useState('');
  const [moveError, setMoveError] = useState('');
  const [search, setSearch] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => new Set());
  const [selectedCodeFrameKeys, setSelectedCodeFrameKeys] = useState<Set<string>>(
    () => new Set()
  );
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [themePreferences, setThemePreferences] = useState<TextAiThemePreferences>({
    approvedEmergingNames: [],
    emergingApprovedAtByName: {},
    emergingThemeValidityDays: 30,
    showThemesWithNoResponses: true,
    showCensoredSubthemes: false,
  });
  const appliedGranularity: GranularityLevel = 'medium';
  const [recodeModalOpen, setRecodeModalOpen] = useState(false);
  const [recodeScope, setRecodeScope] =
    useState<RecodeScope>('new-sub-themes');
  const [recodesUsed, setRecodesUsed] = useState(0);
  const [customRecodeSubThemeIds, setCustomRecodeSubThemeIds] = useState<string[]>(
    []
  );
  const [editSubThemeTarget, setEditSubThemeTarget] =
    useState<EditSubThemeTarget | null>(null);
  const [draftSubThemeName, setDraftSubThemeName] = useState('');
  const [draftSubThemeDescription, setDraftSubThemeDescription] = useState('');
  const [selectedResponseIds, setSelectedResponseIds] = useState<Set<number>>(
    () => new Set()
  );
  const [rawDataPage, setRawDataPage] = useState(0);
  const [sentimentEditorOpen, setSentimentEditorOpen] = useState(false);
  const [responseSentimentEdits, setResponseSentimentEdits] = useState<
    Record<string, TextAiSentimentDraft>
  >(() => ({}));
  const [sentimentUpdateMessage, setSentimentUpdateMessage] = useState('');
  const [savedTagAssignments, setSavedTagAssignments] = useState<TagAssignments>({});
  const [tagDrafts, setTagDrafts] = useState<TagDrafts>({});
  const [tagsReady, setTagsReady] = useState(false);
  const [tagMessage, setTagMessage] = useState('');
  const [tagError, setTagError] = useState('');
  const [tagConfirmation, setTagConfirmation] = useState<'save' | 'discard' | null>(null);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [taggingResponseIds, setTaggingResponseIds] = useState<number[]>([]);
  const [tagPickerIds, setTagPickerIds] = useState<string[]>([]);
  const tagSummary = useMemo(() => summarizeTagDrafts(tagDrafts), [tagDrafts]);
  const [savedCodeFrames, setSavedCodeFrames] = useState<CodeFrames>({});
  const [codeFrameDrafts, setCodeFrameDrafts] = useState<CodeFrameDrafts>({});
  const [configurationAction, setConfigurationAction] = useState<'new-theme' | 'new-sub-theme' | 'merge' | 'delete' | null>(null);
  const [configurationName, setConfigurationName] = useState('');
  const [configurationDescription, setConfigurationDescription] = useState('');
  const [configurationParentId, setConfigurationParentId] = useState('');
  const [deleteTargets, setDeleteTargets] = useState<ApproveTarget[]>([]);
  const codeFrameSummary = useMemo(() => summarizeCodeFrameDrafts(codeFrameDrafts), [codeFrameDrafts]);
  const changeCount = tagSummary.changes + codeFrameSummary.changes;
  const hasTagChanges = changeCount > 0;
  const configurationStorageKey = `bi-stats-text-ai-configuration-v2:${numericDashboardId}`;
  const tagStorageKey = `bi-stats-text-ai-tags-v1:${numericDashboardId}`;
  const isCensoredDemo = numericDashboardId === CENSORED_DEMO_DASHBOARD_ID;
  const tagScope = `${selectedQuestionId}:${isCensoredDemo ? 'medium' : appliedGranularity}:`;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const snapshot = readSavedConfiguration(configurationStorageKey, tagStorageKey);
        setSavedTagAssignments(snapshot.assignments);
        setSavedCodeFrames(snapshot.codeFrames);
        setTagsReady(true);
      } catch {
        setTagsReady(false);
        setTagError('Saved theme configuration could not be loaded. Reload the page to try again.');
      }
      setTagDrafts({});
      setCodeFrameDrafts({});
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [configurationStorageKey, tagStorageKey]);

  useEffect(() => {
    if (!hasTagChanges) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    const guardLink = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest('a') : null;
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin ||
          (destination.pathname === window.location.pathname && destination.search === window.location.search)) return;
      event.preventDefault();
      event.stopPropagation();
      setPendingHref(destination.pathname + destination.search + destination.hash);
      setTagConfirmation('discard');
    };
    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('click', guardLink, true);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      document.removeEventListener('click', guardLink, true);
    };
  }, [hasTagChanges]);


  useEffect(() => {
    const refreshPreferences = () =>
      setThemePreferences(getTextAiThemePreferences(numericDashboardId));
    const timeoutId = window.setTimeout(refreshPreferences, 0);
    window.addEventListener(TEXT_AI_THEME_PREFERENCES_EVENT, refreshPreferences);
    window.addEventListener('storage', refreshPreferences);
    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener(
        TEXT_AI_THEME_PREFERENCES_EVENT,
        refreshPreferences
      );
      window.removeEventListener('storage', refreshPreferences);
    };
  }, [numericDashboardId]);

  function updateThemePreferences(
    update: (current: TextAiThemePreferences) => TextAiThemePreferences
  ): void {
    setThemePreferences((current) => {
      const next = update(current);
      saveTextAiThemePreferences(numericDashboardId, next);
      return next;
    });
  }

  const selectedQuestionIndex = Math.max(
    0,
    questions.findIndex((question) => question.id === selectedQuestionId)
  );
  const selectedQuestion = questions[selectedQuestionIndex] ?? null;
  const questionVariant = useMemo(() => isCensoredDemo ? { ...QUESTION_VARIANTS[0], responseCount: RESTAURANT_RESPONSES.length, responseTexts: RESTAURANT_RESPONSES.map(response => response.text) } : QUESTION_VARIANTS[selectedQuestionIndex % QUESTION_VARIANTS.length], [isCensoredDemo, selectedQuestionIndex]);
  const recodesRemaining = Math.max(0, RECODE_RUN_LIMIT - recodesUsed);

  const baseThemeGroups = useMemo(
    () =>
      isCensoredDemo ? RESTAURANT_THEME_GROUPS : THEME_GROUPS.map((group, groupIndex) => {
        const groupCandidate = Boolean(group.emerging);
        const groupApproved =
          !groupCandidate ||
          themePreferences.approvedEmergingNames.includes(group.name);
        const groupEmerging =
          groupApproved &&
          isTextAiItemEmerging(
            group.name,
            groupCandidate,
            themePreferences.emergingThemeValidityDays,
            themePreferences.emergingApprovedAtByName[group.name]
          );

        return {
          ...group,
          emerging: groupEmerging,
          pendingApproval: groupCandidate && !groupApproved,
          percentage: formatPercentage(questionVariant.groupPercentages[groupIndex]),
          subThemes: group.subThemes
            .map((subTheme, subThemeIndex) => {
              const basePercentage = Number.parseFloat(subTheme.percentage);
              const indexAdjustment =
                ((subThemeIndex % 3) - 1) * selectedQuestionIndex * 0.04;
              const name = subTheme.name;
              const subThemeCandidate =
                groupCandidate || Boolean(subTheme.emerging);
              const subThemeApproved =
                !subThemeCandidate ||
                themePreferences.approvedEmergingNames.includes(name);
              return {
                ...subTheme,
                emerging:
                  subThemeApproved &&
                  isTextAiItemEmerging(
                    name,
                    subThemeCandidate,
                    themePreferences.emergingThemeValidityDays,
                    themePreferences.emergingApprovedAtByName[name]
                  ),
                pendingApproval: subThemeCandidate && !subThemeApproved,
                description:
                  subTheme.description ??
                  getDefaultSubThemeDescription(subTheme.name),
                name,
                percentage: formatPercentage(
                  Math.max(
                    0,
                    basePercentage * questionVariant.subThemeFactor + indexAdjustment
                  )
                ),
              };
            }),
        };
      }),
    [
      isCensoredDemo,
      questionVariant,
      selectedQuestionIndex,
      themePreferences.approvedEmergingNames,
      themePreferences.emergingApprovedAtByName,
      themePreferences.emergingThemeValidityDays,
    ]
  );

  const unfilteredThemeGroups = useMemo(() => {
    const savedFrame = codeFrameDrafts[tagScope]?.after ?? savedCodeFrames[tagScope];
    const source = ensureOutlierTheme(savedFrame ?? baseThemeGroups, !savedFrame);
    const currentAssignments = { ...savedTagAssignments, ...Object.fromEntries(Object.entries(tagDrafts).map(([key, value]) => [key, value.after])) };
    const demoRows = isCensoredDemo ? RESTAURANT_RESPONSES.map(response => ({ ...response, subthemes: currentAssignments[(response.id >= 100001 ? outlierResponseKey(selectedQuestionId, response.id) : `${tagScope}${response.id}`)] ?? response.subthemes })) : getSharedOutlierResponses(selectedQuestionId, currentAssignments);
    const countBase = isCensoredDemo ? demoRows.length : questionVariant.responseCount + demoRows.length;
    return source.map((group) => {
      const original = THEME_GROUPS.find((item) => item.id === group.id);
      const groupCandidate = Boolean(original?.emerging);
      const groupApproved = !groupCandidate || themePreferences.approvedEmergingNames.includes(group.name);
      return { ...group,
        percentage: isCensoredDemo || group.id === 'outlier' ? formatPercentage(demoRows.filter(response => response.subthemes.some(tag => tag.id.startsWith(`${group.id}:`))).length / countBase * 100) : group.percentage,
        pendingApproval: groupCandidate && !groupApproved,
        emerging: groupApproved && isTextAiItemEmerging(group.name, groupCandidate, themePreferences.emergingThemeValidityDays, themePreferences.emergingApprovedAtByName[group.name]),
        subThemes: group.subThemes.map((sub) => {
          const candidate = groupCandidate || Boolean(original?.subThemes.find((item) => item.id === sub.id)?.emerging);
          const approved = !candidate || themePreferences.approvedEmergingNames.includes(sub.name);
          return { ...sub, percentage: isCensoredDemo || group.id === 'outlier' ? formatPercentage(demoRows.filter(response => response.subthemes.some(tag => tag.id === `${group.id}:${sub.id}`)).length / countBase * 100) : sub.percentage, pendingApproval: candidate && !approved,
            emerging: approved && isTextAiItemEmerging(sub.name, candidate, themePreferences.emergingThemeValidityDays, themePreferences.emergingApprovedAtByName[sub.name]) };
        }),
      };
    });
  }, [baseThemeGroups, codeFrameDrafts, savedCodeFrames, tagScope, themePreferences, isCensoredDemo, savedTagAssignments, tagDrafts, selectedQuestionId, questionVariant.responseCount]);
  const codeFrameLabels = useMemo(() => new Map<string, string>(unfilteredThemeGroups.flatMap((group) =>
    group.subThemes.map((sub) => [`${group.id}:${sub.id}`, sub.name] as const))), [unfilteredThemeGroups]);

  const questionResponses = useMemo<TextAiSentimentEditableResponse[]>(
    () => {
      const ordinaryResponses = Array.from({ length: questionVariant.responseCount }, (_, index) => {
        const sampleIndex = index % RAW_RESPONSES.length;
        const response = RAW_RESPONSES[sampleIndex];
        const responseId = index + 1;
        const classification =
          RESPONSE_CLASSIFICATIONS[appliedGranularity][sampleIndex];
        const classifications = classification
          ? [
              classification,
              ...(SECONDARY_RESPONSE_CLASSIFICATIONS[sampleIndex]
                ? [SECONDARY_RESPONSE_CLASSIFICATIONS[sampleIndex]]
                : []),
            ]
          : [];
        const subthemes = classifications.map((item, subthemeIndex) => {
          const group = THEME_GROUPS.find((group) => group.subThemes.some((subtheme) => subtheme.name === item.tag));
          const taxonomyId = group?.subThemes.find((subtheme) => subtheme.name === item.tag)?.id;
          return {
            id: group && taxonomyId ? `${group.id}:${taxonomyId}` : `seed:${sampleIndex}:${subthemeIndex}`,
            label: item.tag,
            sentiment: item.sentiment,
            tone: item.tone,
          };
        });
        const edit =
          responseSentimentEdits[`${selectedQuestionId}:${responseId}`];
        const assignmentKey = `${tagScope}${responseId}`;
        const assignedSubthemes = tagDrafts[assignmentKey]?.after ?? savedTagAssignments[assignmentKey] ?? (isCensoredDemo ? RESTAURANT_RESPONSES[index].subthemes : subthemes);
        const editedSubthemes = assignedSubthemes.map((subtheme) => ({
          ...subtheme,
          label: codeFrameLabels.get(subtheme.id) ?? subtheme.label,
          sentiment:
            edit?.subthemeSentiments[subtheme.id] ?? subtheme.sentiment,
        }));
        return {
          id: responseId,
          text: isCensoredDemo ? RESTAURANT_RESPONSES[index].text : questionVariant.responseTexts[sampleIndex] ?? response.text,
          responseSentimentOverride: edit?.responseSentiment ?? null,
          responseSentiment:
            edit?.responseSentiment ??
            (editedSubthemes.length === 1
              ? editedSubthemes[0].sentiment
              : 'neutral'),
          subthemes: editedSubthemes,
        };
      });
      if (isCensoredDemo) return ordinaryResponses;
      const assignments = { ...savedTagAssignments, ...Object.fromEntries(Object.entries(tagDrafts).map(([key, draft]) => [key, draft.after])) };
      return [...ordinaryResponses, ...getSharedOutlierResponses(selectedQuestionId, assignments).map(response => ({ ...response,
        subthemes: response.subthemes.map(tag => ({ ...tag, label: codeFrameLabels.get(tag.id) ?? tag.label,
          sentiment: responseSentimentEdits[`${selectedQuestionId}:${response.id}`]?.subthemeSentiments[tag.id] ?? tag.sentiment })),
      }))];
    },
    [
      appliedGranularity,
      questionVariant,
      responseSentimentEdits,
      isCensoredDemo,
      savedTagAssignments,
      codeFrameLabels,
      tagDrafts,
      tagScope,
      selectedQuestionId,
    ]
  );

  const searchedAnalysisResponses = useMemo(() => filterThemeResponses(questionResponses, {
    showCensored: true, subthemeIds: new Set(), search, minimumTags: 'all', newestFirst: false,
    sentiment: sentimentFilter, ...responseDateRange,
  }), [questionResponses, search, sentimentFilter, responseDateRange]);
  const themeGroups = useMemo(() => {
    const base = searchedAnalysisResponses.length;
    const visible = visibleCensoredResponses(searchedAnalysisResponses, themePreferences.showCensoredSubthemes);
    return unfilteredThemeGroups.map(group => {
      const included = group.id === 'outlier' ? searchedAnalysisResponses : visible;
      return { ...group,
        percentage: formatPercentage(base ? included.filter(response => response.subthemes.some(tag => tag.id.startsWith(`${group.id}:`))).length / base * 100 : 0),
        subThemes: group.subThemes.map(sub => ({ ...sub,
          percentage: formatPercentage(base ? (sub.id === 'censored' && group.id === 'outlier' ? searchedAnalysisResponses : visible)
            .filter(response => response.subthemes.some(tag => tag.id === `${group.id}:${sub.id}`)).length / base * 100 : 0),
        })).sort((a,b) => Number.parseFloat(b.percentage)-Number.parseFloat(a.percentage)),
      };
    }).sort((a,b) => Number.parseFloat(b.percentage)-Number.parseFloat(a.percentage));
  }, [searchedAnalysisResponses, unfilteredThemeGroups, themePreferences.showCensoredSubthemes]);

  const pendingApprovalTargets = useMemo(() => {
    return themeGroups.flatMap((group): ApproveTarget[] => {
      const targets: ApproveTarget[] = [];
      group.subThemes.forEach((subTheme) => {
        if (subTheme.pendingApproval) {
          targets.push({
            kind: 'sub-theme',
            name: subTheme.name,
            subThemeId: subTheme.id,
            themeId: group.id,
          });
        }
      });
      return targets;
    });
  }, [themeGroups]);

  const codeFrameTargets = useMemo(
    () =>
      themeGroups.flatMap((group): ApproveTarget[] =>
        group.subThemes.map((subTheme): ApproveTarget => ({
          kind: 'sub-theme',
          name: subTheme.name,
          subThemeId: subTheme.id,
          themeId: group.id,
        }))
      ),
    [themeGroups]
  );

  const selectedCodeFrameTargets = useMemo(
    () =>
      codeFrameTargets.filter((target) =>
        selectedCodeFrameKeys.has(getApproveTargetKey(target))
      ),
    [codeFrameTargets, selectedCodeFrameKeys]
  );

  const pendingApprovalKeys = useMemo(
    () =>
      new Set(
        pendingApprovalTargets.map((target) => getApproveTargetKey(target))
      ),
    [pendingApprovalTargets]
  );

  const canApproveSelection =
    selectedCodeFrameTargets.length > 0 &&
    selectedCodeFrameTargets.every((target) =>
      pendingApprovalKeys.has(getApproveTargetKey(target))
    );
  const selectionContainsOnlySubThemes =
    selectedCodeFrameTargets.length > 0 &&
    selectedCodeFrameTargets.every((target) => target.kind === 'sub-theme');
  const protectedSelection = selectedCodeFrameTargets.some(target => target.themeId === 'outlier' && target.kind === 'sub-theme' && target.subThemeId === 'censored');
  const canMergeSelection =
    !protectedSelection && selectionContainsOnlySubThemes && selectedCodeFrameTargets.length > 1;

  const visibleThemeGroups = useMemo(
    () =>
      themeGroups
        .flatMap((group) => {
          if (
            !themePreferences.showThemesWithNoResponses &&
            group.id !== 'outlier' &&
            !group.id.startsWith('custom-') &&
            !hasResponses(group.percentage)
          ) {
            return [];
          }

          const subThemes = group.subThemes.filter(
            (subTheme) =>
              (subTheme.id === 'censored' || themePreferences.showThemesWithNoResponses || subTheme.id.startsWith('custom-') ||
                hasResponses(subTheme.percentage))
          );

          return [{ ...group, subThemes }];
        }),
    [
      themePreferences.showThemesWithNoResponses,
      themeGroups,
    ]
  );

  const coverageItems = useMemo(() => {
    const included = visibleCensoredResponses(searchedAnalysisResponses, themePreferences.showCensoredSubthemes);
    return COVERAGE_CATEGORIES.map((category, index) => {
      const count = included.filter(response => Math.min(response.subthemes.length, 5) === index).length;
      return { ...category, count: `${count}/${included.length}`, percentage: formatPercentage(included.length ? count / included.length * 100 : 0) };
    });
  }, [searchedAnalysisResponses, themePreferences.showCensoredSubthemes]);

  const visibleResponses = useMemo(() => filterThemeResponses(questionResponses, {
    showCensored: themePreferences.showCensoredSubthemes, subthemeIds: responseSubthemeFilters,
    search, minimumTags: responseTagCount, newestFirst, sentiment: sentimentFilter,
    ...responseDateRange,
  }), [questionResponses, search, themePreferences.showCensoredSubthemes, responseSubthemeFilters, responseTagCount, newestFirst, sentimentFilter, responseDateRange]);
  const censoredCount = questionResponses.filter(isCensoredResponse).length;
  const maximumResponseTags = Math.max(1, ...questionResponses.map(response => response.subthemes.length));


  const rawDataPageCount = Math.max(
    1,
    Math.ceil(visibleResponses.length / RAW_RESPONSE_PAGE_SIZE)
  );
  const safeRawDataPage = Math.min(rawDataPage, rawDataPageCount - 1);
  const currentPageResponses = useMemo(
    () =>
      visibleResponses.slice(
        safeRawDataPage * RAW_RESPONSE_PAGE_SIZE,
        (safeRawDataPage + 1) * RAW_RESPONSE_PAGE_SIZE
      ),
    [safeRawDataPage, visibleResponses]
  );
  const selectedResponses = useMemo(
    () =>
      visibleCensoredResponses(questionResponses, themePreferences.showCensoredSubthemes).filter((response) => selectedResponseIds.has(response.id)),
    [questionResponses, selectedResponseIds, themePreferences.showCensoredSubthemes]
  );
  const allVisibleResponsesSelected =
    visibleResponses.length > 0 &&
    visibleResponses.every((response) => selectedResponseIds.has(response.id));
  const someVisibleResponsesSelected =
    !allVisibleResponsesSelected &&
    visibleResponses.some((response) => selectedResponseIds.has(response.id));

  function removeResponseTag(response: TextAiSentimentEditableResponse, tagId: string): void {
    if (!tagsReady) return;
    const key = (response.id >= 100001 ? outlierResponseKey(selectedQuestionId, response.id) : `${tagScope}${response.id}`);
    setTagDrafts((current) => stageTagAssignment(current, key, response.subthemes,
      (current[key]?.after ?? response.subthemes).filter((tag) => tag.id !== tagId)));
    setTagMessage('');
    setTagError('');
  }

  function openTagPicker(responseIds: number[]): void {
    setTaggingResponseIds(responseIds);
    setTagPickerIds([]);
  }

  function addResponseTags(): void {
    const tags: TextAiSentimentSubtheme[] = themeGroups.flatMap((group) => group.subThemes
      .filter((subtheme) => tagPickerIds.includes(`${group.id}:${subtheme.id}`))
      .map((subtheme) => ({ id: `${group.id}:${subtheme.id}`, label: subtheme.name, sentiment: 'neutral' as const })));
    setTagDrafts((current) => {
      let next = current;
      for (const response of questionResponses.filter((response) => taggingResponseIds.includes(response.id))) {
        const key = (response.id >= 100001 ? outlierResponseKey(selectedQuestionId, response.id) : `${tagScope}${response.id}`);
        const existing = next[key]?.after ?? response.subthemes;
        const additions = tags.filter((tag) => !existing.some((item) => item.id === tag.id))
          .map((tag) => next[key]?.before.find((item) => item.id === tag.id) ?? tag);
        next = stageTagAssignment(next, key, response.subthemes, addCensoredAwareTags(existing, additions, themePreferences.showCensoredSubthemes));
      }
      return next;
    });
    setTaggingResponseIds([]);
    setTagMessage('');
    setTagError('');
  }

  function saveThemeAssignments(): void {
    try {
      // Merge into the latest saved snapshot so unrelated saved responses remain intact.
      const latest = readSavedConfiguration(configurationStorageKey, tagStorageKey);
      const assignments = commitTagDrafts(latest.assignments, tagDrafts);
      const codeFrames = { ...latest.codeFrames, ...Object.fromEntries(Object.entries(codeFrameDrafts).map(([scope, draft]) => [scope, draft.after])) };
      window.localStorage.setItem(configurationStorageKey, JSON.stringify({ assignments, codeFrames }));
      setSavedTagAssignments(assignments);
      setSavedCodeFrames(codeFrames);
      setTagDrafts({});
      setCodeFrameDrafts({});
      setSelectedCodeFrameKeys(new Set());
      setTagConfirmation(null);
      setTagError('');
      window.dispatchEvent(new CustomEvent(CENSORED_CONFIGURATION_EVENT));
      try {
        appendTextAiRecodeLog({ action: 'configuration-saved', dashboardId: numericDashboardId,
          question: selectedQuestion?.text ?? 'Selected question', title: 'Theme configuration saved',
          details: `Saved ${changeCount} configuration change${changeCount === 1 ? '' : 's'}: ${tagSummary.added} response tags added, ${tagSummary.removed} removed, ${codeFrameSummary.changes} code frame changes.`,
        });
        setTagMessage('Theme changes saved.');
      } catch { setTagMessage('Theme changes saved. Theme history could not be updated.'); }
    } catch {
      setTagConfirmation(null);
      setTagError('Changes could not be saved. Your edits are still here. Please try again.');
    }
  }

  function discardThemeAssignments(): void {
    setTagDrafts({});
    setCodeFrameDrafts({});
    setSelectedCodeFrameKeys(new Set());
    setTagConfirmation(null);
    setTagError('');
    setTagMessage('Changes discarded. Last saved theme configuration restored.');
    if (pendingHref) router.push(pendingHref);
    setPendingHref(null);
  }

  const configurationParent = themeGroups.find((group) => group.id === configurationParentId);
  const mergeSourceIds = selectedCodeFrameTargets.flatMap((target) => target.kind === 'sub-theme' ? [`${target.themeId}:${target.subThemeId}`] : []);
  const configurationNameError = validateCodeFrameName(configurationName, configurationAction === 'new-theme'
    ? themeGroups.map((group) => group.name)
    : (configurationParent?.subThemes ?? []).filter((sub) => configurationAction !== 'merge' || !mergeSourceIds.includes(`${configurationParentId}:${sub.id}`)).map((sub) => sub.name));
  const editedParent = editSubThemeTarget ? themeGroups.find((group) => group.subThemes.some((sub) =>
    getSubThemeEditKey(selectedQuestionId, group.id, sub.id) === editSubThemeTarget.editKey)) : undefined;
  const subThemeEditError = editSubThemeTarget && draftSubThemeName.trim() !== editSubThemeTarget.previousName
    ? validateCodeFrameName(draftSubThemeName, (editedParent?.subThemes ?? []).filter((sub) =>
      getSubThemeEditKey(selectedQuestionId, editedParent!.id, sub.id) !== editSubThemeTarget.editKey).map((sub) => sub.name)) : null;
  const deletedThemeIds = deleteTargets.filter((target) => target.kind === 'theme').map((target) => target.themeId);
  const deletedSubThemeIds = deleteTargets.flatMap((target) => target.kind === 'sub-theme' ? [`${target.themeId}:${target.subThemeId}`] : []);
  const deletionAffectedCount = questionResponses.filter((response) => response.subthemes.some((tag) =>
    deletedThemeIds.some((id) => tag.id.startsWith(`${id}:`)) || deletedSubThemeIds.includes(tag.id))).length;

  function stageConfiguration(nextGroups: ThemeGroup[], removedIds: string[] = [], destination?: TextAiSentimentSubtheme): void {
    setCodeFrameDrafts((current) => stageCodeFrame(current, tagScope, themeGroups, nextGroups));
    if (removedIds.length) {
      const removed = new Set(removedIds);
      setTagDrafts((current) => {
        let next = current;
        for (const response of questionResponses) {
          const key = (response.id >= 100001 ? outlierResponseKey(selectedQuestionId, response.id) : `${tagScope}${response.id}`);
          const existing = next[key]?.after ?? response.subthemes;
          const after = remapResponseTags(existing, removed, destination);
          if (after !== existing) next = stageTagAssignment(next, key, response.subthemes, after);
        }
        return next;
      });
    }
    setSelectedCodeFrameKeys(new Set());
    setResponseSubthemeFilters(new Set());
    setRawDataPage(0);
    setTagMessage('');
    setTagError('');
    setConfigurationAction(null);
  }

  function openConfigurationAction(action: 'new-theme' | 'new-sub-theme' | 'merge'): void {
    setConfigurationName('');
    setConfigurationDescription('');
    setConfigurationParentId(action === 'merge' ? selectedCodeFrameTargets[0]?.themeId ?? '' : themeGroups[0]?.id ?? '');
    setConfigurationAction(action);
  }

  function applyConfigurationAction(): void {
    if (configurationAction === 'delete') {
      const removed = [...new Set([...deletedSubThemeIds, ...questionResponses.flatMap((response) => response.subthemes
        .filter((tag) => deletedThemeIds.some((id) => tag.id.startsWith(`${id}:`))).map((tag) => tag.id))])];
      stageConfiguration(removeCodeFrameItems(themeGroups, deletedThemeIds, deletedSubThemeIds), removed);
      return;
    }
    if (configurationNameError || !tagsReady) return;
    const name = configurationName.trim();
    const id = `custom-${crypto.randomUUID()}`;
    if (configurationAction === 'new-theme') {
      stageConfiguration([...themeGroups, { id, name, percentage: '0%', tone: 'blue', subThemes: [] }]);
      return;
    }
    if (!configurationParent) return;
    const subTheme: SubTheme = { id, name, description: configurationDescription.trim(), percentage: '0%' };
    if (configurationAction === 'new-sub-theme') {
      stageConfiguration(themeGroups.map((group) => group.id === configurationParentId
        ? { ...group, subThemes: [...group.subThemes, subTheme] } : group));
    } else if (configurationAction === 'merge' && canMergeSelection) {
      stageConfiguration(mergeCodeFrameItems(themeGroups, mergeSourceIds, configurationParentId, subTheme), mergeSourceIds,
        { id: `${configurationParentId}:${id}`, label: name, sentiment: 'neutral' });
    }
  }

  if (!dashboard) {
    return (
      <PageContainer>
        <EmptyState
          icon="wc-ai"
          title="Theme configuration cannot be loaded."
          description="This TextAI dashboard may have been deleted or you do not have access."
          action={<Link href="/text-ai" className={styles.backLink}>Back to TextAI dashboards</Link>}
        />
      </PageContainer>
    );
  }

  function toggleGroup(groupId: string): void {
    setCollapsedGroups((current) => {
      const next = new Set(current);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  function toggleResponseSelection(responseId: number, checked: boolean): void {
    setSentimentUpdateMessage('');
    setSelectedResponseIds((current) => {
      const next = new Set(current);
      if (checked) next.add(responseId);
      else next.delete(responseId);
      return next;
    });
  }

  function toggleAllVisibleResponses(checked: boolean): void {
    setSentimentUpdateMessage('');
    setSelectedResponseIds((current) => {
      const next = new Set(current);
      visibleResponses.forEach((response) => {
        if (checked) next.add(response.id);
        else next.delete(response.id);
      });
      return next;
    });
  }

  function saveResponseSentiments(
    drafts: Record<number, TextAiSentimentDraft>
  ): void {
    setResponseSentimentEdits((current) => ({
      ...current,
      ...Object.fromEntries(
        Object.entries(drafts).map(([responseId, draft]) => [
          `${selectedQuestionId}:${responseId}`,
          draft,
        ])
      ),
    }));
    setSentimentEditorOpen(false);
    setSelectedResponseIds(new Set());
    setSentimentUpdateMessage(
      `Sentiment updated for ${selectedResponses.length.toLocaleString()} ${
        selectedResponses.length === 1 ? 'response' : 'responses'
      }.`
    );
  }

  function openCensoredReview(): void {
    setCensoredReviewOpen(true); setCensoredSelection(new Set()); setCensoredSearch(''); setCensoredPage(0);
  }
  function toggleCodeFrameSelection(target: ApproveTarget): void {
    if (target.kind !== 'sub-theme') return;
    if (target.themeId === 'outlier' && target.subThemeId === 'censored' && !themePreferences.showCensoredSubthemes) {
      openCensoredReview(); return;
    }
    const key = getApproveTargetKey(target);
    const tagId = `${target.themeId}:${target.subThemeId}`;
    setSelectedCodeFrameKeys(current => { const next = new Set(current); if (next.has(key)) next.delete(key); else next.add(key); return next; });
    setResponseSubthemeFilters(current => { const next = new Set(current); if (next.has(tagId)) next.delete(tagId); else next.add(tagId); return next; });
    setSelectedResponseIds(new Set()); setRawDataPage(0);
  }
  function openMove(targets: ApproveTarget[]): void {
    setMoveTargets(targets); setMoveParentId(''); setMoveError(''); setMoveModalOpen(true);
  }
  function applyMove(): void {
    try {
      const sourceIds = moveTargets.flatMap(target => target.kind === 'sub-theme' ? [`${target.themeId}:${target.subThemeId}`] : []);
      const result = moveCodeFrameItems(themeGroups, sourceIds, moveParentId);
      stageConfiguration(result.groups);
      setTagDrafts(current => {
        let next = current;
        for (const response of questionResponses) {
          if (!response.subthemes.some(tag => result.tagIds[tag.id])) continue;
          const key = response.id >= 100001 ? outlierResponseKey(selectedQuestionId, response.id) : `${tagScope}${response.id}`;
          next = stageTagAssignment(next, key, response.subthemes, response.subthemes.map(tag => ({ ...tag, id: result.tagIds[tag.id] ?? tag.id })));
        }
        return next;
      });
      setResponseSubthemeFilters(new Set()); setMoveModalOpen(false);
    } catch (error) { setMoveError(error instanceof Error ? error.message : 'The sub-themes could not be moved.'); }
  }

  function approveTargets(targets: readonly ApproveTarget[]): void {
    if (targets.length === 0) return;
    const automaticallyApprovedParentNames = new Set<string>();
    const names = targets.flatMap((target) => {
      if (target.kind === 'sub-theme') {
        const parentTheme = themeGroups.find(
          (group) => group.id === target.themeId
        );
        if (parentTheme?.pendingApproval) {
          automaticallyApprovedParentNames.add(parentTheme.name);
          return [target.name, parentTheme.name];
        }
        return [target.name];
      }
      const childNames =
        themeGroups
          .find((group) => group.id === target.themeId)
          ?.subThemes.map((subTheme) => subTheme.name) ?? [];
      return [target.name, ...childNames];
    });
    const approvedNames = [...new Set(names)];
    const approvedAt = new Date().toISOString();

    updateThemePreferences((current) => ({
      ...current,
      approvedEmergingNames: [
        ...new Set([...current.approvedEmergingNames, ...approvedNames]),
      ],
      emergingApprovedAtByName: {
        ...current.emergingApprovedAtByName,
        ...Object.fromEntries(
          approvedNames.map((name) => [
            name,
            current.emergingApprovedAtByName[name] ?? approvedAt,
          ])
        ),
      },
    }));
    if (targets.length === 1) {
      const target = targets[0];
      const automaticallyApprovedParentName =
        target.kind === 'sub-theme'
          ? themeGroups.find((group) => group.id === target.themeId)
              ?.pendingApproval
            ? themeGroups.find((group) => group.id === target.themeId)?.name
            : undefined
          : undefined;
      appendTextAiRecodeLog({
        action:
          target.kind === 'theme' ? 'theme-approved' : 'sub-theme-approved',
        dashboardId: numericDashboardId,
        details:
          target.kind === 'theme'
            ? `Approved the pending theme “${target.name}” and its sub-themes. They now appear on the dashboard as Emerging.`
            : automaticallyApprovedParentName
              ? `Approved the pending sub-theme “${target.name}” and its pending parent theme “${automaticallyApprovedParentName}”. They now appear on the dashboard as Emerging.`
              : `Approved the pending sub-theme “${target.name}”. It now appears on the dashboard as Emerging.`,
        question: selectedQuestion?.text ?? 'Selected question',
        title:
          target.kind === 'theme'
            ? 'Pending theme approved'
            : 'Pending sub-theme approved',
      });
    } else {
      const themeCount = targets.filter((target) => target.kind === 'theme').length;
      const subThemeCount = targets.length - themeCount;
      appendTextAiRecodeLog({
        action: 'selected-pending-approved',
        dashboardId: numericDashboardId,
        details: `Approved ${targets.length} selected pending items (${themeCount} themes and ${subThemeCount} sub-themes), plus ${automaticallyApprovedParentNames.size} pending parent theme${automaticallyApprovedParentNames.size === 1 ? '' : 's'} automatically. The emerging-status duration starts now.`,
        question: selectedQuestion?.text ?? 'Selected question',
        title: 'Selected pending items approved',
      });
    }
    setSelectedCodeFrameKeys(new Set());
  }

  function saveSubThemeEdit(): void {
    if (!editSubThemeTarget) return;

    const name = draftSubThemeName.trim();
    if (!name) return;
    if (subThemeEditError) return;
    const description = draftSubThemeDescription.trim();
    const next = themeGroups.map((group) => ({ ...group, subThemes: group.subThemes.map((sub) =>
      getSubThemeEditKey(selectedQuestionId, group.id, sub.id) === editSubThemeTarget.editKey
        ? { ...sub, name, description } : sub) }));
    stageConfiguration(next);
    setEditSubThemeTarget(null);
  }

  function handleRecode(): void {
    if (recodesRemaining === 0) return;
    if (recodeScope === 'custom' && customRecodeSubThemeIds.length === 0) return;

    const details =
      recodeScope === 'new-sub-themes'
        ? 'Reprocessed responses to discover and tag new sub-themes while preserving existing manual tags.'
        : recodeScope === 'all-sub-themes'
          ? 'Reprocessed all responses across every sub-theme. Existing manual response tags may have been overwritten.'
          : `Reprocessed responses for ${customRecodeSubThemeIds.length} selected sub-theme${
              customRecodeSubThemeIds.length === 1 ? '' : 's'
            }.`;

    appendTextAiRecodeLog({
      action: 'recode-run',
      dashboardId: numericDashboardId,
      details,
      question: selectedQuestion?.text ?? 'Selected question',
      title: 'Responses recoded',
    });
    setRecodesUsed((current) => Math.min(current + 1, RECODE_RUN_LIMIT));
    setRecodeModalOpen(false);
  }

  return (
    <PageContainer className={styles.page}>
      <div className={styles.utilityBar}>
        <label className={styles.searchBox}>
          <span className="wm-search" aria-hidden />
          <span className={styles.srOnly}>Search themes or responses</span>
          <input value={search} onChange={event => { setSearch(event.target.value); setRawDataPage(0); }} placeholder="Search themes or responses..." />
        </label>
        <div className={styles.utilityActions}>
          <button type="button" className={styles.toolbarTextButton} aria-expanded={filtersOpen} onClick={() => setFiltersOpen(open => !open)}>
            <span className="wm-filter-alt" aria-hidden /> Filter
          </button>
          <button type="button" className={styles.iconButton} aria-label="Theme history" title="Theme history" onClick={() => setHistoryOpen(true)}>
            <span className="wm-history" aria-hidden />
          </button>
          <WuButton type="button" variant="iconOnly" size="sm" className={styles.settingsAction} aria-label="Theme configuration settings"
            Icon={<span className="wm-settings" aria-hidden />} onClick={() => setSettingsModalOpen(true)} />
          <Link href={`/text-ai/${dashboard.id}`} className={styles.dashboardLink} aria-label={`Back to ${dashboard.name} dashboard`} title="Dashboard">
            <span className="wc-report" aria-hidden />
          </Link>
          <button type="button" className={styles.recodeTrigger} disabled={hasTagChanges}
            title={hasTagChanges ? 'Save or cancel configuration changes before recoding' : undefined}
            onClick={() => { setRecodeScope('new-sub-themes'); setCustomRecodeSubThemeIds([]); setRecodeModalOpen(true); }} aria-haspopup="dialog">Recode</button>
          {hasTagChanges && <div className={styles.themeSaveActions} aria-label="Theme configuration changes">
            <span className={styles.unsavedChangeCount} role="status">{changeCount} unsaved change{changeCount === 1 ? '' : 's'}</span>
            <WuButton size="sm" variant="secondary" onClick={() => { setPendingHref(null); setTagConfirmation('discard'); }}>Cancel</WuButton>
            <WuButton size="sm" variant="primary" onClick={() => setTagConfirmation('save')}>Save</WuButton>
          </div>}
        </div>
      </div>
      {!hasTagChanges && tagMessage && <p className={styles.savedMessage} role="status">{tagMessage}</p>}
      {filtersOpen && <section className={styles.configurationFilterPanel} aria-label="Theme configuration filters">
        <div className={styles.configurationFilters}>
          {questions.length > 1 && <div className={styles.questionFilter}>
            <span className={styles.filterLabel}>Question</span>
            <WuCombobox data={questions} accessorKey={{ value: 'id', label: 'text' }} value={selectedQuestion}
              onSelect={option => {
                if (!option || Array.isArray(option)) return;
                setSelectedQuestionId((option as TextAiDashboardQuestion).id); setSearch(''); setSelectedCodeFrameKeys(new Set());
                setResponseSubthemeFilters(new Set()); setSelectedResponseIds(new Set()); setRawDataPage(0); setSentimentUpdateMessage(''); setEditSubThemeTarget(null);
              }} variant="outlined" enableSearch isEllipse maxHeight={320} noDataContent="No questions found" className={styles.questionSelect} aria-label="Question" />
          </div>}
          <div className={styles.dateFilter}><span className={styles.filterLabel}>Filter by date</span>
            <SharedDashboardDateFilter {...responseDateRange} onChange={range => { setResponseDateRange(range); setRawDataPage(0); setSelectedResponseIds(new Set()); }} />
          </div>
          <label className={styles.filterField}><span className={styles.filterLabel}>Sentiment</span>
            <select value={sentimentFilter} onChange={event => { setSentimentFilter(event.target.value); setRawDataPage(0); setSelectedResponseIds(new Set()); }}>
              <option value="">All sentiments</option>
              {(['very-negative', 'negative', 'neutral', 'positive', 'very-positive'] as TextAiAssignedSentiment[]).map(value => <option key={value} value={value}>{getSentimentLabel(value)}</option>)}
            </select>
          </label>
          <button type="button" className={styles.toolbarTextButton} onClick={() => { setResponseDateRange({startDate:'',endDate:''}); setSentimentFilter(''); setSearch(''); setResponseSubthemeFilters(new Set()); setResponseTagCount('all'); setSelectedCodeFrameKeys(new Set()); setRawDataPage(0); setSelectedResponseIds(new Set()); }}>Reset</button>
        </div>
      </section>}
      {tagError && <p className={styles.tagError} role="alert">{tagError}</p>}

      <div className={`${styles.workspace} ${rawDataExpanded ? styles.rawDataExpanded : ''}`}>
        <section className={styles.codeFramePanel} aria-label="Code frame">
          <header className={styles.codeFrameHeader}>
            <div className={styles.codeFrameTitle}>
              <strong>My code frame</strong>
              <span className={styles.headerCount}>{themeGroups.reduce((count, group) => count + group.subThemes.length, 0)}</span>
            </div>
            <div className={styles.codeFrameActions}>
              <span className={styles.headerCount}>{searchedAnalysisResponses.length}</span>
              <button type="button" disabled={!tagsReady || themeGroups.length === 0} onClick={() => openConfigurationAction('new-sub-theme')}>New sub-theme</button>
              <button type="button" disabled={!tagsReady} onClick={() => openConfigurationAction('new-theme')}>New theme</button>
            </div>
          </header>
          <div className={styles.themeScrollArea}>
            {visibleThemeGroups.length === 0 && <p className={styles.noSubThemes}>No themes to display. Create a new theme to start building your code frame.</p>}
            {visibleThemeGroups.map((group) => (
              <ThemeGroupCard
                key={group.id}
                group={group}
                collapsed={collapsedGroups.has(group.id)}
                onEditSubTheme={(subTheme) => {
                  setEditSubThemeTarget({
                    editKey: getSubThemeEditKey(
                      selectedQuestionId,
                      group.id,
                      subTheme.id
                    ),
                    previousDescription:
                      subTheme.description ??
                      getDefaultSubThemeDescription(subTheme.name),
                    previousName: subTheme.name,
                  });
                  setDraftSubThemeName(subTheme.name);
                  setDraftSubThemeDescription(
                    subTheme.description ??
                      getDefaultSubThemeDescription(subTheme.name)
                  );
                }}
                onRenameTheme={name => {
                  const error = validateCodeFrameName(name, themeGroups.filter(item => item.id !== group.id).map(item => item.name));
                  if (error) return error;
                  stageConfiguration(themeGroups.map(item => item.id === group.id ? { ...item, name: name.trim() } : item));
                  return null;
                }}
                onMoveSubTheme={subTheme => openMove([{ kind: 'sub-theme', themeId: group.id, subThemeId: subTheme.id, name: subTheme.name }])}
                onDeleteSubTheme={subTheme => { setDeleteTargets([{ kind: 'sub-theme', themeId: group.id, subThemeId: subTheme.id, name: subTheme.name }]); setConfigurationAction('delete'); }}
                onDeleteTheme={() => {
                  setDeleteTargets([{ kind: 'theme', themeId: group.id, name: group.name }]);
                  setConfigurationAction('delete');
                }}
                onSelectionToggle={toggleCodeFrameSelection}
                onToggle={() => toggleGroup(group.id)}
                selectedKeys={selectedCodeFrameKeys}
              />
            ))}
          </div>
        </section>

        <section className={styles.rawDataPanel} aria-label="Explore raw data">
          <header className={styles.rawDataHeader}>
            <h1>Explore raw data</h1>
            <div className={styles.rawDataTools}>
              <label className={styles.coverageSelect}>
                <span className={styles.srOnly}>Filter by number of sub-themes</span>
                <select value={String(responseTagCount)} onChange={event => { setResponseTagCount(event.target.value === 'all' || event.target.value === 'untagged' ? event.target.value : Number(event.target.value)); setRawDataPage(0); setSelectedResponseIds(new Set()); }}>
                  <option value="all">All</option><option value="untagged">Untagged</option>
                  {Array.from({length:maximumResponseTags},(_,index) => <option key={index+1} value={index+1}>At least {index+1}</option>)}
                </select>
              </label>
              <button type="button" className={styles.iconButton} aria-label={rawDataExpanded ? 'Restore raw data panel' : 'Expand raw data'}
                title={rawDataExpanded ? 'Restore raw data panel' : 'Expand raw data'} onClick={() => setRawDataExpanded(expanded => !expanded)}>
                <span className={rawDataExpanded ? 'wm-close-fullscreen' : 'wm-open-in-full'} aria-hidden />
              </button>
            </div>
          </header>

          <div className={styles.coverageSection}>
            <h2>Theme coverage</h2>
            <div className={styles.coverageBar} aria-label="Theme coverage distribution">
              {coverageItems.filter(item => !item.count.startsWith('0/')).map((item) => (
                <span
                  key={item.label}
                  style={{ backgroundColor: item.color, width: item.percentage }}
                  title={`${item.label}: ${item.percentage} (${item.count.split('/')[0]} responses)`}
                />
              ))}
            </div>
            <div className={styles.coverageLegend}>
              {coverageItems.filter(item => !item.count.startsWith('0/')).map((item) => (
                <div className={styles.legendItem} key={item.label}>
                  <span className={styles.legendDot} style={{ backgroundColor: item.color }} />
                  <strong>{item.label}</strong>
                  <span className={styles.legendPercentage}>{item.percentage}</span>
                  <span className={styles.legendCount}>({item.count})</span>
                </div>
              ))}
            </div>
          </div>

          {!themePreferences.showCensoredSubthemes && censoredCount > 0 && <div className={styles.censoredNote} role="note">
            <span>{censoredCount} censored response{censoredCount === 1 ? '' : 's'} hidden from this panel and dashboard.</span>
            <button type="button" onClick={openCensoredReview}>Review</button>
          </div>}
          {responseSubthemeFilters.size > 0 && <div className={styles.responseFilterNote}>
            <span>Filtered by: {responseSubthemeFilters.size} sub-theme{responseSubthemeFilters.size === 1 ? '' : 's'}</span>
            <button type="button" aria-label="Clear all sub-theme filters" onClick={() => { setResponseSubthemeFilters(new Set()); setSelectedCodeFrameKeys(new Set()); setRawDataPage(0); setSelectedResponseIds(new Set()); }}><span className="wm-filter-alt-off" aria-hidden /></button>
          </div>}
          <div className={styles.responseSelectionToolbar} hidden={selectedResponses.length === 0}>
            <label className={styles.selectAllResponses}>
              <input
                type="checkbox"
                ref={(input) => {
                  if (input) input.indeterminate = someVisibleResponsesSelected;
                }}
                checked={allVisibleResponsesSelected}
                onChange={(event) =>
                  toggleAllVisibleResponses(event.target.checked)
                }
                disabled={visibleResponses.length === 0}
              />
              <span>
                Select all ({visibleResponses.length.toLocaleString()} responses)
              </span>
            </label>
            <div className={styles.responseSelectionActions} aria-live="polite">
              {sentimentUpdateMessage ? (
                <span className={styles.sentimentUpdateMessage} role="status">
                  <span className="wm-check" aria-hidden />
                  {sentimentUpdateMessage}
                </span>
              ) : null}
              <span className={styles.selectedResponseCount}>
                {selectedResponses.length.toLocaleString()} selected
              </span>
              {selectedResponses.length > 0 ? (
                <button
                  type="button"
                  className={styles.clearResponseSelection}
                  onClick={() => setSelectedResponseIds(new Set())}
                >
                  Clear
                </button>
              ) : null}
              <button
                type="button"
                className={styles.updateSentimentButton}
                disabled={!tagsReady || selectedResponses.length === 0}
                onClick={() => openTagPicker(selectedResponses.map((response) => response.id))}
              >
                <span className="wm-add" aria-hidden /> Add sub-theme
              </button>
              <button
                type="button"
                className={styles.updateSentimentButton}
                disabled={selectedResponses.length === 0}
                onClick={() => setSentimentEditorOpen(true)}
              >
                Update sentiment
              </button>
            </div>
          </div>

          <div className={styles.pagination}>
            <button
              type="button"
              aria-label="Previous page"
              disabled={safeRawDataPage === 0}
              onClick={() =>
                setRawDataPage((current) => Math.max(0, current - 1))
              }
            >
              <span className="wm-chevron-left" aria-hidden />
            </button>
            <select className={styles.pageRangeSelect} aria-label="Response page" value={safeRawDataPage} onChange={event => setRawDataPage(Number(event.target.value))}>
              {Array.from({length:rawDataPageCount},(_,page) => <option key={page} value={page}>{visibleResponses.length ? page * RAW_RESPONSE_PAGE_SIZE + 1 : 0} - {Math.min((page+1) * RAW_RESPONSE_PAGE_SIZE,visibleResponses.length)}</option>)}
            </select>
            <button
              type="button"
              aria-label="Next page"
              disabled={safeRawDataPage >= rawDataPageCount - 1}
              onClick={() =>
                setRawDataPage((current) =>
                  Math.min(rawDataPageCount - 1, current + 1)
                )
              }
            >
              <span className="wm-chevron-right" aria-hidden />
            </button>
            <span className={styles.itemCount}>
              {visibleResponses.length.toLocaleString()} items
            </span>
            <button type="button" className={styles.sortResponsesButton} onClick={() => { setNewestFirst(current => !current); setRawDataPage(0); }}>
              <span className="wm-sort" aria-hidden /> {newestFirst ? 'Newest first' : 'Oldest first'}
            </button>
          </div>

          <div className={styles.responses}>
            {currentPageResponses.map((response) => (
              <article className={`${styles.responseCard} ${selectedResponseIds.has(response.id) ? styles.responseCardSelected : ''} ${tagDrafts[(response.id >= 100001 ? outlierResponseKey(selectedQuestionId, response.id) : `${tagScope}${response.id}`)] ? styles.responseCardPending : ''}`} key={response.id}
                onClick={event => {
                  if (event.target instanceof Element && !event.target.closest('label, button')) {
                    toggleResponseSelection(response.id, !selectedResponseIds.has(response.id));
                  }
                }}>
                <label className={styles.responseText}>
                  <input
                    type="checkbox"
                    aria-label={`Select response: ${response.text}`}
                    checked={selectedResponseIds.has(response.id)}
                    onChange={(event) =>
                      toggleResponseSelection(response.id, event.target.checked)
                    }
                  />
                  <span>{response.text}</span>
                </label>
                {response.subthemes.length > 0 ? (
                  <div className={styles.responseTags}>
                    {response.subthemes.map((subtheme) => (
                      <span
                        className={`${styles.responseTag} ${getResponseTagSentimentClass(
                          subtheme.sentiment
                        )}`}
                        title={`${subtheme.label}: ${getSentimentLabel(
                          subtheme.sentiment
                        )}`}
                        key={subtheme.id}
                      >
                        <span
                          className={getSentimentIcon(subtheme.sentiment)}
                          aria-label={`${getSentimentLabel(
                            subtheme.sentiment
                          )} sentiment`}
                        />
                        <span>{subtheme.label}</span>
                        <button
                          type="button"
                          aria-label={`Remove ${subtheme.label}`}
                          disabled={!tagsReady}
                          onClick={() => removeResponseTag(response, subtheme.id)}
                        >
                          <span className="wm-close" aria-hidden />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : <span className={styles.untaggedLabel}>Untagged</span>}
                {tagDrafts[(response.id >= 100001 ? outlierResponseKey(selectedQuestionId, response.id) : `${tagScope}${response.id}`)] && (
                  <div className={styles.responseEditActions}>
                    <span className={styles.responsePendingLabel}>Unsaved changes</span>
                  </div>
                )}
              </article>
            ))}
            {visibleResponses.length === 0 && (
              <p className={styles.noResults}>No themes or responses match your search.</p>
            )}
          </div>
        </section>
      </div>

      <WuModal open={configurationAction !== null} onOpenChange={(open) => { if (!open) setConfigurationAction(null); }}
        size="md" variant={configurationAction === 'delete' ? 'critical' : 'action'} aria-describedby="code-frame-action-description">
        <DialogTitle className={styles.srOnly}>{configurationAction === 'new-theme' ? 'New theme' : configurationAction === 'new-sub-theme' ? 'New sub-theme' : configurationAction === 'merge' ? 'Merge sub-themes' : 'Delete selected items?'}</DialogTitle>
        <WuModalHeader>{configurationAction === 'new-theme' ? 'New theme' : configurationAction === 'new-sub-theme' ? 'New sub-theme' : configurationAction === 'merge' ? 'Merge sub-themes' : 'Delete selected items?'}</WuModalHeader>
        <WuModalContent>
          {configurationAction === 'delete' ? <div className={styles.tagConfirmationContent}>
            <p id="code-frame-action-description">Remove the selected items from your code frame? Deleting a theme also removes its sub-themes. Associated response tags will be removed; the original response text will remain.</p>
            <ul className={styles.configurationItemList}>{deleteTargets.map((target) => <li key={getApproveTargetKey(target)}>{target.name}</li>)}</ul>
            <p>{deletionAffectedCount} response{deletionAffectedCount === 1 ? '' : 's'} affected.</p>
            <p className={styles.tagConfirmationHint}>This deletion stays unsaved until you select Save. Use Cancel to restore your last saved configuration.</p>
          </div> : <div className={styles.configurationForm}>
            <p id="code-frame-action-description">{configurationAction === 'merge'
              ? 'Combine the selected sub-themes into one sub-theme. Their response assignments will be combined without duplicate tags.'
              : 'Add an item to your code frame. It will remain unsaved until you select Save.'}</p>
            {configurationAction === 'merge' && <ul className={styles.configurationItemList}>{selectedCodeFrameTargets.map((target) => <li key={getApproveTargetKey(target)}>{target.name}</li>)}</ul>}
            {configurationAction !== 'new-theme' && <label>
              <span>Parent theme</span>
              <select value={configurationParentId} onChange={(event) => setConfigurationParentId(event.target.value)}>
                {themeGroups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
              </select>
            </label>}
            <label>
              <span>{configurationAction === 'new-theme' ? 'Theme name' : configurationAction === 'merge' ? 'Merged sub-theme name' : 'Sub-theme name'}</span>
              <input value={configurationName} maxLength={100} onChange={(event) => setConfigurationName(event.target.value)}
                aria-invalid={Boolean(configurationName && configurationNameError)} aria-describedby={configurationName && configurationNameError ? 'configuration-name-error' : undefined} />
            </label>
            {configurationName && configurationNameError && <p id="configuration-name-error" className={styles.tagError} role="alert">{configurationNameError}</p>}
            {configurationAction !== 'new-theme' && <label>
              <span>Description <small>(optional)</small></span>
              <textarea value={configurationDescription} maxLength={300} rows={3} onChange={(event) => setConfigurationDescription(event.target.value)} />
            </label>}
            {configurationAction === 'merge' && <p className={styles.tagConfirmationHint}>Shared sentiments are retained. Conflicting sentiments become Neutral for review. This merge stays unsaved until you select Save.</p>}
          </div>}
        </WuModalContent>
        <WuModalFooter>
          <WuButton variant="primary" color={configurationAction === 'delete' ? 'error' : 'primary'}
            disabled={!tagsReady || (configurationAction !== 'delete' && (Boolean(configurationNameError) || (configurationAction !== 'new-theme' && !configurationParent)))}
            onClick={applyConfigurationAction}>{configurationAction === 'delete' ? 'Delete' : configurationAction === 'merge' ? 'Merge' : 'Create'}</WuButton>
        </WuModalFooter>
      </WuModal>

      <WuModal open={tagConfirmation !== null} onOpenChange={(open) => { if (!open) { setTagConfirmation(null); setPendingHref(null); } }}
        size="md" variant={tagConfirmation === 'discard' ? 'critical' : 'action'}
        aria-describedby="theme-confirmation-description">
        <DialogTitle className={styles.srOnly}>{tagConfirmation === 'discard' ? 'Discard theme changes?' : 'Save theme changes?'}</DialogTitle>
        <WuModalHeader>{tagConfirmation === 'discard' ? 'Discard theme changes?' : 'Save theme changes?'}</WuModalHeader>
        <WuModalContent>
          <div className={styles.tagConfirmationContent}>
            <p id="theme-confirmation-description">{tagConfirmation === 'discard'
              ? 'You’re about to discard all unsaved theme configuration changes, including created or deleted items, merges, and response tags. Your last saved configuration and response assignments will be restored.'
              : 'Saving will apply all theme configuration changes, including created or deleted items, merges, and response tags. Once saved, these changes cannot be undone.'}</p>
            <div className={styles.tagChangeSummary}>
              <strong>{changeCount} configuration change{changeCount === 1 ? '' : 's'}</strong>
              {codeFrameSummary.themesAdded > 0 && <span>{codeFrameSummary.themesAdded} theme{codeFrameSummary.themesAdded === 1 ? '' : 's'} created</span>}
              {codeFrameSummary.themesUpdated > 0 && <span>{codeFrameSummary.themesUpdated} theme{codeFrameSummary.themesUpdated === 1 ? '' : 's'} renamed</span>}
              {codeFrameSummary.themesDeleted > 0 && <span>{codeFrameSummary.themesDeleted} theme{codeFrameSummary.themesDeleted === 1 ? '' : 's'} deleted with all associated sub-themes</span>}
              {codeFrameSummary.subThemesAdded > 0 && <span>{codeFrameSummary.subThemesAdded} sub-theme{codeFrameSummary.subThemesAdded === 1 ? '' : 's'} created</span>}
              {codeFrameSummary.subThemesDeleted > 0 && <span>{codeFrameSummary.subThemesDeleted} sub-theme{codeFrameSummary.subThemesDeleted === 1 ? '' : 's'} deleted</span>}
              {codeFrameSummary.subThemesUpdated > 0 && <span>{codeFrameSummary.subThemesUpdated} sub-theme{codeFrameSummary.subThemesUpdated === 1 ? '' : 's'} updated</span>}
              {codeFrameSummary.merges > 0 && <span>{codeFrameSummary.merges} sub-theme merge{codeFrameSummary.merges === 1 ? '' : 's'}</span>}
              <span>{tagSummary.added} tag{tagSummary.added === 1 ? '' : 's'} added · {tagSummary.removed} removed</span>
              <span>{tagSummary.responses} response{tagSummary.responses === 1 ? '' : 's'} affected across all edited questions</span>
            </div>
            {tagConfirmation === 'discard' && <p className={styles.tagConfirmationHint}>Discarded edits cannot be recovered.</p>}
          </div>
        </WuModalContent>
        <WuModalFooter>
          <WuButton variant="primary" color={tagConfirmation === 'discard' ? 'error' : 'primary'}
            onClick={tagConfirmation === 'discard' ? discardThemeAssignments : saveThemeAssignments}>
            {tagConfirmation === 'discard' ? 'Discard' : 'Save'}
          </WuButton>
        </WuModalFooter>
      </WuModal>

      <WuModal open={censoredReviewOpen} onOpenChange={setCensoredReviewOpen} size="lg" variant="action" aria-describedby="censored-review-description">
        <DialogTitle className={styles.srOnly}>Review censored responses</DialogTitle>
        <WuModalHeader>Outlier / Censored</WuModalHeader>
        <WuModalContent>
          <p id="censored-review-description">{themePreferences.showCensoredSubthemes ? 'These responses are currently included in the dashboard and regular response panel.' : 'These responses are hidden from the dashboard and regular response panel.'} Remove the Censored tag from responses you want to include, then Save your theme changes. Removing censorship does not assign any other sub-theme.</p>
          <input className={styles.censoredSearch} type="search" aria-label="Search censored responses" placeholder="Search censored responses" value={censoredSearch} onChange={event => { setCensoredSearch(event.target.value); setCensoredPage(0); }} />
          <label className={styles.selectAllResponses}><input type="checkbox" checked={questionResponses.filter(isCensoredResponse).length > 0 && questionResponses.filter(isCensoredResponse).every(response => censoredSelection.has(response.id))} onChange={event => setCensoredSelection(event.target.checked ? new Set(questionResponses.filter(isCensoredResponse).map(response => response.id)) : new Set())} /> Select all censored responses ({questionResponses.filter(isCensoredResponse).length})</label>
          <p role="status">{censoredSelection.size} selected across all pages</p>
          <div className={styles.censoredReviewList}>
            {questionResponses.filter(isCensoredResponse).filter(response => response.text.toLowerCase().includes(censoredSearch.toLowerCase())).slice(censoredPage * 20, (censoredPage + 1) * 20).map(response => <article className={`${styles.responseCard} ${censoredSelection.has(response.id) ? styles.responseCardSelected : ''}`} key={response.id}>
              <label className={styles.responseText}><input type="checkbox" aria-label={`Select censored response ${response.id}`} checked={censoredSelection.has(response.id)} onChange={event => setCensoredSelection(current => { const next = new Set(current); if (event.target.checked) next.add(response.id); else next.delete(response.id); return next; })} /><span>{response.text}</span></label>
              <small>{censoredResponseReason(response.id)} · Censored</small>
            </article>)}
            {questionResponses.filter(isCensoredResponse).length === 0 && <p>No censored responses remain. Save your changes to update the dashboard.</p>}
          </div>
          <div className={styles.censoredReviewPaging}><button type="button" disabled={censoredPage === 0} onClick={() => setCensoredPage(page => page - 1)}>Previous</button><span>Page {censoredPage + 1}</span><button type="button" disabled={(censoredPage + 1) * 20 >= questionResponses.filter(isCensoredResponse).filter(response => response.text.toLowerCase().includes(censoredSearch.toLowerCase())).length} onClick={() => setCensoredPage(page => page + 1)}>Next</button></div>
        </WuModalContent>
        <WuModalFooter><WuButton variant="secondary" onClick={() => setCensoredReviewOpen(false)}>Close</WuButton><WuButton variant="primary" disabled={!tagsReady || censoredSelection.size === 0} onClick={() => {
          setTagDrafts(current => { let next = current; for (const response of questionResponses.filter(response => censoredSelection.has(response.id) && isCensoredResponse(response))) next = stageTagAssignment(next, (response.id >= 100001 ? outlierResponseKey(selectedQuestionId, response.id) : `${tagScope}${response.id}`), response.subthemes, response.subthemes.filter(tag => tag.id !== CENSORED_TAG_ID)); return next; });
          setCensoredSelection(new Set()); setSelectedResponseIds(new Set()); setResponseSubthemeFilters(new Set()); setSelectedCodeFrameKeys(new Set()); setRawDataPage(0);
          setTagMessage('Censorship removal is pending. Review the responses in the regular panel and Save to update the dashboard.');
        }}>Remove censorship ({censoredSelection.size})</WuButton></WuModalFooter>
      </WuModal>

      <WuModal open={taggingResponseIds.length > 0} onOpenChange={(open) => { if (!open) setTaggingResponseIds([]); }} size="md" variant="action" aria-describedby="tag-picker-description">
        <DialogTitle className={styles.srOnly}>Tag responses</DialogTitle>
        <WuModalHeader>Tag responses</WuModalHeader>
        <WuModalContent>
          <p id="tag-picker-description" className={styles.tagPickerDescription}>Choose sub-themes for {taggingResponseIds.length} response{taggingResponseIds.length === 1 ? '' : 's'}. Changes stay unsaved until you select Save.</p>
          <div className={styles.tagPickerGroups}>
            {themeGroups.map((group) => <fieldset key={group.id}>
              <legend>{group.name}</legend>
              {group.subThemes.map((subtheme) => {
                const tagId = `${group.id}:${subtheme.id}`;
                const alreadyAssigned = questionResponses.filter((response) => taggingResponseIds.includes(response.id))
                  .every((response) => response.subthemes.some((tag) => tag.id === tagId));
                return <label key={tagId}>
                  <input type="checkbox" checked={alreadyAssigned || tagPickerIds.includes(tagId)} disabled={alreadyAssigned}
                    onChange={(event) => setTagPickerIds((current) => event.target.checked ? [...current, tagId] : current.filter((id) => id !== tagId))} />
                  <span>{subtheme.name}{alreadyAssigned && <small>Already tagged</small>}</span>
                </label>;
              })}
            </fieldset>)}
          </div>
        </WuModalContent>
        <WuModalFooter>
          <WuButton variant="secondary" onClick={() => setTaggingResponseIds([])}>Cancel</WuButton>
          <WuButton variant="primary" disabled={tagPickerIds.length === 0} onClick={addResponseTags}>Add tags</WuButton>
        </WuModalFooter>
      </WuModal>

      {selectedCodeFrameTargets.length > 0 ? (
        <div
          className={styles.codeFrameSelectionBar}
          role="region"
          aria-label="Code frame selection actions"
          aria-live="polite"
        >
          <button
            type="button"
            className={styles.selectionClearButton}
            onClick={() => setSelectedCodeFrameKeys(new Set())}
            aria-label="Clear selection"
            title="Clear selection"
          >
            <span className="wm-close" aria-hidden />
          </button>
          <span className={styles.selectionDivider} aria-hidden />
          <strong className={styles.selectionCount}>
            {selectedCodeFrameTargets.length} selected
          </strong>
          <span className={styles.selectionDivider} aria-hidden />
          <button
            type="button"
            className={styles.selectionTextAction}
            disabled={!canMergeSelection}
            onClick={() => openConfigurationAction('merge')}
          >
            Merge
          </button>
          <button
            type="button"
            className={styles.selectionTextAction}
            disabled={!selectionContainsOnlySubThemes || protectedSelection}
            onClick={() => openMove(selectedCodeFrameTargets)}
          >
            Add to theme
          </button>
          {canApproveSelection ? (
            <button
              type="button"
              className={styles.selectionApproveAction}
              onClick={() => approveTargets(selectedCodeFrameTargets)}
            >
              <span className="wm-check" aria-hidden />
              Approve
            </button>
          ) : null}
          <button type="button" className={styles.selectionDeleteAction} disabled={protectedSelection} onClick={() => {
            setDeleteTargets(selectedCodeFrameTargets); setConfigurationAction('delete');
          }}>
            Delete
          </button>
        </div>
      ) : null}

      {sentimentEditorOpen ? (
        <TextAiUpdateSentimentModal
          open
          onOpenChange={setSentimentEditorOpen}
          responses={selectedResponses}
          onSave={saveResponseSentiments}
        />
      ) : null}

      <WuModal
        open={recodeModalOpen}
        onOpenChange={setRecodeModalOpen}
        className={styles.recodeModal}
        size="md"
        variant="action"
      >
        <DialogTitle className={styles.srOnly}>Recode</DialogTitle>
        <WuModalHeader>Recode</WuModalHeader>
        <WuModalContent>
          <div className={styles.recodeModalContent}>
            <p className={styles.recodeIntroduction}>
              Recode to update tagging of responses to sub-themes.
            </p>
            <fieldset className={styles.recodeFieldset}>
              <legend>Choose what to update</legend>
              <div className={styles.recodeChoices}>
                <label>
                  <input
                    type="radio"
                    name="recode-scope"
                    value="new-sub-themes"
                    checked={recodeScope === 'new-sub-themes'}
                    onChange={() => setRecodeScope('new-sub-themes')}
                  />
                  <span>
                    <strong>New sub-themes:</strong> code new sub-themes with no
                    responses currently tagged to them.
                  </span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="recode-scope"
                    value="all-sub-themes"
                    checked={recodeScope === 'all-sub-themes'}
                    onChange={() => setRecodeScope('all-sub-themes')}
                  />
                  <span>
                    <strong>All sub-themes:</strong> recode the entire data,
                    overwriting any manual retags you have done.
                  </span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="recode-scope"
                    value="custom"
                    checked={recodeScope === 'custom'}
                    onChange={() => setRecodeScope('custom')}
                  />
                  <span>
                    <strong>Custom selection:</strong> select sub-themes to update
                    (best if you tagged a few responses to new sub-themes or made
                    changes to existing sub-themes).
                  </span>
                </label>
              </div>
            </fieldset>

            {recodeScope === 'custom' ? (
              <div className={styles.customRecodeSelection}>
                <strong>Select sub-themes</strong>
                <div>
                  {visibleThemeGroups.flatMap((group) =>
                    group.subThemes.map((subTheme) => {
                      const key = `${group.id}:${subTheme.id}`;
                      return (
                        <label key={key}>
                          <input
                            type="checkbox"
                            checked={customRecodeSubThemeIds.includes(key)}
                            onChange={(event) =>
                              setCustomRecodeSubThemeIds((current) =>
                                event.target.checked
                                  ? [...current, key]
                                  : current.filter((item) => item !== key)
                              )
                            }
                          />
                          <span>{subTheme.name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            ) : null}

            <p className={styles.recodeNote}>
              QuestionPro always reprocesses all responses to ensure accuracy, but
              only revises tagging based on your selection above. Note that if you
              recode &quot;All Sub-themes&quot;, any manual changes you have made to
              tagging may be overwritten and lost.
            </p>
            <strong className={styles.recodesRemaining}>
              Recodes remaining: {recodesRemaining}
            </strong>
          </div>
        </WuModalContent>
        <WuModalFooter>
          <WuButton
            type="button"
            variant="secondary"
            onClick={() => setRecodeModalOpen(false)}
          >
            Cancel
          </WuButton>
          <WuButton
            type="button"
            disabled={
              recodesRemaining === 0 ||
              (recodeScope === 'custom' &&
                customRecodeSubThemeIds.length === 0)
            }
            onClick={handleRecode}
          >
            Recode selected sub-themes
          </WuButton>
        </WuModalFooter>
      </WuModal>

      <WuModal
        open={editSubThemeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditSubThemeTarget(null);
        }}
        size="md"
        variant="action"
      >
        <DialogTitle className={styles.srOnly}>Edit sub-theme</DialogTitle>
        <WuModalHeader>Edit sub-theme</WuModalHeader>
        <WuModalContent>
          <div className={styles.editSubThemeModalContent}>
            <p>
              Update the label and description used to classify matching responses.
            </p>
            <label className={styles.editSubThemeField}>
              <span>
                Sub-theme name <strong aria-hidden>*</strong>
              </span>
              <input
                value={draftSubThemeName}
                onChange={(event) => setDraftSubThemeName(event.target.value)}
                maxLength={100}
                placeholder="Enter a sub-theme name"
                autoFocus
                required
              />
              <small>{draftSubThemeName.length}/100 characters</small>
            </label>
            <label className={styles.editSubThemeField}>
              <span>Description</span>
              <textarea
                value={draftSubThemeDescription}
                onChange={(event) =>
                  setDraftSubThemeDescription(event.target.value)
                }
                maxLength={300}
                placeholder="Describe the responses that belong in this sub-theme"
                rows={4}
              />
              <small>{draftSubThemeDescription.length}/300 characters</small>
              {subThemeEditError && <p className={styles.tagError} role="alert">{subThemeEditError}</p>}
              <small>Edits stay unsaved until you select Save in Theme configuration.</small>
            </label>
          </div>
        </WuModalContent>
        <WuModalFooter>
          <WuButton
            type="button"
            variant="secondary"
            onClick={() => setEditSubThemeTarget(null)}
          >
            Cancel
          </WuButton>
          <WuButton
            type="button"
            disabled={!draftSubThemeName.trim() || Boolean(subThemeEditError)}
            onClick={saveSubThemeEdit}
          >
            Save changes
          </WuButton>
        </WuModalFooter>
      </WuModal>

      <WuModal open={historyOpen} onOpenChange={setHistoryOpen} size="lg" variant="action">
        <DialogTitle className={styles.srOnly}>Theme history</DialogTitle>
        <WuModalHeader>Theme history</WuModalHeader>
        <WuModalContent><TextAiThemeLogs dashboardId={numericDashboardId} /></WuModalContent>
        <WuModalFooter><WuButton onClick={() => setHistoryOpen(false)}>Close</WuButton></WuModalFooter>
      </WuModal>
      <WuModal open={moveModalOpen} onOpenChange={setMoveModalOpen} size="sm" variant="action">
        <DialogTitle className={styles.srOnly}>Move to theme</DialogTitle>
        <WuModalHeader>Move to theme</WuModalHeader>
        <WuModalContent><div className={styles.configurationForm}>
          <label><span>Select theme</span><select aria-label="Move destination theme" value={moveParentId} onChange={event => { setMoveParentId(event.target.value); setMoveError(''); }}>
            <option value="">Select...</option>{themeGroups.map(group => <option key={group.id} value={group.id}>{group.name}</option>)}
          </select></label>
          {moveError && <p role="alert" className={styles.tagError}>{moveError}</p>}
        </div></WuModalContent>
        <WuModalFooter><WuButton variant="secondary" onClick={() => setMoveModalOpen(false)}>Cancel</WuButton><WuButton disabled={!moveParentId} onClick={applyMove}>Save</WuButton></WuModalFooter>
      </WuModal>
      <WuModal
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
        size="lg"
        variant="action"
      >
        <DialogTitle className={styles.srOnly}>
          Theme configuration settings
        </DialogTitle>
        <WuModalHeader>Theme configuration settings</WuModalHeader>
        <WuModalContent className={styles.settingsModalBody}>
          <div className={styles.settingsModalContent}>
            <div className={styles.settingsTabs} role="tablist" aria-label="Settings">
              <button type="button" role="tab" aria-selected="true" className={styles.activeSettingsTab}>Preferences</button>
            </div>
              <div className={styles.settingsPreferences}>
                <label className={styles.settingsPreference}>
                  <span><strong>Show censored sub-themes</strong><small>{CENSORED_VISIBILITY_HELP}</small></span>
                  <WuToggle checked={themePreferences.showCensoredSubthemes} onChange={checked => {
                    updateThemePreferences(current => ({ ...current, showCensoredSubthemes: checked }));
                    setSelectedResponseIds(new Set()); setResponseSubthemeFilters(new Set()); setSelectedCodeFrameKeys(new Set()); setRawDataPage(0);
                  }} aria-label="Show censored sub-themes" />
                </label>
                <label className={styles.settingsPreference}>
                  <span>
                    <strong>Show themes with no responses</strong>
                    <small>
                      Include themes and sub-themes that do not have tagged responses.
                    </small>
                  </span>
                  <WuToggle
                    checked={themePreferences.showThemesWithNoResponses}
                    onChange={(checked) =>
                      updateThemePreferences((current) => ({
                        ...current,
                        showThemesWithNoResponses: checked,
                      }))
                    }
                    aria-label="Show themes with no responses"
                  />
                </label>
                <div className={styles.settingsPreference}>
                  <span>
                    <strong>Emerging status duration</strong>
                    <small>
                      Choose how long an approved theme or sub-theme is shown as
                      Emerging. The duration begins on its approval date.
                    </small>
                  </span>
                  <WuSelect
                    data={TEXT_AI_EMERGING_VALIDITY_OPTIONS}
                    accessorKey={{ value: 'value', label: 'label' }}
                    value={
                      TEXT_AI_EMERGING_VALIDITY_OPTIONS.find(
                        (option) =>
                          option.value ===
                          themePreferences.emergingThemeValidityDays
                      ) ?? TEXT_AI_EMERGING_VALIDITY_OPTIONS[2]
                    }
                    onSelect={(option) => {
                      if (!option || Array.isArray(option)) return;
                      updateThemePreferences((current) => ({
                        ...current,
                        emergingThemeValidityDays: (
                          option as TextAiEmergingValidityOption
                        ).value,
                      }));
                    }}
                    variant="outlined"
                    className={styles.validitySelect}
                    aria-label="Emerging status duration"
                  />
                </div>
              </div>
          </div>
        </WuModalContent>
        <WuModalFooter>
          <WuButton type="button" onClick={() => setSettingsModalOpen(false)}>
            Done
          </WuButton>
        </WuModalFooter>
      </WuModal>

    </PageContainer>
  );
}
