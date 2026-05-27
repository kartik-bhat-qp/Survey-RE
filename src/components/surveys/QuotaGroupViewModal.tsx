'use client';

import { useEffect, useMemo, useState } from 'react';
import { useWickUILib } from '@/components/ui/useWickUILib';
import type { AdvanceQuota } from '@/data/mock-advance-quotas';
import {
  formatAdvanceQuotaCondition,
  getQuotaDisplayRules,
} from '@/data/mock-advance-quotas';
import {
  applyQuotaGroupCheckOverrides,
  getQuotaGroupCheckPoints,
  mergeQuotaGroups,
  type QuotaGroup,
  type QuotaGroupCheckOverrides,
} from '@/data/mock-quota-groups';
import styles from './QuotaGroupViewModal.module.css';

export interface QuotaGroupViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupName: string | null;
  allQuotas: ReadonlyArray<AdvanceQuota>;
  customGroups: QuotaGroup[];
  groupCheckOverrides?: QuotaGroupCheckOverrides;
}

function CriteriaQuotaCard({
  quota,
  groupChecks,
}: {
  quota: AdvanceQuota;
  groupChecks: ReturnType<typeof getQuotaGroupCheckPoints>;
}) {
  const [expanded, setExpanded] = useState(false);
  const { blocks } = useMemo(() => getQuotaDisplayRules(quota), [quota]);
  const checks = groupChecks;
  const ruleCount = blocks.reduce((sum, block) => sum + block.conditions.length, 0);

  return (
    <li className={styles.criteriaItem}>
      <button
        type="button"
        className={styles.criteriaToggle}
        aria-expanded={expanded}
        onClick={() => setExpanded((prev) => !prev)}
      >
        <span
          className={`${styles.expandIcon} wm-chevron-right ${expanded ? styles.expandIconOpen : ''}`}
          aria-hidden
        />
        <span className={styles.criteriaToggleText}>
          <span className={styles.criteriaName}>{quota.name}</span>
          <span className={styles.criteriaMeta}>
            {ruleCount} rule{ruleCount === 1 ? '' : 's'}
            {checks.length > 0
              ? ` · ${checks.length} quota check${checks.length === 1 ? '' : 's'}`
              : ''}
          </span>
        </span>
        <span className={styles.criteriaTypeBadge}>{quota.quotaType}</span>
      </button>

      {expanded ? (
        <div className={styles.rulesPanel}>
          {blocks.map((block) => (
            <div key={`${quota.id}-${block.name}`} className={styles.ruleBlock}>
              {blocks.length > 1 ? (
                <p className={styles.ruleBlockTitle}>{block.name}</p>
              ) : null}
              <ol className={styles.ruleList}>
                {block.conditions.map((cond, index) => (
                  <li key={`${block.name}-${index}`} className={styles.ruleLine}>
                    <span className={styles.ruleSource}>{cond.source}</span>
                    <span className={styles.ruleText}>
                      {formatAdvanceQuotaCondition(cond, index === 0)}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ))}

          {checks.length > 0 ? (
            <div className={styles.checksBlock}>
              <p className={styles.checksTitle}>Quota checks</p>
              <ul className={styles.checksList}>
                {checks.map((check) => (
                  <li key={`${check.questionCode}-${check.questionText}`}>
                    <span className={styles.checkCode}>[{check.questionCode}]</span>{' '}
                    {check.questionText}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

export function QuotaGroupViewModal({
  open,
  onOpenChange,
  groupName,
  allQuotas,
  customGroups,
  groupCheckOverrides = {},
}: QuotaGroupViewModalProps) {
  const wick = useWickUILib();
  const [expandedResetKey, setExpandedResetKey] = useState(0);

  const groupMeta = useMemo(() => {
    if (!groupName) return null;
    const groups = applyQuotaGroupCheckOverrides(
      mergeQuotaGroups(customGroups),
      groupCheckOverrides
    );
    return (
      groups.find(
        (group) => group.name.toLowerCase() === groupName.toLowerCase()
      ) ?? null
    );
  }, [customGroups, groupCheckOverrides, groupName]);

  const criteriaInGroup = useMemo(() => {
    if (!groupName) return [];
    return allQuotas.filter((quota) => quota.quotaGroup === groupName);
  }, [allQuotas, groupName]);

  useEffect(() => {
    if (!open) {
      setExpandedResetKey((key) => key + 1);
    }
  }, [open, groupName]);

  if (!open || !wick || !groupMeta) {
    return null;
  }

  const groupChecks = getQuotaGroupCheckPoints(groupMeta);
  const { WuModal, WuModalContent, WuModalHeader, WuModalFooter, WuModalClose } = wick;

  return (
    <WuModal
      open
      onOpenChange={onOpenChange}
      className={styles.modal}
      variant="action"
      size="lg"
    >
      <WuModalHeader className={styles.header}>Quota group</WuModalHeader>
      <WuModalContent className={styles.content}>
        <dl className={styles.metaList}>
          <div className={styles.metaRow}>
            <dt className={styles.metaLabel}>Quota group</dt>
            <dd className={styles.metaValue}>{groupMeta.name}</dd>
          </div>
          <div className={styles.metaRow}>
            <dt className={styles.metaLabel}>Type</dt>
            <dd className={styles.metaValue}>
              <span className={styles.typeBadge}>{groupMeta.handlingType}</span>
            </dd>
          </div>
          {groupChecks.length > 0 ? (
            <div className={styles.metaRow}>
              <dt className={styles.metaLabel}>Quota checks</dt>
              <dd className={styles.metaValue}>
                <ul className={styles.groupChecksList}>
                  {groupChecks.map((check, index) => (
                    <li key={`${check.questionCode}-${index}`}>
                      <span className={styles.checkCode}>[{check.questionCode}]</span>{' '}
                      {check.questionText}
                      {index === 0 ? (
                        <span className={styles.checkRole}>First quota check</span>
                      ) : (
                        <span className={styles.checkRole}>Second quota check</span>
                      )}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          ) : null}
        </dl>

        <div className={styles.criteriaSection}>
          <h3 className={styles.criteriaHeading}>
            Criteria
            <span className={styles.criteriaCount}>({criteriaInGroup.length})</span>
          </h3>
          {criteriaInGroup.length === 0 ? (
            <p className={styles.criteriaEmpty}>No criteria in this group yet.</p>
          ) : (
            <ul key={expandedResetKey} className={styles.criteriaList}>
              {criteriaInGroup.map((quota) => (
                <CriteriaQuotaCard
                  key={quota.id}
                  quota={quota}
                  groupChecks={groupChecks}
                />
              ))}
            </ul>
          )}
        </div>
      </WuModalContent>
      <WuModalFooter>
        <WuModalClose variant="secondary">Close</WuModalClose>
      </WuModalFooter>
    </WuModal>
  );
}

interface QuotaGroupCellProps {
  groupName: string;
  onView: (groupName: string) => void;
}

export function QuotaGroupCell({ groupName, onView }: QuotaGroupCellProps) {
  const canView = groupName.trim() !== '' && groupName !== 'NA';

  return (
    <span className={styles.cell}>
      <span className={styles.cellLabel} title={groupName}>
        {groupName}
      </span>
      {canView ? (
        <button
          type="button"
          className={styles.viewBtn}
          aria-label={`View quota group ${groupName}`}
          onClick={(event) => {
            event.stopPropagation();
            onView(groupName);
          }}
        >
          <span className="wm-visibility" aria-hidden />
        </button>
      ) : null}
    </span>
  );
}
