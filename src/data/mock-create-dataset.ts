import { PUBLIC_IMAGES } from '@/lib/public-images';

export type CreateDatasetWizardStep =
  | 'type'
  | 'datasource'
  | 'subtype'
  | 'upload';

export type DatasetSubTypeId = 'import' | 'composite' | 'textai';

export interface DatasetSubTypeOption {
  id: DatasetSubTypeId;
  title: string;
  description: string;
  iconSrc: string;
}

export const CREATE_DATASET_WIZARD_STEPS: {
  id: CreateDatasetWizardStep;
  label: string;
  icon: string;
}[] = [
  { id: 'type', label: 'Type', icon: 'wm-dashboard' },
  { id: 'datasource', label: 'Datasource', icon: 'wm-verified-user' },
  { id: 'subtype', label: 'Datasource sub type', icon: 'wm-view-list' },
  { id: 'upload', label: 'File upload', icon: 'wm-description' },
];

export const DATASET_SUBTYPE_OPTIONS: DatasetSubTypeOption[] = [
  {
    id: 'import',
    title: 'Import',
    description: 'Map external datasets to the data already collected.',
    iconSrc: PUBLIC_IMAGES.createDataset.import,
  },
  {
    id: 'composite',
    title: 'Composite',
    description:
      'Create additional variables by applying predefined rules or calculations.',
    iconSrc: PUBLIC_IMAGES.createDataset.composite,
  },
  {
    id: 'textai',
    title: 'TextAI',
    description: 'Import the themes and sub themes for this dataset.',
    iconSrc: PUBLIC_IMAGES.createDataset.textAi,
  },
];
