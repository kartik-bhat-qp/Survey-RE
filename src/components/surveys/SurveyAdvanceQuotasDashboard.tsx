'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { AdvanceQuotaGroupModal } from '@/components/surveys/AdvanceQuotaGroupModal';
import { QuotaGroupCell, QuotaGroupViewModal } from '@/components/surveys/QuotaGroupViewModal';
import {
  DescriptionCriteriaCell,
  QuotaCriteriaViewModal,
} from '@/components/surveys/QuotaCriteriaViewModal';
import { AddQuotaModal } from '@/components/surveys/AddQuotaModal';
import { QuestionBasedQuotaModal } from '@/components/surveys/QuestionBasedQuotaModal';
import { CrossVariableQuotaModal } from '@/components/surveys/CrossVariableQuotaModal';
import { CrossVariableQuotaTrackingPanel } from '@/components/surveys/CrossVariableQuotaTrackingPanel';
import { QuotaAiAgentSidebar } from '@/components/surveys/QuotaAiAgentSidebar';
import type { QuotaAiGenerationResult } from '@/data/mock-quota-ai-agent';
import {
  CriteriaBasedQuotaModal,
  type CriteriaQuotaSubmit,
} from '@/components/surveys/CriteriaBasedQuotaModal';
import {
  getCriteriaCollapsedLine,
  getCriteriaPreviewLine,
} from '@/components/surveys/CriteriaRulesExpanded';
import type { QuotaDimensionState } from '@/components/surveys/QuotaDimensionStep';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  TABLE_QUOTA_TYPE_OPTIONS,
  flattenQuotasForTable,
  formatQuestionQuotaScope,
  getAdvanceQuotaGroupOptions,
  getQuestionOptionMinSum,
  isMinQuestionQuotaScope,
  isRemovedDashboardQuota,
  MOCK_ADVANCE_QUOTAS,
  normalizeQuestionBasedMinQuota,
  resolveQuotaCheckPoints,
  type AdvanceQuota,
  type AdvanceQuotaCheckPoint,
  type AdvanceQuotaCriterionBlock,
  type AdvanceQuotaRow,
  type AdvanceQuotaRuleCondition,
  type QuotaOption,
} from '@/data/mock-advance-quotas';
import {
  inferCrossVariableBatchId,
  resolveCrossVariableTrackingSets,
  type CrossVariableQuotaBatch,
  type CrossVariableQuotaSaveResult,
} from '@/data/mock-cross-variable-quota';
import {
  applyQuotaGroupCheckOverrides,
  advanceQuotaActiveGroupKey,
  advanceQuotaCustomGroupsKey,
  advanceQuotaGroupCheckOverridesKey,
  getQuotaGroupCheckPoints,
  mergeQuotaGroups,
  type QuotaGroup,
  type QuotaGroupSelection,
} from '@/data/mock-quota-groups';
import type { CriteriaQuotaFlow } from '@/components/surveys/CriteriaBasedQuotaModal';
import type { AddQuotaType } from '@/data/mock-add-quota-options';
import type { SurveyQuestion } from '@/data/mock-survey-questions';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  usePersistedState,
  usePersistedStringSet,
} from '@/hooks/usePersistedState';
import { ClientShareLinkModal } from '@/components/surveys/ClientShareLinkModal';
import {
  advanceQuotaClientShareVisibleIdsKey,
  filterQuotasForClientShare,
  getClientShareSelectionLabel,
  type ClientShareVisibleQuotaIds,
} from '@/data/mock-advance-quota-share';
import styles from './SurveyAdvanceQuotasDashboard.module.css';

function slugForId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function buildAdvancedGroupQuota(
  data: CriteriaQuotaSubmit,
  selection: QuotaGroupSelection,
  offset = 0
): AdvanceQuota {
  const quota = buildCriteriaQuota(data, selection.name, offset);
  return {
    ...quota,
    quotaType: 'Advanced',
    multipleQuotaHandling: selection.handlingType,
  };
}

function buildCriteriaQuota(
  data: CriteriaQuotaSubmit,
  quotaGroup: string,
  offset = 0
): AdvanceQuota {
  const now = Date.now() + offset;
  const criterionParts: string[] = [];
  for (const criterion of data.criteria) {
    if (criterion.conditions.length === 0) continue;
    const conditionDescription = criterion.conditions
      .map((cond, idx) => {
        let head: string;
        if (cond.source === 'Question') {
          const qLabel = cond.questionCode
            ? `[${cond.questionCode}]`
            : cond.questionText || 'Question';
          head = `${qLabel} ${cond.operator} "${cond.value}"`;
        } else if (cond.source === 'System Variable') {
          const label = cond.subject || 'System Variable';
          if (cond.operator === 'is between' && cond.valueEnd) {
            head = `[${label}] is between "${cond.value}" and "${cond.valueEnd}"`;
          } else {
            head = `[${label}] ${cond.operator} "${cond.value}"`;
          }
        } else {
          const label = cond.subject || cond.source;
          head = `${label} ${cond.operator} "${cond.value}"`;
        }
        return idx === 0 ? head : `${cond.connector} ${head}`;
      })
      .join(' ');
    if (criterion.name) {
      criterionParts.push(`${criterion.name}: ${conditionDescription}`);
    } else {
      criterionParts.push(conditionDescription);
    }
  }
  const descriptionParts: string[] = [];
  if (criterionParts.length > 0) {
    descriptionParts.push(criterionParts.join(' | '));
  } else if (data.name.trim()) {
    descriptionParts.push(data.name.trim());
  }
  const checks: string[] = [`Checked after [${data.firstCheck.questionCode}]`];
  if (data.secondCheck) {
    checks.push(`re-checked after [${data.secondCheck.questionCode}]`);
  }
  descriptionParts.push(checks.join(', '));

  const criterionBlocks: AdvanceQuotaCriterionBlock[] = data.criteria
    .filter((criterion) => criterion.conditions.length > 0)
    .map((criterion) => ({
      name: criterion.name || data.name,
      conditions: criterion.conditions.map(
        (cond): AdvanceQuotaRuleCondition => ({
          source: cond.source,
          questionCode: cond.questionCode || undefined,
          questionText: cond.questionText || undefined,
          subject: cond.subject,
          operator: cond.operator,
          value: cond.value,
          valueEnd: cond.valueEnd,
          connector: cond.connector,
        })
      ),
    }));

  const quotaChecks: AdvanceQuotaCheckPoint[] = [
    {
      questionCode: data.firstCheck.questionCode,
      questionText: data.firstCheck.questionText,
    },
  ];
  if (data.secondCheck) {
    quotaChecks.push({
      questionCode: data.secondCheck.questionCode,
      questionText: data.secondCheck.questionText,
    });
  }

  return {
    id: `user-criteria-${now}`,
    name: data.name,
    quotaType: 'Criteria based',
    description: descriptionParts.join(' and '),
    quotaGroup,
    multipleQuotaHandling: 'NA',
    target: Math.max(0, Math.round(data.target)),
    current: 0,
    criterionBlocks: criterionBlocks.length > 0 ? criterionBlocks : undefined,
    quotaChecks: quotaChecks.length > 0 ? quotaChecks : undefined,
  };
}

