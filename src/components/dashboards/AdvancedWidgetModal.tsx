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
  type SurveyQuestion,
} from '@/data/mock-survey-questions';
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
import { driverCatalog, driverDefaultScoring } from '@/data/driver-scoring';
import { DriverScoringFields } from './widgets/DriverScoringFields';

type ModalStep =
  | AdvancedWidgetStep
  | 'stack-source'
  | 'stack-setup'
  | 'heatmap-survey'
  | 'heatmap-questions'
  | 'heatmap-analysis'
  | 'primary-question'
  | 'driver-metric'
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
  if (step === 'primary-question') return 'chart';
  if (step === 'driver-metric') return 'chart';
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
  const [scoring, setScoring] = useState<KpiScoring | null>(null);
  const [driverQuestions, setDriverQuestions] = useState<number[]>([]);
  const catalogue = useMemo(() => driverCatalog(surveyId), [surveyId]);
  const primary = catalogue.find(item => item.pick.id === primaryQuestion?.id);
  const selectionReasons: Record<number, string> = {};
  for (const { pick, reason } of catalogue) {
    if (reason) selectionReasons[pick.id] = reason;
    else if (pick.matrixRows?.length && step === 'primary-question') selectionReasons[pick.id] = 'Expand the matrix and choose one outcome row.';
    else if (step === 'driver-question' && pick.id === primaryQuestion?.id)
      selectionReasons[pick.id] = 'This row is already the primary question.';
  }
  const checkedDrivers = new Set(driverQuestions);
  for (const { pick } of catalogue.filter(item => item.pick.matrixRows?.length)) {
    const children = catalogue.filter(item => item.pick.parentQuestionId === pick.id && !selectionReasons[item.pick.id]);
    if (children.length && children.every(item => checkedDrivers.has(item.pick.id))) checkedDrivers.add(pick.id);
  }
  function toggleDriver(question: SurveyQuestion, checked: boolean) {
    const ids = question.matrixRows?.length
      ? catalogue.filter(item => item.pick.parentQuestionId === question.id && !selectionReasons[item.pick.id]).map(item => item.pick.id)
      : [question.id];
    setDriverQuestions(current => checked ? [...new Set([...current, ...ids])] : current.filter(id => !ids.includes(id)));
  }
  const disabledIds = Object.keys(selectionReasons).map(Number);
  const scoringError = scoring && primary ? validateKpiScoring(scoring, primary.outcome.answers.map(a => a.score)) : 'Select a primary question.';

  const [heatmapSurvey, setHeatmapSurvey] = useState<SurveyListItem | null>(null);
  const [heatmapRows, setHeatmapRows] = useState<string[]>([]);
  const [heatmapMode, setHeatmapMode] = useState<AnalysisMode>('distribution');
  const heatmapQuestions = useMemo(() => adaptHeatmapQuestions(getAdvancedHeatmapQuestions(heatmapSurvey?.id ?? surveyId)), [heatmapSurvey?.id, surveyId]);

  const resetState = useCallback(() => {
    setStep('widget');
    setSelectedStack(null);
    setHeatmapSurvey(null);
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
        setStep('primary-question');
        return;
      }
      setStep('chart');
      return;
    }
  }

  function finishDriverAnalysis(): void {
    if (!primary || !scoring || scoringError || !driverQuestions.length) return;
    const drivers = catalogue.filter(item => driverQuestions.includes(item.pick.id))
      .map(({ pick, outcome }) => ({ id: outcome.rowId, code: pick.code, name: outcome.label }));
    const title = widgetName.trim() || driverAnalysisWidgetTitle(primary.pick);
    onWidgetAdded?.({
      id: `w-driver-analysis-${Date.now()}`, type: 'driver-analysis', title,
      driverAnalysis: {
        metric: scoring.metric, scoring, outcome: primary.outcome,
        primaryQuestionCode: primary.pick.code, primaryQuestionText: primary.outcome.label, drivers,
      },
    });
    showToast({ message: `Widget "${title}" added`, variant: 'success' });
    handleClose();
  }

  function handlePrimaryQuestionSelect(question: SurveyQuestion): void {
    const entry = catalogue.find(item => item.pick.id === question.id);
    if (!entry || selectionReasons[question.id]) return;
    if (primaryQuestion?.id !== question.id) {
      setScoring(driverDefaultScoring(entry.outcome, question.type === 'NPS' ? 'nps' : 'mean'));
      setDriverQuestions(current => current.filter(id => id !== question.id));
    }
    setPrimaryQuestion(question);
    setStep('driver-question');
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
        setStep('primary-question');
        return;
      }
      setStep('chart');
      return;
    }
    if (step === 'driver-question') {
      if (driverQuestions.length) setStep('driver-metric');
      return;
    }
    if (step === 'driver-metric') { finishDriverAnalysis(); return; }
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
    if (step === 'driver-metric') { setStep('driver-question'); return; }
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
    step === 'primary-question' || step === 'driver-metric' || step === 'driver-question';
  const nextLabel =
    step === 'heatmap-analysis' ? 'Create widget' : step === 'details' || step === 'driver-metric' ? 'Finish' : 'Next';
  const showNext =
    step !== 'heatmap-survey' && (!isDriverQuestionFlow || step === 'driver-question' || step === 'driver-metric');
  const nextDisabled = (step === 'driver-metric' && Boolean(scoringError)) || (step === 'driver-question' && (driverQuestions.length === 0 || driverQuestions.length > 10)) || ((step === 'heatmap-questions' || step === 'heatmap-analysis') && Boolean(heatmapSelectionError(heatmapQuestions, heatmapRows)));
  const modalTitle =
    step === 'primary-question'
      ? 'Select primary question'
      : step === 'driver-metric' ? 'Configure impact metric'
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
            unavailableQuestionIds={disabledIds} unavailableQuestionReasons={selectionReasons}
            selectedQuestionId={primaryQuestion?.id ?? null}
            onSelectQuestion={handlePrimaryQuestionSelect}
          />
        )}
        {step === 'driver-question' && (
          <WidgetQuestionSelection
            toolbarContent={<span>{driverQuestions.length} of 10 drivers selected</span>}
            surveyId={surveyId}
            multiSelect
            selectedQuestionIds={[...checkedDrivers]} onToggleQuestion={toggleDriver}
            unavailableQuestionIds={disabledIds} unavailableQuestionReasons={selectionReasons}
          />
        )}
        {step === 'driver-metric' && primary && scoring && <div className={styles.scoringFields}>
          <DriverScoringFields outcome={primary.outcome} value={scoring} onChange={setScoring} />
        </div>}
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
            {(['primary-question', 'driver-question', 'driver-metric'] as const).map((value, index, steps) =>
              <button key={value} type="button" disabled={index >= steps.indexOf(step as typeof value)}
                aria-current={value === step ? 'step' : undefined} onClick={() => setStep(value)}>
                {['Primary question', 'Driver questions', 'Metric configuration'][index]}
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
