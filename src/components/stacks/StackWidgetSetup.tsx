'use client';
import {useState} from 'react';
import {getQuestionsBySurvey} from '@/data/mock-survey-questions';
import {STACK_CHARTS,validateMetricGroup,type QuestionStack,type StackChart} from '@/data/question-stacks';
import type {AiWidgetConfig} from '@/data/mock-ai-widgets';
import {StackButton,StackInput} from './StackControls';
import {QuestionStackWidget} from './QuestionStackWidget';
import styles from './Stacks.module.css';
export function StackWidgetSetup({stack,advanced=false,onBack,onSave}:{stack:QuestionStack;advanced?:boolean;onBack:()=>void;onSave:(widget:AiWidgetConfig)=>void}){
  const [groupIds,setGroupIds]=useState<string[]>([]);const [chart,setChart]=useState<StackChart>(advanced?'heat-map':'bar');const [step,setStep]=useState<'groups'|'chart'>('groups');const [name,setName]=useState('');
  const qs=getQuestionsBySurvey(stack.surveyId);
  const config={stackId:stack.id,groupIds,chart};
  const selectedValid=groupIds.length>0&&groupIds.every(id=>{const g=stack.groups.find(g=>g.id===id);return g&&!validateMetricGroup(g,qs,stack.surveyId);});
  function toggle(id:string){setGroupIds(ids=>ids.includes(id)?ids.filter(v=>v!==id):advanced?[...ids,id]:[id]);}
  return <div className={styles.setup}><div className={`${styles.form} ${styles.setupBody}`}><div><strong>{stack.name}</strong><p className={styles.hint}>{stack.surveyName} · Question Stack</p></div>{step==='groups'?<><h3>Select metric {advanced?'groups':'group'}</h3><table className={styles.table}><thead><tr><th>Select</th><th>Metric group</th><th>Questions</th><th>Answers</th></tr></thead><tbody>{stack.groups.map(g=><tr key={g.id}><td><input type={advanced?'checkbox':'radio'} name="stack-group" aria-label={`Select ${g.name}`} checked={groupIds.includes(g.id)} disabled={!!validateMetricGroup(g,qs,stack.surveyId)} onChange={()=>toggle(g.id)}/></td><td>{g.name}{validateMetricGroup(g,qs,stack.surveyId)&&<p role="alert">Repair this group’s questions or answer mappings in Stacks.</p>}</td><td>{g.questionIds.length}</td><td>{g.labels.length}</td></tr>)}</tbody></table><p className={styles.hint}>{advanced?'Each selected group remains a separate metric.':'The widget pools the answers in this metric group.'}</p></>:<><label>Widget name<StackInput value={name} onChange={e=>setName(e.target.value)} aria-label="Widget name"/></label><div className={styles.chartChoices}>{STACK_CHARTS.filter(c=>advanced||c.id!=='heat-map').map(c=><button key={c.id} aria-pressed={chart===c.id} onClick={()=>setChart(c.id)}>{c.name}</button>)}</div><div style={{height:300,border:'1px solid #e1e6ec'}}><QuestionStackWidget config={config}/></div></>}
    </div><div className={`${styles.actions} ${styles.setupFooter}`}><StackButton variant="secondary" onClick={()=>step==='groups'?onBack():setStep('groups')}>Back</StackButton><StackButton disabled={!selectedValid||(step==='chart'&&!name.trim())} onClick={()=>{if(step==='groups'){setName(groupIds.map(id=>stack.groups.find(g=>g.id===id)?.name).join(' / '));setStep('chart');}else onSave({id:`question-stack-widget-${crypto.randomUUID()}`,type:chart,title:name.trim(),questionStack:config});}}>{step==='groups'?'Select widget type':'Add widget'}</StackButton></div>
  </div>;
}
