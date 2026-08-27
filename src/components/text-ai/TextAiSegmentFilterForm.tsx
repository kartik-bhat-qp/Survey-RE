'use client';

import { forwardRef, useId, useMemo, useState, type ButtonHTMLAttributes } from 'react';
import dynamic from 'next/dynamic';
import { SharedDashboardDateFilter } from '@/components/dashboards/SharedDashboardDateFilter';
import {
  TEXT_AI_CRITERIA_TYPE_OPTIONS,
  TEXT_AI_DATA_QUALITY_OPTIONS,
  TEXT_AI_DATA_SET_OPTIONS,
  TEXT_AI_GEO_LOCATION_OPTIONS,
  TEXT_AI_QUESTION_OPERATORS,
  TEXT_AI_QUESTION_VALUES_BY_QUESTION_ID,
  TEXT_AI_RESPONSE_STATUS_OPTIONS,
  TEXT_AI_SEGMENT_FILTER_QUESTIONS,
  TEXT_AI_SYSTEM_VARIABLE_OPTIONS,
  formatExcludedResponsesInput,
  getTextAiExclusionValidationError,
  getTextAiResponseExclusions,
  getTextAiSegmentResponseSummary,
  getResponseStatusLabel,
  getSegmentConditionValues,
  getTextAiSegmentDateRange,
  normalizeExcludedResponses,
  parseExcludedResponsesInput,
  newSegmentCondition,
  newSegmentCriteriaGroup,
  toggleTextAiResponseStatus,
  type TextAiCriteriaType,
  type TextAiSegmentCondition,
  type TextAiSegmentCriteriaGroup,
  type TextAiSegmentFilterState,
  type TextAiFilterResponse,
  type TextAiResponseExclusions,
} from '@/data/mock-text-ai-segment-filters';
import styles from './TextAiSegmentFilterForm.module.css';

const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenu })),
  { ssr: false }
);
const WuMenuCheckboxItem = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenuCheckboxItem })),
  { ssr: false }
);
const WuCombobox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCombobox })),
  { ssr: false }
);

interface TextAiSegmentFilterFormProps {
  values: TextAiSegmentFilterState;
  onChange: (values: TextAiSegmentFilterState) => void;
  responses?: readonly TextAiFilterResponse[];
}

type FilterOption = { value: string; label: string };
const asOptions = (values: readonly string[]): FilterOption[] => values.map((value) => ({ value, label: value }));
const QUESTION_OPTIONS = TEXT_AI_SEGMENT_FILTER_QUESTIONS.map((question) => ({
  value: String(question.id), label: question.text,
}));

const MenuSelectTrigger = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { label: string }
>(function MenuSelectTrigger({ label, className, ...buttonProps }, ref) {
  return (
    <button {...buttonProps} ref={ref} type="button" className={`${styles.menuTrigger} ${className ?? ''}`}>
      <span className={styles.menuTriggerLabel}>{label}</span>
      <span className={`wm-keyboard-arrow-down ${styles.menuCaret}`} aria-hidden />
    </button>
  );
});

function FilterSelect({ label, options, selected, onSelect, multiple = false, disabled = false }: {
  label: string;
  options: FilterOption[];
  selected: string[];
  onSelect: (values: string[]) => void;
  multiple?: boolean;
  disabled?: boolean;
}) {
  const id = useId();
  const selectedOptions = options.filter((option) => selected.includes(option.value));
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel} htmlFor={id}>{label}</label>
      <WuCombobox
        id={id}
        aria-label={label}
        data={options}
        accessorKey={{ value: 'value', label: 'label' }}
        value={multiple ? selectedOptions : selectedOptions[0] ?? null}
        multiple={multiple}
        enableSearch
        isEllipse
        disabled={disabled}
        variant="outlined"
        placeholder={multiple ? 'Select value(s)' : '-Select-'}
        className={styles.selectTrigger}
        maxContentWidth="min(420px, calc(100vw - 32px))"
        onSelect={(selection) => {
          const next = selection as FilterOption | FilterOption[];
          const nextValues = (Array.isArray(next) ? next : [next]).map((option) => option.value);
          // WickUI calls multi-select callbacks from its state updater; defer the parent update.
          queueMicrotask(() => onSelect(nextValues));
        }}
      />
    </div>
  );
}

