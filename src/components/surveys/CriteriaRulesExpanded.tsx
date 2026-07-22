'use client';

import type { AdvanceQuotaCriterionBlock, AdvanceQuotaRuleCondition } from '@/data/mock-advance-quotas';
import styles from './CriteriaRulesExpanded.module.css';

export interface CriteriaRuleDisplayRow {
  connector: 'IF' | 'And' | 'Or';
  typeLabel: string;
  questionLabel: string;
  operator: string;
  value: string;
}

function formatConditionRow(
  cond: AdvanceQuotaRuleCondition,
  questionIndex: number
): CriteriaRuleDisplayRow {
  const connector: 'IF' | 'And' | 'Or' =
    questionIndex === 1 ? 'IF' : cond.connector === 'OR' ? 'Or' : 'And';

  const typeLabel = cond.source === 'Question' ? 'Question' : cond.source;

  const questionText = (cond.questionText || cond.subject || '').trim();
  const codePrefix = cond.questionCode ? `[${cond.questionCode}] ` : '';
  const questionLabel = `${questionIndex}. ${codePrefix}${questionText}`;

  let operator = cond.operator;
  let value = cond.value;
  if (cond.operator === 'is between' && cond.valueEnd) {
    operator = 'is between';
    value = `${cond.value} and ${cond.valueEnd}`;
  }

  return {
    connector,
    typeLabel,
    questionLabel,
    operator,
    value,
  };
}

export function buildCriteriaRuleRows(
  blocks: AdvanceQuotaCriterionBlock[]
): CriteriaRuleDisplayRow[] {
  const rows: CriteriaRuleDisplayRow[] = [];
  let questionIndex = 0;

  for (const block of blocks) {
    for (const cond of block.conditions) {
      questionIndex += 1;
      rows.push(formatConditionRow(cond, questionIndex));
    }
  }

  return rows;
}

interface CriteriaRulesExpandedProps {
  blocks: AdvanceQuotaCriterionBlock[];
  checksSuffix?: string;
  showHeader?: boolean;
  variant?: 'panel' | 'inline';
  orHint?: string;
}

export function CriteriaRulesExpanded({
  blocks,
  checksSuffix,
  showHeader = false,
  variant = 'panel',
  orHint = 'Quota matches when any criteria below is met.',
}: CriteriaRulesExpandedProps) {
  const rows = buildCriteriaRuleRows(blocks);
  const hasMultipleBlocks = blocks.filter((block) => block.conditions.length > 0).length > 1;

  if (rows.length === 0) {
    return (
      <div className={styles.emptyRules}>
        <span className={styles.emptyRulesText}>No criteria conditions defined.</span>
      </div>
    );
  }

  const panelClass =
    variant === 'inline' ? styles.rulesPanelInline : styles.rulesPanel;

  if (hasMultipleBlocks) {
    const visibleBlocks = blocks.filter((block) => block.conditions.length > 0);
    let questionIndex = 0;

    return (
      <div className={panelClass}>
        <p className={styles.blockOrHint}>{orHint}</p>
        {visibleBlocks.map((block, blockIdx) => {
          const blockRows = block.conditions.map((cond) => {
            questionIndex += 1;
            return formatConditionRow(cond, questionIndex);
          });

          return (
            <div key={`${block.name}-${blockIdx}`} className={styles.criteriaBlockGroup}>
              {blockIdx > 0 ? (
                <div className={styles.blockOrDivider} aria-hidden>
                  OR
                </div>
              ) : null}
              {block.name ? (
                <div className={styles.blockName} role="heading" aria-level={4}>
                  {block.name}
                </div>
              ) : null}
              <div className={styles.rulesTable} role="table" aria-label={`${block.name} rules`}>
                {showHeader && blockIdx === 0 ? (
                  <div className={styles.rulesHeader} role="row">
                    <span className={styles.colConnector} aria-hidden />
                    <span className={styles.colType}>Type</span>
                    <span className={styles.colQuestion}>Question</span>
                    <span className={styles.colOperator}> </span>
                    <span className={styles.colValue}> </span>
                  </div>
                ) : null}
                {blockRows.map((row, idx) => (
                  <div key={idx} className={styles.rulesRow} role="row">
                    <span
                      className={`${styles.colConnector} ${
                        row.connector === 'IF'
                          ? styles.connectorIf
                          : row.connector === 'Or'
                            ? styles.connectorOr
                            : styles.connectorAnd
                      }`}
                    >
                      {row.connector}
                    </span>
                    <span className={styles.colType}>{row.typeLabel}</span>
                    <span className={styles.colQuestion}>{row.questionLabel}</span>
                    <span className={styles.colOperator}>{row.operator}</span>
                    <span className={styles.colValue}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {checksSuffix ? (
          <p className={styles.checksSuffix}>{checksSuffix}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={panelClass}>
      <div className={styles.rulesTable} role="table" aria-label="Criteria rules">
        {showHeader ? (
          <div className={styles.rulesHeader} role="row">
            <span className={styles.colConnector} aria-hidden />
            <span className={styles.colType}>Type</span>
            <span className={styles.colQuestion}>Question</span>
            <span className={styles.colOperator}> </span>
            <span className={styles.colValue}> </span>
          </div>
        ) : null}
        {rows.map((row, idx) => (
          <div key={idx} className={styles.rulesRow} role="row">
            <span
              className={`${styles.colConnector} ${
                row.connector === 'IF'
                  ? styles.connectorIf
                  : row.connector === 'Or'
                    ? styles.connectorOr
                    : styles.connectorAnd
              }`}
            >
              {row.connector}
            </span>
            <span className={styles.colType}>{row.typeLabel}</span>
            <span className={styles.colQuestion}>{row.questionLabel}</span>
            <span className={styles.colOperator}>{row.operator}</span>
            <span className={styles.colValue}>{row.value}</span>
          </div>
        ))}
      </div>
      {checksSuffix ? (
        <p className={styles.checksSuffix}>{checksSuffix}</p>
      ) : null}
    </div>
  );
}

function formatRowAsPhrase(row: CriteriaRuleDisplayRow): string {
  return `${row.connector} ${row.typeLabel} ${row.questionLabel} ${row.operator} ${row.value}`;
}

export function getCriteriaPreviewLine(
  blocks: AdvanceQuotaCriterionBlock[]
): string {
  const visibleBlocks = blocks.filter((block) => block.conditions.length > 0);
  if (visibleBlocks.length === 0) return '';

  if (visibleBlocks.length > 1) {
    const blockSummaries = visibleBlocks.map((block) => {
      const rows = buildCriteriaRuleRows([block]);
      return rows.length > 0 ? formatRowAsPhrase(rows[0]) : block.name;
    });
    return blockSummaries.join(' OR ');
  }

  const rows = buildCriteriaRuleRows(blocks);
  if (rows.length === 0) return '';

  const first = rows[0];
  const restCount = rows.length - 1;
  if (restCount <= 0) {
    return formatRowAsPhrase(first);
  }
  return `${formatRowAsPhrase(first)} (+${restCount} more)`;
}

/** One-line summary for collapsed description (first rule only). */
export function getCriteriaCollapsedLine(
  blocks: AdvanceQuotaCriterionBlock[]
): string {
  const rows = buildCriteriaRuleRows(blocks);
  if (rows.length === 0) return '';
  return formatRowAsPhrase(rows[0]);
}