'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  QuotaStepBreadcrumb,
  type QuotaStep,
} from '@/components/surveys/QuotaStepBreadcrumb';
import {
  getExistingCriteriaById,
  MOCK_EXISTING_CRITERIA,
  type ExistingCriteriaTemplate,
} from '@/data/mock-existing-criteria';
import {
  getQuestionsBySurvey,
  type SurveyQuestion,
} from '@/data/mock-survey-questions';
import type { QuotaGroupSelection } from '@/data/mock-quota-groups';
import styles from './CriteriaBasedQuotaModal.module.css';

const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenu })),
  { ssr: false }
);
const WuMenuItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuItem })),
  { ssr: false }
);
const WuMenuCheckboxItem = dynamic(
  () =>
    import('@npm-questionpro/wick-ui-lib').then((m) => ({
      default: m.WuMenuCheckboxItem,
    })),
  { ssr: false }
);
const WuMenuSeparatorItem = dynamic(
  () =>
    import('@npm-questionpro/wick-ui-lib').then((m) => ({
      default: m.WuMenuSeparatorItem,
    })),
  { ssr: false }
);

const QUESTION_OPERATORS = ['is', 'is not', 'contains', 'does not contain'] as const;

const SYSTEM_VARIABLE_TEXT_OPERATORS = [
  'equals',
  'contains',
  'does not contain',
  'starts with',
  'ends with',
  'is blank',
  'is not blank',
] as const;

const SYSTEM_VARIABLE_NUMERIC_OPERATORS = [
  'Is equal to',
  'is greater than or equal to',
  'is less than or equal to',
  'is greater than',
  'is less than',
  'is not equal to',
  'is between',
] as const;

const DEFAULT_SYSTEM_VARIABLE_OPERATOR = SYSTEM_VARIABLE_TEXT_OPERATORS[0];

function isSystemVariableOperator(op: string): boolean {
  return (
    (SYSTEM_VARIABLE_TEXT_OPERATORS as readonly string[]).includes(op) ||
    (SYSTEM_VARIABLE_NUMERIC_OPERATORS as readonly string[]).includes(op)
  );
}

function systemVariableOperatorNeedsValue(operator: string): boolean {
  return operator !== 'is blank' && operator !== 'is not blank';
}

function isBetweenOperator(operator: string): boolean {
  return operator === 'is between';
}

function isSystemVariableNumericOperator(operator: string): boolean {
  return (SYSTEM_VARIABLE_NUMERIC_OPERATORS as readonly string[]).includes(operator);
}

function systemVariableValueInputClass(operator: string): string {
  const base = styles.conditionValueInput;
  if (isBetweenOperator(operator) || isSystemVariableNumericOperator(operator)) {
    return `${base} ${styles.conditionValueInputNumeric}`;
  }
  return base;
}

const CONDITION_SOURCES = [
  'Question',
  'System Variable',
  'Geo Location',
  'Email List Code',
  'Device Type',
] as const;
type ConditionSource = (typeof CONDITION_SOURCES)[number];

const CONNECTORS = ['AND', 'OR'] as const;
type ConditionConnector = (typeof CONNECTORS)[number];

const CRITERIA_MODES = ['new', 'existing'] as const;
type CriteriaMode = (typeof CRITERIA_MODES)[number];

const SYSTEM_VARIABLES: string[] = Array.from(
  { length: 255 },
  (_, i) => `Custom ${i + 1}`
);

interface CriterionCondition {
  id: string;
  source: ConditionSource;
  questionId: number | null;
  /** Selected name when source is `System Variable`. */
  systemVariable: string | null;
  operator: string;
  value: string;
  /** Upper bound when operator is `is between` (system variable). */
  valueEnd: string;
  connector: ConditionConnector;
}

interface Criterion {
  id: string;
  name: string;
  mode: CriteriaMode;
  existingCriteriaId: string | null;
  /** Serialized conditions when loaded from an existing template; used to detect edits. */
  existingConditionsSnapshot: string | null;
  /** After editing a loaded existing criteria, user must provide a new name. */
  requiresRename: boolean;
  conditions: CriterionCondition[];
}

interface QuotaBlock {
  id: string;
  name: string;
  target: number;
  criteria: Criterion[];
  collapsedCriterionIds: Set<string>;
  firstCheckId: number | null;
  secondCheckId: number | null;
  collapsed: boolean;
}

export interface CriteriaQuotaCheck {
  questionId: number;
  questionCode: string;
  questionText: string;
}

export interface CriteriaQuotaCondition {
  source: ConditionSource;
  questionCode: string;
  questionText: string;
  /** Display label for the condition subject (question text or system variable name). */
  subject: string;
  operator: string;
  value: string;
  valueEnd?: string;
  /** Logical connector to the previous condition. Ignored for the first condition. */
  connector: ConditionConnector;
}

export interface CriteriaQuotaCriterion {
  name: string;
  conditions: CriteriaQuotaCondition[];
}

export interface CriteriaQuotaSubmit {
  name: string;
  target: number;
  criteria: CriteriaQuotaCriterion[];
  firstCheck: CriteriaQuotaCheck;
  secondCheck?: CriteriaQuotaCheck;
}

export type CriteriaQuotaFlow = 'standalone' | 'advanced-group';

interface CriteriaBasedQuotaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyId: number;
  flow?: CriteriaQuotaFlow;
  quotaGroupSelection?: QuotaGroupSelection | null;
  onBack?: () => void;
  onBackToQuotaGroup?: () => void;
  onSave?: (quotas: CriteriaQuotaSubmit[]) => void;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return value.toLocaleString('en-US');
}

