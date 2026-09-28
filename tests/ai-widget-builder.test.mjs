import test from 'node:test';
import assert from 'node:assert/strict';
import { builderFields, builderPrompt, builderResponses, defaultBuilderSettings, exampleOutput, parseWidgetOutput, widgetPayload, CONTRACTS } from '../src/data/ai-widget-builder.ts';
const source={id:1,name:'Synthetic survey',fields:[{id:'a',label:'Choice',kind:'multiple',options:['A','B']},{id:'n',label:'Score',kind:'number',options:['0','5','10']}]};
const widget={id:'w',tabId:'tab-1',source,prompt:'compare',output:exampleOutput(source),settings:defaultBuilderSettings('Test')};
const row=(id,answers,weight=1)=>({id,date:'2026-09-01',status:'completed',weight,dimensions:{gender:'Female'},answers});
const rows=[row('1',{a:['A','B'],n:0},2),row('2',{a:['B'],n:10},1),row('3',{a:null,n:null},1)];
test('denominators exclude missing answers; multiple selections use respondents',()=>{
 const p=widgetPayload(widget,undefined,rows);assert.equal(p.responseCount,3);assert.equal(p.series[0].base,2);assert.equal(p.series[0].items[1].percent,100);assert.equal(p.series[0].items[0].percent,50);
});
test('weights apply once; zero numeric answers remain valid',()=>{
 const w={...widget,settings:{...widget.settings,weight:'demo'},output:{...widget.output,contract:'summary-v1'}};
 const p=widgetPayload(w,undefined,rows);assert.equal(p.weightedBase,4);assert.equal(p.summary[1].mean,10/3);assert.equal(p.summary[0].mean,null);
});
test('widget filter, slicer, dashboard status, date and criterion intersect',()=>{
 const w={...widget,settings:{...widget.settings,filterField:'a',filterValue:'B',sliceField:'n',sliceValue:'0'}};
 const filter={hasCriteria:true,questionId:'gender',operator:'is',value:'Female',responseStatus:'completed',dateRange:'',dateSelection:{startDate:'2026-09-01',endDate:'2026-09-01'}};
 assert.equal(widgetPayload(w,filter,rows).responseCount,1);
 assert.equal(widgetPayload(w,{...filter,value:'Male'},rows).responseCount,0);
 assert.equal(widgetPayload(w,{...filter,dateSelection:{startDate:'2026-09-02',endDate:'2026-09-03'}},rows).responseCount,0);
 assert.ok(widgetPayload(w,{...filter,questionId:'unknown'},rows).error);
});
test('empty data preserves null means and percentages',()=>{
 assert.equal(widgetPayload(widget,undefined,[]).series[0].items[0].percent,null);
 assert.equal(widgetPayload({...widget,output:{...widget.output,contract:'summary-v1'}},undefined,[]).summary[1].mean,null);
});
test('contracts expose only chosen fields and never synthesize a production endpoint',()=>{
 for(const contract of CONTRACTS){const p=widgetPayload({...widget,output:{...widget.output,contract,fieldIds:['n']}},undefined,rows);assert.equal(p.fields.length,1);assert.equal(p.evidence,'synthetic-prototype');if(p.records)assert.deepEqual(Object.keys(p.records[0].answers),['n']);}
 assert.equal(widgetPayload({...widget,output:{...widget.output,contract:'trend-v1'}},undefined,rows).trend[0].count,3);
});
test('output validation rejects foreign fields, malformed JSON, versions and missing capability flags',()=>{
 assert.deepEqual(parseWidgetOutput(JSON.stringify(widget.output),source),widget.output);
 assert.throws(()=>parseWidgetOutput('{}',source));assert.throws(()=>parseWidgetOutput('bad',source));
 for(const change of [{fieldIds:['foreign']},{fieldIds:['a','a']},{contract:'https://example.com'},{capabilities:{}},{version:2}])assert.throws(()=>parseWidgetOutput(JSON.stringify({...widget.output,...change}),source));
});
test('matrix fields expand; NPS remains numeric; fixtures are stable across selection order',()=>{
 const fields=builderFields([{id:2,code:'Q2',text:'Matrix',type:'Matrix Uni choice',matrixRows:['One','Two'],options:['A','B'],surveyId:1}]);assert.deepEqual(fields.map(f=>f.id),['2:0','2:1']);
 const a=builderResponses(source);const b=builderResponses({...source,fields:[source.fields[1]]});assert.equal(a[15].answers.n,b[15].answers.n);assert.equal(a.length,120);
});
test('copy context includes request, source schema, every contract, runtime and evidence boundaries',()=>{
 const p=builderPrompt(source,'Test','Make a chart');for(const required of [...CONTRACTS,'Make a chart','window.renderWidget','NOT verified production','settings.color','weightedBase'])assert.ok(p.includes(required));
});

test('cleared dashboard date selection is unfiltered, not an empty range',()=>{
 const f={hasCriteria:false,questionId:'',operator:'is',value:'',responseStatus:'all',dateRange:'',dateSelection:{startDate:'',endDate:''}};
 assert.equal(widgetPayload(widget,f,rows).responseCount,3);
});
