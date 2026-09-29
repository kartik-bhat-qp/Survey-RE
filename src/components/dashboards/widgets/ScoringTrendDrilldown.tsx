'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { IWuDrilldownContext } from '@npm-questionpro/wick-ui-lib';
import { BiAmChart } from '@/components/charts/amcharts/BiAmChart';
import type { AiWidgetChartPayload } from '@/components/charts/amcharts/types';
import type { AmChartTypography } from '@/components/charts/amcharts/theme';
import { SCORING_ANSWER_LABELS, scoringDistribution, scoringResponses, type ScoringFilterContext, type TimeSeriesSettings } from '@/data/time-series';
import { formatReportingDate } from '@/data/reporting-year';
import styles from './ScoringTrendDrilldown.module.css';

const WuDrilldown = dynamic(() => import('@npm-questionpro/wick-ui-lib').then(m => ({ default:m.WuDrilldown })), {ssr:false});
const COLORS = ['#6579a5','#63b09e','#a4d29a','#d2944e','#9e5040','#a58aa8','#637aaa'];
type Period = { category:string; startDate:string; endDate:string };

function DetailHeading({ children, onBack, backLabel }: { children:React.ReactNode; onBack:()=>void; backLabel:string }) {
  const ref=useRef<HTMLHeadingElement>(null);
  useEffect(()=>{ ref.current?.focus({preventScroll:true}); },[]);
  return <div className={styles.detailHeader}><button type="button" onClick={onBack} aria-label={backLabel} title={backLabel}><span className="wm-arrow-back" aria-hidden/></button><h4 tabIndex={-1} ref={ref} className={styles.detailHeading}>{children}</h4></div>;
}

function ResponseItems({records, answer}: {records:ReturnType<typeof scoringResponses>;answer:number}) {
  const [search,setSearch]=useState('');
  const [page,setPage]=useState(0);
  const [newest,setNewest]=useState(true);
  const matches=useMemo(()=>records.filter(record=>record.answer===answer && `${record.id} ${record.date} ${record.attributes.status} ${record.attributes.region} ${SCORING_ANSWER_LABELS[record.answer-1]}`.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>(newest ? -1 : 1)*a.id.localeCompare(b.id)),[records,answer,search,newest]);
  const pageIndex=Math.min(page,Math.max(0,Math.ceil(matches.length/10)-1));
  return <div className={styles.responseView}>
    <div className={styles.responseToolbar}>
      <label className={styles.search}><span className="wm-search" aria-hidden/><input aria-label="Search matching responses" placeholder="Search" value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}/></label>
      <div className={styles.pagination}><button aria-label="Previous response page" disabled={pageIndex===0} onClick={()=>setPage(pageIndex-1)}><span className="wm-chevron-left" aria-hidden/></button><span aria-live="polite">{matches.length ? pageIndex*10+1 : 0} – {Math.min((pageIndex+1)*10,matches.length)} of {matches.length}</span><button aria-label="Next response page" disabled={(pageIndex+1)*10>=matches.length} onClick={()=>setPage(pageIndex+1)}><span className="wm-chevron-right" aria-hidden/></button></div>
      <button className={styles.sort} onClick={()=>{setNewest(!newest);setPage(0);}}><span className="wm-sort" aria-hidden/>{newest ? 'Newest first' : 'Oldest first'}</button>
    </div>
    <div className={styles.tableWrap}><table><caption className={styles.srOnly}>Matching item responses</caption><thead><tr><th>Response ID</th><th>Collected on</th><th>Response</th><th>Status</th><th>Region</th></tr></thead><tbody>{matches.slice(pageIndex*10,(pageIndex+1)*10).map(record=><tr key={record.id}><td>{record.id}</td><td>{formatReportingDate(record.date)}</td><td>{SCORING_ANSWER_LABELS[record.answer-1]}</td><td className={styles.status}>{record.attributes.status}</td><td>{record.attributes.region}</td></tr>)}</tbody></table>{!matches.length && <p className={styles.empty}>No responses match your search.</p>}</div>
  </div>;
}

