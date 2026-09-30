import test from 'node:test';
import assert from 'node:assert/strict';
import {autoMapAnswers,compatibleStackQuestions,demoQuestionStack,isStackEligible,poolMetricGroup,setAnswerMapping,STACK_DEMO_QUESTIONS,validateMetricGroup} from '../src/data/question-stacks.ts';
const stack=demoQuestionStack();const group=stack.groups[0];const qs=STACK_DEMO_QUESTIONS;
test('single-select eligibility rejects text, multi-select, missing options and collapsed NPS buckets',()=>{
 for(const type of ['Text','Multiple Select','Rank order','Matrix Uni choice'])assert.equal(isStackEligible({...qs[0],type}),false);
 assert.equal(isStackEligible({...qs[0],options:undefined}),false);
 assert.equal(isStackEligible({...qs[0],type:'NPS',options:['Detractors','Passives','Promoters']}),false);
 assert.equal(isStackEligible({...qs[0],type:'NPS',options:Array.from({length:11},(_,i)=>String(i))}),true);
});
test('compatibility hides different option counts and resets when selection clears',()=>{
 const other={...qs[0],id:42,options:['A','B']};const list=[...qs,other];
 assert.equal(compatibleStackQuestions(list,[qs[1].id]).length,24);
 assert.equal(compatibleStackQuestions(list,[]).length,25);
});
test('mapping uses exact labels rather than positions and never guesses semantic matches',()=>{
 assert.deepEqual(autoMapAnswers(['B','A','C'],['A','B','C']),[1,0,2]);
 assert.deepEqual(autoMapAnswers([' Poor ','Good'],['Bad','Good']),[-1,1]);
 assert.deepEqual(setAnswerMapping([0,1,2],0,1),[1,-1,2]);
 assert.deepEqual(setAnswerMapping([0,-1,2],0,-1),[-1,-1,2]);
});
test('save validation enforces 2–20 unique questions, survey isolation and complete one-to-one mappings',()=>{
 assert.equal(validateMetricGroup(group,qs,stack.surveyId),null);
 for(const bad of [{...group,questionIds:[qs[0].id]},{...group,questionIds:qs.slice(0,21).map(q=>q.id)},{...group,questionIds:[qs[0].id,qs[0].id]},{...group,mappings:{...group.mappings,[qs[0].id]:[0,1,2,3,-1]}},{...group,mappings:{...group.mappings,[qs[0].id]:[0,1,2,3,3]}},{...group,scores:[1,2,3,4,NaN]}])assert.ok(validateMetricGroup(bad,qs,stack.surveyId));
 assert.ok(validateMetricGroup(group,qs,0));
 const full={...group,questionIds:qs.slice(0,20).map(q=>q.id),mappings:Object.fromEntries(qs.slice(0,20).map(q=>[q.id,[0,1,2,3,4]]))};
 assert.equal(validateMetricGroup(full,qs,stack.surveyId),null);
});
test('pooled mean uses individual answers with unequal question bases and excludes missing responses',()=>{
 const g={...group,questionIds:[1,2],labels:['Low','High'],scores:[0,10],mappings:{1:[0,1],2:[1,0]}};
 const rows=[{id:'a',answers:{1:0,2:0}},{id:'b',answers:{1:0,2:null}},{id:'c',answers:{1:0,2:null}}];
 const p=poolMetricGroup(g,rows);assert.equal(p.n,4);assert.equal(p.respondents,3);assert.equal(p.mean,2.5);assert.deepEqual(p.counts,[3,1]);assert.equal(p.variance,25);assert.equal(p.sd,5);assert.equal(p.se,2.5);assert.ok(Math.abs(p.ci[0]+2.4)<1e-12);assert.equal(p.ci[1],7.4);
});
test('empty and single-answer bases preserve undefined statistics',()=>{
 const g={...group,questionIds:[1],mappings:{1:[0,1,2,3,4]}};
 assert.equal(poolMetricGroup(g,[]).mean,null);assert.equal(poolMetricGroup(g,[]).ci,null);
 const p=poolMetricGroup(g,[{id:'a',answers:{1:0}}]);assert.equal(p.mean,1);assert.equal(p.variance,null);assert.equal(p.se,null);
});
