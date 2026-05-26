'use client';

import { useCallback, useState } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { AdvancedWidgetChartSelect } from '@/components/dashboards/AdvancedWidgetChartSelect';
import {
  AdvancedWidgetStepBreadcrumb,
  type AdvancedWidgetStep,
} from '@/components/dashboards/AdvancedWidgetStepBreadcrumb';
import {
  ADVANCED_WIDGET_TYPES,
  DEFAULT_ADVANCED_WIDGET_TYPE_ID,
  type AdvancedWidgetTypeId,
} from '@/data/mock-advanced-widget-types';
import { useWickUILib } from '@/components/ui/useWickUILib';
import styles from './AdvancedWidgetModal.module.css';

type ModalStep = AdvancedWidgetStep;

interface AdvancedWidgetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWidgetAdded?: () => void;
}

export function AdvancedWidgetModal({
  open,
  onOpenChange,
  onWidgetAdded,
}: AdvancedWidgetModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [step, setStep] = useState<ModalStep>('widget');
  const [widgetName, setWidgetName] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState<AdvancedWidgetTypeId>(
    DEFAULT_ADVANCED_WIDGET_TYPE_ID
  );

  const resetState = useCallback(() => {
    setStep('widget');
    setWidgetName('');
    setSelectedTypeId(DEFAULT_ADVANCED_WIDGET_TYPE_ID);
  }, []);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) resetState();
      onOpenChange(nextOpen);
    },
    [onOpenChange, resetState]
  );

  function handleClose(): void {
    handleOpenChange(false);
  }

  function handleBreadcrumbClick(target: AdvancedWidgetStep): void {
    if (target === 'widget') {
      setStep('widget');
    } else if (target === 'chart') {
      setStep('chart');
    }
  }

  function handleNext(): void {
    const selectedType = ADVANCED_WIDGET_TYPES.find((t) => t.id === selectedTypeId);
    if (step === 'widget') {
      setStep('chart');
      return;
    }
    if (step === 'chart') {
      setStep('details');
      return;
    }
    showToast({
      message: widgetName.trim()
        ? `Widget "${widgetName.trim()}" (${selectedType?.name ?? 'Widget'}) added`
        : `${selectedType?.name ?? 'Widget'} added to dashboard`,
      variant: 'success',
    });
    onWidgetAdded?.();
    handleClose();
  }

  function handleBack(): void {
    if (step === 'details') {
      setStep('chart');
      return;
    }
    if (step === 'chart') {
      setStep('widget');
      return;
    }
    handleClose();
  }

  const nextLabel = step === 'details' ? 'Finish' : 'Next';

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuButton } = wick;

  return (
    <WuModal
      open
      onOpenChange={handleOpenChange}
      className={styles.modal}
      variant="action"
    >
      <WuModalHeader className={styles.modalTitle}>Add widget</WuModalHeader>

      <WuModalContent className={styles.stepContent}>
        {step === 'widget' && (
          <AdvancedWidgetChartSelect
            widgetName={widgetName}
            selectedTypeId={selectedTypeId}
            onWidgetNameChange={setWidgetName}
            onSelectType={setSelectedTypeId}
          />
        )}
        {step === 'chart' && (
          <p className={styles.stepPlaceholder}>
            Configure chart settings for{' '}
            <strong>{ADVANCED_WIDGET_TYPES.find((t) => t.id === selectedTypeId)?.name}</strong>.
            (Prototype — full chart configuration is not built yet.)
          </p>
        )}
        {step === 'details' && (
          <p className={styles.stepPlaceholder}>
            Review widget details and finish adding your widget to the dashboard.
          </p>
        )}
      </WuModalContent>

      <WuModalFooter>
        <div className={styles.wizardFooter}>
          <AdvancedWidgetStepBreadcrumb
            currentStep={step}
            onStepClick={handleBreadcrumbClick}
          />
          <div className={styles.wizardActions}>
            <WuButton variant="secondary" onClick={handleBack}>
              Back
            </WuButton>
            <WuButton onClick={handleNext}>{nextLabel}</WuButton>
          </div>
        </div>
      </WuModalFooter>
    </WuModal>
  );
}
