import { reportingBuckets, type DashboardDateSelection, type ReportingInterval } from './reporting-year';

export type TimeSeriesKind = 'segment-trend' | 'scoring-trend' | 'response-timeline';
export interface TimeSeriesSegment { id:string; name:string; group:'All responses'|'Segment 1'|'Segment 2'; dates?:DashboardDateSelection; status?:'All responses'|'Completed'|'Partial'|'Terminated'; }
export interface TimeSeriesSettings {
  name: string; showName: boolean; highlighted: boolean;
  interval: ReportingInterval; filter: 'Dashboard' | 'Widget' | 'Combined' | 'None';
  widgetDates: DashboardDateSelection; axisTitles: boolean; xTitle: string; yTitle: string;
  highlightHighest: boolean; dataLabels: string; customAxis: boolean; minimum: number; maximum: number;
  metric: 'Count' | 'Percent'; movingAverage: boolean; windowSize: number; exclude: boolean; minimumResponses: number;
  precision: number; stats: boolean; tooltip: 'Default' | 'Custom' | 'None'; tooltipTitle:boolean; tooltipCount:boolean; tooltipPercentage:boolean;
  scoring: 'Mean' | 'Net promoter score' | 'Customer effort score' | 'Customer satisfaction score';
  customMean: boolean; scores: number[];
  weighting: 'Dashboard' | 'Widget' | 'None';
  customDenominator: boolean; perSegmentDenominator:boolean; denominatorSegment?:TimeSeriesSegment; denominators:Record<string,TimeSeriesSegment>;
  segments: TimeSeriesSegment[];
  design: 'Dashboard' | 'Widget'; color: string; fontSize: number; fontFamily: string;
}
export function defaultTimeSeriesSettings(kind: TimeSeriesKind, name: string): TimeSeriesSettings {
  return { name, showName:true, highlighted:false, interval:kind === 'response-timeline' ? 'Daily' : 'Monthly', filter:'Dashboard', widgetDates:{startDate:'',endDate:''}, axisTitles:false,xTitle:'',yTitle:'',highlightHighest:false,dataLabels:kind === 'response-timeline' ? 'Inside Top' : kind === 'scoring-trend' ? 'None' : 'Above',customAxis:false,minimum:0,maximum:100,metric:'Count',movingAverage:false,windowSize:2,exclude:false,minimumResponses:0,precision:1,stats:false,tooltip:'Default',tooltipTitle:true,tooltipCount:true,tooltipPercentage:true,scoring:'Mean',customMean:false,scores:[1,2,3,4,5,6,7],weighting:'Dashboard',customDenominator:false,perSegmentDenominator:false,denominators:{},segments:[{id:'segment1',name:'Segment 1',group:'Segment 1'},{id:'segment2',name:'Seg 2',group:'Segment 2'}],design:'Dashboard',color:'#6575aa',fontSize:13,fontFamily:'Fira Sans' };
}
export const DEFAULT_TIME_WINDOW = { startDate:'2026-01-01', endDate:'2026-12-31' };
export function effectiveTimeWindow(dashboard: DashboardDateSelection | undefined, settings: TimeSeriesSettings): DashboardDateSelection {
  const global = dashboard?.startDate && dashboard.endDate ? dashboard : DEFAULT_TIME_WINDOW;
  const local = settings.widgetDates.startDate && settings.widgetDates.endDate ? settings.widgetDates : DEFAULT_TIME_WINDOW;
  if (settings.filter === 'None') return DEFAULT_TIME_WINDOW;
  if (settings.filter === 'Widget') return local;
  if (settings.filter === 'Dashboard' || !settings.widgetDates.startDate || !settings.widgetDates.endDate) return global;
  return { ...global, startDate:global.startDate > local.startDate ? global.startDate : local.startDate, endDate:global.endDate < local.endDate ? global.endDate : local.endDate };
}

