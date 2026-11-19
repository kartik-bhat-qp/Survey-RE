/** Least squares on centered cross-products. A singular subset has no unique slope vector. */
function solve(gram: number[][], rhs: number[], indices: number[]): number[] | null {
  const a = indices.map(i => [...indices.map(j => gram[i][j]), rhs[i]]);
  for (let col = 0; col < a.length; col++) {
    let pivot = col;
    for (let row = col + 1; row < a.length; row++)
      if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
    if (Math.abs(a[pivot][col]) < 1e-10) return null;
    [a[pivot], a[col]] = [a[col], a[pivot]];
    const divisor = a[col][col];
    for (let j = col; j <= a.length; j++) a[col][j] /= divisor;
    for (let i = 0; i < a.length; i++) {
      if (i === col) continue;
      const multiplier = a[i][col];
      for (let j = col; j <= a.length; j++) a[i][j] -= multiplier * a[col][j];
    }
  }
  return a.map(row => row[a.length]);
}

/** Separate linear model used only for KPI-unit what-if estimates. */
export function fitDriverModel(rows: number[][], count: number) {
  if (!count || count > 10) return { error: 'Select between one and ten drivers for this analysis.' } as const;
  if (rows.length <= count + 1) return { error: 'Too few complete responses to fit this model.' } as const;
  const means = Array.from({ length: count + 1 }, (_, j) => rows.reduce((sum, row) => sum + row[j], 0) / rows.length);
  const products = means.map((m, i) => means.map((n, j) => rows.reduce((sum, row) => sum + (row[i] - m) * (row[j] - n), 0)));
  if (products.some((row, i) => row[i] < 1e-10)) return { error: 'At least one selected measure is constant. Change the scoring or the questions.' } as const;
  const gram = products.slice(1).map(row => row.slice(1));
  const rhs = products[0].slice(1);
  const all = rhs.map((_, i) => i);
  const slopes = solve(gram, rhs, all);
  if (!slopes) return { error: 'These drivers overlap exactly. Remove a redundant driver.' } as const;
  const explained = Math.max(0, Math.min(1, slopes.reduce((sum, beta, j) => sum + beta * rhs[j], 0) / products[0][0]));
  const drivers = all.map(j => ({ index: j, mean: means[j + 1], slope: slopes[j] }));
  return { baseline: means[0], explained, drivers } as const;
}

/** Combine bounded driver shifts without changing the fitted model or observed baseline. */
export function predictDriverScenario(
  model: { baseline: number; drivers: { index: number; mean: number; slope: number }[] },
  shifts: Readonly<Record<number, number>>,
  ranges: readonly (readonly [number, number])[],
) {
  const drivers = model.drivers.map(driver => {
    const [min, max] = ranges[driver.index];
    const requested = shifts[driver.index] ?? 0;
    const target = Math.max(min, Math.min(max, driver.mean + (Number.isFinite(requested) ? requested : 0)));
    const shift = target - driver.mean;
    return { ...driver, target, shift, contribution: driver.slope * shift };
  });
  const change = drivers.reduce((sum, driver) => sum + driver.contribution, 0);
  return { drivers, change, estimate: model.baseline + change };
}

/** Average ranks for tied values; ranks are one-based. */
export function averageRanks(values: number[]): number[] {
  const order = values.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value);
  const ranks = Array<number>(values.length);
  for (let start = 0; start < order.length;) {
    let end = start + 1;
    while (end < order.length && order[end].value === order[start].value) end++;
    const rank = (start + 1 + end) / 2;
    for (let j = start; j < end; j++) ranks[order[j].index] = rank;
    start = end;
  }
  return ranks;
}

/** Spearman rho is Pearson correlation of average ranks, including tied responses. */
export function spearmanCorrelation(x: number[], y: number[]): number | null {
  if (x.length !== y.length || x.length < 2 || [...x, ...y].some(value => !Number.isFinite(value))) return null;
  const rx = averageRanks(x), ry = averageRanks(y);
  const mean = (x.length + 1) / 2;
  let covariance = 0, xx = 0, yy = 0;
  for (let i = 0; i < x.length; i++) {
    const dx = rx[i] - mean, dy = ry[i] - mean;
    covariance += dx * dy; xx += dx * dx; yy += dy * dy;
  }
  if (!xx || !yy) return null;
  return Math.max(-1, Math.min(1, covariance / Math.sqrt(xx * yy)));
}

/** Diagnose uses pairwise rank associations on one shared complete-case cohort. */
export function analyzeSpearmanDrivers(rows: number[][], count: number) {
  if (!count || count > 10) return { error: 'Select between one and ten drivers for this analysis.' } as const;
  if (rows.length < 2) return { error: 'Too few complete responses to calculate Spearman correlation.' } as const;
  if (rows.some(row => row.length !== count + 1 || row.some(value => !Number.isFinite(value))))
    return { error: 'Analysis requires a valid numeric outcome and every selected driver.' } as const;
  const outcomes = rows.map(row => row[0]);
  if (new Set(outcomes).size < 2) return { error: 'The primary outcome is constant. Spearman correlation is unavailable.' } as const;
  return {
    baseline: outcomes.reduce((sum, value) => sum + value, 0) / rows.length,
    drivers: Array.from({ length: count }, (_, index) => {
      const values = rows.map(row => row[index + 1]);
      const correlation = spearmanCorrelation(outcomes, values);
      return { index, mean: values.reduce((sum, value) => sum + value, 0) / rows.length,
        correlation, importance: correlation === null ? null : Math.abs(correlation) };
    }),
  } as const;
}
