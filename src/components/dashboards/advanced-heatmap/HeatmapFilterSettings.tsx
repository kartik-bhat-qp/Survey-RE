'use client';

import { useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { EMPTY_METRIC_FILTER, METRIC_FILTER_OPERATORS, metricFilterError, type MetricFilter, heatmapRespondentFilterError, type AdvancedHeatmapConfig, type HeatmapQuestion, type HeatmapRespondentFilter } from '@/data/advanced-heatmap';
import { HeatMapSelect } from '../heat-map/HeatMapSelect';
import { supportsAdvancedHeatmap } from './HeatmapSetup';
import regularStyles from '../heat-map/HeatMapBaseline.module.css';
import styles from './AdvancedHeatmap.module.css';

const WuSelect = dynamic(() => import('@npm-questionpro/wick-ui-lib').then(m => ({ default: m.WuSelect })), { ssr: false });
const FilterModal = dynamic(() => import('@npm-questionpro/wick-ui-lib').then(m => ({
  default: function FilterModalShell({ children, footer, onClose, title, regular }: { regular?: boolean; children: ReactNode; footer: ReactNode; onClose: () => void; title: string }) {
    return <m.WuModal open preventClickOutside onOpenChange={open => { if (!open) onClose(); }} size={regular ? "lg" : "md"} maxWidth="95vw" className={regular ? `${regularStyles.page} ${styles.segmentFilterDialog}` : undefined}>
      <m.WuModalHeader className={regular ? styles.segmentFilterHeader : undefined}>{title}</m.WuModalHeader>
      <m.WuModalContent className={regular ? styles.segmentFilterContent : undefined}>{children}</m.WuModalContent>
      <m.WuModalFooter className={regular ? styles.segmentFilterFooter : undefined}>{footer}</m.WuModalFooter>
    </m.WuModal>;
  },
})), { ssr: false });
const blankCondition = (): HeatmapRespondentFilter['criteria'][number] => ({ rowId: '', operator: 'Is', optionIds: [] });

export function HeatmapFilterSettings({ config, questions, update, segment = false, regular = false, metricApplied = false, renderActions }: { config: AdvancedHeatmapConfig; questions: HeatmapQuestion[]; update: (patch: Partial<AdvancedHeatmapConfig>) => void; segment?: boolean; regular?: boolean; metricApplied?: boolean; renderActions?: (open:()=>void)=>ReactNode }) {
  const [filter, setFilter] = useState<HeatmapRespondentFilter | null>(null);
  const type = config.filterType ?? 'Dashboard';
  const metricAvailable = metricApplied && config.customMetric && config.mode === 'distribution';
  const metricFilter = config.metricFilter ?? EMPTY_METRIC_FILTER;
  const updateMetricFilter = (patch: Partial<MetricFilter>) => update({ metricFilter: { ...metricFilter, ...patch } });
  const metricError = type === 'Custom Metric' ? metricFilterError(metricFilter) : null;
  const error = filter ? heatmapRespondentFilterError(filter, questions) : null;
  const available = questions.filter(supportsAdvancedHeatmap);
  const patchCondition = (index: number, patch: Partial<HeatmapRespondentFilter['criteria'][number]>) => setFilter(current => current && ({ ...current, criteria: current.criteria.map((c, i) => i === index ? { ...c, ...patch } : c) }));
  return <>
    {!segment && (regular ? <h3>Filter options</h3> : <h4 className={styles.sectionTitle}>Filter options</h4>)}
    {!segment && <label className={regular ? regularStyles.field : styles.field}><span>Filter type</span><HeatMapSelect id="advanced-heatmap-filter-type" label="Filter type" value={type} options={['Dashboard','Widget','Combined','None','Custom Metric']} disabledOptions={metricAvailable ? [] : ['Custom Metric']} onChange={filterType => update({ filterType: filterType as AdvancedHeatmapConfig['filterType'], metricFilter: { ...metricFilter, enabled: filterType === 'Custom Metric' } })} /></label>}
    {!segment && type === 'Custom Metric' && <>
      <div className={styles.metricFilterRow}>
        <label className={styles.field}>Condition<HeatMapSelect label="Custom metric condition" value={metricFilter.operator} options={METRIC_FILTER_OPERATORS.map(o=>o.id)} formatOption={value=>METRIC_FILTER_OPERATORS.find(o=>o.id===value)?.label ?? String(value)} onChange={operator=>updateMetricFilter({operator:operator as MetricFilter['operator']})} /></label>
        <label className={styles.field}>{metricFilter.operator === 'between' ? 'Lower value' : 'Threshold'}<input type="number" step="any" value={metricFilter.value ?? ''} onChange={e => updateMetricFilter({ value: e.target.value === '' ? null : Number(e.target.value) })} /></label>
        {metricFilter.operator === 'between' && <label className={styles.field}>Upper value<input type="number" step="any" value={metricFilter.upper ?? ''} onChange={e => updateMetricFilter({ upper: e.target.value === '' ? null : Number(e.target.value) })} /></label>}
      </div>
      {metricError && <p className={styles.error} role="alert">{metricError}</p>}
    </>}
    {(segment || type === 'Widget' || type === 'Combined') && (renderActions ? renderActions(()=>setFilter(config.widgetFilter ? structuredClone(config.widgetFilter) : { name: '', match: 'all', criteria: [blankCondition()] })) : <div className={regular ? regularStyles.searchRow : styles.filterActions}>
      <button type="button" className={styles.secondary} onClick={() => setFilter(config.widgetFilter ? structuredClone(config.widgetFilter) : { name: '', match: 'all', criteria: [blankCondition()] })}>{config.widgetFilter?.name || (segment ? 'Create segment' : 'Create filter')}</button>
      {config.widgetFilter && <button type="button" className={styles.secondary} onClick={() => update({ widgetFilter: undefined })}>{segment ? 'Remove segment' : 'Remove filter'}</button>}
    </div>)}
    {filter && <FilterModal regular={regular} title={segment ? 'Segment' : 'Widget filter'} onClose={() => setFilter(null)} footer={<div className={styles.mergeActions}><button className={styles.secondary} onClick={() => setFilter(null)}>Cancel</button><button className={styles.primary} disabled={Boolean(error)} onClick={() => { update({ widgetFilter: filter }); setFilter(null); }}>{segment ? 'Save segment' : 'Save filter'}</button></div>}>
      <label className={styles.field}>{segment ? 'Segment name' : 'Filter name'}<input value={filter.name} onChange={e => setFilter({ ...filter, name: e.target.value })} /></label>
      <label className={styles.field}>Match<HeatMapSelect label="Match conditions" value={filter.match} options={['all','any']} formatOption={v => v === 'all' ? 'All conditions (AND)' : 'Any condition (OR)'} onChange={match => setFilter({ ...filter, match: match as 'all' | 'any' })} /></label>
      {filter.criteria.map((condition, index) => {
        const question = available.find(q => q.rows.some(r => r.id === condition.rowId));
        const options = question?.options.map(o => ({ value: o.id, label: o.label })) ?? [];
        return <div className={regular ? styles.segmentFilterCondition : styles.filterCondition} key={index}>
          <label className={styles.field}>Question<HeatMapSelect label={`Filter question ${index + 1}`} value={condition.rowId} options={available.flatMap(q => q.rows.map(r => r.id))} formatOption={id => { const q = available.find(q => q.rows.some(r => r.id === id)); return q ? `${q.code}. ${q.label}${q.rows.length > 1 ? ` — ${q.rows.find(r => r.id === id)?.label}` : ''}` : 'Select question'; }} onChange={rowId => patchCondition(index, { rowId, optionIds: [] })} /></label>
          {question && <>
            <label className={styles.field}>Operator<HeatMapSelect label={`Filter operator ${index + 1}`} value={condition.operator} options={['Is','Is not']} onChange={operator => patchCondition(index, { operator: operator as 'Is' | 'Is not' })} /></label>
            <div className={styles.field}><span>Answers</span><WuSelect aria-label={`Filter answers ${index + 1}`} multiple variant="outlined" placeholder="Select answers" data={options} accessorKey={{ value: 'value', label: 'label' }} value={options.filter(o => condition.optionIds.includes(o.value))} onSelect={selected => { const ids = (selected as typeof options).map(o => o.value); queueMicrotask(() => patchCondition(index, { optionIds: ids })); }} /></div>
          </>}
          <button className={styles.secondary} onClick={() => setFilter({ ...filter, criteria: filter.criteria.filter((_, i) => i !== index) })}>Remove condition {index + 1}</button>
        </div>;
      })}
      <button className={styles.secondary} onClick={() => setFilter({ ...filter, criteria: [...filter.criteria, blankCondition()] })}>Add condition</button>
      {error && <p className={styles.muted}>{error}</p>}
    </FilterModal>}
  </>;
}
