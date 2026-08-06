export type DatasetDataType = 'Survey (Composite)' | 'External';

export interface Dataset {
  id: number;
  name: string;
  variableCount: number;
  rowCount: number;
  dataType: DatasetDataType;
  createdOn: string;
}

export const MOCK_DATASETS: Dataset[] = [
  {
    id: 1,
    name: 'Demo survey 2026',
    variableCount: 3,
    rowCount: 1240,
    dataType: 'Survey (Composite)',
    createdOn: '2026-07-28',
  },
  {
    id: 2,
    name: 'SKIM',
    variableCount: 11,
    rowCount: 8560,
    dataType: 'External',
    createdOn: '2026-07-22',
  },
  {
    id: 3,
    name: 'Townhall demo survey',
    variableCount: 21,
    rowCount: 432,
    dataType: 'Survey (Composite)',
    createdOn: '2026-07-21',
  },
  {
    id: 4,
    name: 'QuestionPro - RE',
    variableCount: 4,
    rowCount: 218,
    dataType: 'Survey (Composite)',
    createdOn: '2026-07-20',
  },
  {
    id: 5,
    name: 'QuestionPro Demo Survey',
    variableCount: 11,
    rowCount: 3091,
    dataType: 'Survey (Composite)',
    createdOn: '2026-07-20',
  },
  {
    id: 6,
    name: 'QuestionPro Demo Survey_Copy',
    variableCount: 11,
    rowCount: 3091,
    dataType: 'Survey (Composite)',
    createdOn: '2026-07-20',
  },
  {
    id: 7,
    name: 'BI sub topics account cancellation',
    variableCount: 1,
    rowCount: 87,
    dataType: 'Survey (Composite)',
    createdOn: '2026-07-17',
  },
  {
    id: 8,
    name: 'QuesitonPro Demo Survey_Copy',
    variableCount: 11,
    rowCount: 2754,
    dataType: 'Survey (Composite)',
    createdOn: '2026-07-17',
  },
  {
    id: 9,
    name: 'Customer experience pulse — Q2 enterprise panel with regional split tracking',
    variableCount: 48,
    rowCount: 15203,
    dataType: 'Survey (Composite)',
    createdOn: '2026-07-17',
  },
  {
    id: 10,
    name: 'Brand tracker export',
    variableCount: 22,
    rowCount: 6400,
    dataType: 'External',
    createdOn: '2026-07-17',
  },
  {
    id: 11,
    name: 'NPS weekly ingest',
    variableCount: 8,
    rowCount: 1125,
    dataType: 'External',
    createdOn: '2026-07-17',
  },
  {
    id: 12,
    name: 'Employee engagement rollup',
    variableCount: 16,
    rowCount: 940,
    dataType: 'Survey (Composite)',
    createdOn: '2026-07-16',
  },
  {
    id: 13,
    name: 'Retail mystery shop composite',
    variableCount: 19,
    rowCount: 510,
    dataType: 'Survey (Composite)',
    createdOn: '2026-07-16',
  },
];