export function ScoringTrendDrilldown({widgetId,payload,settings,context,typography}:{widgetId:string;payload:AiWidgetChartPayload;settings:TimeSeriesSettings;context:ScoringFilterContext;typography?:AmChartTypography}) {
  const [period,setPeriod]=useState<Period>();
  const [answer,setAnswer]=useState<number>();
  const records=useMemo(()=>period ? scoringResponses(period,settings,context) : [],[period,settings,context]);
  const distribution=useMemo(()=>scoringDistribution(records),[records]);
  const summary=period ? `${formatReportingDate(period.startDate)} – ${formatReportingDate(period.endDate)} · ${context.slice?.name ?? 'Overall'}` : '';
  function selectPeriod(category:string,nav:IWuDrilldownContext) {
    const row=payload.segmentTrendRows.find(row=>row.category===category);
    if (!row || row.value===null || !row.responses) return;
    setPeriod({category,startDate:String(row.startDate),endDate:String(row.endDate)});setAnswer(undefined);
    nav.goNext('LEVEL_2',{id:'LEVEL_2',title:category});
  }
  function selectAnswer(category:string,nav:IWuDrilldownContext) {
    const item=distribution.find(item=>item.category===category);
    if (!item?.count) return;
    setAnswer(item.answer);
    nav.goNext('LEVEL_3',{id:'LEVEL_3',title:category});
  }
  return <div className={styles.drilldown}>
    <WuDrilldown initial="LEVEL_1" baseTitle={{id:'LEVEL_1',title:'Scoring trend'}} variant="slideRight" mode="wait" headerClasses={styles.breadcrumbs} offsetHeight={38} items={{
      LEVEL_1:{component:nav=><div className={styles.level} data-drill-level="trend">
        <div className={styles.chart}>{payload.segmentTrendRows.some(row=>row.value!==null) ? <BiAmChart widgetId={`${widgetId}-trend`} chartType="segment-trend" data={{...payload,onTrendPointClick:category=>selectPeriod(category,nav)}} typography={typography}/> : <p className={styles.empty}>No matching results</p>}</div>
        <p className={styles.hint}>Select a point to view its answer distribution</p>
      </div>},
      LEVEL_2:{component:nav=><div className={styles.level} data-drill-level="distribution">
        <DetailHeading onBack={()=>nav.goBack('LEVEL_1')} backLabel="Back to scoring trend">Answer distribution</DetailHeading><p className={styles.context} title={summary}>{summary}</p>
        {settings.movingAverage && <p className={styles.note}>Responses for the selected period; the trend point uses a moving average.</p>}
        <div className={styles.chart}><BiAmChart widgetId={`${widgetId}-distribution`} chartType="bar" typography={typography} data={{...payload,ageBarItems:distribution.map((item,index)=>({...item,color:COLORS[index]})),barDrilldown:{onSelect:category=>selectAnswer(category,nav),counts:Object.fromEntries(distribution.map(item=>[item.category,item.count]))}}}/></div>
        <p className={styles.stats}>Response count <strong>{records.length.toLocaleString()}</strong><span>Select a bar to view responses</span></p>
        <div className={styles.srOnly} aria-label="Answer distribution values">{distribution.map(item=><button key={item.answer} disabled={!item.count} onClick={()=>selectAnswer(item.category,nav)}>{item.category}: {item.count} responses ({item.value}%). View responses</button>)}</div>
      </div>},
      LEVEL_3:{component:nav=> <div className={styles.level} data-drill-level="responses"><DetailHeading onBack={()=>nav.goBack('LEVEL_2')} backLabel="Back to answer distribution">Responses · {answer ? SCORING_ANSWER_LABELS[answer-1] : ''}</DetailHeading><p className={styles.context} title={summary}>{summary}</p>{answer && <ResponseItems records={records} answer={answer}/>}</div>},
    }}/>
  </div>;
}
