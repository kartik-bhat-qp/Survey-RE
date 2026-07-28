'use client';

import { useCallback, useState } from 'react';
import { useWuShowToast } from '@npm-questionpro/wick-ui-lib';
import { AdvancedWidgetChartSelect } from '@/components/dashboards/AdvancedWidgetChartSelect';
import {
  AdvancedWidgetStepBreadcrumb,
  type AdvancedWidgetStep,
} from '@/components/dashboards/AdvancedWidgetStepBreadcrumb';
import { WidgetQuestionSelection } from '@/components/dashboards/WidgetQuestionSelection';
import {
  ADVANCED_WIDGET_TYPES,
  DEFAULT_ADVANCED_WIDGET_TYPE_ID,
  type AdvancedWidgetTypeId,
} from '@/data/mock-advanced-widget-types';
import {
  resolvePickerSelection,
  type SurveyQuestion,
} from '@/data/mock-survey-questions';
import { DEFAULT_DASHBOARD_SURVEY } from '@/data/mock-survey-folders';
import { useWickUILib } from '@/components/ui/useWickUILib';
import styles from './AdvancedWidgetModal.module.css';

type ModalStep =
  | AdvancedWidgetStep
  | 'primary-question'
  | 'driver-question';

interface AdvancedWidgetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Survey used when picking primary / driver questions for Driver analysis. */
  surveyId?: number;
  onWidgetAdded?: () => void;
}

function breadcrumbStepFor(step: ModalStep): AdvancedWidgetStep {
  if (step === 'primary-question') return 'chart';
  if (step === 'driver-question') return 'details';
  return step;
}

export function AdvancedWidgetModal({
  open,
  onOpenChange,
  surveyId = DEFAULT_DASHBOARD_SURVEY.id,
  onWidgetAdded,
}: AdvancedWidgetModalProps) {
  const wick = useWickUILib();
  const { showToast } = useWuShowToast();
  const [step, setStep] = useState<ModalStep>('widget');
  const [widgetName, setWidgetName] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState<AdvancedWidgetTypeId>(
    DEFAULT_ADVANCED_WIDGET_TYPE_ID
  );
  const [primaryQuestion, setPrimaryQuestion] = useState<SurveyQuestion | null>(null);
  const [driverQuestions, setDriverQuestions] = useState<SurveyQuestion[]>([]);

  const resetState = useCallback(() => {
    setStep('widget');
    setWidgetName('');
    setSelectedTypeId(DEFAULT_ADVANCED_WIDGET_TYPE_ID);
    setPrimaryQuestion(null);
    setDriverQuestions([]);
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
      setPrimaryQuestion(null);
      setDriverQuestions([]);
      return;
    }
    if (target === 'chart') {
      if (selectedTypeId === 'driver-analysis') {
        setDriverQuestions([]);
        setStep('primary-question');
        return;
      }
      setStep('chart');
      return;
    }
  }

  function finishDriverAnalysis(
    primary: SurveyQuestion,
    drivers: SurveyQuestion[]
  ): void {
    const selectedType = ADVANCED_WIDGET_TYPES.find((t) => t.id === selectedTypeId);
    const name = widgetName.trim() || selectedType?.name || 'Driver analysis';
    const driverCodes = drivers.map((q) => q.code).join(', ');
    showToast({
      message: `Widget "${name}" added · Primary: ${primary.code} · Drivers: ${driverCodes}`,
      variant: 'success',
    });
    onWidgetAdded?.();
    handleClose();
  }

  function handlePrimaryQuestionSelect(question: SurveyQuestion): void {
    const { question: resolved } = resolvePickerSelection(question);
    setPrimaryQuestion(resolved);
    setDriverQuestions([]);
    setStep('driver-question');
  }

  function handleDriverQuestionToggle(question: SurveyQuestion, selected: boolean): void {
    const { question: resolved } = resolvePickerSelection(question);
    setDriverQuestions((prev) => {
      const without = prev.filter((q) => q.id !== resolved.id);
      if (!selected) return without;
      return [...without, resolved];
    });
  }

  function handleNext(): void {
    const selectedType = ADVANCED_WIDGET_TYPES.find((t) => t.id === selectedTypeId);
    if (step === 'widget') {
      if (selectedTypeId === 'driver-analysis') {
        setPrimaryQuestion(null);
        setDriverQuestions([]);
        setStep('primary-question');
        return;
      }
      setStep('chart');
      return;
    }
    if (step === 'driver-question') {
      if (!primaryQuestion || driverQuestions.length === 0) {
        showToast({
          message: 'Select at least one driver question',
          variant: 'error',
        });
        return;
      }
      finishDriverAnalysis(primaryQuestion, driverQuestions);
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
    if (step === 'driver-question') {
      setDriverQuestions([]);
      setStep('primary-question');
      return;
    }
    if (step === 'primary-question') {
      setPrimaryQuestion(null);
      setStep('widget');
      return;
    }
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

  const isDriverQuestionFlow =
    step === 'primary-question' || step === 'driver-question';
  const nextLabel =
    step === 'details' || step === 'driver-question' ? 'Finish' : 'Next';
  const showNext =
    !isDriverQuestionFlow || step === 'driver-question';
  const nextDisabled = step === 'driver-question' && driverQuestions.length === 0;
  const modalTitle =
    step === 'primary-question'
      ? 'Select primary question'
      : step === 'driver-question'
        ? 'Select driver question'
        : 'Add widget';

  if (!open || !wick) {
    return null;
  }

  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuButton } = wick;

  return (
    <WuModal
      open
      onOpenChange={handleOpenChange}
      className={isDriverQuestionFlow ? styles.modalWide : styles.modal}
      variant="action"
    >
      <WuModalHeader className={styles.modalTitle}>{modalTitle}</WuModalHeader>

      <WuModalContent className={styles.stepContent}>
        {step === 'widget' && (
          <AdvancedWidgetChartSelect
            widgetName={widgetName}
            selectedTypeId={selectedTypeId}
            onWidgetNameChange={setWidgetName}
            onSelectType={setSelectedTypeId}
          />
        )}
        {step === 'primary-question' && (
          <WidgetQuestionSelection
            surveyId={surveyId}
            selectedQuestionId={primaryQuestion?.id ?? null}
            onSelectQuestion={handlePrimaryQuestionSelect}
          />
        )}
        {step === 'driver-question' && (
          <WidgetQuestionSelection
            surveyId={surveyId}
            multiSelect
            selectedQuestionIds={driverQuestions.map((q) => q.id)}
            excludeQuestionIds={primaryQuestion ? [primaryQuestion.id] : []}
            onToggleQuestion={handleDriverQuestionToggle}
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
            currentStep={breadcrumbStepFor(step)}
            onStepClick={handleBreadcrumbClick}
          />
          <div className={styles.wizardActions}>
            <WuButton variant="secondary" onClick={handleBack}>
              Back
            </WuButton>
            {showNext ? (
              <WuButton onClick={handleNext} disabled={nextDisabled}>
                {nextLabel}
              </WuButton>
            ) : null}
          </div>
        </div>
      </WuModalFooter>
    </WuModal>
  );
}
