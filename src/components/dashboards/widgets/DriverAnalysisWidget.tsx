'use client';

import { useMemo, useState, type CSSProperties } from 'react';
import type { DriverAnalysisWidgetConfig } from '@/data/mock-ai-widgets';
import { DEFAULT_DASHBOARD_SURVEY } from '@/data/mock-survey-folders';
import { driverDefaultScoring, formatRating, ratingRange, preparedDriverData, resolveDriverConfig } from '@/data/driver-scoring';
import { fitDriverModel, analyzeSpearmanDrivers, predictDriverScenario } from '@/data/driver-model';
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
  const [scenario, setScenario] = useState<{ model: unknown; shifts: Record<number, number> } | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const data = useMemo(() => preparedDriverData(config, scoring), [config, scoring]);
  const model = useMemo(() => data && fitDriverModel(data.rows, config.drivers.length), [config, data]);
  const diagnosis = useMemo(() => data && analyzeSpearmanDrivers(data.rows, config.drivers.length), [config, data]);
  if (!diagnosis || !data) return <p>Choose a scored primary question and drivers to run the analysis.</p>;

  const overall = formatRating(data.means[0], scoring);
  const summary = (leadingDriver?: string) => <div className={styles.summary}>
    <div className={styles.metric}><span>{scoring.name}</span><strong>{overall}</strong></div>
    <div className={styles.sample}><strong>{data.rows.length} of {data.total} sample responses</strong>
      <span>{data.total - data.rows.length} excluded from this analysis</span></div>
    {leadingDriver && <div className={styles.leading}><span>Top driver by Spearman strength</span><strong>{leadingDriver}</strong></div>}
  </div>;
  const colors = getDashboardDesignColors(dashboardDesign);
  const lowerColor = colors.sentiment[1];
  const higherColor = colors.sentiment[colors.sentiment.length - 1];
  const rating = (index: number) => formatRating(data.means[index + 1], data.driverRules[index]);
  if ('error' in diagnosis) return <div className={styles.widget}>{summary()}<p role="status">{diagnosis.error}</p>
    <table className={styles.resultsTable}><thead><tr><th>Driver</th><th>Rating</th></tr></thead>
      <tbody>{config.drivers.map((driver, index) => <tr key={driver.id}><td>{driver.name}</td>
        <td>{data.driverRules[index].name} {rating(index)}</td></tr>)}</tbody>
    </table></div>;

  const ranked = [...diagnosis.drivers].sort((a, b) => (b.importance ?? -1) - (a.importance ?? -1));
  const cutoff = 0.5;
  const yMax = 1;
  const points = ranked.map((d, rank) => {
    const [min, max] = data.ranges[d.index];
    const x = (d.mean - min) / (max - min) * 100;
    const driver = config.drivers[d.index];
    const rule = data.driverRules[d.index];
    const color = (d.importance ?? 0) >= cutoff ? (x < 50 ? 'amber' : 'teal') : 'slate';
    const importance = d.importance === null ? '—' : d.importance.toFixed(2);
    const ratingLabel = rule.name === 'Mean' && min === 1
      ? `${rating(d.index)} / ${max}` : `${rule.name} ${rating(d.index)}`;
    const description = `${driver.name} · Spearman strength ${importance} · ${rule.name} ${rating(d.index)} (scale ${min} to ${max}) · Spearman ρ ${d.correlation === null ? 'unavailable (constant driver)' : d.correlation.toFixed(2)}`;
    return { ...d, ...driver, rank: rank + 1, x, color, importanceLabel: importance, ratingLabel, description };
  });
  const top = points[0];

  const predictionModel = model && !('error' in model) ? model : null;
  const shifts = scenario?.model === predictionModel ? scenario.shifts : {};
  const estimate = predictionModel ? predictDriverScenario(predictionModel, shifts, data.ranges) : null;
  const effect = estimate?.change ?? 0;
  const prediction = estimate?.estimate ?? diagnosis.baseline;
  const [outcomeMin, outcomeMax] = ratingRange(config.outcome!, scoring);
  const outside = prediction < outcomeMin - 1e-8 || prediction > outcomeMax + 1e-8;
  const percent = scoring.metric === 'csat' || (scoring.metric === 'ces' && scoring.cesCalculation === 'percent-easy');
  const signed = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(scoring.precision)}`;
  const liftClass = (value: number) => value > 0 ? styles.liftUp : value < 0 ? styles.liftDown : styles.liftFlat;
  const adjusted = estimate?.drivers.filter(driver => Math.abs(driver.shift) > 1e-8).length ?? 0;
  const scaleMin = Math.min(outcomeMin, prediction), scaleMax = Math.max(outcomeMax, prediction);
  const scalePosition = (value: number) => (value - scaleMin) / (scaleMax - scaleMin) * 100;
  const baselinePosition = scalePosition(diagnosis.baseline), predictedPosition = scalePosition(prediction);
  const opportunity = predictionModel?.drivers.map(driver => {
    const [min, max] = data.ranges[driver.index];
    const shift = driver.slope >= 0 ? Math.min(.5, max - driver.mean) : -Math.min(.5, driver.mean - min);
    return { ...driver, shift, gain: driver.slope * shift };
  }).filter(driver => driver.gain > 1e-8).sort((a, b) => b.gain - a.gain)[0];

  return <div className={styles.widget} style={{ '--driver-accent': colors.accent, '--driver-lower': lowerColor, '--driver-higher': higherColor } as CSSProperties}>
    <div className={styles.modeToggle} role="group" aria-label="Analysis view">
      {(['diagnose', 'predict'] as const).map(value => <button key={value} type="button"
        aria-pressed={mode === value} onClick={() => setMode(value)}>{value === 'diagnose' ? 'Diagnose' : 'Predict'}</button>)}
    </div>
    {summary(mode === 'diagnose' && top.importance !== null ? top.name : undefined)}
    {mode === 'predict' ? <div className={styles.predictPanels}>
      <section className={styles.predictPane} aria-label="Scenario estimate">
        <div className={styles.predictCard}>
          <span className={styles.predictLabel}>Predicted {scoring.name}</span>
          {estimate ? <>
            <div className={styles.predictValueRow} aria-live="polite">
              <strong className={styles.predictValue}>{formatRating(prediction, scoring)}</strong>
              <span className={`${styles.predictLift} ${liftClass(effect)}`}>{Math.abs(effect) < 1e-8 ? 'no change' : `${signed(effect)} ${percent ? 'pp' : 'pts'}`}</span>
            </div>
            <span className={styles.predictMeta}>from a baseline of {overall} · {adjusted === 0 ? 'move a driver to model the impact' : `${adjusted} driver${adjusted > 1 ? 's' : ''} adjusted`}</span>
          </> : <p role="status">Predict is unavailable: {model && 'error' in model ? model.error : 'The model could not be fitted.'} Spearman diagnosis remains available.</p>}
        </div>
        {estimate && <>
          <div className={styles.npsScale} role="img" aria-label={`Baseline ${overall}; predicted ${formatRating(prediction, scoring)}; scale ${scaleMin.toFixed(1)} to ${scaleMax.toFixed(1)}`}>
            <div className={styles.npsTicks}>{[0,.25,.5,.75,1].map(part => <span key={part}>{(scaleMin + part * (scaleMax-scaleMin)).toFixed(scoring.precision)}</span>)}</div>
            <div className={styles.npsTrack}>
              {scaleMin < 0 && scaleMax > 0 && <div className={styles.npsZero} style={{left:`${scalePosition(0)}%`}} />}
              <div className={styles.npsBaseMarker} style={{left:`${baselinePosition}%`}} />
              <div className={`${styles.npsBar} ${liftClass(effect)}`} style={{left:`${Math.min(baselinePosition,predictedPosition)}%`,width:`${Math.abs(predictedPosition-baselinePosition)}%`}} />
              <div className={styles.npsPredMarker} style={{left:`${predictedPosition}%`}} />
            </div>
            <div className={styles.npsLegend}><span><i />Today</span><span><i />Predicted</span></div>
          </div>
          {outside && <p role="status" className={styles.rangeWarning}>Estimate is outside the supported outcome range ({outcomeMin} to {outcomeMax}).</p>}
          <div className={styles.recommendation}>
            <strong className={styles.predictLabel}>Best next move</strong>
            <p>{opportunity ? `Shifting ${config.drivers[opportunity.index].name} by ${opportunity.shift > 0 ? '+' : ''}${opportunity.shift.toFixed(2)} (${opportunity.mean.toFixed(2)} → ${(opportunity.mean+opportunity.shift).toFixed(2)}) gives the largest modeled ${scoring.name} gain: ${signed(opportunity.gain)} ${percent ? 'percentage points' : 'points'}. Other drivers stay at baseline for this comparison.` : 'No improvement is available within the modeled driver ranges.'}</p>
          </div>
          <button type="button" className={styles.resetButton} onClick={() => setScenario(null)}><span className="wm-restart-alt" aria-hidden="true" />Reset scenario</button>
        </>}
        <p className={styles.predictionNote}>Linear-model scenario, separate from Spearman diagnosis. Estimates are not guaranteed outcomes.{predictionModel ? ` Model fit R² ${predictionModel.explained.toFixed(3)}.` : ''}</p>
      </section>
      <section className={styles.simPane} aria-label="Driver scenarios">
        <div className={`${styles.simRow} ${styles.simHead}`}><span>Driver</span><span>Shift score</span><span>{scoring.name} change{percent ? ' (pp)' : ' (pts)'}</span></div>
        {points.map(point => {
          const [min, max] = data.ranges[point.index];
          const driver = estimate?.drivers[point.index];
          const shift = driver?.shift ?? 0;
          return <div key={point.id} className={styles.simRow}>
            <span className={styles.simDriver}><span className={styles.driverDot} data-tone={point.color} /><span>{point.name}<small>Baseline {point.mean.toFixed(2)} · Target {(driver?.target ?? point.mean).toFixed(2)} · Scale {min}–{max}</small></span></span>
            <span className={styles.simSlider}>
              <input type="range" disabled={!predictionModel} min={Math.max(-1,min-point.mean)} max={Math.min(1,max-point.mean)} step="0.01" value={shift}
                aria-label={`Shift ${point.name} mean score`} aria-valuetext={`${shift > 0 ? '+' : ''}${shift.toFixed(2)}; target ${(point.mean+shift).toFixed(2)}`}
                onChange={event => setScenario({model:predictionModel,shifts:{...shifts,[point.index]:Number(event.target.value)}})} />
              <span className={styles.simDelta}>{shift > 0 ? '+' : ''}{shift.toFixed(2)}</span>
            </span>
            <span className={`${styles.simContrib} ${liftClass(driver?.contribution ?? 0)}`}>{!driver || Math.abs(driver.contribution) < 1e-8 ? '—' : signed(driver.contribution)}</span>
          </div>;
        })}
        <p className={styles.predictionNote}>Adjust one or more driver means by up to one point within their source scales. Contributions combine in the estimate; unadjusted drivers remain at baseline. Reset clears every shift.</p>
      </section>
    </div> : <>
    <div className={styles.panels}>
      <section className={styles.mapPane} aria-label="Importance and rating chart">
        <h4>Spearman strength vs. rating</h4>
        <div className={styles.axisLabel}>Association strength (|ρ|)</div>
        <DriverImportanceChart points={points} cutoff={cutoff} yMax={yMax} active={active} onActive={setActive}
          typography={typography} lowerColor={lowerColor} higherColor={higherColor} />
        <div className={styles.xLabel}>Driver rating (scaled to 0–100)</div>
        <div className={styles.legend}><span data-tone="amber">Higher association · lower rating</span>
          <span data-tone="teal">Higher association · higher rating</span></div>
      </section>
      <section className={styles.tablePane} aria-label="Ranked drivers">
        <h4>Ranked drivers</h4>
        <table className={styles.resultsTable}><thead><tr>
          <th scope="col">Driver</th><th scope="col" title="Absolute Spearman correlation, from 0 to 1">Strength |ρ|</th><th scope="col">Mean rating</th>
          <th scope="col" title="Signed Spearman rank correlation with the primary outcome">Spearman ρ</th>
        </tr></thead>
          <tbody>{points.map(p => <tr key={p.id} data-active={active === p.id}
            onMouseEnter={() => setActive(p.id)} onMouseLeave={() => setActive(null)}>
            <th scope="row"><span className={styles.driverCell}><span className={styles.rank} data-tone={p.color}>{p.rank}</span>{p.name}</span></th>
            <td className={styles.importance}>{p.importanceLabel}</td>
            <td title={p.description}>{p.ratingLabel}</td><td>{p.correlation === null ? '—' : p.correlation.toFixed(2)}</td>
          </tr>)}</tbody>
        </table>
      </section>
    </div>
    <details className={styles.method}><summary>How to read this analysis</summary>
      <p>Drivers are ranked by absolute Spearman correlation (|ρ|). Signed ρ shows direction on a −1 to +1 scale.
        Tied responses receive average ranks. Every driver uses the same {data.rows.length} complete responses.</p>
      <p>The chart divides at |ρ| = 0.50 and the rating midpoint. Strengths are not percentages and do not add to 100%.
        Constant drivers show —. Correlation does not establish causation or predict uplift.</p>
    </details>
    </>}
  </div>;
}
