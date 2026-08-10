export type ConjointFilterId = 'all' | 'young' | 'older' | 'hi';
export type ConjointSectionId =
  | 'overview'
  | 'importance'
  | 'profiles'
  | 'simulator'
  | 'premium'
  | 'setup';

export interface ConjointLevel {
  name: string;
  u: number;
}

export interface ConjointAttribute {
  key: string;
  name: string;
  type: 'Brand' | 'Price' | 'Feature';
  levels: ConjointLevel[];
}

export interface ConjointFilter {
  id: ConjointFilterId;
  label: string;
  n: number;
  k: Partial<Record<string, number>>;
  note: string;
}

export interface ConjointConcept {
  id: number;
  name: string;
  picks: Record<string, string>;
}

export interface ConjointReportMeta {
  id: number;
  name: string;
  questionLabel: string;
  surveyName: string;
}

export const CONJOINT_SECTION_NAV: { id: ConjointSectionId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'importance', label: 'Attribute importance' },
  { id: 'profiles', label: 'Profiles' },
  { id: 'simulator', label: 'Simulator' },
  { id: 'premium', label: 'Price elasticity' },
  { id: 'setup', label: 'Setup & base' },
];

export const CONJOINT_COLORS = [
  '#1b4f9c',
  '#3d7cc9',
  '#5a9ad4',
  '#2e8b6b',
  '#8a7fd1',
  '#c98f2a',
];

export const CONJOINT_BASE_ATTRIBUTES: ConjointAttribute[] = [
  {
    key: 'brand',
    name: 'Brand',
    type: 'Brand',
    levels: [
      { name: 'Sony', u: -0.17 },
      { name: 'LG', u: -0.41 },
      { name: 'Lenovo', u: 0.22 },
      { name: 'Samsung', u: -0.34 },
      { name: 'Apple', u: 0.86 },
      { name: 'Dell', u: 0.05 },
    ],
  },
  {
    key: 'price',
    name: 'Price',
    type: 'Price',
    levels: [
      { name: 'USD 800', u: 0.44 },
      { name: 'USD 1200', u: -0.01 },
      { name: 'USD 1500', u: 0.26 },
      { name: 'USD 2000', u: 0.01 },
      { name: 'USD 2500', u: -0.37 },
      { name: 'USD 3000', u: -0.33 },
    ],
  },
  {
    key: 'storage',
    name: 'Storage',
    type: 'Feature',
    levels: [
      { name: '1TB HDD 5400', u: 0.1 },
      { name: '512GB SSD PCIe', u: 0.08 },
      { name: '256GB SSD + 1TB HDD', u: -0.13 },
      { name: '2TB HDD 5400', u: -0.06 },
    ],
  },
  {
    key: 'graphics',
    name: 'Graphics',
    type: 'Feature',
    levels: [
      { name: 'AMD Radeon Vega 8', u: 0.03 },
      { name: 'Integrated graphics', u: -0.14 },
      { name: 'NVIDIA GTX 1650', u: 0.05 },
      { name: 'Intel UHD graphics', u: 0.05 },
    ],
  },
  {
    key: 'ram',
    name: 'RAM',
    type: 'Feature',
    levels: [
      { name: '4GB DDR4 2400MHz', u: -0.09 },
      { name: '8GB DDR4 2400MHz', u: 0 },
      { name: '8GB DDR4 2666MHz', u: -0.01 },
      { name: '16GB DDR4 2666MHz', u: 0.09 },
    ],
  },
  {
    key: 'processor',
    name: 'Processor',
    type: 'Feature',
    levels: [
      { name: 'AMD Ryzen 3 3200U', u: -0.03 },
      { name: 'AMD Ryzen 5 3500U', u: 0.1 },
      { name: 'Intel Core i5-1035G1', u: 0.01 },
      { name: 'Intel Core i3-10110U', u: -0.08 },
    ],
  },
];

export const CONJOINT_FILTERS: ConjointFilter[] = [
  { id: 'all', label: 'Entire dataset', n: 412, k: { brand: 1, price: 1 }, note: 'All completes' },
  { id: 'young', label: 'Age 18–34', n: 148, k: { brand: 1.28, price: 0.72 }, note: 'Brand-led' },
  { id: 'older', label: 'Age 35+', n: 264, k: { brand: 0.85, price: 1.22 }, note: 'Price-led' },
  {
    id: 'hi',
    label: 'HHI $100k+',
    n: 96,
    k: { brand: 1.15, price: 0.55 },
    note: 'Least price sensitive',
  },
];

export const CONJOINT_DEFAULT_CONCEPTS: ConjointConcept[] = [
  {
    id: 1,
    name: 'Lenovo challenger',
    picks: {
      brand: 'Lenovo',
      price: 'USD 1500',
      processor: 'AMD Ryzen 5 3500U',
      ram: '16GB DDR4 2666MHz',
      storage: '1TB HDD 5400',
      graphics: 'AMD Radeon Vega 8',
    },
  },
  {
    id: 2,
    name: 'Apple flagship',
    picks: {
      brand: 'Apple',
      price: 'USD 2000',
      processor: 'AMD Ryzen 5 3500U',
      ram: '8GB DDR4 2666MHz',
      storage: '1TB HDD 5400',
      graphics: 'AMD Radeon Vega 8',
    },
  },
  {
    id: 3,
    name: 'Samsung value',
    picks: {
      brand: 'Samsung',
      price: 'USD 1500',
      processor: 'Intel Core i5-1035G1',
      ram: '8GB DDR4 2666MHz',
      storage: '512GB SSD PCIe',
      graphics: 'Integrated graphics',
    },
  },
];

