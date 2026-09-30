import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import { filterHeatmapResponses, heatmapRespondentFilterError, EMPTY_METRIC_FILTER, metricFilterError, matchesMetricFilter, heatmapRowGroups, heatmapResultRows, adaptHeatmapQuestions, createAdvancedHeatmapConfig, createHeatmapResponses, scoreCell, distributionCell, segmentResponses, summaryCell, distributionColumns, toggleQuestionRows } from '../src/data/advanced-heatmap.ts';
const questionSource = readFileSync(new URL('../src/data/mock-survey-questions.ts', import.meta.url), 'utf8')
  .replace("'./question-stacks'", JSON.stringify(new URL('../src/data/question-stacks.ts', import.meta.url).href));
const { getQuestionsBySurvey } = await import(`data:text/javascript,${encodeURIComponent(stripTypeScriptTypes(questionSource))}`);
const questions = adaptHeatmapQuestions(getQuestionsBySurvey(1));
const matrix = questions.find(q => q.code === 'Q11');
const nominal = questions.find(q => q.code === 'Q1');
const multi = questions.find(q => q.code === 'Q3');
const config = createAdvancedHeatmapConfig(1,'Test',matrix.rows.map(r=>r.id),'distribution',questions,'test');
const r = matrix.rows[0].id;
const answer = (id, answers) => ({ id, answers });
const fixture = [answer('1',{[r]:[matrix.options[0].id]}),answer('2',{[r]:[matrix.options[3].id]}),answer('3',{[r]:[matrix.options[3].id]}),answer('4',{})];
test('whole matrix selection is atomic and de-duplicated; other rows survive deselection',()=>{
 let selected=toggleQuestionRows([nominal.rows[0].id,matrix.rows[0].id],matrix,true);
 assert.equal(selected.length,4); selected=toggleQuestionRows(selected,matrix,false); assert.deepEqual(selected,[nominal.rows[0].id]);
});
test('distribution and mean share valid response base and exclude unanswered records',()=>{
 assert.deepEqual(scoreCell(fixture,r,matrix,config,false),{value:3,base:3,numerator:9,selections:3});
 const dist=distributionCell(fixture,r,[matrix.options[3].id],config); assert.equal(dist.base,3); assert.equal(dist.value,200/3);
});
test('custom 0/100 weights produce top-box percentage; reverse applies to each statement',()=>{
 const weights=Object.fromEntries(matrix.options.map((o,i)=>[o.id,i===3?100:0]));
 const c={...config,weights}; assert.equal(scoreCell(fixture,r,matrix,c,true).value,200/3);
 assert.equal(scoreCell(fixture,r,matrix,{...c,reverse:[matrix.id]},true).value,100/3);
 const second=matrix.rows[1].id; assert.equal(scoreCell([answer('a',{[second]:[matrix.options[3].id]})],second,matrix,{...c,reverse:[matrix.id]},true).value,0);
});
test('nominal codes cannot silently become scores; explicit mapping enables them',()=>{
 const row=nominal.rows[0].id, data=[answer('a',{[row]:[nominal.options[0].id]})];
 assert.equal(scoreCell(data,row,nominal,config,false).value,null);
 const c={...config,weights:Object.fromEntries(nominal.options.map((o,i)=>[o.id,i*10]))};
 assert.equal(scoreCell(data,row,nominal,c,true).value,0);
});
test('empty groups yield no data, not zero; excluding answers updates base',()=>{
 assert.equal(scoreCell([],r,matrix,config,false).value,null);
 const c={...config,excluded:[matrix.options[0].id]};
 assert.equal(scoreCell(fixture,r,matrix,c,false).value,4);
 assert.equal(distributionCell(fixture,r,[matrix.options[3].id],c).value,100);
});
test('six respondent segments work with four-option rows without index alignment',()=>{
 const counts=[[8,2,4,17],[7,3,7,7],[6,4,6,13],[4,6,3,5],[3,7,6,12],[2,8,11,9]];
 const paired=counts.flatMap((row,s)=>row.flatMap((n,c)=>Array.from({length:n},(_,i)=>answer(`${s}-${c}-${i}`,{rating:[`s${s}`],[r]:[matrix.options[c].id]}))));
 assert.equal(paired.length,160);
 const groups=Array.from({length:6},(_,i)=>segmentResponses(paired,'rating',`s${i}`));
 assert.equal(scoreCell(groups[5],r,matrix,config,false).value,2.9);
 assert.equal(scoreCell(groups[0],r,matrix,config,false).value,92/31);
});
test('multi-select uses a fixed respondent base and per-respondent scoring',()=>{
 const row=multi.rows[0].id, a=multi.options[0].id,b=multi.options[1].id;
 const data=[answer('1',{[row]:[a,b]}),answer('2',{[row]:[b]})];
 assert.equal(distributionCell(data,row,[a,b],config).value,100);
 assert.equal(distributionCell(data,row,[b],{...config,base:'selections'}).value,100);
 const weights=Object.fromEntries(multi.options.map((o,i)=>[o.id,i*10]));
 assert.equal(scoreCell(data,row,multi,{...config,weights},true).value,7.5);
});
test('pooled matrix mean respects unequal response bases',()=>{
 assert.equal(summaryCell([{value:1,base:1,numerator:1,selections:1},{value:4,base:3,numerator:12,selections:3}]).value,3.25);
});

