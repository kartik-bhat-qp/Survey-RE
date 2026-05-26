'use client';

import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import type { IWuTableColumnDef } from '@npm-questionpro/wick-ui-lib';
import { AddQuotaModal } from '@/components/surveys/AddQuotaModal';
import { QuestionBasedQuotaModal } from '@/components/surveys/QuestionBasedQuotaModal';
import {
  CriteriaBasedQuotaModal,
  type CriteriaQuotaSubmit,
} from '@/components/surveys/CriteriaBasedQuotaModal';
import type { QuotaDimensionState } from '@/components/surveys/QuotaDimensionStep';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  ADVANCE_QUOTA_TYPE_OPTIONS,
  flattenQuotasForTable,
  getAdvanceQuotaGroupOptions,
  MOCK_ADVANCE_QUOTAS,
  type AdvanceQuota,
  type AdvanceQuotaRow,
  type QuotaOption,
} from '@/data/mock-advance-quotas';
import type { AddQuotaType } from '@/data/mock-add-quota-options';
import type { SurveyQuestion } from '@/data/mock-survey-questions';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  usePersistedState,
  usePersistedStringSet,
} from '@/hooks/usePersistedState';
import styles from './SurveyAdvanceQuotasDashboard.module.css';

function slugForId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function buildCriteriaQuota(data: CriteriaQuotaSubmit, offset = 0): AdvanceQuota {
  const now = Date.now() + offset;
  const criterionParts: string[] = [];
  for (const criterion of data.criteria) {
    if (criterion.conditions.length === 0) continue;
    const conditionDescription = criterion.conditions
      .map((cond, idx) => {
        const head = cond.source !== 'Question'
          ? `${cond.source} ${cond.operator} "${cond.value}"`
          : (() => {
              const qLabel = cond.questionCode
                ? `[${cond.questionCode}]`
                : cond.questionText || 'Question';
              return `${qLabel} ${cond.operator} "${cond.value}"`;
            })();
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
  if (criterionParts.length === 0) {
    descriptionParts.push('Custom criteria');
  } else {
    descriptionParts.push(criterionParts.join(' | '));
  }
  const checks: string[] = [`Checked after [${data.firstCheck.questionCode}]`];
  if (data.secondCheck) {
    checks.push(`re-checked after [${data.secondCheck.questionCode}]`);
  }
  descriptionParts.push(checks.join(', '));
  return {
    id: `user-criteria-${now}`,
    name: data.name,
    quotaType: 'Criteria based',
    description: descriptionParts.join(' and '),
    quotaGroup: 'NA',
    multipleQuotaHandling: 'NA',
    target: Math.max(0, Math.round(data.target)),
    current: 0,
  };
}

function buildQuotasFromSelection(
  questions: SurveyQuestion[],
  distribution: QuotaDimensionState
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
      };
    });
    const totalTarget = options.reduce((sum, o) => sum + o.target, 0);
    quotas.push({
      id: `user-${now}-${qIdx}-${question.id}`,
      name: question.text,
      quotaType: 'Question Based',
      description: `Options in ${question.code} ${question.text}`,
      quotaGroup: 'NA',
      multipleQuotaHandling: 'NA',
      target: totalTarget,
      current: 0,
      questionCode: question.code,
      questionText: question.text,
      options,
    });
  });
  return quotas;
}

const WuTable = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTable })),
  { ssr: false }
);
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
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

