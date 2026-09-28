import test from 'node:test';
import assert from 'node:assert/strict';
import { reportingYearEnd, reportingQuarters, reportingBuckets, isReportingYear } from '../src/data/reporting-year.ts';

const fiscal = startDate => ({ id: 'test', name: 'Test year', startDate, endDate: reportingYearEnd(startDate) });

test('a reporting year ends the day before its anniversary, including leap coverage', () => {
  assert.equal(reportingYearEnd('2026-04-01'), '2027-03-31');
  assert.equal(reportingYearEnd('2023-03-01'), '2024-02-29');
  assert.equal(reportingYearEnd('2024-02-29'), '2025-02-28');
  assert.equal(reportingYearEnd('2026-01-01'), '2026-12-31');
  assert.equal(reportingYearEnd('2026-02-30'), '');
});

test('fiscal quarters are contiguous and cover the full year for first-day, mid-month and month-end starts', () => {
  for (const start of ['2026-04-01', '2026-02-15', '2026-01-31', '2024-02-29']) {
    const quarters = reportingQuarters(start);
    assert.equal(quarters[0].startDate, start);
    assert.equal(quarters[3].endDate, reportingYearEnd(start));
    for (let i = 1; i < 4; i++) {
      assert.equal(new Date(quarters[i].startDate) - new Date(quarters[i - 1].endDate), 86400000);
    }
  }
  assert.deepEqual(reportingQuarters('2026-04-01').map(q => [q.startDate, q.endDate]), [
    ['2026-04-01', '2026-06-30'], ['2026-07-01', '2026-09-30'], ['2026-10-01', '2026-12-31'], ['2027-01-01', '2027-03-31'],
  ]);
});

test('ordinary February–April remains two clipped calendar quarters', () => {
  const buckets = reportingBuckets({ startDate: '2025-02-01', endDate: '2025-04-30' }, 'Quarterly');
  assert.deepEqual(buckets.map(b => [b.label, b.startDate, b.endDate, b.partial]), [
    ['Q1 2025', '2025-02-01', '2025-03-31', true], ['Q2 2025', '2025-04-01', '2025-04-30', true],
  ]);
});

test('reporting calendar shifts quarter/year boundaries but preserves weekly/monthly boundaries and response totals', () => {
  const year = fiscal('2026-04-15');
  const selection = { ...year, reportingYear: year };
  const quarterly = reportingBuckets(selection, 'Quarterly');
  assert.equal(quarterly.length, 4);
  assert.equal(quarterly[0].label, 'Q1 FY 2026–27');
  assert.equal(quarterly[0].endDate, '2026-07-14');
  assert.equal(reportingBuckets(selection, 'Yearly').length, 1);
  const monthly = reportingBuckets(selection, 'Monthly');
  assert.equal(monthly.length, 13);
  assert.equal(monthly[0].endDate, '2026-04-30');
  assert.equal(monthly.at(-1).endDate, '2027-04-14');
  const expected = quarterly.reduce((sum, b) => sum + b.segment1 + b.segment2, 0);
  for (const interval of ['Weekly', 'Monthly', 'Quarterly', 'Yearly']) {
    assert.equal(reportingBuckets(selection, interval).reduce((sum, b) => sum + b.segment1 + b.segment2, 0), expected);
  }
});

test('switching to calendar grouping preserves dates while changing periods', () => {
  const year = fiscal('2026-04-01');
  assert.equal(reportingBuckets({ ...year, reportingYear: year }, 'Yearly').length, 1);
  assert.equal(reportingBuckets(year, 'Yearly').length, 2);
  assert.equal(reportingBuckets(year, 'Quarterly')[0].label, 'Q2 2026');
});

test('saved years reject malformed dates and arbitrary durations', () => {
  assert.equal(isReportingYear(fiscal('2026-04-01')), true);
  assert.equal(isReportingYear({ ...fiscal('2026-04-01'), endDate: '2026-07-01' }), false);
  assert.equal(isReportingYear(null), false);
  assert.equal(isReportingYear({}), false);
});

test('weekly buckets use the Sunday boundaries observed in production',()=>{
  const buckets=reportingBuckets({startDate:'2025-02-09',endDate:'2025-02-22'},'Weekly');
  assert.deepEqual(buckets.map(b=>[b.startDate,b.endDate]),[['2025-02-09','2025-02-15'],['2025-02-16','2025-02-22']]);
});
