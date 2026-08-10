import type { CreateReportTypeId } from '@/data/mock-create-report';

export interface Report {
  id: number;
  name: string;
  creationDate: string;
  typeId?: CreateReportTypeId;
  surveyName?: string;
  questionLabel?: string;
}

export const MOCK_REPORTS: Report[] = [
  {
    id: 1,
    name: 'Variable cross tab',
    creationDate: '2025-09-11',
    typeId: 'crosstab',
    surveyName: 'Ice cream survey',
  },
  {
    id: 2,
    name: 'Fighting 2026',
    creationDate: '2026-03-04',
    typeId: 'crosstab',
    surveyName: 'Voter tracker W4',
  },
  {
    id: 3,
    name: 'Brand ladder pricing',
    creationDate: '2026-04-18',
    typeId: 'ranking',
    surveyName: 'Coke research',
  },
  {
    id: 4,
    name: 'PRabal test',
    creationDate: '2026-02-22',
    typeId: 'crosstab',
    surveyName: 'Internal QA set',
  },
  {
    id: 5,
    name: 'Q1 promoter split',
    creationDate: '2026-01-15',
    typeId: 'nps',
    surveyName: 'Support CSAT 2026',
  },
  {
    id: 6,
    name: 'Weighted region tabs',
    creationDate: '2025-12-08',
    typeId: 'weighted-tabulation',
    surveyName: 'Voter tracker W4',
  },
  {
    id: 7,
    name: 'Ranking',
    creationDate: '2026-05-02',
    typeId: 'ranking',
    surveyName: 'Snack concept test',
  },
  {
    id: 8,
    name: 'NPS',
    creationDate: '2026-04-30',
    typeId: 'nps',
    surveyName: 'Support CSAT 2026',
  },
  {
    id: 9,
    name: 'Flavour shortlist reach',
    creationDate: '2026-05-14',
    typeId: 'ranking',
    surveyName: 'Ice cream survey',
  },
  {
    id: 10,
    name: 'Ice cream survey with derived variables',
    creationDate: '2026-03-28',
    typeId: 'crosstab',
    surveyName: 'Ice cream survey',
  },
  {
    id: 11,
    name: 'Detractor themes — Q2',
    creationDate: '2026-02-10',
    typeId: 'nps',
    surveyName: 'Support CSAT 2026',
  },
  {
    id: 12,
    name: 'Bolt',
    creationDate: '2026-01-27',
    typeId: 'weighted-tabulation',
  },
  {
    id: 13,
    name: 'New cross-tab 1025',
    creationDate: '2026-05-26',
    typeId: 'crosstab',
    surveyName: 'Mobility omnibus',
  },
  {
    id: 14,
    name: 'West Bengal voter sentiment — longitudinal crosstab with weighting adjustments for Q2 board review',
    creationDate: '2025-11-19',
    typeId: 'weighted-tabulation',
    surveyName: 'Voter tracker W4',
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
