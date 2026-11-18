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
  const subsetCount = 2 ** count;
  const r2 = Array<number>(subsetCount).fill(0);
  const sizes = Array<number>(subsetCount).fill(0);
  for (let mask = 1; mask < subsetCount; mask++) {
    const indices = all.filter(j => mask & (1 << j));
    const beta = solve(gram, rhs, indices);
    if (!beta) return { error: 'The selected drivers cannot be fitted reliably.' } as const;
    r2[mask] = beta.reduce((sum, b, j) => sum + b * rhs[indices[j]], 0) / products[0][0];
    sizes[mask] = indices.length;
  }
  const explained = r2[subsetCount - 1];
  const factorial = [1];
  for (let n = 1; n <= count; n++) factorial.push(n * factorial[n - 1]);
  const drivers = all.map(j => {
    let share = 0;
    for (let mask = 0; mask < subsetCount; mask++) {
      if (mask & (1 << j)) continue;
      const k = sizes[mask];
      const weight = factorial[k] * factorial[count - k - 1] / factorial[count];
      share += weight * (r2[mask | (1 << j)] - r2[mask]);
    }
    return { index: j, mean: means[j + 1], slope: slopes[j],
      importance: explained > 1e-10 ? Math.max(0, share / explained * 100) : null,
      correlation: rhs[j] / Math.sqrt(products[0][0] * gram[j][j]) };
  });
  return { baseline: means[0], explained, drivers } as const;
}
