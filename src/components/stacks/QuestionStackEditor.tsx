'use client';
import {createPrototypeId} from '@/lib/prototype-id.mjs';

import {Fragment,Suspense,useState} from 'react';
import {useRouter,useSearchParams} from 'next/navigation';
import {useWuShowToast} from '@npm-questionpro/wick-ui-lib';
import {getQuestionsBySurvey} from '@/data/mock-survey-questions';
import {alignMetricGroupBaseline,setAnswerMapping,validateMetricGroup,type MetricGroup,type QuestionStack,type StackQuestion} from '@/data/question-stacks';
import {useQuestionStacks} from '@/hooks/useQuestionStacks';
import {useBiProductBasePath,withBiProductBasePath} from '@/hooks/useBiProductBasePath';
import {MetricGroupEditor} from './MetricGroupEditor';
import {StackSurveyPicker} from './StackSurveyPicker';
import {StackButton,StackDialog,StackSelect,StackTypeIcon} from './StackControls';
import styles from './Stacks.module.css';

export function QuestionStackEditor({id}:{id:string}) {
  return <Suspense fallback={<p>Loading…</p>}><LoadedEditor id={id}/></Suspense>;
}

function LoadedEditor({id}:{id:string}) {
  const {stacks,ready,error,saveStack}=useQuestionStacks();
  const params=useSearchParams();
  const stack=stacks.find(s=>s.id===id);
  if(!ready)return <p className={styles.main}>Loading Question Stack…</p>;
  if(error)return <p role="alert" className={styles.error}>{error}</p>;
  if(id!=='new'&&!stack)return <p>This Question Stack is unavailable.</p>;
  return <Editor key={id} initial={stack} name={params.get('name')??'Untitled Question Stack'} saveStack={saveStack}/>;
}

function emptyGroup():MetricGroup {
  return {id:createPrototypeId(),name:'',questionIds:[],labels:[],scores:[],mappings:{}};
}