export const CONJOINT_PRICES = [
  'USD 800',
  'USD 1200',
  'USD 1500',
  'USD 2000',
  'USD 2500',
  'USD 3000',
];

export const CONJOINT_ELASTICITY_SERIES = [
  { name: 'Apple', color: '#1b4f9c', values: [16, 19, 17, 17, 13, 14] },
  { name: 'Lenovo', color: '#3d7cc9', values: [13, 10, 13, 12, 8, 10] },
  { name: 'Dell', color: '#5a9ad4', values: [16, 7, 11, 6, 8, 9] },
  { name: 'Sony', color: '#2e8b6b', values: [13, 7, 9, 4, 8, 5] },
  { name: 'LG', color: '#8a7fd1', values: [13, 7, 8, 5, 8, 7] },
  { name: 'Samsung', color: '#c98f2a', values: [8, 7, 11, 10, 5, 4] },
];

export const MOCK_CONJOINT_REPORT: ConjointReportMeta = {
  id: 1001,
  name: 'Conjoint analysis',
  questionLabel: '[Q13] Which of the following laptops would you purchase?',
  surveyName: 'Laptop preference study',
};

export function getConjointFilter(filterId: ConjointFilterId): ConjointFilter {
  return CONJOINT_FILTERS.find((filter) => filter.id === filterId) ?? CONJOINT_FILTERS[0];
}

export function getScaledModel(filterId: ConjointFilterId): Array<
  ConjointAttribute & { range: number }
> {
  const filter = getConjointFilter(filterId);
  return CONJOINT_BASE_ATTRIBUTES.map((attribute) => {
    const multiplier = filter.k[attribute.key] ?? 1;
    const levels = attribute.levels.map((level) => ({
      name: level.name,
      u: Math.round(level.u * multiplier * 100) / 100,
    }));
    const values = levels.map((level) => level.u);
    return {
      ...attribute,
      levels,
      range: Math.max(...values) - Math.min(...values),
    };
  });
}

export function formatUtility(u: number): string {
  if (u > 0) return `+${u.toFixed(2)}`;
  if (u < 0) return `−${Math.abs(u).toFixed(2)}`;
  return '0.00';
}

export function utilityForPicks(
  picks: Record<string, string>,
  model: ReturnType<typeof getScaledModel>
): number {
  return model.reduce((sum, attribute) => {
    const level = attribute.levels.find((item) => item.name === picks[attribute.key]);
    return sum + (level?.u ?? 0);
  }, 0);
}

export function conceptShares(
  concepts: ConjointConcept[],
  model: ReturnType<typeof getScaledModel>,
  scale = 0.35
): { utilities: number[]; shares: number[] } {
  const utilities = concepts.map((concept) => utilityForPicks(concept.picks, model));
  const exps = utilities.map((utility) => Math.exp(utility / scale));
  const total = exps.reduce((sum, value) => sum + value, 0) || 1;
  return {
    utilities,
    shares: exps.map((value) => (value / total) * 100),
  };
}

export function bestPicksForModel(
  model: ReturnType<typeof getScaledModel>
): Record<string, string> {
  return model.reduce<Record<string, string>>((picks, attribute) => {
    const best = [...attribute.levels].sort((a, b) => b.u - a.u)[0];
    picks[attribute.key] = best.name;
    return picks;
  }, {});
}

export function rankedProfiles(
  model: ReturnType<typeof getScaledModel>,
  brandFilter: string,
  limit = 25
): Array<Record<string, string | number>> {
  const combos: Array<{ picks: Record<string, string>; u: number }> = [];

  function walk(index: number, picks: Record<string, string>, utility: number): void {
    if (index === model.length) {
      combos.push({ picks: { ...picks }, u: utility });
      return;
    }
    const attribute = model[index];
    for (const level of attribute.levels) {
      picks[attribute.key] = level.name;
      walk(index + 1, picks, utility + level.u);
    }
  }

  walk(0, {}, 0);
  const filtered =
    brandFilter === 'all'
      ? combos
      : combos.filter((combo) => combo.picks.brand === brandFilter);
  filtered.sort((a, b) => b.u - a.u);
  const top = filtered.slice(0, limit);
  return top.map((combo, index) => ({
    rank: index + 1,
    brand: combo.picks.brand,
    price: combo.picks.price,
    processor: combo.picks.processor,
    ram: combo.picks.ram,
    storage: combo.picks.storage,
    graphics: combo.picks.graphics,
    total: combo.u.toFixed(2),
  }));
}

export function getConjointInsights(
  topDriverName: string,
  topDriverPct: number,
  pricePct: number
): Array<{ title: string; body: string; accent: string }> {
  return [
    {
      title: `${topDriverName} outweighs every spec combined`,
      body: `${topDriverName} accounts for ${topDriverPct}% of choice — more than storage, graphics, RAM, and processor together.`,
      accent: '#1b87e6',
    },
    {
      title: 'Price response is not linear',
      body: `Price is ${pricePct}% of the decision. Preference rises through the mid range, then drops sharply past USD 2000.`,
      accent: '#2e8b6b',
    },
    {
      title: 'Specs matter as a package',
      body: 'No single feature dominates. Small part-worth gains stack — RAM and processor only move share when paired with a preferred brand.',
      accent: '#c98f2a',
    },
  ];
}
