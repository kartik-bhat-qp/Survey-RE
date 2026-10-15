'use client';
import {createPrototypeId} from '@/lib/prototype-id.mjs';

import {useState} from 'react';
import {useWuShowToast} from '@npm-questionpro/wick-ui-lib';
import {WidgetQuestionSelection} from '@/components/dashboards/WidgetQuestionSelection';
import {alignMetricGroupBaseline,autoMapAnswers,compatibleStackQuestions,type MetricGroup,type StackQuestion} from '@/data/question-stacks';
import {StackButton,StackDialog,StackInput} from './StackControls';
import styles from './Stacks.module.css';

export function MetricGroupEditor({group,questions,surveyId,existingNames=[],onSave,onClose,onBack}:{
  group?:MetricGroup; questions:StackQuestion[]; surveyId:number; existingNames?:string[];
  onSave:(group:MetricGroup)=>void; onClose:()=>void; onBack?:(group:MetricGroup)=>void;
}) {
  const [draft,setDraft]=useState<MetricGroup>(()=>group?structuredClone(group):{id:createPrototypeId(),name:'',questionIds:[],labels:[],scores:[],mappings:{}});
  const {showToast}=useWuShowToast();
  const available=compatibleStackQuestions(questions,draft.questionIds);
  const excluded=questions.filter(q=>!available.some(item=>item.id===q.id)).map(q=>q.id);
  const duplicate=existingNames.some(name=>name.trim().toLowerCase()===draft.name.trim().toLowerCase());
  const reason=draft.questionIds.length<2?'Please select at least 2 questions':!draft.name.trim()?'Enter a metric group name':duplicate?'Use a unique metric group name':'';

  function toggle(q:StackQuestion) {
    if(draft.questionIds.includes(q.id)) {
      const ids=draft.questionIds.filter(id=>id!==q.id);
      setDraft(alignMetricGroupBaseline({...draft,questionIds:ids,mappings:Object.fromEntries(Object.entries(draft.mappings).filter(([id])=>ids.includes(Number(id)))),...(!ids.length?{labels:[],scores:[],mappings:{}}:{})},questions));
      return;
    }
    if(draft.questionIds.length===20) {
      showToast({message:'Only 20 questions can be stacked within a metric group.',variant:'warning'});
      return;
    }
    const labels=draft.labels.length?draft.labels:[...q.options!];
    setDraft({...draft,labels,scores:draft.scores.length?draft.scores:labels.map((_,i)=>i+1),questionIds:[...draft.questionIds,q.id],mappings:{...draft.mappings,[q.id]:autoMapAnswers(q.options!,labels)}});
  }

  return <StackDialog wide flush title="Select questions" onClose={onClose} footer={<>
    <span className={styles.minimumHint} id="metric-group-save-hint" role="status">{reason}</span>
    <StackButton variant="link" onClick={()=>onBack?onBack(draft):onClose()}>Back</StackButton>
    <span title={reason}><StackButton disabled={!!reason} aria-describedby="metric-group-save-hint" onClick={()=>onSave({...draft,name:draft.name.trim()})}>Save</StackButton></span>
  </>}>
    <div className={styles.questionPicker}>
      <WidgetQuestionSelection
        surveyId={surveyId} wholeQuestionsOnly multiSelect showSelectAll={false}
        selectedQuestionIds={draft.questionIds} excludeQuestionIds={excluded}
        hideSearch={draft.questionIds.length>0}
        toolbarContent={draft.questionIds.length>0?<label className={styles.metricName}>Metric group name<span aria-hidden="true">*</span><StackInput autoFocus required aria-label="Metric group name" placeholder="Enter metric group name" variant="flat" value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})}/></label>:undefined}
        onToggleQuestion={question=>toggle(question)}
      />
      {duplicate&&<p role="alert" className={styles.error}>Use a unique metric group name within this stack.</p>}
      <div className={styles.questionSelectionSummary}>
        <p aria-live="polite">{draft.questionIds.length} / 20 Questions selected</p>
        <div className={styles.pickerChips}>{draft.questionIds.map(id=>{
          const q=questions.find(q=>q.id===id);
          return q&&<button className={styles.chip} key={id} aria-label={`Remove ${q.code}`} title={q.text} onClick={()=>toggle(q)}><span>{q.text}</span><span aria-hidden="true">×</span></button>;
        })}</div>
      </div>
    </div>
  </StackDialog>;
}
