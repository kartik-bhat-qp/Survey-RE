/**
 * NPS driver analysis widget data — airline service study.
 *
 * `impact` is the Shapley relative weight (% of explained variance), `perf` the
 * mean rating on a 1–5 scale, `corr` the Pearson correlation with the primary
 * NPS question, and `sig` whether the driver is significant at p < 0.05.
 */
export interface DriverAnalysisDriver {
  id: string;
  name: string;
  /** Short label used beside the quadrant bubbles. */
  short: string;
  impact: number;
  perf: number;
  corr: number;
  sig: boolean;
}

export const DRIVER_ANALYSIS_DRIVERS: DriverAnalysisDriver[] = [
  { id: 'd1', name: 'On-time performance', short: 'On-time', impact: 21.4, perf: 3.1, corr: 0.62, sig: true },
  { id: 'd2', name: 'Cabin crew service', short: 'Crew', impact: 18.2, perf: 4.2, corr: 0.57, sig: true },
  { id: 'd3', name: 'Check-in & boarding', short: 'Boarding', impact: 13.6, perf: 3.4, corr: 0.48, sig: true },
  { id: 'd4', name: 'Seat comfort', short: 'Seat', impact: 12.1, perf: 2.9, corr: 0.44, sig: true },
  { id: 'd5', name: 'Baggage handling', short: 'Baggage', impact: 9.4, perf: 3.6, corr: 0.37, sig: true },
  { id: 'd6', name: 'Fare fairness', short: 'Fare', impact: 8.3, perf: 2.7, corr: 0.34, sig: true },
  { id: 'd7', name: 'Booking & app experience', short: 'App', impact: 6.7, perf: 4.0, corr: 0.29, sig: true },
  { id: 'd8', name: 'In-flight entertainment', short: 'IFE', impact: 4.8, perf: 3.8, corr: 0.21, sig: false },
  { id: 'd9', name: 'Food & beverage', short: 'Food', impact: 3.6, perf: 3.0, corr: 0.17, sig: false },
  { id: 'd10', name: 'Loyalty program value', short: 'Loyalty', impact: 1.9, perf: 3.3, corr: 0.09, sig: false },
];

export const DRIVER_PERF_MIN = 2.4;
export const DRIVER_PERF_MAX = 4.6;
export const DRIVER_IMPACT_MAX = 24;

/** Quadrant split lines. */
export const DRIVER_IMPACT_SPLIT = 10;
export const DRIVER_PERF_SPLIT = 3.45;

export const DRIVER_BASELINE_NPS = -3.9;
/** NPS points gained if a driver rose a full scale point at 100% relative weight. */
export const DRIVER_NPS_PER_POINT = 55;
/** Scale ceiling used to cap headroom on positive shifts. */
export const DRIVER_SCALE_CEILING = 5;

/** Predicted-NPS bar spans -20 → +20. */
export const DRIVER_NPS_AXIS_MIN = -20;
export const DRIVER_NPS_AXIS_MAX = 20;

export const DRIVER_COLOR_HIGH_IMPACT = '#234693';
export const DRIVER_COLOR_STRENGTH = '#4a9d9f';
export const DRIVER_COLOR_SECONDARY = '#b6c0cd';

export const DRIVER_IMPACT_TICKS = ['24%', '16%', '8%', '0%'];
export const DRIVER_PERF_TICKS = ['2.4', '3.0', '3.5', '4.0', '4.6'];
export const DRIVER_NPS_TICKS = ['-20', '0', '+20'];

export type DriverAnalysisMetric = 'relative-weight' | 'correlation';
export type DriverAnalysisMode = 'diagnose' | 'predict';

export const DRIVER_ANALYSIS_WIDGET_TITLE = 'NPS driver analysis';

export const DRIVER_ANALYSIS_METHOD_NOTE =
  'Primary: Q4 NPS · 10 drivers · Shapley relative weights on 2,634 complete responses. ✓ = significant at p < 0.05.';

