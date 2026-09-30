'use client';
import {Fragment,useEffect,useState} from 'react';
import {useParams,useRouter} from 'next/navigation';
import {useWuShowToast} from '@npm-questionpro/wick-ui-lib';
import {getQuestionsBySurvey} from '@/data/mock-survey-questions';
import {MOCK_SURVEYS} from '@/data/mock-survey-folders';
import {useBiProductBasePath,withBiProductBasePath} from '@/hooks/useBiProductBasePath';
import {readCreatedSurveyStacks,saveCreatedSurveyStack,type PrototypeSurveyStack} from '@/data/prototype-survey-stacks';
import {autoMapSource,compatibleFieldQuestions,mapFieldQuestion,seedStackFields,setFieldAnswer,type MappedStackField,type StackSource} from '@/data/survey-stack-model';
import {StackButton,StackDialog,StackInput,StackSelect,StackTypeIcon} from './StackControls';
import {StackSurveyPicker} from './StackSurveyPicker';
import styles from './Stacks.module.css';
const names=['Customer Experience Portfolio','Market Insights Program','Brand Health Benchmark','Product Feedback Initiative','Employee Engagement Suite','Executive Pulse Tracker','Compliance Readiness Review'];
function loadDraft(id:number):PrototypeSurveyStack{
 const existing=readCreatedSurveyStacks().find(s=>s.id===id);if(existing)return existing;
 return {id,name:names[id-1]??'Survey stack',createdOn:'2026-05-05',completedResponses:6,sourceNames:['QuestionPro : Understanding Your Audience','New QuestionPro : Understanding Your Audience'],sourceIds:[MOCK_SURVEYS[0].id,MOCK_SURVEYS[1].id],fields:[]};
}
function migrateFields(record:PrototypeSurveyStack,sources:StackSource[]){
 if(record.mappedFields)return structuredClone(record.mappedFields);
 if(!record.fields.length)return seedStackFields(sources,getQuestionsBySurvey);
 return record.fields.map(old=>{
  let field:MappedStackField={id:String(old.id),label:old.fieldLabel,answers:[],sources:{}};
  sources.forEach((source,index)=>{const qs=getQuestionsBySurvey(source.id);const oldId=index===0?old.sourceOneValue:old.sourceTwoValue;const q=qs.find(q=>String(q.id)===oldId)??qs.find(q=>oldId==='gender'&&q.code==='Q1');if(q){field=mapFieldQuestion(field,source.id,q);if(index===1&&old.optionMatches.length)field.sources[source.id].answers=old.optionMatches.map(label=>q.options?.indexOf(label)??-1);}});
  return field;
 });
}
export default function SurveyStackEditor({newName}:{newName?:string}={}){
 const params=useParams<{id:string}>();const id=Number(params.id);const [record,setRecord]=useState<PrototypeSurveyStack|null>(null);const [error,setError]=useState('');
 // Browser storage is loaded after hydration; never overwrite malformed saved data.
 // eslint-disable-next-line react-hooks/set-state-in-effect
 useEffect(()=>{try{setRecord(newName!==undefined?{id:Date.now(),name:newName,createdOn:new Date().toISOString().slice(0,10),completedResponses:0,sourceNames:['',''],fields:[]}:loadDraft(id));}catch{setError('Saved Survey Stacks could not be loaded. Your data has been preserved.');}},[id,newName]);
 if(error)return <p role="alert">{error}</p>;if(!record)return <p className={styles.main}>Loading Survey Stack…</p>;
 return <Editor key={record.id} initial={record} isNew={newName!==undefined}/>;
}
function Editor({initial,isNew}:{initial:PrototypeSurveyStack;isNew:boolean}){
 const router=useRouter(),base=useBiProductBasePath();const path=withBiProductBasePath(base,'/survey-stacks');const {showToast}=useWuShowToast();
 const initialSources=initial.sources??initial.sourceIds?.map((id,i)=>({id,name:initial.sourceNames[i]}))??[];
 const [sources,setSources]=useState<StackSource[]>(initialSources);const [fields,setFields]=useState<MappedStackField[]>(()=>migrateFields(initial,initialSources));const [expanded,setExpanded]=useState<string[]>([]);const [picker,setPicker]=useState<'add'|number|null>(null);const [menu,setMenu]=useState<number|null>(null);const [remove,setRemove]=useState<{kind:'field'|'survey';id:string|number}|null>(null);const [error,setError]=useState('');
 function save(){try{saveCreatedSurveyStack({...initial,sources,mappedFields:fields,sourceNames:[sources[0]?.name??'',sources[1]?.name??''],completedResponses:sources.reduce((n,s)=>n+(MOCK_SURVEYS.find(q=>q.id===s.id)?.completedResponses??0),0)});showToast({message:isNew?'Survey stack created':`Survey stack '${initial.name}' updated successfully`,variant:'success'});if(isNew)router.push(path);}catch{setError('Could not save changes. Your draft is still available.');}}
 function addSources(added:StackSource[]){
  if(typeof picker==='number'){const old=picker;const next=sources.map(s=>s.id===old?added[0]:s);setSources(next);setFields(fields.map(f=>{const rest={...f.sources};delete rest[old];return autoMapSource({...f,sources:rest},added[0].id,getQuestionsBySurvey(added[0].id));}));}
  else{const next=[...sources,...added];setSources(next);setFields(sources.length?fields.map(f=>added.reduce((mapped,s)=>autoMapSource(mapped,s.id,getQuestionsBySurvey(s.id)),f)):seedStackFields(next,getQuestionsBySurvey));}setPicker(null);
 }
 const canSave=sources.length>=2&&fields.length>0&&fields.every(f=>f.label.trim()&&f.type&&Object.values(f.sources).every(m=>m.questionId===null||m.answers.every(i=>i>=0)));
 return <div className={styles.page}><header className={styles.header}><h1>{initial.name||'New Survey Stack'}</h1><div className={styles.actions}><StackButton variant="secondary" onClick={()=>router.push(path)}>Cancel</StackButton>{sources.length>0&&<StackButton disabled={!canSave} onClick={save}>{isNew?'Save':'Update'}</StackButton>}</div></header>{error&&<p role="alert" className={styles.error}>{error}</p>}
 {!sources.length?<div className={styles.productionEmpty}><h2>Add your surveys</h2><p>Click on plus button to create survey stack</p><StackButton variant="link" onClick={()=>setPicker('add')}>＋ Add survey</StackButton></div>:<><div className={styles.mappingViewport}><table className={styles.fieldTable} style={{width:490+sources.length*300}}><thead><tr><th>Data type</th><th>Field label</th>{sources.map(s=><th key={s.id}><div className={styles.surveyHeading}><span>{s.name}</span><button aria-label={`Options for ${s.name}`} onClick={()=>setMenu(menu===s.id?null:s.id)}>⋮</button>{menu===s.id&&<div className={styles.columnMenu}><button onClick={()=>{setPicker(s.id);setMenu(null);}}>Replace</button><button onClick={()=>{setRemove({kind:'survey',id:s.id});setMenu(null);}}>Delete</button></div>}</div></th>)}<th><button className={styles.iconButton} aria-label="Add survey" onClick={()=>setPicker('add')}>＋</button></th></tr></thead><tbody>{fields.map(f=>{
 const open=expanded.includes(f.id);return <Fragment key={f.id}><tr className={open?styles.expandedRow:''}><td><span className={styles.dataType}><StackTypeIcon type={f.type}/></span></td><td><StackInput aria-label={`Field label ${f.id}`} value={f.label} variant="flat" onChange={e=>setFields(fields.map(x=>x.id===f.id?{...x,label:e.target.value}:x))}/></td>{sources.map((s,index)=>{
 const qs=index===0&&!f.type?getQuestionsBySurvey(s.id):compatibleFieldQuestions(f,getQuestionsBySurvey(s.id));const mapping=f.sources[s.id];return <td key={s.id}><StackSelect label={`${s.name}: ${f.label}`} value={String(mapping?.questionId??'')} options={qs.map(q=>({value:String(q.id),label:q.text}))} placeholder={qs.length?'---Select question---':'No question to select'} disabled={!qs.length||(!f.type&&index>0)} onChange={value=>{const q=qs.find(q=>q.id===Number(value))!;let next=mapFieldQuestion(f,s.id,q);if(!f.type)for(const other of sources.filter(x=>x.id!==s.id))next=autoMapSource(next,other.id,getQuestionsBySurvey(other.id));setFields(fields.map(x=>x.id===f.id?next:x));}}/></td>;})}<td><div className={styles.rowActions}><button className={styles.iconButton} disabled={!f.answers.length} aria-label={`${open?'Collapse':'Expand'} ${f.label}`} onClick={()=>setExpanded(open?expanded.filter(id=>id!==f.id):[...expanded,f.id])}>{open?'⌃':'⌄'}</button><button className={styles.iconButton} aria-label={`Delete ${f.label}`} onClick={()=>setRemove({kind:'field',id:f.id})}>⌫</button></div></td></tr>{open&&f.answers.map((answer,i)=><tr key={i} className={styles.answerRow}><td/><td>{answer}</td>{sources.map(s=>{const mapping=f.sources[s.id],q=getQuestionsBySurvey(s.id).find(q=>q.id===mapping?.questionId);return <td key={s.id}><StackSelect label={`${s.name}: ${f.label}: ${answer}`} value={String(mapping?.answers[i]??-1)} options={(q?.options??[]).map((label,index)=>({value:String(index),label}))} placeholder={q?'Select answer':'No answer to select'} disabled={!q} onChange={value=>setFields(fields.map(x=>x.id===f.id?setFieldAnswer(x,s.id,i,Number(value)):x))}/></td>;})}<td/></tr>)}</Fragment>;
 })}</tbody></table></div><div className={styles.addFieldBar}><StackButton onClick={()=>setFields([...fields,{id:crypto.randomUUID(),label:'untitled',answers:[],sources:{}}])}>＋ Add field</StackButton></div></>}
 {picker!==null&&<StackSurveyPicker excluded={sources.map(s=>s.id)} single={typeof picker==='number'} replace={typeof picker==='number'} min={sources.length?1:2} onClose={()=>setPicker(null)} onSave={addSources}/>}
 {remove&&<StackDialog title={remove.kind==='field'?'Delete question field':'Delete survey'} onClose={()=>setRemove(null)} footer={<StackButton onClick={()=>{if(remove.kind==='field')setFields(fields.filter(f=>f.id!==remove.id));else{setSources(sources.filter(s=>s.id!==remove.id));setFields(fields.map(f=>{const next={...f.sources};delete next[Number(remove.id)];return {...f,sources:next};}));}setRemove(null);}}>Yes</StackButton>}><p>Are you sure you want to delete this {remove.kind}? {remove.kind==='field'?'This will remove its mapping across all surveys.':'Its mappings will be removed from this stack.'}</p></StackDialog>}
 </div>;
}
