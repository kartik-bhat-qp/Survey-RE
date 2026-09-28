'use client';

import { useState, type ReactNode } from 'react';
import { HeatMapSelect } from './HeatMapSelect';
import styles from './HeatMapBaseline.module.css';

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className={styles.field}><span>{label}</span>{children}</label>;
}
export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className={styles.toggle}><span>{label}</span><input type="checkbox" role="switch" aria-label={label} checked={checked} onChange={event => onChange(event.target.checked)} /><span aria-hidden className={styles.switch} /></label>;
}
export function Select({ label, value, options, onChange }: { label: string; value: string | number; options: (string | number)[]; onChange: (value: string) => void }) {
  return <Field label={label}><HeatMapSelect label={label} value={value} options={options} onChange={onChange} formatOption={option => label === 'Decimal precision' ? `${option} (${Number(option) === 0 ? '0' : `0.${'1234'.slice(0, Number(option))}`})` : String(option)} /></Field>;
}
export function Scope({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <fieldset className={styles.scope}><legend>{label}</legend><div>{options.map((option, index) => <button type="button" key={option} aria-label={`${label}: ${option}`} title={option} aria-pressed={value === option} onClick={() => onChange(option)}>{['▦', '▣', '⊘'][index]}<span>{option}</span></button>)}</div></fieldset>;
}
export function ReversePicker({ questions, selected, onChange }: { questions: {id:string; title:string}[]; selected:string[]; onChange:(ids:string[])=>void }) {
  const [open,setOpen]=useState(false);
  const [search,setSearch]=useState('');
  return <div className={styles.reverseField}><span>Reverse weightage for questions</span><button type="button" aria-label="Reverse weightage for questions" aria-expanded={open} className={styles.reverseTrigger} onClick={()=>setOpen(!open)}>{selected.length ? questions.filter(q=>selected.includes(q.id)).map(q=>q.title).join(', ') : 'Add question'}<span aria-hidden>▾</span></button>{open && <div className={styles.reverseOptions} onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();setOpen(false);}}}><input aria-label="Search reverse weightage questions" placeholder="Search" value={search} onChange={e=>setSearch(e.target.value)}/>{questions.filter(q=>q.title.toLowerCase().includes(search.toLowerCase())).map(q=><label key={q.id}><input type="checkbox" checked={selected.includes(q.id)} onChange={()=>onChange(selected.includes(q.id)?selected.filter(id=>id!==q.id):[...selected,q.id])}/>{q.title}</label>)}</div>}</div>;
}
export function Thresholds({bands,thresholds,colors,onBandsChange,onThresholdsChange,legacyTwoBandLabels=false}:{bands:number;thresholds:number[];colors:string[];onBandsChange:(bands:number)=>void;onThresholdsChange:(values:number[])=>void;legacyTwoBandLabels?:boolean}) {
  const names=bands===2?['Unfavorable','Neutral']:bands===3?['Unfavorable','Neutral','Favorable']:bands===4?['Highly unfavorable','Unfavorable','Favorable','Highly favorable']:['Highly unfavorable','Unfavorable','Neutral','Favorable','Highly favorable'];
  return <><div className={styles.thresholdHeading}><span>Assign threshold values</span><HeatMapSelect label="Assign threshold values" value={bands} options={[2,3,4,5]} onChange={value=>onBandsChange(Number(value))}/></div>
    <div className={styles.thresholdSlider} style={{background:`linear-gradient(to right, ${Array.from({length:bands},(_,i)=>`${colors[Math.min(i,colors.length-1)]} ${i?thresholds[i-1]:0}%, ${colors[Math.min(i,colors.length-1)]} ${thresholds[i]??100}%`).join(', ')})`}}>{thresholds.map((threshold,index)=><input key={index} type="range" aria-label={`Threshold ${index+1}`} min="0" max="100" step="0.1" value={threshold} onChange={e=>{const value=Math.max((thresholds[index-1]??0)+.1,Math.min((thresholds[index+1]??100)-.1,Number(e.target.value)));onThresholdsChange(thresholds.map((v,i)=>i===index?Math.round(value*10)/10:v));}}/>)}</div>
    <div className={styles.bands}>{Array.from({length:bands},(_,i)=>{const from=i?thresholds[i-1]:0,to=thresholds[i]??100;return <div key={i}><span>{names[i]}<b>{legacyTwoBandLabels?'33.3':(to-from).toFixed(1)}%</b><small>({from}–{to})</small></span></div>;})}</div></>;
}
export function EmptyWeightingPicker() {
 const [open,setOpen]=useState(false);
 return <div className={styles.reverseField}><button type="button" className={styles.reverseTrigger} aria-label="Weighting scheme" aria-expanded={open} onClick={()=>setOpen(!open)}>-Select-<span aria-hidden>▾</span></button>{open&&<div className={styles.reverseOptions}><input aria-label="Search weighting schemes" placeholder="Search"/><p>No results found.</p></div>}</div>;
}