/** Compact subject used in the widget title, derived from the primary question. */
export function primaryQuestionSubject(text: string): string {
  const raw = text.replace(/\?+$/, '').trim();
  if (/\brecommend\b/i.test(raw)) return 'NPS';
  if (/overall satisfaction/i.test(raw)) return 'Overall satisfaction';
  if (/\bsatisfaction\b/i.test(raw)) return 'Satisfaction';

  let subject = raw
    .replace(/^(please |kindly )/i, '')
    .replace(
      /^(what is your |what's your |what is the |what is |how would you rate |how do you rate |how satisfied are you with |how often do you |how likely are you to |rate |please rate )/i,
      ''
    )
    .replace(/^(use |the |this |your )/i, '')
    .trim();
  if (!subject) subject = raw;
  subject = subject.charAt(0).toUpperCase() + subject.slice(1);
  if (subject.length > 42) return `${subject.slice(0, 40).trimEnd()}…`;
  return subject;
}

export function driverAnalysisWidgetTitle(primary: {
  text: string;
  type?: string;
}): string {
  if (primary.type === 'NPS' || /\brecommend\b/i.test(primary.text)) {
    return DRIVER_ANALYSIS_WIDGET_TITLE;
  }
  return `${primaryQuestionSubject(primary.text)} driver analysis`;
}

export function driverAnalysisMethodNote(driverCount: number): string {
  return `${driverCount} driver${driverCount === 1 ? '' : 's'} · Shapley relative weights on 2,634 complete responses. ✓ = significant at p < 0.05.`;
}

/** Build plotted drivers from wizard selections, reusing mock impact/perf/corr values. */
export function buildDriversFromSelections(
  selections: Array<{ id: string; name: string }>
): DriverAnalysisDriver[] {
  if (selections.length === 0) return DRIVER_ANALYSIS_DRIVERS;

  return selections.map((selection, index) => {
    const template = DRIVER_ANALYSIS_DRIVERS[index % DRIVER_ANALYSIS_DRIVERS.length];
    const short =
      selection.name.length > 12
        ? `${selection.name.slice(0, 10).trimEnd()}…`
        : selection.name;
    return {
      ...template,
      id: selection.id,
      name: selection.name,
      short,
    };
  });
}

export const DRIVER_ANALYSIS_PREDICT_NOTE =
  'Predicted NPS = baseline + Σ (driver shift × relative weight × 55). Headroom-capped at a 5.0 ceiling; ±2.8 pt prediction interval at 95%.';

export const DRIVER_ANALYSIS_DIAGNOSE_INSIGHT =
  'On-time performance drives the most NPS movement (21.4% of explained variance) yet scores 3.1 of 5 — the largest single opportunity. Cabin crew service is the strength to protect.';

export const DRIVER_ANALYSIS_PREDICT_EMPTY_INSIGHT =
  'Model a scenario: shift any driver’s mean score and see the predicted move in NPS before you commit budget to it.';

/** NPS points contributed by shifting a driver's mean score by `delta`. */
export function driverContribution(driver: DriverAnalysisDriver, delta: number): number {
  const headroom = Math.max(0, DRIVER_SCALE_CEILING - driver.perf);
  const applied = delta > 0 ? Math.min(delta, headroom) : delta;
  return applied * (driver.impact / 100) * DRIVER_NPS_PER_POINT;
}

export function driverColor(driver: DriverAnalysisDriver): string {
  if (driver.impact < DRIVER_IMPACT_SPLIT) return DRIVER_COLOR_SECONDARY;
  return driver.perf >= DRIVER_PERF_SPLIT ? DRIVER_COLOR_STRENGTH : DRIVER_COLOR_HIGH_IMPACT;
}

/** Signed value with a true minus sign, e.g. `+2.4` / `−2.4`. */
export function formatDriverSigned(value: number): string {
  return `${value >= 0 ? '+' : '−'}${Math.abs(value).toFixed(1)}`;
}

export function driverPerfLeftPercent(perf: number): number {
  return ((perf - DRIVER_PERF_MIN) / (DRIVER_PERF_MAX - DRIVER_PERF_MIN)) * 100;
}

export function driverImpactTopPercent(impact: number): number {
  return 100 - (impact / DRIVER_IMPACT_MAX) * 100;
}

export function driverNpsAxisPercent(value: number): number {
  const span = DRIVER_NPS_AXIS_MAX - DRIVER_NPS_AXIS_MIN;
  return Math.min(100, Math.max(0, ((value - DRIVER_NPS_AXIS_MIN) / span) * 100));
}

/** Highest-impact driver still performing below the benchmark line. */
export function findTopOpportunity(
  drivers: DriverAnalysisDriver[]
): DriverAnalysisDriver | null {
  return drivers.reduce<DriverAnalysisDriver | null>(
    (best, driver) =>
      driver.perf < DRIVER_PERF_SPLIT && (!best || driver.impact > best.impact)
        ? driver
        : best,
    null
  );
}
