'use client';

import { useMemo } from 'react';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { CriteriaRulesExpanded } from '@/components/surveys/CriteriaRulesExpanded';
import type {
  AdvanceQuota,
  AdvanceQuotaCheckPoint,
  AdvanceQuotaCriterionBlock,
} from '@/data/mock-advance-quotas';
import {
  formatQuestionQuotaScope,
  getQuestionOptionMinSum,
  getQuotaDisplayRules,
  isMinQuestionQuotaScope,
  resolveQuotaCheckPointsForDisplay,
} from '@/data/mock-advance-quotas';
import styles from './QuotaCriteriaViewModal.module.css';

export interface QuotaCriteriaViewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quota: AdvanceQuota | null;
  /** Group-level checks for Advanced quotas (overrides quota.quotaChecks when set). */
  groupCheckCodes?: ReadonlyArray<{ questionCode: string; questionText?: string }>;
}

function buildChecksSuffix(checks: ReadonlyArray<{ questionCode: string }>): string {
  if (checks.length === 0) return '';
  const first = checks[0]?.questionCode;
  const second = checks[1]?.questionCode;
  if (!first) return '';
  return second
    ? `Checked after [${first}], re-checked after [${second}]`
    : `Checked after [${first}]`;
}

function getCheckRoleLabel(index: number): string {
  return index === 0 ? 'Checked after' : 'Re-checked after';
}

function getModalCriterionBlocks(quota: AdvanceQuota): AdvanceQuotaCriterionBlock[] {
  const { blocks } = getQuotaDisplayRules(quota);
  const withoutSummary = blocks
    .map((block) => ({
      ...block,
      conditions: block.conditions.filter((cond) => cond.source !== 'Summary'),
    }))
    .filter((block) => block.conditions.length > 0);
  return withoutSummary.length > 0 ? withoutSummary : blocks;
}

export function QuotaCriteriaViewModal({
  open,
  onOpenChange,
  quota,
  groupCheckCodes = [],
}: QuotaCriteriaViewModalProps) {
  const wick = useWickUILib();

  const blocks = useMemo(
    () => (quota ? getModalCriterionBlocks(quota) : []),
    [quota]
  );

  const quotaChecks = useMemo((): AdvanceQuotaCheckPoint[] => {
    if (!quota) return [];
    return resolveQuotaCheckPointsForDisplay(quota, groupCheckCodes);
  }, [groupCheckCodes, quota]);

  const checksSuffix = useMemo(
    () => buildChecksSuffix(quotaChecks),
    [quotaChecks]
  );

  if (!wick || !open || !quota) {
    return null;
  }

  const { WuModal, WuModalContent, WuModalHeader, WuModalFooter, WuModalClose } = wick;

  return (
    <WuModal
      open
      onOpenChange={onOpenChange}
      className={styles.modal}
      variant="action"
    >
      <WuModalHeader className={styles.header}>Criteria</WuModalHeader>
      <WuModalContent className={styles.content}>
        <dl className={styles.metaList}>
          <div className={styles.metaRow}>
            <dt className={styles.metaLabel}>Quota</dt>
            <dd className={styles.metaValue}>{quota.name}</dd>
          </div>
          <div className={styles.metaRow}>
            <dt className={styles.metaLabel}>Type</dt>
            <dd className={styles.metaValue}>
              <span className={styles.typeBadge}>{quota.quotaType}</span>
            </dd>
          </div>
          {quota.quotaType === 'Question Based' ? (
            <div className={styles.metaRow}>
              <dt className={styles.metaLabel}>Quota mode</dt>
              <dd className={styles.metaValue}>{formatQuestionQuotaScope(quota.questionQuotaScope)}</dd>
            </div>
          ) : null}
          {quota.quotaType === 'Question Based' &&
          isMinQuestionQuotaScope(quota.questionQuotaScope) ? (
            <>
              <div className={styles.metaRow}>
                <dt className={styles.metaLabel}>Total target (count)</dt>
                <dd className={styles.metaValue}>{quota.target}</dd>
              </div>
              <div className={styles.metaRow}>
                <dt className={styles.metaLabel}>Sum of minimums</dt>
                <dd className={styles.metaValue}>{getQuestionOptionMinSum(quota)}</dd>
              </div>
            </>
          ) : null}
          {quota.quotaGroup !== 'NA' ? (
            <div className={styles.metaRow}>
              <dt className={styles.metaLabel}>Quota group</dt>
              <dd className={styles.metaValue}>{quota.quotaGroup}</dd>
            </div>
          ) : null}
          {quotaChecks.length > 0 ? (
            <div className={styles.metaRow}>
              <dt className={styles.metaLabel}>Quota checks</dt>
              <dd className={styles.metaValue}>
                <ul className={styles.quotaChecksList}>
                  {quotaChecks.map((check, index) => (
                    <li key={`${check.questionCode}-${index}`}>
                      <span className={styles.checkCode}>[{check.questionCode}]</span>
                      {check.questionText ? (
                        <>
                          {' '}
                          {check.questionText}
                        </>
                      ) : null}
                      <span className={styles.checkRole}>{getCheckRoleLabel(index)}</span>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          ) : null}
        </dl>

        <div className={styles.rulesSection}>
          <h3 className={styles.rulesHeading}>Rules</h3>
          <CriteriaRulesExpanded
            blocks={blocks}
            checksSuffix={
              quotaChecks.length > 0
                ? undefined
                : checksSuffix || undefined
            }
            variant="panel"
          />
        </div>
      </WuModalContent>
      <WuModalFooter>
        <WuModalClose variant="secondary">Close</WuModalClose>
      </WuModalFooter>
    </WuModal>
  );
}

interface DescriptionCriteriaCellProps {
  summary: string;
  canView: boolean;
  onView: () => void;
}

export function DescriptionCriteriaCell({
  summary,
  canView,
  onView,
}: DescriptionCriteriaCellProps) {
  return (
    <span className={styles.cell}>
      <span className={styles.cellLabel} title={summary}>
        {summary}
      </span>
      {canView ? (
        <button
          type="button"
          className={styles.viewBtn}
          aria-label="View criteria"
          onClick={(event) => {
            event.stopPropagation();
            onView();
          }}
        >
          <span className="wm-visibility" aria-hidden />
        </button>
      ) : null}
    </span>
  );
}
