export type TurfAnalysisTabId =
  | 'topdown'
  | 'unduplicated'
  | 'simulator'
  | 'price'
  | 'line';

export interface TurfAnalysisTab {
  id: TurfAnalysisTabId;
  label: string;
}

export const TURF_ANALYSIS_TABS: TurfAnalysisTab[] = [
  { id: 'topdown', label: 'Top/Down Reach' },
  { id: 'unduplicated', label: 'Unduplicated Reach' },
  { id: 'simulator', label: 'Simulator' },
  { id: 'price', label: 'Price Modeling' },
  { id: 'line', label: 'Line Optimization' },
];

export const TURF_SIMULATION_COUNT_OPTIONS = ['1', '2', '3', '4', '5', '10'] as const;

/** Answer options used for Weight/Cost inputs in Price Modeling. */
export const TURF_PRICE_COST_OPTIONS = [
  'Albania',
  'Andorra',
  'Armenia',
  'Austria',
  'Azerbaijan',
  'Belarus',
  'Belgium',
  'Bosnia and Herzegovina',
  'Bulgaria',
  'Croatia',
  'Cyprus',
  'Czechia',
  'Denmark',
  'Estonia',
  'Finland',
  'France',
  'Georgia',
  'Germany',
  'Greece',
  'Hungary',
  'Iceland',
  'Ireland',
  'Italy',
  'Kazakhstan',
  'Kosovo',
  'Latvia',
  'Liechtenstein',
  'Lithuania',
  'Luxembourg',
  'Malta',
  'Moldova',
  'Monaco',
  'Montenegro',
  'Netherlands',
  'North Macedonia',
  'Norway',
  'Poland',
  'Portugal',
  'Romania',
  'Russia',
  'San Marino',
  'Serbia',
  'Slovakia',
  'Slovenia',
  'Spain',
  'Sweden',
  'Switzerland',
  'Turkey',
  'Ukraine',
  'United Kingdom',
  'Vatican City',
] as const;

export type TurfPriceCostOption = (typeof TURF_PRICE_COST_OPTIONS)[number];

/** Default per-answer costs. Albania is intentionally negative to show validation styling. */
export const TURF_DEFAULT_COSTS: Record<string, string> = {
  Albania: '-1',
};

export function getTurfCostValue(
  costs: Record<string, string>,
  option: string
): string {
  if (option in costs) return costs[option];
  return TURF_DEFAULT_COSTS[option] ?? '0';
}
