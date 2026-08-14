export type Analytics2ScreenId =
  | 'overview'
  | 'responses'
  | 'crosstab'
  | 'crosstabDetail'
  | 'trend'
  | 'comparison'
  | 'consolidate'
  | 'conjoint'
  | 'maxdiff'
  | 'correlation'
  | 'gap'
  | 'heatmap'
  | 'hotspot'
  | 'turf'
  | 'tubepulse'
  | 'wordcloud'
  | 'searchtext'
  | 'videoai'
  | 'filters'
  | 'weighting'
  | 'quality'
  | 'deviceaudit'
  | 'exportdata'
  | 'importdata'
  | 'mergedata'
  | 'scheduler'
  | 'downloads'
  | 'deleteresponses';

export interface Analytics2NavItem {
  id: Analytics2ScreenId;
  label: string;
  icon: string;
}

export interface Analytics2NavSection {
  label: string;
  items: Analytics2NavItem[];
}

export const ANALYTICS_2_NAV: Analytics2NavSection[] = [
  {
    label: 'Insights',
    items: [
      { id: 'overview', label: 'Overview', icon: 'wm-dashboard' },
      { id: 'responses', label: 'Responses', icon: 'wm-format-list-bulleted' },
    ],
  },
  {
    label: 'Reports',
    items: [
      { id: 'crosstab', label: 'Cross-Tabulation', icon: 'wm-table-chart' },
      { id: 'trend', label: 'Trend Analysis', icon: 'wm-show-chart' },
      { id: 'comparison', label: 'Survey Comparison', icon: 'wm-compare-arrows' },
      { id: 'consolidate', label: 'Consolidated Report', icon: 'wm-library-books' },
    ],
  },
  {
    label: 'Advanced analysis',
    items: [
      { id: 'conjoint', label: 'Conjoint', icon: 'wm-account-tree' },
      { id: 'maxdiff', label: 'MaxDiff', icon: 'wm-swap-vert' },
      { id: 'correlation', label: 'Correlation', icon: 'wm-scatter-plot' },
      { id: 'gap', label: 'GAP Analysis', icon: 'wm-align-horizontal-left' },
      { id: 'heatmap', label: 'Heatmap', icon: 'wm-apps' },
      { id: 'hotspot', label: 'HotSpot', icon: 'wm-my-location' },
      { id: 'turf', label: 'TURF', icon: 'wm-bar-chart' },
      { id: 'tubepulse', label: 'TubePulse', icon: 'wm-smart-display' },
    ],
  },
  {
    label: 'Text & video',
    items: [
      { id: 'wordcloud', label: 'Word Cloud', icon: 'wm-cloud' },
      { id: 'searchtext', label: 'Search Text', icon: 'wm-search' },
      { id: 'videoai', label: 'VideoAI Analysis', icon: 'wm-movie' },
    ],
  },
  {
    label: 'Data',
    items: [
      { id: 'filters', label: 'Data Filters', icon: 'wm-filter-alt' },
      { id: 'weighting', label: 'Weighting & Balancing', icon: 'wm-balance' },
      { id: 'quality', label: 'Data Quality', icon: 'wm-verified' },
      { id: 'deviceaudit', label: 'Device Audit', icon: 'wm-devices' },
    ],
  },
  {
    label: 'Data management',
    items: [
      { id: 'exportdata', label: 'Export Data', icon: 'wm-download' },
      { id: 'importdata', label: 'Import Data', icon: 'wm-upload' },
      { id: 'mergedata', label: 'Merge Data 2.0', icon: 'wm-merge-type' },
      { id: 'scheduler', label: 'Scheduler', icon: 'wm-event' },
      { id: 'downloads', label: 'Download Center', icon: 'wm-cloud-download' },
      { id: 'deleteresponses', label: 'Delete Responses', icon: 'wm-delete' },
    ],
  },
];

