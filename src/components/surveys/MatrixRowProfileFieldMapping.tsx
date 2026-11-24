'use client';

import dynamic from 'next/dynamic';
import { plainTextFromRichValue } from '@/components/surveys/QuestionRichTextField';
import {
  CUSTOM_PROFILE_FIELD_OPTIONS,
  countMappedRows,
  type CustomProfileFieldId,
  type RowProfileFieldMap,
} from '@/data/mock-question-communities';
import type { SurveyMatrixRow } from '@/data/mock-survey-detail';
import panelStyles from './QuestionSettingsPanel.module.css';
import styles from './MatrixRowProfileFieldMapping.module.css';

const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

interface ProfileFieldOption {
  value: CustomProfileFieldId;
  label: string;
  disabled?: boolean;
}

export interface MatrixRowProfileFieldMappingProps {
  rows: SurveyMatrixRow[];
  mapping: RowProfileFieldMap;
  onChange: (mapping: RowProfileFieldMap) => void;
  disabled?: boolean;
}

export function MatrixRowProfileFieldMapping({
  rows,
  mapping,
  onChange,
  disabled = false,
}: MatrixRowProfileFieldMappingProps) {
  const rowIds = rows.map((row) => row.id);
  const mappedCount = countMappedRows(rowIds, mapping);

  function setRow(rowId: string, fieldId: CustomProfileFieldId): void {
    const next = { ...mapping };
    if (fieldId) next[rowId] = fieldId;
    else delete next[rowId];
    onChange(next);
  }

  function handleClear(): void {
    const next = { ...mapping };
    for (const rowId of rowIds) delete next[rowId];
    onChange(next);
  }

  return (
    <div className={panelStyles.field}>
      <div className={styles.header}>
        <span className={panelStyles.fieldLabel}>Map rows to profile fields</span>
        <span className={styles.count}>
          {mappedCount}/{rows.length} mapped
        </span>
      </div>
      <p className={styles.hint}>
        Each row saves to its own profile field. A field can be used by one row only.
      </p>

      {mappedCount > 0 ? (
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.linkBtn}
            onClick={handleClear}
            disabled={disabled}
          >
            Clear all
          </button>
        </div>
      ) : null}

      <ul className={styles.list}>
        {rows.map((row, index) => {
          const rowLabel = plainTextFromRichValue(row.label) || `Row ${index + 1}`;
          const current = mapping[row.id] ?? '';
          const usedElsewhere = new Set(
            rowIds.filter((id) => id !== row.id).map((id) => mapping[id]).filter(Boolean)
          );
          const options: ProfileFieldOption[] = CUSTOM_PROFILE_FIELD_OPTIONS.map((option) => ({
            ...option,
            disabled: option.value !== '' && usedElsewhere.has(option.value),
          }));
          const value = options.find((option) => option.value === current) ?? options[0];

          return (
            <li key={row.id} className={styles.item}>
              <span className={styles.rowLabel} title={rowLabel}>
                <span
                  className={`${styles.statusDot} ${current ? styles.statusDotMapped : ''}`}
                  aria-hidden
                />
                {rowLabel}
              </span>
              <div className={styles.select}>
                <WuSelect
                  data={options}
                  accessorKey={{ value: 'value', label: 'label' }}
                  value={value}
                  onSelect={(item) =>
                    setRow(row.id, (item as ProfileFieldOption).value)
                  }
                  variant="outlined"
                  disabled={disabled}
                  aria-label={`Profile field for ${rowLabel}`}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
