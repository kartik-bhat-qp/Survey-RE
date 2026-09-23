'use client';

import { useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  cloneAiLensFindings,
  filterAiLensFindings,
  focusAiLensQuestion,
  getAiLensCategoryIcon,
  groupAiLensFindingsByCategory,
  summarizeAiLensFindings,
  usesAiLensFixPreview,
  type AiLensCategory,
  type AiLensFinding,
  type AiLensPrimaryAction,
  type AiLensSidebarFilter,
} from '@/data/mock-ai-lens';
import { AiLensApplyFixExpanded } from '@/components/surveys/AiLensApplyFixExpanded';
import { AiLensReadinessGauge } from '@/components/surveys/AiLensReadinessGauge';
import styles from './AiLensModal.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);

const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);

interface AiLensModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SeveritySection = 'blocker' | 'warning' | 'advisory';
type AiLensCheckFilter = 'all' | AiLensCategory | 'ai-judged';
type HistoryStatusSection = 'resolved' | 'dismissed' | 'passed';

const HISTORY_META: {
  id: HistoryStatusSection;
  label: string;
  icon: string;
  iconClass: string;
}[] = [
  { id: 'passed', label: 'Passed', icon: 'wm-verified', iconClass: 'historyIconPassed' },
  { id: 'resolved', label: 'Resolved', icon: 'wm-check', iconClass: 'historyIconResolved' },
  { id: 'dismissed', label: 'Dismissed', icon: 'wm-close', iconClass: 'historyIconDismissed' },
];

/** All History status sections are collapsible (same chevron UX). */
const COLLAPSIBLE_ON_HISTORY: HistoryStatusSection[] = [
  'passed',
  'resolved',
  'dismissed',
];

const COLLAPSIBLE_ON_ALL: SeveritySection[] = ['warning', 'advisory'];

const CHECK_FILTERS: { id: AiLensCheckFilter; label: string }[] = [
  { id: 'all', label: 'All checks' },
  { id: 'Logic and flow', label: 'Logic & flow' },
  { id: 'Accessibility', label: 'Accessibility' },
  { id: 'Methodology', label: 'Methodology' },
  { id: 'Compliance', label: 'Compliance' },
  { id: 'ai-judged', label: 'AI-judged' },
];

const SEVERITY_ORDER: SeveritySection[] = ['blocker', 'warning', 'advisory'];

const SEVERITY_META: Record<
  SeveritySection,
  { label: string; icon: string; iconClass: string; countKey: 'blockers' | 'warnings' | 'advisories' }
> = {
  blocker: {
    label: 'Blockers',
    icon: 'wm-error',
    iconClass: 'metricLabelIconBlocker',
    countKey: 'blockers',
  },
  warning: {
    label: 'Warnings',
    icon: 'wm-warning',
    iconClass: 'metricLabelIconWarning',
    countKey: 'warnings',
  },
  advisory: {
    label: 'Advisories',
    icon: 'wm-info',
    iconClass: 'metricLabelIconAdvisory',
    countKey: 'advisories',
  },
};

function primaryActionIcon(action: AiLensPrimaryAction): string {
  switch (action) {
    case 'delete':
      return 'wm-delete';
    case 'fix-this':
      return 'wm-auto-fix-high';
    case 'suggest-fix':
    case 'ai-proposed':
      return 'wm-auto-awesome';
    default:
      return 'wm-build';
  }
}

