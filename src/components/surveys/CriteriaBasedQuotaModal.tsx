'use client';

import { useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  QuotaStepBreadcrumb,
  type QuotaStep,
} from '@/components/surveys/QuotaStepBreadcrumb';
import {
  getQuestionsBySurvey,
  type SurveyQuestion,
} from '@/data/mock-survey-questions';
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

const OPERATORS = ['is', 'is not', 'contains', 'does not contain'] as const;
type Operator = (typeof OPERATORS)[number];

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
  operator: Operator;
  value: string;
  connector: ConditionConnector;
}

interface Criterion {
  id: string;
  name: string;
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
  operator: Operator;
  value: string;
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

interface CriteriaBasedQuotaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surveyId: number;
  onBack?: () => void;
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
    connector: 'AND',
  };
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
    conditions: [newCondition()],
  };
}

function newQuotaBlock(): QuotaBlock {
  return {
    id: uniqueId('quota'),
    name: '',
    target: 100,
    criteria: [newCriterion()],
    collapsedCriterionIds: new Set(),
    firstCheckId: null,
    secondCheckId: null,
    collapsed: false,
  };
}

function validateBlock(
  block: QuotaBlock,
  questions: SurveyQuestion[]
): CriteriaQuotaSubmit | null {
  const trimmedName = block.name.trim();
  if (trimmedName.length === 0) return null;
  if (block.target <= 0) return null;
  if (block.firstCheckId === null) return null;
  const firstCheckQuestion = questions.find((q) => q.id === block.firstCheckId);
  if (!firstCheckQuestion) return null;
  const secondCheckQuestion =
    block.secondCheckId !== null
      ? questions.find((q) => q.id === block.secondCheckId)
      : undefined;
  const criteria: CriteriaQuotaCriterion[] = block.criteria
    .map((crit) => {
      const conditions: CriteriaQuotaCondition[] = crit.conditions
        .filter((cond) => {
          if (cond.source === 'Question') {
            return cond.questionId !== null && cond.value.trim() !== '';
          }
          if (cond.source === 'System Variable') {
            return cond.systemVariable !== null && cond.value.trim() !== '';
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
            connector: cond.connector,
          };
        });
      return { name: crit.name.trim(), conditions };
    })
    .filter((crit) => crit.conditions.length > 0);
  return {
    name: trimmedName,
    target: block.target,
    criteria,
    firstCheck: {
      questionId: firstCheckQuestion.id,
      questionCode: firstCheckQuestion.code,
      questionText: firstCheckQuestion.text,
    },
    secondCheck: secondCheckQuestion
      ? {
          questionId: secondCheckQuestion.id,
          questionCode: secondCheckQuestion.code,
          questionText: secondCheckQuestion.text,
        }
      : undefined,
  };
}

interface QuotaBlockEditorProps {
  block: QuotaBlock;
  blockIndex: number;
  questions: SurveyQuestion[];
  removable: boolean;
  onChange: (next: QuotaBlock) => void;
  onRemove: () => void;
}

