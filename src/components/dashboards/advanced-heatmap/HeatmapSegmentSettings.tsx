'use client';

import { useState } from 'react';
import { type AdvancedHeatmapConfig, type HeatmapQuestion } from '@/data/advanced-heatmap';
import { equalThresholds } from '@/data/heat-map-baseline';
import { HeatMapSelect } from '../heat-map/HeatMapSelect';
import { Toggle, Select, Scope, ReversePicker, Thresholds, EmptyWeightingPicker } from '../heat-map/HeatMapSettingsControls';
import { HeatmapFilterSettings } from './HeatmapFilterSettings';
import styles from '../heat-map/HeatMapBaseline.module.css';

type Props = { draft: AdvancedHeatmapConfig; questions: HeatmapQuestion[]; update: (patch: Partial<AdvancedHeatmapConfig>) => void };
export function HeatmapSegmentAnalytics({ draft, questions, update, colors }: Props & {colors:string[]}) {
  return <>
    <Select label="Decimal precision" value={draft.precision} options={[0,1,2,3,4]} onChange={value=>update({precision:Number(value)})}/>
    <Toggle label="Overall column" checked={draft.showOverall} onChange={showOverall=>update({showOverall})}/>
    <Toggle label="Response count" checked={draft.showBases} onChange={showBases=>update({showBases})}/>
    <Toggle label="Overall average" checked={draft.overallAverage??false} onChange={overallAverage=>update({overallAverage})}/>
    {!draft.customMetric && <Select label="Show mean values in range" value={draft.scoreRange??'Default'} options={['Default','0–5','0–10']} onChange={scoreRange=>update({scoreRange:scoreRange as AdvancedHeatmapConfig['scoreRange']})}/>}
    <ReversePicker questions={questions.filter(q=>q.rows.some(r=>draft.selected.includes(r.id))).map(q=>({id:q.id,title:`${q.code}. ${q.label}`}))} selected={draft.reverse} onChange={reverse=>update({reverse})}/>
    <Thresholds bands={draft.bands??5} thresholds={draft.thresholds??[20,40,60,80]} colors={colors} onBandsChange={bands=>update({bands,thresholds:equalThresholds(bands)})} onThresholdsChange={thresholds=>update({thresholds})}/>
    <Toggle label="Widget stats" checked={draft.widgetStats??false} onChange={widgetStats=>update({widgetStats})}/>
    {draft.widgetStats && <div className={styles.nested}><Toggle label="Response count statistic" checked={draft.statsResponseCount??true} onChange={statsResponseCount=>update({statsResponseCount})}/><label className={styles.field}><span>Statistic label</span><input value={draft.statsLabel??'Response count'} onChange={e=>update({statsLabel:e.target.value})}/></label></div>}
    <h3>Weighting schemes</h3><Scope label="Scheme type" value={draft.weighting??'Dashboard'} options={['Dashboard','Widget','None']} onChange={weighting=>update({weighting:weighting as AdvancedHeatmapConfig['weighting']})}/>
    {draft.weighting==='Widget' && <EmptyWeightingPicker/>}
  </>;
}
export function HeatmapSegmentLabels({draft,questions,update}:Props) {
  const [search,setSearch]=useState('');
  const [sorted,setSorted]=useState(false);
  const [renaming,setRenaming]=useState<string|null>(null);
  const q=questions.find(q=>q.rows.some(r=>r.id===draft.segmentRow));
  const available=[...(q?.options??[]).map(o=>({id:o.id,name:draft.segmentAliases?.[o.id]||o.label})),...(draft.customSegments??[])];
  const rows=available.filter(s=>`${s.name} ${s.id}`.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>sorted?a.name.localeCompare(b.name):0);
  return <>
    <label className={styles.field}><span>Create segments from</span><HeatMapSelect label="Create segments from" value={draft.segmentRow} options={questions.filter(q=>!q.text&&q.type!=='Rank order').flatMap(q=>q.rows.map(r=>r.id))} formatOption={id=>{const q=questions.find(q=>q.rows.some(r=>r.id===id));return `${q?.code}. ${q?.rows.find(r=>r.id===id)?.label}`;}} onChange={segmentRow=>update({segmentRow})}/></label>
    <h3>Manage columns (segments) to display</h3>
    <div className={styles.searchRow}><input aria-label="Search segments" placeholder="Search by segment name or id" value={search} onChange={e=>setSearch(e.target.value)}/><HeatmapFilterSettings segment regular config={{...draft,widgetFilter:undefined}} questions={questions} update={patch=>{if(patch.widgetFilter)update({customSegments:[...(draft.customSegments??[]),{...patch.widgetFilter,id:`segment-${crypto.randomUUID()}`}]});}} renderActions={open=><button type="button" onClick={open}>Create segment</button>}/></div>
    <table className={styles.segmentTable}><thead><tr><th><input aria-label="Select all segments" type="checkbox" checked={available.length>0&&available.every(s=>!draft.hiddenSegments?.includes(s.id))} onChange={e=>update({hiddenSegments:e.target.checked?[]:available.map(s=>s.id)})}/></th><th>#</th><th><button type="button" onClick={()=>setSorted(!sorted)}>Segment name ↕</button></th><th/></tr></thead><tbody>
      {rows.map((s,index)=>{const custom=draft.customSegments?.find(c=>c.id===s.id);return <tr key={s.id}><td><input type="checkbox" aria-label={`Show ${s.name}`} checked={!draft.hiddenSegments?.includes(s.id)} onChange={e=>update({hiddenSegments:e.target.checked?(draft.hiddenSegments??[]).filter(id=>id!==s.id):[...(draft.hiddenSegments??[]),s.id]})}/></td><td>{index+1}</td><td>{renaming===s.id?<input autoFocus aria-label={`Rename segment ${s.name}`} value={s.name} onChange={e=>update({segmentAliases:{...draft.segmentAliases,[s.id]:e.target.value}})} onBlur={()=>setRenaming(null)} onKeyDown={e=>{if(e.key==='Enter'||e.key==='Escape')setRenaming(null);}}/>:s.name}</td><td className={styles.segmentActions}>
        {custom?<HeatmapFilterSettings segment regular config={{...draft,widgetFilter:custom}} questions={questions} update={patch=>update({customSegments:patch.widgetFilter?draft.customSegments!.map(c=>c.id===s.id?{...patch.widgetFilter!,id:c.id}:c):draft.customSegments!.filter(c=>c.id!==s.id)})} renderActions={open=><><button type="button" aria-label={`Edit ${s.name}`} onClick={open}>✎</button><button type="button" aria-label={`Delete ${s.name}`} onClick={()=>update({customSegments:draft.customSegments!.filter(c=>c.id!==s.id)})}>×</button></>}/>:<button type="button" aria-label={`Edit ${s.name}`} onClick={()=>setRenaming(s.id)}>✎</button>}
      </td></tr>;})}
    </tbody></table>
  </>;
}
