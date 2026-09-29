export const DATA_SLICER_LICENSE_LIMIT = 5;
/** Published BI limits; the five-slicer package/license demo is separate. */
export const DATA_SLICER_CREATION_LIMIT = 100;
export const DATA_SLICER_APPLIED_LIMIT = 10;
export type SlicerField = 'gender' | 'beverage' | 'region' | 'age' | 'income' | 'device' | 'nps' | 'wave' | 'status' | 'recentPurchase' | 'emailOptIn';

export const DATA_SLICER_LIMIT_TOOLTIP =
  'you can only create 5 data slicers with your current license';

export interface DataSlicer {
  id: number;
  name: string;
  applyToDashboard: boolean;
  /** Summary shown when details are expanded */
  description?: string;
  criteria?: Partial<Record<SlicerField, string>>;
}

export const MOCK_DATA_SLICERS: DataSlicer[] = [
  {
    id: 1,
    name: 'male who drink coke',
    applyToDashboard: false,
    description: 'Gender: Male · Beverage preference: Coca-Cola',
    criteria: { gender: 'Male', beverage: 'Coca-Cola' },
  },
  {
    id: 2,
    name: 'Northeast region respondents aged 25–34',
    applyToDashboard: true,
    description: 'Region: Northeast · Age: 25–34',
    criteria: { region: 'Northeast', age: '25–34' },
  },
  {
    id: 3,
    name: 'High income smartphone owners',
    applyToDashboard: false,
    description: 'Income: Top quartile · Device: Smartphone primary',
    criteria: { income: 'Top quartile', device: 'Smartphone primary' },
  },
  {
    id: 4,
    name: 'Brand promoters with completed NPS wave 2',
    applyToDashboard: true,
    description: 'NPS: 9–10 · Survey wave: 2 · Status: Complete',
    criteria: { nps: 'Promoter', wave: '2', status: 'completed' },
  },
  {
    id: 5,
    name: 'Female respondents who purchased in the last 90 days and opted into email follow-up for the seasonal campaign cohort',
    applyToDashboard: false,
    description: 'Gender: Female · Purchase window: 90 days · Channel: Email opt-in',
    criteria: { gender: 'Female', recentPurchase: 'Yes', emailOptIn: 'Yes' },
  },
];

/** Overall is not counted as a data slicer. */
export function appliedDataSlicers(slices: readonly DataSlicer[]): DataSlicer[] {
  return slices.filter(slice=>slice.applyToDashboard).slice(0,DATA_SLICER_APPLIED_LIMIT);
}