test('both modes use the same deterministic respondent-level synthetic fixture',()=>{
 const a=createHeatmapResponses(questions),b=createHeatmapResponses(questions); assert.deepEqual(a,b); assert.equal(a.length,120);
 const c={...config,mode:'segments'}; assert.deepEqual(scoreCell(a,r,matrix,c,false),scoreCell(a,r,matrix,config,false));
});
test('unmapped scores retain the answered base in cells and matrix summaries',()=>{
 const row=nominal.rows[0].id;
 const cell=scoreCell([answer('a',{[row]:[nominal.options[0].id]})],row,nominal,config,false);
 assert.equal(cell.base,1); assert.equal(cell.reason,'weights-required');
 assert.equal(summaryCell([cell,cell]).base,2); assert.equal(summaryCell([cell,cell]).value,null);
});

test('one table uses fixed positional columns across different question labels', async () => {
 const { distributionColumns } = await import('../src/data/advanced-heatmap.ts');
 const q2={...matrix,id:'second',rows:[{id:'second-r',label:'Second row'}],options:matrix.options.map((o,i)=>({...o,id:`second-o${i}`}))};
 const columns=distributionColumns([matrix,q2,nominal],config);
 assert.equal(columns.length,Math.max(matrix.options.length,nominal.options.length));
 assert.deepEqual(columns[0].questionOptions[matrix.id],[matrix.options[0].id]);
 assert.deepEqual(columns[0].questionOptions.second,['second-o0']);
 assert.deepEqual(columns[0].questionOptions[nominal.id],[nominal.options[0].id]);
});
test('single-table matrix distribution totals pool frequencies and preserve percent/count bases', async () => {
 const { poolDistributionCells } = await import('../src/data/advanced-heatmap.ts');
 const cells=[{value:50,base:2,numerator:1,selections:2},{value:100,base:8,numerator:8,selections:8}];
 assert.equal(poolDistributionCells(cells,config).value,90);
 assert.equal(poolDistributionCells(cells,{...config,display:'count'}).value,9);
 assert.equal(poolDistributionCells([],config).value,null);
});

test('custom metrics are opt-in and require explicit weights even for rating scales', () => {
 const initial = createAdvancedHeatmapConfig(1, '', [r], 'distribution', questions, 'empty');
 assert.equal(initial.name, 'Advanced Heatmap');
 assert.equal(initial.customMetric, false);
 assert.deepEqual(initial.weights, {});
 const missing = scoreCell(fixture, r, matrix, initial, true);
 assert.equal(missing.value, null);
 assert.equal(missing.base, 3);
 assert.equal(missing.reason, 'weights-required');
 const partial = {...initial, weights: {[matrix.options[0].id]: 0}};
 assert.equal(scoreCell(fixture, r, matrix, partial, true).value, null);
 assert.equal(scoreCell(fixture, r, matrix, initial, false).value, 3);
});