function Editor({initial,name,saveStack}:{initial?:QuestionStack;name:string;saveStack:(stack:QuestionStack)=>void}) {
  const router=useRouter(),base=useBiProductBasePath(),{showToast}=useWuShowToast();
  const path=withBiProductBasePath(base,'/survey-stacks');
  const [draft,setDraft]=useState<QuestionStack>(()=>initial?{...structuredClone(initial),groups:initial.groups.map(group=>alignMetricGroupBaseline(group,getQuestionsBySurvey(initial.surveyId)))}:{id:`question-${createPrototypeId()}`,name,surveyId:0,surveyName:'',createdOn:new Date().toISOString().slice(0,10),groups:[]});
  const [picker,setPicker]=useState(false);
  const [editing,setEditing]=useState<MetricGroup>();
  const [pendingGroup,setPendingGroup]=useState<MetricGroup>();
  const [expanded,setExpanded]=useState<string[]>([]);
  const [remove,setRemove]=useState<string|null>(null);
  const [error,setError]=useState('');
  const [discard,setDiscard]=useState(false);
  const [savedSnapshot,setSavedSnapshot]=useState(()=>JSON.stringify(draft));
  const questions=getQuestionsBySurvey(draft.surveyId);
  const duplicateNames=new Set(draft.groups.map(g=>g.name.trim().toLowerCase())).size!==draft.groups.length;
  const invalid=duplicateNames||draft.groups.some(g=>validateMetricGroup(g,questions,draft.surveyId));

  function update(group:MetricGroup) {
    setDraft(current=>({...current,groups:current.groups.map(g=>g.id===group.id?group:g)}));
  }
  function cancel() {
    if(JSON.stringify(draft)!==savedSnapshot)setDiscard(true);else router.push(path);
  }
  function addGroup() {
    if(!draft.surveyId)setPicker(true);else setEditing(emptyGroup());
  }
  function save() {
    if(!draft.name.trim()||!draft.surveyId||!draft.groups.length||invalid)return;
    try {
      saveStack(draft);
      showToast({message:`Question Stack '${draft.name}' saved`,variant:'success'});
      if(initial)setSavedSnapshot(JSON.stringify(draft));else router.push(path);
    }catch{setError('Could not save changes. Your draft is still available.');}
  }

  return <div className={`${styles.page} ${styles.questionStack}`}>
    <header className={styles.header}>
      <button className={styles.iconButton} aria-label="Back to stacks" onClick={cancel}><span className="wm-arrow-back" aria-hidden="true"/></button>
      <h1>{draft.name}</h1>
      <div className={styles.actions}>
        <StackButton variant="outline" onClick={cancel}>Cancel</StackButton>
        {!!draft.groups.length&&<StackButton disabled={!!invalid} onClick={save}>{initial?'Update':'Save'}</StackButton>}
      </div>
    </header>
    {!!draft.surveyId&&<div className={styles.questionStackSource}><span>Data source: <strong>{draft.surveyName}</strong></span></div>}
    {error&&<p role="alert" className={styles.error}>{error}</p>}
    {duplicateNames&&<p role="alert" className={styles.error}>Use unique metric group names within this stack.</p>}
    {!draft.groups.length?<div className={styles.productionEmpty}>
      <h2>Add your questions</h2>
      <p>Click on plus button to create a question stack</p>
      <StackButton variant="outline" className={styles.addQuestions} aria-label="Add your questions" onClick={addGroup}><span className="wm-add" aria-hidden="true"/></StackButton>
    </div>:<>
      <div className={styles.mappingViewport} role="region" aria-label="Metric groups" tabIndex={0}>
        <table className={`${styles.fieldTable} ${styles.metricGroupTable}`}>
          <colgroup><col style={{width:140}}/><col style={{width:260}}/><col/></colgroup>
          <thead><tr><th>Data type</th><th>Metric group</th><th>Questions</th></tr></thead>
          <tbody>{draft.groups.map(group=>{
            const open=expanded.includes(group.id),issue=validateMetricGroup(group,questions,draft.surveyId);
            return <Fragment key={group.id}>
              <tr className={open?styles.expandedRow:''}>
                <td><div className={styles.metricTypeCell}>
                  <button className={`${styles.iconButton} ${styles.metricEdit}`} aria-label={`Edit ${group.name}`} onClick={()=>setEditing(group)}><span className="wm-edit" aria-hidden="true"/></button>
                  <StackTypeIcon type={questions.find(q=>q.id===group.questionIds[0])?.type}/>
                </div></td>
                <td><span className={styles.metricGroupName}>{group.name}</span></td>
                <td><div className={styles.questionsWithActions}><div className={styles.groupQuestions}>{group.questionIds.map(id=><p key={id}>{questions.find(q=>q.id===id)?.text??'Unavailable question'}</p>)}</div>
                <div className={styles.rowActions}>
                  <button className={styles.iconButton} aria-expanded={open} aria-label={`${open?'Hide':'Review'} answer mappings for ${group.name}`} title="Answer mappings" onClick={()=>setExpanded(open?expanded.filter(id=>id!==group.id):[...expanded,group.id])}><span className={open?'wm-expand-less':'wm-expand-more'} aria-hidden="true"/></button>
                  <button className={styles.iconButton} aria-label={`Delete ${group.name}`} onClick={()=>setRemove(group.id)}><span className="wm-delete" aria-hidden="true"/></button>
                </div></div>{issue&&<p role="alert" className={styles.mappingIssue}>{issue}</p>}</td>
              </tr>
              {open&&<tr><td colSpan={3} className={styles.mappingCell}><AnswerMappings group={group} questions={questions} onChange={update}/></td></tr>}
            </Fragment>;
          })}</tbody>
        </table>
      </div>
      <div className={styles.addFieldBar}><StackButton onClick={addGroup}>＋ Add metric group</StackButton></div>
    </>}
    {picker&&<StackSurveyPicker single advanceOnSelect initialSelected={draft.surveyId?[draft.surveyId]:[]} onClose={()=>{setPicker(false);setPendingGroup(undefined);}} onSave={surveys=>{
      const survey=surveys[0];
      const changed=survey.id!==draft.surveyId;
      if(changed){setDraft({...draft,surveyId:survey.id,surveyName:survey.name,groups:[]});setExpanded([]);}
      setPicker(false);
      if(!draft.groups.length||changed)setEditing(!changed&&pendingGroup?pendingGroup:emptyGroup());
      setPendingGroup(undefined);
    }}/>}
    {editing&&<MetricGroupEditor group={editing} questions={questions} surveyId={draft.surveyId} existingNames={draft.groups.filter(g=>g.id!==editing.id).map(g=>g.name)} onClose={()=>setEditing(undefined)} onBack={group=>{
      setEditing(undefined);
      if(!draft.groups.length){setPendingGroup(group);setPicker(true);}
    }} onSave={group=>{
      setDraft({...draft,groups:draft.groups.some(g=>g.id===group.id)?draft.groups.map(g=>g.id===group.id?group:g):[...draft.groups,group]});
      if(validateMetricGroup(group,questions,draft.surveyId))setExpanded([...expanded.filter(id=>id!==group.id),group.id]);
      setEditing(undefined);
    }}/>}
    {discard&&<StackDialog title="Question stack" onClose={()=>setDiscard(false)} footer={<><StackButton variant="secondary" onClick={()=>setDiscard(false)}>Keep editing</StackButton><StackButton onClick={()=>router.push(path)}>Yes</StackButton></>}><p>You have some unsaved changes. Are you sure you want to go back?</p></StackDialog>}
    {remove&&<StackDialog title="Delete metric group" onClose={()=>setRemove(null)} footer={<><StackButton variant="secondary" onClick={()=>setRemove(null)}>Cancel</StackButton><StackButton onClick={()=>{setDraft({...draft,groups:draft.groups.filter(g=>g.id!==remove)});setExpanded(expanded.filter(id=>id!==remove));setRemove(null);}}>Yes</StackButton></>}><p>Delete this metric group and its answer mappings? The change is applied when you save the stack.</p></StackDialog>}
  </div>;
}

