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
import { DriverQuestionTable } from './widgets/DriverQuestionTable';
import {
  ADVANCED_WIDGET_TYPES,
  DEFAULT_ADVANCED_WIDGET_TYPE_ID,
  type AdvancedWidgetTypeId,
} from '@/data/mock-advanced-widget-types';
import { AiDataSourceSelection } from '@/components/dashboards/AiDataSourceSelection';
import { DEFAULT_DASHBOARD_SURVEY, type SurveyListItem } from '@/data/mock-survey-folders';
import type { AiWidgetConfig } from '@/data/mock-ai-widgets';
import { driverAnalysisWidgetTitle } from '@/data/mock-driver-analysis';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { heatmapSelectionError, adaptHeatmapQuestions, createAdvancedHeatmapConfig, type AdvancedHeatmapConfig, type AnalysisMode } from '@/data/advanced-heatmap';
import { getAdvancedHeatmapQuestions } from '@/data/mock-survey-questions';
import { AddWidgetStepBreadcrumb } from './AddWidgetStepBreadcrumb';
import { HeatmapQuestionPicker, HeatmapAnalysisPicker } from './advanced-heatmap/HeatmapSetup';
import type { BuiltWidget } from '@/data/ai-widget-builder';
import builderStyles from './ai-builder/Builder.module.css';
import styles from './AdvancedWidgetModal.module.css';
import { validateKpiScoring, type KpiScoring } from '@/data/mock-text-ai-kpi-by-theme';
import { driverCatalog, driverDefaultScoring, driverSurveyQuestions, selectedDrivers } from '@/data/driver-scoring';

