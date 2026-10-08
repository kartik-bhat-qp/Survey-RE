import type { DashboardActiveFilter } from './mock-dashboard-filters';
import type { DataSlicer, SlicerField } from './mock-data-slicers';
import { reportingBuckets, type DashboardDateSelection, type ReportingInterval } from './reporting-year';
import { DESIGN_PALETTES } from './dashboard-design';

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
  palette?: string; seriesColors?: string[];
}
export function defaultTimeSeriesSettings(kind: TimeSeriesKind, name: string): TimeSeriesSettings {
  return { name, showName:true, highlighted:false, interval:kind === 'response-timeline' ? 'Daily' : 'Monthly', filter:'Dashboard', widgetDates:{startDate:'',endDate:''}, axisTitles:false,xTitle:'',yTitle:'',highlightHighest:false,dataLabels:kind === 'response-timeline' ? 'Inside Top' : kind === 'scoring-trend' ? 'None' : 'Above',customAxis:false,minimum:0,maximum:100,metric:'Count',movingAverage:false,windowSize:2,exclude:false,minimumResponses:0,precision:1,stats:kind === 'scoring-trend',tooltip:'Default',tooltipTitle:true,tooltipCount:true,tooltipPercentage:true,scoring:'Mean',customMean:false,scores:[1,2,3,4,5,6,7],weighting:'Dashboard',customDenominator:false,perSegmentDenominator:false,denominators:{},segments:[{id:'segment1',name:'Segment 1',group:'Segment 1'},{id:'segment2',name:'Seg 2',group:'Segment 2'}],design:'Dashboard',color:kind === 'scoring-trend' ? '#5b7aae' : '#6575aa',fontSize:13,fontFamily:'Fira Sans' };
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
export function timeSeriesData(kind: TimeSeriesKind, settings: TimeSeriesSettings, dashboard?: DashboardDateSelection, context?: ScoringFilterContext) {
  const selection = effectiveTimeWindow(dashboard, settings);
  const buckets = reportingBuckets(selection, settings.interval);
  const colors = settings.seriesColors?.length ? settings.seriesColors : DESIGN_PALETTES[settings.palette ?? 'categorical'] ?? DESIGN_PALETTES.categorical;
  const series = kind === 'segment-trend' ? settings.segments.map((s,i)=>({field:s.id,name:s.name,color:colors[i % colors.length]})) : [{field:'value',name:kind === 'scoring-trend' ? settings.scoring : 'Responses',color:kind === 'scoring-trend' && settings.design === 'Dashboard' ? '#5b7aae' : settings.color}];
  const rows = buckets.map(bucket => {
    const total = bucket.segment1 + bucket.segment2;
    const periodLabel = kind === 'scoring-trend' && settings.interval === 'Monthly' ? new Intl.DateTimeFormat('en', { month:'long', year:'numeric', timeZone:'UTC' }).format(new Date(bucket.startDate)) : bucket.label;
    const row: Record<string,string|number|null> & { category:string } = { category:bucket.label, periodLabel, coverage:`${bucket.startDate} – ${bucket.endDate}`, startDate:bucket.startDate, endDate:bucket.endDate, responses:total };
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
      const records = scoringResponses(bucket, settings, context);
      const base = records.length;
      const sum = records.reduce((value, record) => value + (settings.customMean ? settings.scores[record.answer - 1] : record.answer), 0);
      const positive = records.filter(record => record.answer >= 6).length;
      const negative = records.filter(record => record.answer <= 4).length;
      row.responses = base;
      row.value = !base || (settings.exclude && base < settings.minimumResponses) ? null : settings.scoring === 'Mean' ? sum/base : settings.scoring === 'Net promoter score' ? 100*(positive-negative)/base : 100*positive/base;
      row.valueCount = base;
      row.positiveCount = positive;
      row.neutralCount = base-positive-negative;
      row.negativeCount = negative;
    }
    return row;
  });
  // Production plots empty scoring periods at zero within a non-empty result.
  // An entirely unmatched slice and deliberately excluded periods remain absent.
  if (kind === 'scoring-trend' && settings.scoring !== 'Mean' && rows.some(row => Number(row.responses) > 0)) {
    rows.forEach(row => { if (row.responses === 0 && !settings.exclude) row.value = 0; });
  }
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
    if (kind === 'scoring-trend') {
      const metric = { Mean:'Mean', 'Net promoter score':'NPS', 'Customer effort score':'CES', 'Customer satisfaction score':'CSAT' }[settings.scoring];
      const groupNames = settings.scoring === 'Net promoter score' ? ['Promoters','Passives','Detractors'] : ['Satisfied','Neutrals','Not satisfied'];
      const groups = settings.scoring === 'Mean' || settings.scoring === 'Customer effort score' ? [] : ['positiveCount','neutralCount','negativeCount'].map((key,index) => {
        const count=Number(row[key]);
        const percentage=Number(row.responses) ? Math.round(100*count/Number(row.responses)) : 0;
        return `${groupNames[index]}: [bold]${count} (${percentage}%)[/]`;
      });
      result.scoreTooltip = [String(row.periodLabel), `${metric}: [bold]${result.value ?? 0}[/]`, `Total Count: [bold]${row.responses}[/]`, ...groups].join('\n');
    }
    return result;
  });
  return {rows:smoothed,series,selection,total:rows.reduce((sum,row)=>sum+Number(row.responses),0)};
}


