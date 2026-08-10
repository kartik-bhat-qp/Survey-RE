import { PUBLIC_IMAGES } from '@/lib/public-images';

export type CreateDatasetWizardStep = 'type' | 'datasource' | 'subtype';

export type DatasetSubTypeId = 'import' | 'composite';

export interface DatasetSubTypeOption {
  id: DatasetSubTypeId;
  title: string;
  description: string;
  iconSrc: string;
}

export interface CreateDatasetWizardStepItem {
  id: CreateDatasetWizardStep;
  label: string;
  icon: string;
}

export const CREATE_DATASET_WIZARD_STEPS: CreateDatasetWizardStepItem[] = [
  { id: 'type', label: 'Type', icon: 'wm-dashboard' },
  { id: 'datasource', label: 'Datasource', icon: 'wm-verified-user' },
  { id: 'subtype', label: 'Datasource sub type', icon: 'wm-view-list' },
];

export function getCreateDatasetWizardSteps(): CreateDatasetWizardStepItem[] {
  return CREATE_DATASET_WIZARD_STEPS;
}

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
];

export interface CreateDatasetPayload {
  name: string;
  subType: DatasetSubTypeId;
  surveyName: string;
}
