'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  parseSelectedValues,
  toggleValueSelection,
  VALUE_SEPARATOR,
} from '@/data/mock-criteria-engine';
import styles from './CriteriaBasedQuotaModal.module.css';

const WuMenu = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuMenu })),
  { ssr: false }
);
const WuMenuCheckboxItem = dynamic(
  () =>
    import('@npm-questionpro/wick-ui-lib').then((m) => ({
      default: m.WuMenuCheckboxItem,
    })),
  { ssr: false }
);

export interface OptionMultiSelectItem {
  value: string;
  label: string;
}

interface OptionMultiSelectProps {
  options: OptionMultiSelectItem[];
  value: string;
  onChange: (next: string) => void;
  triggerClassName?: string;
  placeholder?: string;
}

export function OptionMultiSelect({
  options,
  value,
  onChange,
  triggerClassName = styles.menuTrigger,
  placeholder = '- Select -',
}: OptionMultiSelectProps) {
  const [search, setSearch] = useState('');
  const selectedValues = parseSelectedValues(value);
  const filtered = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.trim().toLowerCase())
  );
  const allFilteredSelected =
    filtered.length > 0 && filtered.every((opt) => selectedValues.includes(opt.value));

  const labelByValue = new Map(options.map((opt) => [opt.value, opt.label]));
  const selectedLabels = selectedValues
    .map((id) => labelByValue.get(id))
    .filter((label): label is string => label !== undefined);

  const triggerLabel =
    selectedLabels.length === 0
      ? placeholder
      : selectedLabels.length === 1
        ? selectedLabels[0]
        : `${selectedLabels.length} selected`;

  function handleSelectAllToggle(): void {
    if (allFilteredSelected) {
      const filteredValues = new Set(filtered.map((opt) => opt.value));
      const remaining = selectedValues.filter((id) => !filteredValues.has(id));
      onChange(remaining.join(VALUE_SEPARATOR));
    } else {
      const merged = Array.from(
        new Set([...selectedValues, ...filtered.map((opt) => opt.value)])
      );
      onChange(merged.join(VALUE_SEPARATOR));
    }
  }

  return (
    <WuMenu
      Trigger={
        <button
          type="button"
          className={triggerClassName}
          title={selectedLabels.length > 0 ? selectedLabels.join(', ') : undefined}
        >
          <span className={styles.menuTriggerLabel}>{triggerLabel}</span>
          <span className={`wm-keyboard-arrow-down ${styles.menuCaret}`} aria-hidden />
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
            key={opt.value}
            checked={selectedValues.includes(opt.value)}
            onSelect={() => onChange(toggleValueSelection(value, opt.value))}
            preventCloseOnSelect
          >
            {opt.label}
          </WuMenuCheckboxItem>
        ))
      )}
    </WuMenu>
  );
}