export const ANALYTICS_2_SCREEN_LABELS: Record<Analytics2ScreenId, string> = {
  overview: 'Overview',
  responses: 'Responses',
  crosstab: 'Cross-Tabulation',
  crosstabDetail: 'Cross-Tabulation',
  trend: 'Trend Analysis',
  comparison: 'Survey Comparison',
  consolidate: 'Consolidated Report',
  conjoint: 'Conjoint',
  maxdiff: 'MaxDiff Analysis',
  correlation: 'Correlation',
  gap: 'GAP Analysis',
  heatmap: 'Heatmap Analysis',
  hotspot: 'HotSpot Analysis',
  turf: 'TURF Analysis',
  tubepulse: 'TubePulse',
  wordcloud: 'Word Cloud',
  searchtext: 'Search Open Ended Text',
  videoai: 'VideoAI Analysis',
  filters: 'Data Filters',
  weighting: 'Weighting & Balancing',
  quality: 'Data Quality',
  deviceaudit: 'Device Audit',
  exportdata: 'Export Data',
  importdata: 'Import Data',
  mergedata: 'Merge Data 2.0',
  scheduler: 'Scheduler',
  downloads: 'Download Center',
  deleteresponses: 'Delete Responses',
};

export const ANALYTICS_2_STAT_TILES = [
  { value: '67.92%', label: 'Completion rate', icon: 'wm-pie-chart', accent: true },
  { value: '4,044', label: 'Viewed', icon: 'wm-visibility' },
  { value: '2,684', label: 'Total started', icon: 'wm-play-circle' },
  { value: '1,823', label: 'Completed', icon: 'wm-flag' },
  { value: '861', label: 'Dropouts', icon: 'wm-block' },
  { value: '4 min 38 s', label: 'Average time', icon: 'wm-schedule' },
];

export const ANALYTICS_2_FUNNEL = [
  { label: 'Viewed', value: '4,044', width: '100%', color: '#94c7f1' },
  { label: 'Started', value: '2,684', width: '66%', color: '#54a5ec' },
  { label: 'Completed', value: '1,823', width: '45%', color: '#1b87e6' },
  { label: 'Dropped out', value: '861', width: '21%', color: '#f4b6b6' },
];

export const ANALYTICS_2_DEVICES = [
  {
    icon: 'wm-computer',
    label: 'Desktop / Laptop',
    pct: 86,
    detail: '58% Windows · 40% Mac · 2% Linux',
  },
  {
    icon: 'wm-smartphone',
    label: 'Smartphones',
    pct: 12,
    detail: '64% Android · 36% iPhone',
  },
  {
    icon: 'wm-tablet',
    label: 'Tablets',
    pct: 2,
    detail: '71% iPad · 29% Android',
  },
];

export const ANALYTICS_2_TIMELINE: Record<string, { values: number[]; labels: string[] }> = {
  '7 days': {
    values: [12, 48, 95, 160, 240, 210, 180],
    labels: ['Aug 8', 'Aug 9', 'Aug 10', 'Aug 11', 'Aug 12', 'Aug 13', 'Aug 14'],
  },
  '30 days': {
    values: [8, 30, 85, 140, 285, 190, 120],
    labels: ['Jul 16', 'Jul 21', 'Jul 26', 'Jul 31', 'Aug 4', 'Aug 9', 'Aug 14'],
  },
  '90 days': {
    values: [4, 20, 60, 130, 220, 260, 240],
    labels: ['May 17', 'Jun 1', 'Jun 16', 'Jul 1', 'Jul 16', 'Jul 31', 'Aug 14'],
  },
};

export const ANALYTICS_2_DROPOUT_ROWS = [
  { label: '1. [Q1] What is your gender?', count: '312', cum: '36.2%' },
  { label: '8. [Q7] Rate the following on how entertaining it is', count: '289', cum: '69.8%' },
  { label: '17. [Q31] Select the attributes — Muhammad Ali', count: '260', cum: '100%' },
  { label: 'Total', count: '861', cum: '100%' },
];

export const ANALYTICS_2_CROSSTAB_REPORTS = [
  { id: 'ct-1', name: 'Demo survey 2026 — Sample Crosstabulation Report', created: 'Aug 14, 2026 · Today' },
];

