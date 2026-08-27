export type SurveyQuestionType =
  | 'Single Select'
  | 'Multiple Select'
  | 'Matrix Uni choice'
  | 'Flex Matrix'
  | 'Text'
  | 'NPS'
  | 'Rank order';

export interface SurveyQuestion {
  id: number;
  surveyId: number;
  code: string;
  text: string;
  type: SurveyQuestionType;
  /** Matrix logical rows shown when the expand control is toggled. */
  matrixRows?: string[];
  /** Parent question id when this row is an expanded matrix sub-row. */
  parentQuestionId?: number;
  /** Answer options used for quota and weighting dimension flows. */
  options?: string[];
}

const DEMO_QUESTIONS: Omit<SurveyQuestion, 'id' | 'surveyId'>[] = [
  {
    code: 'Q1',
    text: 'What is your gender?',
    type: 'Single Select',
    options: ['Male', 'Female', 'Other', 'NA'],
  },
  {
    code: 'Q2',
    text: 'What is your age?',
    type: 'Single Select',
    options: ['Under 18', '18-24', '25-34', '35-44', '45-54', '55-64', 'Above 64'],
  },
  {
    code: 'Q2b',
    text: 'Which car do you drive?',
    type: 'Single Select',
    options: ['Sedan', 'SUV', 'Hatchback', 'Truck', 'Other'],
  },
  {
    code: 'Q2c',
    text: 'Which brand of car do you primarily use?',
    type: 'Single Select',
    options: ['Maruti Suzuki', 'Hyundai', 'Tata', 'Mahindra', 'Honda', 'Toyota'],
  },
  {
    code: 'Q2a',
    text: 'Which district of West Bengal do you reside in?',
    type: 'Single Select',
    options: ['Kolkata', 'Howrah', 'North 24 Parganas', 'South 24 Parganas', 'Darjeeling'],
  },
  {
    code: 'Q7',
    text: 'Who did you vote for in the previous elections?',
    type: 'Matrix Uni choice',
    matrixRows: ['Computer Science', 'Mathematics'],
    options: ['Party A', 'Party B', 'Party C', 'Did not vote'],
  },
  {
    code: 'Q3',
    text: 'Which sports do you follow regularly?',
    type: 'Multiple Select',
    options: ['Cricket', 'Football', 'Tennis', 'Basketball', 'Hockey'],
  },
  {
    code: 'Q4',
    text: 'How likely are you to recommend this service to a friend or colleague?',
    type: 'NPS',
    options: ['0-6 (Detractors)', '7-8 (Passives)', '9-10 (Promoters)'],
  },
  {
    code: 'Q5',
    text: 'Please rank the following factors in order of importance.',
    type: 'Rank order',
    options: ['Price', 'Quality', 'Brand', 'Support'],
  },
  {
    code: 'Q6',
    text: 'What is your overall satisfaction with the product?',
    type: 'Single Select',
    options: [
      'Very dissatisfied',
      'Dissatisfied',
      'Neutral',
      'Satisfied',
      'Very satisfied',
    ],
  },
  {
    code: 'Q8',
    text: 'Any additional comments or feedback?',
    type: 'Text',
  },
  {
    code: 'Q9',
    text: 'How often do you use online streaming services?',
    type: 'Single Select',
    options: ['Daily', 'Weekly', 'Monthly', 'Rarely', 'Never'],
  },
  {
    code: 'Q10',
    text: 'Select all media channels you use weekly.',
    type: 'Multiple Select',
    options: ['TV', 'Radio', 'Print', 'Online', 'Social Media'],
  },
  {
    code: 'Q11',
    text: 'Rate each brand on quality and value.',
    type: 'Matrix Uni choice',
    matrixRows: ['Brand A', 'Brand B', 'Brand C'],
    options: ['Poor', 'Average', 'Good', 'Excellent'],
  },
  {
    code: 'Q14',
    text: 'Please select the state you live in.',
    type: 'Single Select',
    options: ['Maharashtra', 'Karnataka', 'Delhi', 'Tamil Nadu', 'West Bengal'],
  },
  {
    code: 'Q13',
    text: 'How would you rate the following product attributes?',
    type: 'Flex Matrix',
    matrixRows: ['Product Packaging', 'On-Time Arrival', 'Price'],
    options: ['Column 1', 'Column 2'],
  },
];

function buildQuestionsForSurvey(surveyId: number): SurveyQuestion[] {
  return DEMO_QUESTIONS.map((question, index) => ({
    ...question,
    id: surveyId * 100 + index + 1,
    surveyId,
  }));
}

const questionsBySurvey = new Map<number, SurveyQuestion[]>();

export function getQuestionsBySurvey(surveyId: number): SurveyQuestion[] {
  if (!questionsBySurvey.has(surveyId)) {
    questionsBySurvey.set(surveyId, buildQuestionsForSurvey(surveyId));
  }
  return questionsBySurvey.get(surveyId) ?? [];
}

function subRowId(parentId: number, rowIndex: number): number {
  return parentId * 1000 + rowIndex + 1;
}

export function questionHasExpandableRows(question: SurveyQuestion): boolean {
  return Boolean(question.matrixRows && question.matrixRows.length > 0);
}

