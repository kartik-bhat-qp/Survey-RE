export interface SegmentTrendSeriesConfig {
  field: string;
  name: string;
  color: string;
}

export interface SegmentTrendDataRow {
  category: string;
  [seriesField: string]: string | number;
}

export const SEGMENT_TREND_SERIES: SegmentTrendSeriesConfig[] = [
  { field: 'segment1', name: 'Segment 1', color: '#1b4f9c' },
  { field: 'segment2', name: 'Seg 2', color: '#90bef2' },
];

/** Demo values aligned with the Segment Trend reference widget. */
export const SEGMENT_TREND_DEMO_DATA: SegmentTrendDataRow[] = [
  { category: 'Sep 08 - Sep 14', segment1: 361, segment2: 494 },
  { category: 'Sep 15 - Sep 21', segment1: 589, segment2: 777 },
  { category: 'Sep 22 - Sep 28', segment1: 216, segment2: 226 },
  { category: 'Sep 29 - Oct 05', segment1: 664, segment2: 838 },
  { category: 'Oct 06 - Oct 12', segment1: 0, segment2: 0 },
  { category: 'Oct 13 - Oct 19', segment1: 529, segment2: 774 },
  { category: 'Oct 20 - Oct 26', segment1: 58, segment2: 50 },
  { category: 'Oct 27 - Nov 02', segment1: 670, segment2: 749 },
];