export const ANALYTICS_2_CT_COL_LABELS = [
  'Under 18',
  '18-24',
  '25-34',
  '35-44',
  '45-54',
  '55-64',
  'Above 64',
];

export const ANALYTICS_2_CT_ROWS = [
  {
    label: 'Male',
    counts: [11, 39, 168, 317, 248, 160, 213],
    pcts: ['47.8%', '39.0%', '42.4%', '50.6%', '46.7%', '41.9%', '36.8%'],
    total: '1,156',
  },
  {
    label: 'Female',
    counts: [8, 59, 228, 308, 282, 220, 365],
    pcts: ['34.8%', '59.0%', '57.6%', '49.2%', '53.1%', '57.6%', '63.0%'],
    total: '1,470',
  },
  {
    label: 'Other',
    counts: [0, 2, 0, 1, 1, 2, 0],
    pcts: ['0.0%', '2.0%', '0.0%', '0.2%', '0.2%', '0.5%', '0.0%'],
    total: '6',
  },
  {
    label: 'NA',
    counts: [4, 0, 0, 0, 0, 0, 1],
    pcts: ['17.4%', '0.0%', '0.0%', '0.0%', '0.0%', '0.0%', '0.2%'],
    total: '5',
  },
];

export const ANALYTICS_2_CT_TOTALS = [
  { count: '23', pct: '0.9%' },
  { count: '100', pct: '3.8%' },
  { count: '396', pct: '15.0%' },
  { count: '626', pct: '23.7%' },
  { count: '531', pct: '20.1%' },
  { count: '382', pct: '14.5%' },
  { count: '579', pct: '22.0%' },
];

export const ANALYTICS_2_OTHER_SURVEYS = [
  { name: 'FIrx', responses: 812 },
  { name: 'Randomization issue', responses: 96 },
  { name: 'Copied randomizatrion', responses: 54 },
  { name: 'kartik quota', responses: 210 },
  { name: 'appliqint', responses: 33 },
];

export const ANALYTICS_2_MERGE_SURVEYS = [
  'FIrx',
  'Randomization issue',
  'Copied randomizatrion',
  'kartik quota',
  'conjoint',
  'AI editor',
  'focus',
  'Issue. take',
  'Tourism',
  'Banking',
];

export const ANALYTICS_2_SEARCH_ROWS = [
  { code: 'Q1', label: '1. [Q1] What is your gender?' },
  { code: 'Q5', label: '2. [Q5] Age' },
  { code: 'Q6', label: '3. [Q6] What is your race or ethnicity…' },
  { code: 'Q4', label: '5. [Q4] Which of the following fighter…' },
  { code: 'XTR-Q4', label: '6. [XTR-Q4] Please drag and drop the figh…' },
  { code: 'Q7', label: '8. [Q7] Rate the follow… Mixed Martial A…' },
  { code: 'Q7', label: '8. [Q7] Rate the follow… Boxing' },
  { code: 'Q9', label: '10. [Q9] Who would win in a boxing matc…' },
  { code: 'Q9-C11', label: '11. [Q9-C11] Who would win in a street figh…' },
  { code: 'Q13', label: '14. [Q13] If you had 100 points, how wou…' },
  { code: 'Q31', label: '17. [Q31] Select the attr… Muhammad Ali' },
  { code: 'Q28', label: '26. [Q28] Which of the fo… Most' },
];

export const ANALYTICS_2_QUALITY_FLAGS = [
  { key: 'dupip', label: 'Duplicate IP addresses', hasSettings: false, defaultOn: false },
  { key: 'plag', label: 'Plagiarism detection', hasSettings: true, defaultOn: false },
  { key: 'gibberish', label: 'Gibberish words', hasSettings: false, defaultOn: false },
  { key: 'duptext', label: 'Duplicate text responses', hasSettings: false, defaultOn: true },
  { key: 'oneword', label: 'One word answers', hasSettings: false, defaultOn: true },
  { key: 'allchecks', label: 'All checkboxes selected', hasSettings: false, defaultOn: true },
  { key: 'patterned', label: 'Patterned response', hasSettings: false, defaultOn: true },
  { key: 'speed', label: 'Speed traps', hasSettings: true, defaultOn: false },
  { key: 'terminates', label: 'Quality terminates', hasSettings: false, defaultOn: false },
];

