'use client';
import {useQuestionStacks} from '@/hooks/useQuestionStacks';
import {getQuestionsBySurvey} from '@/data/mock-survey-questions';
import {poolMetricGroup,syntheticStackResponses,validateMetricGroup,type QuestionStackWidgetConfig} from '@/data/question-stacks';
import type {DashboardActiveFilter} from '@/data/mock-dashboard-filters';
import styles from './Stacks.module.css';
const number=(v:number|null)=>v===null?'—':v.toFixed(2);
export function QuestionStackWidget({config,dashboardFilter}:{config:QuestionStackWidgetConfig;dashboardFilter?:DashboardActiveFilter}){
  const {stacks,ready,error}=useQuestionStacks();const stack=stacks.find(s=>s.id===config.stackId);
  if(!ready)return <div className={styles.widget}>Loading metric groups…</div>;
  if(error||!stack)return <div className={styles.widget} role="alert">{error||'This Question Stack is unavailable.'}</div>;
  const questions=getQuestionsBySurvey(stack.surveyId);
  let rows=syntheticStackResponses(questions);
  const dates=dashboardFilter?.dateSelection;
  if(dates?.startDate)rows=rows.filter(r=>r.date>=dates.startDate!);
  if(dates?.endDate)rows=rows.filter(r=>r.date<=dates.endDate!);
  if(dashboardFilter?.responseStatus&&dashboardFilter.responseStatus!=='all')rows=rows.filter(r=>r.status===dashboardFilter.responseStatus);
  if(dashboardFilter?.hasCriteria)return <div className={styles.widget} role="alert">This prototype does not have values for the selected dashboard criterion. Clear that criterion to view Question Stack metrics.</div>;
  return <div className={styles.widget}><p className={styles.hint}>Question Stack · {stack.name} · Synthetic preview data</p>{config.groupIds.map(id=>{
    const group=stack.groups.find(g=>g.id===id);if(!group)return <p key={id} role="alert">Metric group unavailable. Update this widget’s source.</p>;
    const error=validateMetricGroup(group,questions,stack.surveyId);if(error)return <p key={id} role="alert">{group.name}: {error}</p>;
    const stats=poolMetricGroup(group,rows);
    const min=Math.min(...group.scores),max=Math.max(...group.scores);const percent=stats.mean===null||max===min?0:100*(stats.mean-min)/(max-min);
    return <section key={id} style={{marginBottom:20}}><strong>{group.name}</strong><div className={styles.stats}><span><strong>{stats.n}</strong>Pooled answers (N)</span><span><strong>{stats.respondents}</strong>Unique respondents</span><span><strong>{number(stats.mean)}</strong>Pooled mean</span><span><strong>{number(stats.respondents ? stats.n / stats.respondents : null)}</strong>Answers per respondent</span></div>
      {stats.n===0?<p>No answers match the current filters.</p>:config.chart==='bar'?group.labels.map((label,i)=><div className={styles.bars} key={i}><span>{label}</span><div className={styles.bar} style={{width:`${100*stats.counts[i]/stats.n}%`}}/><span>{stats.counts[i]} ({(100*stats.counts[i]/stats.n).toFixed(1)}%)</span></div>):config.chart==='gauge'||config.chart==='semi-circle'?<div style={{textAlign:'center'}}><svg viewBox="0 0 240 140" width="240" height="140" role="img" aria-label={`Mean ${number(stats.mean)} on a ${min} to ${max} scale`}><path d="M 20 115 A 100 100 0 0 1 220 115" fill="none" stroke="#e7edf4" strokeWidth="18"/><path d="M 20 115 A 100 100 0 0 1 220 115" fill="none" stroke="#1e88e5" strokeWidth="18" pathLength="100" strokeDasharray={`${percent} 100`}/><text x="120" y="95" textAnchor="middle" fontSize="28" fill="#253449">{number(stats.mean)}</text><text x="18" y="138" fontSize="13">{min}</text><text x="213" y="138" fontSize="13">{max}</text></svg></div>:config.chart==='heat-map'?<table className={styles.table}><thead><tr>{group.labels.map((label,i)=><th key={i}>{label}</th>)}</tr></thead><tbody><tr>{stats.counts.map((count,i)=><td key={i} style={{background:`rgba(30,136,229,${0.08+0.8*count/stats.n})`}}>{(100*count/stats.n).toFixed(1)}%<br/>{count} answers</td>)}</tr></tbody></table>:null}
      {(config.chart==='tabular'||config.chart==='stat-metric')&&<table className={styles.table}><tbody>{[['Variance',number(stats.variance)],['Standard deviation',number(stats.sd)],['Standard error',number(stats.se)],['95% confidence interval',stats.ci?stats.ci.map(number).join(' – '):'—']].map(([label,value])=><tr key={label}><th>{label}</th><td>{value}</td></tr>)}</tbody></table>}
      <details className={styles.hint}><summary>Calculation details</summary><p>Each non-missing mapped answer contributes once. The mean uses pooled answer counts, not an average of question means. Sample variance uses N−1. SE and the normal 95% interval assume independent answers; repeated answers from one respondent may be correlated.</p><p>{group.questionIds.length} questions · Missing answers excluded · Scores: {group.scores.join(', ')}</p></details>
    </section>;
  })}</div>;
}
