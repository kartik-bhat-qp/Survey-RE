export interface ScaleLibraryEntry {
  id: string;
  name: string;
  options: string[];
}

export const SCALE_LIBRARY_SELECT_PLACEHOLDER = '- Select -';

export const MOCK_SCALE_LIBRARY: ScaleLibraryEntry[] = [
  {
    id: 'likert-5',
    name: '5-point agreement',
    options: [
      'Strongly disagree',
      'Disagree',
      'Neither agree nor disagree',
      'Agree',
      'Strongly agree',
    ],
  },
  {
    id: 'frequency',
    name: 'Frequency (5)',
    options: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
  },
  {
    id: 'satisfaction',
    name: 'Satisfaction',
    options: [
      'Very dissatisfied',
      'Dissatisfied',
      'Neutral',
      'Satisfied',
      'Very satisfied',
    ],
  },
  {
    id: 'yes-no',
    name: 'Yes / No',
    options: ['Yes', 'No'],
  },
];

export type ScaleLibrarySelectItem = { value: string; label: string };

export const SCALE_LIBRARY_SELECT_OPTIONS: ScaleLibrarySelectItem[] = [
  { value: '', label: SCALE_LIBRARY_SELECT_PLACEHOLDER },
  ...MOCK_SCALE_LIBRARY.map((entry) => ({ value: entry.id, label: entry.name })),
];
