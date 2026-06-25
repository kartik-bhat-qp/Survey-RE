export interface Report {
  id: number;
  name: string;
  creationDate: string;
}

export const REPORTS_PER_PAGE = 100;

export const MOCK_REPORTS: Report[] = [
  { id: 1, name: 'Variable cross tab', creationDate: '2025-09-11' },
  { id: 2, name: 'Fighting 2026', creationDate: '2026-03-04' },
  { id: 3, name: 'New', creationDate: '2026-04-18' },
  { id: 4, name: 'PRabal test', creationDate: '2026-02-22' },
  { id: 5, name: 'eqa', creationDate: '2026-01-15' },
  { id: 6, name: '/;/fgh', creationDate: '2025-12-08' },
  { id: 7, name: 'Ranking', creationDate: '2026-05-02' },
  { id: 8, name: 'NPS', creationDate: '2026-04-30' },
  { id: 9, name: 'now', creationDate: '2026-05-14' },
  {
    id: 10,
    name: 'Ice cream survey with derived variables',
    creationDate: '2026-03-28',
  },
  { id: 11, name: 'Report 17', creationDate: '2026-02-10' },
  { id: 12, name: 'Bolt', creationDate: '2026-01-27' },
  { id: 13, name: 'New cross-tab 1025', creationDate: '2026-05-26' },
  {
    id: 14,
    name: 'West Bengal voter sentiment — longitudinal crosstab with weighting adjustments for Q2 board review',
    creationDate: '2025-11-19',
  },
];
