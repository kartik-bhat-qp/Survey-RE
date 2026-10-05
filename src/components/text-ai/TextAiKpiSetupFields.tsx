'use client';

import { useId, useState } from 'react';
import dynamic from 'next/dynamic';
import { TEXT_AI_KPI_DEFINITIONS, TEXT_AI_KPI_METRICS, defaultTextAiKpiConfig, getTextAiKpiOptions, textAiKpiFormula, validateTextAiKpiConfig, type TextAiKpiConfig, type TextAiKpiId, type TextAiKpiMapping, type TextAiKpiMetric } from '@/data/mock-text-ai-kpi-by-theme';
import styles from './TextAiKpiSetupFields.module.css';

const WuSelect = dynamic(() => import('@npm-questionpro/wick-ui-lib').then(m => ({ default: m.WuSelect })), { ssr: false });
// Match the precision choices in BI's Scoring Trend widget.
const PRECISION_OPTIONS = [0, 1, 2, 3, 4, 5].map(value => ({ value, label: `${value} (${value === 0 ? '1' : (1 / 10 ** value).toFixed(value)})` }));

const WuInput = dynamic(() => import('@npm-questionpro/wick-ui-lib').then(m => ({ default: m.WuInput })), { ssr: false });

export function TextAiKpiSetupFields({ value, onChange }: { value: TextAiKpiConfig; onChange: (value: TextAiKpiConfig) => void }) {
  const id = useId();
  const fieldLabel = value.sourceType === 'dataset' ? 'KPI variable' : 'KPI question';
  const options = TEXT_AI_KPI_DEFINITIONS.map(d => ({ value: d.id, label: value.sourceType === 'dataset' ? d.id.replaceAll('-', '_') : `${d.code} · ${d.question}` }));
  const update = (patch: Partial<TextAiKpiConfig>) => onChange({ ...value, ...patch });
  function changeScoring(questionId: TextAiKpiId, metric: TextAiKpiMetric) {
    const defaults = defaultTextAiKpiConfig(questionId, metric, value.cesCalculation ?? 'average');
    const oldDefaultName = value.questionId ? defaultTextAiKpiConfig(value.questionId, value.metric).name : '';
    update({ questionId, metric, name: value.name && value.name === oldDefaultName ? defaults.name : value.name, mappings: defaults.mappings });
  }
  const numeric = value.metric === 'mean' || (value.metric === 'ces' && (value.cesCalculation ?? 'average') === 'average');
  const categories: { value: TextAiKpiMapping; label: string }[] = value.metric === 'nps'
    ? [{ value: 'detractor', label: 'Detractor' }, { value: 'passive', label: 'Passive' }, { value: 'promoter', label: 'Promoter' }]
    : value.metric === 'csat' ? [{ value: 'dissatisfied', label: 'Not satisfied' }, { value: 'satisfied', label: 'Satisfied' }]
    : [{ value: 'difficult', label: 'Difficult' }, { value: 'neutral', label: 'Neutral' }, { value: 'easy', label: 'Easy' }];
  const error = value.questionId ? validateTextAiKpiConfig(value) : null;
  return <div className={styles.fields}>
    <WuInput Label="KPI name" labelPosition="top" variant="outlined" value={value.name} placeholder="Enter KPI name" maxLength={60} aria-label="KPI name" onChange={(event: React.ChangeEvent<HTMLInputElement>) => update({ name: event.target.value })} />
    <div className={styles.field}><span id={`${id}-question`}>{fieldLabel}</span>
      <WuSelect aria-labelledby={`${id}-question`} variant="outlined" placeholder={`Select a ${fieldLabel.toLowerCase()}`} data={options} accessorKey={{ value: 'value', label: 'label' }} value={options.find(o => o.value === value.questionId) ?? null} onSelect={option => {
        if (option && !Array.isArray(option)) changeScoring((option as { value: TextAiKpiId }).value, value.metric);
      }} />
    </div>
    <div className={styles.field}><span id={`${id}-metric`}>Metric type</span>
      <WuSelect aria-labelledby={`${id}-metric`} disabled={!value.questionId} variant="outlined" data={TEXT_AI_KPI_METRICS} accessorKey={{ value: 'value', label: 'label' }} value={TEXT_AI_KPI_METRICS.find(m => m.value === value.metric)} onSelect={option => {
        if (value.questionId && option && !Array.isArray(option)) {
          const metric = (option as { value: TextAiKpiMetric }).value;
          changeScoring(value.questionId, metric);
        }
      }} />
    </div>
    {value.metric === 'ces' && <label className={styles.field}>Calculation<select value={value.cesCalculation ?? 'average'} onChange={event => {
      const cesCalculation = event.target.value as TextAiKpiConfig['cesCalculation'];
      update({ cesCalculation, mappings: value.questionId ? defaultTextAiKpiConfig(value.questionId, 'ces', cesCalculation).mappings : {} });
    }}><option value="average">Average score</option><option value="percent-easy">Percentage easy</option><option value="net-easy">Percentage easy − percentage difficult</option></select></label>}
    {value.questionId && <>
      <div className={styles.mappingTitle}>Answer configuration</div>
      <p className={styles.formula}>{textAiKpiFormula(value)} Excluded answers are removed from the base.</p>
      <table className={styles.mapping}><thead><tr><th>{value.sourceType === 'dataset' ? 'Variable value' : 'Response option'}</th><th>{numeric ? 'Score' : 'Classification'}</th></tr></thead><tbody>
        {getTextAiKpiOptions(value.questionId).map(answer => <tr key={answer}><td>{answer}</td><td>
          {numeric ? <div className={styles.meanRow}><input type="number" step="any" aria-label={`Score for ${answer}`} disabled={value.mappings[answer] === 'exclude'} value={typeof value.mappings[answer] === 'number' && Number.isFinite(value.mappings[answer]) ? value.mappings[answer] : ''} onChange={event => update({ mappings: { ...value.mappings, [answer]: event.target.value === '' ? NaN : Number(event.target.value) } })} /><label><input type="checkbox" checked={value.mappings[answer] === 'exclude'} onChange={event => update({ mappings: { ...value.mappings, [answer]: event.target.checked ? 'exclude' : answer } })} />Exclude</label></div>
          : <select aria-label={`Classification for ${answer}`} value={String(value.mappings[answer] ?? '')} onChange={event => update({ mappings: { ...value.mappings, [answer]: event.target.value as TextAiKpiMapping } })}>{[...categories, { value: 'exclude', label: 'Exclude' }].map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>}
        </td></tr>)}
      </tbody></table>
      <div className={styles.field}><span id={`${id}-precision`}>Decimal precision</span>
        <WuSelect aria-labelledby={`${id}-precision`} variant="outlined" data={PRECISION_OPTIONS} accessorKey={{ value: 'value', label: 'label' }} value={PRECISION_OPTIONS.find(option => option.value === value.precision)} onSelect={option => {
          if (option && !Array.isArray(option)) update({ precision: (option as { value: number }).value });
        }} />
      </div>
    </>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
  </div>;
}

/** Retain incomplete edits without ever calculating a partially configured metric. */
export function TextAiKpiSettingsFields({ value, onChange }: { value: TextAiKpiConfig; onChange: (value: TextAiKpiConfig) => void }) {
  const [draft, setDraft] = useState(value);
  return <TextAiKpiSetupFields value={draft} onChange={next => { setDraft(next); if (!validateTextAiKpiConfig(next)) onChange(next); }} />;
}
