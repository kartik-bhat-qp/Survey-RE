import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
const source = readFileSync(new URL('../src/data/time-series.ts', import.meta.url), 'utf8').replace("'./reporting-year'", JSON.stringify(new URL('../src/data/reporting-year.ts', import.meta.url).href));
const { defaultTimeSeriesSettings, timeSeriesData, effectiveTimeWindow } = await import('data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(source)).toString('base64'));
const year={id:'fy',name:'FY',startDate:'2026-02-01',endDate:'2027-01-31'};
const selection={...year,reportingYear:year};
test('daily, quarterly and yearly timeline counts preserve the same window and base',()=>{
  const settings=defaultTimeSeriesSettings('response-timeline','Timeline');
  let total;
  for (const [interval,length] of [['Daily',365],['Quarterly',4],['Yearly',1]]) {
    const result=timeSeriesData('response-timeline',{...settings,interval},selection);
    assert.equal(result.rows.length,length);
    total ??=result.total;
    assert.equal(result.total,total);
    assert.equal(result.rows.reduce((sum,r)=>sum+r.value,0),total);
  }
});
test('combined dates clip fiscal buckets and empty intersections stay empty',()=>{
  const settings={...defaultTimeSeriesSettings('segment-trend','Trend'),interval:'Quarterly',filter:'Combined',widgetDates:{startDate:'2026-08-12',endDate:'2026-09-15'}};
  const result=timeSeriesData('segment-trend',settings,selection);
  assert.equal(result.rows.length,1);assert.equal(result.rows[0].category,'Q3 FY 2026–27');
  assert.equal(result.rows[0].coverage,'2026-08-12 – 2026-09-15');
  assert.equal(timeSeriesData('segment-trend',{...settings,widgetDates:{startDate:'2028-01-01',endDate:'2028-02-01'}},selection).rows.length,0);
  assert.equal(effectiveTimeWindow(selection,{...settings,filter:'None'}).reportingYear,undefined);
});
test('percentages and excluded values preserve denominator and missingness',()=>{
  const settings={...defaultTimeSeriesSettings('segment-trend','Trend'),interval:'Quarterly',metric:'Percent'};
  const result=timeSeriesData('segment-trend',settings,selection);
  for(const row of result.rows) assert.ok(Math.abs(row.segment1+row.segment2-100)<.11);
  const excluded=timeSeriesData('segment-trend',{...settings,exclude:true,minimumResponses:100000},selection);
  assert.ok(excluded.rows.every(r=>r.segment1===null&&r.segment2===null));
});
test('scoring is response-weighted and does not average bucket means',()=>{
  const settings={...defaultTimeSeriesSettings('scoring-trend','Score'),precision:5};
  const daily=timeSeriesData('scoring-trend',{...settings,interval:'Daily'},selection);
  const annual=timeSeriesData('scoring-trend',{...settings,interval:'Yearly'},selection);
  const expected=daily.rows.reduce((sum,r)=>sum+r.value*r.responses,0)/daily.total;
  assert.ok(Math.abs(annual.rows[0].value-expected)<.00002);
});
test('segment dates and denominator dates independently restrict each bucket',()=>{
  const defaults=defaultTimeSeriesSettings('segment-trend','Trend');
  const settings={...defaults,interval:'Monthly',metric:'Percent',customDenominator:true,denominatorSegment:{id:'base',name:'Base',group:'All responses',dates:{startDate:'2026-02-01',endDate:'2026-02-15'}},segments:[{id:'s',name:'Selected',group:'All responses',dates:{startDate:'2026-02-01',endDate:'2026-02-15'}}]};
  const result=timeSeriesData('segment-trend',settings,selection);
  assert.equal(result.rows[0].s,100);
  assert.equal(result.rows[1].s,null);
});

test('combined scope with no widget date keeps the complete applied reporting year',()=>{
  const settings={...defaultTimeSeriesSettings('segment-trend','Trend'),filter:'Combined',interval:'Quarterly'};
  const result=timeSeriesData('segment-trend',settings,selection);
  assert.equal(result.selection.endDate,'2027-01-31');assert.equal(result.rows.length,4);
});
