'use client';

import { StackSourcePicker } from '@/components/stacks/StackSourcePicker';
import { StackWidgetSetup } from '@/components/stacks/StackWidgetSetup';
import type { QuestionStack } from '@/data/question-stacks';
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
import type { AiWidgetConfig } from '@/data/mock-ai-widgets';
import { driverAnalysisWidgetTitle } from '@/data/mock-driver-analysis';
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
  | 'stack-source'
  | 'stack-setup'
  | 'heatmap-survey'
  | 'heatmap-questions'
  | 'heatmap-analysis'
  | 'primary-question'
  | 'driver-question';

/** One picker row chosen as a driver (parent question or matrix sub-row). */
interface DriverQuestionSelection {
  selectionId: number;
  questionId: number;
  code: string;
  name: string;
  matrixRows?: string[];
}

function toDriverSelections(
  items: DriverQuestionSelection[]
): NonNullable<AiWidgetConfig['driverAnalysis']>['drivers'] {
  const drivers: NonNullable<AiWidgetConfig['driverAnalysis']>['drivers'] = [];

  for (const item of items) {
    if (item.matrixRows && item.matrixRows.length > 0) {
      item.matrixRows.forEach((row, index) => {
        drivers.push({
          id: `${item.questionId}-row-${index}`,
          code: item.code,
          name: row,
        });
      });
      continue;
    }
    drivers.push({
      id: String(item.selectionId),
      code: item.code,
      name: item.name,
    });
  }

  return drivers;
}

interface AdvancedWidgetModalProps {
  builtWidgets?: BuiltWidget[];
  onReuseBuiltWidget?: (widget: BuiltWidget) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Survey used when picking primary / driver questions for Driver analysis. */
  surveyId?: number;
  /** `widget` is passed for widget types the canvas can render. */
  onWidgetAdded?: (widget?: AiWidgetConfig) => void;
  onAdvancedHeatmapCreated?: (config: AdvancedHeatmapConfig) => void;
}

function breadcrumbStepFor(step: ModalStep): AdvancedWidgetStep {
  if(step==='stack-source'||step==='stack-setup')return 'chart';
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
  const [selectedStack,setSelectedStack]=useState<QuestionStack|null>(null);
  const [step, setStep] = useState<ModalStep>('widget');
  const [widgetName, setWidgetName] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState<AdvancedWidgetTypeId>(
    DEFAULT_ADVANCED_WIDGET_TYPE_ID
  );
  const [primaryQuestion, setPrimaryQuestion] = useState<SurveyQuestion | null>(null);
  const [driverQuestions, setDriverQuestions] = useState<DriverQuestionSelection[]>([]);

  const [heatmapSurvey, setHeatmapSurvey] = useState<SurveyListItem | null>(null);
  const [heatmapRows, setHeatmapRows] = useState<string[]>([]);
  const [heatmapMode, setHeatmapMode] = useState<AnalysisMode>('distribution');
  const heatmapQuestions = useMemo(() => adaptHeatmapQuestions(getQuestionsBySurvey(heatmapSurvey?.id ?? surveyId)), [heatmapSurvey?.id, surveyId]);

  const resetState = useCallback(() => {
    setStep('widget');
    setSelectedStack(null);
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
    drivers: DriverQuestionSelection[]
  ): void {
    const name = widgetName.trim() || driverAnalysisWidgetTitle(primary);
    const driverItems = toDriverSelections(drivers);
    const driverCodes = [...new Set(driverItems.map((d) => d.code))].join(', ');
    showToast({
      message: `Widget "${name}" added · Primary: ${primary.code} · Drivers: ${driverCodes}`,
      variant: 'success',
    });
    onWidgetAdded?.({
      id: `w-driver-analysis-${Date.now()}`,
      type: 'driver-analysis',
      title: name,
      driverAnalysis: {
        primaryQuestionCode: primary.code,
        primaryQuestionText: primary.text,
        drivers: driverItems,
      },
    });
    handleClose();
  }

  function handlePrimaryQuestionSelect(question: SurveyQuestion): void {
    const { question: resolved } = resolvePickerSelection(question);
    setPrimaryQuestion(resolved);
    setDriverQuestions([]);
    setStep('driver-question');
  }

  function handleDriverQuestionToggle(question: SurveyQuestion, selected: boolean): void {
    const isSubRow = question.parentQuestionId !== undefined;
    const item: DriverQuestionSelection = {
      selectionId: question.id,
      questionId: question.parentQuestionId ?? question.id,
      code: question.code,
      name: question.text,
      matrixRows: isSubRow ? undefined : question.matrixRows,
    };
    setDriverQuestions((prev) => {
      if (!selected) {
        return prev.filter((q) => q.selectionId !== item.selectionId);
      }
      const withoutConflict = prev.filter((q) => {
        if (q.selectionId === item.selectionId) return false;
        if (isSubRow) {
          // Drop whole-parent selection for this matrix.
          return q.selectionId !== item.questionId;
        }
        // Selecting the parent replaces any prior parent or sub-row picks.
        return q.questionId !== item.questionId;
      });
      return [...withoutConflict, item];
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
        {step==='widget'&&<div style={{padding:'16px 24px'}}><WuButton variant="outline" onClick={()=>setStep('stack-source')}>Create from Question Stack</WuButton></div>}
        {step==='stack-source'&&<StackSourcePicker onSelect={stack=>{setSelectedStack(stack);setStep('stack-setup');}}/>}
        {step==='stack-setup'&&selectedStack&&<StackWidgetSetup advanced stack={selectedStack} onBack={()=>setStep('stack-source')} onSave={widget=>{onWidgetAdded?.(widget);showToast({message:'Question Stack widget added',variant:'success'});handleClose();}}/>}
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
            selectedQuestionIds={driverQuestions.map((q) => q.selectionId)}
            excludeQuestionIds={primaryQuestion ? [primaryQuestion.id] : []}
            onToggleQuestion={handleDriverQuestionToggle}
          />
        )}
        {step === 'heatmap-survey' && <AiDataSourceSelection onSelectQuestionStack={stack=>{setSelectedStack(stack);setStep('stack-setup');}} selectedSurveyId={heatmapSurvey?.id ?? null} onSelectSurvey={survey => { if (survey.id !== heatmapSurvey?.id) setHeatmapRows([]); setHeatmapSurvey(survey); setStep('heatmap-questions'); }} />}
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
        {step==='stack-source'&&<div style={{padding:16}}><WuButton variant="secondary" onClick={()=>setStep('widget')}>Back</WuButton></div>}
      </WuModalContent>

      {step!=='stack-setup'&&step!=='stack-source'&&<WuModalFooter>
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
      </WuModalFooter>}
    </WuModal>
  );
}
