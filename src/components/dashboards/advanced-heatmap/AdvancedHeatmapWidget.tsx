'use client';

import { useMemo, useRef, useState, type CSSProperties } from 'react';
import dynamic from 'next/dynamic';
import { getQuestionsBySurvey } from '@/data/mock-survey-questions';
import { filterHeatmapResponses, ANALYSIS_MODES, isHeatmapOptionExcluded, EMPTY_METRIC_FILTER, METRIC_FILTER_OPERATORS, heatmapRowGroups, isMetricFilterActive, metricFilterError, adaptHeatmapQuestions, createHeatmapResponses, distributionCell, distributionColumns, poolDistributionCells, segmentScoreCell, segmentOverallAverage, segmentBandIndex, advancedHeatmapSegments, summaryCell, type AdvancedHeatmapConfig, type HeatmapCell, type HeatmapQuestion, type MetricFilter } from '@/data/advanced-heatmap';
import type { DashboardActiveFilter } from '@/data/mock-dashboard-filters';
import { getReadableDesignColor, getDashboardDesignColors, type DashboardDesign } from '@/data/dashboard-design';
import { HeatmapFilterSettings } from './HeatmapFilterSettings';
import { HeatmapSegmentAnalytics, HeatmapSegmentLabels } from './HeatmapSegmentSettings';
import { HeatmapLabels } from './HeatmapLabels';
import { DesignColorPicker } from '../DesignColorPicker';
import { HeatMapSelect } from '../heat-map/HeatMapSelect';
import { DashboardWidgetCard } from '@/components/dashboards/widgets/DashboardWidgetCard';
import styles from './AdvancedHeatmap.module.css';
import regular from '../heat-map/HeatMapBaseline.module.css';
import { Field, Toggle } from '../heat-map/HeatMapSettingsControls';
import { HeatmapSegmentDesign, segmentColors, segmentWidgetStyle } from './HeatmapSegmentDesign';

const WuDrawer = dynamic(() => import('@npm-questionpro/wick-ui-lib').then(m => ({ default: m.WuDrawer })), { ssr: false });