function AnswerMappings({group,questions,onChange}:{group:MetricGroup;questions:StackQuestion[];onChange:(group:MetricGroup)=>void}) {
  return <div className={`${styles.groupMapping} ${styles.questionAnswerMapping}`} role="region" aria-label={`${group.name} answer mappings`} tabIndex={0}>
    <table className={styles.table} style={{width:group.questionIds.length*280}}>
      <colgroup>{group.questionIds.map(id=><col key={id} style={{width:280}}/>)}</colgroup>
      <thead><tr>{group.questionIds.map((id,index)=>{const q=questions.find(q=>q.id===id);return <th key={id}><span>{q?`${q.code} · ${q.text}`:'Unavailable question'}</span>{index===0&&<small>Baseline</small>}</th>;})}</tr></thead>
      <tbody>{group.labels.map((label,i)=><tr key={i}>
        {group.questionIds.map((id,index)=>{
          const q=questions.find(q=>q.id===id);
          if(!q)return <td key={id}>Unavailable question</td>;
          const mapping=group.mappings[id]??[],sourceIndex=mapping.indexOf(i);
          return <td key={id}><StackSelect disabled={index===0} label={`${group.name}: ${q.code}: ${label}`} value={String(sourceIndex)} options={(q.options??[]).map((text,index)=>({value:String(index),label:text}))} placeholder="Select matching answer" onChange={value=>{
            if(index===0)return;
            const next=[...mapping];
            if(sourceIndex>=0)next[sourceIndex]=-1;
            onChange({...group,mappings:{...group.mappings,[id]:setAnswerMapping(next,Number(value),i)}});
          }}/></td>;
        })}
      </tr>)}</tbody>
    </table>
  </div>;
}
