'use client';

import { useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import type { DashboardActiveFilter } from '@/data/mock-dashboard-filters';
import { appliedDataSlicers, type DataSlicer } from '@/data/mock-data-slicers';
import { ScoringTrendDrilldown } from './ScoringTrendDrilldown';
import { DashboardWidgetCard } from './DashboardWidgetCard';
import { BiAmChart } from '@/components/charts/amcharts/BiAmChart';
import { buildChartPayload } from './AiWidgetRenderer';
import { SharedDashboardDateFilter } from '../SharedDashboardDateFilter';
import { defaultTimeSeriesSettings, timeSeriesData, type TimeSeriesKind, type TimeSeriesSettings, type TimeSeriesSegment } from '@/data/time-series';
import type { DashboardDateSelection } from '@/data/reporting-year';
import type { AmChartTypography } from '@/components/charts/amcharts/theme';
import styles from './TimeSeriesDashboardCard.module.css';

export function TimeSeriesDashboardCard({ kind, title, widgetId, selection, dashboardFilter, dataSlicers=[], typography, storageKey, dragHandleClassName, readOnly=false, onOpenInsights, insightCount=0 }: {
  dashboardFilter?:DashboardActiveFilter;dataSlicers?:DataSlicer[];kind:TimeSeriesKind;title:string;widgetId:string;selection?:DashboardDateSelection;typography?:AmChartTypography;storageKey:string;dragHandleClassName?:string;readOnly?:boolean;onOpenInsights?:()=>void;insightCount?:number;
}) {
  const [settings,setSettings]=useState<TimeSeriesSettings>(()=>{
    const defaults=defaultTimeSeriesSettings(kind,title);
    try { const saved=localStorage.getItem(storageKey); const next=saved ? {...defaults,...JSON.parse(saved)} : defaults; if (!['Default','Custom','None'].includes(next.tooltip)) next.tooltip='Default'; return next; } catch {return defaults;}
  });
  const [sliceId,setSliceId]=useState<number>();
  const slices=appliedDataSlicers(dataSlicers);
  const slice=slices.find(slice=>slice.id===sliceId);
  const context=useMemo(()=>({dashboardFilter,slice}),[dashboardFilter,slice]);
  const [open,setOpen]=useState(false);
  const [tab,setTab]=useState('General');
  const [search,setSearch]=useState('');
  const [segmentDraft,setSegmentDraft]=useState<TimeSeriesSegment>();
  const [denominatorFor,setDenominatorFor]=useState<string>();
  function update<K extends keyof TimeSeriesSettings>(key:K,value:TimeSeriesSettings[K]) {
    setSettings(current=>{const next={...current,[key]:value};try { localStorage.setItem(storageKey,JSON.stringify(next)); } catch { /* Continue in session when storage is unavailable. */ } return next;});
  }
  const result=useMemo(()=>timeSeriesData(kind,settings,selection,context),[kind,settings,selection,context]);
  const payload=useMemo(()=>({...buildChartPayload(widgetId),segmentTrendRows:result.rows,segmentTrendSeries:result.series,timeSeriesOptions:{kind,dataLabels:settings.dataLabels,axisTitles:settings.axisTitles,xTitle:settings.xTitle,yTitle:settings.yTitle,highlightHighest:settings.highlightHighest,minimum:settings.customAxis ? settings.minimum : undefined,maximum:settings.customAxis ? Math.max(settings.minimum+1,settings.maximum) : undefined,tooltip:settings.tooltip,tooltipTitle:settings.tooltipTitle,tooltipCount:settings.tooltipCount,tooltipPercentage:settings.tooltipPercentage}}),[widgetId,result,settings,kind]);
  const chartTypography: AmChartTypography | undefined = settings.design==='Widget' ? {fontWeight:'400',fontStyle:'normal',...typography,fontFamily:settings.fontFamily,fontSize:settings.fontSize} : typography;
  const visual=(suffix:string)=><div className={styles.visual}>
    {kind==='scoring-trend' && slices.length>0 && <div className={styles.sliceTabs} role="tablist" aria-label="Data slices">
      {[{id:undefined,name:'Overall',description:'All responses within the applicable filters'},...slices].map(item=><button type="button" role="tab" key={item.id??'overall'} title={item.description ?? item.name} aria-selected={slice?.id===item.id} onClick={()=>setSliceId(item.id)}>{item.name}</button>)}
    </div>}
    {kind==='scoring-trend' ? <ScoringTrendDrilldown key={JSON.stringify([settings,selection,context])} widgetId={`${widgetId}-${suffix}`} payload={payload} settings={settings} context={context} typography={chartTypography}/> : result.rows.length ? <BiAmChart widgetId={`${widgetId}-${suffix}`} chartType="segment-trend" data={payload} typography={chartTypography} /> : <p className={styles.empty}>No matching results</p>}
    {settings.stats && <p className={styles.stats}>Response count <strong>{result.total.toLocaleString()}</strong></p>}
  </div>;

  const toggle=(label:string,key:'showName'|'highlighted'|'axisTitles'|'highlightHighest'|'customAxis'|'movingAverage'|'exclude'|'stats'|'customMean'|'customDenominator'|'perSegmentDenominator')=><div className={styles.row}><span>{label}</span><button type="button" role="switch" aria-label={label} aria-checked={settings[key]} className={styles.toggle} onClick={()=>update(key,!settings[key])}><span /></button></div>;
  const select=<K extends keyof TimeSeriesSettings>(label:string,key:K,values:readonly string[])=><label className={styles.field}>{label}<select aria-label={label} value={String(settings[key])} onChange={e=>update(key,e.target.value as TimeSeriesSettings[K])}>{values.map(v=><option key={v}>{v}</option>)}</select></label>;
  const modes=<K extends keyof TimeSeriesSettings>(label:string,key:K,values:readonly string[],icons:readonly string[])=><div className={styles.row}><span>{label}</span><div className={styles.modes}>{values.map((v,i)=><button type="button" key={v} title={v} aria-label={`${label}: ${v}`} aria-pressed={settings[key]===v} onClick={()=>update(key,v as TimeSeriesSettings[K])}>{icons[i].startsWith('wm-') ? <span className={icons[i]} /> : icons[i]}</button>)}</div></div>;
  const number=(label:string,key:'windowSize'|'minimumResponses'|'minimum'|'maximum',min=0,max=100000)=><label className={styles.field}>{label}<input type="number" aria-label={label} value={settings[key]} min={min} max={max} onChange={e=>update(key,Math.max(min,Math.min(max,Number(e.target.value))))} /></label>;
  return <>
    <DashboardWidgetCard className={kind==='scoring-trend' ? styles.scoringCard : undefined} title={settings.showName?settings.name:''} dragHandleClassName={dragHandleClassName} shared={readOnly} actions={readOnly?null:undefined} onOpenInsights={onOpenInsights} insightCount={insightCount} onOpenSettings={()=>{setTab('General');setOpen(true);}}>{visual('card')}</DashboardWidgetCard>
    <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Portal><Dialog.Overlay className={styles.overlay}/><Dialog.Content className={styles.dialog} aria-describedby={undefined}>
      <section className={styles.preview}><header><h3>{settings.showName&&settings.name}</h3><span className="wm-lightbulb" /></header>{visual('preview')}</section>
      <aside className={styles.panel}><header className={styles.panelHeader}><Dialog.Title>Settings</Dialog.Title><Dialog.Close aria-label="Close widget settings">×</Dialog.Close></header>
        <div className={styles.tabs} role="tablist" aria-label="Widget settings">{['General','Analytics',...(kind==='segment-trend'?['Segment']:[]),'Design'].map(value=><button type="button" key={value} role="tab" aria-selected={tab===value} onClick={()=>setTab(value)}>{value}</button>)}</div>
        <div className={styles.panelBody} role="tabpanel">
          {tab==='General'&&<>
            {toggle('Name','showName')}<input className={styles.name} aria-label="Widget name" value={settings.name} onChange={e=>update('name',e.target.value)}/>
            {toggle('Highlighted insight','highlighted')}
            <h4>Filter options</h4>{select('Filter type','filter',['Dashboard','Widget','Combined','None'])}
            {(settings.filter==='Widget'||settings.filter==='Combined')&&<SharedDashboardDateFilter {...settings.widgetDates} onChange={v=>update('widgetDates',v)}/>}
            <h4>Chart elements</h4>{toggle('Axis titles','axisTitles')}{settings.axisTitles&&<div className={styles.columns}><label className={styles.field}>X axis<input value={settings.xTitle} onChange={e=>update('xTitle',e.target.value)}/></label><label className={styles.field}>Y axis<input value={settings.yTitle} onChange={e=>update('yTitle',e.target.value)}/></label></div>}
            {toggle('Highlight highest','highlightHighest')}{select('Data labels','dataLabels',kind==='response-timeline'?['None','Outside','Inside Top','Inside Base','Center']:['None','Above','Below'])}
            {toggle('Custom axis range','customAxis')}{settings.customAxis&&<div className={styles.columns}>{number('Minimum','minimum',-100000)}{number('Maximum','maximum',-99999)}</div>}
          </>}
          {tab==='Analytics'&&<>
            {select('Interval','interval',kind==='response-timeline'?['Daily','Weekly','Monthly','Quarterly','Yearly']:['Weekly','Monthly','Quarterly','Yearly'])}
            {kind==='segment-trend'&&modes('Chart metric','metric',['Count','Percent'],['#','%'])}
            {toggle('Enable simple moving average mode','movingAverage')}{settings.movingAverage&&number('Number of intervals','windowSize',1,12)}
            {kind==='scoring-trend'&&<label className={styles.field}>Decimal precision<select aria-label="Decimal precision" value={settings.precision} onChange={e=>update('precision',Number(e.target.value))}>{[0,1,2,3,4,5].map(n=><option value={n} key={n}>{n} ({n===0?'1':(1/10**n).toFixed(n)})</option>)}</select></label>}
            {kind!=='response-timeline'&&<>{toggle('Exclude responses from trend','exclude')}{settings.exclude&&number('Minimum responses for trend','minimumResponses')}</>}
            {kind!=='segment-trend'&&toggle('Widget stats','stats')}
            {kind==='scoring-trend'?<>{select('Custom scoring model','scoring',['Net promoter score','Customer effort score','Customer satisfaction score','Mean'])}{settings.scoring==='Mean'&&<>{toggle('Custom mean calculation','customMean')}{settings.customMean&&<><p>Answers</p>{settings.scores.map((score,i)=><label className={styles.row} key={i}>{i+1}{i===0?' - Sad':i===6?' - Happy':''}<input type="number" aria-label={`Score for answer ${i+1}`} value={score} onChange={e=>update('scores',settings.scores.map((v,j)=>i===j?Number(e.target.value):v))}/></label>)}</>}</>}</>:modes('Tooltip style','tooltip',['Default','Custom','None'],['wm-near-me','wm-comment','wm-block'])}
            {kind!=='scoring-trend'&&settings.tooltip==='Custom'&&<div className={styles.tooltipChecks}>{(['tooltipTitle','tooltipCount','tooltipPercentage'] as const).map((key,i)=><label key={key}><input type="checkbox" checked={settings[key]} onChange={e=>update(key,e.target.checked)}/>{['Show title','Show count','Show percentage'][i]}</label>)}</div>}
            <h4>Weighting schemes</h4>{modes('Scheme type','weighting',['Dashboard','Widget','None'],['wm-dashboard','wm-bar-chart','wm-block'])}{settings.weighting==='Widget'&&<label className={styles.field}>Weighting scheme<select disabled><option>No weighting schemes available</option></select></label>}
          </>}
          {tab==='Segment'&&<>
            {toggle('Custom segment percentage calculation mode','customDenominator')}{settings.customDenominator&&<>{toggle('Custom for each segment','perSegmentDenominator')}{!settings.perSegmentDenominator&&<div className={styles.row}><span>Denominator segment</span><button onClick={()=>{setDenominatorFor('all');setSegmentDraft(settings.denominatorSegment??{id:'denominator',name:'Denominator',group:'All responses'});}}>{settings.denominatorSegment?'Edit':'Add'}</button></div>}</>}
            <div className={styles.searchRow}><input aria-label="Search by segment name" placeholder="Search by segment name" value={search} onChange={e=>setSearch(e.target.value)}/><button aria-label="Create segment" onClick={()=>{setDenominatorFor(undefined);setSegmentDraft({id:`segment-${crypto.randomUUID()}`,name:'',group:'All responses'});}}>+</button></div>
            <table className={styles.segments}><thead><tr><th>#</th><th>Segment name</th>{settings.customDenominator&&settings.perSegmentDenominator&&<th>Denominator</th>}<th/></tr></thead><tbody>{settings.segments.filter(s=>s.name.toLowerCase().includes(search.toLowerCase())).map((s,i)=><tr key={s.id}><td>{i+1}</td><td>{s.name}</td>{settings.customDenominator&&settings.perSegmentDenominator&&<td><button onClick={()=>{setDenominatorFor(s.id);setSegmentDraft(settings.denominators[s.id]??{id:`denominator-${s.id}`,name:"Denominator",group:"All responses"});}}>{settings.denominators[s.id]?"Edit":"Add"}</button></td>}<td><button aria-label={`Edit ${s.name}`} onClick={()=>{setDenominatorFor(undefined);setSegmentDraft({...s});}}><span className="wm-edit"/></button><button aria-label={`Remove ${s.name}`} onClick={()=>update('segments',settings.segments.filter(v=>v.id!==s.id))}><span className="wm-delete"/></button></td></tr>)}</tbody></table>

          </>}
          {tab==='Design'&&<>{modes('Design type','design',['Dashboard','Widget'],['wm-dashboard','wm-bar-chart'])}{settings.design==='Widget'&&<>
            <label className={styles.field}>Theme<select><option>Default</option></select></label><label className={styles.row}>Theme color<input type="color" aria-label="Theme color" value={settings.color} onChange={e=>update('color',e.target.value)}/></label>
            <label className={styles.field}>Color palette<select><option>Categorical</option></select></label><div className={styles.swatches}>{['#655699','#6575aa','#55a1b5','#52b397','#8ac589','#d6ce5f','#d39a41','#b75e49','#934434','#82435d','#b48aba'].map(color=><button key={color} style={{background:color}} aria-label={`Use ${color}`} onClick={()=>update('color',color)}/>)}</div>
            <div className={styles.columns}><label className={styles.field}>Font size<select value={settings.fontSize} onChange={e=>update('fontSize',Number(e.target.value))}>{[10,11,13,15,18].map((n,i)=><option value={n} key={n}>{['Extra small','Small','Medium','Large','Extra large'][i]}</option>)}</select></label>{select('Font family','fontFamily',['Fira Sans','Arial','Georgia','Verdana'])}</div>
          </>}</>}
        </div>
      </aside>
        <Dialog.Root open={!!segmentDraft} onOpenChange={next=>{if(!next)setSegmentDraft(undefined);}}><Dialog.Portal><Dialog.Overlay className={styles.segmentOverlay}/><Dialog.Content className={styles.segmentModal} aria-describedby={undefined}>
          <Dialog.Title>Create segment trend</Dialog.Title>
          {segmentDraft&&<>
            {!denominatorFor&&<input className={styles.name} aria-label="Segment name" placeholder="Segment name" value={segmentDraft.name} onChange={e=>setSegmentDraft({...segmentDraft,name:e.target.value})}/>}
            <p>Data source: Synthetic responses</p>
            <div className={styles.columns}><label className={styles.field}>Response status<select value={segmentDraft.status??'All responses'} onChange={e=>setSegmentDraft({...segmentDraft,status:e.target.value as TimeSeriesSegment['status']})}>{['All responses','Completed','Partial','Terminated'].map(v=><option key={v}>{v}</option>)}</select></label><label className={styles.field}>Filter by date<SharedDashboardDateFilter startDate={segmentDraft.dates?.startDate??''} endDate={segmentDraft.dates?.endDate??''} onChange={dates=>setSegmentDraft({...segmentDraft,dates})}/></label></div>
            <label className={styles.field}>Criteria<select aria-label="Segment criteria" value={segmentDraft.group} onChange={e=>setSegmentDraft({...segmentDraft,group:e.target.value as TimeSeriesSegment['group']})}>{['All responses','Segment 1','Segment 2'].map(g=><option key={g}>{g}</option>)}</select></label>
            <footer><button onClick={()=>setSegmentDraft(undefined)}>Cancel</button><button disabled={!segmentDraft.name.trim()} onClick={()=>{
              const saved={...segmentDraft,name:segmentDraft.name.trim()};
              if(denominatorFor==='all') update('denominatorSegment',saved);
              else if(denominatorFor) update('denominators',{...settings.denominators,[denominatorFor]:saved});
              else update('segments',settings.segments.some(s=>s.id===saved.id)?settings.segments.map(s=>s.id===saved.id?saved:s):[...settings.segments,saved]);
              setSegmentDraft(undefined);
            }}>Save</button></footer>
          </>}
        </Dialog.Content></Dialog.Portal></Dialog.Root>
    </Dialog.Content></Dialog.Portal></Dialog.Root>
  </>;
}
