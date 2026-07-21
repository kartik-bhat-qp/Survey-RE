export interface SystemVariableOption {
  value: string;
  label: string;
}

export interface SystemVariableMappingRow {
  id: string;
  /** Empty string means the Variable dropdown still shows "Select". */
  variable: string;
  displayName: string;
  code: string;
}

export const SYSTEM_VARIABLE_MAPPING_HELP =
  'Map system variables to display names and codes used in survey links, quotas, and respondent data.';

export const SYSTEM_VARIABLE_SELECT_PLACEHOLDER = 'Select';

export const SYSTEM_VARIABLE_DISPLAY_NAME_MAX_LENGTH = 256;
export const SYSTEM_VARIABLE_CODE_MAX_LENGTH = 128;

/** Custom 1–255 options available for variable mapping. */
export const SYSTEM_VARIABLE_OPTIONS: SystemVariableOption[] = Array.from(
  { length: 255 },
  (_, index) => {
    const label = `Custom ${index + 1}`;
    return { value: label, label };
  }
);

let mappingIdCounter = 0;

function nextMappingId(): string {
  mappingIdCounter += 1;
  return `mapping-${mappingIdCounter}`;
}

export function createEmptySystemVariableMapping(): SystemVariableMappingRow {
  return {
    id: nextMappingId(),
    variable: '',
    displayName: '',
    code: '',
  };
}

/** Starts with a single unmapped row showing "Select". */
export function createDefaultSystemVariableMappings(): SystemVariableMappingRow[] {
  mappingIdCounter = 0;
  return [createEmptySystemVariableMapping()];
}

/** Options still available for a row (excludes variables used by other rows). */
export function getAvailableSystemVariableOptions(
  rows: SystemVariableMappingRow[],
  rowId: string
): SystemVariableOption[] {
  const usedByOthers = new Set(
    rows
      .filter((row) => row.id !== rowId && row.variable)
      .map((row) => row.variable)
  );
  return SYSTEM_VARIABLE_OPTIONS.filter((option) => !usedByOthers.has(option.value));
}

export const ADD_VARIABLE_MAPPING_HELP =
  'Import or copy system variable mappings in bulk. Use the template to format Custom variable, display name, and code columns.';

export const ADD_VARIABLE_MAPPING_TABS = [
  { id: 'import', label: 'Import Variable Mapping' },
  { id: 'copy-survey', label: 'Copy from Survey' },
  { id: 'copy-paste', label: 'Copy/Paste Mapping' },
] as const;

export type AddVariableMappingTabId = (typeof ADD_VARIABLE_MAPPING_TABS)[number]['id'];

export const IMPORT_VARIABLE_MAPPING_STEPS = [
  'Download the import template.',
  'Add your mapping in correct format.',
  'Upload your file.',
] as const;

/** Sample surveys for the Copy from Survey tab. */
export const VARIABLE_MAPPING_SOURCE_SURVEYS = [
  { id: 'srv-1001', label: 'Employee Engagement Pulse 2026' },
  { id: 'srv-1002', label: 'NPS Tracking — Retail Q2' },
  { id: 'srv-1003', label: 'Brand Awareness Benchmark' },
  { id: 'srv-1004', label: 'Participant ID Validation Study (copy)' },
  { id: 'srv-1005', label: 'Customer Onboarding Feedback' },
] as const;

export const VARIABLE_MAPPING_TEMPLATE_CSV = `Custom Variable,Display Name,Code
Custom 1,Name,name
Custom 2,Profile,profile
Custom 3,,
`;

export function downloadVariableMappingTemplate(): void {
  const blob = new Blob([VARIABLE_MAPPING_TEMPLATE_CSV], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'variable-mapping-template.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
