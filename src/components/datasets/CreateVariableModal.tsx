'use client';

import { useEffect, useId, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  DATASET_VARIABLE_DATE_RANGE_PRESETS,
  DATASET_VARIABLE_RESPONSE_STATUS_OPTIONS,
} from '@/data/mock-dataset-create-variable';
import { MOCK_TEXT_AI_DASHBOARDS } from '@/data/mock-text-ai-dashboards';
import styles from './CreateVariableModal.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);
const WuCombobox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCombobox })),
  { ssr: false }
);
const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false }
);
const WuPopover = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuPopover })),
  { ssr: false }
);

export type CreateVariableSource = 'composite' | 'textai';

interface CreateVariableModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: { source: CreateVariableSource; name: string }) => void;
}

type ResponseStatusOption = (typeof DATASET_VARIABLE_RESPONSE_STATUS_OPTIONS)[number];

interface CategoryCriterion {
  id: string;
  label: string;
}

interface CategoryOption {
  id: string;
  name: string;
  collapsed: boolean;
  responseStatus: ResponseStatusOption;
  dateRangeLabel: string | null;
  criteria: CategoryCriterion[];
}

interface SourceCardProps {
  selected: boolean;
  iconClass: string;
  title: string;
  description: string;
  onSelect: () => void;
}

const TEXT_AI_OPTIONS = MOCK_TEXT_AI_DASHBOARDS.map((dashboard) => ({
  label: dashboard.name,
  value: String(dashboard.id),
}));

type TextAiOption = (typeof TEXT_AI_OPTIONS)[number];

let optionSeq = 1;
let criteriaSeq = 1;

function createOption(index: number): CategoryOption {
  return {
    id: `option-${optionSeq++}`,
    name: `Category value ${index}`,
    collapsed: false,
    responseStatus: DATASET_VARIABLE_RESPONSE_STATUS_OPTIONS[0],
    dateRangeLabel: null,
    criteria: [],
  };
}

function SourceCard({ selected, iconClass, title, description, onSelect }: SourceCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`${styles.sourceCard} ${selected ? styles.sourceCardSelected : ''}`}
      aria-pressed={selected}
    >
      <span className={`${iconClass} ${styles.sourceIcon}`} aria-hidden />
      <span className={styles.sourceText}>
        <span className={styles.sourceTitle}>{title}</span>
        <span className={styles.sourceDescription}>{description}</span>
      </span>
    </button>
  );
}