function getSecondaryField(type: TextAiCriteriaType): { label: string; options: FilterOption[] } {
  switch (type) {
    case 'system-variable': return { label: 'System variable', options: asOptions(TEXT_AI_SYSTEM_VARIABLE_OPTIONS) };
    case 'geo-location': return { label: 'Geo field', options: asOptions(TEXT_AI_GEO_LOCATION_OPTIONS) };
    case 'data-quality': return { label: 'Quality rule', options: asOptions(TEXT_AI_DATA_QUALITY_OPTIONS) };
    case 'data-set': return { label: 'Dataset', options: asOptions(TEXT_AI_DATA_SET_OPTIONS) };
    default: return { label: 'Survey question', options: QUESTION_OPTIONS };
  }
}

export function TextAiSegmentFilterForm({ values, onChange, responses }: TextAiSegmentFilterFormProps) {
  const modeId = useId();
  const [mode, setMode] = useState<'extended' | 'compact'>('extended');
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([]);
  const exclusions = getTextAiResponseExclusions(values);
  const [exactResponsesInput, setExactResponsesInput] = useState(() =>
    formatExcludedResponsesInput(exclusions.exactResponses)
  );
  const summary = useMemo(() => getTextAiSegmentResponseSummary(values, responses), [values, responses]);
  const responseCount = summary.includedResponses.length;
  const validationError = getTextAiExclusionValidationError(values);
  const minimumLengthInvalid = exclusions.minimumCharactersEnabled &&
    (exclusions.minimumCharacters === null || !Number.isSafeInteger(exclusions.minimumCharacters) || exclusions.minimumCharacters < 1);
  const exactResponsesInvalid = exclusions.exactResponsesEnabled &&
    normalizeExcludedResponses(exclusions.exactResponses).length === 0;
  const dateRange = getTextAiSegmentDateRange(values);

  function patch(partial: Partial<TextAiSegmentFilterState>): void {
    onChange({ ...values, ...partial });
  }

  function updateGroups(criteriaGroups: TextAiSegmentCriteriaGroup[]): void {
    patch({ criteriaGroups });
  }

  function updateExclusions(partial: Partial<TextAiResponseExclusions>): void {
    patch({ responseExclusions: { ...exclusions, ...partial } });
  }

  function updateCondition(groupId: string, conditionId: string, partial: Partial<TextAiSegmentCondition>): void {
    updateGroups(values.criteriaGroups.map((group) => group.id !== groupId ? group : {
      ...group,
      conditions: group.conditions.map((condition) =>
        condition.id === conditionId ? { ...condition, ...partial } : condition
      ),
    }));
  }

  function removeCondition(groupId: string, conditionId: string): void {
    updateGroups(values.criteriaGroups.map((group) => group.id !== groupId ? group : {
      ...group, conditions: group.conditions.filter((condition) => condition.id !== conditionId),
    }).filter((group) => group.conditions.length > 0));
  }

  function addAndCondition(groupId: string): void {
    updateGroups(values.criteriaGroups.map((group) => group.id !== groupId ? group : {
      ...group, conditions: [...group.conditions, newSegmentCondition()],
    }));
  }

  function renderValueField(groupId: string, condition: TextAiSegmentCondition, compact: boolean) {
    const isQuestion = condition.criteriaType === 'question';
    const label = compact
      ? QUESTION_OPTIONS.find((option) => isQuestion && option.value === String(condition.surveyQuestionId))?.label
        ?? (condition.attribute || 'Value')
      : isQuestion ? 'Question values' : 'Value';
    const options = isQuestion && condition.surveyQuestionId !== null
      ? TEXT_AI_QUESTION_VALUES_BY_QUESTION_ID[condition.surveyQuestionId] ?? [] : [];

    if (isQuestion) {
      return <FilterSelect label={label} options={asOptions(options)} multiple disabled={!options.length}
        selected={getSegmentConditionValues(condition)}
        onSelect={(selected) => updateCondition(groupId, condition.id, { values: selected, value: selected[0] ?? '' })} />;
    }
    return <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <WuInput aria-label={label} variant="outlined" placeholder="Enter your value" value={condition.value}
        onChange={(event) => updateCondition(groupId, condition.id, { value: event.target.value })}
        className={styles.valueInput} />
    </div>;
  }

  return (
    <div className={styles.form}>
      <section className={styles.exclusions} aria-labelledby={`${modeId}-exclusions-title`}>
        <div className={styles.exclusionsHeader}>
          <h3 id={`${modeId}-exclusions-title`}>Exclude responses</h3>
          <span className={styles.exclusionsCount} aria-live="polite" aria-atomic="true">
            Responses excluded: <strong>{summary.excludedCount.toLocaleString()}</strong>
          </span>
        </div>
        <div className={styles.exclusionOption}>
          <div className={styles.minimumLengthRow}>
            <label className={styles.exclusionCheckbox}>
              <input type="checkbox" checked={exclusions.minimumCharactersEnabled}
                onChange={(event) => updateExclusions({ minimumCharactersEnabled: event.target.checked })} />
              Exclude responses shorter than
            </label>
            <input type="number"
              className={`${styles.minimumLengthInput} ${minimumLengthInvalid ? styles.invalidInput : ''}`}
              min={1} step={1} aria-label="Minimum character count"
              aria-invalid={minimumLengthInvalid || undefined}
              disabled={!exclusions.minimumCharactersEnabled}
              value={exclusions.minimumCharacters ?? ''}
              onChange={(event) => updateExclusions({ minimumCharacters: Number.isNaN(event.currentTarget.valueAsNumber) ? null : event.currentTarget.valueAsNumber })} />
            <span>characters</span>
          </div>
        </div>
        <div className={styles.exclusionOption}>
          <label className={styles.exclusionCheckbox}>
            <input type="checkbox" checked={exclusions.exactResponsesEnabled}
              onChange={(event) => updateExclusions({ exactResponsesEnabled: event.target.checked })} />
            Exclude specific responses
          </label>
          <div className={styles.exactResponsesField}>
            <textarea aria-label="Responses to exclude" rows={3}
              className={`${styles.exactResponsesInput} ${exactResponsesInvalid ? styles.invalidInput : ''}`}
              aria-invalid={exactResponsesInvalid || undefined}
              disabled={!exclusions.exactResponsesEnabled}
              value={exactResponsesInput}
              placeholder={'Enter responses separated by commas or one per line. Use \\ to escape a comma. Example: NA, null, Not sure\\, maybe'}
              onChange={(event) => {
                const input = event.target.value;
                setExactResponsesInput(input);
                updateExclusions({ exactResponses: parseExcludedResponsesInput(input) });
              }} />
          </div>
        </div>
      </section>
      <section className={styles.topArea} aria-labelledby={`${modeId}-filters-title`}>
        <h3 id={`${modeId}-filters-title`}>Filter Responses</h3>
        <div className={styles.filterControlsRow}>
          <div className={styles.topFilters}>
            <div className={styles.inlineField}>
              <span className={styles.fieldLabel}>Response status</span>
              <WuMenu align="start" Trigger={<MenuSelectTrigger label={getResponseStatusLabel(values.responseStatuses)} className={styles.topTrigger} />}>
                {TEXT_AI_RESPONSE_STATUS_OPTIONS.map((option) => (
                  <WuMenuCheckboxItem key={option.value}
                    checked={values.responseStatuses.includes('all') ? option.value === 'all' : values.responseStatuses.includes(option.value)}
                    onSelect={() => patch({ responseStatuses: toggleTextAiResponseStatus(values.responseStatuses, option.value) })}
                    preventCloseOnSelect>
                    <span className={styles.menuItem}>{option.label}</span>
                  </WuMenuCheckboxItem>
                ))}
              </WuMenu>
            </div>
            <div className={styles.inlineField}>
              <span className={styles.fieldLabel}>Filter by date</span>
              <SharedDashboardDateFilter {...dateRange} onChange={({ startDate, endDate }) => patch({
                dateRangeStart: startDate, dateRangeEnd: endDate,
                dateRangeLabel: startDate && endDate ? `${startDate} – ${endDate}` : null,
              })} />
            </div>
          </div>
          <div className={styles.modeSelector} role="radiogroup" aria-label="Filter display mode">
            <label className={`${styles.modeOption} ${mode === 'extended' ? styles.modeOptionActive : ''}`}>
              <input className={styles.modeInput} type="radio" name={modeId} value="extended"
                checked={mode === 'extended'} onChange={() => setMode('extended')} />
              <span>Extended mode</span>
            </label>
            <label className={`${styles.modeOption} ${mode === 'compact' ? styles.modeOptionActive : ''}`}>
              <input className={styles.modeInput} type="radio" name={modeId} value="compact"
                checked={mode === 'compact'} onChange={() => setMode('compact')} />
              <span>Compact mode</span>
            </label>
          </div>
        </div>
        {values.criteriaGroups.length === 0 && (
          <button type="button" className={styles.addCriteriaButton}
            onClick={() => { setMode('extended'); updateGroups([newSegmentCriteriaGroup()]); }}>
            <span className={`wm-add ${styles.addCriteriaIcon}`} aria-hidden />Add criteria
          </button>
        )}
      </section>

      <div className={styles.criteriaGroups}>
        {values.criteriaGroups.map((group, groupIndex) => {
          const collapsed = collapsedGroups.includes(group.id);
          const bodyId = `${modeId}-${group.id}`;
          const compactGroup = mode === 'compact' && group.conditions.every((condition) =>
            condition.criteriaType === 'question' ? condition.surveyQuestionId !== null : !!condition.attribute
          );
          return <div key={group.id}>
            {groupIndex > 0 && <div className={styles.orDivider}>OR</div>}
            <section className={compactGroup ? styles.compactGroup : styles.criteriaGroup} aria-label={`Block ${groupIndex + 1}`}>
              {!compactGroup && <button type="button" className={styles.blockHeader} aria-label={`${collapsed ? 'Expand' : 'Collapse'} filter block ${groupIndex + 1}`}
                aria-expanded={!collapsed} aria-controls={bodyId}
                onClick={() => setCollapsedGroups((current) => collapsed ? current.filter((id) => id !== group.id) : [...current, group.id])}>
                <span className={`wm-keyboard-arrow-${collapsed ? 'down' : 'up'} ${styles.blockChevron}`} aria-hidden />
                <span>Block {groupIndex + 1}</span>
                <span className={styles.conditionCount}>{group.conditions.length} {group.conditions.length === 1 ? 'condition' : 'conditions'}</span>
              </button>}
              <div id={bodyId} hidden={!compactGroup && collapsed} className={compactGroup ? styles.compactConditions : undefined}>
                {group.conditions.map((condition, conditionIndex) => {
                  const secondary = getSecondaryField(condition.criteriaType);
                  const hasField = condition.criteriaType === 'question' ? condition.surveyQuestionId !== null : !!condition.attribute;
                  const compact = compactGroup && hasField;
                  return <div key={condition.id} className={`${styles.conditionRow} ${compact ? styles.compactRow : ''}`}>
                    <span className={styles.conditionLabel}>{conditionIndex === 0 ? 'IF' : 'AND'}</span>
                    {!compact && <>
                      <FilterSelect label="Option" options={TEXT_AI_CRITERIA_TYPE_OPTIONS} selected={[condition.criteriaType]}
                        onSelect={([type]) => updateCondition(group.id, condition.id, {
                          criteriaType: type as TextAiCriteriaType, surveyQuestionId: null, attribute: '', operator: 'Is', value: '', values: [],
                        })} />
                      <FilterSelect label={secondary.label} options={secondary.options}
                        selected={[condition.criteriaType === 'question' ? String(condition.surveyQuestionId ?? '') : condition.attribute]}
                        onSelect={([selected]) => updateCondition(group.id, condition.id, {
                          ...(condition.criteriaType === 'question' ? { surveyQuestionId: Number(selected) } : { attribute: selected }), value: '', values: [],
                        })} />
                      <FilterSelect label="Operator" options={asOptions(condition.criteriaType === 'question' ? TEXT_AI_QUESTION_OPERATORS : ['Is'])}
                        disabled={!hasField} selected={[condition.operator]}
                        onSelect={([operator]) => updateCondition(group.id, condition.id, { operator })} />
                    </>}
                    {renderValueField(group.id, condition, compact)}
                    <div className={styles.conditionActions}>
                      {compact ? <button type="button" className={styles.conditionActionBtn} aria-label="Edit condition" onClick={() => setMode('extended')}>
                        <span className="wm-edit" aria-hidden />
                      </button> : <>
                        <button type="button" className={styles.conditionActionBtn} onClick={() => removeCondition(group.id, condition.id)} aria-label="Remove condition">
                          <span className="wm-remove" aria-hidden />
                        </button>
                        <button type="button" className={styles.conditionActionBtn} onClick={() => addAndCondition(group.id)} aria-label="Add condition">
                          <span className="wm-add" aria-hidden />
                        </button>
                      </>}
                    </div>
                  </div>;
                })}
              </div>
            </section>
            {!compactGroup && mode === 'extended' && <div className={styles.addOrButtonWrap}>
              <button type="button" className={styles.addOrButton} onClick={() => updateGroups([...values.criteriaGroups, newSegmentCriteriaGroup()])}>
                <span className="wm-add" aria-hidden />Add OR condition
              </button>
            </div>}
          </div>;
        })}
      </div>
      <div className={styles.responseCountFooter} aria-live="polite" aria-atomic="true">
        <span className={styles.responseCountLabel}>Responses:</span>
        <span className={styles.responseCountValue}>{validationError ? '—' : responseCount.toLocaleString()}</span>
      </div>
      {!validationError && responseCount === 0 && <p role="status" className={styles.emptyResults}>No responses match. Adjust the filters or exclusions to continue.</p>}
    </div>
  );
}
