'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  ANONYMITY_CUSTOM_VARIABLES,
  ANONYMITY_REQUIRED_STANDARD_FIELD,
  ANONYMITY_STANDARD_FIELDS,
  ensureRequiredAnonymityFields,
  RAA_CANNOT_DISABLE_MESSAGE,
  RESPONDENT_EMAIL_LOCKED_MESSAGE,
  type AnonymityStandardFieldId,
  type RespondentAnonymityConfig,
} from '@/data/mock-survey-settings';
import styles from './RespondentAnonymityModal.module.css';

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
const WuTooltip = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuTooltip })),
  { ssr: false }
);

const HELP_TOOLTIP =
  'Choose which respondent identifiers to anonymize. Anonymized fields are removed from response data.';

interface RespondentAnonymityModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: RespondentAnonymityConfig;
  onSave: (next: RespondentAnonymityConfig) => void;
  /**
   * When true, already-selected fields/variables cannot be turned off —
   * only additional items can be enabled.
   */
  expandOnly?: boolean;
}

export function RespondentAnonymityModal({
  open,
  onOpenChange,
  value,
  onSave,
  expandOnly = false,
}: RespondentAnonymityModalProps) {
  const wick = useWickUILib();
  const [draft, setDraft] = useState<RespondentAnonymityConfig>(() =>
    ensureRequiredAnonymityFields(value)
  );

  const lockedStandardFields = useMemo(() => {
    const locked = new Set<AnonymityStandardFieldId>([ANONYMITY_REQUIRED_STANDARD_FIELD]);
    if (expandOnly) {
      value.standardFields.forEach((id) => locked.add(id));
    }
    return locked;
  }, [expandOnly, value.standardFields]);

  const lockedCustomVariableIds = useMemo(() => {
    if (!expandOnly) return new Set<string>();
    return new Set(value.customVariableIds);
  }, [expandOnly, value.customVariableIds]);

  useEffect(() => {
    if (!open) return;
    setDraft(ensureRequiredAnonymityFields(value));
  }, [open, value]);

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuButton } = wick;

  function toggleStandardField(fieldId: AnonymityStandardFieldId): void {
    if (lockedStandardFields.has(fieldId)) return;
    setDraft((prev) => {
      const has = prev.standardFields.includes(fieldId);
      return {
        ...prev,
        standardFields: has
          ? prev.standardFields.filter((id) => id !== fieldId)
          : [...prev.standardFields, fieldId],
      };
    });
  }

  function toggleCustomVariable(variableId: string): void {
    if (lockedCustomVariableIds.has(variableId)) return;
    setDraft((prev) => {
      const has = prev.customVariableIds.includes(variableId);
      return {
        ...prev,
        customVariableIds: has
          ? prev.customVariableIds.filter((id) => id !== variableId)
          : [...prev.customVariableIds, variableId],
      };
    });
  }

  const selectedCustomLabels = ANONYMITY_CUSTOM_VARIABLES.filter((variable) =>
    draft.customVariableIds.includes(variable.id)
  ).map((variable) => variable.label);

  const customTriggerLabel =
    selectedCustomLabels.length === 0
      ? 'Select'
      : selectedCustomLabels.length === 1
        ? selectedCustomLabels[0]
        : `${selectedCustomLabels.length} selected`;

  function handleCancel(): void {
    onOpenChange(false);
  }

  function handleSave(): void {
    onSave(ensureRequiredAnonymityFields(draft));
  }

  function lockedFieldTooltip(fieldId: AnonymityStandardFieldId): string {
    if (fieldId === ANONYMITY_REQUIRED_STANDARD_FIELD && !expandOnly) {
      return RESPONDENT_EMAIL_LOCKED_MESSAGE;
    }
    return RAA_CANNOT_DISABLE_MESSAGE;
  }

  return (
    <WuModal open onOpenChange={onOpenChange} variant="action" className={styles.modal}>
      <WuModalHeader className={styles.header}>
        <span className={styles.headerTitleRow}>
          <span>Respondent Anonymity Assurance</span>
          <WuTooltip content={HELP_TOOLTIP} position="bottom">
            <span className={styles.helpIcon} aria-label={HELP_TOOLTIP}>
              <span className="wm-help" aria-hidden />
            </span>
          </WuTooltip>
        </span>
      </WuModalHeader>
      <WuModalContent className={styles.content}>
        <section className={styles.section} aria-labelledby="anonymity-standard-fields">
          <h3 id="anonymity-standard-fields" className={styles.sectionTitle}>
            Standard Fields
          </h3>
          <ul className={styles.fieldList}>
            {ANONYMITY_STANDARD_FIELDS.map((field) => {
              const isLocked = lockedStandardFields.has(field.id);
              const checked = isLocked || draft.standardFields.includes(field.id);
              const row = (
                <label
                  className={`${styles.checkboxRow} ${
                    isLocked ? styles.checkboxRowLocked : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={checked}
                    disabled={isLocked}
                    onChange={() => toggleStandardField(field.id)}
                  />
                  <span>{field.label}</span>
                </label>
              );

              return (
                <li key={field.id}>
                  {isLocked ? (
                    <WuTooltip content={lockedFieldTooltip(field.id)} position="bottom">
                      <span className={styles.lockedFieldWrap}>{row}</span>
                    </WuTooltip>
                  ) : (
                    row
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <section className={styles.section} aria-labelledby="anonymity-custom-variables">
          <h3 id="anonymity-custom-variables" className={styles.sectionTitle}>
            Custom Variables
          </h3>
          <WuMenu
            Trigger={
              <button
                type="button"
                className={styles.menuTrigger}
                title={
                  selectedCustomLabels.length > 0
                    ? selectedCustomLabels.join(', ')
                    : undefined
                }
              >
                <span className={styles.menuTriggerLabel}>{customTriggerLabel}</span>
                <span
                  className={`wm-keyboard-arrow-down ${styles.menuCaret}`}
                  aria-hidden
                />
              </button>
            }
            align="start"
          >
            {ANONYMITY_CUSTOM_VARIABLES.map((variable) => {
              const isLocked = lockedCustomVariableIds.has(variable.id);
              const checked = isLocked || draft.customVariableIds.includes(variable.id);
              return (
                <WuMenuCheckboxItem
                  key={variable.id}
                  checked={checked}
                  onSelect={() => toggleCustomVariable(variable.id)}
                  preventCloseOnSelect
                >
                  {isLocked ? (
                    <WuTooltip content={RAA_CANNOT_DISABLE_MESSAGE} position="right">
                      <span className={styles.lockedMenuItem} title={RAA_CANNOT_DISABLE_MESSAGE}>
                        {variable.label}
                      </span>
                    </WuTooltip>
                  ) : (
                    variable.label
                  )}
                </WuMenuCheckboxItem>
              );
            })}
          </WuMenu>
        </section>
      </WuModalContent>
      <WuModalFooter>
        <div className={styles.footerActions}>
          <WuButton variant="secondary" onClick={handleCancel}>
            Cancel
          </WuButton>
          <WuButton onClick={handleSave}>Save</WuButton>
        </div>
      </WuModalFooter>
    </WuModal>
  );
}