export function CreateVariableModal({
  open,
  onOpenChange,
  onCreate,
}: CreateVariableModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const variableId = useId();
  const [source, setSource] = useState<CreateVariableSource>('composite');
  const [variableName, setVariableName] = useState('');
  const [nameError, setNameError] = useState(false);
  const [options, setOptions] = useState<CategoryOption[]>([createOption(1)]);
  const [useDefault, setUseDefault] = useState(false);
  const [openDateOptionId, setOpenDateOptionId] = useState<string | null>(null);
  const [textAiOption, setTextAiOption] = useState<TextAiOption | null>(null);

  useEffect(() => {
    if (open) {
      optionSeq = 1;
      criteriaSeq = 1;
      setSource('composite');
      setVariableName('');
      setNameError(false);
      setOptions([createOption(1)]);
      setUseDefault(false);
      setOpenDateOptionId(null);
      setTextAiOption(null);
    }
  }, [open]);

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter } = wick;
  const canCreate =
    source === 'composite' ? Boolean(variableName.trim()) : Boolean(textAiOption);

  function updateOption(id: string, patch: Partial<CategoryOption>): void {
    setOptions((prev) =>
      prev.map((option) => (option.id === id ? { ...option, ...patch } : option))
    );
  }

  function handleAddOption(): void {
    setOptions((prev) => [...prev, createOption(prev.length + 1)]);
  }

  function handleRemoveOption(id: string): void {
    setOptions((prev) => {
      if (prev.length <= 1) {
        showToast({
          message: 'At least one category value is required.',
          variant: 'error',
        });
        return prev;
      }
      return prev.filter((option) => option.id !== id);
    });
  }

  function handleAddCriteria(optionId: string): void {
    const current = options.find((option) => option.id === optionId);
    const nextIndex = (current?.criteria.length ?? 0) + 1;
    updateOption(optionId, {
      criteria: [
        ...(current?.criteria ?? []),
        {
          id: `criteria-${criteriaSeq++}`,
          label: `Criteria ${nextIndex}`,
        },
      ],
      collapsed: false,
    });
  }

  function handleRemoveCriteria(optionId: string, criteriaId: string): void {
    const option = options.find((item) => item.id === optionId);
    if (!option) return;
    updateOption(optionId, {
      criteria: option.criteria.filter((item) => item.id !== criteriaId),
    });
  }

  function handleCreate(): void {
    if (source === 'composite') {
      const trimmed = variableName.trim();
      if (!trimmed) {
        setNameError(true);
        return;
      }
      onCreate({ source: 'composite', name: trimmed });
    } else {
      if (!textAiOption) return;
      onCreate({ source: 'textai', name: textAiOption.label });
    }
    onOpenChange(false);
  }

  return (
    <WuModal open onOpenChange={onOpenChange} className={styles.modal} variant="action">
      <WuModalHeader className={styles.modalTitle}>Create variable</WuModalHeader>
      <WuModalContent>
        <div className={styles.content}>
          <div className={styles.sourceGrid} role="group" aria-label="Variable source">
            <SourceCard
              selected={source === 'composite'}
              iconClass="wm-layers"
              title="Composite"
              description="Create a category variable with criteria"
              onSelect={() => setSource('composite')}
            />
            <SourceCard
              selected={source === 'textai'}
              iconClass="wc-ai"
              title="TextAI"
              description="Import the themes, sub-themes and sentiment for this dataset"
              onSelect={() => setSource('textai')}
            />
          </div>

          {source === 'composite' ? (
            <div className={styles.compositeBody}>
              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor={variableId}>
                  Variable <span className={styles.required}>*</span>
                </label>
                <WuInput
                  id={variableId}
                  variant="outlined"
                  placeholder="Variable 1"
                  value={variableName}
                  autoFocus
                  onChange={(event) => {
                    setVariableName(event.target.value);
                    if (nameError && event.target.value.trim()) {
                      setNameError(false);
                    }
                  }}
                  aria-invalid={nameError}
                />
                {nameError ? (
                  <span className={styles.required} style={{ fontSize: 12 }}>
                    Variable name is required
                  </span>
                ) : null}
              </div>

              <div className={styles.optionsList}>
                {options.map((option) => (
                  <div key={option.id} className={styles.optionCard}>
                    <div className={styles.optionHeader}>
                      <div className={styles.optionNameInput}>
                        <WuInput
                          variant="outlined"
                          value={option.name}
                          onChange={(event) =>
                            updateOption(option.id, { name: event.target.value })
                          }
                          aria-label="Category value"
                        />
                      </div>
                      <div className={styles.optionHeaderActions}>
                        <button
                          type="button"
                          className={styles.iconButton}
                          aria-label={
                            option.collapsed ? 'Expand category' : 'Collapse category'
                          }
                          onClick={() =>
                            updateOption(option.id, { collapsed: !option.collapsed })
                          }
                        >
                          <span
                            className={
                              option.collapsed
                                ? 'wm-keyboard-arrow-down'
                                : 'wm-keyboard-arrow-up'
                            }
                            aria-hidden
                          />
                        </button>
                        <button
                          type="button"
                          className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                          aria-label={`Delete ${option.name}`}
                          onClick={() => handleRemoveOption(option.id)}
                        >
                          <span className="wm-delete" aria-hidden />
                        </button>
                      </div>
                    </div>

                    {!option.collapsed ? (
                      <div className={styles.optionBody}>
                        <div className={styles.filtersRow}>
                          <div className={styles.inlineField}>
                            <span className={styles.inlineLabel}>Response status</span>
                            <div className={styles.selectWrap}>
                              <WuSelect
                                data={[...DATASET_VARIABLE_RESPONSE_STATUS_OPTIONS]}
                                accessorKey={{ value: 'value', label: 'label' }}
                                value={option.responseStatus}
                                onSelect={(item) =>
                                  updateOption(option.id, {
                                    responseStatus: item as ResponseStatusOption,
                                  })
                                }
                                variant="outlined"
                                aria-label="Response status"
                              />
                            </div>
                          </div>

                          <div className={styles.inlineField}>
                            <span className={styles.inlineLabel}>Filter by date</span>
                            <WuPopover
                              open={openDateOptionId === option.id}
                              onOpenChange={(nextOpen) =>
                                setOpenDateOptionId(nextOpen ? option.id : null)
                              }
                              align="start"
                              Trigger={
                                <button type="button" className={styles.menuTrigger}>
                                  <span className={styles.menuTriggerLabel}>
                                    {option.dateRangeLabel ?? 'Select date range'}
                                  </span>
                                  <span className="wm-calendar-today" aria-hidden />
                                </button>
                              }
                            >
                              <div className={styles.datePopover}>
                                {DATASET_VARIABLE_DATE_RANGE_PRESETS.map((preset) => (
                                  <button
                                    key={preset.value}
                                    type="button"
                                    className={styles.presetButton}
                                    onClick={() => {
                                      updateOption(option.id, {
                                        dateRangeLabel: preset.label,
                                      });
                                      setOpenDateOptionId(null);
                                    }}
                                  >
                                    {preset.label}
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  className={styles.presetButton}
                                  onClick={() => {
                                    updateOption(option.id, { dateRangeLabel: null });
                                    setOpenDateOptionId(null);
                                  }}
                                >
                                  Clear
                                </button>
                              </div>
                            </WuPopover>
                          </div>
                        </div>

                        {option.criteria.length > 0 ? (
                          <div className={styles.criteriaList}>
                            {option.criteria.map((criterion) => (
                              <div key={criterion.id} className={styles.criteriaRow}>
                                <span>{criterion.label}</span>
                                <button
                                  type="button"
                                  className={styles.criteriaRemove}
                                  aria-label={`Remove ${criterion.label}`}
                                  onClick={() =>
                                    handleRemoveCriteria(option.id, criterion.id)
                                  }
                                >
                                  <span className="wm-close" aria-hidden />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : null}

                        <button
                          type="button"
                          className={styles.addCriteriaBtn}
                          onClick={() => handleAddCriteria(option.id)}
                        >
                          <span className="wm-add" aria-hidden />
                          Add criteria
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              <div className={styles.footerActions}>
                <WuButton onClick={handleAddOption}>Add option</WuButton>
                <div className={styles.defaultToggle}>
                  <WuToggle
                    Label="Select a default category value"
                    labelPosition="right"
                    checked={useDefault}
                    onChange={setUseDefault}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.textAiPanel}>
              <p className={styles.textAiDescription}>
                Choose a TextAI dashboard to import the themes, sub-themes and sentiment for
                this dataset.
              </p>
              <WuCombobox
                data={TEXT_AI_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={textAiOption}
                onSelect={(item) => {
                  if (!item || Array.isArray(item)) return;
                  setTextAiOption(item as TextAiOption);
                }}
                placeholder="Select TextAI dashboard"
                variant="outlined"
                enableSearch
                maxHeight={280}
                noDataContent="No TextAI dashboards found"
                aria-label="Select TextAI dashboard"
              />
            </div>
          )}
        </div>
      </WuModalContent>
      <WuModalFooter>
        <WuButton onClick={handleCreate} disabled={!canCreate}>
          Create
        </WuButton>
      </WuModalFooter>
    </WuModal>
  );
}