test('metric filters distinguish strict and inclusive boundaries using unrounded scores', () => {
 const c = {...config, customMetric: true, metricFilter: {...EMPTY_METRIC_FILTER, enabled: true, value: 80}};
 assert.equal(matchesMetricFilter(79.999, c), true);
 assert.equal(matchesMetricFilter(80, c), false);
 assert.equal(matchesMetricFilter(80, {...c, metricFilter: {...c.metricFilter, operator: 'lte'}}), true);
 assert.equal(matchesMetricFilter(80, {...c, metricFilter: {...c.metricFilter, operator: 'gt'}}), false);
 assert.equal(matchesMetricFilter(80.001, {...c, metricFilter: {...c.metricFilter, operator: 'gt'}}), true);
 assert.equal(matchesMetricFilter(80, {...c, metricFilter: {...c.metricFilter, operator: 'gte'}}), true);
 const range = {...c, metricFilter: {...c.metricFilter, operator: 'between', upper: 90}};
 for (const value of [80, 85, 90]) assert.equal(matchesMetricFilter(value, range), true);
 for (const value of [79, 91, null, NaN, Infinity]) assert.equal(matchesMetricFilter(value, range), false);
});
test('filters support custom scales and pause without the metric or in segment mode', () => {
 const c = {...config, customMetric: true, metricFilter: {...EMPTY_METRIC_FILTER, enabled: true, value: -1.5}};
 assert.equal(matchesMetricFilter(-2, c), true);
 assert.equal(matchesMetricFilter(0, c), false);
 assert.equal(matchesMetricFilter(null, {...c, mode: 'segments'}), true);
 assert.equal(matchesMetricFilter(null, {...c, customMetric: false}), true);
 assert.equal(matchesMetricFilter(null, {...c, metricFilter: {...c.metricFilter, enabled: false}}), true);
 assert.equal(matchesMetricFilter(5, config), true);
 assert.ok(metricFilterError({...EMPTY_METRIC_FILTER, value: null}));
 assert.ok(metricFilterError({...EMPTY_METRIC_FILTER, value: Infinity}));
 assert.ok(metricFilterError({...EMPTY_METRIC_FILTER, operator: 'between', value: 90, upper: 80}));
 assert.equal(metricFilterError({...EMPTY_METRIC_FILTER, operator: 'between', value: 80, upper: 80}), null);
});
test('row filtering preserves distributions and pooled matrix totals, and recomputes after weight changes', () => {
 const second = matrix.rows[1].id;
 const data = [answer('a',{[r]:[matrix.options[0].id],[second]:[matrix.options[3].id]}), answer('b',{[r]:[matrix.options[3].id],[second]:[matrix.options[3].id]})];
 const c = {...config, selected:[r,second], customMetric:true, matrixSummary:true, weights:Object.fromEntries(matrix.options.map((o,i)=>[o.id,i === 3 ? 100 : 0])), metricFilter:{enabled:true,operator:'lt',value:80,upper:null}};
 const all = heatmapResultRows(questions,data,c);
 assert.deepEqual(all.map(row=>row.metric.value),[50,100,75]);
 const shown = all.filter(row=>matchesMetricFilter(row.metric.value,c));
 assert.deepEqual(shown.map(row=>row.metric.value),[50,75]);
 assert.equal(shown[1].metric.base,4);
 assert.equal(shown[1].rows.length,2);
 assert.equal(distributionCell(data,r,[matrix.options[3].id],c).value,50);
 assert.equal(distributionCell(data,r,[matrix.options[3].id],{...c,metricFilter:undefined}).value,50);
 const reweighted = {...c, weights:Object.fromEntries(matrix.options.map(o=>[o.id,90]))};
 assert.equal(heatmapResultRows(questions,data,reweighted).filter(row=>matchesMetricFilter(row.metric.value,reweighted)).length,0);
});


test('six/four options stay aligned by original position through exclusions and renaming', async () => {
 const {distributionColumns} = await import('../src/data/advanced-heatmap.ts');
 const six={...matrix,id:'six',options:Array.from({length:6},(_,i)=>({id:`six:o${i}`,label:`Six ${i}`}))};
 const c={...config,columnAliases:{'option-5':'Final option'},excludedColumns:['option-1']};
 const columns=distributionColumns([matrix,six],c);
 assert.equal(columns.length,5);
 assert.deepEqual(columns[1].questionOptions[matrix.id],[matrix.options[2].id]);
 assert.equal(columns.at(-1).label,'Final option');
 assert.equal(columns.at(-1).questionOptions[matrix.id],undefined);
 assert.deepEqual(columns.at(-1).questionOptions.six,['six:o5']);
 const data=[answer('a',{[r]:[matrix.options[1].id]}),answer('b',{[r]:[matrix.options[3].id]})];
 assert.equal(distributionCell(data,r,[matrix.options[3].id],c).value,100);
 assert.equal(scoreCell(data,r,matrix,c,false).base,1);
});