function buildQuotasFromSelection(
  questions: SurveyQuestion[],
  distribution: QuotaDimensionState,
  quotaGroup: string
): AdvanceQuota[] {
  const now = Date.now();
  const quotas: AdvanceQuota[] = [];
  questions.forEach((question, qIdx) => {
    const entry = distribution[question.id];
    if (!entry) return;
    const optionLabels = Object.keys(entry.values);
    if (optionLabels.length === 0) return;
    const options: QuotaOption[] = optionLabels.map((label, idx) => {
      const raw = entry.values[label] ?? 0;
      const target =
        entry.scope === 'min-pct' && entry.target
          ? Math.round((entry.target * raw) / 100)
          : Math.round(raw);
      return {
        id: `${slugForId(label) || 'opt'}-${idx}`,
        label,
        target,
        current: 0,
        overLimitAction: entry.overLimitActions[label],
      };
    });
    const minSum = options.reduce((sum, o) => sum + o.target, 0);
    const isMinScope = isMinQuestionQuotaScope(entry.scope);
    const sampleTarget = Math.round(entry.target ?? 0);
    const totalTarget = isMinScope
      ? Math.max(sampleTarget, minSum)
      : minSum;
    quotas.push({
      id: `user-${now}-${qIdx}-${question.id}`,
      name: question.text,
      quotaType: 'Question Based',
      description: `Options in ${question.code} ${question.text}`,
      quotaGroup,
      multipleQuotaHandling: 'NA',
      target: totalTarget,
      current: 0,
      questionCode: question.code,
      questionText: question.text,
      questionQuotaScope: entry.scope,
      questionQuotaTotalTarget: isMinScope ? totalTarget : undefined,
      options,
    });
  });
  return quotas;
}

function applyGroupChecksToDescription(
  description: string,
  checks: ReadonlyArray<{ questionCode: string }>
): string {
  if (checks.length === 0) return description;

  const first = checks[0]?.questionCode;
  const second = checks[1]?.questionCode;
  if (!first) return description;

  const replacement = second
    ? `Checked after [${first}], re-checked after [${second}]`
    : `Checked after [${first}]`;

  // Swap the "Checked after [...]" part with the quota-group configured check points
  // while keeping the actual criteria portion intact.
  const updated = description.replace(
    /Checked after \[[^\]]+\](?:,\s*re-checked after \[[^\]]+\])?/,
    replacement
  );

  return updated;
}

function stripLegacyDescriptionCriteria(text: string): string {
  return text
    .replace(/^Custom criteria\s*(and\s*)?/i, '')
    .replace(/\s+and\s*$/i, '')
    .trim();
}

function getCriteriaTitle(quota: AdvanceQuota | AdvanceQuotaRow): string {
  const blocks = quota.criterionBlocks ?? [];
  const fromBlocks = getCriteriaCollapsedLine(blocks);
  if (fromBlocks) return fromBlocks;

  const desc = quota.description ?? '';
  const idx = desc.indexOf('Checked after [');
  const before = idx >= 0 ? desc.slice(0, idx) : desc;
  const criteriaFromDesc = stripLegacyDescriptionCriteria(before);
  if (criteriaFromDesc) return criteriaFromDesc;
  if (quota.quotaType === 'Advanced' || quota.quotaType === 'Criteria based') {
    return desc;
  }
  return quota.name || desc;
}

function getDescriptionSummary(
  quota: AdvanceQuota | AdvanceQuotaRow,
  groupChecks: ReadonlyArray<{ questionCode: string }>
): string {
  const blocks = quota.criterionBlocks ?? [];
  const isAdvanced = quota.quotaType === 'Advanced';
  const isCriteria = quota.quotaType === 'Criteria based';
  const checksText = isAdvanced
    ? buildGroupChecksSuffix(groupChecks)
    : buildGroupChecksSuffix(resolveQuotaCheckPoints(quota));

  if (isAdvanced || isCriteria) {
    const criteriaOnly =
      getCriteriaPreviewLine(blocks) || getCriteriaCollapsedLine(blocks) || getCriteriaTitle(quota);
    if (!criteriaOnly) return checksText || '—';
    if (!checksText) return criteriaOnly;
    const dot = criteriaOnly.endsWith('.') ? '' : '.';
    return `${criteriaOnly}${dot} ${checksText}`;
  }

  if (quota.quotaType === 'Question Based') {
    const modeLabel = formatQuestionQuotaScope(quota.questionQuotaScope);
    const base = applyGroupChecksToDescription(quota.description, groupChecks);
    if (isMinQuestionQuotaScope(quota.questionQuotaScope)) {
      const minSum = getQuestionOptionMinSum(quota);
      return `${modeLabel}. Target ${quota.target}. Sum of minimums ${minSum}. ${base}`;
    }
    return `${modeLabel}. ${base}`;
  }

  return applyGroupChecksToDescription(quota.description, groupChecks);
}

