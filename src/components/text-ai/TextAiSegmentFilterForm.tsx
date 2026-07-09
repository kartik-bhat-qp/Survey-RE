'use client';

import {
  forwardRef,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';
import dynamic from 'next/dynamic';
import {
  TEXT_AI_CRITERIA_TYPE_OPTIONS,
  TEXT_AI_DATA_QUALITY_OPTIONS,
  TEXT_AI_DATA_SET_OPTIONS,
  TEXT_AI_DATE_RANGE_PRESETS,
  TEXT_AI_GEO_LOCATION_OPTIONS,
  TEXT_AI_QUESTION_OPERATORS,
  TEXT_AI_QUESTION_VALUES_BY_QUESTION_ID,
  TEXT_AI_RESPONSE_STATUS_OPTIONS,
  TEXT_AI_SEGMENT_FILTER_QUESTIONS,
  TEXT_AI_SYSTEM_VARIABLE_OPTIONS,
  calculateTextAiSegmentResponseCount,
  getCriteriaTypeLabel,
  getResponseStatusLabel,
  newSegmentCondition,
  newSegmentCriteriaGroup,
  type TextAiCriteriaType,
  type TextAiSegmentCondition,
  type TextAiSegmentCriteriaGroup,
  type TextAiSegmentFilterState,
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
const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuPopover = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuPopover })),
  { ssr: false }
);

interface TextAiSegmentFilterFormProps {
  values: TextAiSegmentFilterState;
  onChange: (values: TextAiSegmentFilterState) => void;
}

const MenuSelectTrigger = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    label: string;
  }
>(function MenuSelectTrigger({ label, className, ...buttonProps }, ref) {
  return (
    <button
      {...buttonProps}
      ref={ref}
      type="button"
      className={`${styles.menuTrigger} ${className ?? ''}`}
    >
      <span className={styles.menuTriggerLabel}>{label}</span>
      <span className={`wm-keyboard-arrow-down ${styles.menuCaret}`} aria-hidden />
    </button>
  );
});

function getSecondaryFieldLabel(type: TextAiCriteriaType): string {
  switch (type) {
    case 'system-variable':
      return 'System variable';
    case 'geo-location':
      return 'Geo field';
    case 'data-quality':
      return 'Quality rule';
    case 'data-set':
      return 'Data set';
    default:
      return 'Survey question';
  }
}

function getSecondaryOptions(type: TextAiCriteriaType): string[] {
  switch (type) {
    case 'system-variable':
      return TEXT_AI_SYSTEM_VARIABLE_OPTIONS;
    case 'geo-location':
      return TEXT_AI_GEO_LOCATION_OPTIONS;
    case 'data-quality':
      return TEXT_AI_DATA_QUALITY_OPTIONS;
    case 'data-set':
      return TEXT_AI_DATA_SET_OPTIONS;
    default:
      return TEXT_AI_SEGMENT_FILTER_QUESTIONS.map((question) => question.text);
  }
}

function getSecondaryValue(condition: TextAiSegmentCondition): string {
  if (condition.criteriaType === 'question') {
    const question = TEXT_AI_SEGMENT_FILTER_QUESTIONS.find(
      (item) => item.id === condition.surveyQuestionId
    );
    return question?.text ?? '-Select-';
  }

  return condition.attribute || '-Select-';
}

function getValueOptions(condition: TextAiSegmentCondition): string[] {
  if (condition.criteriaType !== 'question' || condition.surveyQuestionId === null) {
    return [];
  }

  return TEXT_AI_QUESTION_VALUES_BY_QUESTION_ID[condition.surveyQuestionId] ?? [];
}

