'use client';

import { useMemo, useState } from 'react';
import {
  DRIVER_ANALYSIS_DIAGNOSE_INSIGHT,
  DRIVER_ANALYSIS_DRIVERS,
  DRIVER_ANALYSIS_METHOD_NOTE,
  DRIVER_ANALYSIS_PREDICT_EMPTY_INSIGHT,
  DRIVER_ANALYSIS_PREDICT_NOTE,
  DRIVER_BASELINE_NPS,
  DRIVER_COLOR_HIGH_IMPACT,
  DRIVER_COLOR_SECONDARY,
  DRIVER_COLOR_STRENGTH,
  DRIVER_IMPACT_SPLIT,
  DRIVER_IMPACT_TICKS,
  DRIVER_NPS_TICKS,
  DRIVER_PERF_SPLIT,
  DRIVER_PERF_TICKS,
  buildDriversFromSelections,
  driverAnalysisMethodNote,
  driverColor,
  driverContribution,
  driverImpactTopPercent,
  driverNpsAxisPercent,
  driverPerfLeftPercent,
  findTopOpportunity,
  formatDriverSigned,
  type DriverAnalysisMetric,
  type DriverAnalysisMode,
} from '@/data/mock-driver-analysis';
import styles from './DriverAnalysisWidget.module.css';

interface DriverAnalysisWidgetProps {
  /** Metric shown in the driver table — relative weight by default. */
  metric?: DriverAnalysisMetric;
  showInsight?: boolean;
  showQuadrantLabels?: boolean;
  hideNonSignificant?: boolean;
  mode?: DriverAnalysisMode;
  onModeChange?: (mode: DriverAnalysisMode) => void;
  showModeToggle?: boolean;
  /** When set, only these selected driver-question items are shown. */
  selectedDrivers?: Array<{ id: string; name: string }>;
}