type SettingsTab = 'General' | 'Analytics' | 'Labels' | 'Design';
export function AdvancedHeatmapWidget({ config, onChange, dashboardFilter, dashboardDesign }: { dashboardDesign?: DashboardDesign; config: AdvancedHeatmapConfig; onChange: (config: AdvancedHeatmapConfig) => void; dashboardFilter?: DashboardActiveFilter }) {
  const questions = useMemo(() => adaptHeatmapQuestions(getQuestionsBySurvey(config.surveyId)), [config.surveyId]);
  const widgetRef = useRef<HTMLDivElement>(null);
  const [previewStyle, setPreviewStyle] = useState<CSSProperties>({});
  const [draft, setDraft] = useState(config);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<SettingsTab>('General');
  const update = (patch: Partial<AdvancedHeatmapConfig>) => setDraft(current => ({ ...current, ...patch }));
  const draftMetricFilter = draft.metricFilter ?? EMPTY_METRIC_FILTER;
  const updateMetricFilter = (patch: Partial<MetricFilter>) => update({ metricFilter: { ...draftMetricFilter, ...patch } });
  const filterError = isMetricFilterActive(draft) ? metricFilterError(draftMetricFilter) : null;
  const missingWeights = draft.customMetric && questions.some(q => q.rows.some(r => draft.selected.includes(r.id) && !draft.excluded.includes(r.id)) && q.options.some(o => !isHeatmapOptionExcluded(o.id, draft) && !Number.isFinite(draft.weights[o.id])));
  const invalid = Boolean(filterError) || missingWeights || !draft.name.trim() || draft.selected.length === 0 || !questions.some(q => q.rows.some(r => draft.selected.includes(r.id) && !draft.excluded.includes(r.id))) || Object.values(draft.weights).some(v => !Number.isFinite(v));
  const openSettings = () => {
    if (widgetRef.current) {
      const computed = getComputedStyle(widgetRef.current);
      setPreviewStyle(Object.fromEntries(['font-family','font-style','font-weight','title-size','body-size'].map(key => [`--dashboard-widget-${key}`, computed.getPropertyValue(`--dashboard-widget-${key}`)])) as CSSProperties);
    }
    setDraft({ ...structuredClone(config), labelGroups: [], base: 'respondents' }); setEditing(true); };
  const widgetStyle = config.mode === 'segments' ? segmentWidgetStyle(config,dashboardDesign) : config.designType === 'Widget' ? {'--advanced-title-color':config.themeColor??'#3f559a', '--dashboard-widget-font-family': config.fontFamily ?? 'Fira Sans', '--dashboard-widget-body-size': `${config.fontSize ?? 14}px`} as CSSProperties : {};
  return <div ref={widgetRef} data-analysis={config.mode} style={widgetStyle} className={styles.widgetFrame} data-show-name={config.showName !== false} data-testid="advanced-heatmap-widget">
    <DashboardWidgetCard title={config.name === 'Advanced Heatmap Widget' ? 'Advanced Heatmap' : config.name} onOpenSettings={openSettings}>
    <HeatmapTable config={config} onChange={onChange} dashboardFilter={dashboardFilter} dashboardDesign={dashboardDesign} />
    <WuDrawer preventClickOutside side="right" open={editing} onOpenChange={setEditing} hideCloseButton className={`${styles.dialog} ${draft.mode === 'segments' ? styles.segmentDialog : ''}`} aria-labelledby={`settings-${config.id}`} aria-describedby={undefined}>
      <section data-analysis={draft.mode} data-show-name={draft.showName !== false} className={styles.settingsPreview} style={{...previewStyle,...(draft.mode === 'segments' ? segmentWidgetStyle(draft,dashboardDesign) : draft.designType === 'Widget' ? {'--advanced-title-color':draft.themeColor??'#3f559a','--dashboard-widget-font-family':draft.fontFamily??'Fira Sans','--dashboard-widget-body-size':`${draft.fontSize??14}px`} : {})}} aria-label="Widget preview">
        <DashboardWidgetCard title={draft.name || 'Advanced Heatmap'} actions={null} showInsights={false}>
          <HeatmapTable config={draft} onChange={setDraft} dashboardFilter={dashboardFilter} dashboardDesign={dashboardDesign} />
        </DashboardWidgetCard>
      </section>
      <header className={styles.header}><h3 id={`settings-${config.id}`}>Settings</h3><button type="button" aria-label="Close settings" onClick={() => setEditing(false)}>×</button></header>
      <nav className={styles.tabs} role="tablist">{(['General','Analytics','Labels','Design'] as SettingsTab[]).map(item => <button type="button" role="tab" aria-selected={tab === item} key={item} onClick={() => setTab(item)}>{item}</button>)}</nav>
      <div className={draft.mode === 'segments' ? `${regular.page} ${regular.settingsBody} ${styles.segmentSettings}` : styles.settings} role="tabpanel">
        {tab === 'General' && draft.mode === 'segments' && <><Toggle label="Name" checked={draft.showName!==false} onChange={showName=>update({showName})}/><input aria-label="Widget name" value={draft.name} onChange={e=>update({name:e.target.value})}/><HeatmapFilterSettings regular config={draft} questions={questions} update={update}/></>}
        {tab === 'General' && draft.mode !== 'segments' && <><label className={styles.check}><input type="checkbox" checked={draft.showName!==false} onChange={e=>update({showName:e.target.checked})}/>Name</label><label className={styles.field}>Widget name<input value={draft.name} onChange={e => update({ name: e.target.value })} /></label><HeatmapFilterSettings config={draft} questions={questions} update={update} /></>}
        {tab === 'Analytics' && <>
          <Field label="Analysis type"><HeatMapSelect label="Analysis type" value={draft.mode} options={ANALYSIS_MODES.map(m=>m.id)} formatOption={value => ANALYSIS_MODES.find(m=>m.id===value)?.title ?? String(value)} onChange={mode=>update({mode:mode as AdvancedHeatmapConfig['mode']})} /></Field>
          {draft.mode === 'segments' ? <HeatmapSegmentAnalytics draft={draft} questions={questions} update={update} colors={segmentColors(draft,dashboardDesign)}/> : <label className={styles.field}>Cell values<HeatMapSelect label="Cell values" value={draft.display} options={['percent','count']} formatOption={v=>v==='percent'?'Percentages':'Counts'} onChange={display=>update({display:display as 'percent'|'count'})} /></label>}

          {draft.mode === 'segments' ? <h3>Custom metrics</h3> : <h4 className={styles.sectionTitle}>Custom metrics</h4>}<button type="button" className={styles.secondary} onClick={() => update({ customMetric: !draft.customMetric })}>{draft.customMetric ? 'Remove custom metric' : 'Add custom metric'}</button>
          {draft.customMetric && <><label className={styles.field}>Name<input value={draft.metricLabel} onChange={e => update({ metricLabel: e.target.value })} /></label><p className={styles.muted}>Set a weight for each included answer option.</p>{questions.filter(q => q.rows.some(r => draft.selected.includes(r.id))).map(q => <div className={styles.group} key={q.id}><strong>{q.code}. {q.label}</strong>{q.options.map(o => <label className={styles.labelRow} key={o.id}><span /><span>{draft.aliases[o.id] || o.label}</span><input type="number" step="any" aria-label={`Weight for ${q.code} ${o.label}`} placeholder="Required" value={draft.weights[o.id] ?? ''} disabled={isHeatmapOptionExcluded(o.id, draft)} onChange={e => { const weights = { ...draft.weights }; if (e.target.value === '') delete weights[o.id]; else weights[o.id] = Number(e.target.value); update({ weights }); }} /></label>)}<label className={styles.check}><input type="checkbox" checked={draft.reverse.includes(q.id)} onChange={e => update({ reverse: e.target.checked ? [...draft.reverse, q.id] : draft.reverse.filter(id => id !== q.id) })} />Reverse weights for all statements in this question</label></div>)}</>}
          {draft.mode === 'distribution' && draft.customMetric && <div className={styles.metricFilterSettings}>
            <label className={styles.check}><input type="checkbox" checked={draftMetricFilter.enabled} onChange={e => updateMetricFilter({ enabled: e.target.checked })} />Filter rows by {draft.metricLabel || 'custom metric'}</label>
            {draftMetricFilter.enabled && <>
              <label className={styles.field}>Show rows with<HeatMapSelect label="Show rows with" value={draftMetricFilter.operator} options={METRIC_FILTER_OPERATORS.map(o=>o.id)} formatOption={value=>METRIC_FILTER_OPERATORS.find(o=>o.id===value)?.label ?? String(value)} onChange={operator=>updateMetricFilter({operator:operator as MetricFilter['operator']})} /></label>
              <div className={styles.thresholds}>
                <label className={styles.field}>{draftMetricFilter.operator === 'between' ? 'Lower value' : 'Threshold'}<input type="number" step="any" value={draftMetricFilter.value ?? ''} onChange={e => updateMetricFilter({ value: e.target.value === '' ? null : Number(e.target.value) })} /></label>
                {draftMetricFilter.operator === 'between' && <label className={styles.field}>Upper value<input type="number" step="any" value={draftMetricFilter.upper ?? ''} onChange={e => updateMetricFilter({ upper: e.target.value === '' ? null : Number(e.target.value) })} /></label>}
              </div>
              <p className={styles.muted}>Uses unrounded metric scores. Filters rows and matrix totals independently; response bases stay unchanged.</p>
              {filterError && <p className={styles.error} role="alert">{filterError}</p>}
            </>}
          </div>}
          {draft.mode === 'distribution' && <label className={styles.field}>Decimal places<HeatMapSelect label="Decimal places" value={draft.precision} options={[0,1,2,3,4]} onChange={precision=>update({precision:Number(precision)})} /></label>}
        </>}
        {tab === 'Labels' && <><HeatmapLabels questions={questions} draft={draft} update={update} />{draft.mode === 'segments' && <HeatmapSegmentLabels questions={questions} draft={draft} update={update}/>}</>}
        {tab === 'Design' && draft.mode === 'segments' && <HeatmapSegmentDesign draft={draft} update={update}/>}
        {tab === 'Design' && draft.mode !== 'segments' && <><label className={styles.field}>Design type<HeatMapSelect label="Design type" value={draft.designType??'Dashboard'} options={['Dashboard','Widget']} onChange={designType=>update({designType:designType as AdvancedHeatmapConfig['designType']})}/></label>{draft.designType==='Widget' && <><label className={styles.field}>Theme color<DesignColorPicker variant="heat-map" label="Theme color" value={draft.themeColor??'#3f559a'} onChange={themeColor=>update({themeColor})}/></label><label className={styles.field}>Font family<HeatMapSelect label="Font family" value={draft.fontFamily??'Fira Sans'} options={['Fira Sans','Inter','Roboto','Segoe UI','IBM Plex Sans','Arial','Georgia']} onChange={fontFamily=>update({fontFamily})}/></label><label className={styles.field}>Font size<HeatMapSelect label="Font size" value={draft.fontSize??14} options={[11,12,14,16,18]} onChange={fontSize=>update({fontSize:Number(fontSize)})}/></label><div className={styles.field}>Sentiment colors{(draft.sentimentColors??['#f7bbc5','#fad7b7','#f8e8ae','#bde0ca','#6cb394']).map((color,i)=><DesignColorPicker key={i} variant="heat-map" label={`Sentiment color ${i+1}`} value={color} onChange={color=>update({sentimentColors:(draft.sentimentColors??['#f7bbc5','#fad7b7','#f8e8ae','#bde0ca','#6cb394']).map((c,j)=>j===i?color:c),palette:'sentiment'})}/>)}</div></>}<label className={styles.field}>Heatmap palette<HeatMapSelect label="Heatmap palette" value={draft.palette} options={['blue','green','sentiment']} formatOption={v=>`${String(v).charAt(0).toUpperCase()}${String(v).slice(1)} — low to high`} onChange={palette=>update({palette:palette as AdvancedHeatmapConfig['palette'],designType:'Widget'})} /></label><label className={styles.check}><input type="checkbox" checked={draft.showBases} onChange={e => update({ showBases: e.target.checked })} />Show response counts</label><p className={styles.muted}>Empty cells stay neutral. Count headers are not colored as scores. Scores use each question’s own range; percentage cells share a 0–100% scale.</p></>}
        {invalid && !filterError && <p className={styles.error}>Enter a name, keep at least one visible question row, and complete all custom weights.</p>}
      </div>
      <footer className={styles.footer}><button type="button" className={styles.secondary} onClick={() => setEditing(false)}>Cancel</button><button type="button" className={styles.primary} disabled={invalid} onClick={() => { onChange(draft); setEditing(false); }}>Apply changes</button></footer>
    </WuDrawer>
    </DashboardWidgetCard>
  </div>;
}

