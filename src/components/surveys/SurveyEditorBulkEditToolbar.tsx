'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { useSurveyEditorBulkEdit } from '@/components/surveys/SurveyEditorBulkEditContext';
import styles from './SurveyEditorBulkEditToolbar.module.css';

const WuCheckbox = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuCheckbox })),
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

const VALIDATION_OPTIONS = ['None', 'Request Response', 'Force Response'] as const;
const SEPARATOR_OPTIONS = ['Add Separator', 'Remove Separator'] as const;
const PAGE_BREAK_OPTIONS = ['Add Page Break', 'Remove Page Break'] as const;

function BulkEditActionMenu({
  label,
  options,
  onSelect,
}: {
  label: string;
  options: readonly string[];
  onSelect: (option: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <WuMenu
      open={open}
      onOpenChange={setOpen}
      align="start"
      variant="outlined"
      className={styles.actionMenu}
      Trigger={
        <button
          type="button"
          className={styles.actionMenuBtn}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          {label}
          <span className="wm-arrow-drop-down" aria-hidden />
        </button>
      }
    >
      {options.map((option) => (
        <WuMenuItem
          key={option}
          className={styles.actionMenuItem}
          onSelect={() => {
            onSelect(option);
            setOpen(false);
          }}
        >
          {option}
        </WuMenuItem>
      ))}
    </WuMenu>
  );
}

export function SurveyEditorBulkEditToolbar() {
  const { showToast } = useWuShowToast();
  const {
    disableBulkEditMode,
    selectAll,
    setSelectAll,
    expandAllLogic,
    setExpandAllLogic,
    selectedQuestionCount,
    hasBulkSelection,
  } = useSurveyEditorBulkEdit();

  const selectAllLabel =
    selectedQuestionCount > 0
      ? `${selectedQuestionCount} Question${selectedQuestionCount === 1 ? '' : 's'}`
      : 'Select All';

  function handleBulkAction(action: string) {
    showToast({ message: action, variant: 'success' });
  }

  return (
    <div className={styles.toolbar} role="toolbar" aria-label="Bulk edit mode controls">
      <div className={styles.left}>
        <label className={styles.checkboxField}>
          <WuCheckbox
            checked={selectAll}
            onChange={setSelectAll}
            aria-label={selectAllLabel}
          />
          {selectAllLabel}
        </label>
        <label className={styles.checkboxField}>
          <WuCheckbox
            checked={expandAllLogic}
            onChange={setExpandAllLogic}
            aria-label="Expand all logic"
          />
          Expand all logic
        </label>
      </div>

      {hasBulkSelection ? (
        <div className={styles.center}>
          <BulkEditActionMenu
            label="Validation"
            options={VALIDATION_OPTIONS}
            onSelect={(option) => handleBulkAction(`Validation: ${option}`)}
          />
          <BulkEditActionMenu
            label="Separator"
            options={SEPARATOR_OPTIONS}
            onSelect={(option) => handleBulkAction(option)}
          />
          <BulkEditActionMenu
            label="Page Break"
            options={PAGE_BREAK_OPTIONS}
            onSelect={(option) => handleBulkAction(option)}
          />
        </div>
      ) : (
        <div className={styles.centerSpacer} aria-hidden />
      )}

      <div className={styles.right}>
        <button
          type="button"
          className={styles.deleteBtn}
          onClick={() => showToast({ message: 'Delete selected', variant: 'success' })}
        >
          <span className="wm-delete" aria-hidden />
          Delete
        </button>
        <button
          type="button"
          className={styles.pdfBtn}
          aria-label="Download PDF"
          onClick={() => showToast({ message: 'PDF download started', variant: 'success' })}
        >
          <span className="wm-picture-as-pdf" aria-hidden />
        </button>
        <button
          type="button"
          className={styles.exitBulkEditBtn}
          onClick={disableBulkEditMode}
        >
          Exit Bulk Edit Mode
        </button>
      </div>
    </div>
  );
}