function QuotaBlockEditor({
  block,
  blockIndex,
  questions,
  removable,
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

  const handleAddCriterion = () => {
    update({ criteria: [...block.criteria, newCriterion()] });
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
        c.id === critId ? { ...c, name: value } : c
      ),
    });
  };

  const handleToggleCriterionCollapse = (critId: string) => {
    const next = new Set(block.collapsedCriterionIds);
    if (next.has(critId)) next.delete(critId);
    else next.add(critId);
    update({ collapsedCriterionIds: next });
  };

  const handleAddCondition = (critId: string) => {
    update({
      criteria: block.criteria.map((c) =>
        c.id === critId ? { ...c, conditions: [...c.conditions, newCondition()] } : c
      ),
    });
  };

  const handleRemoveCondition = (critId: string, condId: string) => {
    update({
      criteria: block.criteria.map((c) =>
        c.id === critId
          ? {
              ...c,
              conditions:
                c.conditions.length > 1
                  ? c.conditions.filter((cond) => cond.id !== condId)
                  : c.conditions,
            }
          : c
      ),
    });
  };

  const handleUpdateCondition = (
    critId: string,
    condId: string,
    patch: Partial<CriterionCondition>
  ) => {
    update({
      criteria: block.criteria.map((c) =>
        c.id === critId
          ? {
              ...c,
              conditions: c.conditions.map((cond) =>
                cond.id === condId ? { ...cond, ...patch } : cond
              ),
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
                return (
                  <section key={criterion.id} className={styles.criterionCard}>
                    <header className={styles.criterionHeader}>
                      <div className={styles.criterionHeaderLeft}>
                        <span className={styles.criterionTag}>
                          <span className={styles.criterionTagLabel}>
                            {criterion.name.trim() || `Criteria ${critIdx + 1}`}
                          </span>
                        </span>
                        <WuInput
                          variant="outlined"
                          placeholder="Criteria name"
                          value={criterion.name}
                          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                            handleUpdateCriterionName(criterion.id, event.target.value)
                          }
                          className={styles.criterionNameInput}
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
                        {criterion.conditions.map((cond, condIdx) => {
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
                                <span className={styles.conditionPrefix}>IF</span>
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
                                        value: '',
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
                              <WuMenu
                                Trigger={
                                  <button
                                    type="button"
                                    className={`${styles.menuTrigger} ${styles.conditionOperator}`}
                                  >
                                    <span className={styles.menuTriggerLabel}>
                                      {cond.operator}
                                    </span>
                                    <span
                                      className={`wm-keyboard-arrow-down ${styles.menuCaret}`}
                                      aria-hidden
                                    />
                                  </button>
                                }
                                align="start"
                              >
                                {OPERATORS.map((op) => (
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
                              {valueOptions.length > 0 ? (
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
                      </div>
                    ) : null}
                  </section>
                );
              })}
            </div>

            <button
              type="button"
              className={styles.addCriteriaBtn}
              onClick={handleAddCriterion}
            >
              <span className="wm-add" aria-hidden />
              <span>Criteria</span>
            </button>
          </div>

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
              <WuMenu
                Trigger={
                  <button
                    type="button"
                    className={styles.menuTrigger}
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
                    {secondCheckQuestion ? (
                      <button
                        type="button"
                        className={styles.menuClear}
                        aria-label="Clear second quota check"
                        onClick={(event) => {
                          event.stopPropagation();
                          update({ secondCheckId: null });
                        }}
                      >
                        <span className="wm-close" aria-hidden />
                      </button>
                    ) : (
                      <span
                        className={`wm-keyboard-arrow-down ${styles.menuCaret}`}
                        aria-hidden
                      />
                    )}
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
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function CriteriaBasedQuotaModal({
  open,
  onOpenChange,
  surveyId,
  onBack,
  onSave,
}: CriteriaBasedQuotaModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [blocks, setBlocks] = useState<QuotaBlock[]>(() => [newQuotaBlock()]);

  const questions = useMemo(
    () => getQuestionsBySurvey(surveyId).filter((q) => q.parentQuestionId === undefined),
    [surveyId]
  );

  const resetState = useCallback(() => {
    setBlocks([newQuotaBlock()]);
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) resetState();
      onOpenChange(nextOpen);
    },
    [onOpenChange, resetState]
  );

  function handleBack(): void {
    if (onBack) {
      resetState();
      onBack();
      return;
    }
    handleOpenChange(false);
  }

  function handleBreadcrumbClick(step: QuotaStep): void {
    if (step === 'quota-type') {
      handleBack();
    }
  }

  function handleAddBlock(): void {
    setBlocks((prev) => [
      ...prev.map((b) => ({ ...b, collapsed: true })),
      newQuotaBlock(),
    ]);
  }

  function handleUpdateBlock(blockId: string, next: QuotaBlock): void {
    setBlocks((prev) => prev.map((b) => (b.id === blockId ? next : b)));
  }

  function handleRemoveBlock(blockId: string): void {
    setBlocks((prev) => (prev.length > 1 ? prev.filter((b) => b.id !== blockId) : prev));
  }

  const validatedBlocks = useMemo(
    () => blocks.map((b) => ({ block: b, submit: validateBlock(b, questions) })),
    [blocks, questions]
  );
  const validQuotas = validatedBlocks
    .map((entry) => entry.submit)
    .filter((s): s is CriteriaQuotaSubmit => s !== null);
  const canSave = validQuotas.length === blocks.length && validQuotas.length > 0;

  function handleSave(): void {
    if (!canSave) return;
    onSave?.(validQuotas);
    showToast({
      message:
        validQuotas.length === 1
          ? `Criteria based quota "${validQuotas[0].name}" created`
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
            Define one or more criteria based quotas. Each quota has its own name, target,
            criteria, and check points.
          </p>

          <div className={styles.quotaList}>
            {blocks.map((block, index) => (
              <QuotaBlockEditor
                key={block.id}
                block={block}
                blockIndex={index}
                questions={questions}
                removable={blocks.length > 1}
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
            steps={['quota-type', 'criteria']}
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