export const ANALYTICS_2_DOWNLOAD_JOBS = [
  {
    id: '30343308',
    date: '8/07/2026 1:33 PM IST',
    survey: 'Harris Dataset 1 (7/7)',
    report: 'Analytics (Excel) Report',
    segment: 'Entire Dataset',
    file: 'QuestionPro-SR-RawData-13673395-08-07-2026-T010356.615.xlsx',
    time: '5 seconds',
    size: '4,151 Kb',
  },
  {
    id: '30320010',
    date: '8/06/2026 3:02 PM IST',
    survey: 'Demo survey 2026 - COPIED',
    report: 'Analytics (Excel) Report',
    segment: 'asd',
    file: 'QuestionPro-SR-RawData-13723281-08-06-2026-T023235.234.xlsx',
    time: '1 second',
    size: '31 Kb',
  },
  {
    id: '30172423',
    date: '7/31/2026 12:13 PM IST',
    survey: 'Demo survey 2026',
    report: 'Analytics (SPSS) Report',
    segment: 'Entire Dataset',
    file: 'QuestionPro-SR-RawData-13713788-07-30-2026-T234352.653.sav',
    time: 'Less than a second',
    size: '45 Kb',
  },
  {
    id: '30172421',
    date: '7/31/2026 12:13 PM IST',
    survey: 'Demo survey 2026',
    report: 'Analytics (Excel) Report',
    segment: 'Entire Dataset',
    file: 'QuestionPro-SR-RawData-13713788-07-30-2026-T234348.071.xlsx',
    time: 'Less than a second',
    size: '8 Kb',
  },
  {
    id: '30172243',
    date: '7/31/2026 12:03 PM IST',
    survey: 'Demo survey 2026',
    report: 'Text Highlighter SPSS Report',
    segment: 'Entire Dataset',
    file: 'QuestionPro-SR-TextHighlighter-13713788-07-30-2026-T233308.997.sav',
    time: 'Less than a second',
    size: '36 Kb',
  },
  {
    id: '30013009',
    date: '7/17/2026 8:46 PM IST',
    survey: 'Demo survey 2026',
    report: 'Analytics (Excel) Report',
    segment: 'Entire Dataset',
    file: 'QuestionPro-SR-Excel-Bundle-12857501-07-17-2026-T081615.878.zip',
    time: '188 seconds',
    size: '14,979 Kb',
  },
  {
    id: '29988406',
    date: '7/15/2026 5:40 PM IST',
    survey: 'Demo survey 2026',
    report: 'Analytics (Excel) Report',
    segment: 'Entire Dataset',
    file: 'QuestionPro-SR-RawData-13425092-07-15-2026-T051005.125.xlsx',
    time: '28 seconds',
    size: '1,890 Kb',
  },
];