export function TextAiSegmentFilterForm({ values, onChange }: TextAiSegmentFilterFormProps) {
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [draftStartDate, setDraftStartDate] = useState(values.dateRangeStart);
  const [draftEndDate, setDraftEndDate] = useState(values.dateRangeEnd);

  const responseStatusLabel = useMemo(
    () => getResponseStatusLabel(values.responseStatuses),
    [values.responseStatuses]
  );
  const responseCount = useMemo(
    () => calculateTextAiSegmentResponseCount(values),
    [values]
  );

  function patch(partial: Partial<TextAiSegmentFilterState>): void {
    onChange({ ...values, ...partial });
  }

  function updateGroups(nextGroups: TextAiSegmentCriteriaGroup[]): void {
    patch({ criteriaGroups: nextGroups });
  }

  function toggleResponseStatus(statusValue: string): void {
    if (statusValue === 'all') {
      const hasAllStatuses =
        values.responseStatuses.length === TEXT_AI_RESPONSE_STATUS_OPTIONS.length;
      patch({
        responseStatuses: hasAllStatuses
          ? []
          : TEXT_AI_RESPONSE_STATUS_OPTIONS.map((option) => option.value),
      });
      return;
    }

    const isSelected = values.responseStatuses.includes(statusValue);
    const nextStatusSet = new Set(
      values.responseStatuses.filter((value) => value !== 'all')
    );
    if (isSelected) {
      nextStatusSet.delete(statusValue);
    } else {
      nextStatusSet.add(statusValue);
    }
    const selectedConcreteStatuses = TEXT_AI_RESPONSE_STATUS_OPTIONS.filter(
      (option) => option.value !== 'all' && nextStatusSet.has(option.value)
    ).map((option) => option.value);
    const nextStatuses =
      selectedConcreteStatuses.length === TEXT_AI_RESPONSE_STATUS_OPTIONS.length - 1
        ? TEXT_AI_RESPONSE_STATUS_OPTIONS.map((option) => option.value)
        : selectedConcreteStatuses;
    patch({ responseStatuses: nextStatuses });
  }

  function handleAddCriteria(type: TextAiCriteriaType): void {
    if (values.criteriaGroups.length === 0) {
      updateGroups([newSegmentCriteriaGroup(type)]);
      return;
    }

    const nextGroups = [...values.criteriaGroups];
    const lastGroup = nextGroups[nextGroups.length - 1];
    nextGroups[nextGroups.length - 1] = {
      ...lastGroup,
      conditions: [...lastGroup.conditions, newSegmentCondition(type)],
    };
    updateGroups(nextGroups);
  }

  function handleAddOrGroup(type: TextAiCriteriaType = 'question'): void {
    updateGroups([...values.criteriaGroups, newSegmentCriteriaGroup(type)]);
  }

  function updateCondition(
    groupId: string,
    conditionId: string,
    partial: Partial<TextAiSegmentCondition>
  ): void {
    updateGroups(
      values.criteriaGroups.map((group) => {
        if (group.id !== groupId) return group;
        return {
          ...group,
          conditions: group.conditions.map((condition) =>
            condition.id === conditionId ? { ...condition, ...partial } : condition
          ),
        };
      })
    );
  }

  function removeCondition(groupId: string, conditionId: string): void {
    const nextGroups = values.criteriaGroups
      .map((group) => {
        if (group.id !== groupId) return group;
        const nextConditions = group.conditions.filter(
          (condition) => condition.id !== conditionId
        );
        return nextConditions.length > 0 ? { ...group, conditions: nextConditions } : null;
      })
      .filter((group): group is TextAiSegmentCriteriaGroup => group !== null);

    updateGroups(nextGroups);
  }

  function addAndCondition(groupId: string): void {
    updateGroups(
      values.criteriaGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              conditions: [...group.conditions, newSegmentCondition('question')],
            }
          : group
      )
    );
  }

  function applyDatePreset(label: string, startDate: string, endDate: string): void {
    patch({
      dateRangeLabel: label,
      dateRangeStart: startDate,
      dateRangeEnd: endDate,
    });
    setDraftStartDate(startDate);
    setDraftEndDate(endDate);
    setDatePopoverOpen(false);
  }

  function applyCustomDateRange(): void {
    if (!draftStartDate && !draftEndDate) return;
    const label =
      draftStartDate && draftEndDate
        ? `${draftStartDate} – ${draftEndDate}`
        : draftStartDate || draftEndDate;
    applyDatePreset(label, draftStartDate, draftEndDate);
  }

  function resetDateRange(): void {
    patch({
      dateRangeLabel: null,
      dateRangeStart: '',
      dateRangeEnd: '',
    });
    setDraftStartDate('');
    setDraftEndDate('');
    setDatePopoverOpen(false);
  }

  function renderSecondarySelector(groupId: string, condition: TextAiSegmentCondition): ReactNode {
    const options = getSecondaryOptions(condition.criteriaType);
    const label = getSecondaryFieldLabel(condition.criteriaType);

    if (condition.criteriaType === 'question') {
      return (
        <div className={styles.field}>
          <span className={styles.fieldLabel}>{label}</span>
          <WuMenu
            Trigger={<MenuSelectTrigger label={getSecondaryValue(condition)} />}
            align="start"
          >
            {TEXT_AI_SEGMENT_FILTER_QUESTIONS.map((question) => (
              <WuMenuItem
                key={question.id}
                className={styles.menuItem}
                onSelect={() =>
                  updateCondition(groupId, condition.id, {
                    surveyQuestionId: question.id,
                    attribute: '',
                    value: '',
                  })
                }
              >
                {question.text}
              </WuMenuItem>
            ))}
          </WuMenu>
        </div>
      );
    }

    return (
      <div className={styles.field}>
        <span className={styles.fieldLabel}>{label}</span>
        <WuMenu
          Trigger={<MenuSelectTrigger label={getSecondaryValue(condition)} />}
          align="start"
        >
          {options.map((option) => (
            <WuMenuItem
              key={option}
              className={styles.menuItem}
              onSelect={() => updateCondition(groupId, condition.id, { attribute: option })}
            >
              {option}
            </WuMenuItem>
          ))}
        </WuMenu>
      </div>
    );
  }

  function renderValueField(groupId: string, condition: TextAiSegmentCondition): ReactNode {
    const valueOptions = getValueOptions(condition);

    if (condition.criteriaType === 'question' && valueOptions.length > 0) {
      return (
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Question values</span>
          <WuMenu
            Trigger={
              <MenuSelectTrigger label={condition.value || 'Enter your value'} />
            }
            align="start"
          >
            {valueOptions.map((option) => (
              <WuMenuItem
                key={option}
                className={styles.menuItem}
                onSelect={() => updateCondition(groupId, condition.id, { value: option })}
              >
                {option}
              </WuMenuItem>
            ))}
          </WuMenu>
        </div>
      );
    }

    return (
      <div className={styles.field}>
        <span className={styles.fieldLabel}>Question values</span>
        <WuInput
          variant="outlined"
          placeholder="Enter your value"
          value={condition.value}
          onChange={(event) =>
            updateCondition(groupId, condition.id, { value: event.target.value })
          }
          className={styles.valueInput}
        />
      </div>
    );
  }

  return (
    <div className={styles.form}>
      <div className={styles.topArea}>
        <div className={styles.topFilters}>
          <div className={styles.inlineField}>
            <span className={styles.fieldLabel}>Response status</span>
            <WuMenu
              Trigger={<MenuSelectTrigger label={responseStatusLabel} className={styles.topTrigger} />}
              align="start"
            >
              {TEXT_AI_RESPONSE_STATUS_OPTIONS.map((option) => (
                <WuMenuCheckboxItem
                  key={option.value}
                  checked={values.responseStatuses.includes(option.value)}
                  onSelect={() => toggleResponseStatus(option.value)}
                  preventCloseOnSelect
                >
                  <span className={styles.menuItem}>{option.label}</span>
                </WuMenuCheckboxItem>
              ))}
            </WuMenu>
          </div>

          <div className={styles.inlineField}>
            <span className={styles.fieldLabel}>Filter by date</span>
            <WuPopover
              open={datePopoverOpen}
              onOpenChange={setDatePopoverOpen}
              align="start"
              Trigger={
                <button
                  type="button"
                  className={`${styles.menuTrigger} ${styles.topTrigger} ${styles.dateTrigger}`}
                >
                  <span className={styles.menuTriggerLabel}>
                    {values.dateRangeLabel ?? 'Select date range'}
                  </span>
                  <span className="wm-calendar-today" aria-hidden />
                </button>
              }
            >
              <div className={styles.datePopover}>
                {TEXT_AI_DATE_RANGE_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    className={styles.presetButton}
                    onClick={() => applyDatePreset(preset.label, '', '')}
                  >
                    {preset.label}
                  </button>
                ))}
                <div className={styles.customRange}>
                  <p className={styles.customRangeTitle}>Custom Range</p>
                  <div className={styles.customRangeInputs}>
                    <input
                      type="date"
                      className={styles.dateInput}
                      value={draftStartDate}
                      onChange={(event) => setDraftStartDate(event.target.value)}
                      aria-label="Start date"
                    />
                    <input
                      type="date"
                      className={styles.dateInput}
                      value={draftEndDate}
                      onChange={(event) => setDraftEndDate(event.target.value)}
                      aria-label="End date"
                    />
                  </div>
                </div>
                <div className={styles.dateActions}>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      className={styles.dateActionLink}
                      onClick={resetDateRange}
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      className={styles.dateActionLink}
                      onClick={() => setDatePopoverOpen(false)}
                    >
                      Cancel
                    </button>
                  </div>
                  <WuButton size="sm" onClick={applyCustomDateRange}>
                    Apply
                  </WuButton>
                </div>
              </div>
            </WuPopover>
          </div>
        </div>

        {values.criteriaGroups.length === 0 ? (
          <button
            type="button"
            className={styles.addCriteriaButton}
            onClick={() => handleAddCriteria('question')}
          >
            <span className={`wm-add ${styles.addCriteriaIcon}`} aria-hidden />
            Add criteria
          </button>
        ) : null}
      </div>

      {values.criteriaGroups.length > 0 ? (
        <div className={styles.criteriaGroups}>
          {values.criteriaGroups.map((group, groupIndex) => (
            <div key={group.id}>
              {groupIndex > 0 ? <div className={styles.orDivider}>OR</div> : null}
              <div className={styles.criteriaGroup}>
                {group.conditions.map((condition, conditionIndex) => (
                  <div key={condition.id} className={styles.conditionRow}>
                    <span className={styles.conditionLabel}>
                      {conditionIndex === 0 ? 'IF' : 'AND'}
                    </span>

                    <div className={styles.field}>
                      <span className={styles.fieldLabel}>Option</span>
                      <WuMenu
                        Trigger={
                          <MenuSelectTrigger
                            label={getCriteriaTypeLabel(condition.criteriaType)}
                          />
                        }
                        align="start"
                      >
                        {TEXT_AI_CRITERIA_TYPE_OPTIONS.map((option) => (
                          <WuMenuItem
                            key={option.value}
                            className={styles.menuItem}
                            onSelect={() =>
                              updateCondition(group.id, condition.id, {
                                criteriaType: option.value,
                                surveyQuestionId: null,
                                attribute: '',
                                operator: 'Is',
                                value: '',
                              })
                            }
                          >
                            {option.label}
                          </WuMenuItem>
                        ))}
                      </WuMenu>
                    </div>

                    {renderSecondarySelector(group.id, condition)}

                    {condition.criteriaType === 'question' &&
                    condition.surveyQuestionId !== null ? (
                      <div className={styles.field}>
                        <span className={styles.fieldLabel}>Operator</span>
                        <WuMenu
                          Trigger={<MenuSelectTrigger label={condition.operator} />}
                          align="start"
                        >
                          {TEXT_AI_QUESTION_OPERATORS.map((operator) => (
                            <WuMenuItem
                              key={operator}
                              className={styles.menuItem}
                              onSelect={() =>
                                updateCondition(group.id, condition.id, { operator })
                              }
                            >
                              {operator}
                            </WuMenuItem>
                          ))}
                        </WuMenu>
                      </div>
                    ) : condition.criteriaType !== 'question' ? (
                      <div className={styles.field}>
                        <span className={styles.fieldLabel}>Operator</span>
                        <MenuSelectTrigger label="Is" />
                      </div>
                    ) : null}

                    {condition.criteriaType === 'question' ? (
                      condition.surveyQuestionId !== null ? (
                        renderValueField(group.id, condition)
                      ) : null
                    ) : (
                          <div className={styles.field}>
                            <span className={styles.fieldLabel}>Value</span>
                            <WuInput
                              variant="outlined"
                              placeholder="Enter your value"
                              value={condition.value}
                              onChange={(event) =>
                                updateCondition(group.id, condition.id, {
                                  value: event.target.value,
                                })
                              }
                              className={styles.valueInput}
                            />
                          </div>
                        )}

                    <div className={styles.conditionActions}>
                      <button
                        type="button"
                        className={styles.conditionActionBtn}
                        onClick={() => removeCondition(group.id, condition.id)}
                        aria-label="Remove condition"
                      >
                        <span className="wm-remove" aria-hidden />
                      </button>
                      <button
                        type="button"
                        className={styles.conditionActionBtn}
                        onClick={() => addAndCondition(group.id)}
                        aria-label="Add condition"
                      >
                        <span className="wm-add" aria-hidden />
                      </button>
                    </div>
                  </div>
                ))}

                <div className={styles.addOrButtonWrap}>
                  <button
                    type="button"
                    className={styles.addOrButton}
                    onClick={() => handleAddOrGroup('question')}
                  >
                    <span className="wm-add" aria-hidden />
                    Add OR condition
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className={styles.responseCountFooter} aria-live="polite">
        <span className={styles.responseCountLabel}>Responses:</span>
        <span className={styles.responseCountValue}>
          {responseCount.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