function HeatmapTable({ config, onChange, dashboardFilter, dashboardDesign }: { dashboardDesign?: DashboardDesign; config: AdvancedHeatmapConfig; onChange: (config: AdvancedHeatmapConfig) => void; dashboardFilter?: DashboardActiveFilter }) {
  const questions = useMemo(() => adaptHeatmapQuestions(getQuestionsBySurvey(config.surveyId)), [config.surveyId]);
  const sourceResponses = useMemo(() => createHeatmapResponses(questions), [questions]);
  const filtered = filterHeatmapResponses(sourceResponses, questions, config, dashboardFilter);
  const responses = filtered.responses;
  const [expanded, setExpanded] = useState<string[]>([]);
  const visible = questions.filter(q => q.rows.some(r => config.selected.includes(r.id) && !config.excluded.includes(r.id)));
  const columns = distributionColumns(visible, config);
  const rowGroups = heatmapRowGroups(visible, responses, config);
  const shownRows = rowGroups.flatMap(group => [
    { ...group.entry, expandable: group.entry.summary, child: false, contextOnly: group.contextOnly },
    ...(expanded.includes(group.entry.id) ? group.children.map(entry => ({ ...entry, expandable: false, child: true, contextOnly: false })) : []),
  ]);
  const metricFilterActive = isMetricFilterActive(config);
  const clearMetricFilter = () => onChange({ ...config, metricFilter: { ...config.metricFilter!, enabled: false } });
  const filterDescription = config.metricFilter?.operator === 'between'
    ? `${config.metricLabel || 'Custom metric'}: ${config.metricFilter.value}–${config.metricFilter.upper}`
    : `${config.metricLabel || 'Custom metric'} ${METRIC_FILTER_OPERATORS.find(o => o.id === config.metricFilter?.operator)?.symbol ?? ''} ${config.metricFilter?.value}`;
  const segments = advancedHeatmapSegments(responses,questions,config);
  const filterBlocked = Boolean(filtered.error);
  const label = (id: string, fallback: string) => config.aliases[id] || fallback;
  function scoreRange(q: HeatmapQuestion, custom: boolean): [number, number] {
    const values = q.options.filter(o => !isHeatmapOptionExcluded(o.id, config)).map(o => custom ? config.weights[o.id] : o.score).filter((v): v is number => v !== undefined && Number.isFinite(v));
    if (config.mode === 'segments' && !custom && config.scoreRange && config.scoreRange !== 'Default') return [0,config.scoreRange === '0–10' ? 10 : 5];
    return values.length ? [Math.min(...values), Math.max(...values)] : [0, 1];
  }
  function cell(value: HeatmapCell, key: string, range: [number, number], suffix = '', baseLabel = 'answers', answerLabels = '') {
    const unavailable = value.value === null;
    const fraction = unavailable ? 0 : range[1] === range[0] ? 0.5 : Math.max(0, Math.min(1, (value.value! - range[0]) / (range[1] - range[0])));
    const colors = config.mode === 'segments' ? segmentColors(config,dashboardDesign) : config.designType !== 'Widget' && dashboardDesign ? getDashboardDesignColors(dashboardDesign).sentiment : config.palette === 'sentiment' && config.sentimentColors ? config.sentimentColors : config.palette === 'green' ? ['#edf8f1','#c9ead6','#97d4b1','#5caf83','#24774e'] : config.palette === 'sentiment' ? ['#f7bbc5','#fad7b7','#f8e8ae','#bde0ca','#6cb394'] : ['#edf5fc','#cbe1f5','#98c3e8','#62a0d5','#3077b5'];
    const background = unavailable ? '#f5f6f8' : colors[Math.min(4, config.mode === 'segments' ? segmentBandIndex(config.customMetric ? fraction*100 : value.value!,config.customMetric ? 100 : range[1],config.thresholds) : Math.floor(fraction * 5))];
    return <td key={key} style={{ background, color: config.mode === 'segments' ? '#545e6b' : getReadableDesignColor(background) }} title={unavailable ? 'No valid answers or scoring mapping is incomplete.' : `${answerLabels ? `${answerLabels}; ` : ''}${value.value!.toFixed(4)}${suffix === 'score' ? '' : suffix}; base: ${value.base} ${baseLabel}`}>
      {unavailable ? value.reason === 'weights-required' ? 'Set weights' : '—' : `${value.value!.toFixed(suffix === '%' ? config.precision : config.mode === 'distribution' && config.display === 'count' && suffix !== 'score' ? 0 : config.precision)}${suffix === 'score' ? '' : suffix}`}{config.mode === 'segments' && config.showBases && baseLabel !== 'questions' && <small className={regular.cellCount}>n = {value.base}</small>}
    </td>;
  }
  return <div className={styles.tableContainer}><div className={config.mode === 'segments' ? `${regular.tableScroll} ${styles.segmentTableScroll}` : styles.widgetTableScroll}>
      {metricFilterActive && !filterBlocked && <div className={styles.metricFilterBar} role="status"><span>{filterDescription} · {rowGroups.reduce((total, group) => total + group.children.length + Number(!group.contextOnly), 0)} matching rows</span><button type="button" onClick={clearMetricFilter}>Clear filter</button></div>}
      {filterBlocked ? <div className={styles.notice}>{filtered.error}</div> :
      <table className={config.mode === 'segments' ? `${regular.heatTable} ${visible.some(q=>q.rows.length>1) ? regular.matrixTable : ''}` : styles.table} aria-label={config.mode === 'segments' ? 'Segment comparison' : 'Answer distribution'}>
        <thead><tr><th style={config.mode === 'segments' ? {width:`${100/(segments.length+1)+5}%`} : undefined}>{config.mode === 'segments' ? 'Statement' : 'Question'}</th>
          {config.mode === 'distribution' ? <>
            {config.showBases && <th title="Respondents answering this row">N</th>}
            {config.customMetric && <th>{config.metricLabel || 'Custom metric'}</th>}
            {columns.map(column => <th key={column.key}>{column.label}</th>)}
          </> : segments.map(segment => <th key={segment.id} style={{width:`${100/(segments.length+1)}%`}} title={`${segment.responses.length} respondents`}>{segment.label}</th>)}
        </tr></thead>
        <tbody>{config.mode === 'segments' && config.showBases && <tr className={regular.countRow}><th scope="row">Response count</th>{segments.map(s=><td key={s.id}>{s.responses.length}</td>)}</tr>}
        {config.mode === 'segments' && config.overallAverage && <tr><th scope="row">Overall average</th>{segments.map(s=>cell(segmentOverallAverage(s.responses,visible,config),s.id,[0,Math.max(...visible.map(q=>scoreRange(q,config.customMetric)[1]))],'score','questions'))}</tr>}
        {shownRows.map(entry => {
            const { question, metric } = entry;
            return <tr key={entry.id} className={config.mode === 'distribution' && entry.summary ? styles.summary : undefined}>
              <th scope="row" className={config.mode === 'segments' ? (entry.child ? regular.childRow : undefined) : `${styles.questionCell} ${entry.child ? styles.childRow : ''}`}>
                {entry.expandable ? <button type="button" className={config.mode === 'segments' ? styles.segmentMatrixToggle : styles.matrixToggle} aria-expanded={expanded.includes(entry.id)} aria-label={`${expanded.includes(entry.id) ? 'Collapse' : 'Expand'} ${entry.label}`} onClick={() => setExpanded(current => current.includes(entry.id) ? current.filter(id => id !== entry.id) : [...current, entry.id])}><span aria-hidden>{expanded.includes(entry.id) ? '▾' : '▸'}</span>{entry.label}</button> : entry.child || entry.grouped ? entry.label : config.aliases[entry.rows[0].id] || label(question.id, question.label)}
              </th>
              {entry.contextOnly ? <td colSpan={config.mode === 'distribution' ? Number(config.showBases) + Number(config.customMetric) + columns.length : segments.length} title="Matrix total is outside the filter; expand to view matching statements">—</td> : config.mode === 'segments' ? segments.map(segment => cell(summaryCell(entry.sources.map(source => segmentScoreCell(segment.responses, source.row.id, source.question, config))), `${entry.id}-${segment.id}`, [Math.min(...entry.sources.map(s => scoreRange(s.question, config.customMetric)[0])), Math.max(...entry.sources.map(s => scoreRange(s.question, config.customMetric)[1]))], 'score', entry.summary ? 'statement answers' : 'answers')) : <>
                {config.showBases && <td title={entry.summary ? 'Valid statement answers' : 'Respondents answering this row'}>{metric.base}</td>}
                {config.customMetric && cell(metric, `${entry.id}-score`, [Math.min(...entry.sources.map(s => scoreRange(s.question, true)[0])), Math.max(...entry.sources.map(s => scoreRange(s.question, true)[1]))], 'score', entry.summary ? 'statement answers' : 'answers')}
                {columns.map(column => {
                  const applicable = entry.sources.filter(source => column.questionOptions[source.question.id]?.length);
                  if (!applicable.length) return <td key={column.key} title="This answer option does not apply to this question">—</td>;
                  const result = poolDistributionCells(entry.sources.map(source => distributionCell(responses, source.row.id, column.questionOptions[source.question.id] ?? [], config)), config);
                  const answerLabels = [...new Set(applicable.flatMap(source => source.question.options.filter(o => column.questionOptions[source.question.id].includes(o.id)).map(o => o.label)))].join(' / ');
                  return cell(result, column.key, [0, config.display === 'percent' ? 100 : result.base], config.display === 'percent' ? '%' : '', entry.summary || entry.grouped ? 'statement answers' : 'answers', answerLabels);
                })}
              </>}
            </tr>;
        })}
        {shownRows.length === 0 && <tr><td colSpan={1 + (config.mode === 'distribution' ? Number(config.showBases) + Number(config.customMetric) + columns.length : segments.length)} className={styles.emptyResults}>No rows match this custom metric filter.</td></tr>}
        </tbody>
      </table>}</div>
      {!filterBlocked && config.mode === 'segments' && config.widgetStats && (config.statsResponseCount ?? true) && <footer className={regular.stats}>{config.statsLabel || 'Response count'}: <strong>{responses.length}</strong></footer>}
    </div>;
}