export interface ScoringFilterContext { dashboardFilter?: DashboardActiveFilter; slice?: DataSlicer; }
export interface ScoringResponse {
  id: string;
  date: string;
  answer: number;
  attributes: Record<SlicerField | 'country' | 'single', string>;
}
export const SCORING_ANSWER_LABELS = ['1', '2', '3', '4', '5', '6', '7'];

/** Synthetic respondent fixture. Trend, distribution and detail all use these exact records. */
export function scoringResponses(window: DashboardDateSelection, settings: TimeSeriesSettings, context?: ScoringFilterContext): ScoringResponse[] {
  const start = Date.parse(window.startDate), end = Date.parse(window.endDate);
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || end - start > 3660 * 86400000) return [];
  const records: ScoringResponse[] = [];
  const filter = settings.filter === 'Dashboard' || settings.filter === 'Combined' ? context?.dashboardFilter : undefined;
  for (let t=start;t<=end;t+=86400000) {
    const day = Math.floor(t/86400000), date = new Date(t).toISOString().slice(0,10);
    [3+day%11,4+day%17].forEach((count,group)=>{
      for (let i=0;i<count;i++) {
        const n=day+group*19+i, answer=(day+group*3)%7+1;
        const attributes: ScoringResponse['attributes'] = {
          gender: ['Female','Male','Other'][n%3], country: ['Canada','India','United Kingdom','United States'][n%4],
          region: ['Northeast','West','South','Midwest'][n%4], age: ['25–34','35–44','18–24','45–54','55+'][n%5],
          beverage: n%2 ? 'Coca-Cola' : 'Other', income: n%3 ? 'Other' : 'Top quartile',
          device: n%2 ? 'Smartphone primary' : 'Desktop', nps: n%11>=9 ? 'Promoter' : n%11>=7 ? 'Passive' : 'Detractor',
          wave: n%2 ? '2' : '1', status: i===count-1 ? 'terminated' : i<Math.floor(count/4) ? 'partial' : 'completed',
          recentPurchase: n%3 ? 'Yes' : 'No', emailOptIn: n%2 ? 'Yes' : 'No',
          single: ['Very poor','Poor','Neutral','Good','Excellent'][n%5],
        };
        if (context?.slice && !context.slice.criteria) continue; // Never silently broaden an undefined slice.
        if (Object.entries(context?.slice?.criteria ?? {}).some(([key,value])=>attributes[key as SlicerField]!==value)) continue;
        if (filter?.responseStatus && filter.responseStatus!=='all' && attributes.status!==filter.responseStatus) continue;
        if (filter?.hasCriteria && filter.value) {
          const actual = attributes[filter.questionId as keyof typeof attributes];
          if (actual === undefined || (filter.operator==='is-not' ? actual===filter.value : actual!==filter.value)) continue;
        }
        records.push({id:`R-${date.replaceAll('-','')}-${group}-${String(i+1).padStart(2,'0')}`,date,answer,attributes});
      }
    });
  }
  return records;
}

export function scoringDistribution(records: readonly ScoringResponse[]) {
  return SCORING_ANSWER_LABELS.map((category,index)=>{
    const count=records.filter(record=>record.answer===index+1).length;
    return { category, answer:index+1, count, value:records.length ? Number((100*count/records.length).toFixed(1)) : 0 };
  });
}
