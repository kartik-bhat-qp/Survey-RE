'use client';
import {useState} from 'react';
import {useQuestionStacks} from '@/hooks/useQuestionStacks';
import type {QuestionStack} from '@/data/question-stacks';
import {StackInput} from './StackControls';
import styles from './Stacks.module.css';
export function StackSourcePicker({onSelect}:{onSelect:(stack:QuestionStack)=>void}){
  const {stacks,ready,error}=useQuestionStacks();const [search,setSearch]=useState('');
  return <div className={styles.form}><StackInput type="search" aria-label="Search Question Stacks" placeholder="Search Question Stacks" value={search} onChange={e=>setSearch(e.target.value)}/>{error&&<p role="alert" className={styles.error}>{error}</p>}<table className={styles.table}><thead><tr><th>Question Stack</th><th>Source survey</th><th>Metric groups</th></tr></thead><tbody>{stacks.filter(s=>s.name.toLowerCase().includes(search.toLowerCase())).map(s=><tr key={s.id}><td><button className={styles.link} onClick={()=>onSelect(s)}>{s.name}</button></td><td>{s.surveyName}</td><td>{s.groups.length}</td></tr>)}</tbody></table>{ready&&!stacks.length&&<p>Create a Question Stack in Stacks to use it here.</p>}</div>;
}
