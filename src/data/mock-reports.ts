export interface Report {
  id: number;
  name: string;
  creationDate: string;
  typeId?: 'crosstab' | 'conjoint' | 'maxdiff' | 'gabor-granger' | 'van-westendorp' | 'heatmaps';
  surveyName?: string;
  questionLabel?: string;
}

export const REPORTS_PER_PAGE = 100;

export const MOCK_REPORTS: Report[] = [
  {
    id: 1,
    name: 'Variable cross tab',
    creationDate: '2025-09-11',
    typeId: 'crosstab',
  },
  {
    id: 2,
    name: 'Fighting 2026',
    creationDate: '2026-03-04',
    typeId: 'crosstab',
  },
  { id: 3, name: 'New', creationDate: '2026-04-18', typeId: 'crosstab' },
  { id: 4, name: 'PRabal test', creationDate: '2026-02-22', typeId: 'crosstab' },
  { id: 5, name: 'eqa', creationDate: '2026-01-15', typeId: 'crosstab' },
  { id: 6, name: '/;/fgh', creationDate: '2025-12-08', typeId: 'crosstab' },
  { id: 7, name: 'Ranking', creationDate: '2026-05-02', typeId: 'crosstab' },
  { id: 8, name: 'NPS', creationDate: '2026-04-30', typeId: 'crosstab' },
  { id: 9, name: 'now', creationDate: '2026-05-14', typeId: 'crosstab' },
  {
    id: 10,
    name: 'Ice cream survey with derived variables',
    creationDate: '2026-03-28',
    typeId: 'crosstab',
  },
  { id: 11, name: 'Report 17', creationDate: '2026-02-10', typeId: 'crosstab' },
  { id: 12, name: 'Bolt', creationDate: '2026-01-27', typeId: 'crosstab' },
  {
    id: 13,
    name: 'New cross-tab 1025',
    creationDate: '2026-05-26',
    typeId: 'crosstab',
  },
  {
    id: 14,
    name: 'West Bengal voter sentiment — longitudinal crosstab with weighting adjustments for Q2 board review',
    creationDate: '2025-11-19',
    typeId: 'crosstab',
  },
  {
    id: 1001,
    name: 'Laptop conjoint',
    creationDate: '2026-08-01',
    typeId: 'conjoint',
    surveyName: 'Laptop preference study',
    questionLabel: '[Q13] Which of the following laptops would you purchase?',
  },
];

export function getReportById(id: number): Report | undefined {
  return MOCK_REPORTS.find((report) => report.id === id);
}
