'use client';

import { useEffect, useId, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { AddVariableMappingModal } from '@/components/surveys/AddVariableMappingModal';
import {
  createDefaultSystemVariableMappings,
  createEmptySystemVariableMapping,
  getAvailableSystemVariableOptions,
  SYSTEM_VARIABLE_MAPPING_HELP,
  SYSTEM_VARIABLE_OPTIONS,
  SYSTEM_VARIABLE_SELECT_PLACEHOLDER,
  type SystemVariableMappingRow,
  type SystemVariableOption,
} from '@/data/mock-survey-variables';
import styles from './SurveyVariablesDashboard.module.css';

const WuButton = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuButton })),
  { ssr: false }
);
const WuInput = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuInput })),
  { ssr: false }
);
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

interface SurveyVariablesDashboardProps {
  surveyId: number;
}

interface VariableSelectProps {
  options: SystemVariableOption[];
  value: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (option: SystemVariableOption) => void;
  ariaLabel: string;
}

function VariableSelect({
  options,
  value,
  open,
  onOpenChange,
  onSelect,
  ariaLabel,
}: VariableSelectProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const label = value || SYSTEM_VARIABLE_SELECT_PLACEHOLDER;

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent): void {
      if (!rootRef.current?.contains(event.target as Node)) {
        onOpenChange(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        onOpenChange(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  return (
    <div className={styles.variableSelect} ref={rootRef}>
      <button
        type="button"
        className={`${styles.variableSelectTrigger} ${
          !value ? styles.variableSelectPlaceholder : ''
        } ${open ? styles.variableSelectTriggerOpen : ''}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => onOpenChange(!open)}
      >
        <span className={styles.variableSelectLabel}>{label}</span>
        <span className={`wm-arrow-drop-down ${styles.variableSelectCaret}`} aria-hidden />
      </button>

      {open ? (
        <ul id={listId} className={styles.variableSelectMenu} role="listbox" tabIndex={-1}>
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <li key={option.value} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`${styles.variableSelectOption} ${
                    selected ? styles.variableSelectOptionSelected : ''
                  }`}
                  onClick={() => {
                    onSelect(option);
                    onOpenChange(false);
                  }}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export function SurveyVariablesDashboard({ surveyId: _surveyId }: SurveyVariablesDashboardProps) {
  const { showToast } = useWuShowToast();
  const [rows, setRows] = useState<SystemVariableMappingRow[]>(() =>
    createDefaultSystemVariableMappings()
  );
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  function updateRow(
    rowId: string,
    patch: Partial<Pick<SystemVariableMappingRow, 'variable' | 'displayName' | 'code'>>
  ): void {
    setRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, ...patch } : row))
    );
  }

  function handleVariableSelect(rowId: string, option: SystemVariableOption): void {
    setRows((prev) => {
      const next = prev.map((row) =>
        row.id === rowId ? { ...row, variable: option.value } : row
      );
      const targetIndex = next.findIndex((row) => row.id === rowId);
      const isLastRow = targetIndex === next.length - 1;
      const hasOpenSelectRow = next.some((row) => !row.variable);
      const canAddMore = next.filter((row) => row.variable).length < SYSTEM_VARIABLE_OPTIONS.length;

      if (isLastRow && !hasOpenSelectRow && canAddMore) {
        next.push(createEmptySystemVariableMapping());
      }
      return next;
    });
  }

  function handleAddMappingInBulk(): void {
    setBulkModalOpen(true);
  }

  function handleBulkImported(): void {
    setRows((prev) => {
      const nextRows = [...prev];
      const openSlots = SYSTEM_VARIABLE_OPTIONS.length - nextRows.filter((row) => row.variable).length;
      const emptyRows = nextRows.filter((row) => !row.variable).length;
      const toAdd = Math.min(2, Math.max(0, openSlots - emptyRows));
      for (let i = 0; i < toAdd; i += 1) {
        nextRows.push(createEmptySystemVariableMapping());
      }
      return nextRows;
    });
  }

  function handleSaveChanges(): void {
    showToast({ message: 'Variable mappings saved', variant: 'success' });
  }

  function handleResetMapping(): void {
    setOpenRowId(null);
    setRows(createDefaultSystemVariableMappings());
    showToast({ message: 'Variable mappings reset', variant: 'success' });
  }

  return (
    <div className={styles.workspace}>
      <div className={styles.panel}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>System Variable Mapping</h1>
          <WuTooltip content={SYSTEM_VARIABLE_MAPPING_HELP} position="top">
            <button
              type="button"
              className={styles.helpBtn}
              aria-label={SYSTEM_VARIABLE_MAPPING_HELP}
            >
              <span className="wm-help-outline" aria-hidden />
            </button>
          </WuTooltip>
        </div>

        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <div className={styles.colVariable}>
              <span>Variable</span>
              <span className={`wm-swap-vert ${styles.sortIcon}`} aria-hidden />
            </div>
            <div className={styles.colDisplayName}>Display Name</div>
            <div className={styles.colCode}>Code</div>
            <div className={styles.colBulk}>
              <button
                type="button"
                className={styles.bulkLink}
                onClick={handleAddMappingInBulk}
              >
                + Add Mapping in Bulk
              </button>
            </div>
          </div>

          <div className={styles.tableBody}>
            {rows.map((row) => {
              const availableOptions = getAvailableSystemVariableOptions(rows, row.id);

              return (
                <div key={row.id} className={styles.tableRow}>
                  <div className={styles.colVariable}>
                    <VariableSelect
                      options={availableOptions}
                      value={row.variable}
                      open={openRowId === row.id}
                      onOpenChange={(nextOpen) =>
                        setOpenRowId(nextOpen ? row.id : null)
                      }
                      onSelect={(option) => handleVariableSelect(row.id, option)}
                      ariaLabel={`Variable for ${row.displayName || row.variable || 'new mapping'}`}
                    />
                  </div>
                  <div className={styles.colDisplayName}>
                    <WuInput
                      variant="outlined"
                      placeholder="Display Name"
                      value={row.displayName}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                        updateRow(row.id, { displayName: event.target.value })
                      }
                      aria-label={`Display name for ${row.variable || 'new mapping'}`}
                    />
                  </div>
                  <div className={styles.colCode}>
                    <WuInput
                      variant="outlined"
                      placeholder="Code"
                      value={row.code}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                        updateRow(row.id, { code: event.target.value })
                      }
                      aria-label={`Code for ${row.variable || 'new mapping'}`}
                      className={styles.codeInput}
                    />
                  </div>
                  <div className={styles.colBulk} aria-hidden />
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.footer}>
          <WuButton onClick={handleSaveChanges}>Save Changes</WuButton>
          <button type="button" className={styles.resetLink} onClick={handleResetMapping}>
            Reset Mapping
          </button>
        </div>
      </div>

      <AddVariableMappingModal
        open={bulkModalOpen}
        onOpenChange={setBulkModalOpen}
        onImported={handleBulkImported}
      />
    </div>
  );
}
