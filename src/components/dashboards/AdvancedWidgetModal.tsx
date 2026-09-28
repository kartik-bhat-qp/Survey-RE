'use client';

import { useCallback, useMemo, useState } from 'react';
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
import { AiDataSourceSelection } from '@/components/dashboards/AiDataSourceSelection';
import { DEFAULT_DASHBOARD_SURVEY, type SurveyListItem } from '@/data/mock-survey-folders';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { adaptHeatmapQuestions, createAdvancedHeatmapConfig, type AdvancedHeatmapConfig, type AnalysisMode } from '@/data/advanced-heatmap';
import { getQuestionsBySurvey } from '@/data/mock-survey-questions';
import { AddWidgetStepBreadcrumb } from './AddWidgetStepBreadcrumb';
import { HeatmapQuestionPicker, HeatmapAnalysisPicker } from './advanced-heatmap/HeatmapSetup';
import type { BuiltWidget } from '@/data/ai-widget-builder';
import builderStyles from './ai-builder/Builder.module.css';
import styles from './AdvancedWidgetModal.module.css';

type ModalStep =
  | AdvancedWidgetStep
  | 'heatmap-survey'
  | 'heatmap-questions'
  | 'heatmap-analysis'
  | 'primary-question'
  | 'driver-question';

interface AdvancedWidgetModalProps {
  builtWidgets?: BuiltWidget[];
  onReuseBuiltWidget?: (widget: BuiltWidget) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Survey used when picking primary / driver questions for Driver analysis. */
  surveyId?: number;
  onWidgetAdded?: () => void;
  onAdvancedHeatmapCreated?: (config: AdvancedHeatmapConfig) => void;
}

function breadcrumbStepFor(step: ModalStep): AdvancedWidgetStep {
  if (step === 'heatmap-survey') return 'chart';
  if (step === 'heatmap-questions') return 'chart';
  if (step === 'heatmap-analysis') return 'details';
  if (step === 'primary-question') return 'chart';
  if (step === 'driver-question') return 'details';
  return step;
}

export function AdvancedWidgetModal({
  builtWidgets = [], onReuseBuiltWidget,
  open,
  onOpenChange,
  surveyId = DEFAULT_DASHBOARD_SURVEY.id,
  onWidgetAdded,
  onAdvancedHeatmapCreated,
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

  const [heatmapSurvey, setHeatmapSurvey] = useState<SurveyListItem | null>(null);
  const [heatmapRows, setHeatmapRows] = useState<string[]>([]);
  const [heatmapMode, setHeatmapMode] = useState<AnalysisMode>('distribution');
  const heatmapQuestions = useMemo(() => adaptHeatmapQuestions(getQuestionsBySurvey(heatmapSurvey?.id ?? surveyId)), [heatmapSurvey?.id, surveyId]);

  const resetState = useCallback(() => {
    setStep('widget');
    setHeatmapSurvey(null);
    setHeatmapRows([]);
    setHeatmapMode('distribution');
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
      if (selectedTypeId === 'advanced-heatmap') { setStep('heatmap-survey'); return; }
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
    if (step === 'heatmap-questions') { setStep('heatmap-analysis'); return; }
    if (step === 'heatmap-analysis') {
      onAdvancedHeatmapCreated?.(createAdvancedHeatmapConfig(heatmapSurvey!.id, widgetName, heatmapRows, heatmapMode, heatmapQuestions, `advanced-heatmap-${crypto.randomUUID()}`));
      showToast({ message: 'Advanced Heatmap created for this session', variant: 'success' });
      handleClose(); return;
    }
    if (step === 'widget') {
      if (selectedTypeId === 'advanced-heatmap') { setStep('heatmap-survey'); return; }
      if (selectedTypeId === 'heat-map') {
        showToast({ message: 'This prototype includes one fixed Heat Map Chart on each dashboard tab. Configure that widget from its Settings menu.', variant: 'info' });
        handleClose();
        return;
      }
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
    if (step === 'heatmap-analysis') { setStep('heatmap-questions'); return; }
    if (step === 'heatmap-questions') { setStep('heatmap-survey'); return; }
    if (step === 'heatmap-survey') { setStep('widget'); return; }
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
    step === 'heatmap-analysis' ? 'Create widget' : step === 'details' || step === 'driver-question' ? 'Finish' : 'Next';
  const showNext =
    step !== 'heatmap-survey' && (!isDriverQuestionFlow || step === 'driver-question');
  const nextDisabled = (step === 'driver-question' && driverQuestions.length === 0) || (step === 'heatmap-questions' && heatmapRows.length === 0);
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

      <WuModalContent className={`${styles.stepContent} ${step === 'heatmap-analysis' ? styles.analysisStep : ''}`}>
        {step === 'widget' && builtWidgets.length > 0 && <section className={builderStyles.library}><h3>Built with AI <span className={builderStyles.muted}>· This session</span></h3>{builtWidgets.map(widget => <div key={widget.id} className={builderStyles.libraryRow}><span>{widget.settings.name}<small className={builderStyles.muted}> · {widget.source.name}</small></span><button className={builderStyles.secondary} onClick={() => onReuseBuiltWidget?.(widget)}>Add to this tab</button></div>)}</section>}
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
        {step === 'heatmap-survey' && <AiDataSourceSelection selectedSurveyId={heatmapSurvey?.id ?? null} onSelectSurvey={survey => { if (survey.id !== heatmapSurvey?.id) setHeatmapRows([]); setHeatmapSurvey(survey); setStep('heatmap-questions'); }} />}
        {step === 'heatmap-questions' && <HeatmapQuestionPicker surveyId={heatmapSurvey?.id ?? surveyId} questions={heatmapQuestions} selected={heatmapRows} onChange={setHeatmapRows} />}
        {step === 'heatmap-analysis' && <div style={{ padding: 24 }}><h3>Choose how to analyze your questions</h3><HeatmapAnalysisPicker mode={heatmapMode} onChange={setHeatmapMode} /><p style={{ color: '#6b7888', fontSize: 13 }}>You can switch analysis types later in Analytics.</p></div>}
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
          {selectedTypeId === 'advanced-heatmap' ? <AddWidgetStepBreadcrumb chartLabel="Analysis" currentStep={step === 'heatmap-survey' ? 'survey' : step === 'heatmap-questions' ? 'question' : step === 'heatmap-analysis' ? 'chart' : 'widget'} onStepClick={target => setStep(target === 'survey' ? 'heatmap-survey' : target === 'question' ? 'heatmap-questions' : 'widget')} /> : <AdvancedWidgetStepBreadcrumb
            currentStep={breadcrumbStepFor(step)}
            onStepClick={handleBreadcrumbClick}
          />}
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