export function AiLensModal({ open, onOpenChange }: AiLensModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [findings, setFindings] = useState<AiLensFinding[]>(() => cloneAiLensFindings());
  const [filter, setFilter] = useState<AiLensSidebarFilter>('all');
  const [checkFilter, setCheckFilter] = useState<AiLensCheckFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [fixTarget, setFixTarget] = useState<AiLensFinding | null>(null);
  const [collapsedSeverities, setCollapsedSeverities] = useState<
    Partial<Record<SeveritySection, boolean>>
  >({});
  const [collapsedHistory, setCollapsedHistory] = useState<
    Partial<Record<HistoryStatusSection, boolean>>
  >({});

  const summary = useMemo(() => summarizeAiLensFindings(findings), [findings]);
  const historyTotal = summary.resolved + summary.dismissed + summary.passed;
  const historyActive = filter === 'history';

  const filtered = useMemo(() => {
    let list = filterAiLensFindings(findings, filter);
    if (checkFilter === 'ai-judged') {
      list = list.filter((finding) => Boolean(finding.aiJudged));
    } else if (checkFilter !== 'all') {
      list = list.filter((finding) => finding.category === checkFilter);
    }

    const query = searchQuery.trim().toLowerCase();
    if (!query) return list;

    return list.filter((finding) => {
      const haystack = [
        finding.title,
        finding.description,
        finding.suggestedFix ?? '',
        finding.category,
        finding.affectedQuestion?.code ?? '',
        finding.affectedQuestion?.text ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [checkFilter, filter, findings, searchQuery]);

  const groupedBySeverity = useMemo(() => {
    return SEVERITY_ORDER.map((severity) => {
      const items = filtered.filter((f) => f.severity === severity);
      const meta = SEVERITY_META[severity];
      return {
        severity,
        label: meta.label,
        icon: meta.icon,
        iconClass: meta.iconClass,
        count: summary[meta.countKey],
        groups: groupAiLensFindingsByCategory(items),
      };
    }).filter((section) => section.groups.length > 0);
  }, [filtered, summary]);

  const groupedByHistory = useMemo(() => {
    return HISTORY_META.map((meta) => {
      const items = filtered.filter((f) => f.status === meta.id);
      return {
        status: meta.id,
        label: meta.label,
        icon: meta.icon,
        iconClass: meta.iconClass,
        count: summary[meta.id],
        groups: groupAiLensFindingsByCategory(items),
      };
    });
  }, [filtered, summary]);

  const selectFilter = useCallback((next: AiLensSidebarFilter) => {
    setFixTarget(null);
    setFilter(next);
  }, []);

  const handleRerun = useCallback(() => {
    setFindings(cloneAiLensFindings());
    setFixTarget(null);
    setCollapsedSeverities({});
    setCollapsedHistory({});
    setSearchQuery('');
    setCheckFilter('all');
    showToast({ message: 'Pro Insights re-scan complete', variant: 'success' });
  }, [showToast]);

  const handleModalOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) setFixTarget(null);
      queueMicrotask(() => onOpenChange(nextOpen));
    },
    [onOpenChange]
  );

  const toggleSeveritySection = useCallback(
    (severity: SeveritySection, count: number) => {
      setCollapsedSeverities((prev) => {
        const defaultCollapsed = count === 0;
        const currentlyCollapsed =
          prev[severity] !== undefined ? Boolean(prev[severity]) : defaultCollapsed;
        return {
          ...prev,
          [severity]: !currentlyCollapsed,
        };
      });
    },
    []
  );

  const toggleHistorySection = useCallback(
    (status: HistoryStatusSection, count: number) => {
      setCollapsedHistory((prev) => {
        const defaultCollapsed = status === 'passed' ? false : count === 0;
        const currentlyCollapsed =
          prev[status] !== undefined ? Boolean(prev[status]) : defaultCollapsed;
        return {
          ...prev,
          [status]: !currentlyCollapsed,
        };
      });
    },
    []
  );

  const findingSections = useMemo(() => {
    if (historyActive) {
      return groupedByHistory.map((section) => {
        const canCollapse = COLLAPSIBLE_ON_HISTORY.includes(section.status);
        // Passed stays expanded by default so History opens with visible content.
        const defaultCollapsed =
          section.status === 'passed' ? false : section.count === 0;
        const isCollapsed =
          canCollapse &&
          (collapsedHistory[section.status] !== undefined
            ? Boolean(collapsedHistory[section.status])
            : defaultCollapsed);
        return {
          key: section.status,
          label: section.label,
          icon: section.icon,
          iconClass: section.iconClass,
          count: section.count,
          groups: section.groups,
          canCollapse,
          isCollapsed,
          onToggle: () => toggleHistorySection(section.status, section.count),
        };
      });
    }

    return groupedBySeverity.map((section) => {
      const canCollapse =
        filter === 'all' && COLLAPSIBLE_ON_ALL.includes(section.severity);
      const defaultCollapsed = section.count === 0;
      const isCollapsed =
        canCollapse &&
        (collapsedSeverities[section.severity] !== undefined
          ? Boolean(collapsedSeverities[section.severity])
          : defaultCollapsed);
      return {
        key: section.severity,
        label: section.label,
        icon: section.icon,
        iconClass: section.iconClass,
        count: section.count,
        groups: section.groups,
        canCollapse,
        isCollapsed,
        onToggle: () => toggleSeveritySection(section.severity, section.count),
      };
    });
  }, [
    collapsedHistory,
    collapsedSeverities,
    filter,
    groupedByHistory,
    groupedBySeverity,
    historyActive,
    toggleHistorySection,
    toggleSeveritySection,
  ]);

  const updateFindingStatus = useCallback(
    (id: string, status: AiLensFinding['status'], toastMessage: string) => {
      setFindings((prev) =>
        prev.map((finding) => (finding.id === id ? { ...finding, status } : finding))
      );
      showToast({ message: toastMessage, variant: 'success' });
    },
    [showToast]
  );

  const handleDismiss = useCallback(
    (finding: AiLensFinding) => {
      updateFindingStatus(finding.id, 'dismissed', 'Finding dismissed');
    },
    [updateFindingStatus]
  );

  const handlePrimaryAction = useCallback(
    (finding: AiLensFinding) => {
      if (finding.primaryAction === 'delete') {
        updateFindingStatus(finding.id, 'resolved', 'Criteria deleted');
        return;
      }
      if (usesAiLensFixPreview(finding.primaryAction)) {
        setFixTarget(finding);
        return;
      }
      updateFindingStatus(finding.id, 'resolved', 'Finding fixed');
    },
    [updateFindingStatus]
  );

  const handleApplyFix = useCallback(
    (finding: AiLensFinding) => {
      const message =
        finding.primaryAction === 'suggest-fix'
          ? 'Suggested rewrite applied'
          : finding.primaryAction === 'ai-proposed'
            ? 'AI-proposed change applied'
            : finding.suggestedFix
              ? `Fixed: ${finding.suggestedFix.slice(0, 72)}${finding.suggestedFix.length > 72 ? '…' : ''}`
              : 'Finding fixed';
      updateFindingStatus(finding.id, 'resolved', message);
      setFixTarget(null);
    },
    [updateFindingStatus]
  );

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent } = wick;

  return (
    <WuModal
      open
      onOpenChange={handleModalOpenChange}
      variant="action"
      size="lg"
      className={styles.modal}
    >
      <WuModalHeader className={styles.header}>
        <div className={styles.headerBrand}>
          <span className={`wm-auto-awesome ${styles.headerStar}`} aria-hidden />
          <span className={styles.headerTitle}>Pro Insights</span>
          <span className={styles.betaBadge}>BETA</span>
          <button
            type="button"
            className={styles.helpBtn}
            aria-label="About Pro Insights"
            onClick={() =>
              showToast({
                message:
                  'Pro Insights scans logic, accessibility, experience, methodology, and compliance before you publish.',
                variant: 'info',
              })
            }
          >
            <span className="wm-help-outline" aria-hidden />
          </button>
        </div>
      </WuModalHeader>
      <WuModalContent className={styles.content}>
        <div className={styles.summaryBar}>
          <AiLensReadinessGauge score={summary.score} band={summary.band} />

          <div className={styles.metricsCard} role="group" aria-label="Pro Insights summary metrics">
            <button
              type="button"
              className={`${styles.metricCell} ${styles.metricCellBtn} ${
                filter === 'all' ? styles.metricCellActive : ''
              }`}
              onClick={() => selectFilter('all')}
            >
              <span className={styles.metricValue}>{summary.allOpen}</span>
              <span className={styles.metricRule} aria-hidden />
              <span className={styles.metricLabel}>
                <span className={`wm-list ${styles.metricLabelIcon}`} aria-hidden />
                All Findings
              </span>
            </button>
            <button
              type="button"
              className={`${styles.metricCell} ${styles.metricCellBtn} ${
                filter === 'blockers' ? styles.metricCellActive : ''
              }`}
              onClick={() => selectFilter('blockers')}
            >
              <span className={styles.metricValue}>{summary.blockers}</span>
              <span className={styles.metricRule} aria-hidden />
              <span className={styles.metricLabel}>
                <span className={`wm-error ${styles.metricLabelIconBlocker}`} aria-hidden />
                Blockers
              </span>
            </button>
            <button
              type="button"
              className={`${styles.metricCell} ${styles.metricCellBtn} ${
                filter === 'warnings' ? styles.metricCellActive : ''
              }`}
              onClick={() => selectFilter('warnings')}
            >
              <span className={styles.metricValue}>{summary.warnings}</span>
              <span className={styles.metricRule} aria-hidden />
              <span className={styles.metricLabel}>
                <span className={`wm-warning ${styles.metricLabelIconWarning}`} aria-hidden />
                Warnings
              </span>
            </button>
            <button
              type="button"
              className={`${styles.metricCell} ${styles.metricCellBtn} ${
                filter === 'advisories' ? styles.metricCellActive : ''
              }`}
              onClick={() => selectFilter('advisories')}
            >
              <span className={styles.metricValue}>{summary.advisories}</span>
              <span className={styles.metricRule} aria-hidden />
              <span className={styles.metricLabel}>
                <span className={`wm-info ${styles.metricLabelIconAdvisory}`} aria-hidden />
                Advisories
              </span>
            </button>
            <button
              type="button"
              className={`${styles.metricCell} ${styles.metricCellBtn} ${
                historyActive ? styles.metricCellActive : ''
              }`}
              onClick={() => selectFilter('history')}
            >
              <span className={styles.metricValue}>{historyTotal}</span>
              <span className={styles.metricRule} aria-hidden />
              <span className={styles.metricLabel}>
                <span className={`wm-history ${styles.metricLabelIconHistory}`} aria-hidden />
                History
              </span>
            </button>
          </div>
        </div>

        <div className={styles.checkFilterBar}>
          <div className={styles.capsuleRow} role="tablist" aria-label="Check filters">
            {CHECK_FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={checkFilter === item.id}
                className={`${styles.capsule} ${
                  checkFilter === item.id ? styles.capsuleActive : ''
                }`}
                onClick={() => setCheckFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className={styles.searchActions}>
            <button
              type="button"
              className={styles.rerunBtn}
              aria-label="Re-run"
              title="Re-run"
              onClick={handleRerun}
            >
              <span className="wm-refresh" aria-hidden />
            </button>
            <div className={styles.searchWrap}>
              <WuInput
                variant="outlined"
                placeholder="Search findings"
                aria-label="Search findings"
                value={searchQuery}
                onChange={(event: { target: { value: string } }) =>
                  setSearchQuery(event.target.value)
                }
                Icon={<span className="wm-search" aria-hidden />}
                iconPosition="left"
                className={styles.searchInput}
              />
            </div>
          </div>
        </div>

        <div className={styles.body}>
          <div className={styles.findingsPane}>
            {filtered.length === 0 && !historyActive ? (
              <div className={styles.emptyState}>
                No findings in this view. Switch filters or resolve open items.
              </div>
            ) : (
              findingSections.map((section) => {
                const headingLabel = (
                  <span className={styles.severityHeadingLabel}>
                    <span
                      className={`${section.icon} ${styles[section.iconClass]} ${styles.severityHeadingIcon}`}
                      aria-hidden
                    />
                    <span className={styles.severityHeadingText}>{section.label}</span>
                  </span>
                );
                const headingMeta = (
                  <span className={styles.severityHeadingMeta}>
                    <span className={styles.severityHeadingCount}>{section.count}</span>
                    {section.canCollapse ? (
                      <span
                        className={`${
                          section.isCollapsed ? 'wm-expand-more' : 'wm-expand-less'
                        } ${styles.severityChevron}`}
                        aria-hidden
                      />
                    ) : null}
                  </span>
                );
                return (
                  <section key={section.key} className={styles.severitySection}>
                    {section.canCollapse ? (
                      <button
                        type="button"
                        className={`${styles.severityHeadingBtn} ${
                          section.isCollapsed ? styles.severityHeadingBtnCollapsed : ''
                        }`}
                        aria-expanded={!section.isCollapsed}
                        onClick={section.onToggle}
                      >
                        {headingLabel}
                        {headingMeta}
                      </button>
                    ) : (
                      <div className={styles.severityHeadingRow}>
                        {headingLabel}
                        {headingMeta}
                      </div>
                    )}
                    {!section.isCollapsed ? (
                      section.groups.length > 0 ? (
                      section.groups.map((group) => (
                          <div key={group.category} className={styles.categoryBlock}>
                            <h4 className={styles.categoryHeading}>
                              <span
                                className={`${getAiLensCategoryIcon(group.category)} ${styles.categoryIcon}`}
                                aria-hidden
                              />
                              {group.category}
                            </h4>
                            <ul className={styles.findingList}>
                              {group.findings.map((finding) => {
                                const isExpanded = fixTarget?.id === finding.id;
                                return (
                                  <li
                                    key={finding.id}
                                    className={`${styles.findingCard} ${
                                      isExpanded ? styles.findingCardExpanded : ''
                                    } ${
                                      fixTarget && !isExpanded
                                        ? styles.findingCardDimmed
                                        : ''
                                    }`}
                                  >
                                    <div className={styles.findingRow}>
                                      <div className={styles.findingMain}>
                                        <div className={styles.findingTitleRow}>
                                          <span
                                            className={`${styles.severityBadge} ${
                                              styles[`severityBadge_${finding.severity}`]
                                            }`}
                                          >
                                            {finding.severity.toUpperCase()}
                                          </span>
                                          <span className={styles.findingTitle}>
                                            {finding.title}
                                          </span>
                                          {finding.aiJudged ? (
                                            <span className={styles.aiBadge}>AI-judged</span>
                                          ) : null}
                                          {finding.confidence ? (
                                            <span className={styles.confidenceBadge}>
                                              {finding.confidence}
                                            </span>
                                          ) : null}
                                        </div>
                                        <p className={styles.findingDescription}>
                                          {finding.description}
                                        </p>
                                        {!isExpanded && finding.suggestedFix ? (
                                          <p className={styles.suggestedFix}>
                                            <span className={styles.suggestedFixLabel}>
                                              Suggested fix:
                                            </span>{' '}
                                            {finding.suggestedFix}
                                          </p>
                                        ) : null}
                                        {finding.affectedQuestion ? (
                                          <button
                                            type="button"
                                            className={styles.affectedLink}
                                            aria-label={`View question ${finding.affectedQuestion.code}`}
                                            onClick={() => {
                                              const target = finding.affectedQuestion!;
                                              onOpenChange(false);
                                              queueMicrotask(() => {
                                                focusAiLensQuestion({
                                                  sectionId: target.sectionId,
                                                  questionId: target.questionId,
                                                  code: target.code,
                                                });
                                              });
                                            }}
                                          >
                                            <span
                                              className={`wm-visibility ${styles.affectedLinkIcon}`}
                                              aria-hidden
                                            />
                                            <span className={styles.affectedLinkText}>
                                              Affected question {finding.affectedQuestion.code}{' '}
                                              — {finding.affectedQuestion.text}
                                            </span>
                                          </button>
                                        ) : null}
                                      </div>
                                      {!isExpanded && finding.status === 'open' ? (
                                        <div className={styles.findingActions}>
                                          <WuButton
                                            variant="outline"
                                            size="sm"
                                            className={styles.outlinedActionBtn}
                                            Icon={
                                              <span
                                                className={primaryActionIcon(
                                                  finding.primaryAction
                                                )}
                                                aria-hidden
                                              />
                                            }
                                            onClick={() => handlePrimaryAction(finding)}
                                          >
                                            {finding.primaryActionLabel}
                                          </WuButton>
                                          <WuButton
                                            variant="link"
                                            size="sm"
                                            onClick={() => handleDismiss(finding)}
                                          >
                                            Dismiss
                                          </WuButton>
                                        </div>
                                      ) : null}
                                      {!isExpanded && finding.status !== 'open' ? (
                                        <div className={styles.findingActions}>
                                          <span className={styles.statusChip}>
                                            {finding.status}
                                          </span>
                                        </div>
                                      ) : null}
                                    </div>
                                    {isExpanded ? (
                                      <AiLensApplyFixExpanded
                                        finding={finding}
                                        onCancel={() => setFixTarget(null)}
                                        onApply={handleApplyFix}
                                      />
                                    ) : null}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ))
                      ) : (
                        <p className={styles.sectionEmpty}>No {section.label.toLowerCase()} items</p>
                      )
                    ) : null}
                  </section>
                );
              })
            )}
          </div>
        </div>
      </WuModalContent>
    </WuModal>
  );
}
