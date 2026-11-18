'use client';

import { useMemo, useState } from 'react';
import type { DriverAnalysisWidgetConfig } from '@/data/mock-ai-widgets';
import { DEFAULT_DASHBOARD_SURVEY } from '@/data/mock-survey-folders';
import { driverDefaultScoring, outcomeValue, preparedDriverData, resolveDriverConfig } from '@/data/driver-scoring';
import { fitDriverModel } from '@/data/driver-model';
import { AIRLINE_DRIVER_NAMES, type DriverAnalysisMode } from '@/data/mock-driver-analysis';
import type { KpiScoring } from '@/data/mock-text-ai-kpi-by-theme';
import styles from './DriverAnalysisWidget.module.css';

export const SAMPLE_DRIVER_CONFIG = resolveDriverConfig(undefined, DEFAULT_DASHBOARD_SURVEY.id, AIRLINE_DRIVER_NAMES)!;
const sampleScoring = driverDefaultScoring(SAMPLE_DRIVER_CONFIG.outcome!, 'nps');

export function DriverAnalysisWidget({ config = SAMPLE_DRIVER_CONFIG, scoring = sampleScoring, mode: controlledMode }: {
  config?: DriverAnalysisWidgetConfig;
  scoring?: KpiScoring;
  mode?: DriverAnalysisMode;
}) {
  const [localMode, setLocalMode] = useState<DriverAnalysisMode>('diagnose');
  const [scenario, setScenario] = useState<{ index: number; target: number } | null>(null);
  const mode = controlledMode ?? localMode;
  const data = useMemo(() => preparedDriverData(config, scoring), [config, scoring]);
  const model = useMemo(() => data && fitDriverModel(data.rows, config.drivers.length), [config, data]);
  if (!model || !data) return <p>Choose a supported primary question and drivers to run the analysis.</p>;
  const base = <span>{data.rows.length} of {data.total} sample responses included · {data.total - data.rows.length} excluded</span>;
  if ('error' in model) return <div className={styles.note}>{base}<p>{model.error}</p></div>;

  const fmt = (n: number) => n.toFixed(scoring.precision);
  const ranked = [...model.drivers].sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0));
  const metricUnit = scoring.metric === 'csat' || (scoring.metric === 'ces' && scoring.cesCalculation === 'percent-easy') ? '%' : '';
  const active = scenario && model.drivers[scenario.index];
  const change = active && scenario ? active.slope * (scenario.target - active.mean) : 0;
  const prediction = model.baseline + change;
  const scores = config.outcome!.answers.flatMap(a => outcomeValue(scoring, a.score) ?? []);
  const outside = prediction < Math.min(...scores) - 1e-8 || prediction > Math.max(...scores) + 1e-8;
  const cut = 100 / ranked.length;
  const yMax = Math.min(100, Math.max(10, Math.ceil((ranked[0].importance ?? 0) / 10) * 10));
  return <div className={styles.widget}>
    {!controlledMode && <div className={styles.modeToggle}>{(['diagnose','predict'] as const).map(m =>
      <button key={m} onClick={() => setLocalMode(m)} className={m === mode ? styles.modeBtnActive : styles.modeBtn}>{m === 'diagnose' ? 'Diagnose' : 'Predict'}</button>)}</div>}
    <div className={styles.summary}><strong>{scoring.name} {fmt(model.baseline)}{metricUnit}</strong> · {base}</div>
    {mode === 'diagnose' ? <>
      <div className={styles.panels}>
        <div className={styles.quadrantPane}>
          <div className={styles.axisTitle}>Relative importance (% of explained variance)</div>
          <div className={styles.plotRow}><div className={styles.yAxis}><span>{yMax}%</span><span>0%</span></div>
          <div className={styles.plotColumn}><div className={styles.plot}>
            <div className={styles.splitVertical} style={{ left: '50%' }} />
            <div className={styles.splitHorizontal} style={{ top: `${100 - cut / yMax * 100}%` }} />
            <span className={`${styles.quadrantLabel} ${styles.quadrantTopLeft}`}>High impact · lower score</span>
            <span className={`${styles.quadrantLabel} ${styles.quadrantTopRight}`}>High impact · higher score</span>
            {ranked.map((d, rank) => {
              if (d.importance === null) return null;
              const range = data.ranges[d.index];
              const perf = (d.mean - range.min) / (range.max - range.min) * 100;
              const name = config.drivers[d.index].name;
              return <span key={d.index} className={styles.dot} style={{ left: `${perf}%`, top: `${100 - d.importance / yMax * 100}%` }}
                title={`${name} · Importance ${d.importance.toFixed(1)}% · Mean ${d.mean.toFixed(2)} · r ${d.correlation.toFixed(2)}`}>
                <span className={styles.rankDot}>{rank + 1}</span></span>;
            })}
          </div><div className={styles.xAxis}><span>0</span><span>50</span><span>100</span></div>
          <div className={styles.axisTitle}>Mean score on a 0–100 scale</div></div></div>
        </div>
        <div className={styles.tablePane}><div className={styles.tableScroll}><table className={styles.resultsTable}><thead><tr><th>Driver</th><th>Impact</th><th>r</th><th>Mean</th></tr></thead>
          <tbody>{ranked.map((d, rank) => <tr key={d.index}><td>{rank + 1}. {config.drivers[d.index].name}</td>
            <td>{d.importance === null ? '—' : d.importance.toFixed(1) + '%'}</td><td>{d.correlation.toFixed(2)}</td>
            <td title={`Scale ${data.ranges[d.index].min}–${data.ranges[d.index].max}`}>{d.mean.toFixed(2)}</td></tr>)}</tbody>
        </table></div></div>
      </div>
      <div className={styles.note}>Linear model R² {model.explained.toFixed(3)} · Shapley shares of explained variance · Pearson r. Dividers mark equal importance ({cut.toFixed(1)}%) and the scale midpoint.</div>
    </> : <div className={styles.panels}>
      <div className={styles.predictPane}><div className={styles.predictCard}><span>Estimated {scoring.name}</span>
        <strong className={styles.predictValue}>{fmt(prediction)}{metricUnit}</strong>
        <span>Baseline {fmt(model.baseline)}{metricUnit} · Change {change > 0 ? '+' : ''}{fmt(change)} {metricUnit ? 'percentage points' : 'points'}</span>
        {outside && <span role="status">Estimate is outside the supported outcome range.</span>}</div>
        <button className={styles.resetBtn} onClick={() => setScenario(null)}>Reset scenario</button>
        <div className={styles.note}>Move one driver at a time. The fitted slope estimates the change with the other drivers held at baseline.</div></div>
      <div className={styles.simPane}><div className={styles.tableScroll}>{ranked.map(d => {
        const range = data.ranges[d.index];
        const target = scenario?.index === d.index ? scenario.target : d.mean;
        return <label key={d.index} className={styles.scenarioRow}><span>{config.drivers[d.index].name}</span>
          <input type="range" min={range.min} max={range.max} step="0.01" value={target} aria-label={`Target mean for ${config.drivers[d.index].name}`}
            onChange={e => setScenario({ index: d.index, target: Number(e.target.value) })} />
          <span>{target.toFixed(2)}</span></label>;
      })}</div></div>
    </div>}
  </div>;
}