test('default widget is deterministic, independent and has no automatic custom metric', async () => {
 const {createDefaultAdvancedHeatmap,distributionColumns} = await import('../src/data/advanced-heatmap.ts');
 const a=createDefaultAdvancedHeatmap(questions), b=createDefaultAdvancedHeatmap(questions);
 assert.equal(a.id,'advanced-heatmap-default');
 assert.equal(a.customMetric,false);
 assert.equal(a.mode,'distribution');
 assert.deepEqual(a,b);
 a.selected.pop();
 assert.notDeepEqual(a.selected,b.selected);
 const selected=questions.filter(q=>q.rows.some(r=>b.selected.includes(r.id)));
 assert.equal(distributionColumns(selected,b).length,Math.max(...selected.map(q=>q.options.length)));
});


test('matrix parent pools included statements and has no duplicate Total child',()=>{
 const data=createHeatmapResponses(questions);
 const c={...config,matrixSummary:true,selected:[...matrix.rows.map(r=>r.id),nominal.rows[0].id],excluded:[matrix.rows[1].id]};
 const groups=heatmapRowGroups(questions,data,c);
 const group=groups.find(g=>g.entry.id===`${matrix.id}-parent`);
 assert.equal(groups.length,2);
 assert.equal(group.children.length,2);
 assert.equal(group.children.some(c=>c.summary),false);
 assert.deepEqual(group.entry.metric,summaryCell(group.children.map(c=>c.metric)));
 assert.equal(group.entry.sources.length,2);
 assert.equal(group.contextOnly,false);
});
test('matrix filter keeps matching children reachable without displaying a failing parent score',()=>{
 const second=matrix.rows[1].id;
 const data=[answer('a',{[r]:[matrix.options[0].id],[second]:[matrix.options[3].id]}),answer('b',{[r]:[matrix.options[3].id],[second]:[matrix.options[3].id]})];
 const c={...config,selected:[r,second],customMetric:true,weights:Object.fromEntries(matrix.options.map((o,i)=>[o.id,i===3?100:0])),metricFilter:{enabled:true,operator:'gt',value:80,upper:null}};
 const [group]=heatmapRowGroups(questions,data,c);
 assert.equal(group.contextOnly,true);
 assert.deepEqual(group.children.map(c=>c.metric.value),[100]);
 assert.equal(group.entry.metric.value,75);
 assert.equal(group.entry.metric.base,4);
 assert.equal(heatmapRowGroups(questions,data,{...c,metricFilter:{...c.metricFilter,value:100}}).length,0);
 const [parentOnly]=heatmapRowGroups(questions,data,{...c,metricFilter:{enabled:true,operator:'between',value:70,upper:80}});
 assert.equal(parentOnly.children.length,0);
 assert.equal(parentOnly.contextOnly,false);
 assert.equal(parentOnly.entry.metric.value,75);
});