function QuotaTargetCell({ quota }: { quota: AdvanceQuota | AdvanceQuotaRow }) {
  const current = quota.current ?? quota.target;
  const progress = quota.target === 0 ? 0 : Math.min(current / quota.target, 1);
  const pct = progress * 100;
  const tone: 'low' | 'mid' | 'high' =
    pct > 80 ? 'high' : pct > 50 ? 'mid' : 'low';
  const label = `${current}/${quota.target}`;

  const valueClass = `${styles.targetValue} ${
    tone === 'high'
      ? styles.targetValueHigh
      : tone === 'mid'
      ? styles.targetValueMid
      : styles.targetValueLow
  }`;

  return (
    <span
      className={styles.targetCell}
      title={`${label} (${Math.round(pct)}%)`}
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

function FilterableColumnHeader({
  label,
  value,
  options,
  onChange,
  leadingIcon,
}: {
  label: string;
  value: string[];
  options: string[];
  onChange: (value: string[]) => void;
  leadingIcon?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(value);
  const isActive = value.length > 0;
  const chipTitle = isActive ? `Filtered by ${value.join(', ')}` : '';
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

  function resetDraft() {
    setDraft([]);
  }

  function applyDraft() {
    onChange(draft);
    setOpen(false);
  }

  function clearAppliedFilter() {
    onChange([]);
    setDraft([]);
  }

  return (
    <span
      className={styles.columnHeader}
      data-filtered={isActive ? 'true' : undefined}
    >
      {leadingIcon ? <span className={leadingIcon} aria-hidden /> : null}
      {label}
      {isActive ? (
        <span className={styles.filterChip} title={chipTitle}>
          <span className={styles.filterChipCount}>{value.length}</span>
          <span
            role="button"
            tabIndex={0}
            aria-label={`Clear ${label} filter`}
            className={styles.filterChipClear}
            onClick={(event) => {
              event.stopPropagation();
              clearAppliedFilter();
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                event.stopPropagation();
                clearAppliedFilter();
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
            className={styles.filterMenuClearBtn}
            onClick={resetDraft}
            disabled={draft.length === 0}
          >
            Clear
          </button>
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
}

export function SurveyAdvanceQuotasDashboard({ surveyId }: SurveyAdvanceQuotasDashboardProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [addQuotaOpen, setAddQuotaOpen] = useState(false);
  const [questionQuotaOpen, setQuestionQuotaOpen] = useState(false);
  const [criteriaQuotaOpen, setCriteriaQuotaOpen] = useState(false);
  const [quotaTypeFilter, setQuotaTypeFilter] = usePersistedState<string[]>(
    `advance-quotas:${surveyId}:type-filter`,
    []
  );
  const [quotaGroupFilter, setQuotaGroupFilter] = usePersistedState<string[]>(
    `advance-quotas:${surveyId}:group-filter`,
    []
  );
  const [expandedQuotaIds, setExpandedQuotaIds] = usePersistedStringSet(
    `advance-quotas:${surveyId}:expanded`
  );
  const [addedQuotas, setAddedQuotas] = usePersistedState<AdvanceQuota[]>(
    `advance-quotas:${surveyId}:added`,
    []
  );

  const allQuotas = useMemo<AdvanceQuota[]>(
    () => [...addedQuotas, ...MOCK_ADVANCE_QUOTAS],
    [addedQuotas]
  );

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

  const quotaGroupOptions = useMemo(() => getAdvanceQuotaGroupOptions(), []);

  const filteredQuotas = useMemo(() => {
    return allQuotas.filter((quota) => {
      if (quotaTypeFilter.length > 0 && !quotaTypeFilter.includes(quota.quotaType)) {
        return false;
      }
      if (quotaGroupFilter.length > 0 && !quotaGroupFilter.includes(quota.quotaGroup)) {
        return false;
      }
      return true;
    });
  }, [allQuotas, quotaTypeFilter, quotaGroupFilter]);

  const tableRows = useMemo(
    () => flattenQuotasForTable(filteredQuotas, expandedQuotaIds),
    [filteredQuotas, expandedQuotaIds]
  );

  const columns: IWuTableColumnDef<AdvanceQuotaRow>[] = useMemo(
    () => [
      {
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
      },
      {
        accessorKey: 'quotaType',
        header: () => (
          <FilterableColumnHeader
            label="Quota type"
            value={quotaTypeFilter}
            options={ADVANCE_QUOTA_TYPE_OPTIONS}
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
          return (
            <span className={styles.clamp} title={row.original.quotaType}>
              {row.original.quotaType}
            </span>
          );
        },
      },
      {
        accessorKey: 'description',
        header: () => <ColumnHeader label="Description" icons={['info']} />,
        size: 320,
        cell: ({ row }) => {
          if (row.original.isOption) {
            return <span className={styles.subRowMuted} aria-hidden />;
          }
          return (
            <span className={styles.descriptionCell} title={row.original.description}>
              {row.original.description}
            </span>
          );
        },
      },
      {
        accessorKey: 'quotaGroup',
        header: () => (
          <FilterableColumnHeader
            label="Quota group"
            value={quotaGroupFilter}
            options={quotaGroupOptions}
            onChange={setQuotaGroupFilter}
            leadingIcon="wm-group"
          />
        ),
        filterable: true,
        enableSorting: false,
        size: 150,
        cell: ({ row }) => {
          if (row.original.isOption) {
            return <span className={styles.subRowMuted} aria-hidden />;
          }
          return (
            <span className={styles.clamp} title={row.original.quotaGroup}>
              {row.original.quotaGroup}
            </span>
          );
        },
      },
      {
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
      },
      {
        accessorKey: 'target',
        header: () => <ColumnHeader label="Target" icons={['settings', 'filter']} />,
        headerAlign: 'right',
        cellAlign: 'right',
        size: 130,
        cell: ({ row }) => <QuotaTargetCell quota={row.original} />,
      },
    ],
    [expandedQuotaIds, quotaGroupFilter, quotaGroupOptions, quotaTypeFilter]
  );

  if (!wick) {
    return null;
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h2 className={styles.title}>Dashboard</h2>
        <div className={styles.headerActions}>
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
              title="No quotas match your filters"
              description="Try changing the Quota Type or Quota Group filters"
            />
          }
        />
      </div>

      <AddQuotaModal
        open={addQuotaOpen}
        onOpenChange={setAddQuotaOpen}
        onSelectType={(type: AddQuotaType) => {
          if (type === 'question-based') {
            setQuestionQuotaOpen(true);
            return;
          }
          if (type === 'criteria-based') {
            setCriteriaQuotaOpen(true);
            return;
          }
          showToast({
            message: 'Advanced quota is not available in this prototype',
            variant: 'info',
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
          const newQuotas = buildQuotasFromSelection(questions, distribution);
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
        onOpenChange={setCriteriaQuotaOpen}
        surveyId={surveyId}
        onBack={() => {
          setCriteriaQuotaOpen(false);
          setAddQuotaOpen(true);
        }}
        onSave={(submissions: CriteriaQuotaSubmit[]) => {
          if (submissions.length === 0) return;
          const newQuotas = submissions.map((data, idx) =>
            buildCriteriaQuota(data, idx)
          );
          setAddedQuotas((prev) => [...newQuotas, ...prev]);
        }}
      />
    </div>
  );
}
