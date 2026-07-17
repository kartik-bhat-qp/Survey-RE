'use client';

import { use, useMemo, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageContainer } from '@/components/ui/PageContainer';
import { getTextAiDashboardById } from '@/data/get-text-ai-dashboard-by-id';
import type { TextAiDashboardQuestion } from '@/data/mock-text-ai-dashboards';
import { MOCK_TEXT_AI_ANALYSIS_QUESTIONS } from '@/data/mock-text-ai-questions';
import styles from './ThemeConfiguration.module.css';

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

type ThemeTone = 'blue' | 'green' | 'red';

interface SubTheme {
  name: string;
  percentage: string;
}

interface ThemeGroup {
  id: string;
  name: string;
  percentage: string;
  tone: ThemeTone;
  subThemes: SubTheme[];
}

interface RawResponse {
  id: number;
  text: string;
  tag?: string;
  tone?: Exclude<ThemeTone, 'red'>;
}

interface QuestionThemeVariant {
  coverageCounts: number[];
  groupPercentages: number[];
  responseCount: number;
  responseTexts: string[];
  subThemeFactor: number;
  themeCount: number;
}

const THEME_GROUPS: ThemeGroup[] = [
  {
    id: 'customer-experience',
    name: 'Customer Experience Feedback Analysis',
    percentage: '17.93%',
    tone: 'blue',
    subThemes: [
      { name: 'Customer Experience Feedback Gaps', percentage: '0.53%' },
      { name: 'Customer Service Experience Analysis', percentage: '0.73%' },
      { name: 'Customer Experience Feedback Analysis', percentage: '0%' },
      { name: 'Customer Experience Improvement', percentage: '3%' },
      { name: 'Customer Experience Feedback Analysis', percentage: '12.07%' },
      { name: 'Customer Experience Differentiation', percentage: '1.67%' },
    ],
  },
  {
    id: 'staff-service',
    name: 'Staff Service Interaction Analysis',
    percentage: '17.13%',
    tone: 'green',
    subThemes: [
      { name: 'Staff Friendliness and Professionalism', percentage: '9.33%' },
      { name: 'Staff Interaction and Courtesy', percentage: '5.07%' },
      { name: 'Staff Service Attitude Analysis', percentage: '3%' },
    ],
  },
  {
    id: 'overall-experience',
    name: 'Overall Experience',
    percentage: '14.53%',
    tone: 'red',
    subThemes: [
      { name: 'Breakfast Menu Customization and Appeal', percentage: '0.93%' },
      { name: 'Brand Expectation Misalignment Issues', percentage: '0.8%' },
      { name: 'Service Flow Consistency Issues', percentage: '0.53%' },
      { name: 'Missing Food Items in Meal Orders', percentage: '0.8%' },
      { name: 'Fast Service Expectations and Delivery', percentage: '1.73%' },
      { name: 'Menu Clarity and Accessibility Issues', percentage: '0.47%' },
      { name: 'Food Quality and Safety Concerns', percentage: '0.13%' },
      { name: 'Customer App Engagement and Feedback', percentage: '0.6%' },
      { name: 'Customer Experience Issues', percentage: '0.87%' },
      { name: 'Table Cleanliness and Hygiene Issues', percentage: '0.2%' },
      { name: 'Customer Wait Time Experience', percentage: '2.07%' },
      { name: 'Customer Service Interactions', percentage: '0.27%' },
    ],
  },
];

const RAW_RESPONSES: RawResponse[] = [
  { id: 1, text: 'Some one there was smelly' },
  {
    id: 2,
    text: "It's good for an emergency.",
    tag: 'Customer Experience Differentiation',
    tone: 'blue',
  },
  {
    id: 3,
    text: '"Ran out of straws"? Suspect',
    tag: 'Customer Experience and Condiment Misrepresentation',
    tone: 'green',
  },
  {
    id: 4,
    text: 'The place has character',
    tag: 'Customer Experience Differentiation',
    tone: 'blue',
  },
  {
    id: 5,
    text: '1.09 soda any size!',
    tag: 'Pricing Concerns and Customer Feedback',
    tone: 'green',
  },
  {
    id: 6,
    text: 'Very fast service',
    tag: 'Service Speed and Efficiency',
    tone: 'green',
  },
];

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