/** Flatten questions with expanded matrix sub-rows for the picker table. */
export function flattenQuestionsForPicker(
  questions: SurveyQuestion[],
  expandedParentIds: ReadonlySet<number>
): SurveyQuestion[] {
  const rows: SurveyQuestion[] = [];

  for (const question of questions) {
    if (question.parentQuestionId !== undefined) continue;

    rows.push(question);

    if (!expandedParentIds.has(question.id)) continue;

    const subLabels = question.matrixRows ?? [];
    subLabels.forEach((label, index) => {
      rows.push({
        id: subRowId(question.id, index),
        surveyId: question.surveyId,
        code: question.code,
        text: label,
        type: question.type,
        parentQuestionId: question.id,
      });
    });
  }

  return rows;
}

/** Resolve selection to the parent question plus optional matrix row label. */
export function resolvePickerSelection(question: SurveyQuestion): {
  question: SurveyQuestion;
  rowLabel?: string;
} {
  if (question.parentQuestionId === undefined) {
    return { question };
  }

  const parent = getQuestionsBySurvey(question.surveyId).find(
    (q) => q.id === question.parentQuestionId
  );
  if (!parent) {
    return { question };
  }

  return {
    question: parent,
    rowLabel: question.text,
  };
}

const SKIP_EDITOR_KINDS = new Set([
  'presentation',
  'section-heading',
  'section-subheading',
]);

const TEXT_EDITOR_TYPE_IDS = new Set([
  'comment-box',
  'single-row',
  'email',
  'contact',
]);

const CLOSED_ENDED_FLEX_COLUMN_TYPES = new Set([
  'radio',
  'checkbox',
  'dropdown',
  'rating-scale',
  'rank-order',
]);

/** Minimal editor-question shape used when mapping workspace questions into criteria. */
export interface EditorQuestionForCriteria {
  id: string;
  code: string;
  text: string;
  kind?: string;
  addQuestionTypeId?: string;
  inputKind?: string;
  options: { label: string }[];
  matrix?: {
    rows: { label: string }[];
    columns: { label: string; cellType?: string; options?: string[] }[];
  };
}

function toPlainLabel(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function stableNumericId(id: string, fallback: number): number {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const numeric = hash >>> 0;
  return numeric === 0 ? fallback : numeric;
}

function criteriaTypeFromEditor(question: EditorQuestionForCriteria): SurveyQuestionType {
  const typeId = question.addQuestionTypeId;
  if (question.kind === 'flex-matrix' || typeId === 'flex-matrix') return 'Flex Matrix';
  if (
    question.kind === 'multi-point-scales' ||
    question.kind === 'matrix-multi-select' ||
    question.kind === 'matrix-spreadsheet' ||
    question.kind === 'image-chooser-rating'
  ) {
    return 'Matrix Uni choice';
  }
  if (question.kind === 'nps' || typeId === 'nps') return 'NPS';
  if (question.kind === 'rank-order' || typeId === 'rank-order') return 'Rank order';
  if (
    question.kind === 'multi-select' ||
    question.inputKind === 'checkbox' ||
    typeId === 'select-many' ||
    typeId === 'image-select-many'
  ) {
    return 'Multiple Select';
  }
  if (TEXT_EDITOR_TYPE_IDS.has(typeId ?? '')) return 'Text';
  return 'Single Select';
}

function criteriaOptionsFromEditor(
  question: EditorQuestionForCriteria,
  type: SurveyQuestionType
): string[] | undefined {
  if (type === 'Flex Matrix') {
    const columns = question.matrix?.columns ?? [];
    const closedEnded = columns.filter((column) =>
      CLOSED_ENDED_FLEX_COLUMN_TYPES.has(column.cellType ?? 'text')
    );
    const labels = closedEnded
      .map((column) => toPlainLabel(column.label))
      .filter(Boolean);
    if (labels.length > 0) return labels;
    const rowLabels = (question.matrix?.rows ?? [])
      .map((row) => toPlainLabel(row.label))
      .filter(Boolean);
    return rowLabels.length > 0 ? rowLabels : undefined;
  }

  if (type === 'Matrix Uni choice') {
    const columnLabels = (question.matrix?.columns ?? [])
      .map((column) => toPlainLabel(column.label))
      .filter(Boolean);
    if (columnLabels.length > 0) return columnLabels;
  }

  if (type === 'NPS') {
    return ['0-6 (Detractors)', '7-8 (Passives)', '9-10 (Promoters)'];
  }

  const optionLabels = question.options.map((option) => toPlainLabel(option.label)).filter(Boolean);
  return optionLabels.length > 0 ? optionLabels : undefined;
}

function isCriteriaEligibleEditorQuestion(question: EditorQuestionForCriteria): boolean {
  return !SKIP_EDITOR_KINDS.has(question.kind ?? '');
}

export function isEditorQuestionForCriteria(
  question: EditorQuestionForCriteria
): boolean {
  return isCriteriaEligibleEditorQuestion(question);
}

/**
 * Map workspace editor questions into the criteria-engine question catalog
 * so types like Flex Matrix appear when creating criteria.
 */
export function toCriteriaQuestionsFromEditor(
  surveyId: number,
  questions: EditorQuestionForCriteria[]
): SurveyQuestion[] {
  return questions.filter(isCriteriaEligibleEditorQuestion).map((question, index) => {
    const type = criteriaTypeFromEditor(question);
    const matrixRows = (question.matrix?.rows ?? [])
      .map((row) => toPlainLabel(row.label))
      .filter(Boolean);
    return {
      id: stableNumericId(question.id, index + 1),
      surveyId,
      code: question.code,
      text: toPlainLabel(question.text) || question.code,
      type,
      ...(matrixRows.length > 0 ? { matrixRows } : {}),
      options: criteriaOptionsFromEditor(question, type),
    };
  });
}
