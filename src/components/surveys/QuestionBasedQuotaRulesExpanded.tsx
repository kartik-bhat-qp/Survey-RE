'use client';

import { useMemo } from 'react';
import { getQuestionsBySurvey } from '@/data/mock-survey-questions';
import type { AdvanceQuota } from '@/data/mock-advance-quotas';
import {
  getAdvanceQuotaOverLimitActionLabel,
  isMinQuestionQuotaScope,
} from '@/data/mock-advance-quotas';
import styles from './QuestionBasedQuotaRulesExpanded.module.css';

export interface QuestionBasedQuotaRuleRow {
  question: string;
  operator: string;
  option: string;
  target: string;
  action: string;
}

export function buildQuestionBasedQuotaRuleRows(
  quota: AdvanceQuota,
  surveyId?: number
): QuestionBasedQuotaRuleRow[] {
  if (!quota.options?.length) return [];

  const minScope = isMinQuestionQuotaScope(quota.questionQuotaScope);
  const questionRef =
    quota.questionCode && quota.questionText
      ? `[${quota.questionCode}] ${quota.questionText}`
      : quota.questionText || quota.name;
  const currentQuestionId =
    surveyId != null && quota.questionCode
      ? getQuestionsBySurvey(surveyId).find((question) => question.code === quota.questionCode)
          ?.id
      : undefined;

  return quota.options.map((option, index) => ({
    question: `${index + 1}. ${questionRef}`,
    operator: minScope ? 'minimum' : 'is selected',
    option: option.label,
    target: String(option.target),
    action: getAdvanceQuotaOverLimitActionLabel(
      surveyId,
      currentQuestionId,
      option.overLimitAction
    ),
  }));
}

interface QuestionBasedQuotaRulesExpandedProps {
  quota: AdvanceQuota;
  surveyId?: number;
  variant?: 'panel' | 'inline';
}

export function QuestionBasedQuotaRulesExpanded({
  quota,
  surveyId,
  variant = 'panel',
}: QuestionBasedQuotaRulesExpandedProps) {
  const rows = useMemo(
    () => buildQuestionBasedQuotaRuleRows(quota, surveyId),
    [quota, surveyId]
  );

  if (rows.length === 0) {
    return (
      <div className={styles.emptyRules}>
        <span className={styles.emptyRulesText}>No quota rules defined.</span>
      </div>
    );
  }

  const panelClass = variant === 'inline' ? styles.rulesPanelInline : styles.rulesPanel;

  return (
    <div className={panelClass}>
      <div className={styles.rulesTable} role="table" aria-label="Question based quota rules">
        <div className={styles.rulesHeader} role="row">
          <span className={styles.colQuestion}>Question</span>
          <span className={styles.colOperator}>Operator</span>
          <span className={styles.colOptions}>Options</span>
          <span className={styles.colTarget}>Target</span>
          <span className={styles.colAction}>ACTION</span>
        </div>
        {rows.map((row, index) => (
          <div key={`${row.option}-${index}`} className={styles.rulesRow} role="row">
            <span className={styles.colQuestion}>{row.question}</span>
            <span className={styles.colOperator}>{row.operator}</span>
            <span className={styles.colOptions}>{row.option}</span>
            <span className={styles.colTarget}>{row.target}</span>
            <span className={styles.colAction}>{row.action}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
