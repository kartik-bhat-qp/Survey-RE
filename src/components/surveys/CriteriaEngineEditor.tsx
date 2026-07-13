'use client';

import { useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import {
  getExistingCriteriaById,
  MOCK_EXISTING_CRITERIA,
} from '@/data/mock-existing-criteria';
import type { SurveyQuestion } from '@/data/mock-survey-questions';
import {
  CONDITION_SOURCES,
  CONNECTORS,
  CRITERIA_MODES,
  DEFAULT_SYSTEM_VARIABLE_OPERATOR,
  isBetweenOperator,
  isSystemVariableNumericOperator,
  isSystemVariableOperator,
  newCondition,
  newCriterion,
  parseSelectedValues,
  promoteExistingToNewIfModified,
  QUESTION_OPERATORS,
  resolveOperatorForSource,
  serializeConditions,
  SYSTEM_VARIABLE_NUMERIC_OPERATORS,
  SYSTEM_VARIABLE_TEXT_OPERATORS,
  SYSTEM_VARIABLES,
  templateToCriterionConditions,
  toggleValueSelection,
  type ConditionConnector,
  type CriteriaMode,
  type Criterion,
  type CriterionCondition,
} from '@/data/mock-criteria-engine';
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

function systemVariableValueInputClass(operator: string): string {
  const base = styles.conditionValueInput;
  if (isBetweenOperator(operator) || isSystemVariableNumericOperator(operator)) {
    return `${base} ${styles.conditionValueInputNumeric}`;
  }
  return base;
}

function systemVariableOperatorNeedsValue(operator: string): boolean {
  return operator !== 'is blank' && operator !== 'is not blank';
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
      onChange(remaining.join(', '));
    } else {
      const merged = Array.from(new Set([...selectedValues, ...filtered]));
      onChange(merged.join(', '));
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

export type CriteriaEngineEditorVariant = 'default' | 'quota';

export interface CriteriaEngineEditorProps {
  criteria: Criterion[];
  collapsedCriterionIds: Set<string>;
  questions: SurveyQuestion[];
  onChange: (next: { criteria: Criterion[]; collapsedCriterionIds: Set<string> }) => void;
  /** Rendered inside each criterion body after conditions (e.g. show/hide action row). */
  renderCriterionFooter?: (criterion: Criterion) => ReactNode;
  showAddCriteria?: boolean;
  minCriteria?: number;
  /** Quota flow: numbered criteria blocks, no name/mode fields, OR semantics between blocks. */
  variant?: CriteriaEngineEditorVariant;
  addCriteriaLabel?: string;
}

export function CriteriaEngineEditor({
  criteria,
  collapsedCriterionIds,
  questions,
  onChange,
  renderCriterionFooter,
  showAddCriteria = false,
  minCriteria = 1,
  variant = 'default',
  addCriteriaLabel = '+ Criteria',
}: CriteriaEngineEditorProps) {
  const isQuotaVariant = variant === 'quota';
  const canAddCriteria = showAddCriteria || isQuotaVariant;
  function patch(next: Partial<{ criteria: Criterion[]; collapsedCriterionIds: Set<string> }>) {
    onChange({
      criteria: next.criteria ?? criteria,
      collapsedCriterionIds: next.collapsedCriterionIds ?? collapsedCriterionIds,
    });
  }

  function handleRemoveCriterion(critId: string) {
    const nextCollapsed = new Set(collapsedCriterionIds);
    nextCollapsed.delete(critId);
    patch({
      criteria: criteria.filter((c) => c.id !== critId),
      collapsedCriterionIds: nextCollapsed,
    });
  }

  function handleUpdateCriterionName(critId: string, value: string) {
    patch({
      criteria: criteria.map((c) =>
        c.id === critId && c.mode === 'new'
          ? {
              ...c,
              name: value,
              requiresRename: value.trim().length > 0 ? false : c.requiresRename,
            }
          : c
      ),
    });
  }

  function updateCriterion(critId: string, updater: (criterion: Criterion) => Criterion) {
    patch({
      criteria: criteria.map((c) => {
        if (c.id !== critId) return c;
        const prev = c;
        const next = updater(c);
        return promoteExistingToNewIfModified(prev, next);
      }),
    });
  }

  function handleToggleCriterionCollapse(critId: string) {
    const next = new Set(collapsedCriterionIds);
    if (next.has(critId)) next.delete(critId);
    else next.add(critId);
    patch({ collapsedCriterionIds: next });
  }

  function handleAddCondition(critId: string) {
    updateCriterion(critId, (c) => ({
      ...c,
      conditions: [...c.conditions, newCondition()],
    }));
  }

  function handleRemoveCondition(critId: string, condId: string) {
    updateCriterion(critId, (c) => ({
      ...c,
      conditions:
        c.conditions.length > 1
          ? c.conditions.filter((cond) => cond.id !== condId)
          : c.conditions,
    }));
  }

  function handleUpdateCondition(
    critId: string,
    condId: string,
    condPatch: Partial<CriterionCondition>
  ) {
    updateCriterion(critId, (c) => ({
      ...c,
      conditions: c.conditions.map((cond) =>
        cond.id === condId ? { ...cond, ...condPatch } : cond
      ),
    }));
  }

  function handleCriterionModeChange(critId: string, mode: CriteriaMode) {
    patch({
      criteria: criteria.map((c) => {
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
  }

  function handleExistingCriteriaSelect(critId: string, templateId: string) {
    const template = getExistingCriteriaById(templateId);
    if (!template) return;
    const conditions = templateToCriterionConditions(template, questions);
    const snapshot = serializeConditions(conditions);
    patch({
      criteria: criteria.map((c) =>
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
  }

  function handleAddCriteria() {
    patch({ criteria: [...criteria, newCriterion()] });
  }

  function criterionDisplayLabel(criterion: Criterion, critIdx: number): string {
    if (isQuotaVariant) {
      return `Criteria ${critIdx + 1}`;
    }
    return criterion.name.trim() || 'Criteria';
  }

  return (
    <div className={styles.criteriaSection}>
      {isQuotaVariant && criteria.length > 1 ? (
        <p className={styles.criteriaOrHint}>
          A respondent matches this quota when any one of the criteria below is met.
        </p>
      ) : null}
      <div className={styles.criteriaList}>
        {criteria.map((criterion, critIdx) => {
          const collapsed = collapsedCriterionIds.has(criterion.id);
          const conditionCount = criterion.conditions.length;
          const selectedExistingTemplate =
            criterion.existingCriteriaId !== null
              ? getExistingCriteriaById(criterion.existingCriteriaId)
              : undefined;

          return (
            <div key={criterion.id} className={styles.criterionGroup}>
              {isQuotaVariant && critIdx > 0 ? (
                <div className={styles.criteriaOrDivider} aria-hidden>
                  OR
                </div>
              ) : null}
              <section className={styles.criterionCard}>
              <header className={styles.criterionHeader}>
                <div className={styles.criterionHeaderLeft}>
                  <span className={styles.criterionTag}>
                    <span className={styles.criterionTagLabel}>
                      {criterionDisplayLabel(criterion, critIdx)}
                    </span>
                  </span>
                  {!isQuotaVariant ? (
                    <WuInput
                      variant="outlined"
                      placeholder="Criteria name"
                      value={criterion.name}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                        handleUpdateCriterionName(criterion.id, event.target.value)
                      }
                      disabled={criterion.mode === 'existing'}
                      className={`${styles.criterionNameInput} ${
                        criterion.mode === 'existing' ? styles.criterionNameInputReadOnly : ''
                      }`}
                    />
                  ) : null}
                </div>
                <div className={styles.criterionHeaderRight}>
                  <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={() => handleToggleCriterionCollapse(criterion.id)}
                    aria-label={collapsed ? 'Expand criterion' : 'Collapse criterion'}
                    aria-expanded={!collapsed}
                  >
                    <span
                      className={`wm-keyboard-arrow-up ${styles.collapseIcon} ${
                        collapsed ? styles.collapseIconCollapsed : ''
                      }`}
                      aria-hidden
                    />
                  </button>
                  {criteria.length > minCriteria ? (
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
                  {!isQuotaVariant ? (
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
                            onClick={() => handleCriterionModeChange(criterion.id, mode)}
                            aria-pressed={criterion.mode === mode}
                          >
                            {mode === 'new' ? 'New' : 'Existing'}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {!isQuotaVariant && criterion.mode === 'existing' ? (
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
                                handleExistingCriteriaSelect(criterion.id, template.id)
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
                                  <span className={styles.menuTriggerLabel}>{cond.connector}</span>
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
                                      connector: connector as ConditionConnector,
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
                                <span className={styles.menuTriggerLabel}>{cond.source}</span>
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
                                    questionId: source === 'Question' ? cond.questionId : null,
                                    systemVariable:
                                      source === 'System Variable' ? cond.systemVariable : null,
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
                                  value: systemVariableOperatorNeedsValue(op) ? cond.value : '',
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
                                    handleUpdateCondition(criterion.id, cond.id, { operator: op })
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
                                handleUpdateCondition(criterion.id, cond.id, { value: next })
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
                              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
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

                  {renderCriterionFooter ? renderCriterionFooter(criterion) : null}
                </div>
              ) : null}
              </section>
            </div>
          );
        })}
      </div>

      {canAddCriteria ? (
        <button type="button" className={styles.addCriteriaBtn} onClick={handleAddCriteria}>
          <span className="wm-add" aria-hidden />
          <span>{addCriteriaLabel}</span>
        </button>
      ) : null}
    </div>
  );
}
