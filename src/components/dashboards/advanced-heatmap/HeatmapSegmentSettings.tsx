'use client';

import {useState} from 'react';
import {type AdvancedHeatmapConfig, type HeatmapQuestion} from '@/data/advanced-heatmap';
import {HeatMapSelect} from '../heat-map/HeatMapSelect';
import {HeatmapFilterSettings} from './HeatmapFilterSettings';
import styles from './AdvancedHeatmap.module.css';

type Props = {draft: AdvancedHeatmapConfig; questions: HeatmapQuestion[]; update:(patch:Partial<AdvancedHeatmapConfig>)=>void};
export function HeatmapSegmentAnalytics({draft,questions,update}:Props) {
 const bands=draft.bands ?? 5, thresholds=draft.thresholds ?? [20,40,60,80];
 const selected=questions.filter(q=>q.rows.some(r=>draft.selected.includes(r.id)));
 return <>
  <label className={styles.check}><input type="checkbox" checked={draft.showOverall} onChange={e=>update({showOverall:e.target.checked})}/>Overall column</label>
  <label className={styles.check}><input type="checkbox" checked={draft.showBases} onChange={e=>update({showBases:e.target.checked})}/>Response count</label>
  <label className={styles.check}><input type="checkbox" checked={draft.overallAverage ?? false} onChange={e=>update({overallAverage:e.target.checked})}/>Overall average</label>
  {!draft.customMetric && <label className={styles.field}>Show mean values in range<HeatMapSelect label="Show mean values in range" value={draft.scoreRange ?? 'Default'} options={['Default','0–5','0–10']} onChange={scoreRange=>update({scoreRange:scoreRange as AdvancedHeatmapConfig['scoreRange']})}/></label>}
  <details className={styles.group}><summary>Reverse weightage for questions</summary>{selected.map(q=><label className={styles.check} key={q.id}><input type="checkbox" checked={draft.reverse.includes(q.id)} onChange={e=>update({reverse:e.target.checked ? [...draft.reverse,q.id] : draft.reverse.filter(id=>id!==q.id)})}/>{q.code}. {q.label}</label>)}</details>
  <label className={styles.field}>Assign threshold values<HeatMapSelect label="Assign threshold values" value={bands} options={[2,3,4,5]} onChange={value=>update({bands:Number(value),thresholds:Array.from({length:Number(value)-1},(_,i)=>Math.round((i+1)*1000/Number(value))/10)})}/></label>
  {thresholds.map((value,i)=><label className={styles.field} key={i}>Threshold {i+1}: {value}%<input aria-label={`Threshold ${i+1}`} type="range" min={0} max={100} step={0.1} value={value} onChange={e=>{const next=Math.max((thresholds[i-1]??0)+.1,Math.min((thresholds[i+1]??100)-.1,Number(e.target.value)));update({thresholds:thresholds.map((v,j)=>j===i?Math.round(next*10)/10:v)});}}/></label>)}
  <div className={styles.muted}>{Array.from({length:bands},(_,i)=><div key={i}>{(bands===2?['Unfavorable','Favorable']:bands===3?['Unfavorable','Neutral','Favorable']:bands===4?['Highly unfavorable','Unfavorable','Favorable','Highly favorable']:['Highly unfavorable','Unfavorable','Neutral','Favorable','Highly favorable'])[i]}: {i?thresholds[i-1]:0}–{thresholds[i]??100}%</div>)}</div>
  <label className={styles.check}><input type="checkbox" checked={draft.widgetStats??false} onChange={e=>update({widgetStats:e.target.checked})}/>Widget stats</label>
  {draft.widgetStats && <><label className={styles.check}><input type="checkbox" checked={draft.statsResponseCount??true} onChange={e=>update({statsResponseCount:e.target.checked})}/>Response count statistic</label><label className={styles.field}>Statistic label<input value={draft.statsLabel??'Response count'} onChange={e=>update({statsLabel:e.target.value})}/></label></>}
  <h4 className={styles.sectionTitle}>Weighting schemes</h4><label className={styles.field}>Scheme type<HeatMapSelect label="Scheme type" value={draft.weighting??'Dashboard'} options={['Dashboard','Widget','None']} onChange={weighting=>update({weighting:weighting as AdvancedHeatmapConfig['weighting']})}/></label>{draft.weighting==='Widget' && <label className={styles.field}>Weighting scheme<button type="button" disabled>No schemes available</button></label>}<p className={styles.muted}>No respondent weighting schemes are available in this prototype. Custom metric answer weights are configured below.</p>
 </>;
}
export function HeatmapSegmentLabels({draft,questions,update}:Props) {
 const [search,setSearch]=useState('');
 const [sort,setSort]=useState(false);
 const q=questions.find(q=>q.rows.some(r=>r.id===draft.segmentRow));
 const available=[...(q?.options??[]).map(o=>({id:o.id,name:draft.segmentAliases?.[o.id]||o.label})),...(draft.customSegments??[])];
 return <>
  <label className={styles.field}>Create segments from<HeatMapSelect label="Create segments from" value={draft.segmentRow} options={questions.filter(q=>!q.text&&q.type!=='Rank order').flatMap(q=>q.rows.map(r=>r.id))} formatOption={id=>{const q=questions.find(q=>q.rows.some(r=>r.id===id));return `${q?.code}. ${q?.rows.find(r=>r.id===id)?.label}`;}} onChange={segmentRow=>update({segmentRow})}/></label>
  <h4 className={styles.sectionTitle}>Manage columns (segments) to display</h4>
  <input aria-label="Search segments" placeholder="Search segments" value={search} onChange={e=>setSearch(e.target.value)}/>
  <button type="button" className={styles.secondary} onClick={()=>setSort(!sort)}>Segment name {sort?'↓':'↑'}</button><label className={styles.check}><input type="checkbox" checked={available.length>0&&available.every(s=>!draft.hiddenSegments?.includes(s.id))} onChange={e=>update({hiddenSegments:e.target.checked?[]:available.map(s=>s.id)})}/>Select all segments</label>
  {available.filter(s=>s.name.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>a.name.localeCompare(b.name)*(sort?-1:1)).map(s=><div key={s.id} className={styles.segmentRow}><input type="checkbox" aria-label={`Show ${s.name}`} checked={!draft.hiddenSegments?.includes(s.id)} onChange={e=>update({hiddenSegments:e.target.checked?(draft.hiddenSegments??[]).filter(id=>id!==s.id):[...(draft.hiddenSegments??[]),s.id]})}/>{draft.customSegments?.some(c=>c.id===s.id)?<HeatmapFilterSettings segment config={{...draft,widgetFilter:draft.customSegments.find(c=>c.id===s.id)}} questions={questions} update={patch=>update({customSegments:patch.widgetFilter?draft.customSegments!.map(c=>c.id===s.id?{...patch.widgetFilter!,id:c.id}:c):draft.customSegments!.filter(c=>c.id!==s.id)})}/>:<input aria-label={`Rename segment ${s.name}`} value={s.name} onChange={e=>update({segmentAliases:{...draft.segmentAliases,[s.id]:e.target.value}})}/>}</div>)}
  <HeatmapFilterSettings segment config={{...draft,widgetFilter:undefined}} questions={questions} update={patch=>{if(patch.widgetFilter)update({customSegments:[...(draft.customSegments??[]),{...patch.widgetFilter,id:`segment-${crypto.randomUUID()}`}]});}}/>
 </>;
}
