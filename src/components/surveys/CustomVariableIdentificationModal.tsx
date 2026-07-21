'use client';

import dynamic from 'next/dynamic';
import { useWickUILib } from '@/components/ui/useWickUILib';
import {
  CUSTOM_VARIABLE_IDENTIFICATION_OPTIONS,
  type CustomVariableIdentificationId,
} from '@/data/mock-survey-settings';
import styles from './CustomVariableIdentificationModal.module.css';

const WuToggle = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuToggle })),
  { ssr: false }
);
const WuSelect = dynamic(
  () => import('@npm-questionpro/wick-ui-lib').then((m) => ({ default: m.WuSelect })),
  { ssr: false }
);

interface CustomVariableIdentificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enabled: boolean;
  variable: CustomVariableIdentificationId;
  onEnabledChange: (enabled: boolean) => void;
  onVariableChange: (variable: CustomVariableIdentificationId) => void;
}

export function CustomVariableIdentificationModal({
  open,
  onOpenChange,
  enabled,
  variable,
  onEnabledChange,
  onVariableChange,
}: CustomVariableIdentificationModalProps) {
  const wick = useWickUILib();

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuButton } = wick;
  const selectedVariable =
    CUSTOM_VARIABLE_IDENTIFICATION_OPTIONS.find((option) => option.value === variable) ??
    CUSTOM_VARIABLE_IDENTIFICATION_OPTIONS[0];

  return (
    <WuModal open onOpenChange={onOpenChange} variant="action" className={styles.modal}>
      <WuModalHeader className={styles.header}>Custom Variable Identification</WuModalHeader>
      <WuModalContent className={styles.content}>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Enable identification</span>
          <WuToggle
            checked={enabled}
            onChange={onEnabledChange}
            aria-label="Custom Variable Identification"
          />
        </div>
        {enabled ? (
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Variable</span>
            <div className={styles.selectWrap}>
              <WuSelect
                data={CUSTOM_VARIABLE_IDENTIFICATION_OPTIONS}
                accessorKey={{ value: 'value', label: 'label' }}
                value={selectedVariable}
                onSelect={(item) => {
                  const selected = item as { value: CustomVariableIdentificationId } | null;
                  if (!selected) return;
                  onVariableChange(selected.value);
                }}
                variant="outlined"
                aria-label="Custom variable"
              />
            </div>
          </div>
        ) : null}
      </WuModalContent>
      <WuModalFooter>
        <WuButton onClick={() => onOpenChange(false)}>Done</WuButton>
      </WuModalFooter>
    </WuModal>
  );
}
