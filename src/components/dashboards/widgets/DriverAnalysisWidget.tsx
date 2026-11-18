'use client';

import { useMemo } from 'react';
import type { DriverAnalysisWidgetConfig } from '@/data/mock-ai-widgets';
import { DEFAULT_DASHBOARD_SURVEY } from '@/data/mock-survey-folders';
import { driverDefaultScoring, formatRating, preparedDriverData, resolveDriverConfig } from '@/data/driver-scoring';
import { fitDriverModel } from '@/data/driver-model';
import { AIRLINE_DRIVER_NAMES } from '@/data/mock-driver-analysis';
import type { KpiScoring } from '@/data/mock-text-ai-kpi-by-theme';
import styles from './DriverAnalysisWidget.module.css';

export const SAMPLE_DRIVER_CONFIG = resolveDriverConfig(undefined, DEFAULT_DASHBOARD_SURVEY.id, AIRLINE_DRIVER_NAMES)!;
const sampleScoring = driverDefaultScoring(SAMPLE_DRIVER_CONFIG.outcome!, 'nps');

export function DriverAnalysisWidget({ config = SAMPLE_DRIVER_CONFIG, scoring = sampleScoring }: {
  config?: DriverAnalysisWidgetConfig;
  scoring?: KpiScoring;
}) {
  const data = useMemo(() => preparedDriverData(config, scoring), [config, scoring]);
  const model = useMemo(() => data && fitDriverModel(data.rows, config.drivers.length), [config, data]);
  if (!model || !data) return <p>Choose a supported primary question and drivers to run the analysis.</p>;
  const base = <span>{data.rows.length} of {data.total} sample responses included · {data.total - data.rows.length} excluded</span>;
  const summary = <div className={styles.summary}><strong>{scoring.name} {formatRating(data.means[0], scoring)}</strong> · {base}</div>;
  const ratingText = (index: number) => {
    const rule = data.driverRules[index];
    return `${rule.name} ${formatRating(data.means[index + 1], rule)}`;
  };
  if ('error' in model) return <div className={styles.widget}>{summary}<p role="status">{model.error}</p>
    <table className={styles.resultsTable}><thead><tr><th>Driver</th><th>Rating</th></tr></thead>
      <tbody>{config.drivers.map((driver, index) => <tr key={driver.id}><td>{driver.name}</td><td>{ratingText(index)}</td></tr>)}</tbody>
    </table></div>;
  const ranked = [...model.drivers].sort((a, b) => (b.importance ?? 0) - (a.importance ?? 0));
  const cut = 100 / ranked.length;
  const yMax = Math.min(100, Math.max(cut, 10, Math.ceil((ranked[0].importance ?? 0) / 10) * 10));
  return <div className={styles.widget}>
    {summary}
      <div className={styles.panels}>
        <div className={styles.quadrantPane}>
          <div className={styles.axisTitle}>Relative importance (% of explained variance)</div>
          <div className={styles.plotRow}><div className={styles.yAxis}><span>{yMax}%</span><span>0%</span></div>
          <div className={styles.plotColumn}><div className={styles.plot}>
            <div className={styles.splitVertical} style={{ left: '50%' }} />
            <div className={styles.splitHorizontal} style={{ top: `${100 - cut / yMax * 100}%` }} />
            <span className={`${styles.quadrantLabel} ${styles.quadrantTopLeft}`}>High importance · lower score</span>
            <span className={`${styles.quadrantLabel} ${styles.quadrantTopRight}`}>High importance · higher score</span>
            {ranked.map((d, rank) => {
              if (d.importance === null) return null;
              const [min, max] = data.ranges[d.index];
              const perf = (d.mean - min) / (max - min) * 100;
              const name = config.drivers[d.index].name;
              return <span key={d.index} className={styles.dot} style={{ left: `${perf}%`, top: `${100 - d.importance / yMax * 100}%` }}
                title={`${name} · Importance ${d.importance.toFixed(1)}% · ${ratingText(d.index)} · r ${d.correlation.toFixed(2)}`}>
                <span className={styles.rankDot}>{rank + 1}</span></span>;
            })}
          </div><div className={styles.xAxis}><span>0</span><span>50</span><span>100</span></div>
          <div className={styles.axisTitle}>Configured rating on a 0–100 scale</div></div></div>
        </div>
        <div className={styles.tablePane}><div className={styles.tableScroll}><table className={styles.resultsTable}><thead><tr><th>Driver</th><th>Importance</th><th>Pearson r</th><th>Rating</th></tr></thead>
          <tbody>{ranked.map((d, rank) => <tr key={d.index}><td>{rank + 1}. {config.drivers[d.index].name}</td>
            <td>{d.importance === null ? '—' : d.importance.toFixed(1) + '%'}</td><td>{d.correlation.toFixed(2)}</td>
            <td title={`Scale ${data.ranges[d.index].join(' to ')}`}>{ratingText(d.index)}</td></tr>)}</tbody>
        </table></div></div>
      </div>
      <div className={styles.note}>Linear model R² {model.explained.toFixed(3)} · Shapley shares of explained variance · Pearson r. Dividers mark equal importance ({cut.toFixed(1)}%) and the scale midpoint.</div>
  </div>;
}
