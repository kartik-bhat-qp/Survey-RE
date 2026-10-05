import test from 'node:test';
import assert from 'node:assert/strict';
import {seedStackFields,autoMapSource,compatibleFieldQuestions,mapFieldQuestion,setFieldAnswer} from '../src/data/survey-stack-model.ts';
const a={id:1,surveyId:10,code:'A',text:'Satisfaction',type:'Single Select',options:['Low','High']};
const b={...a,id:2,surveyId:20,options:['High','Low']};
const c={...a,id:3,surveyId:30,type:'Multiple Select'};
const get=id=>id===10?[a]:id===20?[b]:[c];
test('first survey seeds fields; additional sources map compatible types/counts and preserve missing matches',()=>{
 const [field]=seedStackFields([{id:10,name:'A'},{id:20,name:'B'},{id:30,name:'C'}],get);
 assert.equal(field.label,'Satisfaction');assert.deepEqual(field.answers,['Low','High']);assert.equal(field.sources[20].questionId,2);assert.deepEqual(field.sources[20].answers,[0,1]);assert.equal(field.sources[30].questionId,null);
 assert.equal(compatibleFieldQuestions(field,[a,c,{...b,options:['Only']}]).length,1);
});
test('source addition and replacement preserve existing source mappings',()=>{
 const [field]=seedStackFields([{id:10,name:'A'}],get);const withB=autoMapSource(field,20,[b]);
 assert.deepEqual(withB.sources[10],field.sources[10]);assert.equal(withB.sources[20].questionId,2);
 const replacement=mapFieldQuestion(withB,20,{...b,id:99});assert.equal(replacement.sources[20].questionId,99);assert.deepEqual(replacement.sources[10],field.sources[10]);
});
test('inline answer mapping clears duplicate assignments only in the edited source',()=>{
 const [field]=seedStackFields([{id:10,name:'A'},{id:20,name:'B'}],get);const next=setFieldAnswer(field,20,0,1);
 assert.deepEqual(next.sources[20].answers,[1,-1]);assert.deepEqual(next.sources[10].answers,[0,1]);assert.deepEqual(field.sources[20].answers,[0,1]);
});

test('first question initializes an inline field; later selections retain its canonical label and scale',()=>{
 const empty={id:'inline',label:'untitled',answers:[],sources:{}};
 const initialized=mapFieldQuestion(empty,10,a);
 assert.equal(initialized.label,a.text);assert.equal(initialized.type,a.type);assert.deepEqual(initialized.answers,a.options);
 const second=mapFieldQuestion({...initialized,label:'Custom metric'},20,b);
 assert.equal(second.label,'Custom metric');assert.deepEqual(second.answers,a.options);assert.deepEqual(second.sources[20].answers,[0,1]);
 assert.deepEqual(empty,{id:'inline',label:'untitled',answers:[],sources:{}});
});
