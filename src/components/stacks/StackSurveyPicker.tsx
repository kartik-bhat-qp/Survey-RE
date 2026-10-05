'use client';

import {useState} from 'react';
import {AiDataSourceSelection} from '@/components/dashboards/AiDataSourceSelection';
import {MOCK_SURVEYS,type SurveyListItem} from '@/data/mock-survey-folders';
import {StackButton,StackDialog} from './StackControls';
import styles from './Stacks.module.css';

export function StackSurveyPicker({single=false,min=1,excluded=[],initialSelected=[],onClose,onSave,replace=false}:{single?:boolean;min?:number;excluded?:number[];initialSelected?:number[];onClose:()=>void;onSave:(surveys:SurveyListItem[])=>void;replace?:boolean}){
 const [selected,setSelected]=useState<number[]>(initialSelected);
 function toggle(id:number){setSelected(current=>single?[id]:current.includes(id)?current.filter(value=>value!==id):[...current,id]);}
 return <StackDialog wide flush title="Add survey" onClose={onClose} footer={<>
   <div className={styles.pickerSelection}>
     {!single&&selected.length<min&&<span className={styles.hint} role="status">Select at least {min} surveys</span>}
     <div className={styles.pickerChips}>{selected.map(id=>{
       const name=MOCK_SURVEYS.find(survey=>survey.id===id)?.name;
       return <button key={id} className={styles.chip} onClick={()=>setSelected(current=>current.filter(value=>value!==id))} aria-label={`Remove ${name}`} title={name}><span>{name}</span><span aria-hidden="true">×</span></button>;
     })}</div>
   </div>
   <div className={styles.actions}><StackButton disabled={selected.length<min} onClick={()=>onSave(selected.map(id=>MOCK_SURVEYS.find(survey=>survey.id===id)!))}>{replace?'Update':'Add survey'}</StackButton></div>
 </>}>
   <AiDataSourceSelection initialFolderId="my-surveys" selectedSurveyId={selected[0]??null} selectedSurveyIds={selected} selectionMode={single?'single':'multiple'} excludedSurveyIds={excluded} onSelectSurvey={survey=>toggle(survey.id)}/>
 </StackDialog>;
}
