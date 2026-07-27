'use client';

import { use, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Title as DialogTitle } from '@radix-ui/react-dialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageContainer } from '@/components/ui/PageContainer';
import { getTextAiDashboardById } from '@/data/get-text-ai-dashboard-by-id';
import type { TextAiDashboardQuestion } from '@/data/mock-text-ai-dashboards';
import { MOCK_TEXT_AI_ANALYSIS_QUESTIONS } from '@/data/mock-text-ai-questions';
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

type ThemeTone = 'blue' | 'green' | 'red';
type GranularityLevel = 'high' | 'medium' | 'low';

interface SubTheme {
  description?: string;
  id: string;
  emerging?: boolean;
  name: string;
  percentage: string;
}

interface SubThemeEdit {
  description: string;
  name: string;
  originalName: string;
}

interface EditSubThemeTarget {
  editKey: string;
  originalName: string;
}

interface ThemeGroup {
  emerging?: boolean;
  id: string;
  name: string;
  percentage: string;
  tone: ThemeTone;
  subThemes: SubTheme[];
}

type RejectTarget =
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
  themeCount: number;
}

interface GranularityOption {
  description: string;
  label: string;
  level: GranularityLevel;
  range: string;
  subThemeCounts: number[];
  themeCountFactor: number;
}

interface ResponseClassification {
  tag: string;
  tone: Exclude<ThemeTone, 'red'>;
}

const GRANULARITY_OPTIONS: GranularityOption[] = [
  {
    level: 'high',
    label: 'High',
    range: '10–15 sub-themes',
    description: 'Creates more specific classifications for detailed analysis.',
    subThemeCounts: [12, 10, 15],
    themeCountFactor: 1.28,
  },
  {
    level: 'medium',
    label: 'Medium',
    range: '5–10 sub-themes',
    description: 'Balances useful detail with a concise, manageable code frame.',
    subThemeCounts: [7, 6, 9],
    themeCountFactor: 1,
  },
  {
    level: 'low',
    label: 'Low',
    range: '1–5 sub-themes',
    description: 'Groups responses into broader classifications for a simpler overview.',
    subThemeCounts: [3, 2, 4],
    themeCountFactor: 0.62,
  },
];

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
    { tag: 'Staff Hygiene and Presentation Concerns', tone: 'green' },
    { tag: 'Emergency Visit Convenience and Practical Value', tone: 'blue' },
    { tag: 'Condiment Stock Availability and Communication', tone: 'green' },
    { tag: 'Distinctive Location Atmosphere and Character', tone: 'blue' },
    { tag: 'Any-size Beverage Promotion Value', tone: 'green' },
    { tag: 'Rapid Order Fulfilment and Service Speed', tone: 'green' },
  ],
  medium: [
    null,
    { tag: 'Customer Experience Differentiation', tone: 'blue' },
    { tag: 'Customer Experience and Condiment Misrepresentation', tone: 'green' },
    { tag: 'Customer Experience Differentiation', tone: 'blue' },
    { tag: 'Pricing Concerns and Customer Feedback', tone: 'green' },
    { tag: 'Service Speed and Efficiency', tone: 'green' },
  ],
  low: [
    { tag: 'Staff Service', tone: 'green' },
    { tag: 'Overall Experience', tone: 'blue' },
    { tag: 'Overall Experience', tone: 'green' },
    { tag: 'Customer Experience', tone: 'blue' },
    { tag: 'Customer Experience', tone: 'green' },
    { tag: 'Staff Service', tone: 'green' },
  ],
};

const COVERAGE_CATEGORIES = [
  { label: 'Untagged', color: '#ed5b5b' },
  { label: '1 sub-theme', color: '#f5a000' },
  { label: '2 sub-themes', color: '#2785d8' },
  { label: '3 sub-themes', color: '#4aa2e8' },
  { label: '4 sub-themes', color: '#8bc6ee' },
  { label: '5 sub-themes', color: '#49a94f' },
];