/** Synthetic fixture: all metrics use the same daily eligible response counts. */
export function timeSeriesData(kind: TimeSeriesKind, settings: TimeSeriesSettings, dashboard?: DashboardDateSelection) {
  const selection = effectiveTimeWindow(dashboard, settings);
  const buckets = reportingBuckets(selection, settings.interval);
  const series = kind === 'segment-trend' ? settings.segments.map((s,i)=>({field:s.id,name:s.name,color:i ? '#90bef2' : settings.color})) : [{field:'value',name:kind === 'scoring-trend' ? settings.scoring : 'Responses',color:settings.color}];
  const rows = buckets.map(bucket => {
    const total = bucket.segment1 + bucket.segment2;
    const row: Record<string,string|number|null> & { category:string } = { category:bucket.label, coverage:`${bucket.startDate} – ${bucket.endDate}`, responses:total };
    if (kind === 'segment-trend') {
      const count = (segment:TimeSeriesSegment) => {
        const start=segment.dates?.startDate && segment.dates.startDate > bucket.startDate ? segment.dates.startDate : bucket.startDate;
        const end=segment.dates?.endDate && segment.dates.endDate < bucket.endDate ? segment.dates.endDate : bucket.endDate;
        let value=0;
        for (let t=Date.parse(start);t<=Date.parse(end);t+=86400000) {
          const d=Math.floor(t/86400000), first=3+d%11, second=4+d%17;
          const n=segment.group==='Segment 1'?first:segment.group==='Segment 2'?second:first+second;
          value+=segment.status==='Completed' ? n-Math.floor(n/4)-1 : segment.status==='Partial' ? Math.floor(n/4) : segment.status==='Terminated' ? 1 : n;
        }
        return value;
      };
      settings.segments.forEach(s=>{
        const numerator=count(s);
        const denominatorDefinition=settings.perSegmentDenominator ? settings.denominators[s.id] : settings.denominatorSegment;
        const denominator=settings.customDenominator && denominatorDefinition ? count(denominatorDefinition) : total;
        row[`${s.id}Count`]=numerator; row[`${s.id}Percent`]=denominator ? Number((100*numerator/denominator).toFixed(1)) : null;
        row[s.id]=settings.exclude&&numerator<settings.minimumResponses ? null : settings.metric==='Count' ? numerator : denominator ? 100*numerator/denominator : null;
      });
    } else if (kind === 'response-timeline') { row.value = total; row.valueCount=total; row.valuePercent=100; }
    else {
      let sum = 0, base = 0, positive = 0, negative = 0;
      for (let t=Date.parse(bucket.startDate); t<=Date.parse(bucket.endDate); t+=86400000) {
        const day = Math.floor(t/86400000), counts=[3+day%11,4+day%17];
        counts.forEach((n,i)=>{ const score=(day+i*3)%7+1; base+=n; sum+=n*(settings.customMean ? settings.scores[score-1] : score); if(score>=6) positive+=n; if(score<=4) negative+=n; });
      }
      row.value = !base || (settings.exclude && base<settings.minimumResponses) ? null : settings.scoring === 'Mean' ? sum/base : settings.scoring === 'Net promoter score' ? 100*(positive-negative)/base : 100*positive/base;
    }
    return row;
  });
  const smoothed = rows.map((row,i)=>{
    const result={...row};
    for(const s of series) {
      let value=row[s.field];
      if(settings.movingAverage && value !== null) {
        const values=rows.slice(Math.max(0,i-settings.windowSize+1),i+1).map(r=>r[s.field]).filter((v):v is number=>typeof v==='number');
        value=values.length ? values.reduce((a,b)=>a+b,0)/values.length : null;
      }
      result[s.field]=typeof value==='number' ? Number(value.toFixed(kind==='scoring-trend' ? settings.precision : settings.metric==='Percent'||settings.movingAverage ? 1 : 0)) : value;
    }
    return result;
  });
  return {rows:smoothed,series,selection,total:buckets.reduce((sum,b)=>sum+b.segment1+b.segment2,0)};
}
