import type { Dataset } from '@/data/mock-datasets';
import { MOCK_DATASETS } from '@/data/mock-datasets';

export type DatasetVariableKind = 'question' | 'category' | 'numeric';

export interface DatasetVariable {
  id: string;
  name: string;
  kind: DatasetVariableKind;
  responses: number;
}

export interface DatasetResponseRow {
  responseId: number;
  values: Record<string, string>;
}

export interface DatasetDetailData {
  datasetId: number;
  variables: DatasetVariable[];
  rows: DatasetResponseRow[];
  defaultSelectedVariableIds: string[];
}

const SKIM_VARIABLES: DatasetVariable[] = [
  { id: 'q7', name: 'Q7', kind: 'question', responses: 25 },
  { id: 'q6', name: 'Q6', kind: 'question', responses: 16 },
  { id: 'q5b', name: 'Q5b', kind: 'question', responses: 52 },
  { id: 'q5a', name: 'Q5a', kind: 'question', responses: 96 },
  { id: 'q4', name: 'Q4', kind: 'question', responses: 138 },
  { id: 'q3', name: 'Q3', kind: 'question', responses: 136 },
  { id: 'q2', name: 'Q2', kind: 'question', responses: 148 },
  { id: 'q1', name: 'Q1', kind: 'question', responses: 170 },
  { id: 'material', name: 'Material', kind: 'category', responses: 169 },
  { id: 'interview-id', name: 'Interview ID', kind: 'numeric', responses: 169 },
  { id: 'category', name: 'Category', kind: 'category', responses: 169 },
];

const SKIM_Q5B_ANSWERS = [
  'What materials have not met your expectations?',
  'Nonstick does not; easy cleaning and scratch resistance matter most.',
  '',
  'Ceramic coated cast iron appealing but out of price range.',
  "Coppertone didn't work well - surface wears out too quickly.",
  'A blender subject to heavy use is not a good candidate for plastic.',
  'Aluminum - food sticks to bottom and takes forever to clean.',
  'A brand from Dollar General melted a little in the microwave.',
  'None given.',
  'None that come to mind.',
  '',
  'Inconvenient to store leftovers in plastic then microwave in a ceramic bowl.',
];

const SKIM_Q7_ANSWERS = [
  'How do you determine if a kitchenware material is safe for use?',
  '',
  'If it is non-toxic.',
  '',
  'No, safety/health did not play a role.',
  '',
  '',
  'Goes by online reviews, demonstrations, and product descriptions.',
  '',
  '',
  'Plastic storage containers have harsh chemicals when warmed up.',
  '',
];

function buildSkimRows(): DatasetResponseRow[] {
  const responseIds = [1, 3, 7, 9, 12, 19, 20, 23, 24, 29, 31, 35];
  return responseIds.map((responseId, index) => ({
    responseId,
    values: {
      q7: SKIM_Q7_ANSWERS[index % SKIM_Q7_ANSWERS.length],
      q6: `Q6 response ${responseId}`,
      q5b: SKIM_Q5B_ANSWERS[index % SKIM_Q5B_ANSWERS.length],
      q5a: `Q5a response ${responseId}`,
      q4: `Q4 response ${responseId}`,
      q3: `Q3 response ${responseId}`,
      q2: `Q2 response ${responseId}`,
      q1: `Q1 response ${responseId}`,
      material: ['Nonstick', 'Stainless', 'Ceramic', 'Cast iron', 'Aluminum', 'Glass'][
        index % 6
      ],
      'interview-id': String(1000 + responseId),
      category: ['Cookware', 'Bakeware', 'Utensils', 'Appliances', 'Storage', 'Accessories'][
        index % 6
      ],
    },
  }));
}

function buildGenericVariables(dataset: Dataset): DatasetVariable[] {
  const count = Math.max(dataset.variableCount, 3);
  const variables: DatasetVariable[] = [];
  for (let i = 1; i <= count; i += 1) {
    if (i === count - 1) {
      variables.push({
        id: `category-${dataset.id}`,
        name: 'Category',
        kind: 'category',
        responses: Math.max(4, Math.round(dataset.rowCount / 200)),
      });
      continue;
    }
    if (i === count) {
      variables.push({
        id: `respondent-id-${dataset.id}`,
        name: 'Respondent ID',
        kind: 'numeric',
        responses: dataset.rowCount,
      });
      continue;
    }
    variables.push({
      id: `q${i}-${dataset.id}`,
      name: `Q${i}`,
      kind: 'question',
      responses: Math.max(8, Math.round(dataset.rowCount / (10 + i))),
    });
  }
  return variables;
}

function buildGenericRows(
  dataset: Dataset,
  variables: DatasetVariable[]
): DatasetResponseRow[] {
  const rowCount = Math.min(12, Math.max(6, Math.round(dataset.rowCount / 700)));
  return Array.from({ length: rowCount }, (_, index) => {
    const responseId = index * 2 + 1;
    const values: Record<string, string> = {};
    for (const variable of variables) {
      if (variable.kind === 'numeric') {
        values[variable.id] = String(1000 + responseId);
      } else if (variable.kind === 'category') {
        values[variable.id] = ['Segment A', 'Segment B', 'Segment C'][index % 3];
      } else {
        values[variable.id] = `${variable.name} response for row ${responseId}`;
      }
    }
    return { responseId, values };
  });
}

const DETAIL_BY_DATASET_ID: Record<number, DatasetDetailData> = {
  2: {
    datasetId: 2,
    variables: SKIM_VARIABLES,
    rows: buildSkimRows(),
    defaultSelectedVariableIds: ['q7', 'q5b'],
  },
};

export function getDatasetDetailData(datasetId: number): DatasetDetailData | null {
  const dataset = MOCK_DATASETS.find((item) => item.id === datasetId);
  if (!dataset) return null;

  const existing = DETAIL_BY_DATASET_ID[datasetId];
  if (existing) return existing;

  const variables = buildGenericVariables(dataset);
  return {
    datasetId,
    variables,
    rows: buildGenericRows(dataset, variables),
    defaultSelectedVariableIds: variables.slice(0, 2).map((variable) => variable.id),
  };
}
