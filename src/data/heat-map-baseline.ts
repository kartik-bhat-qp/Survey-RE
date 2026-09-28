import type { DashboardDesign } from './dashboard-design';
import type { DashboardActiveFilter } from './mock-dashboard-filters';
/** Current production UI baseline, not the future DP World metric specification.
 * Snapshot values are from the dated production audit. Calculations outside those
 * snapshots are explicit local simulations; see docs/heat-map-baseline/PARITY.md.
 */
export type HeatMapRange = 'Default' | '0–5' | '0–10';
export interface HeatMapQuestion {
  id: string; code: string; title: string; type: string; max: number;
  overall: number | null; sourceDisclosure?: boolean; normalizedScaleVerified?: boolean; renderedTitle?: string; nativeColumns?: number[]; range10Columns?: number[]; responseBases?: number[]; showBase?: boolean; segmentScores?: Record<number, number | null>; segmentCounts?: Record<number, number>; children?: { id: string; title: string; overall: number | null }[];
}
export interface HeatMapSegment {
  id: string; name: string; answer: number; count: number; answers?: number[];
  responseStatus: string; from: string; to: string;
  criteria: { option: string; field: string; operator: string; value: string; block: number }[];
}
export interface HeatMapSettings {
  source: 'single' | 'matrix' | 'mixed';
  name: string; showName: boolean; highlightedInsight: boolean;
  filterType: 'Dashboard' | 'Widget' | 'Combined' | 'None'; precision: number;
  overallColumn: boolean; responseCount: boolean; overallAverage: boolean;
  range: HeatMapRange; reversed: string[]; bands: number; thresholds: number[];
  widgetStats: boolean; statsResponseCount: boolean; statsLabel: string;
  weighting: 'Dashboard' | 'Widget' | 'None'; weightingScheme: string; widgetFilter?: HeatMapSegment;
  questions: string[]; segments: string[];
  designType: 'Dashboard' | 'Widget'; sentiment: 'Default' | 'Custom';
  themeColor: string; colors: string[]; fontSize: string; fontFamily: string;
}
export const heatMapWidgetStorageKey = (dashboardId: number | string, tabId: string, widgetId: string) => `survey-re:dashboard:${dashboardId}:tab:${tabId}:heat-map:${widgetId}:v1`;
export const BASELINE_STORAGE_KEY = 'survey-re:heat-map-production-baseline:v1';
export const SENTIMENT_COLORS = ['#f85271', '#f69a79', '#f1da7e', '#94d08b', '#42bd84'];
export const HEAT_MAP_QUESTIONS: HeatMapQuestion[] = [
  { id: 'single', code: 'Q5', title: 'Select One | ordinal same 5-point scale', type: 'Single Select', max: 5, overall: 2.93 },
  { id: 'qa-matrix', code: 'Q1', title: 'M01 | Matrix single-choice | BASELINE compatible scale | 3 rows x 5 options', type: 'Matrix Uni choice', max: 5, overall: (2.93 + 2.91 + 3.03) / 3, children: [{ id: 'qa-ease', title: 'Ease', overall: 2.93 }, { id: 'qa-speed', title: 'Speed', overall: 2.91 }, { id: 'qa-reliability', title: 'Reliability', overall: 3.03 }] },
  { id: 'qa-nominal', code: 'Q6', title: 'Select One | nominal codes are not scores', type: 'Single Select', max: 4, overall: 2.5 },
  { id: 'qa-multi', code: 'Q7', title: 'Select Many | overlapping selections', type: 'Multiple Select', max: 5, overall: 3.02 },
  { id: 'qa-dropdown', code: 'Q8', title: 'Drop-down Menu | nominal segment', type: 'Single Select', max: 4, overall: 2.5 },
  { id: 'matrix1', code: 'Q1', title: 'Q1 — Row-wise CSAT by journey touchpoint', type: 'Matrix Uni choice', max: 5, overall: 4,
    children: [{ id: 'purchase', title: 'Purchase experience', overall: 5 }, { id: 'quality', title: 'Product quality', overall: 4 }, { id: 'support', title: 'Support interaction', overall: 4 }, { id: 'value', title: 'Value for money', overall: 4 }] },
  { id: 'matrix2', code: 'Q2', title: 'Q2 — Combined CSAT across support dimensions', type: 'Matrix Uni choice', max: 5, overall: 4,
    children: [{ id: 'resolution', title: 'Resolution quality', overall: 4 }, { id: 'knowledge', title: 'Agent knowledge', overall: 4 }, { id: 'speed', title: 'Speed of response', overall: 4 }] },
  { id: 'matrix3', code: 'Q3', title: 'Q3 — Combined-multiple CSAT across product dimensions', type: 'Matrix Uni choice', max: 5, overall: 4,
    children: [{ id: 'ease', title: 'Ease of use', overall: 4 }, { id: 'reliability', title: 'Reliability', overall: 4 }, { id: 'features', title: 'Feature completeness', overall: 4 }] },
  { id: 'channel', code: 'Q4', title: 'Q4 — Primary interaction channel', type: 'Single Select', max: 5, overall: 3 },
];
// Eligible source rows observed in the production Edit picker. Null is unverified, not zero.
export const HEAT_MAP_SOURCE_EXTRAS: HeatMapQuestion[] = [
  { id: 'qa-m02', code: 'Q2', title: 'M02 | Matrix single-choice | MORE ROWS same scale | 6 rows x 5 options', type: 'Matrix Uni choice', max: 5, overall: null, sourceDisclosure: true },
  { id: 'qa-m03', code: 'Q3', title: 'M03 | Matrix single-choice | MORE OPTIONS different scale | 3 rows x 7 options', type: 'Matrix Uni choice', max: 7, overall: null, sourceDisclosure: true },
  { id: 'qa-m04', code: 'Q4', title: 'M04 | Matrix multi-select | MULTIPLE ANSWERS compatibility probe | 3 rows x 5 options', type: 'Matrix Uni choice', max: 5, overall: null, sourceDisclosure: true },
  { id: 'qa-nps', code: 'Q9', title: 'Net Promoter Score | native 0-10 classification', type: 'Net Promoter Score', max: 10, overall: null },
  { id: 'qa-star', code: 'Q13', title: 'Star Rating | 5-point score', type: 'Matrix Uni choice', max: 5, overall: null, sourceDisclosure: true },
  { id: 'qa-smiley', code: 'Q14', title: 'Smiley - Rating | graphical score', type: 'Single Select', max: 5, overall: null },
  { id: 'qa-thumbs', code: 'Q15', title: 'Thumbs Up/Down | binary score', type: 'Single Select', max: 2, overall: null },
  { id: 'qa-text-slider', code: 'Q16', title: 'Text Slider | ordinal score', type: 'Matrix Uni choice', max: 5, overall: null, sourceDisclosure: true },
  { id: 'qa-rank', code: 'Q18', title: 'Rank Order | ranking not rating', type: 'Rank Order', max: 5, overall: null, sourceDisclosure: true },
  { id: 'qa-price', code: 'Q21', title: 'At what price would you consider the product to be so expensive that you would not consider ...', type: 'Van Westendorp', max: 5, overall: null },
  { id: 'qa-untitled', code: '', title: 'Untitled', type: '', max: 5, overall: null },
  { id: 'qa-contact', code: 'Q26', title: 'Contact Information | structured text exclusion probe', type: 'Text Contact Info', max: 5, overall: null },
  { id: 'qa-image-one', code: 'Q27', title: 'Image Select One | image single-choice probe', type: 'Single Select', max: 3, overall: null },
  { id: 'qa-image-many', code: 'Q28', title: 'Image Select Many | image multi-answer probe', type: 'Multiple Select', max: 3, overall: null },
  { id: 'qa-image-rating', code: 'Q29', title: 'Image Rating | graphical rating probe', type: 'Image and Video choice', max: 5, overall: null, sourceDisclosure: true },
  { id: 'qa-maps', code: 'Q32', title: 'Maps | geographic non-score probe', type: 'Single Select', max: 5, overall: null },
  { id: 'qa-multidimension', code: 'Q40', title: 'Satisfaction[Not Important,Very Important]', type: 'Multi Dimension Matrix', max: 5, overall: null },
  { id: 'qa-lookup', code: 'Q42', title: 'Lookup Table | single lookup compatibility probe', type: 'Uni choice Lookup Table', max: 5, overall: null },
  { id: 'qa-rank-alt', code: 'Q51', title: 'Rank Order | alternate ranking input compatibility probe', type: 'Rank Order', max: 5, overall: null, sourceDisclosure: true },
  { id: 'qa-drag', code: 'Q52', title: 'Drag and Drop | draggable ranking compatibility probe', type: 'Rank Order', max: 5, overall: null, sourceDisclosure: true },
  { id: 'qa-spreadsheet', code: 'Q53', title: 'Spreadsheet | native text-entry matrix | 3 rows x 2 columns', type: 'Matrix Uni choice', max: 5, overall: null, sourceDisclosure: true },
];
HEAT_MAP_QUESTIONS.push(...HEAT_MAP_SOURCE_EXTRAS);
// Recorded values retain production rounding, including normalization before/after aggregation.
const verifiedDirectRows: { code: string; max: number | null; native: number[]; range10: number[]; renderedLabel?: string; bases?: number[]; showBase?: boolean }[] = [
  {
    "code": "Q5",
    "max": 5,
    "native": [
      2.93,
      1,
      3,
      2,
      4,
      5
    ],
    "range10": [
      5.86,
      2,
      6,
      4,
      8,
      10
    ]
  },
  {
    "code": "Q6",
    "max": 4,
    "native": [
      2.5,
      2.5909,
      2.4375,
      2.4783,
      2.3889,
      2.5714
    ],
    "range10": [
      6.25,
      6.4772,
      6.0938,
      6.1958,
      5.9722,
      6.4285
    ]
  },
  {
    "code": "Q7",
    "max": 5,
    "native": [
      3.02,
      3.0455,
      2.875,
      3.0435,
      3.2778,
      2.8571
    ],
    "range10": [
      6.04,
      6.091,
      5.75,
      6.087,
      6.5556,
      5.7142
    ]
  },
  {
    "code": "Q8",
    "max": 4,
    "native": [
      2.5,
      2.5909,
      2.4375,
      2.4783,
      2.3889,
      2.5714
    ],
    "range10": [
      6.25,
      6.4772,
      6.0938,
      6.1958,
      5.9722,
      6.4285
    ]
  },
  {
    "code": "Q9",
    "max": 11,
    "native": [
      6.02,
      5.1818,
      6.0625,
      5.913,
      6.3889,
      6.6667
    ],
    "range10": [
      5.4727,
      4.7107,
      5.5114,
      5.3755,
      5.8081,
      6.0606
    ]
  },
  {
    "code": "Q14",
    "max": 5,
    "native": [
      2.94,
      3.1364,
      3.125,
      2.5652,
      3,
      2.9524
    ],
    "range10": [
      5.88,
      6.2728,
      6.25,
      5.1304,
      6,
      5.9048
    ]
  },
  {
    "code": "Q15",
    "max": 2,
    "native": [
      1.51,
      1.5455,
      1.5,
      1.4783,
      1.4444,
      1.5714
    ],
    "range10": [
      7.55,
      7.7275,
      7.5,
      7.3915,
      7.222,
      7.857
    ]
  },
  {
    "code": "Q21",
    "renderedLabel": "At what price would you consider the product to be so expensive that you would not consider buying it? (Too Expensive)",
    "max": null,
    "native": [
      0,
      0,
      0,
      0,
      0,
      0
    ],
    "range10": [
      0,
      0,
      0,
      0,
      0,
      0
    ],
    "bases": [
      0,
      0,
      0,
      0,
      0,
      0
    ]
  },
  {
    "code": "Q26",
    "renderedLabel": "Last Name",
    "max": null,
    "native": [
      0,
      0,
      0,
      0,
      0,
      0
    ],
    "range10": [
      0,
      0,
      0,
      0,
      0,
      0
    ],
    "bases": [
      0,
      0,
      0,
      0,
      0,
      0
    ]
  },
  {
    "code": "Q27",
    "max": 2,
    "native": [
      1.51,
      1.5455,
      1.4375,
      1.4783,
      1.4444,
      1.619
    ],
    "range10": [
      7.55,
      7.7275,
      7.1875,
      7.3915,
      7.222,
      8.095
    ]
  },
  {
    "code": "Q28",
    "max": 3,
    "native": [
      2.15,
      2.1818,
      2.125,
      2.1739,
      2.1111,
      2.1429
    ],
    "range10": [
      7.1667,
      7.2727,
      7.0833,
      7.2463,
      7.037,
      7.143
    ]
  },
  {
    "code": "Q32",
    "max": 51,
    "native": [
      27.94,
      32.1364,
      30.125,
      28.3478,
      26.5556,
      22.619
    ],
    "range10": [
      5.4784,
      6.3013,
      5.9069,
      5.5584,
      5.207,
      4.4351
    ]
  },
  {
    "code": "Q40",
    "renderedLabel": "Satisfaction[Not Important,Very Important]",
    "max": 5,
    "native": [
      3.06,
      2.9697,
      3.2917,
      2.9131,
      3.0926,
      3.1111
    ],
    "range10": [
      6.12,
      5.9394,
      6.5833,
      5.8261,
      6.1852,
      6.2222
    ],
    "showBase": false
  },
  {
    "code": "Q42",
    "max": 3,
    "native": [
      1.83,
      1.7273,
      1.5,
      2,
      1.9444,
      1.9048
    ],
    "range10": [
      6.1,
      5.7577,
      5,
      6.6667,
      6.4813,
      6.3493
    ]
  }
];
for (const row of verifiedDirectRows) {
  const question = HEAT_MAP_QUESTIONS.find(question => (question.id === "single" || question.id.startsWith("qa-")) && question.code === row.code);
  if (question) Object.assign(question, { overall: row.native[0], max: row.max ?? 0, renderedTitle: row.renderedLabel, nativeColumns: row.native, range10Columns: row.range10, responseBases: row.bases, showBase: row.showBase, normalizedScaleVerified: true });
}