function ThemeGroupCard({
  group,
  collapsed,
  onToggle,
}: {
  group: ThemeGroup;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <section className={`${styles.themeGroup} ${styles[`themeGroup${group.tone}`]}`}>
      <button
        type="button"
        className={`${styles.themeGroupHeader} ${styles[`themeGroupHeader${group.tone}`]}`}
        onClick={onToggle}
        aria-expanded={!collapsed}
      >
        <span className={`wm-chevron-down ${collapsed ? styles.chevronCollapsed : ''}`} aria-hidden />
        <span className={styles.themeGroupName}>{group.name}</span>
        <span className={styles.themeGroupPercentage}>{group.percentage}</span>
      </button>
      {!collapsed && (
        <div className={styles.subThemeGrid}>
          {group.subThemes.map((subTheme, index) => (
            <div className={styles.subTheme} key={`${group.id}-${subTheme.name}-${index}`}>
              <span>{subTheme.name}</span>
              <span className={styles.subThemePercentage}>{subTheme.percentage}</span>
            </div>
          ))}
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

  const selectedQuestionIndex = Math.max(
    0,
    questions.findIndex((question) => question.id === selectedQuestionId)
  );
  const selectedQuestion = questions[selectedQuestionIndex] ?? null;
  const questionVariant = QUESTION_VARIANTS[selectedQuestionIndex % QUESTION_VARIANTS.length];

  const themeGroups = useMemo(
    () =>
      THEME_GROUPS.map((group, groupIndex) => ({
        ...group,
        percentage: formatPercentage(questionVariant.groupPercentages[groupIndex]),
        subThemes: group.subThemes.map((subTheme, subThemeIndex) => {
          const basePercentage = Number.parseFloat(subTheme.percentage);
          const indexAdjustment = ((subThemeIndex % 3) - 1) * selectedQuestionIndex * 0.04;
          return {
            ...subTheme,
            percentage: formatPercentage(
              Math.max(0, basePercentage * questionVariant.subThemeFactor + indexAdjustment)
            ),
          };
        }),
      })),
    [questionVariant, selectedQuestionIndex]
  );

  const coverageItems = useMemo(
    () =>
      COVERAGE_CATEGORIES.map((category, index) => {
        const count = questionVariant.coverageCounts[index];
        return {
          ...category,
          count: `${count}/${questionVariant.responseCount}`,
          percentage: formatPercentage((count / questionVariant.responseCount) * 100),
        };
      }),
    [questionVariant]
  );

  const questionResponses = useMemo(
    () =>
      RAW_RESPONSES.map((response, index) => ({
        ...response,
        text: questionVariant.responseTexts[index] ?? response.text,
      })),
    [questionVariant]
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

  return (
    <PageContainer className={styles.page}>
      <div className={styles.utilityBar}>
        <div className={styles.utilityControls}>
          <div className={styles.questionFilter}>
            <span className={styles.filterLabel}>Question</span>
            <WuSelect
              data={questions}
              accessorKey={{ value: 'id', label: 'text' }}
              value={selectedQuestion}
              onSelect={(option) => {
                if (!option || Array.isArray(option)) return;
                setSelectedQuestionId((option as TextAiDashboardQuestion).id);
                setSearch('');
              }}
              variant="outlined"
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
      </div>

      <div className={styles.workspace}>
        <section className={styles.codeFramePanel} aria-label="Code frame">
          <header className={styles.codeFrameHeader}>
            <div className={styles.codeFrameTitle}>
              <strong>My code frame</strong>
              <span className={styles.headerCount}>{questionVariant.themeCount}</span>
            </div>
            <div className={styles.codeFrameActions}>
              <span className={styles.headerCount}>{questionVariant.responseCount}</span>
              <button type="button">New sub-theme</button>
              <button type="button">New theme</button>
            </div>
          </header>
          <div className={styles.themeScrollArea}>
            {themeGroups.map((group) => (
              <ThemeGroupCard
                key={group.id}
                group={group}
                collapsed={collapsedGroups.has(group.id)}
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
    </PageContainer>
  );
}
