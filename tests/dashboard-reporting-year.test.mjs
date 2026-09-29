import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../src/data/dashboard-reporting-year.ts', import.meta.url), 'utf8').replace("'./reporting-year'", JSON.stringify(new URL('../src/data/reporting-year.ts', import.meta.url).href));
const { defaultReportingYearSetting, normalizeReportingYearSetting, resolveReportingYearSelection } = await import(`data:text/javascript,${encodeURIComponent((await import('node:module')).stripTypeScriptTypes(source))}`);
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