function canViewQuotaCriteria(quota: AdvanceQuota): boolean {
  if (quota.quotaType === 'Question Based') {
    return Boolean(
      quota.options?.length ||
        quota.criterionBlocks?.some((block) => block.conditions.length > 0)
    );
  }
  return quota.quotaType === 'Advanced' || quota.quotaType === 'Criteria based';
}

function buildGroupChecksSuffix(
  checks: ReadonlyArray<{ questionCode: string }>
): string {
  if (checks.length === 0) return '';
  const first = checks[0]?.questionCode;
  const second = checks[1]?.questionCode;
  if (!first) return '';
  return second
    ? `Checked after [${first}], re-checked after [${second}]`
    : `Checked after [${first}]`;
}

const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })),
  { ssr: false }
);
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuCheckbox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCheckbox })),
  { ssr: false }
);
const WuMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenu })),
  { ssr: false }
);
const WuMenuCheckboxItem = dynamic(
  () =>
    import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuCheckboxItem })),
  { ssr: false }
);
const WuMenuSeparatorItem = dynamic(
  () =>
    import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuSeparatorItem })),
  { ssr: false }
);
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

function QuotaTargetCell({ quota }: { quota: AdvanceQuotaRow }) {
  const isOptionRow = Boolean(quota.isOption);
  const isMinParent =
    !isOptionRow && isMinQuestionQuotaScope(quota.questionQuotaScope);
  const minSum = isMinParent ? getQuestionOptionMinSum(quota) : 0;

  const progressTarget = quota.target;
  const current = isOptionRow
    ? (quota.current ?? 0)
    : (quota.current ?? (isMinParent ? 0 : progressTarget));

  const progress =
    progressTarget === 0 ? 0 : Math.min(current / progressTarget, 1);
  const pct = progress * 100;
  const tone: 'low' | 'mid' | 'high' =
    pct > 80 ? 'high' : pct > 50 ? 'mid' : 'low';
  const label = `${current}/${progressTarget}`;

  const valueClass = `${styles.targetValue} ${
    tone === 'high'
      ? styles.targetValueHigh
      : tone === 'mid'
      ? styles.targetValueMid
      : styles.targetValueLow
  }`;

  const titleParts = [`${label} (${Math.round(pct)}% of total target)`];
  if (isMinParent && minSum !== progressTarget) {
    titleParts.push(`Sum of minimums: ${minSum}`);
  }
  if (isOptionRow && isMinQuestionQuotaScope(quota.questionQuotaScope)) {
    titleParts.length = 0;
    titleParts.push(
      `${current}/${progressTarget} minimum (${Math.round(
        progressTarget === 0 ? 0 : (current / progressTarget) * 100
      )}% of min)`
    );
  }

  return (
    <span
      className={styles.targetCell}
      title={titleParts.join('. ')}
      aria-label={`Target ${label}`}
    >
      <span className={valueClass}>{label}</span>
    </span>
  );
}

function ColumnHeader({
  label,
  icons,
}: {
  label: string;
  icons?: ('sort' | 'filter' | 'info' | 'settings')[];
}) {
  return (
    <span className={styles.columnHeader}>
      {label}
      {icons?.includes('sort') ? <span className="wm-unfold-more" aria-hidden /> : null}
      {icons?.includes('filter') ? <span className="wm-filter-list" aria-hidden /> : null}
      {icons?.includes('info') ? <span className="wm-info-outline" aria-hidden /> : null}
      {icons?.includes('settings') ? <span className="wm-settings" aria-hidden /> : null}
    </span>
  );
}

function isColumnFilterActive(selected: string[], options: string[]): boolean {
  if (options.length === 0) return false;
  return options.some((option) => !selected.includes(option));
}

/** When new filter options appear, keep them visible if the user had every prior option selected. */
function mergeFilterWithNewOptions(selected: string[], options: string[]): string[] {
  const missing = options.filter((option) => !selected.includes(option));
  if (missing.length === 0) return selected;
  const knownOptions = options.filter((option) => !missing.includes(option));
  const hadAllKnown =
    knownOptions.length > 0 && knownOptions.every((option) => selected.includes(option));
  if (!hadAllKnown) return selected;
  return [...selected, ...missing];
}

function FilterableColumnHeader({
  label,
  value,
  options,
  onChange,
  leadingIcon,
  showSort,
}: {
  label: string;
  value: string[];
  options: string[];
  onChange: (value: string[]) => void;
  leadingIcon?: string;
  showSort?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(value);
  const isActive = isColumnFilterActive(value, options);
  const chipTitle = isActive
    ? value.length === 0
      ? 'No options selected'
      : `Showing ${value.join(', ')}`
    : '';
  const draftChanged =
    draft.length !== value.length || draft.some((v) => !value.includes(v));

  function handleOpenChange(next: boolean) {
    if (next) {
      setDraft(value);
    }
    setOpen(next);
  }

  function toggleDraft(option: string) {
    setDraft((prev) =>
      prev.includes(option) ? prev.filter((v) => v !== option) : [...prev, option]
    );
  }

  function deselectAllDraft() {
    setDraft([]);
  }

  function selectAllDraft() {
    setDraft([...options]);
  }

  function applyDraft() {
    onChange(draft);
    setOpen(false);
  }

  function resetToAllSelected() {
    const all = [...options];
    onChange(all);
    setDraft(all);
  }

  return (
    <span
      className={styles.columnHeader}
      data-filtered={isActive ? 'true' : undefined}
    >
      {leadingIcon ? <span className={leadingIcon} aria-hidden /> : null}
      {label}
      {showSort ? <span className="wm-unfold-more" aria-hidden /> : null}
      {isActive ? (
        <span className={styles.filterChip} title={chipTitle}>
          <span className={styles.filterChipCount}>{value.length}</span>
          <span
            role="button"
            tabIndex={0}
            aria-label={`Reset ${label} filter to all`}
            className={styles.filterChipClear}
            onClick={(event) => {
              event.stopPropagation();
              resetToAllSelected();
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                event.stopPropagation();
                resetToAllSelected();
              }
            }}
          >
            <span className="wm-close" aria-hidden />
          </span>
        </span>
      ) : null}
      <WuMenu
        open={open}
        onOpenChange={handleOpenChange}
        Trigger={
          <span
            role="button"
            tabIndex={0}
            className={styles.filterBtn}
            data-active={isActive ? 'true' : undefined}
            aria-label={`Filter ${label}`}
          >
            <span className="wm-filter-list" aria-hidden />
          </span>
        }
        align="start"
      >
        <div className={styles.filterMenuHeader}>
          <button
            type="button"
            className={styles.filterMenuClearBtn}
            onClick={deselectAllDraft}
            disabled={draft.length === 0}
          >
            Deselect all
          </button>
          <button
            type="button"
            className={styles.filterMenuClearBtn}
            onClick={selectAllDraft}
            disabled={draft.length === options.length}
          >
            Select all
          </button>
        </div>
        <WuMenuSeparatorItem />
        {options.map((option) => (
          <WuMenuCheckboxItem
            key={option}
            checked={draft.includes(option)}
            onSelect={() => toggleDraft(option)}
            preventCloseOnSelect
          >
            {option}
          </WuMenuCheckboxItem>
        ))}
        <WuMenuSeparatorItem />
        <div className={styles.filterMenuFooter}>
          <button
            type="button"
            className={styles.filterMenuApplyBtn}
            onClick={applyDraft}
            disabled={!draftChanged}
          >
            Apply
          </button>
        </div>
      </WuMenu>
    </span>
  );
}