export function DriverAnalysisWidget({
  metric = 'relative-weight',
  showInsight = false,
  showQuadrantLabels = true,
  hideNonSignificant = false,
  mode: controlledMode,
  onModeChange,
  showModeToggle = true,
  selectedDrivers,
}: DriverAnalysisWidgetProps) {
  const [uncontrolledMode, setUncontrolledMode] = useState<DriverAnalysisMode>('diagnose');
  const mode = controlledMode ?? uncontrolledMode;
  const setMode = onModeChange ?? setUncontrolledMode;
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [deltaById, setDeltaById] = useState<Record<string, number>>({});

  const drivers = useMemo(() => {
    const source =
      selectedDrivers && selectedDrivers.length > 0
        ? buildDriversFromSelections(selectedDrivers)
        : DRIVER_ANALYSIS_DRIVERS;
    return hideNonSignificant ? source.filter((driver) => driver.sig) : source;
  }, [hideNonSignificant, selectedDrivers]);

  const methodNote =
    selectedDrivers && selectedDrivers.length > 0
      ? driverAnalysisMethodNote(drivers.length)
      : DRIVER_ANALYSIS_METHOD_NOTE;

  const adjusted = drivers.filter((driver) => (deltaById[driver.id] ?? 0) !== 0);
  const lift = drivers.reduce(
    (sum, driver) => sum + driverContribution(driver, deltaById[driver.id] ?? 0),
    0
  );
  const predictedNps = DRIVER_BASELINE_NPS + lift;
  const liftClass = lift > 0 ? styles.liftUp : lift < 0 ? styles.liftDown : styles.liftFlat;

  const topOpportunity = findTopOpportunity(drivers);
  const topOpportunityGain = topOpportunity ? driverContribution(topOpportunity, 0.5) : 0;

  const strongestMove = [...adjusted].sort(
    (a, b) =>
      Math.abs(driverContribution(b, deltaById[b.id] ?? 0)) -
      Math.abs(driverContribution(a, deltaById[a.id] ?? 0))
  )[0];

  const insightText =
    mode === 'predict'
      ? adjusted.length === 0
        ? DRIVER_ANALYSIS_PREDICT_EMPTY_INSIGHT
        : `This scenario is predicted to take NPS from ${DRIVER_BASELINE_NPS.toFixed(1)} to ${predictedNps.toFixed(1)} (${formatDriverSigned(lift)} pts), driven mostly by ${strongestMove?.name.toLowerCase()}.`
      : DRIVER_ANALYSIS_DIAGNOSE_INSIGHT;

  const metricHeader = metric === 'correlation' ? 'r' : 'Impact';
  const baselinePercent = driverNpsAxisPercent(DRIVER_BASELINE_NPS);
  const predictedPercent = driverNpsAxisPercent(predictedNps);
  const barLeft = Math.min(baselinePercent, predictedPercent);
  const barWidth = Math.abs(predictedPercent - baselinePercent);

  return (
    <div className={styles.widget}>
      {showModeToggle ? (
      <div className={styles.modeRow}>
        <div className={styles.modeToggle} role="tablist" aria-label="Driver analysis mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'diagnose'}
            className={`${styles.modeBtn} ${mode === 'diagnose' ? styles.modeBtnActive : ''}`}
            onClick={() => setMode('diagnose')}
          >
            Diagnose
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'predict'}
            className={`${styles.modeBtn} ${mode === 'predict' ? styles.modeBtnActive : ''}`}
            onClick={() => setMode('predict')}
          >
            Predict
          </button>
        </div>
      </div>
      ) : null}

      {showInsight ? (
        <div className={styles.insight}>
          <span className={`wm-insights ${styles.insightIcon}`} aria-hidden />
          <p className={styles.insightText}>{insightText}</p>
        </div>
      ) : null}

      {mode === 'diagnose' ? (
        <div className={styles.panels}>
          <div className={styles.quadrantPane}>
            <div className={styles.plotRow}>
              <div className={styles.yAxis}>
                {DRIVER_IMPACT_TICKS.map((tick) => (
                  <span key={tick}>{tick}</span>
                ))}
              </div>
              <div className={styles.plotColumn}>
                <div className={styles.plot}>
                  <div
                    className={styles.splitHorizontal}
                    style={{ top: `${driverImpactTopPercent(DRIVER_IMPACT_SPLIT)}%` }}
                  />
                  <div
                    className={styles.splitVertical}
                    style={{ left: `${driverPerfLeftPercent(DRIVER_PERF_SPLIT)}%` }}
                  />
                  {showQuadrantLabels ? (
                    <>
                      <span className={`${styles.quadrantLabel} ${styles.quadrantTopLeft}`}>
                        Improve now
                      </span>
                      <span className={`${styles.quadrantLabel} ${styles.quadrantTopRight}`}>
                        Maintain strength
                      </span>
                      <span className={`${styles.quadrantLabel} ${styles.quadrantBottomLeft}`}>
                        Monitor
                      </span>
                      <span className={`${styles.quadrantLabel} ${styles.quadrantBottomRight}`}>
                        Low priority
                      </span>
                    </>
                  ) : null}
                  {drivers.map((driver) => {
                    const active = hoveredId === driver.id;
                    const dimmed = hoveredId !== null && !active;
                    const size = Math.round(9 + driver.corr * 16);
                    return (
                      <div
                        key={driver.id}
                        className={styles.dot}
                        style={{
                          left: `${driverPerfLeftPercent(driver.perf)}%`,
                          top: `${driverImpactTopPercent(driver.impact)}%`,
                        }}
                        onMouseEnter={() => setHoveredId(driver.id)}
                        onMouseLeave={() => setHoveredId(null)}
                      >
                        <span
                          className={styles.bubble}
                          style={{
                            width: `${size}px`,
                            height: `${size}px`,
                            background: driverColor(driver),
                            boxShadow: active ? '0 0 0 4px rgb(27 135 230 / 25%)' : 'none',
                            opacity: dimmed ? 0.35 : 0.9,
                          }}
                        />
                        <span
                          className={styles.dotLabel}
                          style={{ opacity: dimmed ? 0.25 : 1 }}
                        >
                          {driver.short}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className={styles.xAxis}>
                  {DRIVER_PERF_TICKS.map((tick) => (
                    <span key={tick}>{tick}</span>
                  ))}
                </div>
                <div className={styles.axisTitle}>Performance — mean rating (1–5)</div>
              </div>
            </div>
            <div className={styles.legend}>
              <span className={styles.legendItem}>
                <span
                  className={styles.legendSwatch}
                  style={{ background: DRIVER_COLOR_HIGH_IMPACT }}
                />
                High impact
              </span>
              <span className={styles.legendItem}>
                <span
                  className={styles.legendSwatch}
                  style={{ background: DRIVER_COLOR_STRENGTH }}
                />
                Strength
              </span>
              <span className={styles.legendItem}>
                <span
                  className={styles.legendSwatch}
                  style={{ background: DRIVER_COLOR_SECONDARY }}
                />
                Secondary
              </span>
              <span className={styles.legendNote}>Bubble size = correlation</span>
            </div>
          </div>

          <div className={styles.tablePane}>
            <div className={`${styles.driverRow} ${styles.driverHead}`}>
              <span>Driver</span>
              <span className={styles.alignRight}>{metricHeader}</span>
              <span className={styles.alignRight}>r</span>
              <span />
            </div>
            <div className={styles.tableScroll}>
              {drivers.map((driver) => (
                <div
                  key={driver.id}
                  className={`${styles.driverRow} ${
                    hoveredId === driver.id ? styles.driverRowActive : ''
                  }`}
                  onMouseEnter={() => setHoveredId(driver.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <span className={styles.driverName}>
                    <span
                      className={styles.driverDot}
                      style={{ background: driverColor(driver) }}
                    />
                    <span className={styles.driverNameText}>{driver.name}</span>
                  </span>
                  <span className={styles.driverMetric}>
                    {metric === 'correlation'
                      ? driver.corr.toFixed(2)
                      : `${driver.impact.toFixed(1)}%`}
                  </span>
                  <span className={styles.driverCorr}>{driver.corr.toFixed(2)}</span>
                  <span
                    className={driver.sig ? styles.sigYes : styles.sigNo}
                    title={driver.sig ? 'Significant at p < 0.05' : 'Not significant'}
                  >
                    {driver.sig ? '✓' : '–'}
                  </span>
                </div>
              ))}
            </div>
            <div className={styles.note}>{methodNote}</div>
          </div>
        </div>
      ) : (
        <div className={styles.panels}>
          <div className={styles.predictPane}>
            <div className={styles.predictCard}>
              <span className={styles.predictLabel}>Predicted NPS</span>
              <div className={styles.predictValueRow}>
                <span className={styles.predictValue}>{predictedNps.toFixed(1)}</span>
                <span className={`${styles.predictLift} ${liftClass}`}>
                  {lift === 0 ? 'no change' : `${formatDriverSigned(lift)} pts`}
                </span>
              </div>
              <span className={styles.predictMeta}>
                from a baseline of {DRIVER_BASELINE_NPS.toFixed(1)} ·{' '}
                {adjusted.length === 0
                  ? 'move a driver to model the impact'
                  : `${adjusted.length} driver${adjusted.length > 1 ? 's' : ''} adjusted`}
              </span>
            </div>

            <div className={styles.npsScale}>
              <div className={styles.npsTicks}>
                {DRIVER_NPS_TICKS.map((tick) => (
                  <span key={tick}>{tick}</span>
                ))}
              </div>
              <div className={styles.npsTrack}>
                <div className={styles.npsZero} />
                <div className={styles.npsBaseMarker} style={{ left: `${baselinePercent}%` }} />
                <div
                  className={`${styles.npsBar} ${liftClass}`}
                  style={{ left: `${barLeft}%`, width: `${barWidth}%` }}
                />
                <div
                  className={styles.npsPredMarker}
                  style={{ left: `${predictedPercent}%` }}
                />
              </div>
              <div className={styles.npsLegend}>
                <span className={styles.legendItem}>
                  <span className={styles.legendLine} />
                  Today
                </span>
                <span className={styles.legendItem}>
                  <span className={`${styles.legendLine} ${styles.legendLinePred}`} />
                  Predicted
                </span>
              </div>
            </div>

            <div className={styles.recommendation}>
              <span className={styles.predictLabel}>Best next move</span>
              <p className={styles.recommendationText}>
                {topOpportunity
                  ? `Raising ${topOpportunity.name.toLowerCase()} by half a point (${topOpportunity.perf.toFixed(1)} → ${(topOpportunity.perf + 0.5).toFixed(1)}) is predicted to move NPS ${formatDriverSigned(topOpportunityGain)} points — more than any other single half-point gain in the model.`
                  : 'All modelled drivers already perform above the benchmark line.'}
              </p>
            </div>

            <button
              type="button"
              className={styles.resetBtn}
              onClick={() => setDeltaById({})}
            >
              <span className="wm-restart-alt" aria-hidden />
              Reset scenario
            </button>
          </div>

          <div className={styles.simPane}>
            <div className={`${styles.simRow} ${styles.simHead}`}>
              <span>Driver</span>
              <span>Shift score</span>
              <span className={styles.alignRight}>NPS</span>
            </div>
            <div className={styles.tableScroll}>
              {drivers.map((driver) => {
                const delta = deltaById[driver.id] ?? 0;
                const contribution = driverContribution(driver, delta);
                return (
                  <div key={driver.id} className={styles.simRow}>
                    <span className={styles.driverName}>
                      <span
                        className={styles.driverDot}
                        style={{ background: driverColor(driver) }}
                      />
                      <span className={styles.driverNameText}>{driver.name}</span>
                    </span>
                    <span className={styles.simSlider}>
                      <input
                        type="range"
                        min={-1}
                        max={1}
                        step={0.1}
                        value={delta}
                        aria-label={`Shift ${driver.name} mean score`}
                        onChange={(event) =>
                          setDeltaById((current) => ({
                            ...current,
                            [driver.id]: Number(event.target.value),
                          }))
                        }
                      />
                      <span className={styles.simDelta}>
                        {delta === 0 ? '0.0' : formatDriverSigned(delta)}
                      </span>
                    </span>
                    <span
                      className={`${styles.simContrib} ${
                        contribution > 0
                          ? styles.liftUp
                          : contribution < 0
                            ? styles.liftDown
                            : styles.liftFlat
                      }`}
                    >
                      {contribution === 0 ? '—' : formatDriverSigned(contribution)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className={styles.note}>{DRIVER_ANALYSIS_PREDICT_NOTE}</div>
          </div>
        </div>
      )}
    </div>
  );
}