const GRANULARITY_COVERAGE_WEIGHTS: Partial<
  Record<GranularityLevel, number[]>
> = {
  high: [0.04, 0.36, 0.3, 0.16, 0.09, 0.05],
  low: [0.08, 0.72, 0.17, 0.03, 0, 0],
};

const QUESTION_VARIANTS: QuestionThemeVariant[] = [
  {
    themeCount: 81,
    responseCount: 1500,
    groupPercentages: [17.93, 17.13, 14.53],
    subThemeFactor: 1,
    coverageCounts: [100, 815, 460, 104, 15, 6],
    responseTexts: RAW_RESPONSES.map((response) => response.text),
  },
  {
    themeCount: 74,
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
    themeCount: 86,
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
    themeCount: 69,
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
    themeCount: 78,
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

function formatPercentage(value: number): string {
  return `${Number(value.toFixed(2))}%`;
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

function getCoverageCounts(
  responseCount: number,
  weights: number[]
): number[] {
  const counts = weights.map((weight) => Math.round(responseCount * weight));
  const difference = responseCount - counts.reduce((total, count) => total + count, 0);
  counts[counts.length - 1] += difference;
  return counts;
}

function EmergingBadge() {
  return (
    <span className={styles.emergingBadge}>
      <span className={styles.emergingDot} aria-hidden />
      Emerging
    </span>
  );
}

function ThemeGroupCard({
  group,
  collapsed,
  onEditSubTheme,
  onRejectSubTheme,
  onRejectTheme,
  onToggle,
}: {
  group: ThemeGroup;
  collapsed: boolean;
  onEditSubTheme: (subTheme: SubTheme) => void;
  onRejectSubTheme: (subTheme: SubTheme) => void;
  onRejectTheme: () => void;
  onToggle: () => void;
}) {
  return (
    <section className={`${styles.themeGroup} ${styles[`themeGroup${group.tone}`]}`}>
      <div
        className={`${styles.themeGroupHeader} ${styles[`themeGroupHeader${group.tone}`]}`}
      >
        <button
          type="button"
          className={styles.themeGroupToggle}
          onClick={onToggle}
          aria-expanded={!collapsed}
        >
          <span
            className={`wm-chevron-down ${collapsed ? styles.chevronCollapsed : ''}`}
            aria-hidden
          />
          <span className={styles.themeGroupName}>{group.name}</span>
          {group.emerging && <EmergingBadge />}
        </button>
        <div className={styles.themeGroupMeta}>
          <span className={styles.subThemeCount}>
            {group.subThemes.length} sub-theme{group.subThemes.length === 1 ? '' : 's'}
          </span>
          <span className={styles.themeGroupPercentage}>{group.percentage}</span>
          {group.emerging && (
            <button
              type="button"
              className={styles.rejectEmergingButton}
              onClick={onRejectTheme}
              aria-label={`Reject emerging theme ${group.name}`}
            >
              <span className="wm-block" aria-hidden />
              Reject
            </button>
          )}
        </div>
      </div>
      {!collapsed && (
        <div className={styles.subThemeGrid}>
          {group.subThemes.map((subTheme) => (
            <div className={styles.subTheme} key={subTheme.id}>
              <div className={styles.subThemeMain}>
                <span title={subTheme.description}>{subTheme.name}</span>
                {subTheme.emerging && <EmergingBadge />}
              </div>
              <div className={styles.subThemeMeta}>
                <span className={styles.subThemePercentage}>{subTheme.percentage}</span>
                <button
                  type="button"
                  className={styles.editSubThemeButton}
                  onClick={() => onEditSubTheme(subTheme)}
                  aria-label={`Edit sub-theme ${subTheme.name}`}
                  title="Edit sub-theme"
                >
                  <span className="wm-edit" aria-hidden />
                </button>
                {subTheme.emerging && (
                  <button
                    type="button"
                    className={styles.rejectEmergingButton}
                    onClick={() => onRejectSubTheme(subTheme)}
                    aria-label={`Reject emerging sub-theme ${subTheme.name}`}
                  >
                    <span className="wm-block" aria-hidden />
                    Reject
                  </button>
                )}
              </div>
            </div>
          ))}
          {group.subThemes.length === 0 && (
            <p className={styles.noSubThemes}>No sub-themes remain in this theme.</p>
          )}
        </div>
      )}
    </section>
  );
}

export default function TextAiThemeConfigurationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const dashboard = getTextAiDashboardById(Number(id));
  const questions = dashboard?.questions?.length ? dashboard.questions : FALLBACK_QUESTIONS;
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>(
    () => questions[0]?.id ?? ''
  );
  const [search, setSearch] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => new Set());
  const [rejectedThemeIds, setRejectedThemeIds] = useState<Set<string>>(() => new Set());
  const [rejectedSubThemeKeys, setRejectedSubThemeKeys] = useState<Set<string>>(
    () => new Set()
  );
  const [rejectTarget, setRejectTarget] = useState<RejectTarget | null>(null);
  const [granularityModalOpen, setGranularityModalOpen] = useState(false);
  const [appliedGranularity, setAppliedGranularity] =
    useState<GranularityLevel>('medium');
  const [draftGranularity, setDraftGranularity] =
    useState<GranularityLevel>('medium');
  const [subThemeEdits, setSubThemeEdits] = useState<Record<string, SubThemeEdit>>(
    () => ({})
  );
  const [editSubThemeTarget, setEditSubThemeTarget] =
    useState<EditSubThemeTarget | null>(null);
  const [draftSubThemeName, setDraftSubThemeName] = useState('');
  const [draftSubThemeDescription, setDraftSubThemeDescription] = useState('');

  const selectedQuestionIndex = Math.max(
    0,
    questions.findIndex((question) => question.id === selectedQuestionId)
  );
  const selectedQuestion = questions[selectedQuestionIndex] ?? null;
  const questionVariant = QUESTION_VARIANTS[selectedQuestionIndex % QUESTION_VARIANTS.length];
  const appliedGranularityOption =
    GRANULARITY_OPTIONS.find((option) => option.level === appliedGranularity) ??
    GRANULARITY_OPTIONS[1];
  const visibleThemeCount = Math.round(
    questionVariant.themeCount * appliedGranularityOption.themeCountFactor
  );

  const themeGroups = useMemo(
    () =>
      THEME_GROUPS.map((group, groupIndex) => ({
        ...group,
        percentage: formatPercentage(questionVariant.groupPercentages[groupIndex]),
        subThemes: group.subThemes
          .slice(0, appliedGranularityOption.subThemeCounts[groupIndex])
          .map((subTheme, subThemeIndex) => {
            const basePercentage = Number.parseFloat(subTheme.percentage);
            const indexAdjustment =
              ((subThemeIndex % 3) - 1) * selectedQuestionIndex * 0.04;
            const edit =
              subThemeEdits[
                getSubThemeEditKey(selectedQuestionId, group.id, subTheme.id)
              ];
            return {
              ...subTheme,
              description:
                edit?.description ??
                subTheme.description ??
                getDefaultSubThemeDescription(subTheme.name),
              name: edit?.name ?? subTheme.name,
              percentage: formatPercentage(
                Math.max(
                  0,
                  basePercentage * questionVariant.subThemeFactor + indexAdjustment
                )
              ),
            };
          }),
      })),
    [
      appliedGranularityOption,
      questionVariant,
      selectedQuestionId,
      selectedQuestionIndex,
      subThemeEdits,
    ]
  );

  const visibleThemeGroups = useMemo(
    () =>
      themeGroups
        .filter((group) => !rejectedThemeIds.has(group.id))
        .map((group) => ({
          ...group,
          subThemes: group.subThemes.filter(
            (subTheme) => !rejectedSubThemeKeys.has(`${group.id}:${subTheme.id}`)
          ),
        })),
    [rejectedSubThemeKeys, rejectedThemeIds, themeGroups]
  );

  const coverageItems = useMemo(
    () => {
      const weights = GRANULARITY_COVERAGE_WEIGHTS[appliedGranularity];
      const counts = weights
        ? getCoverageCounts(questionVariant.responseCount, weights)
        : questionVariant.coverageCounts;

      return COVERAGE_CATEGORIES.map((category, index) => {
        const count = counts[index];
        return {
          ...category,
          count: `${count}/${questionVariant.responseCount}`,
          percentage: formatPercentage((count / questionVariant.responseCount) * 100),
        };
      });
    },
    [appliedGranularity, questionVariant]
  );

  const questionResponses = useMemo(
    () =>
      RAW_RESPONSES.map((response, index) => {
        const classification = RESPONSE_CLASSIFICATIONS[appliedGranularity][index];
        const renamedClassification = Object.entries(subThemeEdits).find(
          ([editKey, edit]) =>
            editKey.startsWith(`${selectedQuestionId}:`) &&
            edit.originalName === classification?.tag
        )?.[1];
        return {
          ...response,
          text: questionVariant.responseTexts[index] ?? response.text,
          tag: renamedClassification?.name ?? classification?.tag,
          tone: classification?.tone,
        };
      }),
    [appliedGranularity, questionVariant, selectedQuestionId, subThemeEdits]
  );

  const visibleResponses = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return questionResponses;
    return questionResponses.filter(
      (response) =>
        response.text.toLowerCase().includes(query) ||
        response.tag?.toLowerCase().includes(query)
    );
  }, [questionResponses, search]);

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

  function confirmRejection(): void {
    if (!rejectTarget) return;

    if (rejectTarget.kind === 'theme') {
      setRejectedThemeIds((current) => new Set(current).add(rejectTarget.themeId));
    } else {
      const subThemeKey = `${rejectTarget.themeId}:${rejectTarget.subThemeId}`;
      setRejectedSubThemeKeys((current) => new Set(current).add(subThemeKey));
    }

    setRejectTarget(null);
  }

  function saveSubThemeEdit(): void {
    if (!editSubThemeTarget) return;

    const name = draftSubThemeName.trim();
    if (!name) return;

    setSubThemeEdits((current) => ({
      ...current,
      [editSubThemeTarget.editKey]: {
        description: draftSubThemeDescription.trim(),
        name,
        originalName: editSubThemeTarget.originalName,
      },
    }));
    setEditSubThemeTarget(null);
  }

  return (
    <PageContainer className={styles.page}>
      <div className={styles.utilityBar}>
        <div className={styles.utilityControls}>
          <div className={styles.questionFilter}>
            <span className={styles.filterLabel}>Question</span>
            <WuCombobox
              data={questions}
              accessorKey={{ value: 'id', label: 'text' }}
              value={selectedQuestion}
              onSelect={(option) => {
                if (!option || Array.isArray(option)) return;
                setSelectedQuestionId((option as TextAiDashboardQuestion).id);
                setSearch('');
                setRejectedThemeIds(new Set());
                setRejectedSubThemeKeys(new Set());
                setRejectTarget(null);
                setEditSubThemeTarget(null);
              }}
              variant="outlined"
              enableSearch
              isEllipse
              maxHeight={320}
              noDataContent="No questions found"
              className={styles.questionSelect}
              aria-label="Question"
            />
          </div>
          <label className={styles.searchBox}>
            <span className="wm-search" aria-hidden />
            <span className={styles.srOnly}>Search themes or responses</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search themes or responses..."
            />
          </label>
        </div>
        <div className={styles.utilityActions}>
          <div className={styles.recodeAction}>
            <Link
              href={`/text-ai/${dashboard.id}`}
              className={styles.dashboardLink}
              aria-label={`Back to ${dashboard.name} dashboard`}
            >
              <span className="wc-report" aria-hidden />
            </Link>
            <span>Recode</span>
          </div>
          <button
            type="button"
            className={styles.granularityAction}
            onClick={() => {
              setDraftGranularity(appliedGranularity);
              setGranularityModalOpen(true);
            }}
            aria-haspopup="dialog"
          >
            <span className="wm-tune" aria-hidden />
            <span>Granularity</span>
          </button>
        </div>
      </div>

      <div className={styles.workspace}>
        <section className={styles.codeFramePanel} aria-label="Code frame">
          <header className={styles.codeFrameHeader}>
            <div className={styles.codeFrameTitle}>
              <strong>My code frame</strong>
              <span className={styles.headerCount}>{visibleThemeCount}</span>
              <span className={styles.appliedGranularity}>
                {appliedGranularityOption.label} · {appliedGranularityOption.range}
              </span>
            </div>
            <div className={styles.codeFrameActions}>
              <span className={styles.headerCount}>{questionVariant.responseCount}</span>
              <button type="button">New sub-theme</button>
              <button type="button">New theme</button>
            </div>
          </header>
          <div className={styles.themeScrollArea}>
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
                    originalName:
                      subThemeEdits[
                        getSubThemeEditKey(
                          selectedQuestionId,
                          group.id,
                          subTheme.id
                        )
                      ]?.originalName ?? subTheme.name,
                  });
                  setDraftSubThemeName(subTheme.name);
                  setDraftSubThemeDescription(
                    subTheme.description ??
                      getDefaultSubThemeDescription(subTheme.name)
                  );
                }}
                onRejectSubTheme={(subTheme) =>
                  setRejectTarget({
                    kind: 'sub-theme',
                    name: subTheme.name,
                    subThemeId: subTheme.id,
                    themeId: group.id,
                  })
                }
                onRejectTheme={() =>
                  setRejectTarget({
                    kind: 'theme',
                    name: group.name,
                    themeId: group.id,
                  })
                }
                onToggle={() => toggleGroup(group.id)}
              />
            ))}
          </div>
        </section>

        <section className={styles.rawDataPanel} aria-label="Explore raw data">
          <header className={styles.rawDataHeader}>
            <h1>Explore raw data</h1>
            <div className={styles.rawDataTools}>
              <button type="button" className={styles.iconButton} aria-label="Filter responses">
                <span className="wm-filter-list" aria-hidden />
              </button>
              <label className={styles.coverageSelect}>
                <span className={styles.srOnly}>Filter by theme</span>
                <select defaultValue="">
                  <option value="" disabled>Select...</option>
                  <option>Customer experience</option>
                  <option>Staff service</option>
                  <option>Overall experience</option>
                </select>
              </label>
              <button type="button" className={styles.iconButton} aria-label="Expand raw data">
                <span className="wm-open-in-full" aria-hidden />
              </button>
            </div>
          </header>

          <div className={styles.coverageSection}>
            <h2>Theme coverage</h2>
            <div className={styles.coverageBar} aria-label="Theme coverage distribution">
              {coverageItems.map((item) => (
                <span
                  key={item.label}
                  style={{ backgroundColor: item.color, width: item.percentage }}
                  title={`${item.label}: ${item.percentage}`}
                />
              ))}
            </div>
            <div className={styles.coverageLegend}>
              {coverageItems.map((item) => (
                <div className={styles.legendItem} key={item.label}>
                  <span className={styles.legendDot} style={{ backgroundColor: item.color }} />
                  <strong>{item.label}</strong>
                  <span className={styles.legendPercentage}>{item.percentage}</span>
                  <span className={styles.legendCount}>({item.count})</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.pagination}>
            <button type="button" aria-label="Previous page" disabled>
              <span className="wm-chevron-left" aria-hidden />
            </button>
            <span>1 - 100</span>
            <span className="wm-arrow-drop-down" aria-hidden />
            <button type="button" aria-label="Next page">
              <span className="wm-chevron-right" aria-hidden />
            </button>
            <span className={styles.itemCount}>{questionVariant.responseCount} items</span>
          </div>

          <div className={styles.responses}>
            {visibleResponses.map((response) => (
              <article className={styles.responseCard} key={response.id}>
                <label className={styles.responseText}>
                  <input type="checkbox" aria-label={`Select response: ${response.text}`} />
                  <span>{response.text}</span>
                </label>
                {response.tag && response.tone && (
                  <span className={`${styles.responseTag} ${styles[`responseTag${response.tone}`]}`}>
                    {response.tag}
                    <button type="button" aria-label={`Remove ${response.tag}`}>
                      <span className="wm-close" aria-hidden />
                    </button>
                  </span>
                )}
              </article>
            ))}
            {visibleResponses.length === 0 && (
              <p className={styles.noResults}>No themes or responses match your search.</p>
            )}
          </div>
        </section>
      </div>

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
            disabled={!draftSubThemeName.trim()}
            onClick={saveSubThemeEdit}
          >
            Save changes
          </WuButton>
        </WuModalFooter>
      </WuModal>

      <WuModal
        open={granularityModalOpen}
        onOpenChange={(open) => {
          setGranularityModalOpen(open);
          if (!open) setDraftGranularity(appliedGranularity);
        }}
        size="md"
        variant="action"
      >
        <DialogTitle className={styles.srOnly}>Response tagging granularity</DialogTitle>
        <WuModalHeader>Response tagging granularity</WuModalHeader>
        <WuModalContent>
          <div className={styles.granularityModalContent}>
            <p className={styles.granularityIntroduction}>
              Choose how specific TextAI should be when classifying responses into
              sub-themes.
            </p>
            <div
              className={styles.granularityOptions}
              role="radiogroup"
              aria-label="Response tagging granularity"
            >
              {GRANULARITY_OPTIONS.map((option) => (
                <label
                  className={`${styles.granularityOption} ${
                    draftGranularity === option.level
                      ? styles.granularityOptionSelected
                      : ''
                  }`}
                  key={option.level}
                >
                  <input
                    type="radio"
                    name="granularity"
                    value={option.level}
                    checked={draftGranularity === option.level}
                    onChange={() => setDraftGranularity(option.level)}
                  />
                  <span className={styles.granularityOptionText}>
                    <span className={styles.granularityOptionHeading}>
                      <strong>{option.label}</strong>
                      <span>{option.range}</span>
                    </span>
                    <span className={styles.granularityDescription}>
                      {option.description}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </WuModalContent>
        <WuModalFooter>
          <WuButton
            type="button"
            variant="secondary"
            onClick={() => setGranularityModalOpen(false)}
          >
            Cancel
          </WuButton>
          <WuButton
            type="button"
            onClick={() => {
              setAppliedGranularity(draftGranularity);
              setRejectedThemeIds(new Set());
              setRejectedSubThemeKeys(new Set());
              setGranularityModalOpen(false);
            }}
          >
            Apply
          </WuButton>
        </WuModalFooter>
      </WuModal>

      <WuModal
        open={rejectTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRejectTarget(null);
        }}
        size="sm"
        variant="critical"
      >
        <DialogTitle className={styles.srOnly}>
          Reject emerging {rejectTarget?.kind === 'theme' ? 'theme' : 'sub-theme'}
        </DialogTitle>
        <WuModalHeader>
          Reject emerging {rejectTarget?.kind === 'theme' ? 'theme' : 'sub-theme'}?
        </WuModalHeader>
        <WuModalContent>
          <div className={styles.rejectModalContent}>
            <p>
              This will remove <strong>{rejectTarget?.name}</strong> from the code frame.
            </p>
            {rejectTarget?.kind === 'theme' && (
              <p>All sub-themes within this emerging theme will also be removed.</p>
            )}
          </div>
        </WuModalContent>
        <WuModalFooter>
          <WuButton type="button" variant="secondary" onClick={() => setRejectTarget(null)}>
            Cancel
          </WuButton>
          <WuButton type="button" color="error" onClick={confirmRejection}>
            Reject
          </WuButton>
        </WuModalFooter>
      </WuModal>
    </PageContainer>
  );
}
