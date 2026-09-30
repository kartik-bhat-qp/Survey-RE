import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../src/data/dashboard-reporting-year.ts', import.meta.url), 'utf8').replace("'./reporting-year'", JSON.stringify(new URL('../src/data/reporting-year.ts', import.meta.url).href));
const { defaultReportingYearSetting, normalizeReportingYearSetting, resolveReportingYearSelection, reportingYearForMonth } = await import(`data:text/javascript,${encodeURIComponent((await import('node:module')).stripTypeScriptTypes(source))}`);
const year = { id:'one',name:'FY 2026–27',startDate:'2026-04-01',endDate:'2027-03-31' };
const manual = {startDate:'2026-08-01',endDate:'2026-08-31'};
test('new dashboards have an active calendar reporting year',()=>{
 const setting = defaultReportingYearSetting(2026);
 assert.equal(setting.enabled,true);
 assert.equal(setting.year.startDate,'2026-01-01');
 assert.equal(setting.year.endDate,'2026-12-31');
});
test('missing, invalid and previously disabled settings use the calendar default',()=>{
 for(const value of [null,[],{enabled:true},{year,enabled:false},{enabled:true,year:{...year,endDate:'2026-08-01'}}]) {
  assert.deepEqual(normalizeReportingYearSetting(value),defaultReportingYearSetting());
 }
});
test('existing active custom year is preserved and remains a single period',()=>{
 assert.deepEqual(normalizeReportingYearSetting({year,enabled:true,years:[year,year]}),{year,enabled:true});
 assert.deepEqual(resolveReportingYearSelection(manual,{year,enabled:true}),{startDate:year.startDate,endDate:year.endDate,reportingYear:year});
 assert.deepEqual(manual,{startDate:'2026-08-01',endDate:'2026-08-31'});
});
test('reset replaces the custom period with January through December',()=>{
 const reset = normalizeReportingYearSetting(defaultReportingYearSetting(2026));
 const resolved = resolveReportingYearSelection(manual,reset);
 assert.equal(resolved.startDate,'2026-01-01');
 assert.equal(resolved.endDate,'2026-12-31');
 assert.equal(resolved.reportingYear.startDate,'2026-01-01');
});

test('month-only selection always starts on the first day and covers twelve whole calendar months',()=>{
 for(let month=1;month<=12;month++) {
  const year=reportingYearForMonth(month,2026);
  assert.equal(year.startDate,`2026-${String(month).padStart(2,'0')}-01`);
  assert.equal(year.endDate,new Date(Date.UTC(2026,month+11,0)).toISOString().slice(0,10));
 }
 assert.equal(reportingYearForMonth(4,2026).endDate,'2027-03-31');
 for(const month of [0,13,1.5,NaN]) assert.throws(()=>reportingYearForMonth(month,2026),RangeError);
});

test('legacy mid-month and leap-day settings migrate to their saved month without losing dashboard identity',()=>{
 for(const old of [
  {id:'saved',name:'FY',startDate:'2026-01-15',endDate:'2027-01-14'},
  {id:'saved',name:'FY',startDate:'2024-02-29',endDate:'2025-02-28'},
 ]) {
  const normalized=normalizeReportingYearSetting({enabled:true,year:old});
  assert.equal(normalized.year.id,old.id);
  assert.equal(normalized.year.startDate,old.startDate.slice(0,8)+'01');
  assert.deepEqual(resolveReportingYearSelection(manual,normalized).reportingYear,normalized.year);
 }
});