type ModalStep =
  | AdvancedWidgetStep
  | 'stack-source'
  | 'stack-setup'
  | 'heatmap-survey'
  | 'heatmap-questions'
  | 'heatmap-analysis'
  | 'driver-source'
  | 'primary-question'
  | 'driver-question';

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
  if (step === 'driver-source' || step === 'primary-question') return 'chart';
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
  const [primaryQuestion, setPrimaryQuestion] = useState<string | null>(null);
  const [scoring, setScoring] = useState<KpiScoring | null>(null);
  const [driverQuestions, setDriverQuestions] = useState<string[]>([]);
  const [driverSurvey, setDriverSurvey] = useState<SurveyListItem | null>(null);
  const driverSurveyId = driverSurvey?.id;
  const catalogue = useMemo(() => driverSurveyId === undefined ? [] : driverCatalog(driverSurveyId), [driverSurveyId]);
  const surveyQuestions = useMemo(() => driverSurveyId === undefined ? [] : driverSurveyQuestions(driverSurveyId), [driverSurveyId]);
  const primary = catalogue.find(item => item.outcome.rowId === primaryQuestion);
  const scoringError = scoring && primary ? validateKpiScoring(scoring, primary.outcome.answers.map(a => a.score)) : 'Select a primary question.';

  const [heatmapSurvey, setHeatmapSurvey] = useState<SurveyListItem | null>(null);
  const [heatmapRows, setHeatmapRows] = useState<string[]>([]);
  const [heatmapMode, setHeatmapMode] = useState<AnalysisMode>('distribution');
  const heatmapQuestions = useMemo(() => adaptHeatmapQuestions(getAdvancedHeatmapQuestions(heatmapSurvey?.id ?? surveyId)), [heatmapSurvey?.id, surveyId]);

  const resetState = useCallback(() => {
    setStep('widget');
    setSelectedStack(null);
    setHeatmapSurvey(null);
    setDriverSurvey(null);
    setHeatmapRows([]);
    setHeatmapMode('distribution');
    setWidgetName('');
    setSelectedTypeId(DEFAULT_ADVANCED_WIDGET_TYPE_ID);
    setPrimaryQuestion(null);
    setScoring(null);
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
        setStep('driver-source');
        return;
      }
      setStep('chart');
      return;
    }
  }

  function finishDriverAnalysis(): void {
    if (!primary || !scoring || scoringError || !driverQuestions.length || driverQuestions.length > 10) return;
    const drivers = selectedDrivers(catalogue, driverQuestions);
    const title = widgetName.trim() || driverAnalysisWidgetTitle({ text: primary.outcome.label, type: primary.metric.toUpperCase() });
    onWidgetAdded?.({
      id: `w-driver-analysis-${Date.now()}`, type: 'driver-analysis', title,
      driverAnalysis: {
        metric: scoring.metric, scoring, outcome: primary.outcome,
        primaryQuestionCode: primary.code, primaryQuestionText: primary.outcome.label, drivers,
      },
    });
    showToast({ message: `Widget "${title}" added`, variant: 'success' });
    handleClose();
  }

  function selectPrimary(id: string) {
    const entry = catalogue.find(item => item.outcome.rowId === id);
    if (!entry || id === primaryQuestion) return;
    setPrimaryQuestion(id);
    setScoring(driverDefaultScoring(entry.outcome, entry.metric));
    setDriverQuestions(current => current.filter(driver => driver !== id));
  }

  function handleNext(): void {
    const selectedType = ADVANCED_WIDGET_TYPES.find((t) => t.id === selectedTypeId);
    if ((step === 'heatmap-questions' || step === 'heatmap-analysis') && heatmapSelectionError(heatmapQuestions, heatmapRows)) return;
    if (step === 'heatmap-questions') { setStep('heatmap-analysis'); return; }
    if (step === 'heatmap-analysis') {
      onAdvancedHeatmapCreated?.(createAdvancedHeatmapConfig(heatmapSurvey!.id, widgetName, heatmapRows, heatmapMode, heatmapQuestions, `advanced-heatmap-${(crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`)}`));
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
        setStep('driver-source');
        return;
      }
      setStep('chart');
      return;
    }
    if (step === 'primary-question' && primary) { setStep('driver-question'); return; }
    if (step === 'driver-question') {
      finishDriverAnalysis();
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
      setStep('primary-question');
      return;
    }
    if (step === 'driver-source') { setStep('widget'); return; }
    if (step === 'primary-question') {
      setStep('driver-source');
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
    step === 'driver-source' || step === 'primary-question' || step === 'driver-question';
  const nextLabel =
    step === 'heatmap-analysis' ? 'Create widget' : step === 'details' || step === 'driver-question' ? 'Finish' : 'Next';
  const showNext = step !== 'heatmap-survey' && step !== 'driver-source';
  const nextDisabled = (step === 'primary-question' && !primary) || (step === 'driver-question' && (driverQuestions.length === 0 || driverQuestions.length > 10)) || ((step === 'heatmap-questions' || step === 'heatmap-analysis') && Boolean(heatmapSelectionError(heatmapQuestions, heatmapRows)));
  const modalTitle = step === 'driver-source' ? 'Select data source' :
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
        {step === 'driver-source' && <AiDataSourceSelection selectedSurveyId={driverSurveyId ?? null}
          initialFolderId={driverSurvey?.folderId}
          onSelectSurvey={survey => {
            if (survey.id !== driverSurveyId) {
              setPrimaryQuestion(null);
              setDriverQuestions([]);
              setScoring(null);
            }
            setDriverSurvey(survey);
            setStep('primary-question');
          }} />}
        {driverSurveyId !== undefined && (step === 'primary-question' || step === 'driver-question') && <DriverQuestionTable
          key={`${driverSurveyId}-${step}`} surveyId={driverSurveyId} questions={surveyQuestions} choices={catalogue}
          primary={primaryQuestion} multiple={step === 'driver-question'}
          selected={step === 'driver-question' ? driverQuestions : primaryQuestion ? [primaryQuestion] : []}
          onChange={ids => step === 'driver-question' ? setDriverQuestions(ids) : selectPrimary(ids[0])} />}
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
          {isDriverQuestionFlow ? <nav aria-label="Driver analysis setup" className={styles.driverSteps}>
            {(['driver-source', 'primary-question', 'driver-question'] as const).map((value, index, steps) =>
              <button key={value} type="button" disabled={index >= steps.indexOf(step as typeof value)}
                aria-current={value === step ? 'step' : undefined} onClick={() => setStep(value)}>
                {['Data source', 'Primary question', 'Driver questions'][index]}
              </button>)}
          </nav> : selectedTypeId === 'advanced-heatmap' ? <AddWidgetStepBreadcrumb chartLabel="Analysis" currentStep={step === 'heatmap-survey' ? 'survey' : step === 'heatmap-questions' ? 'question' : step === 'heatmap-analysis' ? 'chart' : 'widget'} onStepClick={target => setStep(target === 'survey' ? 'heatmap-survey' : target === 'question' ? 'heatmap-questions' : 'widget')} /> : <AdvancedWidgetStepBreadcrumb
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