export const ANALYTICS_2_WORD_CLOUDS = [
  {
    title: 'What do you feel about professional combat-sports (Boxing, MMA, etc)?',
    words: [
      { word: 'think', size: 42, color: '#7b2d8b' },
      { word: 'violent', size: 38, color: '#8b2d2d' },
      { word: 'like', size: 30, color: '#3d8b37' },
      { word: 'sport', size: 26, color: '#3d8b37' },
      { word: 'watch', size: 24, color: '#3d8b37' },
      { word: 'boxing', size: 22, color: '#8b2d2d' },
      { word: 'people', size: 18, color: '#3d8b37' },
      { word: 'regulated', size: 17, color: '#7b2d8b' },
      { word: 'good', size: 16, color: '#3d8b37' },
      { word: 'sports', size: 20, color: '#7b2d8b' },
      { word: 'entertaining', size: 15, color: '#8b2d2d' },
      { word: 'love', size: 14, color: '#8b2d2d' },
      { word: 'combat', size: 13, color: '#7b2d8b' },
      { word: 'violence', size: 12, color: '#8b2d2d' },
      { word: 'dangerous', size: 12, color: '#7b2d8b' },
      { word: 'interested', size: 11, color: '#3d8b37' },
      { word: 'watching', size: 11, color: '#2d5f8b' },
      { word: 'MMA', size: 10, color: '#7b2d8b' },
      { word: 'feel', size: 10, color: '#3d8b37' },
      { word: 'exciting', size: 9, color: '#2d5f8b' },
    ],
    counts: [
      { word: 'think', count: 411 },
      { word: 'violent', count: 399 },
      { word: 'like', count: 300 },
      { word: 'sport', count: 255 },
      { word: 'watch', count: 243 },
    ],
  },
  {
    title: 'What is your gender?',
    words: [
      { word: 'Non-binary', size: 40, color: '#8b2d2d' },
      { word: 'Transgender', size: 26, color: '#8b2d2d' },
      { word: 'trans', size: 16, color: '#7b2d8b' },
      { word: 'fluid', size: 13, color: '#3d8b37' },
      { word: 'prefer', size: 11, color: '#2d5f8b' },
      { word: 'agender', size: 10, color: '#7b2d8b' },
    ],
    counts: [
      { word: 'Non-binary', count: 96 },
      { word: 'Transgender', count: 44 },
      { word: 'trans', count: 18 },
      { word: 'fluid', count: 9 },
      { word: 'agender', count: 6 },
    ],
  },
];

export const ANALYTICS_2_DEVICE_AUDIT = [
  { browser: 'Chrome 14', os: 'macOS', device: 'Computer', count: '1,204', share: '44.9%' },
  { browser: 'Chrome 13', os: 'Windows', device: 'Computer', count: '986', share: '36.7%' },
  { browser: 'Safari 18', os: 'iOS', device: 'Smartphone', count: '214', share: '8.0%' },
  { browser: 'Chrome 126', os: 'Android', device: 'Smartphone', count: '168', share: '6.3%' },
  { browser: 'Safari 18', os: 'iPadOS', device: 'Tablet', count: '38', share: '1.4%' },
  { browser: 'Firefox 128', os: 'Windows', device: 'Computer', count: '74', share: '2.8%' },
];

export const ANALYTICS_2_EXPORT_SECTIONS = [
  {
    title: 'Raw Data Export',
    subtitle: 'Every response, one row each',
    fields: [
      { label: 'Output file format', value: 'Microsoft Excel (.xlsx)' },
      { label: 'Language data filter', value: 'All' },
      { label: 'Data filter', value: '— Select filter —' },
    ],
    toggles: [
      { label: 'Open-ended text data', defaultOn: true },
      { label: 'Question codes', defaultOn: true },
      { label: 'Randomization data', defaultOn: false },
    ],
  },
  {
    title: 'Charts & Analytics Export',
    subtitle: 'Formatted report with charts',
    fields: [
      { label: 'Output format', value: 'PowerPoint (.pptx)' },
      { label: 'Template', value: 'Standard White/Blue' },
      { label: 'Display language', value: 'English' },
    ],
    toggles: [{ label: 'Open-ended text data', defaultOn: false }],
  },
  {
    title: 'Statistical Package Export (SPSS)',
    subtitle: '.sav file with labelled variables',
    fields: [
      { label: 'Language data filter', value: 'All' },
      { label: 'Data filter', value: '— Select filter —' },
    ],
    toggles: [
      { label: 'Raw data', defaultOn: true },
      { label: 'Legacy export', defaultOn: false },
    ],
  },
  {
    title: 'SQL Export: Data File',
    subtitle: 'INSERT statements for your warehouse',
    fields: [{ label: 'Data filter', value: '— Select filter —' }],
    toggles: [{ label: 'Excel and timestamp', defaultOn: false }],
  },
  {
    title: 'Image (Multimedia) Export',
    subtitle: 'Uploaded files from responses',
    fields: [
      { label: 'Data filter', value: '— Select filter —' },
      { label: 'Select question', value: 'All questions' },
    ],
    toggles: [],
  },
];