interface SurveyAdvanceQuotasDashboardProps {
  surveyId: number;
  /** Read-only client share link — no add, delete, or row selection. */
  clientView?: boolean;
}

export function SurveyAdvanceQuotasDashboard({
  surveyId,
  clientView = false,
}: SurveyAdvanceQuotasDashboardProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [addQuotaOpen, setAddQuotaOpen] = useState(false);
  const [questionQuotaOpen, setQuestionQuotaOpen] = useState(false);
  const [crossVariableQuotaOpen, setCrossVariableQuotaOpen] = useState(false);
  const [quotaAiOpen, setQuotaAiOpen] = useState(false);
  const [dashboardView, setDashboardView] = usePersistedState<'table' | 'cross-matrix'>(
    `advance-quotas:${surveyId}:dashboard-view`,
    'table'
  );
  const [crossVariableBatches, setCrossVariableBatches] = usePersistedState<
    CrossVariableQuotaBatch[]
  >(`advance-quotas:${surveyId}:cross-batches`, []);
  const [criteriaQuotaOpen, setCriteriaQuotaOpen] = useState(false);
  const [quotaTypeFilter, setQuotaTypeFilter] = useState<string[]>(() => [
    ...TABLE_QUOTA_TYPE_OPTIONS,
  ]);
  const [quotaGroupFilter, setQuotaGroupFilter] = useState<string[]>(() => [
    ...getAdvanceQuotaGroupOptions(),
  ]);
  const [expandedQuotaIds, setExpandedQuotaIds] = usePersistedStringSet(
    `advance-quotas:${surveyId}:expanded`
  );
  const [addedQuotas, setAddedQuotas] = usePersistedState<AdvanceQuota[]>(
    `advance-quotas:${surveyId}:added`,
    []
  );
  const [, setActiveQuotaGroup] = usePersistedState<QuotaGroupSelection | null>(
    advanceQuotaActiveGroupKey(surveyId),
    null
  );
  const [quotaGroupModalOpen, setQuotaGroupModalOpen] = useState(false);
  const [criteriaFlow, setCriteriaFlow] = useState<CriteriaQuotaFlow>('standalone');
  const [criteriaQuotaGroup, setCriteriaQuotaGroup] = useState<QuotaGroupSelection | null>(
    null
  );
  const [selectedQuotaIds, setSelectedQuotaIds] = useState<Set<string>>(() => new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [viewQuotaGroupName, setViewQuotaGroupName] = useState<string | null>(null);
  const [viewCriteriaQuotaId, setViewCriteriaQuotaId] = useState<string | null>(null);
  const [customGroups] = usePersistedState<QuotaGroup[]>(
    advanceQuotaCustomGroupsKey(surveyId),
    []
  );
  const [groupCheckOverrides] = usePersistedState(
    advanceQuotaGroupCheckOverridesKey(surveyId),
    {}
  );
  const [deletedMockQuotaIds, setDeletedMockQuotaIds] = usePersistedStringSet(
    `advance-quotas:${surveyId}:deleted-mock`
  );
  const [clientShareVisibleIds, setClientShareVisibleIds] =
    usePersistedState<ClientShareVisibleQuotaIds>(
      advanceQuotaClientShareVisibleIdsKey(surveyId),
      null
    );
  const [clientShareModalOpen, setClientShareModalOpen] = useState(false);

  const mockQuotaIdSet = useMemo(
    () => new Set(MOCK_ADVANCE_QUOTAS.map((quota) => quota.id)),
    []
  );

  const allQuotas = useMemo<AdvanceQuota[]>(
    () =>
      [
        ...addedQuotas.filter((quota) => !isRemovedDashboardQuota(quota)),
        ...MOCK_ADVANCE_QUOTAS.filter((quota) => !deletedMockQuotaIds.has(quota.id)),
      ].map(normalizeQuestionBasedMinQuota),
    [addedQuotas, deletedMockQuotaIds]
  );

  const displayQuotas = useMemo(
    () =>
      clientView
        ? filterQuotasForClientShare(allQuotas, clientShareVisibleIds)
        : allQuotas,
    [allQuotas, clientShareVisibleIds, clientView]
  );

  const clientShareSelectionLabel = useMemo(
    () => getClientShareSelectionLabel(allQuotas, clientShareVisibleIds),
    [allQuotas, clientShareVisibleIds]
  );

  useEffect(() => {
    if (clientShareVisibleIds === null) return;
    setClientShareVisibleIds((prev) => {
      if (prev === null) return prev;
      const validIds = new Set(allQuotas.map((quota) => quota.id));
      const next = prev.filter((id) => validIds.has(id));
      if (next.length === prev.length) return prev;
      if (next.length === 0) return null;
      if (next.length === allQuotas.length) return null;
      return next;
    });
  }, [allQuotas, setClientShareVisibleIds]);

  const existingQuotasForAdvancedCriteriaModal = useMemo((): AdvanceQuota[] | undefined => {
    if (!criteriaQuotaGroup || criteriaFlow !== 'advanced-group') return undefined;
    const nameNorm = criteriaQuotaGroup.name.trim().toLowerCase();
    return allQuotas.filter(
      (q) =>
        q.quotaGroup !== 'NA' &&
        q.quotaGroup.trim().toLowerCase() === nameNorm &&
        (q.quotaType === 'Advanced' || q.quotaType === 'Criteria based')
    );
  }, [allQuotas, criteriaFlow, criteriaQuotaGroup]);

  useEffect(() => {
    setAddedQuotas((prev) => {
      const next = prev.filter((quota) => !isRemovedDashboardQuota(quota));
      return next.length === prev.length ? prev : next;
    });
  }, [setAddedQuotas]);

  function toggleQuotaExpand(quotaId: string): void {
    setExpandedQuotaIds((prev) => {
      const next = new Set(prev);
      if (next.has(quotaId)) {
        next.delete(quotaId);
      } else {
        next.add(quotaId);
      }
      return next;
    });
  }

  const quotaTypeOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...TABLE_QUOTA_TYPE_OPTIONS,
          ...displayQuotas
            .map((q) => q.quotaType)
            .filter((type) => type !== 'Cross variable'),
        ])
      ).sort(),
    [displayQuotas]
  );

  const quotaGroupOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...getAdvanceQuotaGroupOptions(),
          ...displayQuotas.map((q) => q.quotaGroup),
        ])
      ).sort(),
    [displayQuotas]
  );

  useEffect(() => {
    setQuotaTypeFilter((prev) => mergeFilterWithNewOptions(prev, quotaTypeOptions));
  }, [quotaTypeOptions]);

  useEffect(() => {
    setQuotaGroupFilter((prev) => mergeFilterWithNewOptions(prev, quotaGroupOptions));
  }, [quotaGroupOptions]);

  const filteredTableQuotas = useMemo(() => {
    return displayQuotas.filter((quota) => {
      if (quota.quotaType === 'Cross variable') {
        return false;
      }
      if (!quotaTypeFilter.includes(quota.quotaType)) {
        return false;
      }
      if (!quotaGroupFilter.includes(quota.quotaGroup)) {
        return false;
      }
      return true;
    });
  }, [displayQuotas, quotaGroupFilter, quotaTypeFilter]);

  const crossVariableQuotas = useMemo(() => {
    return displayQuotas.filter((quota) => {
      if (quota.quotaType !== 'Cross variable') {
        return false;
      }
      if (!quotaGroupFilter.includes(quota.quotaGroup)) {
        return false;
      }
      return true;
    });
  }, [displayQuotas, quotaGroupFilter]);

  const crossVariableTrackingSets = useMemo(
    () => resolveCrossVariableTrackingSets(crossVariableQuotas, crossVariableBatches),
    [crossVariableBatches, crossVariableQuotas]
  );

  const hasCrossVariableTracking = crossVariableTrackingSets.length > 0;

  function handleCrossVariableBatchUpdate(result: CrossVariableQuotaSaveResult): void {
    const batchId = result.batch.id;
    setAddedQuotas((prev) => {
      const rest = prev.filter((quota) => inferCrossVariableBatchId(quota) !== batchId);
      return [...result.quotas, ...rest];
    });
    setCrossVariableBatches((prev) => {
      const exists = prev.some((batch) => batch.id === batchId);
      if (exists) {
        return prev.map((batch) => (batch.id === batchId ? result.batch : batch));
      }
      return [...prev, result.batch];
    });
  }

  function handleCrossVariableImportCurrents(
    batchId: string,
    quotas: AdvanceQuota[]
  ): void {
    const byId = new Map(quotas.map((quota) => [quota.id, quota]));
    setAddedQuotas((prev) =>
      prev.map((quota) => {
        if (inferCrossVariableBatchId(quota) !== batchId) return quota;
        return byId.get(quota.id) ?? quota;
      })
    );
  }

  function handleQuotaAiGenerated(result: QuotaAiGenerationResult): void {
    if (result.kind === 'cross-variable') {
      handleCrossVariableBatchUpdate(result.saveResult);
      return;
    }

    setAddedQuotas((prev) => [...result.quotas, ...prev]);
    setExpandedQuotaIds((prev) => {
      const next = new Set(prev);
      for (const quota of result.quotas) next.add(quota.id);
      return next;
    });
    setDashboardView('table');
  }

  const quotaGroupChecksByName = useMemo(() => {
    const groups = applyQuotaGroupCheckOverrides(
      mergeQuotaGroups(customGroups),
      groupCheckOverrides
    );
    const byName = new Map<string, ReturnType<typeof getQuotaGroupCheckPoints>>();
    for (const group of groups) {
      byName.set(
        group.name.toLowerCase(),
        getQuotaGroupCheckPoints(group)
      );
    }
    return byName;
  }, [customGroups, groupCheckOverrides]);

  const viewCriteriaQuota = useMemo(
    () => displayQuotas.find((quota) => quota.id === viewCriteriaQuotaId) ?? null,
    [displayQuotas, viewCriteriaQuotaId]
  );

  const viewCriteriaGroupChecks = useMemo(() => {
    if (!viewCriteriaQuota || viewCriteriaQuota.quotaGroup === 'NA') return [];
    return (
      quotaGroupChecksByName.get(viewCriteriaQuota.quotaGroup.toLowerCase()) ?? []
    );
  }, [viewCriteriaQuota, quotaGroupChecksByName]);

  const tableRows = useMemo(
    () =>
      flattenQuotasForTable(filteredTableQuotas, expandedQuotaIds).map((row) => {
        const target = row.target;
        const isMinParent =
          !row.isOption && isMinQuestionQuotaScope(row.questionQuotaScope);
        const current = row.isOption
          ? (row.current ?? 0)
          : (row.current ?? (isMinParent ? 0 : target));
        const completionPct = target === 0 ? 0 : (current / target) * 100;
        return { ...row, completionPct };
      }),
    [expandedQuotaIds, filteredTableQuotas]
  );

  const selectableParentRows = useMemo(
    () => tableRows.filter((row) => !row.isOption),
    [tableRows]
  );

  const allSelectableSelected =
    selectableParentRows.length > 0 &&
    selectableParentRows.every((row) => selectedQuotaIds.has(row.id));

  const selectedCount = selectedQuotaIds.size;

  useEffect(() => {
    const visibleIds = new Set(selectableParentRows.map((row) => row.id));
    setSelectedQuotaIds((prev) => {
      const next = new Set([...prev].filter((id) => visibleIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [selectableParentRows]);

  function toggleSelectAll(checked: boolean): void {
    if (checked) {
      setSelectedQuotaIds(new Set(selectableParentRows.map((row) => row.id)));
      return;
    }
    setSelectedQuotaIds(new Set());
  }

  function toggleQuotaSelected(quotaId: string, checked: boolean): void {
    setSelectedQuotaIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(quotaId);
      else next.delete(quotaId);
      return next;
    });
  }

  function handleConfirmDelete(): void {
    const idsToDelete = selectedQuotaIds;
    setAddedQuotas((prev) => prev.filter((quota) => !idsToDelete.has(quota.id)));
    setDeletedMockQuotaIds((prev) => {
      const next = new Set(prev);
      for (const id of idsToDelete) {
        if (mockQuotaIdSet.has(id)) next.add(id);
      }
      return next;
    });
    setExpandedQuotaIds((prev) => {
      const next = new Set(prev);
      for (const id of idsToDelete) next.delete(id);
      return next;
    });
    setSelectedQuotaIds(new Set());
    showToast({
      message:
        idsToDelete.size === 1
          ? '1 quota deleted'
          : `${idsToDelete.size} quotas deleted`,
      variant: 'success',
    });
  }

  const columns: IWuTableColumnDef<AdvanceQuotaRow>[] = useMemo(
    () => {
      const cols: IWuTableColumnDef<AdvanceQuotaRow>[] = [];

      if (!clientView) {
        cols.push({
          id: 'select',
          accessorKey: 'name',
          header: () => (
            <div
              className={styles.checkboxHeader}
              onClick={(event) => event.stopPropagation()}
            >
              <WuCheckbox
                checked={allSelectableSelected}
                disabled={selectableParentRows.length === 0}
                onChange={toggleSelectAll}
                aria-label="Select all quotas"
              />
            </div>
          ),
          enableSorting: false,
          size: 48,
          cell: ({ row }) => {
            if (row.original.isOption) {
              return <span className={styles.subRowMuted} aria-hidden />;
            }
            return (
              <div
                className={styles.checkboxCell}
                onClick={(event) => event.stopPropagation()}
              >
                <WuCheckbox
                  checked={selectedQuotaIds.has(row.original.id)}
                  onChange={(checked) => toggleQuotaSelected(row.original.id, checked)}
                  aria-label={`Select ${row.original.name}`}
                />
              </div>
            );
          },
        });
      }

      cols.push({
        accessorKey: 'name',
        header: () => <ColumnHeader label="Name" icons={['sort']} />,
        enableSorting: true,
        size: 220,
        cell: ({ row }) => {
          const quota = row.original;
          const hasOptions = !!quota.options && quota.options.length > 0;
          const isExpanded = hasOptions && expandedQuotaIds.has(quota.id);
          if (quota.isOption) {
            return (
              <span
                className={`${styles.nameCell} ${styles.optionNameCell}`}
                title={quota.name}
              >
                <span className={styles.optionBullet} aria-hidden />
                {quota.name}
              </span>
            );
          }
          if (hasOptions) {
            return (
              <span
                role="button"
                tabIndex={0}
                className={`${styles.nameCell} ${styles.expandableNameCell}`}
                title={quota.name}
                aria-expanded={isExpanded}
                aria-label={`${isExpanded ? 'Collapse' : 'Expand'} options for ${quota.name}`}
                onClick={(event) => {
                  event.stopPropagation();
                  toggleQuotaExpand(quota.id);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    toggleQuotaExpand(quota.id);
                  }
                }}
              >
                <i
                  className={`wm wm-chevron-right ${styles.expandChevron} ${
                    isExpanded ? styles.expandChevronOpen : ''
                  }`}
                  aria-hidden
                />
                <span className={styles.expandableNameText}>{quota.name}</span>
              </span>
            );
          }
          return (
            <span className={styles.nameCell} title={quota.name}>
              {quota.name}
            </span>
          );
        },
      });

      cols.push({
        accessorKey: 'quotaType',
        header: () => (
          <FilterableColumnHeader
            label="Quota type"
            value={quotaTypeFilter}
            options={quotaTypeOptions}
            onChange={setQuotaTypeFilter}
          />
        ),
        filterable: true,
        enableSorting: false,
        size: 140,
        cell: ({ row }) => {
          if (row.original.isOption) {
            return <span className={styles.subRowMuted} aria-hidden />;
          }

          const quotaType = row.original.quotaType;
          const iconClass =
            quotaType === 'Question Based'
              ? 'wm-list'
              : quotaType === 'Advanced'
                ? 'wm-tune'
                : 'wm-call-split';

          return (
            <WuTooltip content={quotaType} position="top">
              <span className={styles.quotaTypeIconWrap} aria-label={quotaType}>
                <span
                  className={`${iconClass} ${styles.quotaTypeIcon}`}
                  aria-hidden
                />
              </span>
            </WuTooltip>
          );
        },
      });

      cols.push({
        accessorKey: 'description',
        header: () => <ColumnHeader label="Description" icons={['info']} />,
        size: 320,
        cell: ({ row }) => {
          if (row.original.isOption) {
            return <span className={styles.subRowMuted} aria-hidden />;
          }
          const groupChecks =
            row.original.quotaType === 'Advanced' && row.original.quotaGroup !== 'NA'
              ? quotaGroupChecksByName.get(row.original.quotaGroup.toLowerCase()) ?? []
              : [];
          const summary = getDescriptionSummary(row.original, groupChecks);

          return (
            <DescriptionCriteriaCell
              summary={summary}
              canView={canViewQuotaCriteria(row.original)}
              onView={() => setViewCriteriaQuotaId(row.original.id)}
            />
          );
        },
      });

      cols.push({
        accessorKey: 'quotaGroup',
        header: () => (
          <FilterableColumnHeader
            label="Quota group"
            value={quotaGroupFilter}
            options={quotaGroupOptions}
            onChange={setQuotaGroupFilter}
            leadingIcon="wm-group"
            showSort
          />
        ),
        filterable: true,
        enableSorting: true,
        size: 200,
        cell: ({ row }) => {
          if (row.original.isOption) {
            return <span className={styles.subRowMuted} aria-hidden />;
          }
          return (
            <QuotaGroupCell
              groupName={row.original.quotaGroup}
              onView={setViewQuotaGroupName}
            />
          );
        },
      });

      cols.push({
        accessorKey: 'multipleQuotaHandling',
        header: () => (
          <span className={styles.columnHeader}>Multiple quota handling</span>
        ),
        enableSorting: true,
        size: 190,
        cell: ({ row }) => {
          if (row.original.isOption) {
            return <span className={styles.subRowMuted} aria-hidden />;
          }
          return (
            <span className={styles.clamp} title={row.original.multipleQuotaHandling}>
              {row.original.multipleQuotaHandling}
            </span>
          );
        },
      });

      cols.push({
        accessorKey: 'completionPct',
        header: () => <ColumnHeader label="Target" icons={['sort', 'filter']} />,
        headerAlign: 'right',
        enableSorting: true,
        cellAlign: 'right',
        size: 130,
        cell: ({ row }) => <QuotaTargetCell quota={row.original} />,
      });

      return cols;
    },
    [
      allSelectableSelected,
      clientView,
      expandedQuotaIds,
      quotaGroupFilter,
      quotaGroupChecksByName,
      quotaGroupOptions,
      quotaTypeFilter,
      quotaTypeOptions,
      selectableParentRows.length,
      selectedQuotaIds,
    ]
  );

  if (!wick) {
    return null;
  }

  return (
    <div className={styles.workspace}>
      {!clientView ? (
        <QuotaAiAgentSidebar
          open={quotaAiOpen}
          surveyId={surveyId}
          onClose={() => setQuotaAiOpen(false)}
          onGenerated={handleQuotaAiGenerated}
        />
      ) : null}

      <div
        className={`${styles.dashboard} ${!clientView && !quotaAiOpen ? styles.dashboardWithAiFab : ''}`}
      >
      {!clientView ? (
        <div className={styles.header}>
          <div className={styles.headerTitles}>
            <h2 className={styles.title}>Dashboard</h2>
            {hasCrossVariableTracking ? (
              <div className={styles.viewToggle} role="tablist" aria-label="Dashboard view">
                <button
                  type="button"
                  role="tab"
                  aria-selected={dashboardView === 'table'}
                  className={`${styles.viewToggleBtn} ${
                    dashboardView === 'table' ? styles.viewToggleBtnActive : ''
                  }`}
                  onClick={() => setDashboardView('table')}
                >
                  Table view
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={dashboardView === 'cross-matrix'}
                  className={`${styles.viewToggleBtn} ${
                    dashboardView === 'cross-matrix' ? styles.viewToggleBtnActive : ''
                  }`}
                  onClick={() => setDashboardView('cross-matrix')}
                >
                  Cross variable matrix
                </button>
              </div>
            ) : null}
          </div>
          <div className={styles.headerActions}>
            {selectedCount > 0 ? (
              <WuButton
                size="sm"
                variant="secondary"
                onClick={() => setDeleteConfirmOpen(true)}
              >
                Delete
                <span className={styles.selectionCount}>({selectedCount})</span>
              </WuButton>
            ) : null}
            <WuButton
              size="sm"
              variant="secondary"
              onClick={() => setClientShareModalOpen(true)}
              title={clientShareSelectionLabel}
            >
              <span className="wm-share" aria-hidden />
              Client link
            </WuButton>
            <WuButton
              size="sm"
              variant="primary"
              onClick={() => setAddQuotaOpen(true)}
            >
              Add Quota
              <span className="wm-add" />
            </WuButton>
          </div>
        </div>
      ) : null}

      {clientView && hasCrossVariableTracking ? (
        <div className={styles.clientViewBar}>
          <div className={styles.viewToggle} role="tablist" aria-label="Dashboard view">
            <button
              type="button"
              role="tab"
              aria-selected={dashboardView === 'table'}
              className={`${styles.viewToggleBtn} ${
                dashboardView === 'table' ? styles.viewToggleBtnActive : ''
              }`}
              onClick={() => setDashboardView('table')}
            >
              Table view
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={dashboardView === 'cross-matrix'}
              className={`${styles.viewToggleBtn} ${
                dashboardView === 'cross-matrix' ? styles.viewToggleBtnActive : ''
              }`}
              onClick={() => setDashboardView('cross-matrix')}
            >
              Cross variable matrix
            </button>
          </div>
        </div>
      ) : null}

      {dashboardView === 'cross-matrix' && hasCrossVariableTracking ? (
        <CrossVariableQuotaTrackingPanel
          trackingSets={crossVariableTrackingSets}
          batches={crossVariableBatches}
          clientView={clientView}
          onUpdateBatch={handleCrossVariableBatchUpdate}
          onImportCurrents={handleCrossVariableImportCurrents}
        />
      ) : (
        <div className={styles.tableWrap}>
          <WuTable
            data={tableRows as unknown[]}
            columns={columns as unknown as IWuTableColumnDef<unknown>[]}
            className={styles.quotaTable}
            tableLayout="fixed"
            sort={{ enabled: true }}
            filterText=""
            NoDataContent={
              <EmptyState
                icon="wm-filter-list"
                title={
                  clientView && displayQuotas.length === 0
                    ? 'No quotas on this client dashboard'
                    : 'No quotas match your filters'
                }
                description={
                  clientView && displayQuotas.length === 0
                    ? 'The survey owner has not shared any quotas on this link yet.'
                    : 'Select one or more options in the Quota type or Quota group filters, or reset filters to show all'
                }
              />
            }
          />
        </div>
      )}

      <QuotaGroupViewModal
        open={viewQuotaGroupName !== null}
        onOpenChange={(open) => {
          if (!open) setViewQuotaGroupName(null);
        }}
        groupName={viewQuotaGroupName}
        allQuotas={displayQuotas}
        customGroups={customGroups}
        groupCheckOverrides={groupCheckOverrides}
      />

      <QuotaCriteriaViewModal
        open={viewCriteriaQuotaId !== null}
        onOpenChange={(open) => {
          if (!open) setViewCriteriaQuotaId(null);
        }}
        quota={viewCriteriaQuota}
        surveyId={surveyId}
        groupCheckCodes={viewCriteriaGroupChecks}
      />

      {!clientView ? (
        <ClientShareLinkModal
          open={clientShareModalOpen}
          onOpenChange={setClientShareModalOpen}
          surveyId={surveyId}
          quotas={allQuotas}
          visibleIds={clientShareVisibleIds}
          onSaveVisibleIds={setClientShareVisibleIds}
        />
      ) : null}

      {!clientView ? (
        <ConfirmModal
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title="Delete quotas?"
          description={
            selectedCount === 1
              ? 'This quota will be removed from the dashboard. This cannot be undone.'
              : `${selectedCount} quotas will be removed from the dashboard. This cannot be undone.`
          }
          confirmLabel="Delete"
          variant="critical"
          onConfirm={handleConfirmDelete}
        />
      ) : null}

      {!clientView ? (
        <AdvanceQuotaGroupModal
        open={quotaGroupModalOpen}
        onOpenChange={setQuotaGroupModalOpen}
        surveyId={surveyId}
        onBack={() => {
          setQuotaGroupModalOpen(false);
          setAddQuotaOpen(true);
        }}
        onConfirm={(selection) => {
          setActiveQuotaGroup(selection);
          setCriteriaQuotaGroup(selection);
          setCriteriaFlow('advanced-group');
          setQuotaGroupModalOpen(false);
          setCriteriaQuotaOpen(true);
        }}
      />
      ) : null}

      {!clientView ? (
        <>
      <AddQuotaModal
        open={addQuotaOpen}
        onOpenChange={setAddQuotaOpen}
        onSelectType={(type: AddQuotaType) => {
          if (type === 'question-based') {
            setQuestionQuotaOpen(true);
            return;
          }
          if (type === 'criteria-based') {
            setCriteriaFlow('standalone');
            setCriteriaQuotaGroup(null);
            setCriteriaQuotaOpen(true);
            return;
          }
          if (type === 'cross-variable') {
            setCrossVariableQuotaOpen(true);
            return;
          }
          if (type === 'advanced') {
            setQuotaGroupModalOpen(true);
          }
        }}
      />

      <CrossVariableQuotaModal
        open={crossVariableQuotaOpen}
        onOpenChange={setCrossVariableQuotaOpen}
        surveyId={surveyId}
        onBack={() => {
          setCrossVariableQuotaOpen(false);
          setAddQuotaOpen(true);
        }}
        onSave={(result) => {
          if (result.quotas.length === 0) return;
          setAddedQuotas((prev) => [...result.quotas, ...prev]);
          setCrossVariableBatches((prev) => [...prev, result.batch]);
          setDashboardView('cross-matrix');
          setExpandedQuotaIds((prev) => {
            const next = new Set(prev);
            for (const q of result.quotas) next.add(q.id);
            return next;
          });
        }}
      />

      <QuestionBasedQuotaModal
        open={questionQuotaOpen}
        onOpenChange={setQuestionQuotaOpen}
        surveyId={surveyId}
        onBack={() => {
          setQuestionQuotaOpen(false);
          setAddQuotaOpen(true);
        }}
        onSave={(questions, distribution) => {
          const newQuotas = buildQuotasFromSelection(questions, distribution, 'NA');
          if (newQuotas.length === 0) return;
          setAddedQuotas((prev) => [...newQuotas, ...prev]);
          setExpandedQuotaIds((prev) => {
            const next = new Set(prev);
            for (const q of newQuotas) next.add(q.id);
            return next;
          });
        }}
      />

      <CriteriaBasedQuotaModal
        open={criteriaQuotaOpen}
        onOpenChange={(open) => {
          setCriteriaQuotaOpen(open);
          if (!open) {
            setCriteriaFlow('standalone');
            setCriteriaQuotaGroup(null);
          }
        }}
        surveyId={surveyId}
        flow={criteriaFlow}
        quotaGroupSelection={criteriaQuotaGroup}
        existingQuotasInSelectedGroup={existingQuotasForAdvancedCriteriaModal}
        onBack={() => {
          setCriteriaQuotaOpen(false);
          setCriteriaFlow('standalone');
          setCriteriaQuotaGroup(null);
          setAddQuotaOpen(true);
        }}
        onBackToQuotaGroup={() => {
          setCriteriaQuotaOpen(false);
          setQuotaGroupModalOpen(true);
        }}
        onSave={(submissions: CriteriaQuotaSubmit[]) => {
          if (submissions.length === 0) return;
          const newQuotas =
            criteriaFlow === 'advanced-group' && criteriaQuotaGroup
              ? submissions.map((data, idx) =>
                  buildAdvancedGroupQuota(data, criteriaQuotaGroup, idx)
                )
              : submissions.map((data, idx) => buildCriteriaQuota(data, 'NA', idx));
          setAddedQuotas((prev) => [...newQuotas, ...prev]);
        }}
      />
        </>
      ) : null}

      {!clientView && !quotaAiOpen ? (
        <button
          type="button"
          className={styles.quotaAiFab}
          aria-label="Open quota agent"
          title="Open quota agent"
          onClick={() => setQuotaAiOpen(true)}
        >
          <span className={`wc-ai ${styles.quotaAiFabIcon}`} aria-hidden />
        </button>
      ) : null}
      </div>
    </div>
  );
}
