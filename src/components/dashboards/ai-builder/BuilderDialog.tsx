'use client';
import { useMemo, useState } from 'react';
import { useWickUILib } from '@/components/ui/useWickUILib';
import { AiDataSourceSelection } from '@/components/dashboards/AiDataSourceSelection';
import { WidgetQuestionSelection } from '@/components/dashboards/WidgetQuestionSelection';
import modalStyles from '../QuestionBasedWidgetModal.module.css';
import breadcrumbStyles from '../AddWidgetStepBreadcrumb.module.css';
import type { SurveyListItem } from '@/data/mock-survey-folders';
import { getQuestionsBySurvey, type SurveyQuestion } from '@/data/mock-survey-questions';
import { builderFields, defaultBuilderSettings, type BuiltWidget, type BuilderSource } from '@/data/ai-widget-builder';
import styles from './Builder.module.css';
type BuilderStep = 'name' | 'survey' | 'questions' | 'prompt';
const STEPS: { id: BuilderStep; label: string; icon: string }[] = [
  { id: 'name', label: 'Name', icon: 'wm-grid-view' },
  { id: 'survey', label: 'Survey', icon: 'wm-description' },
  { id: 'questions', label: 'Questions', icon: 'wm-list' },
  { id: 'prompt', label: 'Build', icon: 'wc-ai' },
];
export function BuilderDialog({ tabId, onClose, onSave }: { tabId: string; onClose: () => void; onSave: (widget: BuiltWidget) => void }) {
  const wick = useWickUILib();
  const [step, setStep] = useState<BuilderStep>('name');
  const [name, setName] = useState('');
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyListItem | null>(null);
  const [ids, setIds] = useState<number[]>([]);
  const [prompt, setPrompt] = useState('');
  const fields = useMemo(() => selectedSurvey
    ? builderFields(getQuestionsBySurvey(selectedSurvey.id).filter(q => ids.includes(q.id)))
    : [], [selectedSurvey, ids]);
  const source: BuilderSource = { id: selectedSurvey?.id ?? 0, name: selectedSurvey?.name ?? '', fields };
  const stepIndex = STEPS.findIndex(item => item.id === step);
  function selectSurvey(survey: SurveyListItem) {
    if (selectedSurvey?.id !== survey.id) setIds([]);
    setSelectedSurvey(survey); setStep('questions');
  }
  function toggleQuestion(question: SurveyQuestion, selected: boolean) {
    const id = question.parentQuestionId ?? question.id;
    setIds(previous => selected ? [...new Set([...previous, id])] : previous.filter(item => item !== id));
  }
  function createPlaceholder() {
    if (!name.trim() || !selectedSurvey || !fields.length) return;
    onSave({
      id: `ai-${crypto.randomUUID()}`, tabId, source, prompt,
      placeholder: true,
      settings: defaultBuilderSettings(name.trim()),
      output: {
        version: 1, contract: 'records-v1', fieldIds: fields.map(field => field.id),
        capabilities: { design: false, analytics: false, labels: false, weighting: false, slicer: false },
        html: '', css: '', javascript: '',
      },
    });
  }
  if (!wick) return null;
  const { WuModal, WuModalHeader, WuModalContent, WuModalFooter, WuButton, WuInput, WuFormGroup, WuLabel, WuTextarea } = wick;
  const nextDisabled = step === 'name' ? !name.trim() : step === 'questions' ? !ids.length : false;
  return <WuModal open onOpenChange={open => { if (!open) onClose(); }} variant="action" className={step === 'name' ? modalStyles.modal : modalStyles.modalWide}>
    <WuModalHeader className={modalStyles.modalTitle}>Build with AI</WuModalHeader>
    <WuModalContent className={modalStyles.stepContent}>
      {step === 'name' && <div className={styles.body}>
        <WuFormGroup
          Label={<WuLabel htmlFor="ai-widget-name">Name</WuLabel>}
          Input={<WuInput id="ai-widget-name" autoFocus aria-label="Widget name" variant="outlined" maxLength={100} value={name} onChange={e => setName(e.target.value)} placeholder="Enter widget name" />}
        />
      </div>}
      {step === 'survey' && <AiDataSourceSelection selectedSurveyId={selectedSurvey?.id ?? null} onSelectSurvey={selectSurvey} />}
      {step === 'questions' && selectedSurvey && <WidgetQuestionSelection key={selectedSurvey.id} surveyId={selectedSurvey.id} multiSelect selectedQuestionIds={ids} onToggleQuestion={toggleQuestion} />}
      {step === 'prompt' && <div className={styles.body}>
      <div className={styles.source}><strong>{name}</strong><span>{source.name} · {ids.length} selected questions</span></div><WuFormGroup
        Label={<WuLabel htmlFor="ai-widget-description">What would you like to build?</WuLabel>}
        Input={<WuTextarea id="ai-widget-description" variant="outlined" autoFocus rows={7} maxLength={6000} value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Compare the selected questions in a horizontal bar chart. Show percentages, use blue accents, and make the differences easy to spot." />}
      /><p className={styles.note}>For now, Create widget adds a placeholder. AI generation will be connected later.</p>
      </div>}
    </WuModalContent>
    <WuModalFooter><div className={modalStyles.wizardFooter}>
      <nav className={breadcrumbStyles.nav} aria-label="AI widget progress">
        {STEPS.map((item, index) => <span key={item.id} className="flex items-center gap-1">
          {index > 0 && <span className="wm-chevron-right mx-0.5 text-xs text-gray-300" aria-hidden />}
          <button type="button" disabled={index >= stepIndex} aria-current={index === stepIndex ? 'step' : undefined} onClick={() => setStep(item.id)} className={`${breadcrumbStyles.stepButton} ${index <= stepIndex ? 'text-[#1b87e6]' : 'text-gray-400'} ${index === stepIndex ? 'font-medium' : ''}`}>
            <span className={`${item.icon} text-base`} aria-hidden /><span className={breadcrumbStyles.stepLabel}>{item.label}</span>
          </button>
        </span>)}
      </nav>
      <div className={modalStyles.wizardActions}>
        {step !== 'name' && <WuButton variant="secondary" onClick={() => setStep(STEPS[stepIndex - 1].id)}>Back</WuButton>}
        {step !== 'survey' && <WuButton disabled={nextDisabled} onClick={() => {
          if (step === 'name') setStep('survey');
          else if (step === 'questions') setStep('prompt');
          else if (step === 'prompt') createPlaceholder();
        }}>{step === 'name' || step === 'questions' ? 'Next' : 'Create widget'}</WuButton>}
      </div>
    </div></WuModalFooter>
  </WuModal>;
}