export const ANALYTICS_2_CORR_COLS = ['What is your gender?', 'Age'];
export const ANALYTICS_2_CORR_ROWS = [
  { label: 'What is your gender?', vals: [1, 0.05] },
  { label: 'Age', vals: [0.05, 1] },
  { label: 'Entertainment value', vals: [0.12, 0.74] },
];

export interface Analytics2ToolDef {
  title: string;
  subtitle: string;
  hint: string;
  mode: 'select' | 'list';
  questions: string[];
  listRows: { label: string; responses: string }[];
  resultTitle: string;
  cols: string[];
  rows: string[][];
}

export const ANALYTICS_2_TOOLS: Record<
  'gap' | 'heatmap' | 'turf' | 'tubepulse' | 'hotspot' | 'maxdiff',
  Analytics2ToolDef
> = {
  gap: {
    title: 'GAP Analysis',
    subtitle: 'Importance vs. satisfaction gaps',
    hint: 'Pick a side-by-side matrix question to compare stated importance against experienced satisfaction.',
    mode: 'select',
    questions: [
      '27. [Q29] [MMA] Entertainment Value',
      '15. [Q15] Importance to sell a fight',
      '7. [Q7] Rate the following',
    ],
    listRows: [],
    resultTitle: 'GAP scores',
    cols: ['Attribute', 'Importance', 'Satisfaction', 'GAP'],
    rows: [
      ['Entertainment value', '4.6', '3.8', '−0.8'],
      ['Fighter reputation', '4.2', '4.0', '−0.2'],
      ['Pay-per-view price', '3.9', '2.7', '−1.2'],
      ['Broadcast quality', '3.4', '3.6', '+0.2'],
    ],
  },
  heatmap: {
    title: 'Heatmap Analysis',
    subtitle: 'Click distribution on image questions',
    hint: 'Pick an image or hotspot question to see where respondents clicked most.',
    mode: 'select',
    questions: ['12. [Q12] Poster concept A', '13. [Q13] Poster concept B'],
    listRows: [],
    resultTitle: 'Click regions',
    cols: ['Region', 'Clicks', 'Share'],
    rows: [
      ['Headline area', '412', '38%'],
      ['Fighter photo', '365', '34%'],
      ['Date & venue', '188', '17%'],
      ['Sponsor strip', '119', '11%'],
    ],
  },
  turf: {
    title: 'TURF Analysis',
    subtitle: 'Total Unduplicated Reach & Frequency',
    hint: 'Pick a multi-select question to find the combination of options with the widest unduplicated reach.',
    mode: 'list',
    questions: [],
    listRows: [
      { label: '[Q6] What is your race or ethnicity?', responses: '1,658' },
      { label: '[Q4] Which of the following fighters do you recognise?', responses: '1,644' },
      { label: '[Q7] Rate the following on how entertaining it is -', responses: '1,612' },
      {
        label: '[Q15] Please rate the following in terms of importance to sell a fight / pay per views?',
        responses: '1,588',
      },
    ],
    resultTitle: 'Best combinations by reach',
    cols: ['Combination', 'Reach', 'Frequency'],
    rows: [
      ['Ali + Tyson', '92%', '1.64'],
      ['Ali + Mayweather', '88%', '1.51'],
      ['Tyson + Pacquiao', '83%', '1.42'],
      ['Ali + Tyson + Mayweather', '96%', '2.05'],
    ],
  },
  tubepulse: {
    title: 'TubePulse',
    subtitle: 'Second-by-second video reactions',
    hint: 'Pick a video question to see the average audience rating per second of playback.',
    mode: 'select',
    questions: ['28. [Q28] IpWccmsKWbU — 1-Minute Tour'],
    listRows: [],
    resultTitle: 'Avg. rating per second (peaks)',
    cols: ['Timestamp', 'Avg. rating', 'Responses'],
    rows: [
      ['0:04', '0.4', '212'],
      ['0:09', '2.1', '208'],
      ['0:12', '3.0', '204'],
      ['0:31', '3.0', '198'],
    ],
  },
  hotspot: {
    title: 'HotSpot Analysis',
    subtitle: 'Ratings on highlighted image areas',
    hint: '',
    mode: 'list',
    questions: [],
    listRows: [{ label: '1. [Q25] Please rate the highlighted areas.', responses: '1,658' }],
    resultTitle: 'HotSpot ratings',
    cols: ['Highlighted area', 'Avg. rating', 'Responses'],
    rows: [
      ['Headline', '4.2', '1,658'],
      ['Fighter photo', '4.6', '1,644'],
      ['Date & venue', '3.1', '1,590'],
      ['Sponsor strip', '2.4', '1,502'],
    ],
  },
  maxdiff: {
    title: 'MaxDiff Analysis',
    subtitle: 'Most / least important trade-offs',
    hint: '',
    mode: 'list',
    questions: [],
    listRows: [
      {
        label: '1. [Q28] Which of the following are most and least important in a street fight -',
        responses: '1,526',
      },
    ],
    resultTitle: 'MaxDiff scores',
    cols: ['Item', 'Most %', 'Least %', 'Score'],
    rows: [
      ['Technique', '38%', '6%', '+32'],
      ['Agility', '29%', '9%', '+20'],
      ['Strength', '21%', '18%', '+3'],
      ['Reach', '8%', '31%', '−23'],
      ['Weight', '4%', '36%', '−32'],
    ],
  },
};

