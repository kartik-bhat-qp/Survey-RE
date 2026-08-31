export interface DashboardSavedFilter {
  id: string;
  name: string;
  summary: string;
  isDefault: boolean;
}

export interface DashboardFilterQuestion {
  id: string;
  label: string;
  values: string[];
}

export const DASHBOARD_FILTER_QUESTIONS: DashboardFilterQuestion[] = [
  { id: 'gender', label: 'Gender', values: ['Female', 'Male', 'Other'] },
  { id: 'country', label: 'Country', values: ['Canada', 'India', 'United Kingdom', 'United States'] },
  { id: 'age', label: 'Age', values: ['Under 18', '18–24', '25–34', '35–44', '45–54', '55+'] },
  { id: 'nps', label: 'NPS category', values: ['Detractor', 'Passive', 'Promoter'] },
];

export const INITIAL_DASHBOARD_SAVED_FILTERS: DashboardSavedFilter[] = [
  { id: 'gender', name: 'Gender', summary: 'Gender is Female or Male', isDefault: false },
  { id: 'country', name: 'Country', summary: 'Country is Canada, India, United Kingdom, or United States', isDefault: false },
  { id: 'fy-2025-2026', name: 'FY 2025–2026', summary: 'Response date is Apr 1, 2025–Mar 31, 2026', isDefault: true },
];