function parseFormattedNumber(raw: string): number {
  const cleaned = raw.replace(/,/g, '').trim();
  if (cleaned === '') return 0;
  const parsed = parseInt(cleaned, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function uniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const VALUE_SEPARATOR = ', ';

function parseSelectedValues(raw: string): string[] {
  return raw
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

function toggleValueSelection(raw: string, option: string): string {
  const selected = parseSelectedValues(raw);
  const without = selected.filter((v) => v !== option);
  if (without.length === selected.length) {
    return [...selected, option].join(VALUE_SEPARATOR);
  }
  return without.join(VALUE_SEPARATOR);
}

function newCondition(): CriterionCondition {
  return {
    id: uniqueId('cond'),
    source: 'Question',
    questionId: null,
    systemVariable: null,
    operator: 'is',
    value: '',
    valueEnd: '',
    connector: 'AND',
  };
}

function resolveOperatorForSource(source: ConditionSource, current: string): string {
  if (source === 'System Variable') {
    return isSystemVariableOperator(current) ? current : DEFAULT_SYSTEM_VARIABLE_OPERATOR;
  }
  if (source === 'Question') {
    return (QUESTION_OPERATORS as readonly string[]).includes(current) ? current : 'is';
  }
  return current;
}

interface SystemVariableOperatorMenuProps {
  operator: string;
  triggerClassName: string;
  caretClassName: string;
  labelClassName: string;
  onSelect: (operator: string) => void;
}

function SystemVariableOperatorMenu({
  operator,
  triggerClassName,
  caretClassName,
  labelClassName,
  onSelect,
}: SystemVariableOperatorMenuProps) {
  const displayOperator = isSystemVariableOperator(operator)
    ? operator
    : DEFAULT_SYSTEM_VARIABLE_OPERATOR;

  return (
    <WuMenu
      Trigger={
        <button type="button" className={triggerClassName}>
          <span className={labelClassName}>{displayOperator}</span>
          <span className={caretClassName} aria-hidden />
        </button>
      }
      align="start"
    >
      <div className={styles.operatorMenuHeader} role="presentation">
        Text
      </div>
      {SYSTEM_VARIABLE_TEXT_OPERATORS.map((op) => (
        <WuMenuItem key={op} onSelect={() => onSelect(op)}>
          {op}
        </WuMenuItem>
      ))}
      <WuMenuSeparatorItem />
      <div className={styles.operatorMenuHeader} role="presentation">
        Numeric
      </div>
      {SYSTEM_VARIABLE_NUMERIC_OPERATORS.map((op) => (
        <WuMenuItem key={op} onSelect={() => onSelect(op)}>
          {op}
        </WuMenuItem>
      ))}
    </WuMenu>
  );
}

interface ValueMultiSelectProps {
  options: string[];
  value: string;
  onChange: (next: string) => void;
  triggerClassName: string;
  caretClassName: string;
  labelClassName: string;
}

function ValueMultiSelect({
  options,
  value,
  onChange,
  triggerClassName,
  caretClassName,
  labelClassName,
}: ValueMultiSelectProps) {
  const [search, setSearch] = useState('');
  const selectedValues = parseSelectedValues(value);
  const filtered = options.filter((opt) =>
    opt.toLowerCase().includes(search.trim().toLowerCase())
  );
  const allFilteredSelected =
    filtered.length > 0 && filtered.every((opt) => selectedValues.includes(opt));
  const triggerLabel =
    selectedValues.length === 0
      ? '- Select -'
      : selectedValues.length === 1
        ? selectedValues[0]
        : `${selectedValues.length} selected`;

  function handleSelectAllToggle(): void {
    if (allFilteredSelected) {
      const remaining = selectedValues.filter((v) => !filtered.includes(v));
      onChange(remaining.join(VALUE_SEPARATOR));
    } else {
      const merged = Array.from(new Set([...selectedValues, ...filtered]));
      onChange(merged.join(VALUE_SEPARATOR));
    }
  }

  return (
    <WuMenu
      Trigger={
        <button
          type="button"
          className={triggerClassName}
          title={selectedValues.length > 0 ? selectedValues.join(', ') : undefined}
        >
          <span className={labelClassName}>{triggerLabel}</span>
          <span className={caretClassName} aria-hidden />
        </button>
      }
      align="start"
    >
      <div
        className={styles.valueSearchRow}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
      >
        <input
          type="text"
          placeholder="Search options"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => event.stopPropagation()}
          className={styles.valueSearchInput}
          aria-label="Search options"
        />
      </div>
      {options.length > 0 ? (
        <WuMenuCheckboxItem
          checked={allFilteredSelected}
          onSelect={handleSelectAllToggle}
          preventCloseOnSelect
        >
          <span className={styles.selectAllLabel}>
            {search.trim() ? 'Select all matching' : 'Select all'}
          </span>
        </WuMenuCheckboxItem>
      ) : null}
      {filtered.length === 0 ? (
        <div className={styles.valueEmpty}>No options match the search</div>
      ) : (
        filtered.map((opt) => (
          <WuMenuCheckboxItem
            key={opt}
            checked={selectedValues.includes(opt)}
            onSelect={() => onChange(toggleValueSelection(value, opt))}
            preventCloseOnSelect
          >
            {opt}
          </WuMenuCheckboxItem>
        ))
      )}
    </WuMenu>
  );
}

function newCriterion(): Criterion {
  return {
    id: uniqueId('crit'),
    name: '',
    mode: 'new',
    existingCriteriaId: null,
    existingConditionsSnapshot: null,
    requiresRename: false,
    conditions: [newCondition()],
  };
}

function serializeConditions(conditions: CriterionCondition[]): string {
  return JSON.stringify(
    conditions.map((cond) => ({
      source: cond.source,
      questionId: cond.questionId,
      systemVariable: cond.systemVariable,
      operator: cond.operator,
      value: cond.value,
      valueEnd: cond.valueEnd,
      connector: cond.connector,
    }))
  );
}

function templateToCriterionConditions(
  template: ExistingCriteriaTemplate,
  questions: SurveyQuestion[]
): CriterionCondition[] {
  return template.conditions.map((cond) => {
    const question =
      cond.source === 'Question' && cond.questionCode
        ? questions.find((q) => q.code === cond.questionCode)
        : undefined;
    return {
      id: uniqueId('cond'),
      source: cond.source as ConditionSource,
      questionId: question?.id ?? null,
      systemVariable:
        cond.source === 'System Variable' ? cond.subject : null,
      operator: cond.operator,
      value: cond.value,
      valueEnd: cond.valueEnd ?? '',
      connector: cond.connector,
    };
  });
}

function promoteExistingToNewIfModified(prev: Criterion, next: Criterion): Criterion {
  if (prev.mode !== 'existing' || prev.existingConditionsSnapshot === null) {
    return next;
  }
  if (serializeConditions(next.conditions) === prev.existingConditionsSnapshot) {
    return next;
  }
  return {
    ...next,
    mode: 'new',
    existingCriteriaId: null,
    existingConditionsSnapshot: null,
    name: '',
    requiresRename: true,
  };
}

function newQuotaBlock(checks?: {
  firstCheckId?: number | null;
  secondCheckId?: number | null;
}): QuotaBlock {
  return {
    id: uniqueId('quota'),
    name: '',
    target: 100,
    criteria: [newCriterion()],
    collapsedCriterionIds: new Set(),
    firstCheckId: checks?.firstCheckId ?? null,
    secondCheckId: checks?.secondCheckId ?? null,
    collapsed: false,
  };
}

function quotaBlockFromGroupSelection(
  selection: QuotaGroupSelection | null | undefined
): QuotaBlock {
  if (!selection?.firstCheck) {
    return newQuotaBlock();
  }
  return newQuotaBlock({
    firstCheckId: selection.firstCheck.questionId,
    secondCheckId: selection.secondCheck?.questionId ?? null,
  });
}

function groupCheckToQuotaCheck(
  check: QuotaGroupSelection['firstCheck'],
  questions: SurveyQuestion[]
): CriteriaQuotaCheck | null {
  if (!check) return null;
  const question =
    questions.find((q) => q.id === check.questionId) ??
    questions.find((q) => q.code === check.questionCode);
  if (question) {
    return {
      questionId: question.id,
      questionCode: question.code,
      questionText: question.text,
    };
  }
  return {
    questionId: check.questionId,
    questionCode: check.questionCode,
    questionText: check.questionText,
  };
}

function validateBlock(
  block: QuotaBlock,
  questions: SurveyQuestion[],
  groupSelection?: QuotaGroupSelection | null
): CriteriaQuotaSubmit | null {
  const trimmedName = block.name.trim();
  if (trimmedName.length === 0) return null;
  if (block.target <= 0) return null;

  const groupFirstCheck = groupSelection?.firstCheck
    ? groupCheckToQuotaCheck(groupSelection.firstCheck, questions)
    : null;
  const groupSecondCheck = groupSelection?.secondCheck
    ? groupCheckToQuotaCheck(groupSelection.secondCheck, questions)
    : undefined;

  let firstCheck: CriteriaQuotaCheck | null = groupFirstCheck;
  let secondCheck: CriteriaQuotaCheck | undefined = groupSecondCheck ?? undefined;

  if (!firstCheck) {
    if (block.firstCheckId === null) return null;
    const firstCheckQuestion = questions.find((q) => q.id === block.firstCheckId);
    if (!firstCheckQuestion) return null;
    firstCheck = {
      questionId: firstCheckQuestion.id,
      questionCode: firstCheckQuestion.code,
      questionText: firstCheckQuestion.text,
    };
    const secondCheckQuestion =
      block.secondCheckId !== null
        ? questions.find((q) => q.id === block.secondCheckId)
        : undefined;
    secondCheck = secondCheckQuestion
      ? {
          questionId: secondCheckQuestion.id,
          questionCode: secondCheckQuestion.code,
          questionText: secondCheckQuestion.text,
        }
      : undefined;
  }
  const criteria: CriteriaQuotaCriterion[] = block.criteria
    .map((crit) => {
      const conditions: CriteriaQuotaCondition[] = crit.conditions
        .filter((cond) => {
          if (cond.source === 'Question') {
            return cond.questionId !== null && cond.value.trim() !== '';
          }
          if (cond.source === 'System Variable') {
            if (cond.systemVariable === null) return false;
            if (!systemVariableOperatorNeedsValue(cond.operator)) return true;
            if (isBetweenOperator(cond.operator)) {
              return cond.value.trim() !== '' && cond.valueEnd.trim() !== '';
            }
            return cond.value.trim() !== '';
          }
          return cond.value.trim() !== '';
        })
        .map((cond) => {
          const question =
            cond.questionId !== null
              ? questions.find((q) => q.id === cond.questionId)
              : undefined;
          const subject =
            cond.source === 'Question'
              ? question?.text ?? ''
              : cond.source === 'System Variable'
                ? cond.systemVariable ?? ''
                : cond.source;
          return {
            source: cond.source,
            questionCode: question?.code ?? '',
            questionText: question?.text ?? '',
            subject,
            operator: cond.operator,
            value: cond.value.trim(),
            valueEnd: isBetweenOperator(cond.operator) ? cond.valueEnd.trim() : undefined,
            connector: cond.connector,
          };
        });
      return { name: crit.name.trim(), conditions };
    })
    // Criteria name is optional in the prototype; we still want to keep the
    // conditions so advanced-group quotas can show the actual rules.
    .filter((crit) => crit.conditions.length > 0);
  return {
    name: trimmedName,
    target: block.target,
    criteria,
    firstCheck,
    secondCheck,
  };
}

interface QuotaBlockEditorProps {
  block: QuotaBlock;
  blockIndex: number;
  questions: SurveyQuestion[];
  removable: boolean;
  hideQuotaChecks?: boolean;
  onChange: (next: QuotaBlock) => void;
  onRemove: () => void;
}

function QuotaBlockEditor({
  block,
  blockIndex,
  questions,
  removable,
  hideQuotaChecks = false,
  onChange,
  onRemove,
}: QuotaBlockEditorProps) {
  const firstCheckIndex =
    block.firstCheckId === null
      ? -1
      : questions.findIndex((q) => q.id === block.firstCheckId);
  const secondCheckOptions =
    firstCheckIndex < 0 ? [] : questions.slice(firstCheckIndex);
  const firstCheckQuestion =
    block.firstCheckId === null
      ? null
      : questions.find((q) => q.id === block.firstCheckId) ?? null;
  const secondCheckQuestion =
    block.secondCheckId === null
      ? null
      : questions.find((q) => q.id === block.secondCheckId) ?? null;

  const update = (patch: Partial<QuotaBlock>) => onChange({ ...block, ...patch });

  const handleFirstCheckChange = (nextId: number) => {
    const newIndex = questions.findIndex((q) => q.id === nextId);
    let nextSecond = block.secondCheckId;
    if (nextSecond !== null) {
      const currentIdx = questions.findIndex((q) => q.id === nextSecond);
      if (currentIdx < newIndex) nextSecond = null;
    }
    update({ firstCheckId: nextId, secondCheckId: nextSecond });
  };

  const handleRemoveCriterion = (critId: string) => {
    const next = new Set(block.collapsedCriterionIds);
    next.delete(critId);
    onChange({
      ...block,
      criteria: block.criteria.filter((c) => c.id !== critId),
      collapsedCriterionIds: next,
    });
  };

  const handleUpdateCriterionName = (critId: string, value: string) => {
    update({
      criteria: block.criteria.map((c) =>
        c.id === critId && c.mode === 'new'
          ? {
              ...c,
              name: value,
              requiresRename: value.trim().length > 0 ? false : c.requiresRename,
            }
          : c
      ),
    });
  };

  const updateCriterion = (critId: string, updater: (criterion: Criterion) => Criterion) => {
    update({
      criteria: block.criteria.map((c) => {
        if (c.id !== critId) return c;
        const prev = c;
        const next = updater(c);
        return promoteExistingToNewIfModified(prev, next);
      }),
    });
  };

  const handleToggleCriterionCollapse = (critId: string) => {
    const next = new Set(block.collapsedCriterionIds);
    if (next.has(critId)) next.delete(critId);
    else next.add(critId);
    update({ collapsedCriterionIds: next });
  };

  const handleAddCondition = (critId: string) => {
    updateCriterion(critId, (c) => ({
      ...c,
      conditions: [...c.conditions, newCondition()],
    }));
  };

  const handleRemoveCondition = (critId: string, condId: string) => {
    updateCriterion(critId, (c) => ({
      ...c,
      conditions:
        c.conditions.length > 1
          ? c.conditions.filter((cond) => cond.id !== condId)
          : c.conditions,
    }));
  };

  const handleUpdateCondition = (
    critId: string,
    condId: string,
    patch: Partial<CriterionCondition>
  ) => {
    updateCriterion(critId, (c) => ({
      ...c,
      conditions: c.conditions.map((cond) =>
        cond.id === condId ? { ...cond, ...patch } : cond
      ),
    }));
  };

  const handleCriterionModeChange = (critId: string, mode: CriteriaMode) => {
    update({
      criteria: block.criteria.map((c) => {
        if (c.id !== critId) return c;
        if (mode === c.mode) return c;
        if (mode === 'existing') {
          return {
            ...c,
            mode: 'existing',
            existingCriteriaId: null,
            existingConditionsSnapshot: null,
            requiresRename: false,
            name: '',
            conditions: [],
          };
        }
        return {
          ...c,
          mode: 'new',
          existingCriteriaId: null,
          existingConditionsSnapshot: null,
          requiresRename: false,
          conditions: c.conditions.length > 0 ? c.conditions : [newCondition()],
        };
      }),
    });
  };

  const handleExistingCriteriaSelect = (critId: string, templateId: string) => {
    const template = getExistingCriteriaById(templateId);
    if (!template) return;
    const conditions = templateToCriterionConditions(template, questions);
    const snapshot = serializeConditions(conditions);
    update({
      criteria: block.criteria.map((c) =>
        c.id === critId
          ? {
              ...c,
              mode: 'existing',
              existingCriteriaId: templateId,
              existingConditionsSnapshot: snapshot,
              requiresRename: false,
              name: template.name,
              conditions,
            }
          : c
      ),
    });
  };

  const blockTitle = block.name.trim() || `Quota ${blockIndex + 1}`;

  return (
    <section className={styles.quotaBlock}>
      <header className={styles.quotaBlockHeader}>
        <div className={styles.quotaBlockHeaderLeft}>
          <span className={styles.quotaBlockBadge}>Quota {blockIndex + 1}</span>
          {block.name.trim() ? (
            <span className={styles.quotaBlockTitle} title={blockTitle}>
              · {block.name.trim()}
            </span>
          ) : null}
        </div>
        <div className={styles.quotaBlockHeaderRight}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={() => update({ collapsed: !block.collapsed })}
            aria-label={block.collapsed ? 'Expand quota' : 'Collapse quota'}
            aria-expanded={!block.collapsed}
          >
            <span
              className={`wm-keyboard-arrow-up ${styles.collapseIcon} ${
                block.collapsed ? styles.collapseIconCollapsed : ''
              }`}
              aria-hidden
            />
          </button>
          {removable ? (
            <button
              type="button"
              className={styles.iconBtn}
              onClick={onRemove}
              aria-label={`Remove ${blockTitle}`}
            >
              <span className="wm-delete" aria-hidden />
            </button>
          ) : null}
        </div>
      </header>

      {!block.collapsed ? (
        <div className={styles.quotaBlockBody}>
          <div className={styles.field}>
            <label className={styles.label}>Quota name</label>
            <WuInput
              variant="outlined"
              placeholder="e.g. Female non-drinkers"
              value={block.name}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                update({ name: event.target.value })
              }
              className={styles.fieldInput}
            />
          </div>

          <div className={styles.targetRow}>
            <div className={styles.field}>
              <label className={styles.label}>Target (count)</label>
              <input
                type="text"
                inputMode="numeric"
                className={styles.numberInput}
                value={formatNumber(block.target)}
                onChange={(event) =>
                  update({ target: parseFormattedNumber(event.target.value) })
                }
                aria-label="Target count"
              />
            </div>
          </div>

          <div className={styles.criteriaSection}>
            <div className={styles.criteriaList}>
              {block.criteria.map((criterion, critIdx) => {
                const collapsed = block.collapsedCriterionIds.has(criterion.id);
                const conditionCount = criterion.conditions.length;
                const selectedExistingTemplate =
                  criterion.existingCriteriaId !== null
                    ? getExistingCriteriaById(criterion.existingCriteriaId)
                    : undefined;
                return (
                  <section key={criterion.id} className={styles.criterionCard}>
                    <header className={styles.criterionHeader}>
                      <div className={styles.criterionHeaderLeft}>
                        <span className={styles.criterionTag}>
                          <span className={styles.criterionTagLabel}>
                            {criterion.name.trim() || 'Criteria'}
                          </span>
                        </span>
                        <WuInput
                          variant="outlined"
                          placeholder="Criteria name"
                          value={criterion.name}
                          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                            handleUpdateCriterionName(criterion.id, event.target.value)
                          }
                          disabled={criterion.mode === 'existing'}
                          className={`${styles.criterionNameInput} ${
                            criterion.mode === 'existing'
                              ? styles.criterionNameInputReadOnly
                              : ''
                          }`}
                        />
                      </div>
                      <div className={styles.criterionHeaderRight}>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => handleToggleCriterionCollapse(criterion.id)}
                          aria-label={
                            collapsed ? 'Expand criterion' : 'Collapse criterion'
                          }
                          aria-expanded={!collapsed}
                        >
                          <span
                            className={`wm-keyboard-arrow-up ${styles.collapseIcon} ${
                              collapsed ? styles.collapseIconCollapsed : ''
                            }`}
                            aria-hidden
                          />
                        </button>
                        {block.criteria.length > 1 ? (
                          <button
                            type="button"
                            className={styles.iconBtn}
                            onClick={() => handleRemoveCriterion(criterion.id)}
                            aria-label={`Remove criterion ${critIdx + 1}`}
                          >
                            <span className="wm-delete" aria-hidden />
                          </button>
                        ) : null}
                      </div>
                    </header>

                    {!collapsed ? (
                      <div className={styles.criterionBody}>
                        <div className={styles.criteriaModeRow}>
                          <span className={styles.label}>Use</span>
                          <div
                            className={styles.criteriaModeToggle}
                            role="group"
                            aria-label="New or existing criteria"
                          >
                            {CRITERIA_MODES.map((mode) => (
                              <button
                                key={mode}
                                type="button"
                                className={
                                  criterion.mode === mode
                                    ? styles.modeToggleActive
                                    : styles.modeToggleInactive
                                }
                                onClick={() =>
                                  handleCriterionModeChange(criterion.id, mode)
                                }
                                aria-pressed={criterion.mode === mode}
                              >
                                {mode === 'new' ? 'New' : 'Existing'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {criterion.mode === 'existing' ? (
                          <div className={styles.existingCriteriaPanel}>
                            <div className={styles.field}>
                              <label className={styles.label}>Select criteria</label>
                              <WuMenu
                                Trigger={
                                  <button
                                    type="button"
                                    className={`${styles.menuTrigger} ${styles.existingCriteriaTrigger}`}
                                  >
                                    <span className={styles.menuTriggerLabel}>
                                      {selectedExistingTemplate
                                        ? selectedExistingTemplate.name
                                        : 'Select existing criteria'}
                                    </span>
                                    <span
                                      className={`wm-keyboard-arrow-down ${styles.menuCaret}`}
                                      aria-hidden
                                    />
                                  </button>
                                }
                                align="start"
                              >
                                {MOCK_EXISTING_CRITERIA.map((template) => (
                                  <WuMenuItem
                                    key={template.id}
                                    onSelect={() =>
                                      handleExistingCriteriaSelect(
                                        criterion.id,
                                        template.id
                                      )
                                    }
                                  >
                                    {template.name}
                                  </WuMenuItem>
                                ))}
                              </WuMenu>
                            </div>
                            {!criterion.existingCriteriaId ? (
                              <p className={styles.existingCriteriaHint}>
                                Choose a saved criteria set from your survey library.
                              </p>
                            ) : null}
                          </div>
                        ) : null}

                        {(criterion.mode === 'new' || criterion.existingCriteriaId) &&
                          criterion.conditions.map((cond, condIdx) => {
                          const selectedQuestion =
                            cond.questionId !== null
                              ? questions.find((q) => q.id === cond.questionId)
                              : undefined;
                          const questionLabel = selectedQuestion
                            ? `${condIdx + 1}. [${selectedQuestion.code}] ${selectedQuestion.text}`
                            : '- Select -';
                          const valueOptions =
                            cond.source === 'Question' && selectedQuestion?.options
                              ? selectedQuestion.options
                              : [];
                          const isQuestionSource = cond.source === 'Question';
                          return (
                            <div key={cond.id} className={styles.conditionRow}>
                              {condIdx === 0 ? (
                                <span className={styles.conditionPrefix}>If</span>
                              ) : (
                                <WuMenu
                                  Trigger={
                                    <button
                                      type="button"
                                      className={`${styles.menuTrigger} ${styles.conditionConnector}`}
                                      aria-label="Connector"
                                    >
                                      <span className={styles.menuTriggerLabel}>
                                        {cond.connector}
                                      </span>
                                      <span
                                        className={`wm-keyboard-arrow-down ${styles.menuCaret}`}
                                        aria-hidden
                                      />
                                    </button>
                                  }
                                  align="start"
                                >
                                  {CONNECTORS.map((connector) => (
                                    <WuMenuItem
                                      key={connector}
                                      onSelect={() =>
                                        handleUpdateCondition(criterion.id, cond.id, {
                                          connector,
                                        })
                                      }
                                    >
                                      {connector}
                                    </WuMenuItem>
                                  ))}
                                </WuMenu>
                              )}
                              <WuMenu
                                Trigger={
                                  <button
                                    type="button"
                                    className={`${styles.menuTrigger} ${styles.conditionSource}`}
                                  >
                                    <span className={styles.menuTriggerLabel}>
                                      {cond.source}
                                    </span>
                                    <span
                                      className={`wm-keyboard-arrow-down ${styles.menuCaret}`}
                                      aria-hidden
                                    />
                                  </button>
                                }
                                align="start"
                              >
                                {CONDITION_SOURCES.map((source) => (
                                  <WuMenuItem
                                    key={source}
                                    onSelect={() =>
                                      handleUpdateCondition(criterion.id, cond.id, {
                                        source,
                                        questionId:
                                          source === 'Question' ? cond.questionId : null,
                                        systemVariable:
                                          source === 'System Variable'
                                            ? cond.systemVariable
                                            : null,
                                        operator: resolveOperatorForSource(source, cond.operator),
                                        value: '',
                                        valueEnd: '',
                                      })
                                    }
                                  >
                                    {source}
                                  </WuMenuItem>
                                ))}
                              </WuMenu>
                              {cond.source === 'System Variable' ? (
                                <WuMenu
                                  Trigger={
                                    <button
                                      type="button"
                                      className={`${styles.menuTrigger} ${styles.conditionQuestion}`}
                                    >
                                      <span className={styles.menuTriggerLabel}>
                                        {cond.systemVariable ?? '- Select -'}
                                      </span>
                                      <span
                                        className={`wm-keyboard-arrow-down ${styles.menuCaret}`}
                                        aria-hidden
                                      />
                                    </button>
                                  }
                                  align="start"
                                >
                                  {SYSTEM_VARIABLES.map((sv) => (
                                    <WuMenuItem
                                      key={sv}
                                      onSelect={() =>
                                        handleUpdateCondition(criterion.id, cond.id, {
                                          systemVariable: sv,
                                        })
                                      }
                                    >
                                      {sv}
                                    </WuMenuItem>
                                  ))}
                                </WuMenu>
                              ) : (
                                <WuMenu
                                  Trigger={
                                    <button
                                      type="button"
                                      className={`${styles.menuTrigger} ${styles.conditionQuestion}`}
                                      disabled={!isQuestionSource}
                                      aria-disabled={!isQuestionSource}
                                    >
                                      <span className={styles.menuTriggerLabel}>
                                        {isQuestionSource ? questionLabel : '— n/a —'}
                                      </span>
                                      <span
                                        className={`wm-keyboard-arrow-down ${styles.menuCaret}`}
                                        aria-hidden
                                      />
                                    </button>
                                  }
                                  align="start"
                                >
                                  {questions.map((question) => (
                                    <WuMenuItem
                                      key={question.id}
                                      onSelect={() =>
                                        handleUpdateCondition(criterion.id, cond.id, {
                                          questionId: question.id,
                                          value: '',
                                        })
                                      }
                                    >
                                      [{question.code}] {question.text}
                                    </WuMenuItem>
                                  ))}
                                </WuMenu>
                              )}
                              {cond.source === 'System Variable' ? (
                                <SystemVariableOperatorMenu
                                  operator={cond.operator}
                                  triggerClassName={`${styles.menuTrigger} ${styles.conditionOperator}`}
                                  caretClassName={`wm-keyboard-arrow-down ${styles.menuCaret}`}
                                  labelClassName={styles.menuTriggerLabel}
                                  onSelect={(op) =>
                                    handleUpdateCondition(criterion.id, cond.id, {
                                      operator: op,
                                      value: systemVariableOperatorNeedsValue(op)
                                        ? cond.value
                                        : '',
                                      valueEnd: isBetweenOperator(op) ? cond.valueEnd : '',
                                    })
                                  }
                                />
                              ) : (
                                <WuMenu
                                  Trigger={
                                    <button
                                      type="button"
                                      className={`${styles.menuTrigger} ${styles.conditionOperator}`}
                                      disabled={!isQuestionSource}
                                      aria-disabled={!isQuestionSource}
                                    >
                                      <span className={styles.menuTriggerLabel}>
                                        {isQuestionSource ? cond.operator : '— n/a —'}
                                      </span>
                                      <span
                                        className={`wm-keyboard-arrow-down ${styles.menuCaret}`}
                                        aria-hidden
                                      />
                                    </button>
                                  }
                                  align="start"
                                >
                                  {QUESTION_OPERATORS.map((op) => (
                                    <WuMenuItem
                                      key={op}
                                      onSelect={() =>
                                        handleUpdateCondition(criterion.id, cond.id, {
                                          operator: op,
                                        })
                                      }
                                    >
                                      {op}
                                    </WuMenuItem>
                                  ))}
                                </WuMenu>
                              )}
                              {cond.source === 'System Variable' ? (
                                systemVariableOperatorNeedsValue(cond.operator) ? (
                                  isBetweenOperator(cond.operator) ? (
                                    <div className={styles.betweenInputs}>
                                      <input
                                        type="text"
                                        inputMode="decimal"
                                        className={systemVariableValueInputClass(cond.operator)}
                                        placeholder="From"
                                        value={cond.value}
                                        onChange={(event) =>
                                          handleUpdateCondition(criterion.id, cond.id, {
                                            value: event.target.value,
                                          })
                                        }
                                        aria-label="Range start"
                                      />
                                      <span className={styles.betweenSeparator} aria-hidden>
                                        and
                                      </span>
                                      <input
                                        type="text"
                                        inputMode="decimal"
                                        className={systemVariableValueInputClass(cond.operator)}
                                        placeholder="To"
                                        value={cond.valueEnd}
                                        onChange={(event) =>
                                          handleUpdateCondition(criterion.id, cond.id, {
                                            valueEnd: event.target.value,
                                          })
                                        }
                                        aria-label="Range end"
                                      />
                                    </div>
                                  ) : (
                                    <input
                                      type="text"
                                      inputMode={
                                        isSystemVariableNumericOperator(cond.operator)
                                          ? 'decimal'
                                          : 'text'
                                      }
                                      className={systemVariableValueInputClass(cond.operator)}
                                      placeholder="Enter value"
                                      value={cond.value}
                                      onChange={(event) =>
                                        handleUpdateCondition(criterion.id, cond.id, {
                                          value: event.target.value,
                                        })
                                      }
                                      aria-label="Condition value"
                                    />
                                  )
                                ) : (
                                  <span className={styles.conditionValueEmpty} aria-hidden />
                                )
                              ) : valueOptions.length > 0 ? (
                                <ValueMultiSelect
                                  options={valueOptions}
                                  value={cond.value}
                                  onChange={(next) =>
                                    handleUpdateCondition(criterion.id, cond.id, {
                                      value: next,
                                    })
                                  }
                                  triggerClassName={`${styles.menuTrigger} ${styles.conditionValue}`}
                                  caretClassName={`wm-keyboard-arrow-down ${styles.menuCaret}`}
                                  labelClassName={styles.menuTriggerLabel}
                                />
                              ) : (
                                <WuInput
                                  variant="outlined"
                                  placeholder="- Select -"
                                  value={cond.value}
                                  onChange={(
                                    event: React.ChangeEvent<HTMLInputElement>
                                  ) =>
                                    handleUpdateCondition(criterion.id, cond.id, {
                                      value: event.target.value,
                                    })
                                  }
                                  className={styles.conditionValue}
                                />
                              )}
                              <div className={styles.conditionActions}>
                                <button
                                  type="button"
                                  className={styles.conditionActionBtn}
                                  onClick={() => handleAddCondition(criterion.id)}
                                  aria-label="Add condition"
                                >
                                  <span className="wm-add" aria-hidden />
                                </button>
                                {conditionCount > 1 ? (
                                  <button
                                    type="button"
                                    className={styles.conditionActionBtn}
                                    onClick={() =>
                                      handleRemoveCondition(criterion.id, cond.id)
                                    }
                                    aria-label="Remove condition"
                                  >
                                    <span className="wm-remove" aria-hidden />
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}

                        {criterion.requiresRename ? (
                          <p className={styles.criteriaRenameHint}>
                            Criteria modified — enter a new criteria name to save.
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </section>
                );
              })}
            </div>
          </div>

          {!hideQuotaChecks ? (
          <div className={styles.checksSection}>
            <div className={styles.field}>
              <label className={styles.label}>First quota check</label>
              <p className={styles.checkHint}>
                The quota will be checked after the respondent answers this question.
              </p>
              <WuMenu
                Trigger={
                  <button type="button" className={styles.menuTrigger}>
                    <span className={styles.menuTriggerLabel}>
                      {firstCheckQuestion
                        ? `${firstCheckQuestion.code} – ${firstCheckQuestion.text}`
                        : 'Select question'}
                    </span>
                    <span
                      className={`wm-keyboard-arrow-down ${styles.menuCaret}`}
                      aria-hidden
                    />
                  </button>
                }
                align="start"
              >
                {questions.map((question) => (
                  <WuMenuItem
                    key={question.id}
                    onSelect={() => handleFirstCheckChange(question.id)}
                  >
                    {question.code} – {question.text}
                  </WuMenuItem>
                ))}
              </WuMenu>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Second quota check{' '}
                <span className={styles.optionalTag}>(Optional)</span>
              </label>
              <p className={styles.checkHint}>
                Must be the same question or one that comes after the first quota check.
              </p>
              <div className={styles.menuTriggerGroup}>
                <WuMenu
                  Trigger={
                    <button
                      type="button"
                      className={`${styles.menuTrigger} ${styles.menuTriggerInGroup}`}
                      disabled={block.firstCheckId === null}
                      aria-disabled={block.firstCheckId === null}
                    >
                      <span className={styles.menuTriggerLabel}>
                        {secondCheckQuestion
                          ? `${secondCheckQuestion.code} – ${secondCheckQuestion.text}`
                          : block.firstCheckId === null
                            ? 'Select first quota check first'
                            : 'Select question (optional)'}
                      </span>
                      <span
                        className={`wm-keyboard-arrow-down ${styles.menuCaret}`}
                        aria-hidden
                      />
                    </button>
                  }
                  align="start"
                >
                  {secondCheckOptions.map((question) => (
                    <WuMenuItem
                      key={question.id}
                      onSelect={() => update({ secondCheckId: question.id })}
                    >
                      {question.code} – {question.text}
                    </WuMenuItem>
                  ))}
                </WuMenu>
                {secondCheckQuestion ? (
                  <button
                    type="button"
                    className={styles.menuClearAdjacent}
                    aria-label="Clear second quota check"
                    onClick={() => update({ secondCheckId: null })}
                  >
                    <span className="wm-close" aria-hidden />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export function CriteriaBasedQuotaModal({
  open,
  onOpenChange,
  surveyId,
  flow = 'standalone',
  quotaGroupSelection = null,
  onBack,
  onBackToQuotaGroup,
  onSave,
}: CriteriaBasedQuotaModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [blocks, setBlocks] = useState<QuotaBlock[]>(() => [newQuotaBlock()]);

  const isAdvancedGroupFlow = flow === 'advanced-group' && quotaGroupSelection !== null;
  const breadcrumbSteps: QuotaStep[] = isAdvancedGroupFlow
    ? ['quota-type', 'advanced', 'quota-group', 'criteria']
    : ['quota-type', 'criteria'];

  const questions = useMemo(
    () => getQuestionsBySurvey(surveyId).filter((q) => q.parentQuestionId === undefined),
    [surveyId]
  );

  const resetState = useCallback(() => {
    if (flow === 'advanced-group' && quotaGroupSelection) {
      setBlocks([quotaBlockFromGroupSelection(quotaGroupSelection)]);
      return;
    }
    setBlocks([newQuotaBlock()]);
  }, [flow, quotaGroupSelection]);

  useEffect(() => {
    if (!open) {
      setBlocks([newQuotaBlock()]);
      return;
    }
    resetState();
  }, [open, resetState]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) setBlocks([newQuotaBlock()]);
      onOpenChange(nextOpen);
    },
    [onOpenChange]
  );

  function handleBack(): void {
    if (isAdvancedGroupFlow && onBackToQuotaGroup) {
      resetState();
      onBackToQuotaGroup();
      return;
    }
    if (onBack) {
      resetState();
      onBack();
      return;
    }
    handleOpenChange(false);
  }

  function handleBreadcrumbClick(step: QuotaStep): void {
    if (step === 'criteria') return;
    if (isAdvancedGroupFlow) {
      if (step === 'quota-group' && onBackToQuotaGroup) {
        resetState();
        onBackToQuotaGroup();
        return;
      }
      if (step === 'quota-type' || step === 'advanced') {
        if (onBack) {
          resetState();
          onBack();
        }
      }
      return;
    }
    if (step === 'quota-type') {
      handleBack();
    }
  }

  function handleAddBlock(): void {
    setBlocks((prev) => [
      ...prev.map((b) => ({ ...b, collapsed: true })),
      quotaBlockFromGroupSelection(
        isAdvancedGroupFlow ? quotaGroupSelection : null
      ),
    ]);
  }

  function handleUpdateBlock(blockId: string, next: QuotaBlock): void {
    setBlocks((prev) => prev.map((b) => (b.id === blockId ? next : b)));
  }

  function handleRemoveBlock(blockId: string): void {
    setBlocks((prev) => (prev.length > 1 ? prev.filter((b) => b.id !== blockId) : prev));
  }

  const validatedBlocks = useMemo(
    () =>
      blocks.map((b) => ({
        block: b,
        submit: validateBlock(
          b,
          questions,
          isAdvancedGroupFlow ? quotaGroupSelection : null
        ),
      })),
    [blocks, isAdvancedGroupFlow, questions, quotaGroupSelection]
  );
  const validQuotas = validatedBlocks
    .map((entry) => entry.submit)
    .filter((s): s is CriteriaQuotaSubmit => s !== null);
  const canSave = validQuotas.length === blocks.length && validQuotas.length > 0;

  function handleSave(): void {
    if (!canSave) return;
    onSave?.(validQuotas);
    const groupLabel = quotaGroupSelection?.name;
    showToast({
      message:
        validQuotas.length === 1
          ? isAdvancedGroupFlow && groupLabel
            ? `Quota "${validQuotas[0].name}" added to ${groupLabel}`
            : `Criteria based quota "${validQuotas[0].name}" created`
          : isAdvancedGroupFlow && groupLabel
            ? `${validQuotas.length} quotas added to ${groupLabel}`
            : `${validQuotas.length} criteria based quotas created`,
      variant: 'success',
    });
    resetState();
    onOpenChange(false);
  }

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalContent, WuModalHeader, WuModalFooter, WuButton } = wick;

  return (
    <WuModal
      open
      onOpenChange={handleOpenChange}
      className={styles.modal}
      variant="action"
    >
      <WuModalHeader className={styles.header}>Criteria Based Quota</WuModalHeader>
      <WuModalContent className={styles.content}>
        <div className={styles.body}>
          <p className={styles.instructions}>
            {isAdvancedGroupFlow && quotaGroupSelection ? (
              <>
                Define one or more criteria quotas for{' '}
                <strong>{quotaGroupSelection.name}</strong> ({quotaGroupSelection.handlingType}
                ). Each quota has its own name, target, and criteria. Quota checks are set at
                the group level.
              </>
            ) : (
              <>
                Define one or more criteria based quotas. Each quota has its own name, target,
                criteria, and check points.
              </>
            )}
          </p>

          <div className={styles.quotaList}>
            {blocks.map((block, index) => (
              <QuotaBlockEditor
                key={block.id}
                block={block}
                blockIndex={index}
                questions={questions}
                removable={blocks.length > 1}
                hideQuotaChecks={isAdvancedGroupFlow}
                onChange={(next) => handleUpdateBlock(block.id, next)}
                onRemove={() => handleRemoveBlock(block.id)}
              />
            ))}
          </div>

          <button
            type="button"
            className={styles.addQuotaBtn}
            onClick={handleAddBlock}
          >
            <span className="wm-add" aria-hidden />
            <span>Add another quota</span>
          </button>
        </div>
      </WuModalContent>
      <WuModalFooter>
        <div className={styles.footerActions}>
          <QuotaStepBreadcrumb
            steps={breadcrumbSteps}
            currentStep="criteria"
            onStepClick={handleBreadcrumbClick}
          />
          <div className={styles.footerButtons}>
            <WuButton variant="secondary" onClick={handleBack}>
              Back
            </WuButton>
            <WuButton onClick={handleSave} disabled={!canSave}>
              {blocks.length === 1 ? 'Save' : `Save ${blocks.length} quotas`}
            </WuButton>
          </div>
        </div>
      </WuModalFooter>
    </WuModal>
  );
}