export const ANALYTICS_2_CJ_IMPORTANCE = [
  { attr: 'Tecnique', importance: '37%', level: '7/10', utility: -0.4 },
  { attr: '', importance: '', level: '8/10', utility: -0.18 },
  { attr: '', importance: '', level: '9/10', utility: 0.18 },
  { attr: '', importance: '', level: '10/10', utility: 0.48 },
  { attr: 'Agility', importance: '32%', level: '7/10', utility: -0.41 },
  { attr: '', importance: '', level: '8/10', utility: -0.22 },
  { attr: '', importance: '', level: '9/10', utility: 0.19 },
  { attr: '', importance: '', level: '10/10', utility: 0.43 },
  { attr: 'Height', importance: '17%', level: '5ft 7 inches', utility: -0.26 },
  { attr: '', importance: '', level: '6 ft', utility: 0.08 },
  { attr: '', importance: '', level: '6ft 3 inches', utility: 0.17 },
  { attr: 'Weight', importance: '14%', level: '66 Kg', utility: -0.2 },
  { attr: '', importance: '', level: '76 Kg', utility: 0.03 },
  { attr: '', importance: '', level: '86 KG', utility: 0.16 },
];

export const ANALYTICS_2_WEIGHT_ROWS = [
  { label: 'Male', current: '43.98', count: '1,177' },
  { label: 'Female', current: '55.57', count: '1,487' },
  { label: 'Other', current: '0.22', count: '6' },
  { label: 'NA', current: '0.22', count: '6' },
];

export const ANALYTICS_2_WEIGHT_QUESTIONS = [
  'Q1: What is your gender?',
  'Q5: Age',
  'Q9: Who would win in a boxing match?',
  'Q9-C11: Who would win in a street fight?',
  'Q12: Who would win in a boxing match?',
];

export function getAnalytics2NavLabel(id: Analytics2ScreenId): string {
  return ANALYTICS_2_SCREEN_LABELS[id];
}

export function isAnalytics2ToolScreen(
  id: Analytics2ScreenId
): id is 'gap' | 'heatmap' | 'turf' | 'tubepulse' | 'hotspot' | 'maxdiff' {
  return id === 'gap' || id === 'heatmap' || id === 'turf' || id === 'tubepulse' || id === 'hotspot' || id === 'maxdiff';
}
