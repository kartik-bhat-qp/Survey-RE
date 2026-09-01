'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  createTextAiWidgetDisplayState,
  DEFAULT_TEXT_AI_WIDGET_TOP_N,
  DEFAULT_TEXT_AI_WIDGET_VARIANCE_PERCENT,
  getTextAiWidgetCustomModeOption,
  getTextAiWidgetDisplaySelectOption,
  getTextAiWidgetDisplaySelectOptions,
  parseTextAiWidgetDisplayChoice,
  TEXT_AI_WIDGET_CUSTOM_MODE_OPTIONS,
  TEXT_AI_WIDGET_CUSTOM_SELECTION_MAX,
  type TextAiWidgetCustomMode,
  type TextAiWidgetCustomModeOption,
  type TextAiWidgetDisplaySelectOption,
  type TextAiWidgetDisplayState,
  type TextAiWidgetSelectionItem,
  type TextAiWidgetTopN,
} from '@/data/mock-text-ai-widget-settings';
import styles from './TextAiWidgetSettingsModal.module.css';

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);
const WuLabel = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuLabel })),
  { ssr: false }
);
const WuCheckbox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCheckbox })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);

interface TextAiWidgetSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topN?: TextAiWidgetTopN;
  displayState?: TextAiWidgetDisplayState;
  customItems?: TextAiWidgetSelectionItem[];
  onSave: (display: TextAiWidgetDisplayState) => void;
}