export function heatMapSourceQuestions(source: HeatMapSettings['source']): HeatMapQuestion[] {
  if (source === 'matrix') return fixtureQuestions(source);
  return HEAT_MAP_QUESTIONS.filter(question => question.id === 'single' || question.id.startsWith('qa-')).sort((a, b) => (a.code ? Number(a.code.slice(1)) : 22) - (b.code ? Number(b.code.slice(1)) : 22));
}
// Deliberately retain observed saved order, rather than silently fixing production.
export const INITIAL_HEAT_MAP_SEGMENTS: HeatMapSegment[] = [
  [1, 'Very poor', 22], [3, 'Neutral', 16], [2, 'Poor', 23], [4, 'Good', 18], [5, 'Excellent', 21],
].map(([answer, label, count]) => ({
  id: `answer-${answer}`, name: `${answer} — ${label}`, answer: Number(answer), count: Number(count),
  responseStatus: 'All responses', from: '', to: '',
  criteria: [{ option: 'Question', field: 'single', operator: 'Is', value: String(answer), block: 1 }],
}));
export function defaultHeatMapSettings(): HeatMapSettings {
  return { source: 'single', name: 'Single-select heat map — mean score (1–5)', showName: true,
    highlightedInsight: false, filterType: 'Dashboard', precision: 0, overallColumn: false,
    responseCount: false, overallAverage: false, range: 'Default', reversed: [], bands: 5,
    thresholds: [20, 40, 60, 80], widgetStats: false, statsResponseCount: true,
    statsLabel: 'Response count', weighting: 'Dashboard', weightingScheme: '',
    questions: ['single'], segments: INITIAL_HEAT_MAP_SEGMENTS.map(s => s.id),
    designType: 'Widget', sentiment: 'Custom', themeColor: '#1b3380', colors: [...SENTIMENT_COLORS],
    fontSize: 'Medium', fontFamily: 'Fira Sans' };
}
export function matrixHeatMapSettings(): HeatMapSettings {
  return { ...defaultHeatMapSettings(), source: 'matrix', name: 'Heat Map Chart', questions: ['matrix1', 'matrix2', 'matrix3', 'channel'],
    segments: [], overallColumn: true, range: '0–5', designType: 'Dashboard', bands: 2,
    thresholds: [33.3], colors: [...SENTIMENT_COLORS] };
}
export function mixedHeatMapSettings(): HeatMapSettings {
  return { ...defaultHeatMapSettings(), source: 'mixed', name: 'Heat Map Chart', questions: ['qa-matrix', 'single', 'qa-nominal', 'qa-multi', 'qa-dropdown'], segments: [], overallColumn: true, designType: 'Dashboard', bands: 2, thresholds: [33.3] };
}
export function fixtureQuestions(source: HeatMapSettings['source']): HeatMapQuestion[] {
  const ids = source === 'matrix' ? ['matrix1', 'matrix2', 'matrix3', 'channel'] : source === 'mixed' ? ['qa-matrix', 'single', 'qa-nominal', 'qa-multi', 'qa-dropdown', ...HEAT_MAP_SOURCE_EXTRAS.map(question => question.id)] : ['single'];
  return ids.map(id => HEAT_MAP_QUESTIONS.find(q => q.id === id)!);
}
export function selectedSegments(ids: string[], segments: HeatMapSegment[]): HeatMapSegment[] {
  // Production ignores the selection click order and segment-name table sorting.
  return segments.filter(segment => ids.includes(segment.id));
}
export function equalThresholds(bands: number): number[] {
  return Array.from({ length: bands - 1 }, (_, i) => Math.round((i + 1) * 1000 / bands) / 10);
}
export function displayScore(value: number, max: number, range: HeatMapRange, reversed: boolean): number {
  // Verified for the current 1–5 fixture: 0–10 doubles the native mean;
  // reversal is (6 - native mean) before doubling. Other scales remain unverified.
  const score = reversed ? max + 1 - value : value;
  return range === 'Default' ? score : score / max * (range === '0–10' ? 10 : 5);
}
export function heatMapCellColor(value: number, max: number, settings: HeatMapSettings, count = false): string {
  const colors = settings.designType === 'Dashboard' || settings.sentiment === 'Default' ? SENTIMENT_COLORS : settings.colors;
  if (settings.source === 'mixed' && settings.designType === 'Dashboard' && settings.bands === 2) return count ? '#ff7681' : '#ffcb47';
  if (count) return colors[0]; // Observed production defect: count cells remain red.
  // Historical two-band settings rendered three sentiment colors despite two labels.
  if (settings.bands === 2 && settings.questions.includes('matrix1')) return value >= 4 ? SENTIMENT_COLORS[4] : value >= 2 ? SENTIMENT_COLORS[2] : SENTIMENT_COLORS[0];
  const percent = value / max * 100;
  const index = settings.thresholds.findIndex(boundary => percent <= boundary);
  return colors[Math.min(index < 0 ? settings.bands - 1 : index, colors.length - 1)];
}
export function normalizeHeatMapSettings(value: unknown): HeatMapSettings {
  const defaults = defaultHeatMapSettings();
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaults;
  const raw = value as Partial<HeatMapSettings>;
  const result = { ...defaults };
  if (raw.source === 'matrix' || raw.source === 'mixed') result.source = raw.source;
  for (const key of ['showName', 'highlightedInsight', 'overallColumn', 'responseCount', 'overallAverage', 'widgetStats', 'statsResponseCount'] as const) if (typeof raw[key] === 'boolean') result[key] = raw[key];
  for (const key of ['name', 'statsLabel', 'weightingScheme'] as const) if (typeof raw[key] === 'string') result[key] = raw[key].slice(0, 300);
  if (raw.filterType && ['Dashboard', 'Widget', 'Combined', 'None'].includes(raw.filterType)) result.filterType = raw.filterType;
  if (raw.weighting && ['Dashboard', 'Widget', 'None'].includes(raw.weighting)) result.weighting = raw.weighting;
  if (['Default', '0–5', '0–10'].includes(raw.range ?? '')) result.range = raw.range!;
  if (Number.isInteger(raw.precision) && raw.precision! >= 0 && raw.precision! <= 4) result.precision = raw.precision!;
  if (Number.isInteger(raw.bands) && raw.bands! >= 2 && raw.bands! <= 5) result.bands = raw.bands!;
  result.thresholds = Array.isArray(raw.thresholds) && raw.thresholds.length === result.bands - 1 && raw.thresholds.every((v, i, a) => typeof v === 'number' && Number.isFinite(v) && v > 0 && v < 100 && (!i || v > a[i - 1])) ? raw.thresholds : equalThresholds(result.bands);
  for (const key of ['questions', 'reversed'] as const) if (Array.isArray(raw[key])) result[key] = raw[key].filter(id => HEAT_MAP_QUESTIONS.some(q => q.id === id));
  if (Array.isArray(raw.segments)) result.segments = raw.segments.filter(id => typeof id === 'string');
  if (raw.designType === 'Dashboard' || raw.designType === 'Widget') result.designType = raw.designType;
  if (raw.sentiment === 'Default' || raw.sentiment === 'Custom') result.sentiment = raw.sentiment;
  if (typeof raw.themeColor === 'string' && /^#[a-f\d]{6}$/i.test(raw.themeColor)) result.themeColor = raw.themeColor;
  if (Array.isArray(raw.colors) && raw.colors.length >= 3 && raw.colors.length <= 5 && raw.colors.every(c => /^#[a-f\d]{6}$/i.test(c))) result.colors = raw.colors;
  if (['Extra small', 'Small', 'Medium', 'Large', 'Extra large'].includes(raw.fontSize ?? '')) result.fontSize = raw.fontSize!;
  if (['Fira Sans', 'Inter', 'Roboto', 'Segoe UI', 'IBM Plex Sans', 'Arial', 'Georgia'].includes(raw.fontFamily ?? '')) result.fontFamily = raw.fontFamily!;
  // Upgrade only the exact initial approximate palette; preserve user custom colors.
  if (result.colors.join(',') === '#ff7180,#ffab59,#ffd149,#a4d96c,#63bd80') result.colors = [...SENTIMENT_COLORS];
  if (result.themeColor === '#263b87') result.themeColor = '#1b3380';
  if (raw.widgetFilter && Array.isArray(raw.widgetFilter.criteria) && typeof raw.widgetFilter.name === 'string') result.widgetFilter = raw.widgetFilter;
  return result;
}

/** Retire only records from the removed dynamic heat-map experiment. Never hydrate them. */
export function discardRetiredHeatMapCollections(storage: Pick<Storage, 'length' | 'key' | 'removeItem'>): void {
  const retired: string[] = [];
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index);
    if (key && (/^survey-re:dashboard:\d+:added-heat-maps:v1$/.test(key) || /^survey-re:dashboard:\d+:tab:[^:]+:heat-map:w-heat-map-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:v1$/i.test(key))) retired.push(key);
  }
  retired.forEach(key => storage.removeItem(key));
}

/** Current mixed fixture: the parent reversal selector affects its first leaf only. */
export function heatMapOverallScore(question: HeatMapQuestion, settings: HeatMapSettings, childId?: string): number | null {
  const reverse = settings.reversed.includes(question.id);
  if (!childId && question.nativeColumns) return heatMapDirectScore(question, settings);
  if (HEAT_MAP_SOURCE_EXTRAS.some(extra => extra.id === question.id) && !question.normalizedScaleVerified && (settings.range !== 'Default' || reverse)) return null;
  if (question.id === 'qa-matrix' && question.children) {
    const values = question.children.filter(child => !childId || child.id === childId).map((child, index) => child.overall === null ? null : displayScore(child.overall, question.max, settings.range, reverse && (childId ? child.id === question.children![0].id : index === 0)));
    return values.some(value => value === null) || !values.length ? null : values.reduce<number>((sum, value) => sum + value!, 0) / values.length;
  }
  const native = childId ? question.children?.find(child => child.id === childId)?.overall : question.overall;
  return native == null ? null : displayScore(native, question.max, settings.range, reverse);
}
export function heatMapOverallAverage(questions: HeatMapQuestion[], settings: HeatMapSettings): number | null {
  const values = questions.flatMap(question => question.children ? question.children.map(child => heatMapOverallScore(question, settings, child.id)) : [heatMapOverallScore(question, settings)]);
  return !values.length || values.some(value => value === null) ? null : values.reduce<number>((sum, value) => sum + value!, 0) / values.length;
}

/** Columns are the exact audited response cohorts, ordered Overall,1,3,2,4,5. */
export function heatMapColumnIndex(answer?: number): number { return answer === undefined ? 0 : [1, 3, 2, 4, 5].indexOf(answer) + 1; }
export function heatMapDirectScore(question: HeatMapQuestion, settings: HeatMapSettings, answer?: number): number | null {
  const index = heatMapColumnIndex(answer);
  if (answer !== undefined && index === 0) return null;
  const native = question.nativeColumns?.[index];
  if (native === undefined) return null;
  if (settings.reversed.includes(question.id)) return question.max > 0 ? displayScore(native, question.max, settings.range, true) : native;
  if (settings.range === 'Default') return native;
  const normalized = question.range10Columns?.[index];
  return normalized === undefined ? null : settings.range === '0–5' ? normalized / 2 : normalized;
}
export function heatMapResponseBase(question: HeatMapQuestion, fallback: number, answer?: number): number {
  return question.responseBases?.[heatMapColumnIndex(answer)] ?? fallback;
}

/** Only Q5 predicates can be executed from the observed cohort fixture. */
export function resolveHeatMapFilter(definition: HeatMapSegment): { answers: number[]; error?: string } {
  if (definition.criteria.some(criterion => criterion.option !== 'Question' || criterion.field !== 'single' || !['Is', 'Is not'].includes(criterion.operator) || !criterion.value)) return { answers: [], error: 'Response data for this criterion is not available in the local fixture.' };
  if (!['All responses', 'Completed'].includes(definition.responseStatus)) return { answers: [] };
  if ((definition.from && definition.from > '2026-09-25') || (definition.to && definition.to < '2026-09-25')) return { answers: [] };
  const blocks = [...new Set(definition.criteria.map(criterion => criterion.block))];
  return { answers: [1, 2, 3, 4, 5].filter(answer => !blocks.length || blocks.some(block => definition.criteria.filter(criterion => criterion.block === block).every(criterion => criterion.operator === 'Is' ? criterion.value.split(',').includes(String(answer)) : !criterion.value.split(',').includes(String(answer))))) };
}
export function heatMapCohortCount(answers: number[]): number {
  return INITIAL_HEAT_MAP_SEGMENTS.filter(segment => answers.includes(segment.answer)).reduce((sum, segment) => sum + segment.count, 0);
}
export function heatMapCohortScore(question: HeatMapQuestion, settings: HeatMapSettings, answers: number[]): number | null {
  if (!answers.length) return 0;
  if (answers.length === 5) return heatMapOverallScore(question, settings);
  if (answers.length === 1) return heatMapDirectScore(question, settings, answers[0]);
  const values = answers.map(answer => ({ value: heatMapDirectScore(question, settings, answer), count: heatMapCohortCount([answer]) }));
  if (values.some(item => item.value === null)) return null;
  return values.reduce((sum, item) => sum + item.value! * item.count, 0) / heatMapCohortCount(answers);
}

/** Dashboard inheritance is resolved at render time; widget overrides stay independent. */
export function resolveHeatMapDesign(settings: HeatMapSettings, dashboard?: DashboardDesign) {
  const inherited = settings.designType === 'Dashboard';
  const size = inherited ? dashboard?.typography.fontSize.label ?? 'Medium' : settings.fontSize;
  const bodySize = ({ 'Extra small': 11, Small: 12, Medium: 14, Large: 16, 'Extra large': 18 } as Record<string, number>)[size] ?? 14;
  const customInherited = inherited && dashboard?.sentiment === 'custom';
  return {
    bodySize, titleSize: ({ 'Extra small': 14, Small: 16, Medium: 18, Large: 20, 'Extra large': 22 } as Record<string, number>)[size] ?? 18,
    fontFamily: inherited ? dashboard?.typography.fontFamily.value ?? '"Fira Sans", Arial, sans-serif' : settings.fontFamily,
    themeColor: inherited ? dashboard?.themeColor ?? '#0d2163' : settings.themeColor,
    // Preserve the measured legacy default palette quirk. Custom dashboard colors
    // explicitly replace that palette rather than leaking the widget's old colors.
    colorSettings: customInherited ? { ...settings, designType: 'Widget' as const, sentiment: 'Custom' as const, colors: dashboard.customSentiment } : inherited || settings.sentiment === 'Default' ? { ...settings, colors: SENTIMENT_COLORS } : settings,
  };
}

export function resolveDashboardHeatMapFilter(filter?: DashboardActiveFilter): { answers: number[]; error?: string; active?: boolean } {
  const all = [1, 2, 3, 4, 5];
  if (!filter) return { answers: all };
  const active = filter.hasCriteria || filter.responseStatus !== 'all' || !!filter.dateRange.trim();
  if (!active) return { answers: all };
  const unavailable = { answers: [], active: true, error: 'Response data for this dashboard filter is not available in the local fixture.' };
  if (!['all', 'completed', 'partial', 'terminated'].includes(filter.responseStatus)) return unavailable;
  let answers = all;
  if (filter.hasCriteria) {
    if (filter.questionId !== 'single' || !['is', 'is-not'].includes(filter.operator)) return unavailable;
    const answer = ['Very poor', 'Poor', 'Neutral', 'Good', 'Excellent'].indexOf(filter.value) + 1;
    if (!answer) return unavailable;
    answers = all.filter(value => filter.operator === 'is' ? value === answer : value !== answer);
  }
  const date = filter.dateRange.trim();
  if (date) {
    const match = /^(\d{4}-\d{2}-\d{2})(?:\s+(?:to|–|-)\s+(\d{4}-\d{2}-\d{2}))?$/.exec(date);
    const validDate = (value: string) => { const parsed = new Date(`${value}T00:00:00Z`); return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value; };
    if (!match || !validDate(match[1]) || (match[2] && (!validDate(match[2]) || match[1] > match[2]))) return unavailable;
    if (match[1] > '2026-09-25' || (match[2] ?? match[1]) < '2026-09-25') answers = [];
  }
  if (filter.responseStatus === 'partial' || filter.responseStatus === 'terminated') answers = [];
  return { answers, active };
}

export function resolveHeatMapActiveAnswers(settings: HeatMapSettings, dashboard?: DashboardActiveFilter): { answers: number[]; error?: string } {
  const dashboardResult = ['Dashboard', 'Combined'].includes(settings.filterType) ? resolveDashboardHeatMapFilter(dashboard) : { answers: [1, 2, 3, 4, 5] };
  const widgetResult = settings.widgetFilter && ['Widget', 'Combined'].includes(settings.filterType) ? resolveHeatMapFilter(settings.widgetFilter) : { answers: [1, 2, 3, 4, 5] };
  if (dashboardResult.error || widgetResult.error) return { answers: [], error: dashboardResult.error ?? widgetResult.error };
  if (settings.source === 'matrix' && (dashboardResult.active || (settings.widgetFilter && ['Widget', 'Combined'].includes(settings.filterType)))) return { answers: [], error: 'Response-level filters are not available for the historical fixture.' };
  return { answers: dashboardResult.answers.filter(answer => widgetResult.answers.includes(answer)) };
}
