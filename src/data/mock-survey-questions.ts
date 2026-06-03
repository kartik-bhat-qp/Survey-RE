export type SurveyQuestionType =
  | 'Single Select'
  | 'Multiple Select'
  | 'Matrix Uni choice'
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
