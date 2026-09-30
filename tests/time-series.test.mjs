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

test('a month-only April reporting year preserves calendar months and quarterly response bases in every trend widget',()=>{
  const year={id:'april',name:'FY',startDate:'2026-04-01',endDate:'2027-03-31'};
  const dashboard={...year,reportingYear:year};
  for(const kind of ['segment-trend','scoring-trend','response-timeline']) {
    const defaults={...defaultTimeSeriesSettings(kind,kind),precision:5};
    const monthly=timeSeriesData(kind,{...defaults,interval:'Monthly'},dashboard);
    const quarterly=timeSeriesData(kind,{...defaults,interval:'Quarterly'},dashboard);
    assert.equal(monthly.rows.length,12);
    assert.equal(monthly.rows[0].category,'Apr 2026');
    assert.equal(monthly.rows[0].coverage,'2026-04-01 – 2026-04-30');
    assert.equal(monthly.rows.at(-1).coverage,'2027-03-01 – 2027-03-31');
    assert.equal(monthly.total,quarterly.total);
    quarterly.rows.forEach((quarter,i)=>{
      const group=monthly.rows.slice(i*3,i*3+3);
      assert.equal(group.reduce((sum,row)=>sum+row.responses,0),quarter.responses);
      if(kind==='scoring-trend') {
        const weighted=group.reduce((sum,row)=>sum+row.value*row.responses,0)/quarter.responses;
        assert.ok(Math.abs(weighted-quarter.value)<.00002);
      }
    });
    const weekly=timeSeriesData(kind,{...defaults,interval:'Weekly'},dashboard);
    const calendarWeekly=timeSeriesData(kind,{...defaults,interval:'Weekly'},year);
    assert.deepEqual(weekly.rows,calendarWeekly.rows);
    assert.equal(weekly.total,monthly.total);
    const clipped=timeSeriesData(kind,{...defaults,interval:'Monthly',filter:'Combined',widgetDates:{startDate:'2026-04-12',endDate:'2026-05-15'}},dashboard);
    assert.deepEqual(clipped.rows.map(row=>row.coverage),['2026-04-12 – 2026-04-30','2026-05-01 – 2026-05-15']);
  }
});

const { scoringResponses, scoringDistribution } = await import('data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(source)).toString('base64'));
const { MOCK_DATA_SLICERS, DATA_SLICER_APPLIED_LIMIT, DATA_SLICER_CREATION_LIMIT, appliedDataSlicers } = await import('../src/data/mock-data-slicers.ts');

test('each clicked period reconciles trend base, seven answer bars and exact respondent IDs',()=>{
  const settings={...defaultTimeSeriesSettings('scoring-trend','Score'),precision:5};
  const window={startDate:'2026-03-15',endDate:'2026-05-12'};
  for(const slice of [undefined,...MOCK_DATA_SLICERS]) {
    const context={slice};
    const result=timeSeriesData('scoring-trend',settings,window,context);
    for (const row of result.rows) {
      const records=scoringResponses(row,settings,context);
      const bars=scoringDistribution(records);
      assert.equal(records.length,row.responses);
      assert.equal(bars.reduce((sum,b)=>sum+b.count,0),row.responses);
      assert.equal(new Set(records.map(r=>r.id)).size,records.length);
      if(records.length) assert.ok(Math.abs(records.reduce((sum,r)=>sum+r.answer,0)/records.length-row.value)<.00001);
      for (const bar of bars) assert.equal(records.filter(r=>r.answer===bar.answer).length,bar.count);
      assert.ok(records.every(r=>r.date>=row.startDate && r.date<=row.endDate));
    }
  }
});

test('dashboard criteria, status, widget dates and slice criteria intersect at every level',()=>{
  const settings={...defaultTimeSeriesSettings('scoring-trend','Score'),filter:'Combined',widgetDates:{startDate:'2026-04-10',endDate:'2026-04-20'}};
  const context={slice:MOCK_DATA_SLICERS[0],dashboardFilter:{hasCriteria:true,questionId:'country',operator:'is-not',value:'Canada',responseStatus:'completed'}};
  const result=timeSeriesData('scoring-trend',settings,{startDate:'2026-04-01',endDate:'2026-04-30'},context);
  const rows=scoringResponses(result.rows[0],settings,context);
  assert.ok(rows.length>0);
  assert.ok(rows.every(r=>r.attributes.gender==='Male' && r.attributes.beverage==='Coca-Cola' && r.attributes.country!=='Canada' && r.attributes.status==='completed'));
  assert.ok(rows.every(r=>r.date>='2026-04-10' && r.date<='2026-04-20'));
  assert.equal(result.total,rows.length);
  const widgetOnly={...settings,filter:'Widget'};
  const unscoped=timeSeriesData('scoring-trend',widgetOnly,undefined,context);
  assert.ok(unscoped.total>result.total);
});

test('moving-average click retains the single clicked bucket, not the smoothing window',()=>{
  const settings={...defaultTimeSeriesSettings('scoring-trend','Score'),movingAverage:true,windowSize:3,precision:5};
  const window={startDate:'2026-01-01',endDate:'2026-03-31'};
  const result=timeSeriesData('scoring-trend',settings,window);
  const row=result.rows[2], records=scoringResponses(row,settings);
  assert.ok(records.every(r=>r.date.startsWith('2026-03')));
  assert.equal(records.length,row.responses);
  assert.ok(records.length<result.total);
});

test('no matches, invalid slices, and threshold exclusion never broaden the response base',()=>{
  const settings=defaultTimeSeriesSettings('scoring-trend','Score');
  const window={startDate:'2026-01-01',endDate:'2026-01-31'};
  for (const slice of [{id:99,name:'Missing definition'}, {id:100,name:'Empty',criteria:{region:'Not present'}}]) {
    const result=timeSeriesData('scoring-trend',settings,window,{slice});
    assert.equal(result.total,0);assert.equal(result.rows[0].value,null);
  }
  const excluded=timeSeriesData('scoring-trend',{...settings,exclude:true,minimumResponses:100000},window);
  assert.equal(excluded.rows[0].value,null);assert.ok(excluded.total>0);
  assert.ok(scoringDistribution([]).every(item=>item.count===0&&item.value===0));
  assert.equal(DATA_SLICER_APPLIED_LIMIT,10);assert.equal(DATA_SLICER_CREATION_LIMIT,100);
});

test('ten applied slices are supported independently of Overall and saved inactive slices',()=>{
  const slices=Array.from({length:100},(_,i)=>({id:i,name:`Slice ${i}`,applyToDashboard:i>=50}));
  assert.deepEqual(appliedDataSlicers(slices).map(s=>s.id),[50,51,52,53,54,55,56,57,58,59]);
  assert.equal(appliedDataSlicers(slices.map(s=>({...s,applyToDashboard:false}))).length,0);
});