test('widget respondent filters run before distributions and custom metrics',()=>{
 const widgetFilter={name:'Top rating',match:'all',criteria:[{rowId:r,operator:'Is',optionIds:[matrix.options[3].id]}]};
 const c={...config,filterType:'Widget',widgetFilter};
 const result=filterHeatmapResponses(fixture,questions,c);
 assert.equal(result.error,null);
 assert.deepEqual(result.responses.map(r=>r.id),['2','3']);
 assert.equal(distributionCell(result.responses,r,[matrix.options[3].id],c).value,100);
 assert.equal(scoreCell(result.responses,r,matrix,c,false).value,4);
 assert.equal(filterHeatmapResponses(fixture,questions,{...c,widgetFilter:{...widgetFilter,criteria:[{...widgetFilter.criteria[0],operator:'Is not'}]}}).responses.length,1);
});
test('filter scopes isolate widget criteria and fail closed for unmapped dashboard criteria',()=>{
 const widgetFilter={name:'Top',match:'all',criteria:[{rowId:r,operator:'Is',optionIds:[matrix.options[3].id]}]};
 const dashboard={hasCriteria:true,questionId:'unmapped',operator:'Is',value:'x',responseStatus:'All',dateRange:''};
 assert.equal(filterHeatmapResponses(fixture,questions,{...config,filterType:'None',widgetFilter},dashboard).responses.length,4);
 assert.equal(filterHeatmapResponses(fixture,questions,{...config,filterType:'Widget',widgetFilter},dashboard).responses.length,2);
 for (const scope of ['Dashboard','Combined']) {
  const result=filterHeatmapResponses(fixture,questions,{...config,filterType:scope,widgetFilter},dashboard);
  assert.equal(result.responses.length,0); assert.match(result.error,/dashboard filter/);
 }
 assert.equal(filterHeatmapResponses(fixture,questions,{...config,filterType:'Combined',widgetFilter},{...dashboard,hasCriteria:false}).responses.length,2);
 assert.equal(filterHeatmapResponses(fixture,questions,{...config,filterType:'Dashboard',widgetFilter}).responses.length,4);
});
test('multiple filter conditions support AND/OR without counting unanswered rows as matches',()=>{
 const row=multi.rows[0].id;
 const data=[answer('a',{[r]:[matrix.options[3].id],[row]:[multi.options[0].id,multi.options[1].id]}),answer('b',{[r]:[matrix.options[0].id],[row]:[multi.options[1].id]}),answer('empty',{})];
 const filter={name:'Pair',match:'all',criteria:[{rowId:r,operator:'Is',optionIds:[matrix.options[3].id]},{rowId:row,operator:'Is',optionIds:[multi.options[1].id]}]};
 assert.deepEqual(filterHeatmapResponses(data,questions,{...config,filterType:'Widget',widgetFilter:filter}).responses.map(r=>r.id),['a']);
 assert.deepEqual(filterHeatmapResponses(data,questions,{...config,filterType:'Widget',widgetFilter:{...filter,match:'any'}}).responses.map(r=>r.id),['a','b']);
 assert.ok(heatmapRespondentFilterError({...filter,criteria:[{...filter.criteria[0],optionIds:['invalid']}]},questions));
 assert.ok(heatmapRespondentFilterError({...filter,criteria:[]},questions));
});


test('legacy merged labels are ignored: original columns and rows remain independent',()=>{
 const c={...config,labelGroups:[{id:'group',kind:'answer',label:'Old merge',members:['option-0','option-1']},{id:'rows',kind:'question',label:'Old rows',members:matrix.rows.map(r=>r.id)}]};
 assert.equal(distributionColumns([matrix],c).length,4);
 assert.equal(heatmapResultRows([matrix],fixture,c).length,3);
});
test('segment ranges, reversal, overall mean, thresholds and custom groups',async()=>{
 const {segmentScoreCell,segmentOverallAverage,segmentBandIndex,advancedHeatmapSegments}=await import('../src/data/advanced-heatmap.ts');
 const c={...config,mode:'segments',scoreRange:'0–10',segmentRow:r,selected:[r],showOverall:true};
 assert.equal(segmentScoreCell(fixture,r,matrix,c).value,7.5);
 assert.equal(segmentScoreCell(fixture,r,matrix,{...c,reverse:[matrix.id]}).value,5);
 assert.equal(segmentOverallAverage(fixture,[matrix],c).value,7.5);
 assert.equal(segmentOverallAverage([], [matrix],c).value,null);
 assert.equal(segmentBandIndex(2,10,[20,60]),0);
 assert.equal(segmentBandIndex(2.001,10,[20,60]),1);
 assert.equal(segmentBandIndex(7,10,[20,60]),2);
 const groups=advancedHeatmapSegments(fixture,[matrix],{...c,hiddenSegments:[matrix.options[0].id],customSegments:[{id:'top',name:'Top',match:'all',criteria:[{rowId:r,operator:'Is',optionIds:[matrix.options[3].id]}]}]});
 assert.equal(groups[0].id,'overall');assert.equal(groups[0].responses.length,4);
 assert.equal(groups.some(g=>g.id===matrix.options[0].id),false);
 assert.equal(groups.at(-1).responses.length,2);
 assert.equal(segmentScoreCell(fixture,r,matrix,{...c,customMetric:true,weights:Object.fromEntries(matrix.options.map((o,i)=>[o.id,i===3?100:0]))}).value,200/3);
});