export function TextAiWidgetSettingsModal({
  open,
  onOpenChange,
  topN = DEFAULT_TEXT_AI_WIDGET_TOP_N,
  displayState,
  customItems = [],
  onSave,
}: TextAiWidgetSettingsModalProps) {
  const wick = useWickUILib();
  const includeCustom = customItems.length > 0;
  const initialState =
    displayState ?? createTextAiWidgetDisplayState(topN, customItems.map((item) => item.id));
  const [draft, setDraft] = useState<TextAiWidgetDisplayState>(initialState);

  useEffect(() => {
    if (!open) return;
    setDraft(
      displayState ?? createTextAiWidgetDisplayState(topN, customItems.map((item) => item.id))
    );
  }, [customItems, displayState, open, topN]);

  const displayOptions = useMemo(
    () => getTextAiWidgetDisplaySelectOptions(includeCustom),
    [includeCustom]
  );
  const selectedDisplayOption = getTextAiWidgetDisplaySelectOption(draft.value, includeCustom);
  const selectedCustomMode = getTextAiWidgetCustomModeOption(draft.customMode);
  const selectionCap = Math.min(
    TEXT_AI_WIDGET_CUSTOM_SELECTION_MAX,
    customItems.length
  );
  const atSelectionMax = draft.selectedIds.length >= selectionCap;
  const allSelected =
    customItems.length > 0 &&
    (customItems.length <= TEXT_AI_WIDGET_CUSTOM_SELECTION_MAX
      ? customItems.every((item) => draft.selectedIds.includes(item.id))
      : draft.selectedIds.length >= TEXT_AI_WIDGET_CUSTOM_SELECTION_MAX);

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuModalClose, WuButton } =
    wick;

  function patch(next: Partial<TextAiWidgetDisplayState>): void {
    setDraft((current) => ({ ...current, ...next }));
  }

  function handleSave(): void {
    const variancePercent = Number.isFinite(draft.variancePercent)
      ? Math.min(100, Math.max(1, Math.round(draft.variancePercent)))
      : DEFAULT_TEXT_AI_WIDGET_VARIANCE_PERCENT;
    onSave({
      ...draft,
      selectedIds: draft.selectedIds.slice(0, TEXT_AI_WIDGET_CUSTOM_SELECTION_MAX),
      variancePercent,
    });
    onOpenChange(false);
  }

  function toggleItem(id: string, checked: boolean): void {
    if (checked && draft.selectedIds.length >= TEXT_AI_WIDGET_CUSTOM_SELECTION_MAX) {
      return;
    }
    patch({
      selectedIds: checked
        ? [...draft.selectedIds, id]
        : draft.selectedIds.filter((value) => value !== id),
    });
  }

  return (
    <WuModal open onOpenChange={onOpenChange} size={includeCustom ? 'md' : 'sm'}>
      <WuModalHeader>Widget settings</WuModalHeader>
      <WuModalContent>
        <div className={styles.content}>
          <p className={styles.description}>
            Choose how many themes or topics to show in this widget.
          </p>
          <div className={styles.fields}>
            <div className={styles.field}>
              <WuLabel className={styles.label}>Display</WuLabel>
              <WuSelect
                data={displayOptions}
                accessorKey={{ value: 'value', label: 'label' }}
                value={selectedDisplayOption}
                onSelect={(option) => {
                  if (!option) return;
                  const next = option as TextAiWidgetDisplaySelectOption;
                  patch({ value: parseTextAiWidgetDisplayChoice(next.value) });
                }}
                variant="outlined"
              />
            </div>

            {draft.value === 'custom' && includeCustom ? (
              <div className={styles.field}>
                <WuLabel className={styles.label}>Custom selection</WuLabel>
                <WuSelect
                  data={[...TEXT_AI_WIDGET_CUSTOM_MODE_OPTIONS]}
                  accessorKey={{ value: 'value', label: 'label' }}
                  value={selectedCustomMode}
                  onSelect={(option) => {
                    if (!option) return;
                    const next = option as TextAiWidgetCustomModeOption;
                    patch({ customMode: next.value as TextAiWidgetCustomMode });
                  }}
                  variant="outlined"
                  aria-label="Custom selection type"
                />
              </div>
            ) : null}
          </div>

          {draft.value === 'custom' && includeCustom ? (
            draft.customMode === 'manual' ? (
                <div className={styles.picker}>
                  <div className={styles.pickerToolbar}>
                    <span className={styles.pickerCount}>
                      {draft.selectedIds.length} of {selectionCap} selected
                    </span>
                    <button
                      type="button"
                      className={styles.pickerAction}
                      onClick={() =>
                        patch({
                          selectedIds: allSelected
                            ? []
                            : customItems
                                .slice(0, TEXT_AI_WIDGET_CUSTOM_SELECTION_MAX)
                                .map((item) => item.id),
                        })
                      }
                    >
                      {allSelected
                        ? 'Clear all'
                        : customItems.length > TEXT_AI_WIDGET_CUSTOM_SELECTION_MAX
                          ? 'Select 20'
                          : 'Select all'}
                    </button>
                  </div>
                  <div className={styles.pickerList} role="group" aria-label="Sub-themes">
                    {customItems.map((item) => {
                      const checked = draft.selectedIds.includes(item.id);
                      return (
                        <div key={item.id} className={styles.pickerItem}>
                          <WuCheckbox
                            checked={checked}
                            disabled={!checked && atSelectionMax}
                            onChange={(isChecked) => toggleItem(item.id, isChecked)}
                            aria-label={item.label}
                          />
                          <button
                            type="button"
                            className={styles.pickerCopy}
                            disabled={!checked && atSelectionMax}
                            onClick={() => toggleItem(item.id, !checked)}
                          >
                            <span className={styles.pickerLabel}>{item.label}</span>
                            {item.parentLabel ? (
                              <span className={styles.pickerParent}>{item.parentLabel}</span>
                            ) : null}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
            ) : (
                <div className={styles.varianceField}>
                  <WuLabel className={styles.label}>Variance</WuLabel>
                  <div className={styles.varianceInputRow}>
                    <WuInput
                      variant="outlined"
                      type="number"
                      min={1}
                      max={100}
                      value={String(draft.variancePercent)}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        const next = Number(event.target.value);
                        patch({
                          variancePercent: Number.isFinite(next) ? next : draft.variancePercent,
                        });
                      }}
                      aria-label="Variance percent"
                    />
                    <span className={styles.percentSuffix}>%</span>
                  </div>
                  <p className={styles.hint}>
                    Any theme that moved {draft.variancePercent || 10}% higher or lower is shown.
                  </p>
                </div>
            )
          ) : null}
        </div>
      </WuModalContent>
      <WuModalFooter>
        <WuModalClose variant="secondary">Cancel</WuModalClose>
        <WuButton onClick={handleSave}>Save</WuButton>
      </WuModalFooter>
    </WuModal>
  );
}
