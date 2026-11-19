'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import type { DriverAnalysisWidgetConfig } from '@/data/mock-ai-widgets';
import { DEFAULT_DASHBOARD_SURVEY } from '@/data/mock-survey-folders';
import { driverDefaultScoring, formatRating, ratingRange, preparedDriverData, resolveDriverConfig } from '@/data/driver-scoring';
import { fitDriverModel } from '@/data/driver-model';
import { AIRLINE_DRIVER_NAMES } from '@/data/mock-driver-analysis';
import type { KpiScoring } from '@/data/mock-text-ai-kpi-by-theme';
import { DriverImportanceChart } from './DriverImportanceChart';
import { DEFAULT_DASHBOARD_DESIGN, getDashboardDesignColors, type DashboardDesign } from '@/data/dashboard-design';
import type { AmChartTypography } from '@/components/charts/amcharts/theme';
import styles from './DriverAnalysisWidget.module.css';

export const SAMPLE_DRIVER_CONFIG = resolveDriverConfig(undefined, DEFAULT_DASHBOARD_SURVEY.id, AIRLINE_DRIVER_NAMES)!;
const sampleScoring = driverDefaultScoring(SAMPLE_DRIVER_CONFIG.outcome!, 'nps');

export function DriverAnalysisWidget({ config = SAMPLE_DRIVER_CONFIG, scoring = sampleScoring, dashboardDesign = DEFAULT_DASHBOARD_DESIGN, typography }: {
  config?: DriverAnalysisWidgetConfig;
  scoring?: KpiScoring;
  dashboardDesign?: DashboardDesign;
  typography?: AmChartTypography;
}) {
  const [mode, setMode] = useState<'diagnose' | 'predict'>('diagnose');
  const [scenario, setScenario] = useState<{ model: unknown; index: number; target: number } | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const data = useMemo(() => preparedDriverData(config, scoring), [config, scoring]);
  const model = useMemo(() => data && fitDriverModel(data.rows, config.drivers.length), [config, data]);
  if (!model || !data) return <p>Choose a scored primary question and drivers to run the analysis.</p>;

  const overall = formatRating(data.means[0], scoring);
  const summary = (leadingDriver?: string) => <div className={styles.summary}>
    <div className={styles.metric}><span>{scoring.name}</span><strong>{overall}</strong></div>
    <div className={styles.sample}><strong>{data.rows.length} of {data.total} sample responses</strong>
      <span>{data.total - data.rows.length} excluded from this analysis</span></div>
    {leadingDriver && <div className={styles.leading}><span>Top driver by importance</span><strong>{leadingDriver}</strong></div>}
  </div>;
  const colors = getDashboardDesignColors(dashboardDesign);
  const lowerColor = colors.sentiment[1];
  const higherColor = colors.sentiment[colors.sentiment.length - 1];
  const rating = (index: number) => formatRating(data.means[index + 1], data.driverRules[index]);
  if ('error' in model) return <div className={styles.widget}>{summary()}<p role="status">{model.error}</p>
    <table className={styles.resultsTable}><thead><tr><th>Driver</th><th>Rating</th></tr></thead>
      <tbody>{config.drivers.map((driver, index) => <tr key={driver.id}><td>{driver.name}</td>
        <td>{data.driverRules[index].name} {rating(index)}</td></tr>)}</tbody>
    </table></div>;

  const ranked = [...model.drivers].sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0));
  const cutoff = 100 / ranked.length;
  const yMax = Math.min(100, Math.ceil(Math.max(cutoff, ranked[0].importance ?? 0) / 10) * 10);
  const points = ranked.map((d, rank) => {
    const [min, max] = data.ranges[d.index];
    const x = (d.mean - min) / (max - min) * 100;
    const driver = config.drivers[d.index];
    const rule = data.driverRules[d.index];
    const color = (d.importance ?? 0) >= cutoff ? (x < 50 ? 'amber' : 'teal') : 'slate';
    const importance = d.importance === null ? '—' : d.importance.toFixed(1) + '%';
    const ratingLabel = rule.name === 'Mean' && min === 1
      ? `${rating(d.index)} / ${max}` : `${rule.name} ${rating(d.index)}`;
    const description = `${driver.name} · Importance ${importance} · ${rule.name} ${rating(d.index)} (scale ${min} to ${max}) · Pearson r ${d.correlation.toFixed(2)}`;
    return { ...d, ...driver, rank: rank + 1, x, color, importanceLabel: importance, ratingLabel, description };
  });
  const top = points[0];

  const selected = scenario?.model === model ? scenario : null;
  const effect = selected ? model.drivers[selected.index].slope * (selected.target - model.drivers[selected.index].mean) : 0;
  const prediction = model.baseline + effect;
  const [outcomeMin, outcomeMax] = ratingRange(config.outcome!, scoring);
  const outside = prediction < outcomeMin - 1e-8 || prediction > outcomeMax + 1e-8;
  const percent = scoring.metric === 'csat' || (scoring.metric === 'ces' && scoring.cesCalculation === 'percent-easy');

  return <div className={styles.widget} style={{ '--driver-accent': colors.accent, '--driver-lower': lowerColor, '--driver-higher': higherColor } as CSSProperties}>
    <div className={styles.modeToggle} role="group" aria-label="Analysis view">
      {(['diagnose', 'predict'] as const).map(value => <button key={value} type="button"
        aria-pressed={mode === value} onClick={() => setMode(value)}>{value === 'diagnose' ? 'Diagnose' : 'Predict'}</button>)}
    </div>
    {summary(mode === 'diagnose' && top.importance !== null ? top.name : undefined)}
    {mode === 'predict' ? <div className={styles.predictPanels}>
      <section className={styles.predictCard} aria-label="Scenario estimate">
        <span>Estimated {scoring.name}</span>
        <strong className={styles.predictValue} aria-live="polite">{formatRating(prediction, scoring)}</strong>
        <span>Baseline {overall}</span>
        <span>Change {effect > 0 ? '+' : ''}{effect.toFixed(scoring.precision)} {percent ? 'percentage points' : 'points'}</span>
        {outside && <p role="status">Estimate is outside the supported outcome range ({outcomeMin} to {outcomeMax}).</p>}
        <button type="button" className={styles.resetButton} onClick={() => setScenario(null)}>Reset scenario</button>
        <p>Change one driver’s mean at a time. Other drivers stay at baseline. This is a model estimate, not a guaranteed outcome.</p>
      </section>
      <section className={styles.scenarioControls} aria-label="Driver scenarios">
        <h4>Adjust a driver</h4>
        {points.map(point => {
          const [min, max] = data.ranges[point.index];
          const target = selected?.index === point.index ? selected.target : point.mean;
          return <label key={point.id} className={styles.scenarioRow}>
            <span className={styles.scenarioName}>{point.name}</span>
            <span className={styles.scenarioValues}>Baseline {point.mean.toFixed(2)} · Target {target.toFixed(2)} · Scale {min} to {max}</span>
            <input type="range" min={min} max={max} step="0.01" value={target}
              aria-label={`Target mean for ${point.name}`} aria-valuetext={`${target.toFixed(2)} on a scale from ${min} to ${max}`}
              onChange={event => setScenario({ model, index: point.index, target: Number(event.target.value) })} />
          </label>;
        })}
      </section>
    </div> : <>
    <div className={styles.panels}>
      <section className={styles.mapPane} aria-label="Importance and rating chart">
        <h4>Importance vs. rating</h4>
        <div className={styles.axisLabel}>Relative importance</div>
        <DriverImportanceChart points={points} cutoff={cutoff} yMax={yMax} active={active} onActive={setActive}
          typography={typography} lowerColor={lowerColor} higherColor={higherColor} />
        <div className={styles.xLabel}>Driver rating (scaled to 0–100)</div>
        <div className={styles.legend}><span data-tone="amber">High importance · lower rating</span>
          <span data-tone="teal">High importance · higher rating</span></div>
      </section>
      <section className={styles.tablePane} aria-label="Ranked drivers">
        <h4>Ranked drivers</h4>
        <table className={styles.resultsTable}><thead><tr>
          <th scope="col">Driver</th><th scope="col">Importance</th><th scope="col">Mean rating</th>
          <th scope="col" title="Pearson correlation with the primary rating">Pearson r</th>
        </tr></thead>
          <tbody>{points.map(p => <tr key={p.id} data-active={active === p.id}
            onMouseEnter={() => setActive(p.id)} onMouseLeave={() => setActive(null)}>
            <th scope="row"><span className={styles.driverCell}><span className={styles.rank} data-tone={p.color}>{p.rank}</span>{p.name}</span></th>
            <td className={styles.importance}>{p.importanceLabel}</td>
            <td title={p.description}>{p.ratingLabel}</td><td>{p.correlation.toFixed(2)}</td>
          </tr>)}</tbody>
        </table>
      </section>
    </div>
    <details className={styles.method}><summary>How to read this analysis</summary>
      <p>{top.importance === null ? 'The model found no measurable share of explained variation.' :
        `${top.name} ranks first, accounting for ${top.importanceLabel} of the variation explained by the model.`}
        {' '}Together, the selected drivers explain {(model.explained * 100).toFixed(1)}% of the variation in the primary rating (R² {model.explained.toFixed(3)}).</p>
      <p>Importance uses Shapley shares. Pearson r shows the direction and strength of each driver’s association with the primary rating.
        The chart divides at the rating midpoint and an equal share of importance ({cutoff.toFixed(1)}%).</p>
    </details>
    </>}
  </div>;
}
